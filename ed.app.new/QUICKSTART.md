# EverDream — Quick Start Guide

## Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

## Setup

### 1. Install Dependencies
```bash
cd ed.app.new
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Create Database Tables
Run the SQL in `supabase/migrations/001_consolidated_schema.sql` in your Supabase SQL Editor. See `DEPLOY.md` for the full runbook.

### 4. Deploy Edge Functions
```bash
supabase functions deploy analyze-dream
supabase functions deploy generate-image
```

### 5. Set Secrets (for edge functions)
```bash
supabase secrets set OPENROUTER_API_KEY=sk-or-xxx
```

### 6. Run Development Server
```bash
npm run dev
# App loads at http://localhost:5173
```

### 7. Run Tests
```bash
npm test
```

## Features

### ✅ Working Now
- **Dream Capture**: Type, record audio, or upload photos
- **AI Analysis**: Multi-provider fallback (OpenRouter → Pollinations → Gemini → OpenAI → Claude)
- **Image Generation**: Free via Pollinations.ai (no API key needed)
- **NFT Minting**: Wallet creation, metadata preview, simulated minting
- **Dream Journal**: Search, filter, browse all dreams
- **PWA**: Installable, offline-capable
- **Auth**: Anonymous + email/password via Supabase
- **Data Persistence**: Local-first with optional Supabase sync

### 🚧 Coming Soon
- Real blockchain NFT minting (Polygon/Base)
- Audio transcription via Whisper
- Wearable device integration
- Social sharing

## Architecture

```
src/
├── components/
│   ├── ui/           # Button, Card, Input, Badge, Spinner, Modal, Toast
│   ├── dreams/       # DreamList, DreamDetail, DreamCapture, DreamVisualizer, NFTMintButton
│   ├── auth/         # LoginScreen, ProtectedRoute, PWAInstallPrompt
│   └── sleep/        # DreamAssetGenerator
├── lib/
│   ├── dreamPipeline.ts    # Full pipeline orchestrator
│   ├── dream-analyzer.ts   # AI analysis with multi-provider fallback
│   ├── nft.ts              # Wallet, NFT creation, minting
│   ├── supabase/           # Supabase client + CRUD
│   └── assets/             # Image pipeline, parallax video
├── hooks/
│   ├── useAuth.tsx         # Authentication hook
│   ├── useHashRoute.ts     # Hash-based routing
│   └── useDreamSync.ts     # Supabase sync hook
└── modules/sleep/
    └── dreamAssetGenerator.ts  # Pollinations image generation

supabase/
├── functions/
│   ├── analyze-dream/    # Multi-provider dream analysis
│   └── generate-image/   # Pollinations image proxy
└── migrations/
    └── 001_consolidated_schema.sql  # Database schema
```

## Success Criteria (by 08:00)
- [x] App loads at localhost:5173, installable as PWA
- [x] User can sign up / log in (anonymous + email)
- [x] User can type or record a dream
- [x] Dream gets analyzed: narrative, themes, emotion, symbols, valence, nugget
- [x] Dream gets an image generated (Pollinations, free)
- [x] Dream saves to localStorage and persists across refreshes
- [x] User can view dream journal with all their dreams
- [x] User can mint a dream as NFT (simulated)
- [x] All changes committed and pushed
- [x] 86 tests passing
