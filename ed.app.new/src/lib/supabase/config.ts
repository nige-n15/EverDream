/**
 * Supabase Environment Configuration
 *
 * Validates and exports the Supabase configuration from environment variables.
 * Provides clear error messages when configuration is missing.
 *
 * Environment variables required:
 *   VITE_SUPABASE_URL       — Your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY  — Your Supabase anon/public key
 *
 * Optional:
 *   VITE_SUPABASE_SERVICE_ROLE_KEY  — Service role key (server-side only, never expose to client)
 *
 * @module supabase/config
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

let _cachedConfig: SupabaseConfig | null = null;

/**
 * Get the Supabase configuration.
 * Returns a cached result after the first call.
 */
export function getSupabaseConfig(): SupabaseConfig {
  if (_cachedConfig) return _cachedConfig;

  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  _cachedConfig = {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
  };

  return _cachedConfig;
}

/**
 * Check if Supabase is properly configured.
 * Use this to conditionally enable/disable cloud features.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}

/**
 * Get the Supabase URL, or empty string if not configured.
 */
export function getSupabaseUrl(): string {
  return getSupabaseConfig().url;
}

/**
 * Get the Supabase anon key, or empty string if not configured.
 */
export function getSupabaseAnonKey(): string {
  return getSupabaseConfig().anonKey;
}

/**
 * Validate Supabase configuration and log helpful messages.
 * Call this at app startup to warn about missing configuration.
 */
export function validateSupabaseConfig(): void {
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    console.warn(
      '[Supabase] Not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env. ' +
      'The app will work in offline mode with local storage only.'
    );
    return;
  }

  // Validate URL format
  try {
    new URL(config.url);
  } catch {
    console.error(
      `[Supabase] Invalid VITE_SUPABASE_URL: "${config.url}". ` +
      'Expected format: https://YOUR_PROJECT.supabase.co'
    );
    _cachedConfig = { ...config, isConfigured: false };
    return;
  }

  // Validate URL is a Supabase URL
  if (!config.url.includes('.supabase.co') && !config.url.includes('.supabase.in')) {
    console.warn(
      `[Supabase] URL doesn't look like a Supabase URL: "${config.url}". ` +
      'Expected format: https://YOUR_PROJECT.supabase.co'
    );
  }

  // Check anon key format (JWT)
  if (!config.anonKey.startsWith('eyJ')) {
    console.warn(
      '[Supabase] VITE_SUPABASE_ANON_KEY doesn\'t look like a valid JWT. ' +
      'Get your anon key from Supabase project settings > API.'
    );
  }

  console.log('[Supabase] Configured successfully ☁️');
}
