"use server";

import type { GenerateImageResult } from "@/lib/types";

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

export async function generateImage(prompt: string): Promise<GenerateImageResult> {
  if (!prompt?.trim()) {
    return { success: false, error: "Prompt is required" };
  }

  const encodedPrompt = encodeURIComponent(prompt.trim());
  const seed = Math.floor(Math.random() * 1_000_000);
  const url = `${POLLINATIONS_BASE}/${encodedPrompt}?width=1080&height=1080&seed=${seed}&model=flux&nologo=true`;

  return { success: true, imageUrl: url };
}
