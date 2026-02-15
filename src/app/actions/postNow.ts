"use server";

import { auth } from "@clerk/nextjs/server";
import { getAyrshareProfileKeyForUser } from "@/app/actions/getAyrshareToken";
import type { PostNowResult } from "@/lib/types";

const AYRSHARE_API_URL = "https://api.ayrshare.com/api/post";

const PLATFORM_MAP: Record<string, string> = {
  Twitter: "twitter",
  LinkedIn: "linkedin",
  Instagram: "instagram",
  Facebook: "facebook",
  facebook: "facebook",
};

export async function postNow({
  content,
  image,
  platforms,
}: {
  content: string;
  image?: string | null;
  platforms: string[];
}): Promise<PostNowResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const apiKey = process.env.AYRSHARE_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "Ayrshare API key is not configured. Add AYRSHARE_API_KEY to .env.local.",
    };
  }

  const profileKey = await getAyrshareProfileKeyForUser(userId);

  const ayrsharePlatforms = platforms.map(
    (p) => PLATFORM_MAP[p] ?? p.toLowerCase()
  );

  const body: Record<string, unknown> = {
    post: content,
    platforms: ayrsharePlatforms,
  };

  if (image?.trim() && image.startsWith("https://")) {
    body.mediaUrls = [image.trim()];
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    if (profileKey) {
      headers["Profile-Key"] = profileKey;
    }

    const res = await fetch(AYRSHARE_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
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
