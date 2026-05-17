import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { EmotionWheel } from "./EmotionWheel";
import { useAppPreferencesStore } from "../store/useAppPreferencesStore";
import type { MoodEntry, MoodSlot } from "../store/useAppPreferencesStore";
import { everdreamTheme } from "../theme/everdreamTheme";

const defaultEmotions = ["Happy", "Sad", "Angry", "Fearful", "Surprised", "Disgusted"];

function createId(prefix: string) {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function EmotionStudioScreen() {
  const { moodEntries, profile, saveMoodEntry, addCustomEmotion } = useAppPreferencesStore(useShallow((state) => ({
    moodEntries: state.mood_entries,
    profile: state.profile,
    saveMoodEntry: state.saveMoodEntry,
    addCustomEmotion: state.addCustomEmotion,
  })));
  const [slot, setSlot] = useState<MoodSlot>("morning");
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [emotionLevels, setEmotionLevels] = useState<Record<string, number>>({});
  const [reflection, setReflection] = useState("");
  const [customEmotionDraft, setCustomEmotionDraft] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const emotionList = useMemo(
    () => [...defaultEmotions, ...profile.custom_emotions].slice(0, 8),
    [profile.custom_emotions],
  );

  const currentEntry = useMemo(
    () => moodEntries.find((entry) => entry.date === today && entry.slot === slot),
    [moodEntries, slot, today],
  );

  useEffect(() => {
    const baseLevels = emotionList.reduce<Record<string, number>>((accumulator, emotion) => {
      accumulator[emotion] = currentEntry?.emotion_levels[emotion] ?? 0;
      return accumulator;
    }, {});
    setEmotionLevels(baseLevels);
    setReflection(currentEntry?.reflection ?? "");

    const strongestEmotion = Object.entries(baseLevels)
      .sort((left, right) => right[1] - left[1])[0]?.[0] ?? emotionList[0] ?? null;
    setSelectedEmotion(strongestEmotion);
  }, [currentEntry, emotionList]);

  const recentEntries = useMemo(
    () => moodEntries.slice(0, 5),
    [moodEntries],
  );

  const updateSelectedEmotionLevel = (level: number) => {
    if (!selectedEmotion) {
      return;
    }

    setEmotionLevels((current) => ({
      ...current,
      [selectedEmotion]: level,
    }));
  };

  const saveEntry = () => {
    const entry: MoodEntry = {
      id: currentEntry?.id ?? createId("mood"),
      date: today,
      slot,
      emotion_levels: emotionLevels,
      reflection,
      updated_at: new Date().toISOString(),
    };
    saveMoodEntry(entry);
  };

  const addEmotion = () => {
    addCustomEmotion(customEmotionDraft);
    setCustomEmotionDraft("");
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.heroBand}>
        <Text style={styles.eyebrow}>EMOTION WHEEL</Text>
        <Text style={styles.title}>Feeling Studio</Text>
        <Text style={styles.subtitle}>
          Shape the emotional tone that later feeds resonance, valence, and dream confirmation.
        </Text>
      </View>

      <View style={styles.band}>
        <Text style={styles.sectionTitle}>Check-In Window</Text>
        <View style={styles.segmentRow}>
          {(["morning", "evening"] as MoodSlot[]).map((nextSlot) => {
            const selected = nextSlot === slot;

            return (
              <Pressable
                key={nextSlot}
                onPress={() => setSlot(nextSlot)}
                style={[styles.segmentButton, selected ? styles.segmentButtonActive : null]}
              >
                <Text style={[styles.segmentText, selected ? styles.segmentTextActive : null]}>{nextSlot}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.band}>
        <Text style={styles.sectionTitle}>Wheel</Text>
        <EmotionWheel
          emotions={emotionList}
          levels={emotionLevels}
          selectedEmotion={selectedEmotion}
          onSelectEmotion={setSelectedEmotion}
        />
      </View>

      <View style={styles.band}>
        <Text style={styles.sectionTitle}>Intensity</Text>
        <Text style={styles.intensityLabel}>{selectedEmotion ?? "Select an emotion"}</Text>
        <View style={styles.levelRow}>
          {[0, 1, 2, 3, 4, 5].map((level) => {
            const selected = selectedEmotion ? (emotionLevels[selectedEmotion] ?? 0) === level : false;

            return (
              <Pressable
                key={level}
                onPress={() => updateSelectedEmotionLevel(level)}
                style={[styles.levelStep, selected ? styles.levelStepActive : null]}
              >
                <Text style={[styles.levelStepText, selected ? styles.levelStepTextActive : null]}>{level}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.band}>
        <Text style={styles.sectionTitle}>Reflection</Text>
        <TextInput
          multiline
          value={reflection}
          onChangeText={setReflection}
          placeholder="A short note about what the feeling actually felt like..."
          placeholderTextColor={everdreamTheme.colors.muted}
          style={styles.reflectionInput}
          textAlignVertical="top"
        />
        <Pressable onPress={saveEntry} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Save mood check-in</Text>
        </Pressable>
      </View>

      <View style={styles.band}>
        <Text style={styles.sectionTitle}>Custom Emotions</Text>
        <View style={styles.customRow}>
          <TextInput
            value={customEmotionDraft}
            onChangeText={setCustomEmotionDraft}
            placeholder="Add a custom feeling"
            placeholderTextColor={everdreamTheme.colors.muted}
            style={styles.customInput}
          />
          <Pressable onPress={addEmotion} style={styles.customButton}>
            <Text style={styles.customButtonText}>Add</Text>
          </Pressable>
        </View>
        <View style={styles.emotionTagRow}>
          {profile.custom_emotions.map((emotion) => (
            <View key={emotion} style={styles.emotionTag}>
              <Text style={styles.emotionTagText}>{emotion}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.band}>
        <Text style={styles.sectionTitle}>Recent Entries</Text>
        {recentEntries.map((entry) => {
          const strongest = Object.entries(entry.emotion_levels)
            .sort((left, right) => right[1] - left[1])[0];

          return (
            <View key={entry.id} style={styles.entryRow}>
              <View style={styles.entryHeader}>
                <Text style={styles.entrySlot}>{entry.slot}</Text>
                <Text style={styles.entryDate}>{entry.date}</Text>
              </View>
              <Text style={styles.entryEmotion}>
                {strongest ? `${strongest[0]} ${strongest[1]}/5` : "No dominant emotion"}
              </Text>
              <Text style={styles.entryReflection} numberOfLines={3}>
                {entry.reflection}
              </Text>
            </View>
          );
        })}
      </View>
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
    backgroundColor: everdreamTheme.colors.berrySoft,
    borderBottomWidth: 1,
    borderBottomColor: everdreamTheme.colors.line,
  },
  eyebrow: {
    color: everdreamTheme.colors.berry,
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
  segmentRow: {
    flexDirection: "row",
    gap: 10,
  },
  segmentButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
  },
  segmentButtonActive: {
    backgroundColor: everdreamTheme.colors.berry,
    borderColor: everdreamTheme.colors.berry,
  },
  segmentText: {
    color: everdreamTheme.colors.ink,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  segmentTextActive: {
    color: "#fff7fb",
  },
  intensityLabel: {
    color: everdreamTheme.colors.berry,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  levelRow: {
    flexDirection: "row",
    gap: 8,
  },
  levelStep: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
  },
  levelStepActive: {
    backgroundColor: everdreamTheme.colors.berrySoft,
    borderColor: everdreamTheme.colors.berry,
  },
  levelStepText: {
    color: everdreamTheme.colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  levelStepTextActive: {
    color: everdreamTheme.colors.berry,
  },
  reflectionInput: {
    minHeight: 120,
    backgroundColor: "#fcfaf5",
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    color: everdreamTheme.colors.ink,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: everdreamTheme.colors.berry,
  },
  primaryButtonText: {
    color: "#fff7fb",
    fontSize: 15,
    fontWeight: "700",
  },
  customRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  customInput: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: "#fcfaf5",
    paddingHorizontal: 12,
    color: everdreamTheme.colors.ink,
  },
  customButton: {
    minWidth: 82,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: everdreamTheme.colors.goldSoft,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.gold,
  },
  customButtonText: {
    color: everdreamTheme.colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  emotionTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  emotionTag: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
  },
  emotionTagText: {
    color: everdreamTheme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  entryRow: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: everdreamTheme.colors.line,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  entrySlot: {
    color: everdreamTheme.colors.berry,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  entryDate: {
    color: everdreamTheme.colors.muted,
    fontSize: 12,
  },
  entryEmotion: {
    color: everdreamTheme.colors.ink,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  entryReflection: {
    color: everdreamTheme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
