create index if not exists idx_profiles_wallet_address on public.profiles (wallet_address);

create index if not exists idx_sleep_sessions_user_date
  on public.sleep_sessions (user_id, date desc);

create index if not exists idx_dreams_user_timestamp
  on public.dreams (user_id, timestamp desc);

create index if not exists idx_dreams_user_updated_at
  on public.dreams (user_id, updated_at desc);

create index if not exists idx_dreams_privacy
  on public.dreams (privacy);

create index if not exists idx_dreams_sleep_session_id
  on public.dreams (sleep_session_id);

create index if not exists idx_dreams_themes_gin
  on public.dreams using gin (themes);

create index if not exists idx_dreams_ai_metadata_gin
  on public.dreams using gin (ai_metadata);

create index if not exists idx_nft_registry_owner_address
  on public.nft_registry (owner_address);

create index if not exists idx_remix_registry_creator_id
  on public.remix_registry (creator_id);

create index if not exists idx_remix_registry_parent_dream_ids
  on public.remix_registry using gin (parent_dream_ids);

create index if not exists idx_sync_queue_user_status_created_at
  on public.sync_queue (user_id, status, created_at);

create index if not exists idx_sync_queue_table_record
  on public.sync_queue (table_name, record_id);

create index if not exists idx_function_rate_limits_user_function_invoked
  on public.function_rate_limits (user_id, function_name, invoked_at desc);
