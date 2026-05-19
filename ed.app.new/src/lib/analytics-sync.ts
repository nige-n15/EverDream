/**
 * Analytics Sync Service
 *
 * Syncs local analytics + performance data to Supabase for cross-user
 * admin dashboards. Falls back to localStorage when Supabase is unreachable.
 *
 * Tables needed in Supabase:
 *   ed_analytics_events   — raw events
 *   ed_analytics_sessions — session summaries
 *   ed_performance_metrics — performance data
 *
 * If Supabase is not configured, everything stays local (current behavior).
 */

// Supabase is optional — only loaded when configured
// Uses lazy init to avoid build failure when @supabase/supabase-js isn't installed
let supabaseClient: any = null;
let supabaseInitAttempted = false;

async function getSupabase(): Promise<any> {
  if (supabaseClient) return supabaseClient;
  if (supabaseInitAttempted) return null;
  supabaseInitAttempted = true;

  try {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseAnonKey) return null;

    const mod = await import('@supabase/supabase-js');
    supabaseClient = mod.createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
      db: { schema: 'public' },
    });
    return supabaseClient;
  } catch {
    // Supabase not installed or configured — analytics stays local
    return null;
  }
}

interface SyncResult {
  synced: number;
  errors: number;
}
const SYNC_META_KEY = 'ed_analytics_sync_meta';
const BATCH_SIZE = 50;

interface SyncMeta {
  lastSyncAt: number;
  lastEventId: string | null;
  lastSessionId: string | null;
  lastMetricId: string | null;
  totalSynced: number;
  status: 'idle' | 'syncing' | 'error';
  lastError?: string;
}

// ============================================================
// CONFIG
// ============================================================

