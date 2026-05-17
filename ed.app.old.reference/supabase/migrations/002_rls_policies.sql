alter table public.profiles enable row level security;
alter table public.sleep_sessions enable row level security;
alter table public.dreams enable row level security;
alter table public.nft_registry enable row level security;
alter table public.remix_registry enable row level security;
alter table public.sync_queue enable row level security;
alter table public.function_rate_limits enable row level security;

alter table public.profiles force row level security;
alter table public.sleep_sessions force row level security;
alter table public.dreams force row level security;
alter table public.nft_registry force row level security;
alter table public.remix_registry force row level security;
alter table public.sync_queue force row level security;
alter table public.function_rate_limits force row level security;

drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "dreams_visible_by_privacy" on public.dreams;
create policy "dreams_visible_by_privacy"
  on public.dreams
  for select
  to anon, authenticated
  using (
    user_id = auth.uid()
    or privacy in ('copyleft', 'remix')
    or exists (
      select 1
      from public.profiles
      where id = user_id
        and privacy_settings ->> 'dreams' = 'public'
    )
  );

drop policy if exists "dreams_self_insert" on public.dreams;
create policy "dreams_self_insert"
  on public.dreams
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "dreams_self_update" on public.dreams;
create policy "dreams_self_update"
  on public.dreams
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "dreams_self_delete" on public.dreams;
create policy "dreams_self_delete"
  on public.dreams
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "sleep_sessions_self_select" on public.sleep_sessions;
create policy "sleep_sessions_self_select"
  on public.sleep_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "sleep_sessions_self_insert" on public.sleep_sessions;
create policy "sleep_sessions_self_insert"
  on public.sleep_sessions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "sleep_sessions_self_update" on public.sleep_sessions;
create policy "sleep_sessions_self_update"
  on public.sleep_sessions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "sleep_sessions_self_delete" on public.sleep_sessions;
create policy "sleep_sessions_self_delete"
  on public.sleep_sessions
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "nft_registry_public_read" on public.nft_registry;
create policy "nft_registry_public_read"
  on public.nft_registry
  for select
  to anon, authenticated
  using (true);

drop policy if exists "remix_registry_public_read" on public.remix_registry;
create policy "remix_registry_public_read"
  on public.remix_registry
  for select
  to anon, authenticated
  using (true);

drop policy if exists "remix_registry_owner_insert" on public.remix_registry;
create policy "remix_registry_owner_insert"
  on public.remix_registry
  for insert
  to authenticated
  with check (
    auth.uid() = creator_id
    and exists (
      select 1
      from public.dreams d
      where d.id = child_dream_id
        and d.user_id = auth.uid()
    )
  );

drop policy if exists "sync_queue_self_select" on public.sync_queue;
create policy "sync_queue_self_select"
  on public.sync_queue
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "sync_queue_self_insert" on public.sync_queue;
create policy "sync_queue_self_insert"
  on public.sync_queue
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "sync_queue_self_update" on public.sync_queue;
create policy "sync_queue_self_update"
  on public.sync_queue
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "sync_queue_self_delete" on public.sync_queue;
create policy "sync_queue_self_delete"
  on public.sync_queue
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "function_rate_limits_service_only" on public.function_rate_limits;
create policy "function_rate_limits_service_only"
  on public.function_rate_limits
  for all
  to authenticated
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
