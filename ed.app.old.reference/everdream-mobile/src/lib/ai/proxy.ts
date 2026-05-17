import { invokeAiProxy, type AiProxyRequest, type AiProxyResult } from "../syncApi";

export interface AiProxyError extends Error {
  code: "TIMEOUT" | "NETWORK_ERROR" | "VALIDATION_ERROR" | "FALLBACK_FAILED";
  details?: unknown;
}

export class AiProxyService {
  private static readonly TIMEOUT_MS = 30000; // 30 seconds

  private static createError(code: AiProxyError["code"], message: string, details?: unknown): AiProxyError {
    const error = new Error(message) as AiProxyError;
    error.code = code;
    error.details = details;
    return error;
  }

  private static async callWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = this.TIMEOUT_MS
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(this.createError("TIMEOUT", `Request timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private static generateFallbackResult(narrative: string): AiProxyResult {
    // Simple rule-based extractor as fallback
    const words = narrative.toLowerCase().split(/\s+/);
    const themes: string[] = [];

    // Basic theme detection
    if (words.includes("water") || words.includes("ocean") || words.includes("river")) themes.push("water");
    if (words.includes("fly") || words.includes("flying") || words.includes("flight")) themes.push("flight");
    if (words.includes("house") || words.includes("home") || words.includes("building")) themes.push("home");
    if (words.includes("memory") || words.includes("remember") || words.includes("past")) themes.push("memory");

    // Ensure 2-3 themes
    if (themes.length === 0) themes.push("dream");
    if (themes.length === 1) themes.push("experience");
    if (themes.length > 3) themes.splice(3);

    // Basic emotional tone analysis
    let valence = 0;
    let arousal = 5;
    const emotions: string[] = [];

    if (words.includes("happy") || words.includes("joy") || words.includes("peaceful")) {
      valence = 3;
      arousal = 4;
      emotions.push("joyful");
    } else if (words.includes("scared") || words.includes("fear") || words.includes("terrified")) {
      valence = -4;
      arousal = 8;
      emotions.push("fearful");
    } else if (words.includes("angry") || words.includes("rage") || words.includes("furious")) {
      valence = -3;
      arousal = 7;
      emotions.push("angry");
    } else {
      valence = 0;
      arousal = 3;
      emotions.push("neutral");
    }

    // Ensure 2-3 emotions
    if (emotions.length === 1) emotions.push("contemplative");

    return {
      themes,
      narrative_summary: narrative.length > 100 ? narrative.substring(0, 97) + "..." : narrative,
      emotional_tone: {
        valence: Math.max(-5, Math.min(5, valence)),
        arousal: Math.max(0, Math.min(10, arousal)),
        emotions,
      },
    };
  }

  private static generateMockResult(narrative: string): AiProxyResult {
    // Mock data for offline testing
    return {
      themes: ["dream", "memory", "experience"],
      narrative_summary: "A vivid dream experience that captured important emotional insights.",
      emotional_tone: {
        valence: 2,
        arousal: 6,
        emotions: ["curious", "reflective"],
      },
    };
  }

  static async processDream(request: AiProxyRequest): Promise<AiProxyResult> {
    try {
      // Step 1: Try Supabase Edge Function with timeout
      const result = await this.callWithTimeout(invokeAiProxy(request));
      return result;
    } catch (error) {
      console.warn("AI proxy primary call failed:", error);

      // Step 2: Fallback to cached mock (for development/testing)
      try {
        console.log("Using cached mock fallback");
        return this.generateMockResult(request.narrative);
      } catch (mockError) {
        console.warn("Mock fallback failed:", mockError);

        // Step 3: Rule-based extractor as final fallback
        try {
          console.log("Using rule-based extractor fallback");
          return this.generateFallbackResult(request.narrative);
        } catch (fallbackError) {
          console.error("All AI processing fallbacks failed:", fallbackError);
          throw this.createError(
            "FALLBACK_FAILED",
            "Unable to process dream content",
            { primary: error, mock: mockError, fallback: fallbackError }
          );
        }
      }
    }
  }
}