function isSupabaseConfigured(): boolean {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

function getSyncMeta(): SyncMeta {
  try {
    const stored = localStorage.getItem(SYNC_META_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {
    lastSyncAt: 0,
    lastEventId: null,
    lastSessionId: null,
    lastMetricId: null,
    totalSynced: 0,
    status: 'idle',
  };
}

function setSyncMeta(meta: Partial<SyncMeta>): void {
  const current = getSyncMeta();
  const updated = { ...current, ...meta };
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(updated));
}

// ============================================================
// SYNC EVENTS
// ============================================================

export async function syncAnalyticsToBackend(): Promise<{ synced: number; errors: number }> {
  if (!isSupabaseConfigured()) {
    return { synced: 0, errors: 0 };
  }

  setSyncMeta({ status: 'syncing' });
  let synced = 0;
  let errors = 0;

  try {
    // Sync events
    const eventsResult = await syncEvents();
    synced += eventsResult.synced;
    errors += eventsResult.errors;

    // Sync sessions
    const sessionsResult = await syncSessions();
    synced += sessionsResult.synced;
    errors += sessionsResult.errors;

    // Sync performance metrics
    const perfResult = await syncPerformanceMetrics();
    synced += perfResult.synced;
    errors += perfResult.errors;

    setSyncMeta({
      lastSyncAt: Date.now(),
      totalSynced: getSyncMeta().totalSynced + synced,
      status: errors > 0 ? 'error' : 'idle',
      lastError: errors > 0 ? `${errors} sync errors` : undefined,
    });
  } catch (err) {
    setSyncMeta({ status: 'error', lastError: String(err) });
    errors++;
  }

  return { synced, errors };
}

async function syncEvents(): Promise<SyncResult> {
  const meta = getSyncMeta();
  const allEvents: AnalyticsEvent[] = JSON.parse(localStorage.getItem('ed_analytics_events') || '[]');

  // Get events we haven't synced yet
  let eventsToSync = allEvents;
  if (meta.lastEventId) {
    const lastIdx = allEvents.findIndex(e => e.id === meta.lastEventId);
    if (lastIdx >= 0) {
      eventsToSync = allEvents.slice(lastIdx + 1);
    }
  }

  if (eventsToSync.length === 0) return { synced: 0, errors: 0 };

  let synced = 0;
  let errors = 0;
  let lastId = meta.lastEventId;

  // Batch insert
  for (let i = 0; i < eventsToSync.length; i += BATCH_SIZE) {
    const batch = eventsToSync.slice(i, i + BATCH_SIZE).map(e => ({
      id: e.id,
      type: e.type,
      name: e.name,
      timestamp: new Date(e.timestamp).toISOString(),
      session_id: e.sessionId,
      user_id: e.userId || null,
      properties: e.properties || {},
      screen: e.screen || null,
      ab_test_variant: e.abTestVariant || null,
    }));

    const { error } = await supabase.from('ed_analytics_events').upsert(batch, { onConflict: 'id' });
    if (error) {
      errors++;
    } else {
      synced += batch.length;
      lastId = batch[batch.length - 1].id;
    }
  }

  setSyncMeta({ lastEventId: lastId });
  return { synced, errors };
}

async function syncSessions(): Promise<SyncResult> {
  const meta = getSyncMeta();
  const allSessions: Session[] = JSON.parse(localStorage.getItem('ed_analytics_sessions') || '[]');

  let sessionsToSync = allSessions;
  if (meta.lastSessionId) {
    const lastIdx = allSessions.findIndex(s => s.id === meta.lastSessionId);
    if (lastIdx >= 0) {
      sessionsToSync = allSessions.slice(lastIdx + 1);
    }
  }

  if (sessionsToSync.length === 0) return { synced: 0, errors: 0 };

  let synced = 0;
  let errors = 0;
  let lastId = meta.lastSessionId;

  for (let i = 0; i < sessionsToSync.length; i += BATCH_SIZE) {
    const batch = sessionsToSync.slice(i, i + BATCH_SIZE).map(s => ({
      id: s.id,
      started_at: new Date(s.startedAt).toISOString(),
      ended_at: s.endedAt ? new Date(s.endedAt).toISOString() : null,
      duration: s.duration || null,
      screens: s.screens || [],
      event_count: s.events || 0,
      exit_screen: s.exitScreen || null,
      ab_tests: s.abTests || [],
    }));

    const { error } = await supabase.from('ed_analytics_sessions').upsert(batch, { onConflict: 'id' });
    if (error) {
      errors++;
    } else {
      synced += batch.length;
      lastId = batch[batch.length - 1].id;
    }
  }

  setSyncMeta({ lastSessionId: lastId });
  return { synced, errors };
}

async function syncPerformanceMetrics(): Promise<SyncResult> {
  const meta = getSyncMeta();
  const allMetrics: PerformanceMetric[] = JSON.parse(localStorage.getItem('ed_perf_metrics') || '[]');

  let metricsToSync = allMetrics;
  if (meta.lastMetricId) {
    const lastIdx = allMetrics.findIndex(m => m.id === meta.lastMetricId);
    if (lastIdx >= 0) {
      metricsToSync = allMetrics.slice(lastIdx + 1);
    }
  }

  if (metricsToSync.length === 0) return { synced: 0, errors: 0 };

  let synced = 0;
  let errors = 0;
  let lastId = meta.lastMetricId;

  for (let i = 0; i < metricsToSync.length; i += BATCH_SIZE) {
    const batch = metricsToSync.slice(i, i + BATCH_SIZE).map(m => ({
      id: m.id,
      type: m.type,
      name: m.name,
      value: m.value,
      unit: m.unit,
      timestamp: new Date(m.timestamp).toISOString(),
      session_id: m.sessionId,
      screen: m.screen || null,
      metadata: m.metadata || {},
    }));

    const { error } = await supabase.from('ed_performance_metrics').upsert(batch, { onConflict: 'id' });
    if (error) {
      errors++;
    } else {
      synced += batch.length;
      lastId = batch[batch.length - 1].id;
    }
  }

  setSyncMeta({ lastMetricId: lastId });
  return { synced, errors };
}

// ============================================================
// ADMIN DASHBOARD DATA (from Supabase)
// ============================================================

export interface AdminDashboardData {
  summary: {
    totalUsers: number;
    totalEvents: number;
    totalSessions: number;
    avgSessionDuration: number;
    activeToday: number;
    activeThisWeek: number;
  };
  topScreens: { screen: string; views: number }[];
  eventsByType: { type: string; count: number }[];
  dailyActiveUsers: { date: string; users: number }[];
  apiLatency: { api: string; avgMs: number; p95: number; errors: number }[];
  errorSummary: { message: string; count: number; lastSeen: string }[];
  recentSessions: {
    id: string;
    startedAt: string;
    duration: number;
    screens: string[];
    eventCount: number;
  }[];
  performance: {
    avgPageLoad: number;
    avgApiLatency: number;
    errorRate: number;
    avgFps: number;
  };
  syncMeta: SyncMeta;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const syncMeta = getSyncMeta();

  // Try Supabase first, fall back to local
  if (isSupabaseConfigured()) {
    try {
      return await getAdminDataFromSupabase(syncMeta);
    } catch (err) {
      console.warn('[Analytics] Supabase admin query failed, using local data:', err);
    }
  }

  return getAdminDataFromLocal(syncMeta);
}

async function getAdminDataFromSupabase(meta: SyncMeta): Promise<AdminDashboardData> {
  // Run queries in parallel
  const [
    eventsResult,
    sessionsResult,
    metricsResult,
  ] = await Promise.all([
    supabase.from('ed_analytics_events').select('id, type, name, timestamp, session_id, screen', { count: 'exact' }),
    supabase.from('ed_analytics_sessions').select('id, started_at, duration, screens, event_count', { count: 'exact' }),
    supabase.from('ed_performance_metrics').select('id, type, name, value, unit, timestamp, metadata'),
  ]);

  const events = eventsResult.data || [];
  const sessions = sessionsResult.data || [];
  const metrics = metricsResult.data || [];

  // Summary
  const now = Date.now();
  const oneDayAgo = now - 86400000;
  const oneWeekAgo = now - 7 * 86400000;

  const activeSessionsToday = sessions.filter(s => new Date(s.started_at).getTime() > oneDayAgo);
  const activeSessionsWeek = sessions.filter(s => new Date(s.started_at).getTime() > oneWeekAgo);
  const durations = sessions.map(s => s.duration).filter(Boolean) as number[];

  // Top screens
  const screenViews = new Map<string, number>();
  for (const e of events) {
    if (e.screen) {
      screenViews.set(e.screen, (screenViews.get(e.screen) || 0) + 1);
    }
  }

  // Events by type
  const eventsByType = new Map<string, number>();
  for (const e of events) {
    eventsByType.set(e.type, (eventsByType.get(e.type) || 0) + 1);
  }

  // Daily active users (unique session IDs per day)
  const dailyUsers = new Map<string, Set<string>>();
  for (const s of sessions) {
    const day = s.started_at.split('T')[0];
    const set = dailyUsers.get(day) || new Set();
    set.add(s.id);
    dailyUsers.set(day, set);
  }

  // API latency from metrics
  const apiMetrics = metrics.filter(m => m.type === 'api_call');
  const apiGroups = new Map<string, number[]>();
  const apiErrors = new Map<string, number>();
  for (const m of apiMetrics) {
    const api = m.name.replace('api_', '');
    const durations = apiGroups.get(api) || [];
    durations.push(m.value);
    apiGroups.set(api, durations);
    if (m.metadata?.error || (m.metadata?.status && m.metadata.status >= 400)) {
      apiErrors.set(api, (apiErrors.get(api) || 0) + 1);
    }
  }

  // Error summary
  const errorMetrics = metrics.filter(m => m.type === 'error');
  const errorGroups = new Map<string, { count: number; lastSeen: string }>();
  for (const m of errorMetrics) {
    const msg = m.metadata?.message || m.name;
    const existing = errorGroups.get(msg) || { count: 0, lastSeen: m.timestamp };
    existing.count++;
    if (m.timestamp > existing.lastSeen) existing.lastSeen = m.timestamp;
    errorGroups.set(msg, existing);
  }

  // Page load metrics
  const pageLoadMetrics = metrics.filter(m => m.type === 'page_load' && m.name === 'full_load');
  const avgPageLoad = pageLoadMetrics.length > 0
    ? pageLoadMetrics.reduce((s, m) => s + m.value, 0) / pageLoadMetrics.length
    : 0;

  // FPS metrics
  const fpsMetrics = metrics.filter(m => m.type === 'fps');
  const avgFps = fpsMetrics.length > 0
    ? fpsMetrics.reduce((s, m) => s + m.value, 0) / fpsMetrics.length
    : 0;

  return {
    summary: {
      totalUsers: new Set(events.map(e => e.session_id)).size,
      totalEvents: eventsResult.count || events.length,
      totalSessions: sessionsResult.count || sessions.length,
      avgSessionDuration: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      activeToday: activeSessionsToday.length,
      activeThisWeek: activeSessionsWeek.length,
    },
    topScreens: Array.from(screenViews.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([screen, views]) => ({ screen, views })),
    eventsByType: Array.from(eventsByType.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count })),
    dailyActiveUsers: Array.from(dailyUsers.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, users]) => ({ date, users: users.size })),
    apiLatency: Array.from(apiGroups.entries()).map(([api, durations]) => {
      const sorted = [...durations].sort((a, b) => a - b);
      return {
        api,
        avgMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        p95: Math.round(sorted[Math.floor(sorted.length * 0.95)] || 0),
        errors: apiErrors.get(api) || 0,
      };
    }),
    errorSummary: Array.from(errorGroups.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([message, data]) => ({ message, ...data })),
    recentSessions: sessions
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .slice(0, 20)
      .map(s => ({
        id: s.id,
        startedAt: s.started_at,
        duration: s.duration || 0,
        screens: s.screens || [],
        eventCount: s.event_count || 0,
      })),
    performance: {
      avgPageLoad: Math.round(avgPageLoad),
      avgApiLatency: apiMetrics.length > 0 ? Math.round(apiMetrics.reduce((s, m) => s + m.value, 0) / apiMetrics.length) : 0,
      errorRate: events.length > 0 ? errorMetrics.length / events.length : 0,
      avgFps: Math.round(avgFps),
    },
    syncMeta: meta,
  };
}

