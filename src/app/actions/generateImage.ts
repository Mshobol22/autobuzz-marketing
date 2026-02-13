"use server";

import { createClient } from "@supabase/supabase-js";
import Replicate from "replicate";

const MODEL = "black-forest-labs/flux-schnell";
const BUCKET = "post-media";

export type GenerateImageResult =
  | { success: true; imageUrl: string }
  | { success: false; error: string };

export async function generateImage(prompt: string): Promise<GenerateImageResult> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiToken) {
    return {
      success: false,
      error: "Replicate API token is not configured. Add REPLICATE_API_TOKEN to .env.local.",
    };
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      success: false,
      error: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  if (!prompt?.trim()) {
    return { success: false, error: "Prompt is required" };
  }

  try {
    const replicate = new Replicate({ auth: apiToken });

    const output = await replicate.run(MODEL, {
      input: {
        prompt: prompt.trim(),
      },
    });

    // flux-schnell returns image URL as string or in array
    const replicateUrl = Array.isArray(output) ? output[0] : output;

    if (!replicateUrl || typeof replicateUrl !== "string") {
      return {
        success: false,
        error: "No image URL returned from Replicate",
      };
    }

    // Fetch image from Replicate
    const imageRes = await fetch(replicateUrl);
    if (!imageRes.ok) {
      return {
        success: false,
        error: "Failed to fetch generated image from Replicate",
      };
    }

    const imageBlob = await imageRes.blob();
    const contentType = imageRes.headers.get("content-type") ?? "image/png";
    const ext = contentType.includes("png") ? "png" : "jpg";
    const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, imageBlob, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        error: `Failed to upload to storage: ${uploadError.message}`,
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path);

    return { success: true, imageUrl: publicUrl };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate image";
    return { success: false, error: message };
  }
}
