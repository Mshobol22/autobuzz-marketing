"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export type KnowledgeAsset = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function getKnowledgeAssetById(
  assetId: string
): Promise<KnowledgeAsset | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("knowledge_assets")
    .select("id, title, content, created_at")
    .eq("id", assetId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as KnowledgeAsset;
}

export async function getKnowledgeAssets(): Promise<KnowledgeAsset[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("knowledge_assets")
    .select("id, title, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as KnowledgeAsset[];
}

export async function getKnowledgeAssetsCount(): Promise<number> {
  const { userId } = await auth();
  if (!userId) return 0;

  const supabase = getSupabase();
  if (!supabase) return 0;

  const { count } = await supabase
    .from("knowledge_assets")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return count ?? 0;
}

export async function getKnowledgeAssetsForPrompt(): Promise<string[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("knowledge_assets")
    .select("content")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((r) => (r.content ?? "").trim()).filter(Boolean);
}

export type AddKnowledgeAssetResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function addKnowledgeAsset(
  title: string,
  content: string
): Promise<AddKnowledgeAssetResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const trimmedTitle = title?.trim();
  if (!trimmedTitle) {
    return { success: false, error: "Title is required" };
  }

  try {
    const { data, error } = await supabase
      .from("knowledge_assets")
      .insert({
        user_id: userId,
        title: trimmedTitle,
        content: (content ?? "").trim(),
      })
      .select("id")
      .single();

    if (error) throw error;
    return { success: true, id: data.id };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to add asset";
    return { success: false, error: message };
  }
}

export type DeleteKnowledgeAssetResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteKnowledgeAsset(
  id: string
): Promise<DeleteKnowledgeAssetResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  try {
    const { error } = await supabase
      .from("knowledge_assets")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete asset";
    return { success: false, error: message };
  }
}
