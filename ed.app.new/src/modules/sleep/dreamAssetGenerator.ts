/**
 * Dream Asset Generator — 2-Stage Image Generation Process
 *
 * Generates dream images using a 2-stage fallback process:
 * 
 * STAGE 1: Cloud APIs (Try in order)
 *   1a. Puter.com AI API - FREE, easy to use
 *   1b. Supabase Edge Function (proxies Pollinations.ai) - FREE, CORS-safe
 *   1c. Direct Pollinations.ai - FREE, no API key needed
 * 
 * STAGE 2: Local Generation (Requires running on your computer)
 *   2a. AUTOMATIC1111 Stable Diffusion WebUI - Free, full control
 *   2b. ComfyUI - Free, workflow-based
 * 
 * FALLBACK:
 *   3. SVG placeholder - Always works
 *
 * This allows you to:
 * - Use free cloud APIs first (no setup required)
 * - Run local Stable Diffusion on your computer for unlimited generations
 * - Expose local API to the app when cloud services fail
 *
 * Environment variables:
 *   VITE_SUPABASE_URL       — Your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY  — Your Supabase anon/public key
 *   VITE_LOCAL_GEN_URL      — Local generation endpoint (e.g., http://localhost:7860 for A1111)
 *   VITE_ENABLE_LOCAL_GEN   — Set to "true" to enable local generation fallback
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DreamAsset } from './types';
export type { DreamAsset };

// ── Constants ────────────────────────────────────────────────

const POLLINATIONS_API_URL = 'https://image.pollinations.ai/prompt';
const PUTER_AI_API_URL = 'https://api.puter.com/ai/txt2img';

// Local generation endpoints (user-configurable)
const DEFAULT_A1111_URL = 'http://localhost:7860';
const DEFAULT_COMFYUI_URL = 'http://localhost:8188';

// ── Supabase Client ──────────────────────────────────────────

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;

  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    return null;
  }

  _supabase = createClient(url, key);
  return _supabase;
}

// ── Helpers ──────────────────────────────────────────────────

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildDreamPrompt(dreamText: string): string {
  const trimmed = dreamText.trim();
  const seed = trimmed.length > 0 ? trimmed : 'a surreal dreamscape filled with stars';
  return `${seed}, dreamlike, ethereal, surreal, cinematic lighting, fantasy, digital art, highly detailed`;
}

/**
 * Validate that an image URL actually loads.
 * Throws if the image fails to load within the timeout.
 */
