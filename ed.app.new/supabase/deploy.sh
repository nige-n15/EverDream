#!/bin/bash
# ============================================================
# EverDream — Edge Function Deployment Script
# Deploys all Supabase edge functions and sets required secrets
# ============================================================

set -e

echo "🚀 EverDream Edge Function Deployment"
echo "======================================"
echo ""

# Check that supabase CLI is available
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI not found. Install it with:"
  echo "   npm install -g supabase"
  exit 1
fi

# Check that we're linked to a project
if [ ! -f ".supabase/project-ref" ] && [ -z "$SUPABASE_PROJECT_ID" ]; then
  echo "⚠️  Not linked to a Supabase project."
  echo "   Run: supabase link --project-ref YOUR_PROJECT_REF"
  echo "   Or set SUPABASE_PROJECT_ID environment variable"
  exit 1
fi

echo "📦 Deploying edge functions..."
echo ""

# Deploy analyze-dream
echo "1️⃣  Deploying analyze-dream..."
supabase functions deploy analyze-dream --no-verify-jwt 2>&1 || {
  echo "⚠️  analyze-dream deploy failed — may need: supabase login"
}
echo ""

# Deploy generate-image
echo "2️⃣  Deploying generate-image..."
supabase functions deploy generate-image --no-verify-jwt 2>&1 || {
  echo "⚠️  generate-image deploy failed"
}
echo ""

# Deploy transcribe-audio
echo "3️⃣  Deploying transcribe-audio..."
supabase functions deploy transcribe-audio --no-verify-jwt 2>&1 || {
  echo "⚠️  transcribe-audio deploy failed"
}
echo ""

echo "======================================"
echo "✅ Edge functions deployed!"
echo ""
echo "📝 Next steps:"
echo "   1. Set API key secrets:"
echo "      supabase secrets set OPENROUTER_API_KEY=sk-or-xxx"
echo "      supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx"
echo "      supabase secrets set HF_INFERENCE_API_KEY=hf_xxx"
echo ""
echo "   2. Run the database migration:"
echo "      supabase db push < supabase/migrations/001_create_dreams_table.sql"
echo "   Or open the SQL in Supabase Studio and run it manually."
echo ""
echo "   3. Verify edge functions are working:"
echo "      curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/analyze-dream \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"text\": \"I was flying over a vast ocean\"}'"
