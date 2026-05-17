# Everdream Supabase Test Cases

## RLS

- Profile read: authenticated user A can select user B from `profiles`.
- Profile update block: authenticated user A cannot update user B's nickname.
- Dream private read block: authenticated user A cannot select user B's `privacy = 'private'` dream.
- Dream shared read allow: authenticated user A can select user B's `privacy = 'copyleft'` dream.
- Sleep session isolation: authenticated user A cannot read or update user B's `sleep_sessions`.
- Sync queue isolation: authenticated user A cannot read or mutate user B's `sync_queue`.
- NFT registry public read: anonymous and authenticated users can select from `nft_registry`.

## Sync Queue

- Offline create: add a dream while offline and verify it lands in local storage and queue.
- Offline update collapse: update the same dream twice offline and verify the newest `updated_at` wins during sync.
- Offline delete: delete a queued dream offline and verify the server row is deleted on reconnect.
- Server newer conflict: create an older queued update than the current remote row and verify the remote row is kept.
- Retry path: simulate a failing `sync-processor` call and verify `retry_count` increments with backoff.

## Encryption

- Key derivation: biometric prompt succeeds and returns a reusable AES-GCM key.
- Encrypt/decrypt round-trip: encrypt a `Blob`, decrypt it, and verify byte-for-byte equality.
- Missing Web Crypto: surface a descriptive error when `crypto.subtle` is unavailable.
- Device key persistence: derive a key twice for the same user and verify the stored device seed is reused.

## Edge Functions

- AI validation: reject empty narratives, oversized narratives, and unsupported media types.
- AI rate limit: exceed the configured request window and verify the function returns HTTP 429.
- NFT ownership: reject mint attempts where the caller does not own the dream.
- Sync auth: reject `sync-processor` when no valid Supabase JWT is present.
- Wearable parser: reject unsupported providers and malformed payloads with HTTP 400.