function validateImageUrl(url: string, timeoutMs = 60000): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.src = '';
      reject(new Error(`Image load timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Image failed to load'));
    };
    img.src = url;
  });
}

// ── Image Generation via Edge Function ───────────────────────

/**
 * Generate image via Supabase Edge Function.
 * Falls back to direct Pollinations if Supabase is not configured.
 */
async function generateWithEdgeFunction(prompt: string, style: string = 'dreamlike'): Promise<DreamAsset> {
  console.log('[AssetGen] Generating image via Edge Function with prompt:', prompt.substring(0, 50));
  const supabase = getSupabase();

  if (supabase) {
    try {
      console.log('[AssetGen] Invoking Supabase generate-image function...');
      // Request JSON format to get URL back instead of binary
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt, style, width: 1024, height: 1024, format: 'json' },
      });

      if (error) {
        console.error('[AssetGen] Edge function error:', error.message);
        throw new Error(error.message);
      }

      console.log('[AssetGen] Edge function response received');
      const result = data as { imageUrl?: string; source?: string; prompt?: string; error?: string };

      if (result.error) {
        console.error('[AssetGen] Image generation error from service:', result.error);
        throw new Error(result.error);
      }

      console.log('[AssetGen] Image URL received:', result.imageUrl?.substring(0, 80));
      
      if (result.imageUrl) {
        // Validate the image URL actually loads
        try {
          await validateImageUrl(result.imageUrl, 30000);
          console.log('[AssetGen] Edge function image validated successfully');
        } catch (validationError) {
          console.error('[AssetGen] Edge function image validation failed:', validationError);
          throw new Error('Edge function generated invalid image URL');
        }
        
        return {
          id: makeId(),
          prompt: result.prompt || prompt,
          url: result.imageUrl,
          source: (result.source as DreamAsset['source']) || 'pollinations',
          style: style || 'dreamlike',
          generatedAt: new Date().toISOString(),
          metadata: {
            provider: result.source || 'edge-function',
            note: 'Generated via Supabase Edge Function',
          },
        };
      } else {
        console.warn('[AssetGen] No imageUrl in response, falling back');
      }
    } catch (err) {
      console.warn('[AssetGen] Edge function failed, falling back to direct:', err);
    }
  }

  // Fallback: direct Pollinations
  return generateWithPollinations(prompt, style);
}

/**
 * Generate image using Pollinations.ai — FREE tier with optimized parameters.
 * Uses direct URL format which works reliably without CORS issues.
 * NOTE: nologo=true requires payment, so we use nologo=false for free tier.
 */
async function generateWithPollinations(prompt: string, style: string = 'dreamlike'): Promise<DreamAsset> {
  console.log('[AssetGen] Generating via Pollinations...');
  const enhancedPrompt = buildDreamPrompt(prompt);
  const encodedPrompt = encodeURIComponent(enhancedPrompt);
  // Use direct pollinations.ai URL with reliable parameters
  // IMPORTANT: nologo=false for free tier (nologo=true returns 402 Payment Required)
  const imageUrl = `${POLLINATIONS_API_URL}/${encodedPrompt}?width=1024&height=1024&seed=${Date.now() % 1000000}&nologo=false`;

  console.log('[AssetGen] Pollinations URL:', imageUrl.substring(0, 100));
  
  // Validate the image URL actually loads (with timeout)
  try {
    await validateImageUrl(imageUrl, 30000);
    console.log('[AssetGen] Pollinations image validated successfully');
  } catch (validationError) {
    console.error('[AssetGen] Pollinations image validation failed:', validationError);
    throw new Error('Pollinations generated invalid image URL');
  }

  return {
    id: makeId(),
    prompt: enhancedPrompt,
    url: imageUrl,
    source: 'pollinations',
    style: style || 'dreamlike',
    generatedAt: new Date().toISOString(),
    metadata: {
      provider: 'pollinations.ai',
      model: 'flux',
      note: 'Free tier - 1024x1024 resolution (includes watermark)',
    },
  };
}

/**
 * Generate image using Puter.com AI API — FREE, simple to use.
 * No API key required for basic usage.
 * See: https://developer.puter.com/
 */
async function generateWithPuter(prompt: string, style: string = 'dreamlike'): Promise<DreamAsset> {
  console.log('[AssetGen] Generating via Puter.com AI...');
  
  const enhancedPrompt = buildDreamPrompt(prompt);
  
  console.log('[AssetGen] Calling Puter AI API...');
  const response = await fetch(PUTER_AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: enhancedPrompt,
      width: 1024,
      height: 1024,
      steps: 20,
      guidance_scale: 7.5,
      negative_prompt: 'blurry, low quality, distorted, ugly, watermark',
    }),
  });

  console.log('[AssetGen] Puter AI response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[AssetGen] Puter AI error:', errorText);
    throw new Error(`Puter AI API failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('[AssetGen] Puter AI response received');
  
  // Puter returns either a URL or base64 data
  let imageUrl: string;
  if (result.url) {
    imageUrl = result.url;
  } else if (result.image || result.data) {
    // If base64, convert to blob URL
    const base64Data = result.image || result.data;
    const blob = await fetch(`data:image/png;base64,${base64Data}`).then(r => r.blob());
    imageUrl = URL.createObjectURL(blob);
  } else {
    console.error('[AssetGen] Puter AI returned no image data:', result);
    throw new Error('Puter AI returned no image data');
  }

  // Validate the image URL actually loads
  try {
    await validateImageUrl(imageUrl, 30000);
    console.log('[AssetGen] Puter AI image validated successfully');
  } catch (validationError) {
    console.error('[AssetGen] Puter AI image validation failed:', validationError);
    throw new Error('Puter AI generated invalid image URL');
  }

  return {
    id: makeId(),
    prompt: enhancedPrompt,
    url: imageUrl,
    source: 'puter',
    style: style || 'dreamlike',
    generatedAt: new Date().toISOString(),
    metadata: {
      provider: 'puter.com',
      model: 'stable-diffusion',
      note: 'Free generation via Puter AI API',
    },
  };
}

/**
 * Generate image using local ComfyUI or A1111 (AUTOMATIC1111) instance.
 * Requires running Stable Diffusion locally.
 * Configure via VITE_LOCAL_GEN_URL or use defaults.
 */
async function generateWithLocalProvider(prompt: string, style: string = 'dreamlike'): Promise<DreamAsset> {
  console.log('[AssetGen] Generating via local provider...');
  
  const localUrl = import.meta.env.VITE_LOCAL_GEN_URL || '';
  let baseUrl = localUrl;
  let provider: 'comfyui' | 'a1111' | 'unknown' = 'unknown';
  
  // Auto-detect or use specified provider
  if (localUrl.includes('8188')) {
    baseUrl = DEFAULT_COMFYUI_URL;
    provider = 'comfyui';
  } else if (localUrl.includes('7860')) {
    baseUrl = DEFAULT_A1111_URL;
    provider = 'a1111';
  } else if (localUrl) {
    // User provided custom URL, try A1111 first
    baseUrl = localUrl;
    provider = 'a1111';
  } else {
    throw new Error('No local generation URL configured');
  }

  const enhancedPrompt = buildDreamPrompt(prompt);
  
  if (provider === 'a1111') {
    console.log('[AssetGen] Calling A1111 API...');
    const response = await fetch(`${baseUrl}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        negative_prompt: 'blurry, low quality, distorted, ugly, watermark',
        steps: 20,
        width: 1024,
        height: 1024,
        cfg_scale: 7,
        sampler_name: 'Euler a',
      }),
    });

    console.log('[AssetGen] A1111 response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`A1111 API failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    if (!result.images?.[0]) {
      throw new Error('A1111 returned no images');
    }

    // Convert base64 to blob URL
    const base64Image = result.images[0];
    const blob = await fetch(`data:image/png;base64,${base64Image}`).then(r => r.blob());
    const imageUrl = URL.createObjectURL(blob);
    
    // Validate the generated image
    try {
      await validateImageUrl(imageUrl, 10000);
      console.log('[AssetGen] A1111 image validated successfully');
    } catch (va