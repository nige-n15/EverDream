import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useShallow } from "zustand/react/shallow";
import { invokeAiProxy, type AiProxyResult } from "../lib/syncApi";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { useDreamStore } from "../store/useDreamStore";
import type { Dream, Json } from "../types/database";
import { clamp, mergeJsonObject, suggestThemesFromNarrative, tokenizeNarrative } from "../utils/scoringFormula";
import { everdreamTheme } from "../theme/everdreamTheme";

const fallbackThemePool = ["threshold", "memory", "motion", "shadow", "return"];

function isJsonRecord(value: Json | undefined): value is { [key: string]: Json | undefined } {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringArrayFromJson(value: Json | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function readProjectionFromDream(dream: Dream): AiProxyResult | null {
  if (!isJsonRecord(dream.ai_metadata)) {
    return null;
  }

  const tone = isJsonRecord(dream.ai_metadata.emotional_tone) ? dream.ai_metadata.emotional_tone : {};
  const summary = typeof dream.ai_metadata.narrative_summary === "string" ? dream.ai_metadata.narrative_summary : "";
  const themes = stringArrayFromJson(dream.ai_metadata.themes);

  if (!summary && themes.length === 0) {
    return null;
  }

  return {
    themes: themes.length ? themes : dream.themes,
    narrative_summary: summary || dream.narrative,
    emotional_tone: {
      valence: Number(tone.valence ?? dream.valence ?? 0),
      arousal: Number(tone.arousal ?? dream.arousal ?? 0),
      emotions: stringArrayFromJson(tone.emotions),
    },
  };
}

function buildFallbackSummary(narrative: string) {
  const sentences = narrative
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length >= 2) {
    return sentences.slice(0, 3).join(" ");
  }

  const tokens = tokenizeNarrative(narrative);
  const excerpt = tokens.slice(0, 42).join(" ");
  return excerpt
    ? `The dream centers on ${excerpt.toLowerCase()}. The strongest images should be checked by the dreamer before scoring.`
    : "The dream needs a longer narrative before a reliable synthesis can be created.";
}

function inferFallbackTone(narrative: string) {
  const lower = narrative.toLowerCase();
  const brightWords = ["calm", "love", "light", "friend", "happy", "safe", "home", "garden", "flying", "warm"];
  const heavyWords = ["fear", "chased", "dark", "lost", "angry", "storm", "falling", "shadow", "alone", "trapped"];
  const arousalWords = ["running", "chased", "storm", "fire", "falling", "flying", "urgent", "screaming", "fast"];
  const bright = brightWords.filter((word) => lower.includes(word)).length;
  const heavy = heavyWords.filter((word) => lower.includes(word)).length;
  const charged = arousalWords.filter((word) => lower.includes(word)).length;
  const valence = clamp(bright - heavy, -5, 5);
  const arousal = clamp(3 + charged * 2 + Math.max(bright, heavy), 0, 10);
  const emotions = [
    valence >= 1 ? "Curious" : "Uneasy",
    arousal >= 7 ? "Charged" : "Reflective",
    heavy > bright ? "Vulnerable" : "Open",
  ];

  return {
    valence,
    arousal,
    emotions,
  };
}

function createFallbackProjection(dream: Dream): AiProxyResult {
  const themes = suggestThemesFromNarrative(dream.narrative);

  for (const theme of fallbackThemePool) {
    if (themes.length >= 3) {
      break;
    }

    if (!themes.includes(theme)) {
      themes.push(theme);
    }
  }

  return {
    themes: themes.slice(0, 3),
    narrative_summary: buildFallbackSummary(dream.narrative),
    emotional_tone: inferFallbackTone(dream.narrative),
  };
}

export function AIVerifyScreen() {
  const router = useRouter();
  const { dreams, updateDream, isOnline } = useDreamStore(useShallow((state) => ({
    dreams: state.dreams,
    updateDream: state.updateDream,
    isOnline: state.isOnline,
  })));
  const [selectedDreamId, setSelectedDreamId] = useState<string | null>(dreams[0]?.id ?? null);
  const selectedDream = dreams.find((dream) => dream.id === selectedDreamId) ?? dreams[0] ?? null;
  const [projection, setProjection] = useState<AiProxyResult | null>(selectedDream ? readProjectionFromDream(selectedDream) : null);
  const [resonanceScore, setResonanceScore] = useState(selectedDream?.resonance_score ?? 0.72);
  const [valence, setValence] = useState(selectedDream?.valence ?? 0);
  const [arousal, setArousal] = useState(selectedDream?.arousal ?? 5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDream) {
      setProjection(null);
      return;
    }

    const existingProjection = readProjectionFromDream(selectedDream);
    setProjection(existingProjection);
    setResonanceScore(selectedDream.resonance_score || 0.72);
    setValence(existingProjection?.emotional_tone.valence ?? selectedDream.valence ?? 0);
    setArousal(existingProjection?.emotional_tone.arousal ?? selectedDream.arousal ?? 5);
    setStatusText(null);
  }, [selectedDream]);

  const sortedDreams = useMemo(
    () => [...dreams].sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp)),
    [dreams],
  );

  const runProjection = async () => {
    if (!selectedDream) {
      return;
    }

    setIsProcessing(true);
    setStatusText(null);

    try {
      const nextProjection = isSupabaseConfigured && isOnline
        ? await invokeAiProxy({
            narrative: selectedDream.narrative,
            media_type: selectedDream.media_type,
          })
        : createFallbackProjection(selectedDream);

      setProjection(nextProjection);
      setValence(nextProjection.emotional_tone.valence);
      setArousal(nextProjection.emotional_tone.arousal);
      setStatusText(isSupabaseConfigured && isOnline ? "Qwen projection received." : "Local projection created for app testing.");
    } catch (error) {
      const fallback = createFallbackProjection(selectedDream);
      setProjection(fallback);
      setValence(fallback.emotional_tone.valence);
      setArousal(fallback.emotional_tone.arousal);
      setStatusText(error instanceof Error ? `AI proxy unavailable, using local fallback: ${error.message}` : "AI proxy unavailable, using local fallback.");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmProjection = async () => {
    if (!selectedDream || !projection) {
      return;
    }

    await updateDream(selectedDream.id, {
      themes: projection.themes,
      valence,
      arousal,
      resonance_score: Number(resonanceScore.toFixed(2)),
      ai_metadata: mergeJsonObject(selectedDream.ai_metadata, {
        provider: isSupabaseConfigured ? "qwen-2.5-7b-instruct" : "local-fallback",
        themes: projection.themes,
        narrative_summary: projection.narrative_summary,
        emotional_tone: {
          valence,
          arousal,
          emotions: projection.emotional_tone.emotions,
        },
      }),
      verification_metadata: mergeJsonObject(selectedDream.verification_metadata, {
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        resonance_score: Number(resonanceScore.toFixed(2)),
        nic_loop: {
          narrate_at: selectedDream.created_at,
          interact_at: new Date().toISOString(),
          confirm_at: new Date().toISOString(),
        },
      }),
    });
    setStatusText("Verification saved. This dream is ready for XP scoring.");
    
    // Navigate to post-capture screen
    router.push("/post-capture");
  };

  const isConfirmDisabled = !selectedDream || !projection || isProcessing;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.heroBand}>
        <Text style={styles.eyebrow}>AI VERIFICATION</Text>
        <Text style={styles.title}>N-I-C Loop</Text>
        <Text style={styles.subtitle}>
          Narrate the dream, let the verifier propose themes and tone, then confirm resonance before scoring.
        </Text>
      </View>

      <View style={styles.band}>
        <Text style={styles.sectionTitle}>Dream Queue</Text>
        {sortedDreams.length === 0 ? (
          <Text style={styles.emptyText}>Capture a text, audio, or video dream first. The verifier needs a narrative to work from.</Text>
        ) : (
          <View style={styles.selectorColumn}>
            {sortedDreams.map((dream) => {
              const selected = selectedDream?.id === dream.id;
              return (
                <Pressable
                  key={dream.id}
                  onPress={() => setSelectedDreamId(dream.id)}
                  style={[styles.dreamRow, selected ? styles.dreamRowActive : null]}
                >
                  <View style={styles.dreamRowCopy}>
                    <Text style={styles.dreamRowMeta}>{dream.media_type} · resonance {Math.round(dream.resonance_score * 100)}%</Text>
                    <Text style={styles.dreamRowText} numberOfLines={2}>{dream.narrative}</Text>
                  </View>
                  <Text style={styles.dreamRowStatus}>{dream.themes.length ? "checked" : "new"}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {selectedDream ? (
        <>
          <View style={styles.band}>
            <Text style={styles.sectionTitle}>Narrate</Text>
            <View style={styles.narrativeFrame}>
              <Text style={styles.narrativeText}>{selectedDream.narrative}</Text>
            </View>
            <Pressable onPress={runProjection} style={[styles.primaryButton, isProcessing ? styles.primaryButtonDisabled : null]} disabled={isProcessing}>
              <Text style={styles.primaryButtonText}>{isProcessing ? "Projecting..." : "Generate Projection"}</Text>
            </Pressable>
          </View>

          {projection ? (
            <>
              <View style={styles.band}>
                <Text style={styles.sectionTitle}>Interact</Text>
                <Text style={styles.fieldLabel}>Themes</Text>
                <View style={styles.themeWrap}>
                  {projection.themes.map((theme) => (
                    <Text key={theme} style={styles.themeChip}>{theme}</Text>
                  ))}
                </View>
                <Text style={styles.fieldLabel}>Summary</Text>
                <Text style={styles.summaryText}>{projection.narrative_summary}</Text>
                <Text style={styles.fieldLabel}>Emotions</Text>
                <View style={styles.themeWrap}>
                  {projection.emotional_tone.emotions.map((emotion) => (
                    <Text key={emotion} style={styles.emotionChip}>{emotion}</Text>
                  ))}
                </View>
              </View>

              <View style={styles.band}>
                <Text style={styles.sectionTitle}>Confirm</Text>
                <Stepper
                  label="Resonance"
                  value={`${Math.round(resonanceScore * 100)}%`}
                  onDecrease={() => setResonanceScore((current) => clamp(Number((current - 0.05).toFixed(2)), 0, 1))}
                  onIncrease={() => setResonanceScore((current) => clamp(Number((current + 0.05).toFixed(2)), 0, 1))}
                />
                <Stepper
                  label="Valence"
                  value={String(valence)}
                  onDecrease={() => setValence((current) => clamp(current - 1, -5, 5))}
                  onIncrease={() => setValence((current) => clamp(current + 1, -5, 5))}
                />
                <Stepper
                  label="Arousal"
                  value={String(arousal)}
                  onDecrease={() => setArousal((current) => clamp(current - 1, 0, 10))}
                  onIncrease={() => setArousal((current) => clamp(current + 1, 0, 10))}
                />
                <Pressable
                  onPress={confirmProjection}
                  style={[styles.confirmButton, isConfirmDisabled ? styles.primaryButtonDisabled : null]}
                  disabled={isConfirmDisabled}
                >
                  <Text style={styles.confirmButtonText}>Save Verification</Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </>
      ) : null}

      {statusText ? (
        <View style={styles.statusBand}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Stepper({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable onPress={onDecrease} style={styles.stepperButton}>
          <Text style={styles.stepperButtonText}>-</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable onPress={onIncrease} style={styles.stepperButton}>
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: everdreamTheme.colors.background,
  },
  content: {
    paddingBottom: 36,
  },
  heroBand: {
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 28,
    backgroundColor: "#e8efe4",
    borderBottomWidth: 1,
    borderBottomColor: everdreamTheme.colors.line,
  },
  eyebrow: {
    color: everdreamTheme.colors.deepWater,
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 12,
    fontWeight: "700",
  },
  title: {
    color: everdreamTheme.colors.ink,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: everdreamTheme.displayFont,
    marginBottom: 12,
  },
  subtitle: {
    color: everdreamTheme.colors.muted,
    fontSize: 16,
    lineHeight: 23,
  },
  band: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: everdreamTheme.colors.line,
  },
  sectionTitle: {
    color: everdreamTheme.colors.ink,
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 16,
    fontFamily: everdreamTheme.displayFont,
  },
  emptyText: {
    color: everdreamTheme.colors.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  selectorColumn: {
    gap: 12,
  },
  dreamRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
    padding: 14,
  },
  dreamRowActive: {
    backgroundColor: "#eef3dc",
    borderColor: everdreamTheme.colors.accent,
  },
  dreamRowCopy: {
    flex: 1,
  },
  dreamRowMeta: {
    color: everdreamTheme.colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  dreamRowText: {
    color: everdreamTheme.colors.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  dreamRowStatus: {
    color: everdreamTheme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  narrativeFrame: {
    padding: 16,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: "#fcfaf5",
    marginBottom: 16,
  },
  narrativeText: {
    color: everdreamTheme.colors.ink,
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: everdreamTheme.colors.deepWater,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: "#f5fbfd",
    fontSize: 15,
    fontWeight: "700",
  },
  fieldLabel: {
    color: everdreamTheme.colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 8,
  },
  themeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  themeChip: {
    color: everdreamTheme.colors.deepWater,
    backgroundColor: everdreamTheme.colors.accentSoft,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  emotionChip: {
    color: everdreamTheme.colors.berry,
    backgroundColor: everdreamTheme.colors.berrySoft,
    borderWidth: 1,
    borderColor: "#dda9bf",
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  summaryText: {
    color: everdreamTheme.colors.ink,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  stepperLabel: {
    color: everdreamTheme.colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
  },
  stepperButton: {
    width: 44,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonText: {
    color: everdreamTheme.colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  stepperValue: {
    width: 72,
    textAlign: "center",
    color: everdreamTheme.colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  confirmButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: everdreamTheme.colors.accent,
    marginTop: 4,
  },
  confirmButtonText: {
    color: "#f5fbfd",
    fontSize: 15,
    fontWeight: "700",
  },
  statusBand: {
    marginHorizontal: 24,
    marginTop: 20,
    padding: 14,
    backgroundColor: everdreamTheme.colors.goldSoft,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.gold,
  },
  statusText: {
    color: everdreamTheme.colors.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
});
