# Everdream Supabase Backend

This folder holds the Supabase-first backend contract for Everdream: schema, RLS, storage, edge functions, and the mobile-side utilities that speak to them.

## What is here

- `migrations/001_initial_schema.sql`: tables and constraints
- `migrations/002_rls_policies.sql`: row-level security
- `migrations/003_storage_buckets.sql`: bucket setup and object policies
- `migrations/004_indexes.sql`: hot-path indexes
- `migrations/005_functions.sql`: profile bootstrap, XP math, privacy checks, timestamps, and rate limiting
- `functions/`: Supabase Edge Functions for AI, sync, wearables, and NFT minting

## Secrets

Set these in Supabase before deploying functions:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `QWEN_API_URL`
- `QWEN_API_KEY`
- `QWEN_MODEL`
- `THIRDWEB_SECRET_KEY`
- `THIRDWEB_MINTER_PRIVATE_KEY`
- `THIRDWEB_CONTRACT_ADDRESS`
- `THIRDWEB_CHAIN`
- `NFT_WEBHOOK_URL` (optional)

## Mobile env

Set these in `everdream-mobile/.env`:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Deployment

```bash
npm install -g supabase
supabase link --project-ref your-project-ref
supabase db push
supabase functions deploy ai-proxy
supabase functions deploy sync-processor
supabase functions deploy wearable-sync
supabase functions deploy nft-mint
supabase secrets set QWEN_API_URL=https://your-qwen-endpoint
supabase secrets set QWEN_API_KEY=your_key
supabase secrets set THIRDWEB_SECRET_KEY=your_key
supabase secrets set THIRDWEB_MINTER_PRIVATE_KEY=your_private_key
supabase secrets set THIRDWEB_CONTRACT_ADDRESS=0xYourContract
supabase secrets set THIRDWEB_CHAIN=amoy
```

## Current network note

The schema and mint function use Polygon `amoy` for testnet work. Polygon deprecated Mumbai on April 13, 2024, so keeping `mumbai` in new infrastructure would leave the staging path stranded.
