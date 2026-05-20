-- ============================================================
-- EverDream — Database Migration 001
-- Creates the core tables: profiles, dreams, sleep_sessions, user_settings
-- Enables RLS with user-specific policies
-- ============================================================

-- ── 1. PROFILES TABLE ─────────────────────────────────────────
-- Linked 1:1 with Supabase auth.users
-- Stores user preferences and display info

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'dreamer',
  avatar_url TEXT,
  tradition TEXT NOT NULL DEFAULT 'general' CHECK (tradition IN ('buddhist', 'celtic', 'scientific', 'general')),
  circadian_goal TEXT NOT NULL DEFAULT 'better_dreams',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by auth_user_id
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles(auth_user_id);

-- RLS: Users can only see/edit their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- ── 2. DREAMS TABLE ───────────────────────────────────────────
-- Core dream journal entries with full AI analysis data

CREATE TABLE IF NOT EXISTS public.dreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  transcript TEXT,
  capture_mode TEXT NOT NULL DEFAULT 'text' CHECK (capture_mode IN ('text', 'audio', 'video')),
  category TEXT NOT NULL DEFAULT 'normal',
  themes TEXT[] NOT NULL DEFAULT '{}',
  emotion TEXT NOT NULL DEFAULT 'neutral',
  symbols TEXT[] NOT NULL DEFAULT '{}',
  narrative TEXT,
  nugget TEXT,
  interpretation JSONB,
  lucidity_level INTEGER CHECK (lucidity_level BETWEEN 0 AND 5),
  pre_sleep_intent TEXT,
  pre_sleep_note TEXT,
  mood_valence NUMERIC(3,2) CHECK (mood_valence BETWEEN -1 AND 1),
  context JSONB,
  media_urls JSONB,
  generated_image_url TEXT,
  generated_image_prompt TEXT,
  generated_image_style TEXT DEFAULT 'dreamlike',
  generated_image_source TEXT,
  sleep_session_id UUID,
  sleep_score INTEGER CHECK (sleep_score BETWEEN 0 AND 100),
  sleep_duration_minutes INTEGER,
  rem_minutes INTEGER,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'trusted', 'public')),
  watermark JSONB,
  asset_metadata JSONB,
  license TEXT NOT NULL DEFAULT 'copyleft',
  allow_remix BOOLEAN NOT NULL DEFAULT true,
  device_id TEXT,
  is_sample BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  local_created_at TIMESTAMPTZ,
  local_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_dreams_user_id ON public.dreams(user_id);
CREATE INDEX IF NOT EXISTS idx_dreams_created_at ON public.dreams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dreams_category ON public.dreams(category);
CREATE INDEX IF NOT EXISTS idx_dreams_is_deleted ON public.dreams(is_deleted);
CREATE INDEX IF NOT EXISTS idx_dreams_user_deleted ON public.dreams(user_id, is_deleted);

-- RLS: Users can only access their own dreams
ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dreams"
  ON public.dreams FOR SELECT
  USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert own dreams"
  ON public.dreams FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own dreams"
  ON public.dreams FOR UPDATE
  USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete own dreams"
  ON public.dreams FOR DELETE
  USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- ── 3. SLEEP SESSIONS TABLE ───────────────────────────────────
-- Sleep tracking data from wearables or manual entry

CREATE TABLE IF NOT EXISTS public.sleep_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sleep_start TIMESTAMPTZ NOT NULL,
  sleep_end TIMESTAMPTZ,
  time_in_bed_minutes INTEGER,
  awake_minutes INTEGER NOT NULL DEFAULT 0,
  light_minutes INTEGER NOT NULL DEFAULT 0,
  deep_minutes INTEGER NOT NULL DEFAULT 0,
  rem_minutes INTEGER NOT NULL DEFAULT 0,
  total_sleep_minutes INTEGER NOT NULL DEFAULT 0,
  sleep_efficiency NUMERIC(5,2),
  awakenings INTEGER NOT NULL DEFAULT 0,
  waso_minutes INTEGER NOT NULL DEFAULT 0,
  movement_index NUMERIC(5,2),
  heart_rate_avg NUMERIC(5,2),
  heart_rate_variability NUMERIC(5,2),
  algorithmic_score INTEGER CHECK (algorithmic_score BETWEEN 0 AND 100),
  user_report_score INTEGER CHECK (user_report_score BETWEEN 0 AND 100),
  calibration_offset NUMERIC(3,2) NOT NULL DEFAULT 0,
  calibrated_score INTEGER CHECK (calibrated_score BETWEEN 0 AND 100),
  circadian_alignment_score INTEGER CHECK (circadian_alignment_score BETWEEN 0 AND 100),
  chronotype_estimate TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  wearable_provider TEXT,
  device_id TEXT,
  dream_id UUID REFERENCES public.dreams(id) ON DELETE SET NULL,
  morning_check_in JSONB,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_user_id ON public.sleep_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_sleep_start ON public.sleep_sessions(sleep_start DESC);
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_is_deleted ON public.sleep_sessions(is_deleted);

-- RLS
ALTER TABLE public.sleep_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sleep sessions"
  ON public.sleep_sessions FOR SELECT
  USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert own sleep sessions"
  ON public.sleep_sessions FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own sleep sessions"
  ON public.sleep_sessions FOR UPDATE
  USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete own sleep sessions"
  ON public.sleep_sessions FOR DELETE
  USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- ── 4. USER SETTINGS TABLE ────────────────────────────────────
-- App preferences and feature flags per user

CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alarm_time TEXT DEFAULT '07:00',
  alarm_enabled BOOLEAN NOT NULL DEFAULT true,
  music_preference TEXT NOT NULL DEFAULT 'peaceful',
  circadian_goal TEXT NOT NULL DEFAULT 'better_dreams',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  wearable_sync BOOLEAN NOT NULL DEFAULT false,
  image_generation_enabled BOOLEAN NOT NULL DEFAULT true,
  data_processing_consent BOOLEAN NOT NULL DEFAULT false,
  ai_analysis_consent BOOLEAN NOT NULL DEFAULT true,
  anonymous_analytics BOOLEAN NOT NULL DEFAULT false,
  third_party_sharing BOOLEAN NOT NULL DEFAULT false,
  theme TEXT NOT NULL DEFAULT 'pearl',
  skin TEXT NOT NULL DEFAULT 'pearl-light',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- ── 5. UPDATED_AT TRIGGER FUNCTION ────────────────────────────
-- Automatically updates the updated_at timestamp on any row change

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.dreams;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.dreams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.sleep_sessions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.sleep_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.user_settings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 6. AUTO-CREATE PROFILE ON SIGNUP ─────────────────────────
-- When a new user signs up, automatically create their profile

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'dreamer')
  );

  INSERT INTO public.user_settings (user_id)
  VALUES (
    (SELECT id FROM public.profiles WHERE auth_user_id = NEW.id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 7. SOFT-DELETE CLEANUP (runs via pg_cron or manually) ────
-- Permanently deletes soft-deleted records older than 7 days

CREATE OR REPLACE FUNCTION public.cleanup_soft_deleted()
RETURNS void AS $$
BEGIN
  DELETE FROM public.dreams WHERE is_deleted = true AND updated_at < now() - interval '7 days';
  DELETE FROM public.sleep_sessions WHERE is_deleted = true AND updated_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql;
