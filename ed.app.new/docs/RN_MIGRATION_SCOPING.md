# EverDream → React Native / Expo — Migration Scoping

A grounded estimate for a faithful native rewrite of the current Vite/React web
app into React Native (Expo). Numbers are person-weeks for **one developer**;
add ~30–50% if learning RN in parallel (flagged per area).

---

## 1. What we're porting (measured)

| Area | LOC | Nature | Portability |
|---|---:|---|---|
| `DreamJournalApp.tsx` (single root file) | 3,056 | routing + state + glue | 🔴 decompose & rewrite |
| `components/` (17 sub-areas) | ~19,900 | the UI | 🔴 rewrite (DOM→RN, Tailwind→styles) |
| `screens/` | ~2,000 | newer screen layer | 🟠 rewrite UI, keep logic |
| `lib/` | ~16,200 | business logic, API, analysis | 🟢 mostly port as-is |
| `modules/sleep/` | ~3,600 | sleep/asset logic | 🟡 port, swap audio + puter |
| `utils/` | ~1,460 | helpers | 🟢 port as-is |
| `hooks/` | ~1,120 | React hooks | 🟡 port; swap web APIs |
| `contexts/` | 80 | auth/skin/toast | 🟢 port as-is |
| **Total** | **~47,400** | | |

Legend: 🟢 port with minor edits · 🟡 adapt (swap a web API) · 🟠 UI rewrite, logic kept · 🔴 full rewrite

---

## 2. The good news (de-risks the estimate)

- **No heavy state library** — just React Context (auth, skin, toast). Maps 1:1 to RN. No Redux/Zustand migration.
- **`supabase-js` runs natively in RN** — your entire data layer, auth, and `functions.invoke()` calls port unchanged. The backend work we just did carries over wholesale.
- **The hard web-only libs are isolated**, not woven through:
  - **three.js / WebXR** → only `components/vr/VRHome.tsx` (817 LOC) + `WebXRViewer.tsx`.
  - **face-api.js** → only `components/face/FacialEmotionDetector.tsx`.
  - **puter-sdk** → 3 files in the asset generator.
- **A real design-system already exists** (`components/ui/`: Button, Card, Input, Modal, Toast, Spinner, Badge, EmptyState, ErrorBanner). Port these ~10 primitives once → every screen consumes them. This is your highest-leverage first task.
- **Business logic (`lib/`, `utils/`) is framework-agnostic TS** — analysis pipeline, scoring, API wrappers, analytics. Strip DOM refs and it runs.

---

## 3. The expensive bits (where the months go)

### 3a. UI rewrite — the dominant cost (~50–60% of total)
~22k LOC of components use the DOM (`div`/`span`), **Tailwind classes in 53 files**, web events, and CSS layout. None of that exists in RN. Every screen is rebuilt with `View`/`Text`/`Pressable`/`FlatList` and a styling system.
- **Styling decision:** adopt **NativeWind** (Tailwind-for-RN) to preserve the existing class-based styling muscle memory and reduce churn — otherwise it's StyleSheet objects for all 53 files.
- `DreamJournalApp.tsx` (3,056 LOC) must be **decomposed** into a navigator + screens before porting — it's currently doing routing, state, audio, and rendering in one file.
- **Estimate: 9–13 weeks.**

### 3b. Navigation (~1 week)
Custom hash routing (`useHashRoute`) + `Shell.tsx` → **React Navigation** (stack + tabs). Mechanical but touches every screen entry. Auth gating (`ProtectedRoute.tsx`) → a navigation guard.

### 3c. Persistence layer (~1.5–2 weeks)
- `localStorage` in **20 files** → `AsyncStorage` or **MMKV** (sync, faster — closer to localStorage semantics). A thin `storage` shim keeps call-sites unchanged.
- `indexedDB` in **3 files** (incl. `lib/storage/indexedDB.ts`, 652 LOC) → **SQLite** (`expo-sqlite`/`op-sqlite`) or WatermelonDB. This is the trickiest data port (offline cache / query semantics differ).

### 3d. Audio capture + transcription (~1.5–2 weeks)
Dream capture is core and spread across ~10 files (`audioRecorder.ts`, `WindDownFlow`, `VideoCaptureFlow`, `transcriptionWhisper.ts`). `MediaRecorder`/`getUserMedia` → **expo-av** / `react-native-audio-recorder-player`. Transcription itself already goes server-side via the `transcribe-audio` edge function (✅ reuse), but you send recorded file bytes natively instead of a browser Blob.

