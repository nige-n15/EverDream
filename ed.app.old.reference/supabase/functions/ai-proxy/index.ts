import { assertMethod, errorResponse, handleCors, HttpError, jsonResponse, readJsonBody } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

interface AiProxyRequest {
  narrative: string;
  media_type: "video" | "audio" | "text";
}

interface AiProxyResponse {
  themes: string[];
  narrative_summary: string;
  emotional_tone: {
    valence: number;
    arousal: number;
    emotions: string[];
  };
}

const SYSTEM_PROMPT = [
  "You are Everdream's verifier in the Narrate-Interact-Confirm loop.",
  "Return JSON only with keys: themes, narrative_summary, emotional_tone.",
  "themes must be 2 or 3 concise lowercase tags.",
  "narrative_summary must be 3 to 5 sentences.",
  "emotional_tone must include integer valence (-5 to 5), integer arousal (0 to 10), and 2 or 3 emotions.",
].join(" ");

function requireQwenConfig() {
  const apiUrl = Deno.env.get("QWEN_API_URL");
  const apiKey = Deno.env.get("QWEN_API_KEY");
  const model = Deno.env.get("QWEN_MODEL") ?? "qwen2.5-7b-instruct";

  if (!apiUrl || !apiKey) {
    throw new HttpError(500, "Missing Qwen configuration");
  }

  return { apiUrl, apiKey, model };
}

function extractJson(content: string) {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new HttpError(502, "Model response did not contain JSON");
  }

  return content.slice(start, end + 1);
}

function validateInput(body: AiProxyRequest) {
  if (!body.narrative || body.narrative.trim().length < 24) {
    throw new HttpError(400, "Narrative must be at least 24 characters");
  }

  if (body.narrative.length > 6000) {
    throw new HttpError(400, "Narrative exceeds 6000 characters");
  }

  if (!["video", "audio", "text"].includes(body.media_type)) {
    throw new HttpError(400, "Unsupported media type");
  }
}

function normalizeModelResponse(payload: unknown): AiProxyResponse {
  const parsed = payload as Record<string, unknown>;
  const rawThemes = Array.isArray(parsed.themes) ? parsed.themes : [];
  const rawTone = (parsed.emotional_tone ?? {}) as Record<string, unknown>;
  const themes = rawThemes
    .map((value) => String(value).trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 3);

  if (themes.length < 2) {
    throw new HttpError(502, "Model returned too few themes");
  }

  const summary = String(parsed.narrative_summary ?? "").trim();

  if (!summary) {
    throw new HttpError(502, "Model returned an empty summary");
  }

  return {
    themes,
    narrative_summary: summary,
    emotional_tone: {
      valence: Math.max(-5, Math.min(5, Number(rawTone.valence ?? 0))),
      arousal: Math.max(0, Math.min(10, Number(rawTone.arousal ?? 0))),
      emotions: Array.isArray(rawTone.emotions)
        ? rawTone.emotions.map((value) => String(value).trim()).filter(Boolean).slice(0, 3)
        : [],
    },
  };
}

Deno.serve(async (request) => {
  const corsResponse = handleCors(request);

  if (corsResponse) {
    return corsResponse;
  }

  try {
    assertMethod(request, "POST");

    const { user, adminClient } = await requireUser(request);
    const body = await readJsonBody<AiProxyRequest>(request);
    validateInput(body);

    const rateLimit = Number(Deno.env.get("AI_PROXY_RATE_LIMIT") ?? "12");
    const rateWindow = Number(Deno.env.get("AI_PROXY_RATE_WINDOW_SECONDS") ?? "60");
    const { data: allowed, error: rateLimitError } = await adminClient.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_function_name: "ai-proxy",
      p_limit: rateLimit,
      p_window_seconds: rateWindow,
    });

    if (rateLimitError) {
      throw new HttpError(500, "Failed to evaluate rate limit", rateLimitError);
    }

    if (!allowed) {
      throw new HttpError(429, "AI verification rate limit exceeded");
    }

    const { apiUrl, apiKey, model } = requireQwenConfig();
    const upstreamResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              media_type: body.media_type,
              narrative: body.narrative,
            }),
          },
        ],
      }),
    });

    if (!upstreamResponse.ok) {
      const upstreamError = await upstreamResponse.text();
      throw new HttpError(502, "Qwen request failed", upstreamError);
    }

    const upstreamJson = await upstreamResponse.json() as Record<string, unknown>;
    const messageContent = String(
      ((upstreamJson.choices as Array<Record<string, unknown>> | undefined)?.[0]?.message as Record<string, unknown> | undefined)
        ?.content ?? "",
    );

    const result = normalizeModelResponse(JSON.parse(extractJson(messageContent)));
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
});
