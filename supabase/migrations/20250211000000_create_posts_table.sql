-- Create posts table for storing drafts and scheduled posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  content text,
  image_url text,
  platform text,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'failed')),
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS; service role bypasses it for server-side access
alter table public.posts enable row level security;

-- No policies: table is accessed only via service role in Server Actions

-- Create index for scheduled post queries
create index if not exists posts_status_scheduled_for_idx
  on public.posts (status, scheduled_for)
  where status = 'scheduled';

create index if not exists posts_user_id_idx on public.posts (user_id);
