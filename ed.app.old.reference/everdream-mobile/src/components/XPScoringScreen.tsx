import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useDreamStore } from "../store/useDreamStore";
import { useAppPreferencesStore } from "../store/useAppPreferencesStore";
import type { Dream, Json } from "../types/database";
import { everdreamTheme } from "../theme/everdreamTheme";
import { calculateDreamScore, mergeJsonObject, suggestThemesFromNarrative } from "../utils/scoringFormula";

const resonanceOptions = [0.3, 0.45, 0.6, 0.75, 0.9, 1.0];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function dreamDateKey(dream: Dream) {
  return dream.timestamp.slice(0, 10);
}

function getJsonObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export function XPScoringScreen() {
  const { dreams, updateDream } = useDreamStore(useShallow((state) => ({
    dreams: state.dreams,
    updateDream: state.updateDream,
  })));
  const { sleepSessions, profile } = useAppPreferencesStore(useShallow((state) => ({
    sleepSessions: state.sleep_sessions,
    profile: state.profile,
  })));

  const scoredDreams = useMemo(
    () => [...dreams].sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp)),
    [dreams],
  );
  const [selectedDreamId, setSelectedDreamId] = useState<string | null>(scoredDreams[0]?.id ?? null);
  const selectedDream = scoredDreams.find((dream) => dream.id === selectedDreamId) ?? scoredDreams[0] ?? null;
  const linkedSleepSession = useMemo(() => {
    if (!selectedDream) {
      return null;
    }

    return sleepSessions.find((session) => session.id === selectedDream.sleep_session_id)
      ?? sleepSessions.find((session) => session.date === dreamDateKey(selectedDream))
      ?? null;
  }, [selectedDream, sleepSessions]);

  const [resonanceScore, setResonanceScore] = useState(0.75);
  const [valence, setValence] = useState(2);
  const [arousal, setArousal] = useState(4);
  const [themeDraft, setThemeDraft] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedDream) {
      return;
    }

    const existingThemes = selectedDream.themes.length ? selectedDream.themes : suggestThemesFromNarrative(selectedDream.narrative);
    setThemeDraft(existingThemes);
    setResonanceScore(selectedDream.resonance_score > 0 ? selectedDream.resonance_score : 0.75);
    setValence(selectedDream.valence);
    setArousal(selectedDream.arousal);
  }, [selectedDream]);

  const scoreBreakdown = useMemo(() => {
    if (!selectedDream) {
      return null;
    }

    return calculateDreamScore({
      dream: selectedDream,
      sleepSession: linkedSleepSession,
      resonanceScore,
      valence,
      arousal,
      themeCount: themeDraft.length,
      tSocialScore: profile.t_social_score,
    });
  }, [selectedDream, linkedSleepSession, resonanceScore, valence, arousal, themeDraft, profile.t_social_score]);

  const suggestedThemes = useMemo(() => {
    if (!selectedDream) {
      return [];
    }

    const suggestions = suggestThemesFromNarrative(selectedDream.narrative);
    return Array.from(new Set([...themeDraft, ...suggestions])).slice(0, 6);
  }, [selectedDream, themeDraft]);

  const toggleTheme = (theme: string) => {
    setThemeDraft((current) => {
      if (current.includes(theme)) {
        return current.filter((item) => item !== theme);
      }

      return [...current, theme].slice(0, 3);
    });
  };

  const saveScore = async () => {
    if (!selectedDream || !scoreBreakdown) {
      return;
    }

    const aiMetadata = mergeJsonObject(selectedDream.ai_metadata, {
      scoring_snapshot: scoreBreakdown as unknown as Json,
      scoring_status: "confirmed",
    });
    const verificationMetadata = mergeJsonObject(selectedDream.verification_metadata, {
      scoring_confirmed_at: new Date().toISOString(),
      scoring_inputs: {
        resonance_score: resonanceScore,
        valence,
        arousal,
        themes: themeDraft,
      },
    });

    await updateDream(selectedDream.id, {
      resonance_score: resonanceScore,
      valence,
      arousal,
      themes: themeDraft,
      xp_score: scoreBreakdown.xp_score,
      ai_metadata: aiMetadata,
      verification_metadata: verificationMetadata,
    });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.heroBand}>
        <Text style={styles.eyebrow}>XP SCORING</Text>
        <Text style={styles.title}>Proof Studio</Text>
        <Text style={styles.subtitle}>
          Turn a captured dream into a scored proof with visible inputs, readable math, and a saveable result.
        </Text>
      </View>

      <View style={styles.band}>
        <Text style={styles.sectionTitle}>Dream Source</Text>
        {scoredDreams.length === 0 ? (
          <Text style={styles.emptyText}>Capture a dream first. Scoring needs a real narrative to work from.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>
            {scoredDreams.map((dream) => {
              const selected = dream.id === selectedDream?.id;
              return (
                <Pressable
                  key={dream.id}
                  onPress={() => setSelectedDreamId(dream.id)}
                  style={[styles.dreamCard, selected ? styles.dreamCardActive : null]}
                >
                  <Text style={[styles.dreamCardType, selected ? styles.dreamCardTypeActive : null]}>
                    {dream.media_type}
                  </Text>
                  <Text style={styles.dreamCardText} numberOfLines={4}>
                    {dream.narrative}
                  </Text>
                  <Text style={styles.dreamCardMeta}>
                    {dream.xp_score > 0 ? `${dream.xp_score} XP saved` : "unscored"}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {selectedDream && scoreBreakdown ? (
        <>
          <View style={styles.band}>
            <Text style={styles.sectionTitle}>Verification Inputs</Text>
            <Text style={styles.fieldLabel}>Resonance</Text>
            <View style={styles.optionRow}>
              {resonanceOptions.map((option) => {
                const selected = option === resonanceScore;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setResonanceScore(option)}
                    style={[styles.optionChip, selected ? styles.optionChipActive : null]}
                  >
                    <Text style={[styles.optionChipText, selected ? styles.optionChipTextActive : null]}>
                      {Math.round(option * 100)}%
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Valence</Text>
            <View style={styles.stepperRow}>
              <Pressable onPress={() => setValence((current) => clamp(current - 1, -5, 5))} style={styles.stepButton}>
                <Text style={styles.stepButtonText}>-</Text>
              </Pressable>
              <View style={styles.readout}>
                <Text style={styles.readoutLabel}>Valence</Text>
                <Text style={styles.readoutValue}>{valence}</Text>
              </View>
              <Pressable onPress={() => setValence((current) => clamp(current + 1, -5, 5))} style={styles.stepButton}>
                <Text style={styles.stepButtonText}>+</Text>
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Arousal</Text>
            <View style={styles.stepperRow}>
              <Pressable onPress={() => setArousal((current) => clamp(current - 1, 0, 10))} style={styles.stepButton}>
                <Text style={styles.stepButtonText}>-</Text>
              </Pressable>
              <View style={styles.readout}>
                <Text style={styles.readoutLabel}>Arousal</Text>
                <Text style={styles.readoutValue}>{arousal}</Text>
              </View>
              <Pressable onPress={() => setArousal((current) => clamp(current + 1, 0, 10))} style={styles.stepButton}>
                <Text style={styles.stepButtonText}>+</Text>
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Themes</Text>
            <View style={styles.themeWrap}>
              {suggestedThemes.map((theme) => {
                const selected = themeDraft.includes(theme);
                return (
                  <Pressable
                    key={theme}
                    onPress={() => toggleTheme(theme)}
                    style={[styles.themeChip, selected ? styles.themeChipActive : null]}
                  >
                    <Text style={[styles.themeChipText, selected ? styles.themeChipTextActive : null]}>{theme}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.band}>
            <Text style={styles.sectionTitle}>Formula Readout</Text>
            <View style={styles.breakdownGrid}>
              <View style={styles.breakdownCell}>
                <Text style={styles.breakdownLabel}>C_raw</Text>
                <Text style={styles.breakdownValue}>{scoreBreakdown.c_raw}</Text>
              </View>
              <View style={styles.breakdownCell}>
                <Text style={styles.breakdownLabel}>R_user</Text>
                <Text style={styles.breakdownValue}>{scoreBreakdown.r_user}</Text>
              </View>
              <View style={styles.breakdownCell}>
                <Text style={styles.breakdownLabel}>I_semantic</Text>
                <Text style={styles.breakdownValue}>{scoreBreakdown.i_semantic}</Text>
              </View>
              <View style={styles.breakdownCell}>
                <Text style={styles.breakdownLabel}>S_valence</Text>
                <Text style={styles.breakdownValue}>{scoreBreakdown.s_valence}</Text>
              </View>
              <View style={styles.breakdownCell}>
                <Text style={styles.breakdownLabel}>Tokens</Text>
                <Text style={styles.breakdownValue}>{scoreBreakdown.token_count}</Text>
              </View>
              <View style={styles.breakdownCell}>
                <Text style={styles.breakdownLabel}>Entities</Text>
                <Text style={styles.breakdownValue}>{scoreBreakdown.named_entity_count}</Text>
              </View>
            </View>

            <View style={styles.scoreBanner}>
              <View>
                <Text style={styles.scoreBannerLabel}>V_XAEL</Text>
                <Text style={styles.scoreBannerValue}>{scoreBreakdown.xp_score} XP</Text>
              </View>
              <Text style={styles.scoreBannerMeta}>
                {linkedSleepSession ? `linked sleep score ${Math.round(linkedSleepSession.score)}` : "no sleep session linked"}
              </Text>
            </View>

            <TextInput
              value={selectedDream.narrative}
              editable={false}
              multiline
              style={styles.readonlyNarrative}
            />

            <Pressable onPress={saveScore} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Save score to dream</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </ScrollView>
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
    backgroundColor: everdreamTheme.colors.goldSoft,
    borderBottomWidth: 1,
    borderBottomColor: everdreamTheme.colors.line,
  },
  eyebrow: {
    color: everdreamTheme.colors.gold,
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
  selectorRow: {
    gap: 12,
    paddingRight: 24,
  },
  dreamCard: {
    width: 220,
    padding: 14,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
  },
  dreamCardActive: {
    backgroundColor: "#fcf6e6",
    borderColor: everdreamTheme.colors.gold,
  },
  dreamCardType: {
    color: everdreamTheme.colors.gold,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  dreamCardTypeActive: {
    color: everdreamTheme.colors.ink,
  },
  dreamCardText: {
    color: everdreamTheme.colors.ink,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
    marginBottom: 12,
  },
  dreamCardMeta: {
    color: everdreamTheme.colors.muted,
    fontSize: 12,
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
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  optionChip: {
    minWidth: 72,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
    paddingHorizontal: 10,
  },
  optionChipActive: {
    backgroundColor: everdreamTheme.colors.goldSoft,
    borderColor: everdreamTheme.colors.gold,
  },
  optionChipText: {
    color: everdreamTheme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  optionChipTextActive: {
    color: everdreamTheme.colors.ink,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  stepButton: {
    width: 52,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: everdreamTheme.colors.surface,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
  },
  stepButtonText: {
    color: everdreamTheme.colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  readout: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fcfaf5",
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
  },
  readoutLabel: {
    color: everdreamTheme.colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 2,
  },
  readoutValue: {
    color: everdreamTheme.colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  themeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  themeChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
  },
  themeChipActive: {
    backgroundColor: everdreamTheme.colors.goldSoft,
    borderColor: everdreamTheme.colors.gold,
  },
  themeChipText: {
    color: everdreamTheme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  themeChipTextActive: {
    color: everdreamTheme.colors.ink,
  },
  breakdownGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },
  breakdownCell: {
    width: "31%",
    minWidth: 90,
    padding: 12,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
  },
  breakdownLabel: {
    color: everdreamTheme.colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 4,
  },
  breakdownValue: {
    color: everdreamTheme.colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  scoreBanner: {
    padding: 16,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.gold,
    backgroundColor: "#fcf6e6",
    marginBottom: 16,
    gap: 6,
  },
  scoreBannerLabel: {
    color: everdreamTheme.colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 4,
  },
  scoreBannerValue: {
    color: everdreamTheme.colors.ink,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "700",
  },
  scoreBannerMeta: {
    color: everdreamTheme.colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  readonlyNarrative: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: "#fcfaf5",
    color: everdreamTheme.colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: everdreamTheme.colors.gold,
  },
  primaryButtonText: {
    color: "#211400",
    fontSize: 15,
    fontWeight: "700",
  },
});
