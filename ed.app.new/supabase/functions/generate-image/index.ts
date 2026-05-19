/**
 * Supabase Edge Function: generate-image
 *
 * Proxies Pollinations.ai for free dream image generation.
 * Also supports HuggingFace Stable Diffusion as a fallback.
 * No API key needed for Pollinations; HF key is optional.
 *
 * Environment variables (set via `supabase secrets set`):
 *   HF_INFERENCE_API_KEY — Optional, for HuggingFace fallback
 *
 * Request body:
 *   { prompt: string, style?: string, width?: number, height?: number }
 *
 * Response:
 *   { imageUrl: string, source: string, prompt: string }
 *
 * Error responses:
 *   400 — Missing or invalid prompt
 *   502 — All image providers failed
 *   500 — Unexpected server error
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// ── Types ────────────────────────────────────────────────────

interface GenerateImageRequest {
  prompt?: string;
  style?: string;
  width?: number;
  height?: number;
}

interface GenerateImageResponse {
  imageUrl: string;
  source: string;
  prompt: string;
}

// ── Constants ────────────────────────────────────────────────

const POLLINATIONS_BASE_URL = 'https://image.pollinations.ai/prompt';
const HF_SD_URL =
  'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STYLE_MAP: Record<string, string> = {
  dreamlike: 'surreal, ethereal, soft lighting, dreamlike atmosphere',
  realistic: 'photorealistic, detailed, natural lighting',
  artistic: 'oil painting style, impressionistic, vibrant colors',
  minimal: 'minimalist, clean lines, simple composition',
  cinematic: 'cinematic lighting, dramatic, wide angle, film grain',
};

const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 1024;

// ── Helpers ──────────────────────────────────────────────────

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

function buildEnhancedPrompt(prompt: string, style: string): string {
  const styleDesc = STYLE_MAP[style] || STYLE_MAP.dreamlike;
  return `${prompt.trim()}, ${styleDesc}, 4k, high quality`;
}

// ── Image Providers ──────────────────────────────────────────

async function generateWithPollinations(
  prompt: string,
  width: number,
  height: number,
): Promise<GenerateImageResponse> {
  const enhancedPrompt = buildEnhancedPrompt(prompt, 'dreamlike');
  const encodedPrompt = encodeURIComponent(enhancedPrompt);
  const seed = Date.now() % 1_000_000;
  const imageUrl = `${POLLINATIONS_BASE_URL}/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}`;

  // Validate the image URL is reachable
  const headResponse = await fetch(imageUrl, { method: 'HEAD' });
  if (!headResponse.ok) {
    throw new Error(`Pollinations returned ${headResponse.status}`);
  }

  return {
    imageUrl,
    source: 'pollinations',
    prompt: enhancedPrompt,
  };
}

async function generateWithHuggingFace(prompt: string): Promise<GenerateImageResponse> {
  const enhancedPrompt = buildEnhancedPrompt(prompt, 'dreamlike');
  const hfApiKey = Deno.env.get('HF_INFERENCE_API_KEY');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (hfApiKey) {
    headers['Authorization'] = `Bearer ${hfApiKey}`;
  }

  const response = await fetch(HF_SD_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      inputs: enhancedPrompt,
      parameters: {
        negative_prompt: 'blurry, low quality, distorted, ugly',
        num_inference_steps: 20,
        guidance_scale: 7.5,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HuggingFace returned ${response.status}: ${errorText}`);
  }

  const blob = await response.blob();
  const base64 = await blobToBase64(blob);
  const imageUrl = `data:image/png;base64,${base64}`;

  return {
    imageUrl,
    source: 'huggingface',
    prompt: enhancedPrompt,
  };
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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
    let body: GenerateImageRequest;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const { prompt, style = 'dreamlike', width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT } = body;

    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return errorResponse('Missing or invalid "prompt" field. Must be a non-empty string.', 400);
    }

    if (prompt.length > 2000) {
      return errorResponse('Prompt too long. Maximum 2000 characters.', 400);
    }

    // Try Pollinations first (free, no auth)
    try {
      console.log('[generate-image] Trying Pollinations.ai...');
      const result = await generateWithPollinations(prompt, width, height);
      console.log('[generate-image] Pollinations succeeded');
      return jsonResponse(result);
    } catch (err) {
      console.warn('[generate-image] Pollinations failed:', err);
    }

    // Fallback: HuggingFace
    try {
      console.log('[generate-image] Trying HuggingFace...');
      const result = await generateWithHuggingFace(prompt);
      console.log('[generate-image] HuggingFace succeeded');
      return jsonResponse(result);
    } catch (err) {
      console.warn('[generate-image] HuggingFace failed:', err);
    }

    // All providers failed
    return errorResponse(
      'All image generation providers are currently unavailable. Please try again later.',
      502,
    );
  } catch (err) {
    console.error('[generate-image] Unexpected error:', err);
    return errorResponse('An unexpected error occurred during image generation.', 500);
  }
});
