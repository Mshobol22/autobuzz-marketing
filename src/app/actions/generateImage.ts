"use server";

import { fal } from "@fal-ai/client";
import type { GenerateImageResult } from "@/lib/types";

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";
const FETCH_TIMEOUT_MS = 90_000; // Pollinations can be slow (30–60s for FLUX)

/** Fetch image from Pollinations (free, no API key). Uses turbo model for speed. */
async function fetchFromPollinations(prompt: string): Promise<string> {
  const encodedPrompt = encodeURIComponent(prompt.trim());
  const seed = Math.floor(Math.random() * 1_000_000);
  const url = `${POLLINATIONS_BASE}/${encodedPrompt}?width=1080&height=1080&seed=${seed}&model=turbo&nologo=true`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "image/*" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Pollinations returned ${res.status}: ${res.statusText}`);
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      const text = await res.text();
      throw new Error(`Pollinations did not return an image: ${text.slice(0, 200)}`);
    }
    return url;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new Error("Image generation timed out (90s). Pollinations may be overloaded.");
      }
      throw err;
    }
    throw new Error("Pollinations request failed");
  }
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

  // Try fal.ai first if key is set (fast, ~2–5s)
  if (falKey) {
    try {
      fal.config({ credentials: falKey });
      const url = await fetchFromFal(prompt);
      return { success: true, imageUrl: url };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "fal.ai failed";
      console.warn("[generateImage] fal.ai failed:", msg);
      // Fall through to Pollinations
    }
  }

  // Fallback: Pollinations (free, no key, slower)
  try {
    const url = await fetchFromPollinations(prompt);
    return { success: true, imageUrl: url };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Image generation failed";
    return { success: false, error: message };
  }
}
