/**
 * Supabase Database Setup & Verification
 *
 * Provides functions to verify and initialize the database schema.
 * Run `verifyDatabaseSetup()` at app startup to ensure all tables exist.
 *
 * Environment variables:
 *   VITE_SUPABASE_URL       — Supabase project URL
 *   VITE_SUPABASE_ANON_KEY  — Supabase anon/public key
 */

import { supabase } from './client';

// ── Types ────────────────────────────────────────────────────

export interface TableStatus {
  name: string;
  exists: boolean;
  rowCount?: number;
  error?: string;
}

export interface DbSetupResult {
  allTablesExist: boolean;
  tables: TableStatus[];
  missingTables: string[];
  timestamp: string;
}

// ── Required Tables ──────────────────────────────────────────

const REQUIRED_TABLES = [
  'profiles',
  'dreams',
  'sleep_sessions',
  'user_settings',
  'nfts',
  'dream_assets',
  'sync_log',
  'webhook_events',
] as const;

// ── Verification ─────────────────────────────────────────────

/**
 * Verify that all required database tables exist and are accessible.
 * Returns a detailed status for each table.
 *
 * @returns DbSetupResult with status of all tables
 *
 * @example
 * ```ts
 * const result = await verifyDatabaseSetup();
 * if (!result.allTablesExist) {
 *   console.error('Missing tables:', result.missingTables);
 * }
 * ```
 */
export async function verifyDatabaseSetup(): Promise<DbSetupResult> {
  const tables: TableStatus[] = [];
  const missingTables: string[] = [];

  for (const tableName of REQUIRED_TABLES) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        // Table doesn't exist or no access
        tables.push({
          name: tableName,
          exists: false,
          error: error.message,
        });
        missingTables.push(tableName);
      } else {
        tables.push({
          name: tableName,
          exists: true,
          rowCount: count ?? 0,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      tables.push({
        name: tableName,
        exists: false,
        error: message,
      });
      missingTables.push(tableName);
    }
  }

  return {
    allTablesExist: missingTables.length === 0,
    tables,
    missingTables,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check if the database is reachable and the schema is set up.
 * Lightweight check — only queries the profiles table.
 *
 * @returns true if the database is ready
 */
export async function isDatabaseReady(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Even a "no rows" error means the table exists
    return !error || error.code === 'PGRST116';
  } catch {
    return false;
  }
}

/**
 * Get the SQL migration needed to set up the database.
 * Returns the complete schema SQL that can be run in Supabase Studio.
 *
 * @returns The SQL string for the complete schema
 */
export function getMigrationSql(): string {
  return `-- Run this in Supabase Studio SQL Editor
-- EverDream Complete Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'dreamer',
  avatar_url TEXT,
  tradition TEXT NOT NULL DEFAULT 'general',
  circadian_goal TEXT NOT NULL DEFAULT 'better_dreams',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dreams
CREATE TABLE IF NOT EXISTS public.dreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  transcript TEXT,
  capture_mode TEXT NOT NULL DEFAULT 'text',
  category TEXT NOT NULL DEFAULT 'normal',
  themes TEXT[] NOT NULL DEFAULT '{}',
  emotion TEXT NOT NULL DEFAULT 'neutral',
  symbols TEXT[] NOT NULL DEFAULT '{}',
  narrative TEXT,
  nugget TEXT,
  valence NUMERIC(3,2) CHECK (valence BETWEEN -1 AND 1),
  interpretation JSONB,
  generated_image_url TEXT,
  generated_image_prompt TEXT,
  generated_image_style TEXT DEFAULT 'dreamlike',
  generated_image_source TEXT,
  visibility TEXT NOT NULL DEFAULT 'private',
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Sleep Sessions
CREATE TABLE IF NOT EXISTS public.sleep_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sleep_start TIMESTAMPTZ NOT NULL,
  sleep_end TIMESTAMPTZ,
  total_sleep_minutes INTEGER NOT NULL DEFAULT 0,
  rem_minutes INTEGER NOT NULL DEFAULT 0,
  deep_minutes INTEGER NOT NULL DEFAULT 0,
  light_minutes INTEGER NOT NULL DEFAULT 0,
  awake_minutes INTEGER NOT NULL DEFAULT 0,
  sleep_efficiency NUMERIC(5,2),
  awakenings INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual',
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- User Settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alarm_time TEXT DEFAULT '07:00',
  alarm_enabled BOOLEAN NOT NULL DEFAULT true,
  preferred_bedtime TEXT DEFAULT '22:00',
  preferred_wake_time TEXT DEFAULT '06:30',
  image_generation_enabled BOOLEAN NOT NULL DEFAULT true,
  theme TEXT NOT NULL DEFAULT 'pearl',
  skin TEXT NOT NULL DEFAULT 'pearl-light',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NFTs
CREATE TABLE IF NOT EXISTS public.nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dream_id UUID REFERENCES public.dreams(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_address TEXT NOT NULL,
  creator_address TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Dream',
  description TEXT,
  image_url TEXT,
  animation_url TEXT,
  external_url TEXT,
  metadata JSONB,
  attributes JSONB[],
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  contract_address TEXT,
  token_id TEXT,
  license TEXT DEFAULT 'copyleft',
  allow_remix BOOLEAN DEFAULT true,
  minted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dream Assets
CREATE TABLE IF NOT EXISTS public.dream_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dream_id UUID REFERENCES public.dreams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  prompt TEXT,
  url TEXT,
  source TEXT,
  style TEXT DEFAULT 'dreamlike',
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_assets ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
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
`;
}

/**
 * Print a setup report to the console.
 * Useful for debugging database issues during development.
 */
export async function printSetupReport(): Promise<void> {
  console.log('🔍 EverDream Database Setup Report');
  console.log('=====================================');

  const result = await verifyDatabaseSetup();

  for (const table of result.tables) {
    const status = table.exists ? '✅' : '❌';
    const details = table.exists
      ? `${table.rowCount} rows`
      : table.error || 'not found';
    console.log(`  ${status} ${table.name}: ${details}`);
  }

  console.log('=====================================');
  if (result.allTablesExist) {
    console.log('✅ All tables ready!');
  } else {
    console.log(`❌ Missing tables: ${result.missingTables.join(', ')}`);
    console.log('Run the SQL migration in Supabase Studio to create them.');
  }
}
