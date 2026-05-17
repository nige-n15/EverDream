# Everdream Go-Live Runbook

This is the shortest path from the current local MVP to a tester build on a phone.

## 1. Supabase Production Project

Create a Supabase project, then from the repo root run:

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase db push --dry-run
supabase db push
supabase functions deploy
```

Set the required function secrets:

```bash
supabase secrets set QWEN_API_URL=https://your-qwen-endpoint
supabase secrets set QWEN_API_KEY=your-qwen-key
supabase secrets set QWEN_MODEL=qwen2.5-7b-instruct
supabase secrets set THIRDWEB_SECRET_KEY=your-thirdweb-secret
supabase secrets set THIRDWEB_MINTER_PRIVATE_KEY=your-minter-private-key
supabase secrets set THIRDWEB_CONTRACT_ADDRESS=your-sbt-contract
supabase secrets set THIRDWEB_CHAIN=amoy
```

Useful references:

- Supabase migrations: https://supabase.com/docs/reference/cli/v1/supabase-db-push
- Supabase Edge Function deploys: https://supabase.com/docs/guides/functions/deploy
- Supabase secrets: https://supabase.com/docs/guides/functions

## 2. Thirdweb Contract

Deploy the Everdream SBT contract on Polygon Amoy first. Amoy replaces Mumbai for current Polygon PoS testnet work.

Minimum live secrets needed by `nft-mint`:

- `THIRDWEB_SECRET_KEY`
- `THIRDWEB_MINTER_PRIVATE_KEY`
- `THIRDWEB_CONTRACT_ADDRESS`
- `THIRDWEB_CHAIN=amoy`

Reference: https://thirdweb.com/polygon-amoy-testnet

## 3. Mobile App Environment

Create `everdream-mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

For EAS cloud builds, add the same `EXPO_PUBLIC_` variables in the Expo dashboard or via:

```bash
eas env:create --environment production --visibility plaintext --name EXPO_PUBLIC_SUPABASE_URL --value https://your-project-ref.supabase.co
eas env:create --environment production --visibility plaintext --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-supabase-anon-key
```

Reference: https://docs.expo.dev/eas/environment-variables

## 4. Native Tester Build

From `everdream-mobile/`:

```bash
npm install
npm run typecheck
npx expo-doctor
npm install -g eas-cli
eas login
eas build:configure
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

The checked-in `eas.json` already has development, preview, and production profiles. Android preview creates an APK for fast tester sharing.

References:

- EAS build setup: https://docs.expo.dev/build/setup/
- `eas.json` build profiles: https://docs.expo.dev/build/eas-json/

## 5. App Store Release

After testers validate capture, verification, scoring, and minting:

```bash
eas build --profile production --platform all
eas submit --profile production --platform all --latest
```

You will still need Apple Developer and Google Play Console accounts, app icons/screenshots, privacy policy, support URL, and store copy.

Reference: https://docs.expo.dev/deploy/submit-to-app-stores/

## Launch Gate

Do not invite the 100-user pilot until these are true:

- Supabase RLS policies are tested with two real users.
- `ai-proxy`, `sync-processor`, `wearable-sync`, and `nft-mint` deploy and respond in production.
- The Thirdweb SBT mints on Amoy with a real wallet in `profiles.wallet_address`.
- A preview APK/TestFlight build captures a dream offline, reconnects, verifies, scores, and mints.
- Privacy policy explains local encryption, Supabase storage, AI processing, and public NFT metadata.
