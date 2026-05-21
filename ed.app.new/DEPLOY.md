# EverDream — Deployment Guide

## Prerequisites

1. **Supabase Account** — Create one at https://supabase.com (free tier)
2. **Supabase CLI** — `npm install -g supabase`
3. **Deno** — For local edge function testing (optional)

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Create a new project
3. Note your **Project URL** and **Anon Key** (Settings > API)

## Step 2: Configure Environment

Edit `.env` in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## Step 3: Run Database Migration

1. Open Supabase Studio (https://supabase.com/dashboard/project/YOUR_PROJECT)
2. Go to **SQL Editor**
3. Copy the contents of `supabase/migrations/001_everdream_complete_setup.sql`
4. Paste and run it
5. Verify: You should see "EverDream schema: 8 / 8 tables created"

## Step 4: Deploy Edge Functions

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all edge functions
cd supabase/functions

# Deploy analyze-dream
supabase functions deploy analyze-dream

# Deploy generate-image
supabase functions deploy generate-image

# Deploy transcribe-audio
supabase functions deploy transcribe-audio

# Deploy health-check
supabase functions deploy health-check
```

## Step 5: Set API Key Secrets

```bash
# Required for analyze-dream (primary AI provider)
supabase secrets set OPENROUTER_API_KEY=sk-or-your-key-here

# Optional: Additional AI providers for fallback
supabase secrets set GEMINI_API_KEY=your-gemini-key
supabase secrets set OPENAI_API_KEY=your-openai-key
supabase secrets set ANTHROPIC_API_KEY=your-anthropic-key

# Optional: For transcription
supabase secrets set HF_INFERENCE_API_KEY=your-hf-key
```

### Getting API Keys (Free Tiers)

| Provider | URL | Free Tier |
|----------|-----|-----------|
| OpenRouter | https://openrouter.ai/keys | Free models available |
| Google AI Studio | https://aistudio.google.com/apikey | 15 req/min free |
| HuggingFace | https://huggingface.co/settings/tokens | Free inference API |

## Step 6: Verify Deployment

```bash
# Test analyze-dream
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/analyze-dream \
  -H "Content-Type: application/json" \
  -d '{"text": "I was flying over a vast ocean, the water below was crystal clear"}'

# Test generate-image
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/generate-image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A surreal dreamscape with floating islands", "style": "dreamlike"}'

# Test health check
curl https://YOUR_PROJECT.supabase.co/functions/v1/health-check
```

## Step 7: Run the App

```bash
cd /mnt/c/Users/xaeli/Documents/GitHub/EDI/EverDream/ed.app.new
npm run dev
```

Open http://localhost:5173

## Troubleshooting

### Edge function returns 500
- Check secrets are set: `supabase secrets list`
- Check function logs: Supabase Dashboard > Edge Functions > Logs

### CORS errors
- All edge functions include CORS headers
- If using a custom domain, add it to `CORS_HEADERS` in each function

### Database RLS errors
- Ensure the migration ran completely
- Check RLS policies: Supabase Dashboard > Table Editor > dreams > RLS

### Rate limiting
- OpenRouter free tier: ~200 req/day
- Pollinations: Unlimited (but be respectful)
- HuggingFace: Free tier has model loading delays

## Architecture

```
[Browser] → [Vite Dev Server] → [Supabase Edge Functions] → [AI Providers]
                ↓
           [Supabase Client] → [Supabase Database]
                ↓
           [Local Storage] (wallet, NFTs, offline cache)
```

## Edge Function Provider Fallback (analyze-dream)

1. OpenRouter (free models) → 2. Pollinations Text → 3. Gemini → 4. OpenAI → 5. Claude

If all providers fail, a fallback analysis is returned with the raw dream text.
