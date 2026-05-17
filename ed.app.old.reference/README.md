# Everdream: Dream Capture & NFT Proof Platform

A mobile-first platform for capturing dreams, receiving AI-powered reflections, and minting Soul-Bound Tokens (SBTs) as cryptographic proof of creative experiences.

## Architecture Overview

**Everdream** is a local-first application with optional cloud sync and blockchain integration:

- **Frontend**: React Native mobile app (`everdream-mobile/`) built with Expo for iOS & Android
- **Backend**: Supabase Edge Functions (`supabase/functions/`) for AI reflection, NFT minting, and sync orchestration
- **Storage**: Local SQLite for on-device data + optional encrypted cloud backup
- **Web Demo**: Legacy web prototype (`index.html`, `app.js`) for rapid iteration and testing
- **Integration**: Discord webhook relay and wearable device sync support

## What's Included

### Mobile Application (`everdream-mobile/`)
- **CaptureScreen**: Zero-friction dream narration interface
- **EmotionStudio**: Mood mapping and valence confirmation with emotion wheel
- **AIVerifyScreen**: AI-generated reflection display for user confirmation
- **XPScoringScreen**: Transparent scoring algorithm visualization
- **NFTMintScreen**: Soul-Bound Token minting via Thirdweb
- **SleepTrackerScreen**: Wearable integration and sleep data synthesis
- **Local Sync**: Encrypted data persistence with cloud backup option

### Backend (`supabase/`)
- **ai-proxy**: Qwen LLM integration for dream reflection generation
- **nft-mint**: Thirdweb SBT contract interaction on Polygon Amoy
- **sync-processor**: Cloud sync and conflict resolution
- **wearable-sync**: Integration with sleep/biometric data streams

### Data Directory (`data/`)
- Discord event logs and analytics
- Sample dream data for testing

### Documentation (`docs/`)
- `everdream-go-live.md`: Complete deployment guide (Supabase + mobile build + contract setup)
- `product-brief.md`: Product vision and user flows
- `integration-map.md`: Roadmap including future BCI and zk-proof features
- Other implementation specs and test cases

## Quick Start

### Web Prototype (Development/Testing)
```bash
npm start
# Opens http://localhost:4173
```

### Mobile App (iOS & Android)
```bash
cd everdream-mobile
npm install
npm run typecheck
npx expo start
```

Press `i` for iOS simulator or `a` for Android emulator.

## Deployment

### Development to Production
See `docs/everdream-go-live.md` for complete deployment steps:
1. **Supabase Setup**: Create project, deploy migrations & functions
2. **Thirdweb Contract**: Deploy SBT contract on Polygon Amoy
3. **Mobile Environment**: Configure Supabase credentials in `.env`
4. **Native Builds**: Use EAS to build Android APK and iOS IPA for testers
5. **App Stores**: Submit to Apple App Store and Google Play Console

### Required Secrets
- Qwen AI API credentials
- Thirdweb contract & wallet keys
- Supabase project URL and anon key

## Current Functionality (Phase 1)

- ✅ Text/voice dream capture
- ✅ AI-powered reflection & projection
- ✅ User resonance confirmation
- ✅ Transparent XP scoring algorithm
- ✅ Emotion mapping (emotion wheel)
- ✅ Local encrypted storage
- ✅ SBT minting via Thirdweb
- ✅ Wearable data sync (architecture)
- ✅ Cloud sync infrastructure

## Future Roadmap (Phase 2+)

- 🔄 Brain-Computer Interface (BCI) capture
- 🔄 Zero-knowledge proof credentials
- 🔄 Cross-chain token bridging
- 🔄 Collaborative dream journaling
- 🔄 Sleep stage correlation
- 🔄 Community analytics & insights

See `docs/integration-map.md` for full technical roadmap.

## Project Structure
```
everdream-mobile/      # Mobile app (Expo + React Native + TypeScript)
supabase/              # Backend (Edge Functions + migrations)
discord/               # Discord webhook integration
docs/                  # Implementation guides and specs
data/                  # Sample data and event logs
index.html, app.js     # Web prototype for testing
server.js              # Simple Node.js dev server
```
