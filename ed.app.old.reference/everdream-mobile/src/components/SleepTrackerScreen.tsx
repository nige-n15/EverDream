import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useAppPreferencesStore } from "../store/useAppPreferencesStore";
import { useDreamStore } from "../store/useDreamStore";
import type { SleepSession } from "../types/database";
import { everdreamTheme } from "../theme/everdreamTheme";

type SleepMetricKey = "rem_minutes" | "deep_minutes" | "light_minutes" | "awake_minutes";

const metricConfig: Array<{
  key: SleepMetricKey;
  label: string;
  color: string;
}> = [
  { key: "rem_minutes", label: "REM", color: everdreamTheme.colors.sleepRem },
  { key: "deep_minutes", label: "Deep", color: everdreamTheme.colors.sleepDeep },
  { key: "light_minutes", label: "Light", color: everdreamTheme.colors.sleepLight },
  { key: "awake_minutes", label: "Awake", color: everdreamTheme.colors.sleepAwake },
];

function createId(prefix: string) {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function scoreFromDraft(session: Pick<SleepSession, "rem_minutes" | "deep_minutes" | "light_minutes" | "awake_minutes">) {
  const totalSleep = session.rem_minutes + session.deep_minutes + session.light_minutes;

  if (totalSleep <= 0) {
    return 0;
  }

  const efficiency = totalSleep / Math.max(totalSleep + session.awake_minutes, 1);
  const remWeight = Math.min(session.rem_minutes / 120, 1) * 25;
  const deepWeight = Math.min(session.deep_minutes / 120, 1) * 35;
  const durationWeight = Math.min(totalSleep / 480, 1) * 25;
  const efficiencyWeight = efficiency * 15;

  return Math.round(remWeight + deepWeight + durationWeight + efficiencyWeight);
}

function shortDateLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function extractNightNote(session: SleepSession | undefined) {
  const rawData = session?.raw_data;

  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
    return "";
  }

  const note = rawData.note;
  return typeof note === "string" ? note : "";
}

