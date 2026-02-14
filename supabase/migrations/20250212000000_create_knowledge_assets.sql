-- Create knowledge_assets table for The Vault (RAG)
create table if not exists public.knowledge_assets (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.knowledge_assets enable row level security;

-- Index for user lookups
create index if not exists knowledge_assets_user_id_idx on public.knowledge_assets (user_id);
