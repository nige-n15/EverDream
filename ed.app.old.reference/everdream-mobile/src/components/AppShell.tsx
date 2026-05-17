import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { CaptureScreen } from "./CaptureScreen";
import { AIVerifyScreen } from "./AIVerifyScreen";
import { SleepTrackerScreen } from "./SleepTrackerScreen";
import { EmotionStudioScreen } from "./EmotionStudioScreen";
import { ProfileSettingsScreen } from "./ProfileSettingsScreen";
import { XPScoringScreen } from "./XPScoringScreen";
import { NFTMintScreen } from "./NFTMintScreen";
import { useSyncQueue } from "../hooks/useSyncQueue";
import { everdreamTheme } from "../theme/everdreamTheme";

type AppTab = "capture" | "verify" | "sleep" | "emotions" | "score" | "mint" | "profile";

const tabs: Array<{ key: AppTab; label: string; shortLabel: string }> = [
  { key: "capture", label: "Capture", shortLabel: "Wake Log" },
  { key: "verify", label: "Verify", shortLabel: "N-I-C Loop" },
  { key: "sleep", label: "Sleep", shortLabel: "Night Map" },
  { key: "emotions", label: "Emotions", shortLabel: "Feeling Wheel" },
  { key: "score", label: "Score", shortLabel: "Proof Studio" },
  { key: "mint", label: "Mint", shortLabel: "Chain Desk" },
  { key: "profile", label: "Profile", shortLabel: "Vault Settings" },
];

export function AppShell() {
  const [activeTab, setActiveTab] = useState<AppTab>("capture");
  const { pendingCount, failedCount, isOnline } = useSyncQueue();

  const activeMeta = useMemo(
    () => tabs.find((tab) => tab.key === activeTab) ?? tabs[0],
    [activeTab],
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerBand}>
        <View>
          <Text style={styles.brand}>EVERDREAM</Text>
          <Text style={styles.activeLabel}>{activeMeta.shortLabel}</Text>
        </View>
        <View style={styles.syncSummary}>
          <Text style={styles.syncText}>{isOnline ? "online" : "offline"}</Text>
          <Text style={styles.syncText}>{pendingCount} pending</Text>
          <Text style={styles.syncText}>{failedCount} failed</Text>
        </View>
      </View>

      <View style={styles.content}>
        {activeTab === "capture" ? <CaptureScreen /> : null}
        {activeTab === "verify" ? <AIVerifyScreen /> : null}
        {activeTab === "sleep" ? <SleepTrackerScreen /> : null}
        {activeTab === "emotions" ? <EmotionStudioScreen /> : null}
        {activeTab === "score" ? <XPScoringScreen /> : null}
        {activeTab === "mint" ? <NFTMintScreen /> : null}
        {activeTab === "profile" ? <ProfileSettingsScreen /> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {tabs.map((tab) => {
          const selected = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabButton, selected ? styles.tabButtonActive : null]}
            >
              <Text style={[styles.tabLabel, selected ? styles.tabLabelActive : null]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: everdreamTheme.colors.background,
  },
  headerBand: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.panelStrong,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
  },
  brand: {
    color: everdreamTheme.colors.accent,
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: "700",
    marginBottom: 6,
  },
  activeLabel: {
    color: everdreamTheme.colors.ink,
    fontSize: 24,
    lineHeight: 28,
    fontFamily: everdreamTheme.displayFont,
  },
  syncSummary: {
    alignItems: "flex-end",
    gap: 2,
  },
  syncText: {
    color: everdreamTheme.colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
    maxHeight: 74,
  },
  tabBarContent: {
    minHeight: 74,
  },
  tabButton: {
    minWidth: 112,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: everdreamTheme.colors.line,
  },
  tabButtonActive: {
    backgroundColor: everdreamTheme.colors.accentSoft,
  },
  tabLabel: {
    color: everdreamTheme.colors.muted,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  tabLabelActive: {
    color: everdreamTheme.colors.accent,
  },
});
