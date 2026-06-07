#!/bin/bash
# ============================================================
# EverDream — Edge Function Deployment Script
# Deploys all Supabase edge functions to a hosted project.
#
# Usage:
#   bash supabase/deploy.sh <project-ref>
#   SUPABASE_PROJECT_ID=<project-ref> bash supabase/deploy.sh
#
# The <project-ref> is the part before ".supabase.co" in your project URL.
# Uses --project-ref so no `supabase link` (and no DB password) is needed.
# Run from the app folder (ed.app.new) after `supabase login`.
# ============================================================

set -e

echo "🚀 EverDream Edge Function Deployment"
echo "======================================"
echo ""

# Check that supabase CLI is available
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI not found. Install it with one of:"
  echo "   brew install supabase/tap/supabase        # macOS/Linux"
  echo "   scoop install supabase                     # Windows"
  echo "   ...or prefix commands with 'npx supabase'"
  exit 1
fi

# Resolve the project ref from arg 1 or env var
PROJECT_REF="${1:-${SUPABASE_PROJECT_ID:-}}"
if [ -z "$PROJECT_REF" ]; then
  echo "❌ No project ref given."
  echo "   Usage: bash supabase/deploy.sh <project-ref>"
  echo "      or: SUPABASE_PROJECT_ID=<project-ref> bash supabase/deploy.sh"
  exit 1
fi

echo "📦 Deploying edge functions to project: $PROJECT_REF"
echo "   (JWT-protected per supabase/config.toml)"
echo ""

deploy() {
  local fn="$1"
  echo "▶  Deploying $fn..."
  supabase functions deploy "$fn" --project-ref "$PROJECT_REF" 2>&1 || {
    echo "⚠️  $fn deploy failed — are you logged in? (supabase login)"
  }
  echo ""
}

deploy analyze-dream
deploy generate-image
deploy transcribe-audio
deploy health-check

echo "======================================"
echo "✅ Edge functions deployed!"
echo ""
echo "📝 Next steps:"
echo "   1. Set API key secrets (server-side only — never as VITE_* vars):"
echo "      supabase secrets set OPENROUTER_API_KEY=sk-or-v1-xxx --project-ref $PROJECT_REF   # required"
echo "      supabase secrets set HF_INFERENCE_API_KEY=hf_xxx     --project-ref $PROJECT_REF   # required"
echo "      # optional analysis fallbacks: GEMINI_API_KEY, OPENAI_API_KEY, NVIDIA_API_KEY"
echo "      # optional image fallback:     FAL_AI_KEY"
echo ""
echo "   2. Run the database migration:"
echo "      Open supabase/migrations/001_consolidated_schema.sql in the"
echo "      Supabase SQL Editor and run it (idempotent, safe to re-run)."
echo ""
echo "   3. Verify (functions are JWT-protected — pass the anon key):"
echo "      ANON=<your-anon-key>"
echo "      curl -X POST https://$PROJECT_REF.supabase.co/functions/v1/analyze-dream \\"
echo "        -H \"Authorization: Bearer \$ANON\" -H \"apikey: \$ANON\" \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"text\": \"I was flying over a vast ocean\"}'"
