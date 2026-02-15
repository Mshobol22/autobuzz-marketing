/**
 * Upload an image from a temporary URL (e.g. fal.ai, Pollinations, Replicate) to Supabase Storage.
 * Returns a permanent public URL that won't expire.
 * Use `headers` for URLs that require auth (e.g. Replicate: { Authorization: "Bearer TOKEN" }).
 */
import { createClient } from "@supabase/supabase-js";

const BUCKET = "post-images";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function uploadImage(
  imageUrl: string,
  options?: { headers?: Record<string, string> }
): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const res = await fetch(imageUrl, {
      headers: { Accept: "image/*", ...options?.headers },
    });

    if (!res.ok) {
      console.warn("[uploadImage] Fetch failed:", res.status, res.statusText);
      return null;
    }

    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = await res.arrayBuffer();
    const ext = contentType.includes("jpeg") || contentType.includes("jpg")
      ? "jpg"
      : contentType.includes("webp")
        ? "webp"
        : "png";

    const filename = `post-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

    const { error: bucketErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
    });
    if (bucketErr && !bucketErr.message?.toLowerCase().includes("already exists")) {
      console.warn("[uploadImage] createBucket:", bucketErr.message);
    }

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: contentType.split(";")[0].trim(),
        upsert: false,
      });

    if (error) {
      console.warn("[uploadImage] Upload failed:", error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    console.warn("[uploadImage] Error:", err);
    return null;
  }
}