export function SleepTrackerScreen() {
  const dreams = useDreamStore((state) => state.dreams);
  const {
    sleepSessions,
    selectedSleepDate,
    setSelectedSleepDate,
    upsertSleepSession,
  } = useAppPreferencesStore(useShallow((state) => ({
    sleepSessions: state.sleep_sessions,
    selectedSleepDate: state.selected_sleep_date,
    setSelectedSleepDate: state.setSelectedSleepDate,
    upsertSleepSession: state.upsertSleepSession,
  })));

  const sortedSessions = useMemo(
    () => [...sleepSessions].sort((left, right) => right.date.localeCompare(left.date)),
    [sleepSessions],
  );
  const selectedSession = sortedSessions.find((session) => session.date === selectedSleepDate) ?? sortedSessions[0];
  const [draftSession, setDraftSession] = useState<SleepSession | null>(selectedSession ?? null);
  const [nightNote, setNightNote] = useState<string>(() => extractNightNote(selectedSession));

  useEffect(() => {
    setDraftSession(selectedSession ?? null);
    setNightNote(extractNightNote(selectedSession));
  }, [selectedSession]);

  const captureCountsByDate = useMemo(() => {
    return dreams.reduce<Record<string, number>>((accumulator, dream) => {
      const date = dream.timestamp.slice(0, 10);
      accumulator[date] = (accumulator[date] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [dreams]);

  const updateMetric = (key: SleepMetricKey, delta: number) => {
    if (!draftSession) {
      return;
    }

    const nextValue = Math.max(0, draftSession[key] + delta);
    const nextDraft = {
      ...draftSession,
      [key]: nextValue,
    };
    const total_sleep_minutes = nextDraft.rem_minutes + nextDraft.deep_minutes + nextDraft.light_minutes;
    nextDraft.total_sleep_minutes = total_sleep_minutes;
    nextDraft.score = scoreFromDraft(nextDraft);
    setDraftSession(nextDraft);
  };

  const saveDraft = () => {
    if (!draftSession) {
      return;
    }

    upsertSleepSession({
      ...draftSession,
      raw_data: {
        ...(typeof draftSession.raw_data === "object" && draftSession.raw_data ? draftSession.raw_data : {}),
        note: nightNote,
      },
    });
  };

  const createTonightDraft = () => {
    const date = new Date().toISOString().slice(0, 10);
    const next: SleepSession = {
      id: createId("sleep"),
      user_id: "local-user",
      date,
      score: 0,
      rem_minutes: 90,
      deep_minutes: 60,
      light_minutes: 240,
      awake_minutes: 20,
      total_sleep_minutes: 390,
      source: "manual",
      wearable_device: null,
      raw_data: {},
      created_at: new Date().toISOString(),
    };
    setSelectedSleepDate(date);
    setDraftSession(next);
    setNightNote("");
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.heroBand}>
        <Text style={styles.eyebrow}>SLEEP TRACKER</Text>
        <Text style={styles.title}>Night Map</Text>
        <Text style={styles.subtitle}>
          See how the night moved and how often dream capture actually happened.
        </Text>
      </View>

      <View style={styles.band}>
        <Text style={styles.sectionTitle}>Recent Nights</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timelineRow}>
          {sortedSessions.map((session) => {
            const selected = session.date === selectedSleepDate;
            const dreamCount = captureCountsByDate[session.date] ?? 0;

            return (
              <Pressable
                key={session.id}
                onPress={() => setSelectedSleepDate(session.date)}
                style={[styles.nightPillar, selected ? styles.nightPillarSelected : null]}
              >
                <Text style={[styles.nightDate, selected ? styles.nightDateSelected : null]}>
                  {shortDateLabel(session.date)}
                </Text>
                <View style={styles.scoreTrack}>
                  <View style={[styles.scoreFill, { height: `${session.score}%` }]} />
                </View>
                <Text style={[styles.nightScore, selected ? styles.nightDateSelected : null]}>{Math.round(session.score)}</Text>
                <Text style={styles.nightMeta}>{dreamCount} dreams</Text>
              </Pressable>
            );
          })}

          <Pressable onPress={createTonightDraft} style={styles.newNightPillar}>
            <Text style={styles.newNightText}>New night</Text>
          </Pressable>
        </ScrollView>
      </View>

      {draftSession ? (
        <>
          <View style={styles.band}>
            <Text style={styles.sectionTitle}>Selected Night</Text>
            <View style={styles.snapshotRow}>
              <View style={styles.snapshotColumn}>
                <Text style={styles.snapshotLabel}>Date</Text>
                <Text style={styles.snapshotValue}>{shortDateLabel(draftSession.date)}</Text>
              </View>
              <View style={styles.snapshotColumn}>
                <Text style={styles.snapshotLabel}>Score</Text>
                <Text style={styles.snapshotValue}>{Math.round(draftSession.score)}</Text>
              </View>
              <View style={styles.snapshotColumn}>
                <Text style={styles.snapshotLabel}>Dreams</Text>
                <Text style={styles.snapshotValue}>{captureCountsByDate[draftSession.date] ?? 0}</Text>
              </View>
            </View>
          </View>

          <View style={styles.band}>
            <Text style={styles.sectionTitle}>Sleep Stages</Text>
            {metricConfig.map((metric) => {
              const minutes = draftSession[metric.key];
              const total = Math.max(draftSession.total_sleep_minutes + draftSession.awake_minutes, 1);
              const widthPercent = Math.max(8, Math.round((minutes / total) * 100));

              return (
                <View key={metric.key} style={styles.metricRow}>
                  <View style={styles.metricHeader}>
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                    <Text style={styles.metricValue}>{minutes} min</Text>
                  </View>
                  <View style={styles.metricTrack}>
                    <View style={[styles.metricFill, { width: `${widthPercent}%`, backgroundColor: metric.color }]} />
                  </View>
                  <View style={styles.metricStepper}>
                    <Pressable onPress={() => updateMetric(metric.key, -5)} style={styles.stepButton}>
                      <Text style={styles.stepButtonText}>-5</Text>
                    </Pressable>
                    <Pressable onPress={() => updateMetric(metric.key, 5)} style={styles.stepButton}>
                      <Text style={styles.stepButtonText}>+5</Text>
                    </Pressable>
                    <Pressable onPress={() => updateMetric(metric.key, 15)} style={styles.stepButtonStrong}>
                      <Text style={styles.stepButtonStrongText}>+15</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.band}>
            <Text style={styles.sectionTitle}>Night Note</Text>
            <TextInput
              multiline
              value={nightNote}
              onChangeText={setNightNote}
              placeholder="Manual note about the night, awakenings, or dream recall..."
              placeholderTextColor={everdreamTheme.colors.muted}
              style={styles.noteInput}
              textAlignVertical="top"
            />
            <Pressable onPress={saveDraft} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Save sleep session</Text>
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
    backgroundColor: everdreamTheme.colors.panel,
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
  timelineRow: {
    gap: 12,
    paddingRight: 24,
  },
  nightPillar: {
    width: 112,
    padding: 12,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
  },
  nightPillarSelected: {
    backgroundColor: everdreamTheme.colors.goldSoft,
    borderColor: everdreamTheme.colors.gold,
  },
  nightDate: {
    color: everdreamTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
    minHeight: 32,
    marginBottom: 10,
    fontWeight: "700",
  },
  nightDateSelected: {
    color: everdreamTheme.colors.ink,
  },
  scoreTrack: {
    height: 118,
    justifyContent: "flex-end",
    backgroundColor: "#f0e6d4",
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    marginBottom: 10,
  },
  scoreFill: {
    width: "100%",
    backgroundColor: everdreamTheme.colors.deepWater,
  },
  nightScore: {
    color: everdreamTheme.colors.ink,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "700",
    marginBottom: 4,
  },
  nightMeta: {
    color: everdreamTheme.colors.muted,
    fontSize: 12,
  },
  newNightPillar: {
    width: 112,
    minHeight: 212,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: everdreamTheme.colors.accent,
    backgroundColor: everdreamTheme.colors.accentSoft,
    padding: 12,
  },
  newNightText: {
    color: everdreamTheme.colors.accent,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  snapshotRow: {
    flexDirection: "row",
    gap: 12,
  },
  snapshotColumn: {
    flex: 1,
  },
  snapshotLabel: {
    color: everdreamTheme.colors.muted,
    fontSize: 12,
    marginBottom: 6,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  snapshotValue: {
    color: everdreamTheme.colors.ink,
    fontSize: 20,
    fontWeight: "700",
  },
  metricRow: {
    marginBottom: 18,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metricLabel: {
    color: everdreamTheme.colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  metricValue: {
    color: everdreamTheme.colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  metricTrack: {
    height: 18,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: "#f0e6d4",
    marginBottom: 10,
  },
  metricFill: {
    height: "100%",
  },
  metricStepper: {
    flexDirection: "row",
    gap: 10,
  },
  stepButton: {
    minHeight: 36,
    minWidth: 58,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
  },
  stepButtonStrong: {
    minHeight: 36,
    minWidth: 68,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: everdreamTheme.colors.panelStrong,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.gold,
  },
  stepButtonText: {
    color: everdreamTheme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  stepButtonStrongText: {
    color: everdreamTheme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  noteInput: {
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
    backgroundColor: everdreamTheme.colors.deepWater,
  },
  primaryButtonText: {
    color: "#f5fbfd",
    fontSize: 15,
    fontWeight: "700",
  },
});
