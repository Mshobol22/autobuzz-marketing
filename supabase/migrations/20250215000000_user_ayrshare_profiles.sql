-- Store Ayrshare profile keys per user for multi-user posting
create table if not exists public.user_ayrshare_profiles (
  user_id text primary key,
  ayrshare_profile_key text not null,
  updated_at timestamptz not null default now()
);

alter table public.user_ayrshare_profiles enable row level security;
