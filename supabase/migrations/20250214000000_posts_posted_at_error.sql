-- Add posted_at and error_message for Dispatcher
alter table public.posts
  add column if not exists posted_at timestamptz,
  add column if not exists error_message text;
