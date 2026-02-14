// Types and constants for server actions - must not be in 'use server' files

export type GeneratePostResult =
  | { success: true; content: string; suggestedImagePrompt: string }
  | { success: false; error: string };

export type PostNowResult =
  | { success: true; id: string; postIds?: Array<{ platform: string; postUrl?: string }> }
  | { success: false; error: string };

export type SchedulePostResult =
  | { success: true; postId: string }
  | { success: false; error: string };

export type ScheduledPost = {
  id: string;
  content: string | null;
  platform: string | null;
  scheduled_for: string | null;
};

export type SavePostResult =
  | { success: true; postId: string }
  | { success: false; error: string };

export type GenerateImageResult =
  | { success: true; imageUrl: string }
  | { success: false; error: string };

export type Post = {
  id: string;
  content: string | null;
  image_url: string | null;
  platform: string | null;
  status: string | null;
  scheduled_for: string | null;
  created_at: string;
};

export type BrandSettingsForm = {
  company_name: string;
  core_values: string;
  tone_of_voice: string;
  target_audience: string;
  product_description: string;
};

export type BrandSettingsResult =
  | { success: true }
  | { success: false; error: string };

export const DEFAULT_BRAND_SETTINGS = {
  company_name: "Barakah Chaser",
  core_values:
    "Speed, Automation, Premium Design, Reliable Service, Community",
  tone_of_voice:
    'Professional yet Witty, High-Tech, "Vibecoder" Energy',
  target_audience:
    "Startup Founders, Developers, Chicago Locals, Small Business Owners",
  product_description:
    "We build high-end automated software solutions and offer reliable roadside assistance in Chicago. We focus on speed and premium design.",
} as const;
