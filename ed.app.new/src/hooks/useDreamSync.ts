/**
 * useDreamSync — React hook for syncing dreams to Supabase.
 *
 * Provides a single `syncDream` function that:
 * 1. Always saves to localStorage (instant, works offline)
 * 2. Syncs to Supabase when available (persists across devices)
 * 3. Handles profile creation automatically
 *
 * Also provides `syncFromSupabase` to pull remote dreams into local storage.
 *
 * Environment variables:
 *   VITE_SUPABASE_URL       — Supabase project URL
 *   VITE_SUPABASE_ANON_KEY  — Supabase anon/public key
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────

export interface DreamSyncData {
  id: string;
  content: string;
  title?: string;
  mood?: string;
  category: string;
  themes: string[];
  emotion: string;
  symbols: string[];
  narrative?: string;
  nugget?: string;
  interpretation?: {
    symbols: Record<string, string>;
    meaning: string;
    commonPattern: string;
  };
  imageUrl?: string;
  imagePrompt?: string;
  imageStyle?: string;
  imageSource?: string;
  captureMode: 'text' | 'audio' | 'video';
  context?: Record<string, unknown>;
  sleepData?: Record<string, unknown>;
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SyncState {
  /** Whether Supabase is configured and reachable */
  isOnline: boolean;
  /** Whether a sync is currently in progress */
  isSyncing: boolean;
  /** Number of dreams synced in the last operation */
  lastSyncCount: number;
  /** Error message from last sync, if any */
  lastError: string | null;
}

// ── Supabase Client ──────────────────────────────────────────

let _supabase: SupabaseClient | null = null;
let _userId: string | null = null;
let _profileId: string | null = null;

function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  _supabase = createClient(url, key, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
  });
  return _supabase;
}

// ── Local Storage ────────────────────────────────────────────

const LOCAL_KEY = 'everdream_dreams';

function loadLocal(): DreamSyncData[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocal(dreams: DreamSyncData[]): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(dreams));
  } catch (e) {
    console.warn('[useDreamSync] Local storage full:', e);
  }
}

// ── Conversion ───────────────────────────────────────────────

function dreamToRecord(dream: DreamSyncData, userId: string) {
  return {
    id: dream.id,
    user_id: userId,
    content: dream.content,
    category: dream.category || 'normal',
    themes: dream.themes || [],
    emotion: dream.emotion || 'neutral',
    symbols: dream.symbols || [],
    narrative: dream.narrative || null,
    nugget: dream.nugget || null,
    interpretation: dream.interpretation || null,
    generated_image_url: dream.imageUrl || null,
    generated_image_prompt: dream.imagePrompt || null,
    generated_image_style: dream.imageStyle || 'dreamlike',
    generated_image_source: dream.imageSource || null,
    capture_mode: dream.captureMode || 'text',
    context: dream.context || null,
    is_sample: dream.isSample || false,
    local_created_at: dream.createdAt,
    local_updated_at: dream.updatedAt,
  };
}

// ── Hook ─────────────────────────────────────────────────────