function getAdminDataFromLocal(meta: SyncMeta): AdminDashboardData {
  const events: AnalyticsEvent[] = JSON.parse(localStorage.getItem('ed_analytics_events') || '[]');
  const sessions: Session[] = JSON.parse(localStorage.getItem('ed_analytics_sessions') || '[]');
  const perfMetrics: PerformanceMetric[] = JSON.parse(localStorage.getItem('ed_perf_metrics') || '[]');

  const now = Date.now();
  const oneDayAgo = now - 86400000;
  const oneWeekAgo = now - 7 * 86400000;

  const activeToday = sessions.filter(s => s.startedAt > oneDayAgo);
  const activeWeek = sessions.filter(s => s.startedAt > oneWeekAgo);
  const durations = sessions.map(s => s.duration).filter(Boolean) as number[];

  const screenViews = new Map<string, number>();
  for (const e of events) {
    if (e.screen) screenViews.set(e.screen, (screenViews.get(e.screen) || 0) + 1);
  }

  const eventsByType = new Map<string, number>();
  for (const e of events) {
    eventsByType.set(e.type, (eventsByType.get(e.type) || 0) + 1);
  }

  const dailyUsers = new Map<string, number>();
  for (const s of sessions) {
    const day = new Date(s.startedAt).toISOString().split('T')[0];
    dailyUsers.set(day, (dailyUsers.get(day) || 0) + 1);
  }

  const apiMetrics = perfMetrics.filter(m => m.type === 'api_call');
  const apiGroups = new Map<string, number[]>();
  for (const m of apiMetrics) {
    const api = m.name.replace('api_', '');
    const d = apiGroups.get(api) || [];
    d.push(m.value);
    apiGroups.set(api, d);
  }

  const errorMetrics = perfMetrics.filter(m => m.type === 'error');
  const errorGroups = new Map<string, { count: number; lastSeen: string }>();
  for (const m of errorMetrics) {
    const msg = m.metadata?.message || m.name;
    const existing = errorGroups.get(msg) || { count: 0, lastSeen: new Date(m.timestamp).toISOString() };
    existing.count++;
    errorGroups.set(msg, existing);
  }

  const pageLoadMetrics = perfMetrics.filter(m => m.type === 'page_load' && m.name === 'full_load');
  const avgPageLoad = pageLoadMetrics.length > 0
    ? pageLoadMetrics.reduce((s, m) => s + m.value, 0) / pageLoadMetrics.length
    : 0;

  const fpsMetrics = perfMetrics.filter(m => m.type === 'fps');
  const avgFps = fpsMetrics.length > 0
    ? fpsMetrics.reduce((s, m) => s + m.value, 0) / fpsMetrics.length
    : 0;

  return {
    summary: {
      totalUsers: 1, // local only
      totalEvents: events.length,
      totalSessions: sessions.length,
      avgSessionDuration: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      activeToday: activeToday.length,
      activeThisWeek: activeWeek.length,
    },
    topScreens: Array.from(screenViews.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([screen, views]) => ({ screen, views })),
    eventsByType: Array.from(eventsByType.entries()).sort((a, b) => b[1] - a[1]).map(([type, count]) => ({ type, count })),
    dailyActiveUsers: Array.from(dailyUsers.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-30).map(([date, users]) => ({ date, users })),
    apiLatency: Array.from(apiGroups.entries()).map(([api, d]) => ({
      api,
      avgMs: Math.round(d.reduce((a, b) => a + b, 0) / d.length),
      p95: Math.round([...d].sort((a, b) => a - b)[Math.floor(d.length * 0.95)] || 0),
      errors: 0,
    })),
    errorSummary: Array.from(errorGroups.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 10).map(([message, data]) => ({ message, ...data })),
    recentSessions: sessions.sort((a, b) => b.startedAt - a.startedAt).slice(0, 20).map(s => ({
      id: s.id,
      startedAt: new Date(s.startedAt).toISOString(),
      duration: s.duration || 0,
      screens: s.screens || [],
      eventCount: s.events || 0,
    })),
    performance: {
      avgPageLoad: Math.round(avgPageLoad),
      avgApiLatency: apiMetrics.length > 0 ? Math.round(apiMetrics.reduce((s, m) => s + m.value, 0) / apiMetrics.length) : 0,
      errorRate: events.length > 0 ? errorMetrics.length / events.length : 0,
      avgFps: Math.round(avgFps),
    },
    syncMeta: meta,
  };
}

// ============================================================
// AUTO-SYNC
// ============================================================

let autoSyncInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoSync(intervalMs = 60000): void {
  if (autoSyncInterval) clearInterval(autoSyncInterval);
  autoSyncInterval = setInterval(() => {
    syncAnalyticsToBackend();
  }, intervalMs);
}

export function stopAutoSync(): void {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
}
