"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_BRAND_SETTINGS,
  type BrandSettingsForm,
  type BrandSettingsResult,
} from "@/lib/types";

function getDefaults(): BrandSettingsForm {
  return { ...DEFAULT_BRAND_SETTINGS };
}

function isEmpty(obj: Record<string, unknown> | null): boolean {
  if (!obj) return true;
  return Object.values(obj).every(
    (v) => v === null || v === undefined || v === ""
  );
}

export async function getBrandSettingsForUser(): Promise<BrandSettingsForm> {
  const { userId } = await auth();
  const defaults = getDefaults();

  if (!userId) return defaults;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) return defaults;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("brand_settings")
    .select("brand_name, core_values, tone, target_audience, product_description")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data || isEmpty(data as Record<string, unknown>)) {
    return defaults;
  }

  const row = data as Record<string, unknown>;
  return {
    company_name: (row.brand_name as string) || defaults.company_name,
    core_values: (row.core_values as string) || defaults.core_values,
    tone_of_voice: (row.tone as string) || defaults.tone_of_voice,
    target_audience:
      (row.target_audience as string) || defaults.target_audience,
    product_description:
      (row.product_description as string) || defaults.product_description,
  };
}

export async function updateBrandSettings(
  formData: BrandSettingsForm
): Promise<BrandSettingsResult> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return { success: false, error: "Supabase is not configured" };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const payload = {
    brand_name: formData.company_name,
    core_values: formData.core_values,
    tone: formData.tone_of_voice,
    target_audience: formData.target_audience,
    product_description: formData.product_description,
    updated_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase
      .from("brand_settings")
      .upsert(
        {
          user_id: userId,
          ...payload,
        },
        { onConflict: "user_id" }
      );

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save brand settings";
    return { success: false, error: message };
  }
}
