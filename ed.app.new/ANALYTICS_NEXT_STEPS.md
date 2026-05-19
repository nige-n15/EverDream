# EverDream Analytics — Next Steps

## What was built (2026-05-17)

### New files
- `src/lib/performance.ts` — Performance monitoring (page load, API latency, memory, FPS, long tasks, errors)
- `src/lib/analytics-sync.ts` — Syncs analytics + perf data to Supabase (local fallback when no Supabase)
- `src/components/admin/AdminDashboard.tsx` — Full admin dashboard (7 tabs: Overview, Screens, Performance, Errors, Sessions, A/B Tests, Settings)

### Modified files
- `src/DreamJournalApp.tsx` — Analytics init, screen tracking, perf monitoring on AI + image gen, admin route
- `src/hooks/useHashRoute.ts` — Added 'admin' route
- `src/components/Shell.tsx` — Admin in nav group
- `src/components/debug/DebugPanel.tsx` — Admin Dashboard button in header
- `src/lib/supabase/client.ts` — Fixed SQL-style `--` comments breaking bundler

### Build status
- Vite build passes (1.08MB bundle, 1804 modules)
- Access via: More → "Analytics dashboard" or Debug Panel header

---

## Next Steps

### 1. Supabase setup (for cross-user analytics)
The analytics sync service needs these tables in Supabase:
```sql
CREATE TABLE ed_analytics_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  session_id TEXT NOT NULL,
  user_id TEXT,
  properties JSONB DEFAULT '{}',
  screen TEXT,
  ab_test_variant TEXT
);

CREATE TABLE ed_analytics_sessions (
  id TEXT PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration INTEGER,
  screens TEXT[] DEFAULT '{}',
  event_count INTEGER DEFAULT 0,
  exit_screen TEXT,
  ab_tests TEXT[] DEFAULT '{}'
);

CREATE TABLE ed_performance_metrics (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  session_id TEXT NOT NULL,
  screen TEXT,
  metadata JSONB DEFAULT '{}'
);
```
Add to `.env`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```
Install: `npm install @supabase/supabase-js`

### 2. Define funnels for key user journeys
In `src/lib/analytics.ts` or via the admin panel, define funnels like:
- Onboarding: terms_accept → first_dream → first_share
- Morning flow: wake → mood_check → dream_view → record
- Sleep flow: wind_down → sleep_start → sleep_end → morning_checkin

### 3. Set up A/B tests
Define tests in analytics config, e.g.:
- Morning flow variant: mood_first vs dream_first vs quote_first
- Wind-down: with vs without ambient sounds
- Dream capture: text default vs audio default

### 4. Wire up more event tracking
Key events to add:
- `trackEvent('dream_save', 'dream_save', { category, wordCount })` — when dreams are saved
- `trackEvent('share', 'dream_share', { platform })` — when dreams are shared
- `trackEvent('wearable_sync', 'wearable_sync', { provider })` — wearable data syncs
- `trackEvent('notification_action', 'notification_action', { type, action })` — notification taps

### 5. Admin dashboard enhancements (future)
- Real-time event stream (Supabase real-time subscriptions)
- User cohort analysis
- Retention curves (D1, D7, D30)
- Feature flags integration
- Export to CSV/PDF
- Date range picker for all charts

### 6. Privacy considerations
- Add data retention auto-cleanup (already has 90-day config)
- Add user-facing "Download my data" button (uses existing `exportAnalytics()`)
- Add "Delete all my analytics" button in privacy settings
- Consider IP anonymization before Supabase sync

### 7. Performance budget alerts
Add thresholds in admin dashboard:
- API latency > 5s → alert
- Error rate > 1% → alert
- Page load > 3s → alert
- FPS < 30 → alert
