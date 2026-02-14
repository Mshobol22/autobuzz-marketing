-- Create post-images bucket for permanent image storage.
-- If this fails, create manually in Supabase Dashboard: Storage > New bucket > name: post-images, Public: true
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;
