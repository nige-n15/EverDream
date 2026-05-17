import type { Dream, Json, SleepSession } from "../types/database";

export interface ScoreInputs {
  dream: Dream;
  sleepSession: SleepSession | null;
  resonanceScore: number;
  valence: number;
  arousal: number;
  themeCount: number;
  tSocialScore?: number;
}

export interface ScoreBreakdown {
  c_raw: number;
  r_user: number;
  i_semantic: number;
  s_valence: number;
  d_density: number;
  m_sustain: number;
  t_social: number;
  token_count: number;
  unique_token_count: number;
  named_entity_count: number;
  xp_score: number;
}

const themeDictionary = [
  "water",
  "flying",
  "chased",
  "fire",
  "forest",
  "ocean",
  "home",
  "door",
  "mirror",
  "train",
  "station",
  "mother",
  "father",
  "child",
  "animal",
  "moon",
  "shadow",
  "city",
  "garden",
  "school",
  "bridge",
  "river",
  "light",
  "stairs",
  "storm",
];

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function tokenizeNarrative(narrative: string) {
  return narrative
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function inferNamedEntityCount(narrative: string) {
  const matches = narrative.match(/\b[A-Z][a-z]{2,}\b/g) ?? [];
  return new Set(matches).size;
}

export function suggestThemesFromNarrative(narrative: string) {
  const lower = narrative.toLowerCase();
  const matchedThemes = themeDictionary.filter((theme) => lower.includes(theme));

  if (matchedThemes.length >= 3) {
    return matchedThemes.slice(0, 3);
  }

  const tokens = tokenizeNarrative(narrative)
    .map((token) => token.toLowerCase())
    .filter((token) => token.length >= 5);
  const tokenCounts = tokens.reduce<Record<string, number>>((accumulator, token) => {
    accumulator[token] = (accumulator[token] ?? 0) + 1;
    return accumulator;
  }, {});

  const frequentTokens = Object.entries(tokenCounts)
    .sort((left, right) => right[1] - left[1])
    .map(([token]) => token)
    .filter((token) => !matchedThemes.includes(token));

  return [...matchedThemes, ...frequentTokens].slice(0, 3);
}

export function calculateSleepRichness(session: SleepSession | null) {
  if (!session) {
    return 0.55;
  }

  const totalSleep = Math.max(session.total_sleep_minutes, 1);
  const remRatio = session.rem_minutes / totalSleep;
  const deepRatio = session.deep_minutes / totalSleep;
  return clamp(remRatio * 0.8 + deepRatio * 0.5 + 0.25, 0.2, 1.2);
}

export function calculateSemanticIntensity(dream: Dream, themeCount: number) {
  const tokens = tokenizeNarrative(dream.narrative);
  const uniqueTokenCount = new Set(tokens.map((token) => token.toLowerCase())).size;
  const namedEntityCount = inferNamedEntityCount(dream.narrative);
  const base = tokens.length / 140 + uniqueTokenCount / 240 + namedEntityCount * 0.08 + themeCount * 0.05;
  return {
    tokenCount: tokens.length,
    uniqueTokenCount,
    namedEntityCount,
    intensity: clamp(0.2 + base, 0.15, 1.35),
  };
}

export function calculateValenceMultiplier(valence: number, arousal: number) {
  const valenceWeight = Math.abs(valence) / 10;
  const arousalWeight = arousal / 20;
  return clamp(0.8 + valenceWeight + arousalWeight, 0.6, 1.5);
}

export function calculateDreamScore(inputs: ScoreInputs): ScoreBreakdown {
  const c_raw = calculateSleepRichness(inputs.sleepSession);
  const r_user = clamp(inputs.resonanceScore, 0, 1);
  const semantic = calculateSemanticIntensity(inputs.dream, inputs.themeCount);
  const s_valence = calculateValenceMultiplier(inputs.valence, inputs.arousal);
  const d_density = 1;
  const m_sustain = 1;
  const t_social = clamp(inputs.tSocialScore ?? 1, 0.5, 2);
  const xp_score = Number(((c_raw * r_user * semantic.intensity) * s_valence * d_density * m_sustain * t_social * 100).toFixed(2));

  return {
    c_raw: Number(c_raw.toFixed(3)),
    r_user: Number(r_user.toFixed(3)),
    i_semantic: Number(semantic.intensity.toFixed(3)),
    s_valence: Number(s_valence.toFixed(3)),
    d_density,
    m_sustain,
    t_social: Number(t_social.toFixed(3)),
    token_count: semantic.tokenCount,
    unique_token_count: semantic.uniqueTokenCount,
    named_entity_count: semantic.namedEntityCount,
    xp_score,
  };
}

export function mergeJsonObject(base: Json, patch: Record<string, Json>) {
  if (!base || typeof base !== "object" || Array.isArray(base)) {
    return patch;
  }

  return {
    ...base,
    ...patch,
  };
}
