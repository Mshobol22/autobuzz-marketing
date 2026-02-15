"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const AYRSHARE_PROFILES_URL = "https://api.ayrshare.com/api/profiles";
const AYRSHARE_GENERATE_JWT_URL = "https://api.ayrshare.com/api/profiles/generateJWT";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export type GetAyrshareTokenResult =
  | { success: true; url: string; token?: string }
  | { success: false; error: string };

/** True when AYRSHARE_DOMAIN is missing (Free Plan = Single Player Mode). */
export async function isSinglePlayerMode(): Promise<boolean> {
  return !process.env.AYRSHARE_DOMAIN?.trim();
}

/**
 * Fetches a JWT URL for the Ayrshare Social Linking page.
 * Creates an Ayrshare User Profile for the user if they don't have one.
 */
export async function getAyrshareToken(): Promise<GetAyrshareTokenResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const apiKey = process.env.AYRSHARE_API_KEY;
  const domain = process.env.AYRSHARE_DOMAIN;
  const privateKey = process.env.AYRSHARE_PRIVATE_KEY;

  if (!apiKey) {
    return { success: false, error: "Ayrshare API key is not configured." };
  }
  if (!domain || !privateKey) {
    return {
      success: false,
      error:
        "Ayrshare Business Plan (domain + private key) is required for integrations. Add AYRSHARE_DOMAIN and AYRSHARE_PRIVATE_KEY to your environment.",
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: "Database is not configured." };
  }

  let profileKey: string | null = null;

  // Check if user already has an Ayrshare profile
  const { data: existing } = await supabase
    .from("user_ayrshare_profiles")
    .select("ayrshare_profile_key")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.ayrshare_profile_key) {
    profileKey = existing.ayrshare_profile_key;
  } else {
    // Create new Ayrshare User Profile
    const createRes = await fetch(AYRSHARE_PROFILES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        title: `AutoBuzz User ${userId.slice(-8)}`,
      }),
    });

    const createData = (await createRes.json()) as {
      status?: string;
      profileKey?: string;
      message?: string;
    };

    if (!createRes.ok || createData?.status !== "success") {
      const msg =
        createData?.message ?? `Failed to create Ayrshare profile (${createRes.status})`;
      return { success: false, error: msg };
    }

    profileKey = createData.profileKey ?? null;
    if (!profileKey) {
      return { success: false, error: "Ayrshare did not return a profile key." };
    }

    // Store profile key for this user
    await supabase.from("user_ayrshare_profiles").upsert(
      {
        user_id: userId,
        ayrshare_profile_key: profileKey,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  }

  // Generate JWT URL for Social Linking page
  const jwtRes = await fetch(AYRSHARE_GENERATE_JWT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      domain,
      privateKey: privateKey.trim(),
      profileKey,
      redirect: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/settings/integrations`,
    }),
  });

  const jwtData = (await jwtRes.json()) as {
    status?: string;
    url?: string;
    token?: string;
    message?: string;
  };

  if (!jwtRes.ok || jwtData?.status !== "success") {
    const msg =
      jwtData?.message ?? `Failed to generate JWT (${jwtRes.status})`;
    return { success: false, error: msg };
  }

  const url = jwtData.url ?? (jwtData.token ? `https://profile.ayrshare.com?domain=${domain}&jwt=${jwtData.token}` : null);
  if (!url) {
    return { success: false, error: "Ayrshare did not return a JWT URL." };
  }

  return { success: true, url, token: jwtData.token };
}

/**
 * Returns the Ayrshare profile key for the current user, if any.
 * Used by postNow and dispatch to post to the user's connected accounts.
 */
export async function getAyrshareProfileKeyForUser(
  userId: string
): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("user_ayrshare_profiles")
    .select("ayrshare_profile_key")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.ayrshare_profile_key ?? null;
}
