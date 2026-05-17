create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  wallet_address text unique,
  nickname text,
  avatar_url text,
  privacy_settings jsonb not null default '{"profile":"public","dreams":"private"}'::jsonb,
  wearable_integrations jsonb not null default '{"oura":false,"apple_health":false}'::jsonb,
  t_social_score numeric(8, 4) not null default 1.0 check (t_social_score >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sleep_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  score numeric(5, 2) not null default 0 check (score between 0 and 100),
  rem_minutes integer not null default 0 check (rem_minutes >= 0),
  deep_minutes integer not null default 0 check (deep_minutes >= 0),
  light_minutes integer not null default 0 check (light_minutes >= 0),
  awake_minutes integer not null default 0 check (awake_minutes >= 0),
  total_sleep_minutes integer not null default 0 check (total_sleep_minutes >= 0),
  source text not null check (source in ('wearable', 'manual')),
  wearable_device text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, date)
);

create table if not exists public.dreams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  timestamp timestamptz not null default timezone('utc', now()),
  media_type text not null check (media_type in ('video', 'audio', 'text')),
  media_storage_path text,
  narrative text not null,
  themes text[] not null default '{}'::text[] check (coalesce(array_length(themes, 1), 0) <= 3),
  valence smallint not null default 0 check (valence between -5 and 5),
  arousal smallint not null default 0 check (arousal between 0 and 10),
  resonance_score numeric(6, 5) not null default 0 check (resonance_score between 0 and 1),
  xp_score numeric(12, 4) not null default 0,
  sleep_session_id uuid references public.sleep_sessions (id) on delete set null,
  nft_token_id text,
  nft_contract_address text,
  nft_tx_hash text,
  license_type text not null default 'CC-BY-SA-4.0' check (
    license_type in ('CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'ALL-RIGHTS-RESERVED')
  ),
  royalty_bps integer not null default 300 check (royalty_bps between 0 and 10000),
  privacy text not null default 'private' check (privacy in ('private', 'copyleft', 'remix')),
  ai_metadata jsonb not null default '{}'::jsonb,
  verification_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.nft_registry (
  token_id text primary key,
  dream_id uuid not null unique references public.dreams (id) on delete cascade,
  contract_address text not null,
  network text not null check (network in ('amoy', 'polygon')),
  minted_at timestamptz not null default timezone('utc', now()),
  metadata_ipfs_hash text,
  owner_address text not null
);

create table if not exists public.remix_registry (
  id uuid primary key default gen_random_uuid(),
  child_dream_id uuid not null references public.dreams (id) on delete cascade,
  parent_dream_ids uuid[] not null check (coalesce(array_length(parent_dream_ids, 1), 0) >= 1),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  license_type text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sync_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  operation_type text not null check (operation_type in ('CREATE', 'UPDATE', 'DELETE')),
  table_name text not null check (table_name in ('dreams', 'sleep_sessions', 'profiles')),
  record_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'synced', 'failed')),
  retry_count integer not null default 0 check (retry_count >= 0),
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  synced_at timestamptz
);

create table if not exists public.function_rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  function_name text not null,
  invoked_at timestamptz not null default timezone('utc', now())
);
