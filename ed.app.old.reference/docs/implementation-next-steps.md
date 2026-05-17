# Echo / Everdream Implementation Next Steps

## Starting point

The latest mockup defines a strong user-facing product:

- a zero-friction capture flow
- optional refinement after save
- a gentle reflection model
- a future `Sleep` surface in the navigation

That means the core work now is not more concepting. It is architecture and sequencing.

## Recommendation in one sentence

Build the app as a local-first Flutter product with strict service interfaces, optional encrypted cloud sync, and wearable integrations only after the capture + storage system is stable.

## 1. Lock the implementation boundary first

Do this before writing more UI:

- Keep the mockup flow as the product truth.
- Keep the earlier `echo_spec_v1.md` as scope truth for the MVP.
- Add explicit interfaces for:
  - audio capture
  - speech transcription
  - dream storage
  - reflection generation
  - sync
  - wearable ingestion

Recommended rule:

- The UI should never know whether data came from local device APIs, cloud APIs, or mock data.

## 2. Storage architecture: local is canonical

### On-device

Use local storage as the source of truth.

- Structured data:
  - SQLite for entries, timestamps, valence, tags, reflection state, sync state, wearable summaries
- File assets:
  - store raw audio files separately in the app data directory
- Search:
  - implement text search against local indexed text
- Secrets:
  - store encryption keys / tokens in OS secure storage only

Recommended local model:

- `dream_entries`
- `dream_assets`
- `dream_reflections`
- `wearable_sessions`
- `sync_queue`
- `devices`

Why:

- you already need filtering, timestamps, history, and eventually calendar / sleep views
- SQLite will age better than a pure key-value store once search, migration, and sync get real

### Cloud

Cloud should be optional and should never be the only copy.

- Default mode:
  - local only
- Opt-in mode:
  - encrypted sync backup
- Cloud stores:
  - encrypted entry payloads
  - encrypted audio blobs
  - minimal sync metadata
- Cloud should not need plaintext dream content to function

Recommended posture:

- client-side encrypt dream content before upload
- use authenticated sync only for users who explicitly enable it
- keep row-level access controls on the server even if content is encrypted

## 3. API and integration order

### Phase A: no-cloud MVP

Ship these first:

- local audio capture
- speech-to-text
- local save
- local list / search / delete
- optional local reflection generation or mocked reflection output

Goal:

- prove the capture loop works every morning without network dependency

### Phase B: reflection service boundary

Add a `ReflectionProvider` interface with two adapters:

- local / mocked adapter for development
- hosted adapter for production experiments

This protects the product from provider churn and lets you keep the mockup tone stable.

Do not hardwire the UI to one LLM vendor.

### Phase C: opt-in encrypted sync

Only after the local flow is stable:

- add account creation for sync users
- add encrypted upload / download
- add background sync queue
- add conflict handling by version or append-only event log

### Phase D: wearable ingestion

Only after storage and sync are stable:

- add `WearableProvider`
- start with sleep summaries, not raw continuous streams
- normalize all incoming wearable data into one internal schema

## 4. Wearables: correct order

Recommended order:

1. Apple HealthKit and Android Health Connect
2. Oura
3. WHOOP
4. Everything else

Reason:

- HealthKit and Health Connect are the cleanest user-permissioned aggregation layers on mobile
- Oura and WHOOP are useful, but they are cloud OAuth integrations, not purely on-device integrations
- Windows desktop is not the right place to do first-class wearable integration

Practical rule:

- for the Windows-first prototype, keep the `Sleep` area presentational or fed by mock / imported data
- ship real wearable reads when the mobile app exists

## 5. Proposed service contract

Use interfaces like:

- `DreamRepository`
- `AudioRecorder`
- `TranscriptionService`
- `ReflectionService`
- `SyncService`
- `WearableService`

Each should return app-native models, never vendor-native payloads.

That lets you swap:

- speech provider
- LLM provider
- cloud backend
- wearable source

without rewriting the UI.

## 6. Concrete next steps

### Next 7 days

- Freeze the MVP scope to capture, save, list, delete, search, valence
- Choose the local database and key management approach
- Define the app data model and service interfaces
- Convert the mockup into a Flutter screen map and component list

### Next build milestone

- Implement `DreamRepository` with local persistence
- Implement `AudioRecorder`
- Implement `TranscriptionService`
- Build the `Dreams`, `Recording`, and `Dream Held` screens from the mockup
- Add failure handling for mic permissions and transcription errors

### After first usable build

- Add optional refinement panel
- Add reflection service behind an adapter
- Add export
- Add encrypted sync

### After that

- Build mobile clients
- Add HealthKit / Health Connect
- Only then add Oura / WHOOP connectors

## 7. Decision summary

- Canonical data lives on device.
- Cloud is backup / sync, not the primary store.
- Reflection and sync must be replaceable adapters.
- Wearables are a later mobile feature, not a Windows MVP dependency.
- The next risk to solve is storage design, not visual design.
