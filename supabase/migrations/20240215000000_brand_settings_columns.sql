-- Add columns for brand voice form
alter table public.brand_settings
  add column if not exists core_values text,
  add column if not exists target_audience text,
  add column if not exists product_description text;
