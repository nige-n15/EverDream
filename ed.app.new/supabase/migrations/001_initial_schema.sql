-- ============================================================
-- EverDream Database Schema
-- Run this in your Supabase SQL Editor to create all tables
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT DEFAULT '',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alarm_time TEXT DEFAULT '07:00',
  alarm_enabled BOOLEAN DEFAULT true,
  music_preference TEXT DEFAULT 'peaceful',
  circadian_goal TEXT DEFAULT 'better_dreams',
  notifications_enabled BOOLEAN DEFAULT true,
  wearable_sync BOOLEAN DEFAULT false,
  image_generation BOOLEAN DEFAULT true,
  ai_analysis BOOLEAN DEFAULT true,
  anonymous_analytics BOOLEAN DEFAULT false,
  third_party_sharing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- DREAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.dreams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  transcript TEXT,
  capture_mode TEXT DEFAULT 'text' CHECK (capture_mode IN ('text', 'audio', 'video', 'photo')),
  category TEXT DEFAULT 'uncategorized',
  themes TEXT[] DEFAULT '{}',
  emotion TEXT DEFAULT 'neutral',
  symbols TEXT[] DEFAULT '{}',
  narrative TEXT,
  nugget TEXT,
  interpretation JSONB DEFAULT '{}',
  lucidity_level INTEGER CHECK (lucidity_level BETWEEN 0 AND 5),
  pre_sleep_intent TEXT,
  pre_sleep_note TEXT,
  mood_valence NUMERIC(3,2) CHECK (mood_valence BETWEEN -1 AND 1),
  context JSONB DEFAULT '{}',
  media_urls JSONB DEFAULT '[]',
  generated_image_url TEXT,
  generated_image_prompt TEXT,
  generated_image_style TEXT DEFAULT 'dreamlike',
  generated_image_source TEXT DEFAULT 'pollinations',
  sleep_session_id UUID,
  sleep_score INTEGER CHECK (sleep_score BETWEEN 0 AND 100),
  sleep_duration_minutes INTEGER,
  rem_minutes INTEGER,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'trusted', 'public')),
  watermark JSONB DEFAULT '{}',
  asset_metadata JSONB DEFAULT '{}',
  license TEXT DEFAULT 'loan',
  allow_remix BOOLEAN DEFAULT true,
  device_id TEXT,
  is_sample BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  local_created_at TIMESTAMPTZ,
  local_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ============================================================
-- SLEEP SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sleep_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_start TIMESTAMPTZ NOT NULL,
  sleep_end TIMESTAMPTZ,
  time_in_bed_minutes INTEGER,
  awake_minutes INTEGER DEFAULT 0,
  light_minutes INTEGER DEFAULT 0,
  deep_minutes INTEGER DEFAULT 0,
  rem_minutes INTEGER DEFAULT 0,
  total_sleep_minutes INTEGER DEFAULT 0,
  sleep_efficiency NUMERIC(5,2),
  awakenings INTEGER DEFAULT 0,
  waso_minutes INTEGER DEFAULT 0,
  movement_index NUMERIC(5,2),
  heart_rate_avg INTEGER,
  heart_rate_variability INTEGER,
  algorithmic_score INTEGER,
  user_report_score INTEGER,
  calibration_offset INTEGER DEFAULT 0,
  calibrated_score INTEGER,
  circadian_alignment_score INTEGER,
  chronotype_estimate TEXT,
  source TEXT DEFAULT 'manual',
  wearable_provider TEXT,
  device_id TEXT,
  dream_id UUID REFERENCES public.dreams(id),
  morning_check_in JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ============================================================
-- NFTs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dream_id UUID REFERENCES public.dreams(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id TEXT,
  contract_address TEXT,
  tx_hash TEXT,
  owner_address TEXT NOT NULL,
  creator_address TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'minted', 'failed')),
  parents TEXT[] DEFAULT '{}',
  royalty_splits JSONB DEFAULT '[]',
  license TEXT DEFAULT 'copyleft',
  allow_remix BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_dreams_user_id ON public.dreams(user_id);
CREATE INDEX IF NOT EXISTS idx_dreams_created_at ON public.dreams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dreams_category ON public.dreams(category);
CREATE INDEX IF NOT EXISTS idx_dreams_is_deleted ON public.dreams(is_deleted);
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_user_id ON public.sleep_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_sleep_start ON public.sleep_sessions(sleep_start DESC);
CREATE INDEX IF NOT EXISTS idx_nfts_user_id ON public.nfts(user_id);
CREATE INDEX IF NOT EXISTS idx_nfts_owner ON public.nfts(owner_address);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- User Settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Dreams
ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own dreams" ON public.dreams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dreams" ON public.dreams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dreams" ON public.dreams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dreams" ON public.dreams FOR DELETE USING (auth.uid() = user_id);

-- Sleep Sessions
ALTER TABLE public.sleep_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sleep sessions" ON public.sleep_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sleep sessions" ON public.sleep_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sleep sessions" ON public.sleep_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sleep sessions" ON public.sleep_sessions FOR DELETE USING (auth.uid() = user_id);

-- NFTs
ALTER TABLE public.nfts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own NFTs" ON public.nfts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own NFTs" ON public.nfts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own NFTs" ON public.nfts FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- HELPER: Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data->>'display_name');

  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- HELPER: Update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_dreams_updated_at ON public.dreams;
CREATE TRIGGER update_dreams_updated_at BEFORE UPDATE ON public.dreams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_sleep_sessions_updated_at ON public.sleep_sessions;
CREATE TRIGGER update_sleep_sessions_updated_at BEFORE UPDATE ON public.sleep_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_nfts_updated_at ON public.nfts;
CREATE TRIGGER update_nfts_updated_at BEFORE UPDATE ON public.nfts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