### 3e. 3D / VR (`VRHome` + `WebXRViewer`) — specialist, ~3–5 weeks **or cut**
- `three`/`react-three-fiber` can run on RN via **expo-gl + @react-three/fiber/native**, so the *scene* is portable with effort.
- **WebXR has no React Native equivalent.** The immersive XR path must be re-architected (e.g. ViroReact / a 3D non-XR viewer) or dropped.
- **Recommendation: cut from v1.** It's the highest risk/lowest-table-stakes feature for a journaling app and it's cleanly isolated. Revisit as a v1.x.

### 3f. Face / emotion detection (`FacialEmotionDetector`) — ~1–2 weeks **or cut**
`face-api.js` is browser/WebGL/DOM-bound — won't run in RN. Replace with **react-native-vision-camera + a frame processor** (MediaPipe/ML Kit face model). **Recommendation: cut or stub for v1** unless it's a headline feature.

### 3g. Asset generator / puter-sdk (~1 week)
`puter-sdk` is a browser SDK. Route those generations through an edge function (consistent with the key-safety architecture) or drop the puter path and rely on the existing `generate-image` function.

### 3h. PWA layer → delete (saves time)
Service worker, `vite-plugin-pwa`, web manifest, install prompts — all N/A in RN. Offline is handled by your SQLite/MMKV layer instead.

---

## 4. Store-readiness work (applies once, ~3–4 weeks total)

Independent of the port, required before submission:
- **Deep-link auth:** Supabase magic-link/OAuth → custom URL scheme + Universal Links / App Links (native config + `Linking` handling).
- **Native permissions & strings:** mic (audio dreams), camera (if face kept), notifications, health.
- **HealthKit / Health Connect** if you want real sleep data (sleep tracking is in the app today via `wearables.ts`, 1,445 LOC — currently web/manual; native health is a meaningful new integration: ~1–2 wks).
- **Account deletion in-app** (Apple 5.1.1(v)) — needs a delete-account flow + an edge function to purge user rows.
- **Privacy:** policy, App Privacy labels, sensitive-data handling (mental-health journal).
- **App icons, splash, push notifications** (a strong native-value signal for review).
- **Signing/CI:** EAS Build + EAS Submit; Apple Developer + Play Console accounts.

🔑 **Re-confirm no provider keys ship in the binary.** A mobile app is unpackable; the edge-function architecture we built is exactly right — just ensure none of the client-side `VITE_*_API_KEY` fallback paths get bundled.

---

## 5. Phased roadmap & estimate

| Phase | Scope | Weeks |
|---|---|---:|
| 0. Foundation | Expo app, EAS, React Navigation, NativeWind, port `components/ui` (10 primitives), theming/skins, auth context, supabase client, storage shim | 3–4 |
| 1. Data & logic | Port `lib/` + `utils/` + `modules/` (strip DOM, swap storage/audio), SQLite migration | 4–6 |
| 2. Core screens | Decompose `DreamJournalApp`, port journaling/capture/list/detail, mood, onboarding, settings | 6–9 |
| 3. Audio capture | Native recording + wire to `transcribe-audio` | 1.5–2 |
| 4. Secondary screens | tracker, studio, admin, wearables, sleep flows | 3–4 |
| 5. Native value-add | push, deep-link auth, HealthKit, account deletion, biometrics | 3–4 |
| 6. Store prep | icons/splash, privacy, signing, submission + review iterations | 2–3 |
| **v1 subtotal (VR + face *cut*)** | | **~22.5–32 wks** |
| (Optional) 3D/VR re-architecture | expo-gl scene, drop WebXR | +3–5 |
| (Optional) Native face/emotion | vision-camera + ML Kit | +1–2 |

**Realistic v1: ~5.5–7.5 months solo** (faithful port, VR + face deferred).
With RN learning overhead, lean toward the upper end; with an experienced RN dev and aggressive scoping, the lower.

---

## 6. Recommendations

1. **Cut VR (WebXR) and face-detection from v1.** Both are isolated, high-effort, low-table-stakes. This removes the two riskiest items and shaves ~4–7 weeks.
2. **Lead with the design system** (`components/ui`) + navigation + auth — you get a runnable skeleton fast and learn RN on low-risk surface area.
3. **Use NativeWind** to keep the Tailwind mental model and minimise styling churn across 53 files.
4. **Keep the Supabase backend exactly as-is** — it's the part that ports for free and we've already hardened it.
5. **Refactor `DreamJournalApp.tsx` first** (decompose the 3k-line root) — do it in the *web* app if you like, so the split is validated before porting.

## 7. As an RN upskilling exercise
Good learning surfaces (low risk): the `ui/` primitives, navigation, NativeWind styling, AsyncStorage/MMKV, supabase-js in RN, EAS Build.
Advanced/specialist (not beginner): the SQLite/offline port, expo-gl + three (if VR kept), vision-camera frame processors, HealthKit, deep-link auth. Sequence the team's ramp accordingly.
