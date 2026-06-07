# EverDream (Lucid) — Deployment Runbook

End-to-end guide to deploy the demo: **hosted Supabase** backend + the
**Vite/React frontend on Coolify** (Docker).

> This supersedes the older step list. The app lives in the `ed.app.new/`
> subfolder; all paths below are relative to it unless noted.

---

## Architecture & security model

```
[Browser] ──> [nginx (Coolify, Docker)]  serves the static Vite build
   │
   ├─ supabase-js ──> [Supabase Postgres]        (RLS-protected per user)
   └─ functions.invoke ──> [Supabase Edge Functions] ──> [AI providers]
```

**The golden rule for keys:**

| Value | Where it lives | Why |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | **Coolify build args** (public) | Baked into the bundle by design; protected by RLS. |
| `OPENROUTER_API_KEY`, `HF_INFERENCE_API_KEY`, etc. | **Supabase edge-function secrets** (server-side) | Secret. Must **never** be `VITE_*` or they leak into the public JS bundle. |

The Docker build enforces this: it only accepts the two `VITE_SUPABASE_*`
args, and `scripts/assert-no-secrets-in-dist.sh` fails the build if any
provider-key-shaped string ends up in `dist/`.

---

## Prerequisites

- A Supabase project (free tier is fine) — https://supabase.com/dashboard
- Supabase CLI — `npm install -g supabase`
- A Coolify instance with this GitHub repo connected
- API keys for at least: **OpenRouter** (dream analysis) and **HuggingFace**
  (image generation + transcription). Optional fallbacks: Gemini, OpenAI,
  NVIDIA, Fal.

---

## Part 1 — Supabase backend

### 1.1 Get your project credentials
Dashboard → **Project Settings → API**:
- **Project URL** → this is `VITE_SUPABASE_URL` (e.g. `https://<ref>.supabase.co`)
- **anon / public key** → this is `VITE_SUPABASE_ANON_KEY`

> Keep the **service_role key** and the **DB connection string** private —
> they are not needed for this deploy.

### 1.2 Run the database migration
1. Dashboard → **SQL Editor → New query**
2. Paste the entire contents of **`supabase/migrations/001_consolidated_schema.sql`**
3. **Run**. It is idempotent — safe to re-run.
4. Verify in **Table Editor**: you should see **11 tables**
   (`profiles`, `dreams`, `sleep_sessions`, `user_settings`, `nfts`,
   `dream_assets`, `sync_log`, `webhook_events`, `ed_analytics_events`,
   `ed_analytics_sessions`, `ed_performance_metrics`).

### 1.3 Deploy the edge functions (JWT-protected)
```bash
cd ed.app.new
supabase login
supabase link --project-ref <your-project-ref>

# Deploys with verify_jwt = true (from supabase/config.toml).
# Callers must send the anon key as a Bearer token — the browser app does
# this automatically via supabase.functions.invoke().
bash supabase/deploy.sh
```
`deploy.sh` deploys all four functions: `analyze-dream`, `generate-image`,
`transcribe-audio`, `health-check`.

### 1.4 Set the server-side secrets

**What these are:** environment variables attached to your Supabase **edge
functions**. They are stored encrypted on Supabase's platform — *not* in this
repo, *not* in Coolify, and *not* in the browser bundle. Each function reads
them at runtime via `Deno.env.get(...)`.

**Where to run the commands:** on **your own machine** (the same place you ran
`supabase login` / `supabase link` in step 1.3). They use the Supabase CLI to
push the values up to your project over the Supabase API.

> ❗ Do **not** run these on the Coolify server, and do **not** add them as
> Coolify environment variables. Coolify only builds/serves the static
> frontend — it has nothing to do with the edge functions or these keys.
> (Coolify only gets the two public `VITE_SUPABASE_*` values — see Part 2.)

#### Option A — Supabase CLI (recommended)
From `ed.app.new/`, with the project already linked (step 1.3):
```bash
# Required
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...   # dream analysis
supabase secrets set HF_INFERENCE_API_KEY=hf_...        # image + transcription

# Optional analysis fallbacks
supabase secrets set GEMINI_API_KEY=AIza...
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set NVIDIA_API_KEY=nvapi-...

# Optional image fallback
supabase secrets set FAL_AI_KEY=...

supabase secrets list   # confirm what's set (values are masked)
```
You can also load many at once from a file:
`supabase secrets set --env-file ./secrets.env` (keep that file out of git).