export function useDreamSync() {
  const [state, setState] = useState<SyncState>({
    isOnline: false,
    isSyncing: false,
    lastSyncCount: 0,
    lastError: null,
  });

  const syncQueueRef = useRef<DreamSyncData[]>([]);
  const syncingRef = useRef(false);

  // Initialize Supabase connection
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      console.log('[useDreamSync] Supabase not configured — local-only mode');
      return;
    }

    let mounted = true;

    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted) return;

        if (user) {
          _userId = user.id;
          setState(s => ({ ...s, isOnline: true }));
          console.log('[useDreamSync] Connected as:', user.id);
        } else {
          // Try anonymous sign-in
          const { data, error } = await supabase.auth.signInAnonymously();
          if (!mounted) return;

          if (error) {
            console.warn('[useDreamSync] Anonymous sign-in failed:', error.message);
          } else if (data.user) {
            _userId = data.user.id;
            setState(s => ({ ...s, isOnline: true }));
            console.log('[useDreamSync] Anonymous session:', data.user.id);
          }
        }
      } catch (err) {
        if (!mounted) return;
        console.warn('[useDreamSync] Init failed:', err);
      }
    }

    init();

    return () => { mounted = false; };
  }, []);

  // Get or create profile ID
  const ensureProfile = useCallback(async (): Promise<string | null> => {
    if (_profileId) return _profileId;
    const supabase = getSupabase();
    if (!supabase || !_userId) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', _userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create profile
        const { data: created } = await supabase
          .from('profiles')
          .insert({ auth_user_id: _userId })
          .select('id')
          .single();
        _profileId = created?.id ?? null;
        return _profileId;
      }

      _profileId = data?.id ?? null;
      return _profileId;
    } catch (err) {
      console.warn('[useDreamSync] Profile lookup failed:', err);
      return null;
    }
  }, []);

  /**
   * Save a dream — always saves locally, syncs to Supabase if available.
   */
  const syncDream = useCallback(async (dream: DreamSyncData): Promise<void> => {
    // Always save locally first
    const local = loadLocal();
    const existing = local.findIndex(d => d.id === dream.id);
    const updated = { ...dream, updatedAt: new Date().toISOString() };
    if (existing >= 0) {
      local[existing] = updated;
    } else {
      local.unshift(updated);
    }
    saveLocal(local);

    // Queue for Supabase sync
    const supabase = getSupabase();
    if (!supabase || !_userId) return;

    syncQueueRef.current.push(updated);
    if (syncingRef.current) return; // Already processing

    syncingRef.current = true;
    setState(s => ({ ...s, isSyncing: true, lastError: null }));

    try {
      const profileId = await ensureProfile();
      if (!profileId) return;

      // Process queue
      const queue = [...syncQueueRef.current];
      syncQueueRef.current = [];

      for (const d of queue) {
        try {
          const record = dreamToRecord(d, profileId);
          await supabase.from('dreams').upsert(record);
        } catch (err) {
          console.warn('[useDreamSync] Failed to sync dream:', d.id, err);
        }
      }

      setState(s => ({ ...s, isSyncing: false, lastSyncCount: queue.length }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setState(s => ({ ...s, isSyncing: false, lastError: msg }));
    } finally {
      syncingRef.current = false;
    }
  }, [ensureProfile]);

  /**
   * Sync dreams from Supabase into local storage.
   * Merges with existing local dreams.
   */
  const syncFromSupabase = useCallback(async (): Promise<number> => {
    const supabase = getSupabase();
    if (!supabase || !_userId) return 0;

    setState(s => ({ ...s, isSyncing: true, lastError: null }));

    try {
      const profileId = await ensureProfile();
      if (!profileId) return 0;

      const { data, error } = await supabase
        .from('dreams')
        .select('*')
        .eq('user_id', profileId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error || !data) return 0;

      const local = loadLocal();
      const localMap = new Map(local.map(d => [d.id, d]));
      let merged = 0;

      for (const record of data) {
        const remote: DreamSyncData = {
          id: record.id as string,
          content: record.content as string,
          title: (record.nugget as string) || undefined,
          category: (record.category as string) || 'normal',
          themes: (record.themes as string[]) || [],
          emotion: (record.emotion as string) || 'neutral',
          symbols: (record.symbols as string[]) || [],
          narrative: (record.narrative as string) || undefined,
          nugget: (record.nugget as string) || undefined,
          interpretation: (record.interpretation as DreamSyncData['interpretation']) || undefined,
          imageUrl: (record.generated_image_url as string) || undefined,
          imagePrompt: (record.generated_image_prompt as string) || undefined,
          imageStyle: (record.generated_image_style as string) || undefined,
          imageSource: (record.generated_image_source as string) || undefined,
          captureMode: (record.capture_mode as DreamSyncData['captureMode']) || 'text',
          context: (record.context as Record<string, unknown>) || undefined,
          isSample: (record.is_sample as boolean) || false,
          createdAt: (record.local_created_at as string) || (record.created_at as string) || new Date().toISOString(),
          updatedAt: (record.local_updated_at as string) || (record.updated_at as string) || new Date().toISOString(),
        };

        const existing = localMap.get(remote.id);
        if (!existing) {
          local.push(remote);
          merged++;
        } else if (new Date(remote.updatedAt) > new Date(existing.updatedAt)) {
          const idx = local.findIndex(d => d.id === remote.id);
          if (idx >= 0) local[idx] = remote;
          merged++;
        }
      }

      if (merged > 0) {
        saveLocal(local);
      }

      setState(s => ({ ...s, isSyncing: false, lastSyncCount: merged }));
      return merged;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setState(s => ({ ...s, isSyncing: false, lastError: msg }));
      return 0;
    }
  }, [ensureProfile]);

  /**
   * Delete a dream (soft delete locally and in Supabase).
   */
  const deleteDream = useCallback(async (id: string): Promise<void> => {
    const local = loadLocal().filter(d => d.id !== id);
    saveLocal(local);

    const supabase = getSupabase();
    if (!supabase || !_userId) return;

    try {
      await supabase.from('dreams').update({ is_deleted: true }).eq('id', id);
    } catch (err) {
      console.warn('[useDreamSync] Failed to delete in Supabase:', err);
    }
  }, []);

  /**
   * Load all dreams from local storage.
   */
  const loadDreams = useCallback((): DreamSyncData[] => {
    return loadLocal();
  }, []);

  return {
    ...state,
    syncDream,
    syncFromSupabase,
    deleteDream,
    loadDreams,
  };
}
