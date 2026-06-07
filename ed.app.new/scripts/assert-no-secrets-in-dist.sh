#!/bin/sh
# ============================================================
# Build-time guard: fail if any secret-shaped string ended up
# in the client bundle (dist/).
#
# The frontend should only ever contain PUBLIC values:
#   - VITE_SUPABASE_URL
#   - VITE_SUPABASE_ANON_KEY (a JWT beginning with "eyJ" — this is
#     public by design and intentionally NOT flagged below)
#
# All AI provider keys must live as Supabase edge-function secrets,
# never as VITE_* vars. This script is the last line of defence.
# ============================================================
set -eu

DIST="${1:-dist}"

if [ ! -d "$DIST" ]; then
  echo "assert-no-secrets: '$DIST' not found — run the build first." >&2
  exit 1
fi

echo "assert-no-secrets: scanning $DIST for leaked provider keys..."

# Distinctive provider-key prefixes. Lengths are chosen to match real
# tokens and avoid false positives in minified JS. NOTE: we deliberately
# do NOT match JWTs (eyJ...) because the Supabase anon key is one and is
# meant to be in the bundle.
PATTERNS='sk-ant-[A-Za-z0-9_-]{20,}|sk-or-v1-[A-Za-z0-9]{20,}|sk-proj-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{40,}|hf_[A-Za-z0-9]{30,}|AIza[0-9A-Za-z_-]{35}|r8_[A-Za-z0-9]{35,}|nvapi-[A-Za-z0-9_-]{30,}'

if grep -rEoh "$PATTERNS" "$DIST" 2>/dev/null | sort -u | grep . ; then
  echo "" >&2
  echo "assert-no-secrets: FAILED — the strings above look like provider API keys" >&2
  echo "and must not be in the client bundle. Remove any VITE_*_API_KEY / VITE_AI_SERVICE_TOKEN" >&2
  echo "build args and configure them as Supabase edge-function secrets instead." >&2
  exit 1
fi

echo "assert-no-secrets: OK — no provider keys found in $DIST"
