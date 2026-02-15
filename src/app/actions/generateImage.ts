"use server";

import { createFalClient } from "@fal-ai/client";
import { uploadImage } from "@/lib/uploadImage";
import type { GenerateImageResult } from "@/lib/types";

const FAL_QUEUE_URL = "https://queue.fal.run/fal-ai/flux/schnell";

const POLLINATIONS_IMAGE = "https://image.pollinations.ai/prompt";
const POLLINATIONS_GEN = "https://gen.pollinations.ai/image";
const FETCH_TIMEOUT_MS = 90_000; // Pollinations can be slow (30–60s for FLUX)
const POLLINATIONS_RETRY_ATTEMPTS = 5; // More retries for transient 530/502
const POLLINATIONS_BASE_DELAY_MS = 2_000; // Exponential backoff base

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Exponential backoff delay for attempt N (0-indexed). */
function backoffMs(attempt: number): number {
  return POLLINATIONS_BASE_DELAY_MS * Math.pow(2, attempt);
}

/**
 * Fetch image from Pollinations (free, no API key).
 * Tries multiple endpoints (image.pollinations.ai, gen.pollinations.ai) with
 * 5 retries and exponential backoff on 5xx (530, 502).
 */
async function fetchFromPollinations(prompt: string): Promise<string> {
  const encodedPrompt = encodeURIComponent(prompt.trim());
  const seed = Math.floor(Math.random() * 1_000_000);

  const urlsToTry = [
    `${POLLINATIONS_IMAGE}/${encodedPrompt}`,
    `${POLLINATIONS_IMAGE}/${encodedPrompt}?width=1024&height=1024&seed=${seed}&model=flux`,
    `${POLLINATIONS_GEN}/${encodedPrompt}?model=flux`,
    `${POLLINATIONS_GEN}/${encodedPrompt}?model=flux&width=1024&height=1024&seed=${seed}`,
  ];

  let lastError: Error | null = null;

  for (const url of urlsToTry) {
    for (let attempt = 0; attempt < POLLINATIONS_RETRY_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        const delay = backoffMs(attempt - 1);
        await sleep(delay);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "image/*" },
        });
        clearTimeout(timeout);

        if (res.ok) {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.startsWith("image/")) {
            return url;
          }
          const text = await res.text();
          lastError = new Error(`Pollinations did not return an image: ${text.slice(0, 150)}`);
        } else {
          const statusText = res.statusText || "Unknown";
          lastError = new Error(`Pollinations returned ${res.status}: ${statusText}`);
          if (res.status >= 500 && attempt < POLLINATIONS_RETRY_ATTEMPTS - 1) {
            continue;
          }
        }
      } catch (err) {
        clearTimeout(timeout);
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            lastError = new Error("Image generation timed out (90s). Pollinations may be overloaded.");
          } else {
            lastError = err;
          }
        } else {
          lastError = new Error("Pollinations request failed");
        }
        if (attempt < POLLINATIONS_RETRY_ATTEMPTS - 1) {
          continue;
        }
      }
      break;
    }
  }

  const msg = lastError?.message ?? "Image generation failed";
  throw new Error(
    msg.includes("530") || msg.includes("502")
      ? `${msg} Pollinations may be temporarily overloaded. Try again in a minute, or add FAL_KEY/REPLICATE_API_TOKEN for more fallbacks.`
      : msg
  );
}

const FAL_INPUT = {
  prompt: "",
  image_size: "square_hd" as const,
  num_inference_steps: 4,
};

/** Direct REST call to fal queue API (bypasses @fal-ai/client). */
async function fetchFromFalDirect(credentials: string, prompt: string): Promise<string> {
  const input = { ...FAL_INPUT, prompt: prompt.trim() };
  const res = await fetch(FAL_QUEUE_URL, {
    method: "POST",
    headers: {
      Authorization: `Key ${credentials}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai REST: ${res.status} ${res.statusText}${text ? ` - ${text.slice(0, 200)}` : ""}`);
  }

  const json = (await res.json()) as {
    request_id?: string;
    status?: string;
    response_url?: string;
  };
  const requestId = json.request_id;
  if (!requestId) {
    throw new Error("fal.ai did not return request_id");
  }

  if (json.status === "COMPLETED" && json.response_url) {
    const resultRes = await fetch(json.response_url, {
      headers: { Authorization: `Key ${credentials}` },
    });
    if (!resultRes.ok) throw new Error(`fal.ai result: ${resultRes.status}`);
    const resultJson = (await resultRes.json()) as { images?: Array<{ url?: string }> };
    const imageUrl = resultJson.images?.[0]?.url;
    if (!imageUrl) throw new Error("fal.ai did not return an image URL");
    return imageUrl;
  }

  const statusUrl = `https://queue.fal.run/fal-ai/flux/schnell/requests/${requestId}/status`;
  const resultUrl = `https://queue.fal.run/fal-ai/flux/schnell/requests/${requestId}`;
  const maxAttempts = 60;
  const pollIntervalMs = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(pollIntervalMs);
    const statusRes = await fetch(statusUrl, {
      headers: { Authorization: `Key ${credentials}` },
    });
    if (!statusRes.ok) throw new Error(`fal.ai status: ${statusRes.status}`);
    const statusJson = (await statusRes.json()) as { status?: string };
    if (statusJson.status === "COMPLETED") {
      const resultRes = await fetch(resultUrl, {
        headers: { Authorization: `Key ${credentials}` },
      });
      if (!resultRes.ok) throw new Error(`fal.ai result: ${resultRes.status}`);
      const resultJson = (await resultRes.json()) as { images?: Array<{ url?: string }> };
      const imageUrl = resultJson.images?.[0]?.url;
      if (!imageUrl) throw new Error("fal.ai did not return an image URL");
      return imageUrl;
    }
    if (statusJson.status === "CANCELLED" || statusJson.status === "FAILED") {
      throw new Error(`fal.ai request ${statusJson.status}`);
    }
  }
  throw new Error("fal.ai request timed out");
}

