# Everdream Supabase Stages

This breaks the Supabase migration into small slices we can build, test, and ship without the mobile client drifting away from the backend contract.

## Stage 1: Foundation

- Goal: establish the database contract, profile bootstrap, RLS baseline, and storage buckets.
- Deliverables:
  - `supabase/migrations/001_initial_schema.sql`
  - `supabase/migrations/002_rls_policies.sql`
  - `supabase/migrations/003_storage_buckets.sql`
  - `supabase/migrations/004_indexes.sql`
  - `supabase/migrations/005_functions.sql`
- Notes:
  - The schema uses `amoy` for the Polygon testnet because Polygon deprecated Mumbai on April 13, 2024 and moved PoS testing to Amoy.
  - `profiles` auto-bootstrap from `auth.users` via a trigger, so the app does not have to race profile creation on first sign-in.
- Exit criteria:
  - `supabase db push` succeeds.
  - A new auth user automatically gets a `profiles` row.
  - RLS blocks cross-user reads and writes for `dreams`, `sleep_sessions`, and `sync_queue`.

## Stage 2: Client Auth And Typed Access

- Goal: give the Expo app a stable Supabase client, typed database access, and environment shape.
- Deliverables:
  - `everdream-mobile/src/types/database.ts`
  - `everdream-mobile/src/lib/supabaseClient.ts`
  - `everdream-mobile/.env.example`
- Notes:
  - React Native session persistence uses `@react-native-async-storage/async-storage`.
  - The client is configured for Expo mobile and web, with URL polyfills and AppState-driven token refresh.
- Exit criteria:
  - The app can sign in and `supabase.auth.getUser()` returns a user.
  - Reads against `profiles` and `dreams` typecheck against the generated interfaces.

## Stage 3: Offline Dream Sync

- Goal: make dream creation resilient when the device is offline.
- Deliverables:
  - `everdream-mobile/src/utils/localDb.ts`
  - `everdream-mobile/src/store/useDreamStore.ts`
  - `everdream-mobile/src/hooks/useSyncQueue.ts`
- Notes:
  - Web uses `idb-keyval`; native falls back to AsyncStorage because Expo native does not expose IndexedDB.
  - Queue replay is FIFO with last-write-wins based on `updated_at`.
- Exit criteria:
  - Add, update, and delete work offline and rehydrate locally.
  - Reconnect triggers `sync-processor` and clears successful queue entries.

## Stage 4: Edge Compute

- Goal: move privileged work into Supabase Edge Functions.
- Deliverables:
  - `supabase/functions/ai-proxy`
  - `supabase/functions/sync-processor`
  - `supabase/functions/wearable-sync`
- Notes:
  - `ai-proxy` uses a DB-backed rate limit function.
  - `sync-processor` is the conflict-resolution point, not the mobile client.
- Exit criteria:
  - AI requests require auth and reject over-limit callers.
  - Replayed queue entries update both the record tables and `sync_queue`.

## Stage 5: NFT Mint And Hardening

- Goal: make minting and auditability production-shaped.
- Deliverables:
  - `supabase/functions/nft-mint`
  - storage path policies
  - test cases in `docs/everdream-supabase-test-cases.md`
- Notes:
  - Minting uses thirdweb server-side credentials in the edge runtime.
  - `nft_registry` stays world-readable while dream narratives remain behind RLS unless shared.
- Exit criteria:
  - A verified dream can mint on Amoy or Polygon and update both `dreams` and `nft_registry`.
  - Failed mints leave a recoverable audit trail instead of partial state.
