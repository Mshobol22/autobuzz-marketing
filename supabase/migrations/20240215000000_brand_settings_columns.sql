-- Create brand_settings table if it doesn't exist (required for alter)
create table if not exists public.brand_settings (
  user_id text primary key,
  brand_name text,
  tone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add columns for brand voice form
alter table public.brand_settings
  add column if not exists core_values text,
  add column if not exists target_audience text,
  add column if not exists product_description text;