#### Option B — Supabase Dashboard (no CLI)
Dashboard → **Edge Functions → Secrets** (a.k.a. *Project Settings → Edge
Functions → Secrets / Environment variables*). Add each name/value pair there
and **Save**.

> Secrets apply to functions that are already deployed — **no redeploy needed**.
> Give it a few seconds to propagate, then re-run the health check in Part 3
> (it reports `degraded` until the required secrets are present).

| Provider | Get a key | Free tier |
|---|---|---|
| OpenRouter | https://openrouter.ai/keys | free models available |
| HuggingFace | https://huggingface.co/settings/tokens | free inference (cold-start delays) |
| Google AI Studio | https://aistudio.google.com/apikey | ~15 req/min free |

### 1.5 Configure Auth URLs (so logins don't redirect to localhost)
Dashboard → **Authentication → URL Configuration**:
- **Site URL**: your Coolify domain, e.g. `https://everdream.example.com`
- **Redirect URLs**: add the same domain (and any preview domains)

The app uses email magic links + anonymous sign-in; without this, magic-link
emails point at `localhost`.

---

## Part 2 — Frontend on Coolify

Create a new **Application** from this Git repo with:

| Setting | Value |
|---|---|
| Build pack | **Dockerfile** |
| Base Directory | **`/ed.app.new`** |
| Dockerfile location | `./Dockerfile` |
| Ports exposed | **80** |
| Branch | your deploy branch |

**Environment variables** — add these and **tick "Build Variable / Build Time"**
(Vite needs them during `npm run build`, not at runtime):

```
VITE_SUPABASE_URL=https://<your-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> ⚠️ Do **not** add any `VITE_*_API_KEY` or `VITE_AI_SERVICE_TOKEN` here.
> Those are server-side secrets (Part 1.4). If added, the build guard will
> fail on purpose.

Then **Deploy**. Coolify builds the image (Vite build → secret guard → nginx)
and serves it on port 80. Point your domain at it and enable HTTPS.

---

## Part 3 — Verify

### Health check (note the auth header — functions require the anon key)
```bash
ANON=eyJ...   # your anon key
curl -s https://<ref>.supabase.co/functions/v1/health-check \
  -H "Authorization: Bearer $ANON" -H "apikey: $ANON" | jq
# expect: {"status":"ok", ...} once secrets are set
```

### Dream analysis
```bash
curl -s -X POST https://<ref>.supabase.co/functions/v1/analyze-dream \
  -H "Authorization: Bearer $ANON" -H "apikey: $ANON" \
  -H "Content-Type: application/json" \
  -d '{"text":"I was flying over a vast, crystal-clear ocean"}' | jq
```

### Smoke test in the browser
1. Open the Coolify URL.
2. Sign in (email magic link or "continue anonymously").
3. Record a dream → it should analyse and (HF cold-start permitting) generate
   an image. The dream should appear in Supabase → Table Editor → `dreams`.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Build fails with "possible secret found" | A `VITE_*_API_KEY` was set as a build arg. Remove it; use Supabase secrets instead. |
| Edge function returns 401 | Missing/expired JWT. The browser sends it automatically; for curl pass `Authorization: Bearer <anon>` + `apikey`. |
| Edge function returns 500/`degraded` | Secret not set. `supabase secrets list`; check Dashboard → Edge Functions → Logs. |
| Magic-link email opens `localhost` | Set Auth **Site URL** / **Redirect URLs** (Part 1.5). |
| Image gen slow/failing first time | HuggingFace model cold-start; the function retries. Set `FAL_AI_KEY` for a faster fallback. |
| RLS / empty data | Ensure the migration ran fully; "auto-enable RLS on new tables" is on, and every table ships policies. |

---

## Notes on what runs in the demo
The core flow — record → analyse → image — runs entirely through the
JWT-protected edge functions, so no provider keys touch the frontend.
Advanced 3D-asset / 360° skybox features rely on **client-side** keys
(`VITE_HF_INFERENCE_API_KEY`, `VITE_BLOCKADE_LABS_API_KEY`, …) and are
intentionally left inert in this deploy to avoid baking secrets into the
bundle. Re-enabling them safely would mean routing those calls through an
edge function too (recommended future work).
