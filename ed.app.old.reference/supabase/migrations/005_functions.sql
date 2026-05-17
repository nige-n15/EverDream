create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.calculate_xp_score(
  c_raw decimal,
  r_user decimal,
  i_semantic decimal,
  s_valence decimal,
  d_density decimal default 1.0,
  m_sustain decimal default 1.0,
  t_social decimal default 1.0
) returns decimal
language plpgsql
immutable
set search_path = public
as $$
begin
  return (c_raw * r_user * i_semantic) * s_valence * d_density * m_sustain * t_social;
end;
$$;

create or replace function public.can_view_dream(
  dream_user_id uuid,
  dream_privacy text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return dream_user_id = auth.uid()
    or dream_privacy in ('copyleft', 'remix')
    or exists (
      select 1
      from public.profiles
      where id = dream_user_id
        and privacy_settings ->> 'dreams' = 'public'
    );
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    nickname,
    avatar_url
  )
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'nickname',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    nickname = coalesce(excluded.nickname, public.profiles.nickname),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.check_rate_limit(
  p_user_id uuid,
  p_function_name text,
  p_limit integer,
  p_window_seconds integer default 60
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  delete from public.function_rate_limits
  where invoked_at < timezone('utc', now()) - interval '1 day';

  select count(*)
  into recent_count
  from public.function_rate_limits
  where user_id = p_user_id
    and function_name = p_function_name
    and invoked_at >= timezone('utc', now()) - make_interval(secs => p_window_seconds);

  if recent_count >= p_limit then
    return false;
  end if;

  insert into public.function_rate_limits (user_id, function_name)
  values (p_user_id, p_function_name);

  return true;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_dreams_updated_at on public.dreams;
create trigger set_dreams_updated_at
before update on public.dreams
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