const REPLICATE_FLUX_URL = "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions";

/** Generate via Replicate FLUX schnell (requires REPLICATE_API_TOKEN). */
async function fetchFromReplicate(token: string, prompt: string): Promise<string> {
  const res = await fetch(REPLICATE_FLUX_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait=60",
    },
    body: JSON.stringify({ input: { prompt: prompt.trim() } }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Replicate: ${res.status} ${res.statusText}${text ? ` - ${text.slice(0, 200)}` : ""}`);
  }

  const json = (await res.json()) as {
    status?: string;
    output?: string | string[] | Array<{ url?: string }>;
    error?: string;
  };

  if (json.error) throw new Error(`Replicate: ${json.error}`);
  if (json.status !== "succeeded") throw new Error(`Replicate: status ${json.status}`);

  let imageUrl: string | undefined;
  const out = json.output;
  if (typeof out === "string") {
    imageUrl = out;
  } else if (Array.isArray(out)) {
    const first = out[0];
    imageUrl = typeof first === "string" ? first : first?.url;
  }
  if (!imageUrl) throw new Error("Replicate did not return an image URL");
  return imageUrl;
}

/** Generate via fal.ai FLUX schnell (client or direct REST). */
async function fetchFromFal(credentials: string, prompt: string): Promise<string> {
  try {
    const client = createFalClient({ credentials });
    const result = await client.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: prompt.trim(),
        image_size: "square_hd",
        num_inference_steps: 4,
      },
    });
    const imageUrl = result.data?.images?.[0]?.url;
    if (!imageUrl) throw new Error("fal.ai did not return an image URL");
    return imageUrl;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Forbidden") || msg.includes("403")) {
      console.warn("[generateImage] fal client Forbidden, trying direct REST:", msg.slice(0, 80));
      return fetchFromFalDirect(credentials, prompt);
    }
    throw err;
  }
}

type ProviderResult = { url: string; uploadHeaders?: Record<string, string> };

/** Try providers in order until one succeeds. */
async function tryProviders(
  prompt: string,
  providers: Array<{ name: string; fn: () => Promise<ProviderResult> }>
): Promise<ProviderResult> {
  const errors: string[] = [];
  for (const { name, fn } of providers) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${name}: ${msg}`);
      console.warn(`[generateImage] ${name} failed:`, msg.slice(0, 100));
    }
  }
  throw new Error(errors.join(". "));
}

export async function generateImage(prompt: string): Promise<GenerateImageResult> {
  if (!prompt?.trim()) {
    return { success: false, error: "Prompt is required" };
  }

  const falKey = process.env.FAL_KEY?.trim();
  const replicateToken = process.env.REPLICATE_API_TOKEN?.trim();

  const providers: Array<{ name: string; fn: () => Promise<ProviderResult> }> = [];

  if (falKey) {
    providers.push({ name: "fal.ai", fn: () => fetchFromFal(falKey, prompt).then((url) => ({ url })) });
  }
  if (replicateToken) {
    providers.push({
      name: "Replicate",
      fn: () =>
        fetchFromReplicate(replicateToken, prompt).then((url) => ({
          url,
          uploadHeaders: { Authorization: `Bearer ${replicateToken}` },
        })),
    });
  }
  providers.push({
    name: "Pollinations",
    fn: () => fetchFromPollinations(prompt).then((url) => ({ url })),
  });

  let result: ProviderResult;
  try {
    result = await tryProviders(prompt, providers);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const scopeHint = msg.toLowerCase().includes("forbidden")
      ? " If fal.ai returns Forbidden, ensure your key has API scope at fal.ai/dashboard/keys."
      : "";
    return {
      success: false,
      error: `Image generation failed. ${msg}${scopeHint}`,
    };
  }

  const permanentUrl = await uploadImage(result.url, {
    headers: result.uploadHeaders,
  });
  if (!permanentUrl) {
    return {
      success: false,
      error: "Image generated but failed to save to storage. Check Supabase Storage (create 'post-images' bucket if needed).",
    };
  }
  return { success: true, imageUrl: permanentUrl };
}
