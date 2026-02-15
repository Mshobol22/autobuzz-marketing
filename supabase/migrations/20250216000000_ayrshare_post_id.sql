-- Store Ayrshare post ID for analytics (returned when publishing)
alter table public.posts
  add column if not exists ayrshare_post_id text;
