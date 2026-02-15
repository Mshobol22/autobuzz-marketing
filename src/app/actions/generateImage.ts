"use server";

import { fal } from "@fal-ai/client";
import { uploadImage } from "@/lib/uploadImage";
import type { GenerateImageResult } from "@/lib/types";

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";
const FETCH_TIMEOUT_MS = 90_000; // Pollinations can be slow (30–60s for FLUX)
const POLLINATIONS_RETRY_ATTEMPTS = 3;
const POLLINATIONS_RETRY_DELAY_MS = 5_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch image from Pollinations (free, no API key).
 * Tries simplest URL first (fewer params = fewer 5xx per Pollinations issues).
 * Retries on 5xx errors (530, 502) which are often transient.
 */
async function fetchFromPollinations(prompt: string): Promise<string> {
  const encodedPrompt = encodeURIComponent(prompt.trim());
  const seed = Math.floor(Math.random() * 1_000_000);

  // Try simpler URL first (complex params can trigger 502/530 per Pollinations GitHub issues)
  const urlsToTry = [
    `${POLLINATIONS_BASE}/${encodedPrompt}`, // Minimal - prompt only
    `${POLLINATIONS_BASE}/${encodedPrompt}?width=1024&height=1024&seed=${seed}&model=flux`,
  ];

  let lastError: Error | null = null;

  for (const url of urlsToTry) {
    for (let attempt = 1; attempt <= POLLINATIONS_RETRY_ATTEMPTS; attempt++) {
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
          if (res.status >= 500 && attempt < POLLINATIONS_RETRY_ATTEMPTS) {
            await sleep(POLLINATIONS_RETRY_DELAY_MS);
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
        if (attempt < POLLINATIONS_RETRY_ATTEMPTS) {
          await sleep(POLLINATIONS_RETRY_DELAY_MS);
          continue;
        }
      }
      break; // Try next URL variant
    }
  }

  const msg = lastError?.message ?? "Image generation failed";
  throw new Error(
    msg.includes("530") || msg.includes("502")
      ? `${msg} Pollinations may be temporarily overloaded. Try again in a minute, or add FAL_KEY for a more reliable fallback.`
      : msg
  );
}

/** Generate via fal.ai FLUX schnell (fast, free credits on signup). */
async function fetchFromFal(prompt: string): Promise<string> {
  const result = await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt: prompt.trim(),
      image_size: "square_hd",
      num_inference_steps: 4,
    },
  });

  const imageUrl = result.data?.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error("fal.ai did not return an image URL");
  }
  return imageUrl;
}

export async function generateImage(prompt: string): Promise<GenerateImageResult> {
  if (!prompt?.trim()) {
    return { success: false, error: "Prompt is required" };
  }

  const falKey = process.env.FAL_KEY;

  let tempUrl: string;

  if (falKey) {
    try {
      fal.config({ credentials: falKey });
      tempUrl = await fetchFromFal(prompt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "fal.ai failed";
      console.warn("[generateImage] fal.ai failed:", msg);
      try {
        tempUrl = await fetchFromPollinations(prompt);
      } catch (pollErr) {
        const message =
          pollErr instanceof Error ? pollErr.message : "Image generation failed";
        return { success: false, error: message };
      }
    }
  } else {
    try {
      tempUrl = await fetchFromPollinations(prompt);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Image generation failed";
      return { success: false, error: message };
    }
  }

  const permanentUrl = await uploadImage(tempUrl);
  if (!permanentUrl) {
    return {
      success: false,
      error: "Image generated but failed to save to storage. Check Supabase Storage (create 'post-images' bucket if needed).",
    };
  }
  return { success: true, imageUrl: permanentUrl };
}
