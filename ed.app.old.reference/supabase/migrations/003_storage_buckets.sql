insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'dream-media',
    'dream-media',
    false,
    104857600,
    array['video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav']
  ),
  (
    'encrypted-blobs',
    'encrypted-blobs',
    false,
    104857600,
    array['application/octet-stream']
  ),
  (
    'public-assets',
    'public-assets',
    true,
    52428800,
    array['image/png', 'image/jpeg', 'image/webp', 'video/mp4']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "dream_media_owner_read" on storage.objects;
create policy "dream_media_owner_read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'dream-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "dream_media_owner_insert" on storage.objects;
create policy "dream_media_owner_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'dream-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "dream_media_owner_update" on storage.objects;
create policy "dream_media_owner_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'dream-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'dream-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "dream_media_owner_delete" on storage.objects;
create policy "dream_media_owner_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'dream-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "encrypted_blobs_owner_read" on storage.objects;
create policy "encrypted_blobs_owner_read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'encrypted-blobs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "encrypted_blobs_owner_insert" on storage.objects;
create policy "encrypted_blobs_owner_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'encrypted-blobs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "encrypted_blobs_owner_update" on storage.objects;
create policy "encrypted_blobs_owner_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'encrypted-blobs'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'encrypted-blobs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "encrypted_blobs_owner_delete" on storage.objects;
create policy "encrypted_blobs_owner_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'encrypted-blobs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "public_assets_world_read" on storage.objects;
create policy "public_assets_world_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'public-assets');

drop policy if exists "public_assets_owner_insert" on storage.objects;
create policy "public_assets_owner_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "public_assets_owner_update" on storage.objects;
create policy "public_assets_owner_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "public_assets_owner_delete" on storage.objects;
create policy "public_assets_owner_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
