-- EverDream Database Schema
-- Run this in your Supabase SQL Editor to create the required tables

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- ============================================================
-- DREAMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.dreams (
  id text PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  transcript text,
  capture_mode text NOT NULL DEFAULT 'text' CHECK (capture_mode IN ('text', 'audio', 'video')),
  category text NOT NULL DEFAULT 'normal',
  themes text[] DEFAULT '{}',
  emotion text DEFAULT 'neutral',
  symbols text[] DEFAULT '{}',
  narrative text,
  nugget text,
  interpretation jsonb,
  lucidity_level integer,
  pre_sleep_intent text,
  pre_sleep_note text,
  mood_valence real,
  context jsonb,
  media_urls jsonb[],
  generated_image_url text,
  generated_image_prompt text,
  generated_image_style text DEFAULT 'dreamlike',
  generated_image_source text,
  sleep_session_id text,
  sleep_score integer,
  sleep_duration_minutes integer,
  rem_minutes integer,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'trusted', 'public')),
  watermark jsonb,
  asset_metadata jsonb,
  license text DEFAULT 'loan',
  allow_remix boolean DEFAULT true,
  device_id text,
  is_sample boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  local_created_at timestamptz,
  local_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dreams"
  ON public.dreams FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own dreams"
  ON public.dreams FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own dreams"
  ON public.dreams FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own dreams"
  ON public.dreams FOR DELETE
  USING (user_id = auth.uid());

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_dreams_user_id ON public.dreams(user_id);
CREATE INDEX IF NOT EXISTS idx_dreams_created_at ON public.dreams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dreams_is_deleted ON public.dreams(is_deleted);

-- ============================================================
-- SLEEP SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sleep_sessions (
  id text PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  sleep_start timestamptz NOT NULL,
  sleep_end timestamptz,
  time_in_bed_minutes integer,
  awake_minutes integer DEFAULT 0,
  light_minutes integer DEFAULT 0,
  deep_minutes integer DEFAULT 0,
  rem_minutes integer DEFAULT 0,
  total_sleep_minutes integer DEFAULT 0,
  sleep_efficiency real,
  awakenings integer DEFAULT 0,
  waso_minutes integer DEFAULT 0,
  movement_index real,
  heart_rate_avg real,
  heart_rate_variability real,
  algorithmic_score real,
  user_report_score real,
  calibration_offset real DEFAULT 0,
  calibrated_score real,
  circadian_alignment_score real,
  chronotype_estimate text,
  source text NOT NULL DEFAULT 'manual',
  wearable_provider text,
  device_id text,
  dream_id text,
  morning_check_in jsonb,
  is_active boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.sleep_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sleep sessions"
  ON public.sleep_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sleep sessions"
  ON public.sleep_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sleep sessions"
  ON public.sleep_sessions FOR UPDATE
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_sleep_sessions_user_id ON public.sleep_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_sleep_start ON public.sleep_sessions(sleep_start DESC);

-- ============================================================
-- USER SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  alarm_time text DEFAULT '07:00',
  alarm_enabled boolean DEFAULT true,
  music_preference text DEFAULT 'peaceful',
  circadian_goal text DEFAULT 'better_dreams',
  notifications_enabled boolean DEFAULT true,
  wearable_sync boolean DEFAULT false,
  image_generation boolean DEFAULT true,
  privacy_settings jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- HELPER: Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'display_name', 'Dreamer'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
