/**
 * Supabase Edge Function: analyze-dream
 *
 * Proxies the Anthropic Claude API for dream analysis.
 * Keeps the API key server-side — never exposed to the client.
 *
 * Environment variables (set via `supabase secrets set`):
 *   ANTHROPIC_API_KEY — Your Anthropic API key
 *
 * Request body:
 *   { text: string } — The dream text to analyze
 *
 * Response:
 *   { analysis: DreamAnalysis } — Parsed JSON from Claude
 *
 * Error responses:
 *   400 — Missing or invalid input
 *   401 — API key not configured on server
 *   502 — Upstream Anthropic error
 *   500 — Unexpected server error
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// ── Types ────────────────────────────────────────────────────

interface DreamAnalysis {
  category: string;
  themes: string[];
  emotion: string;
  symbols: string[];
  narrative: string;
  nugget: string;
  interpretation: {
    symbols: Record<string, string>;
    meaning: string;
    commonPattern: string;
  };
}

interface AnalyzeRequestBody {
  text?: string;
}

// ── Constants ────────────────────────────────────────────────

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 2000;
const MAX_INPUT_LENGTH = 10000;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FALLBACK_ANALYSIS: DreamAnalysis = {
  category: 'uncategorized',
  themes: ['dream', 'experience'],
  emotion: 'neutral',
  symbols: [],
  narrative: '',
  nugget: '',
  interpretation: {
    symbols: {},
    meaning: 'Analysis unavailable',
    commonPattern: '',
  },
};

// ── Helpers ──────────────────────────────────────────────────

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message, fallback: FALLBACK_ANALYSIS }, status);
}

// ── Handler ──────────────────────────────────────────────────

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed. Use POST.', 405);
  }

  try {
    // Parse request body
    let body: AnalyzeRequestBody;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const { text } = body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return errorResponse('Missing or invalid "text" field. Must be a non-empty string.', 400);
    }

    const trimmed = text.trim();
    if (trimmed.length < 10) {
      return jsonResponse({
        analysis: {
          ...FALLBACK_ANALYSIS,
          narrative: trimmed,
          nugget: trimmed.substring(0, 100),
        },
        note: 'Text too short for meaningful analysis',
      });
    }

    const safeText = trimmed.length > MAX_INPUT_LENGTH
      ? trimmed.substring(0, MAX_INPUT_LENGTH)
      : trimmed;

    // Get API key from environment
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      console.error('[analyze-dream] ANTHROPIC_API_KEY not set');
      return errorResponse('AI service not configured. Please contact support.', 401);
    }

    // Call Anthropic API
    const anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{
          role: 'user',
          content: `Analyze this dream and provide detailed response in JSON format:
{
  "category": "nightmare/lucid/recurring/peaceful/prophetic/anxiety/adventure",
  "themes": ["theme1", "theme2", "theme3"],
  "emotion": "primary emotional tone",
  "symbols": ["symbol1", "symbol2", "symbol3"],
  "narrative": "expanded 200-word vivid narrative in first person present tense",
  "nugget": "one captivating sentence (15-20 words)",
  "interpretation": {
    "symbols": {
      "symbol1": "what it represents",
      "symbol2": "what it represents"
    },
    "meaning": "psychological insight about what this dream reveals",
    "commonPattern": "when people typically have dreams like this"
  }
}

Dream: ${safeText}

Respond ONLY with valid JSON, no markdown.`,
        }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error(`[analyze-dream] Anthropic error ${anthropicResponse.status}:`, errorText);
      return errorResponse(
        `AI analysis service returned ${anthropicResponse.status}. Please try again.`,
        502,
      );
    }

    const data = await anthropicResponse.json();
    const analysisText = data.content?.find((c: { type: string }) => c.type === 'text')?.text || '{}';
    const cleanText = analysisText.replace(/```json|```/g, '').trim();

    let analysis: DreamAnalysis;
    try {
      analysis = JSON.parse(cleanText) as DreamAnalysis;
    } catch (parseErr) {
      console.error('[analyze-dream] Failed to parse Claude response:', cleanText, parseErr);
      return jsonResponse({
        analysis: { ...FALLBACK_ANALYSIS, narrative: safeText, nugget: safeText.substring(0, 100) },
        note: 'AI response could not be parsed; returning fallback',
      });
    }

    return jsonResponse({ analysis });
  } catch (err) {
    console.error('[analyze-dream] Unexpected error:', err);
    return errorResponse('An unexpected error occurred. Please try again later.', 500);
  }
});
