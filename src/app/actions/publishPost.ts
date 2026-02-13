"use server";

const AYRSHARE_API_URL = "https://api.ayrshare.com/api/post";

const PLATFORM_MAP: Record<string, string> = {
  Twitter: "twitter",
  LinkedIn: "linkedin",
  Instagram: "instagram",
  Facebook: "facebook",
};

export type PublishPostResult =
  | { success: true; id: string; postIds?: Array<{ platform: string; postUrl?: string }> }
  | { success: false; error: string };

export async function publishPost(
  content: string,
  platform: string
): Promise<PublishPostResult> {
  const apiKey = process.env.AYRSHARE_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "Ayrshare API key is not configured. Add AYRSHARE_API_KEY to .env.local.",
    };
  }

  const ayrsharePlatform = PLATFORM_MAP[platform] ?? platform.toLowerCase();

  try {
    const res = await fetch(AYRSHARE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        post: content,
        platforms: [ayrsharePlatform],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const message =
        data?.message ?? data?.error ?? `Request failed (${res.status})`;
      return { success: false, error: message };
    }

    if (data?.status === "success") {
      return {
        success: true,
        id: data.id ?? "",
        postIds: data.postIds ?? [],
      };
    }

    const errors = data?.errors ?? [];
    const errorMsg =
      Array.isArray(errors) && errors.length > 0
        ? errors.map((e: { message?: string }) => e.message ?? e).join(", ")
        : "Post failed";

    return { success: false, error: errorMsg };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to publish post";
    return { success: false, error: message };
  }
}
