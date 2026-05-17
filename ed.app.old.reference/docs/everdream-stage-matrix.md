# Everdream MVP Stage Matrix

Status key:

- `Built`: implemented in the current repo scaffold
- `Planned`: intentionally next or partially scaffolded, but not end-to-end yet
- `Not Built`: not started in code yet

| Area | Scope from brief | Status | Notes |
| --- | --- | --- | --- |
| Project scaffold | Expo TypeScript app | Built | `everdream-mobile/` exists and compiles. |
| Project scaffold | Supabase backend contract | Built | Migrations, RLS, storage, and edge functions are scaffolded in `supabase/`. |
| State layer | Zustand store + sync queue | Built | `useDreamStore` and `useSyncQueue` handle local-first saves and replay. |
| Dream capture | Text entry | Built | Text dreams save locally and queue for sync. |
| Dream capture | Video capture | Built | Real device recording is wired with `expo-camera`; encrypted local save path is in place. |
| Dream capture | Audio capture | Built | Real voice memo recording is wired with `expo-audio`; encrypted local save path is in place. |
| Dream capture | Local encryption | Built | AES-GCM utilities and device-bound key flow are implemented. |
| Dream capture | Timestamp binding | Built | Capture metadata includes a deterministic timestamp hash. |
| Dream capture | Default wake flow UI | Built | `CaptureScreen` is mounted as the current app entry. |
| AI verification | Qwen edge proxy | Built | `supabase/functions/ai-proxy` exists. |
| AI verification | N-I-C loop UI | Built | `AIVerifyScreen` runs projection, shows themes/summary/tone, and saves confirmation metadata. |
| AI verification | Emotional tone confirmation | Built | Valence, arousal, and resonance controls save back to the selected dream. |
| AI verification | Clarifying A/B prompts | Planned | Core confirmation is built; optional skippable disambiguation prompts can come after pilot feedback. |
| XP scoring | DB function | Built | `calculate_xp_score` exists in SQL migrations. |
| XP scoring | Client-side scoring display | Built | `XPScoringScreen` computes and saves V_XAEL with visible breakdown inputs. |
| Sleep tracker | Data model | Built | `sleep_sessions` schema and sync shape exist. |
| Sleep tracker | Wearable ingest endpoint | Built | `wearable-sync` edge function exists. |
| Sleep tracker | Calendar view | Built | `SleepTrackerScreen` includes a recent-night selector and visual score timeline. |
| Sleep tracker | Manual sleep entry | Built | Sleep-stage steppers and note editing are live in the current UI. |
| NFT minting | Contract scaffold | Built | Contract direction and mint function integration are scaffolded. |
| NFT minting | Mint edge function | Built | `supabase/functions/nft-mint` exists. |
| NFT minting | Mint UI | Built | `NFTMintScreen` provides metadata preview, license controls, real edge-function minting, and local proof mode before secrets are configured. |
| NFT minting | Embedded wallet flow | Not Built | Thirdweb auth/web3 wallet UX is not integrated yet. |
| Emotion wheel | Emotion selector UI | Built | `EmotionStudioScreen` and `EmotionWheel` are implemented. |
| Mood tracking | Twice-daily check-ins | Built | Morning/evening check-in UI and local persistence are in place. |
| Profile/settings | Profile schema | Built | `profiles` table and privacy settings exist. |
| Profile/settings | Profile screen | Built | `ProfileSettingsScreen` is implemented with privacy, identity, and wearable sections. |
| Profile/settings | Biometric app lock | Built | Settings toggle and preference flow are present; enforcement still needs routing/app-lock behavior. |
| Profile/settings | 2FA | Not Built | No auth hardening flow yet. |
| Offline-first | Dream save offline | Built | Current capture flow works local-first. |
| Offline-first | Sync replay | Built | `sync-processor` plus queue replay logic exist. |
| Offline-first | Pending AI/NFT queue UX | Planned | Core dream sync exists; AI/mint actions have visible local fallback states but no durable job queue yet. |
| Testing | TypeScript sanity | Built | Mobile app passes `npm run typecheck`. |
| Testing | RLS and sync test plan | Built | Test cases are documented in `docs/everdream-supabase-test-cases.md`. |
| Testing | Automated tests | Not Built | No runnable test suite yet. |
| Deployment | Native build config | Built | `app.json` has native identifiers and `eas.json` has development, preview, and production profiles. |
| Deployment | Go-live runbook | Built | `docs/everdream-go-live.md` covers Supabase, Thirdweb, EAS, and store release gates. |

## Recommended next build order

1. Run the app on a physical Android/iOS device and check the capture-to-mint visual flow.
2. Connect a real Supabase project, push migrations, and deploy all edge functions.
3. Deploy the SBT contract on Polygon Amoy and set Thirdweb function secrets.
4. Add Supabase Auth/profile onboarding so wallet address is written to `profiles`.
5. Add automated tests for RLS, sync replay, encryption round-trip, and edge-function failures.
6. Build a preview APK/TestFlight build with EAS and invite the first internal testers.
