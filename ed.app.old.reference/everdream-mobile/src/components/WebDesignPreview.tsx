import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { everdreamTheme } from "../theme/everdreamTheme";

type PreviewTab = "capture" | "verify" | "sleep" | "emotions" | "score" | "mint" | "profile";

const previewTabs: Array<{ key: PreviewTab; label: string; subtitle: string }> = [
  { key: "capture", label: "Capture", subtitle: "Wake Log" },
  { key: "verify", label: "Verify", subtitle: "N-I-C Loop" },
  { key: "sleep", label: "Sleep", subtitle: "Night Map" },
  { key: "emotions", label: "Emotions", subtitle: "Feeling Studio" },
  { key: "score", label: "Score", subtitle: "Proof Studio" },
  { key: "mint", label: "Mint", subtitle: "Chain Desk" },
  { key: "profile", label: "Profile", subtitle: "Vault Settings" },
];

const previewNotes: Record<PreviewTab, string> = {
  capture: "Web preview mode is visual only. Native camera, microphone, encryption, and offline save flows remain in the mobile build.",
  verify: "This mirrors the verification layout and hierarchy while leaving the live Qwen flow to the native app and Supabase edge function.",
  sleep: "The sleep tracker preview keeps the same tone, spacing, and dashboard structure without the persisted store wiring.",
  emotions: "The feeling studio keeps the wheel, intensity, and reflection language intact so we can tune the look before device testing.",
  score: "The XP view stays readable and math-forward, letting us evaluate the visual hierarchy of the scoring formula without live data.",
  mint: "The mint desk remains a presentation mock here so we can judge readiness badges, metadata framing, and action emphasis.",
  profile: "The profile preview focuses on posture, privacy, and wearable settings so the settings information architecture is visible on desktop.",
};

export function WebDesignPreview() {
  const [activeTab, setActiveTab] = useState<PreviewTab>("capture");
  const activeMeta = useMemo(
    () => previewTabs.find((tab) => tab.key === activeTab) ?? previewTabs[0],
    [activeTab],
  );

  return (
    <View style={styles.root}>
      <View style={styles.backgroundWash}>
        <View style={styles.backgroundOrbA} />
        <View style={styles.backgroundOrbB} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headerFrame}>
          <Text style={styles.brand}>EVERDREAM / WEB PREVIEW</Text>
          <Text style={styles.title}>{activeMeta.subtitle}</Text>
          <Text style={styles.subtitle}>
            A browser-safe design review surface for the mobile app. The real native logic still lives in the Expo build.
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {previewTabs.map((tab) => {
            const selected = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabChip, selected ? styles.tabChipActive : null]}
              >
                <Text style={[styles.tabChipLabel, selected ? styles.tabChipLabelActive : null]}>{tab.label}</Text>
                <Text style={[styles.tabChipMeta, selected ? styles.tabChipMetaActive : null]}>{tab.subtitle}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.previewNote}>{previewNotes[activeTab]}</Text>

        {activeTab === "capture" ? <CapturePreview /> : null}
        {activeTab === "verify" ? <VerifyPreview /> : null}
        {activeTab === "sleep" ? <SleepPreview /> : null}
        {activeTab === "emotions" ? <EmotionPreview /> : null}
        {activeTab === "score" ? <ScorePreview /> : null}
        {activeTab === "mint" ? <MintPreview /> : null}
        {activeTab === "profile" ? <ProfilePreview /> : null}
      </ScrollView>
    </View>
  );
}

function CapturePreview() {
  return (
    <>
      <SectionCard eyebrow="CAPTURE FLOW" title="Wake-state recorder">
        <View style={styles.dualColumn}>
          <View style={styles.previewPanel}>
            <Text style={styles.panelTitle}>Mode switch</Text>
            <View style={styles.inlineChipRow}>
              <Pill label="Video" active />
              <Pill label="Audio" />
              <Pill label="Text" />
            </View>
            <Text style={styles.panelBody}>The first screen feels like a ritual object: warm paper tones, grounded typography, and one obvious next action.</Text>
          </View>
          <View style={[styles.previewPanel, styles.deviceFrame]}>
            <View style={styles.cameraBlock} />
            <View style={styles.deviceControls}>
              <MiniStat label="status" value="draft" />
              <MiniStat label="queue" value="2 pending" />
            </View>
          </View>
        </View>
      </SectionCard>

      <SectionCard eyebrow="RECENT CAPTURES" title="Memory feed">
        <PreviewList
          items={[
            "Video / 07:12 / I was walking through a market built inside a flooded train station.",
            "Audio / 06:48 / A bright room, blue birds, and a feeling that I had forgotten an important name.",
            "Text / 05:59 / I kept opening doors that led back into my childhood bedroom.",
          ]}
        />
      </SectionCard>
    </>
  );
}

function VerifyPreview() {
  return (
    <>
      <SectionCard eyebrow="N-I-C LOOP" title="Verifier dialogue">
        <View style={styles.dualColumn}>
          <View style={styles.previewPanel}>
            <Text style={styles.panelTitle}>Interact panel</Text>
            <View style={styles.inlineChipRow}>
              <Pill label="water" active />
              <Pill label="threshold" active />
              <Pill label="return" active />
            </View>
            <Text style={styles.panelBody}>
              The dream centers on submerged transit spaces and the feeling of re-entering an old self. The preview keeps the tags compact and the summary airy enough to read quickly.
            </Text>
          </View>
          <View style={styles.previewPanel}>
            <Text style={styles.panelTitle}>Confirm panel</Text>
            <StepperPreview label="Resonance" value="75%" />
            <StepperPreview label="Valence" value="+2" />
            <StepperPreview label="Arousal" value="6" />
          </View>
        </View>
      </SectionCard>
    </>
  );
}

function SleepPreview() {
  return (
    <>
      <SectionCard eyebrow="SLEEP TRACKER" title="Night map">
        <View style={styles.timelinePreview}>
          {[82, 74, 88, 69, 77].map((score, index) => (
            <View key={`${score}-${index}`} style={styles.timelinePillar}>
              <View style={styles.timelineTrack}>
                <View style={[styles.timelineFill, { height: `${score}%` }]} />
              </View>
              <Text style={styles.timelineScore}>{score}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard eyebrow="SLEEP STAGES" title="Manual tuning">
        <MetricPreview label="REM" value="96 min" width="58%" color={everdreamTheme.colors.sleepRem} />
        <MetricPreview label="Deep" value="78 min" width="44%" color={everdreamTheme.colors.sleepDeep} />
        <MetricPreview label="Light" value="241 min" width="81%" color={everdreamTheme.colors.sleepLight} />
        <MetricPreview label="Awake" value="21 min" width="18%" color={everdreamTheme.colors.sleepAwake} />
      </SectionCard>
    </>
  );
}

function EmotionPreview() {
  return (
    <>
      <SectionCard eyebrow="EMOTION WHEEL" title="Feeling studio">
        <View style={styles.dualColumn}>
          <View style={styles.previewPanel}>
            <Text style={styles.panelTitle}>Wheel focus</Text>
            <View style={styles.emotionGrid}>
              {["Happy", "Fearful", "Tender", "Surprised", "Restless", "Sad"].map((emotion, index) => (
                <View key={emotion} style={[styles.emotionBubble, index === 2 ? styles.emotionBubbleActive : null]}>
                  <Text style={[styles.emotionBubbleText, index === 2 ? styles.emotionBubbleTextActive : null]}>{emotion}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.previewPanel}>
            <Text style={styles.panelTitle}>Intensity</Text>
            <View style={styles.inlineChipRow}>
              {[0, 1, 2, 3, 4, 5].map((level) => (
                <Pill key={level} label={String(level)} active={level === 4} />
              ))}
            </View>
            <Text style={styles.panelBody}>Reflection note fields stay spacious so the page feels introspective rather than dashboard-cluttered.</Text>
          </View>
        </View>
      </SectionCard>
    </>
  );
}

function ScorePreview() {
  return (
    <>
      <SectionCard eyebrow="XP SCORING" title="Visible formula">
        <View style={styles.statGrid}>
          {[
            ["C_raw", "0.83"],
            ["R_user", "0.75"],
            ["I_semantic", "1.08"],
            ["S_valence", "1.20"],
            ["Tokens", "112"],
            ["Entities", "3"],
          ].map(([label, value]) => (
            <MiniStat key={label} label={label} value={value} />
          ))}
        </View>
        <View style={styles.scoreHero}>
          <Text style={styles.scoreHeroLabel}>V_XAEL</Text>
          <Text style={styles.scoreHeroValue}>80.73 XP</Text>
          <Text style={styles.scoreHeroMeta}>Readable enough to trust, ceremonial enough to feel meaningful.</Text>
        </View>
      </SectionCard>
    </>
  );
}

function MintPreview() {
  return (
    <>
      <SectionCard eyebrow="MINT DESK" title="Soulbound proof">
        <View style={styles.dualColumn}>
          <View style={styles.previewPanel}>
            <Text style={styles.panelTitle}>Metadata preview</Text>
            <Text style={styles.panelBody}>Dream proof #pending{`\n`}XP 80.73{`\n`}Themes water, threshold, return{`\n`}Privacy private</Text>
          </View>
          <View style={styles.previewPanel}>
            <Text style={styles.panelTitle}>Readiness</Text>
            <PreviewList
              items={[
                "Wallet valid",
                "Local proof mode",
                "Score saved",
                "Ready to mint",
              ]}
              compact
            />
          </View>
        </View>
      </SectionCard>
    </>
  );
}

function ProfilePreview() {
  return (
    <>
      <SectionCard eyebrow="SETTINGS" title="Vault posture">
        <View style={styles.dualColumn}>
          <View style={styles.previewPanel}>
            <Text style={styles.panelTitle}>Identity</Text>
            <Text style={styles.panelBody}>Chiang Mai Dreamer{`\n`}dreamer@everdream.app{`\n`}0x wallet slot</Text>
          </View>
          <View style={styles.previewPanel}>
            <Text style={styles.panelTitle}>Privacy & security</Text>
            <PreviewList
              items={[
                "Dream visibility: private / copyleft / remix",
                "Biometric lock toggle",
                "2FA readiness toggle",
                "Wearable integrations",
              ]}
              compact
            />
          </View>
        </View>
      </SectionCard>
    </>
  );
}

function SectionCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function PreviewList({ items, compact = false }: { items: string[]; compact?: boolean }) {
  return (
    <View style={styles.listWrap}>
      {items.map((item) => (
        <View key={item} style={[styles.listItem, compact ? styles.listItemCompact : null]}>
          <Text style={styles.listItemText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function Pill({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <View style={[styles.pill, active ? styles.pillActive : null]}>
      <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>{label}</Text>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={styles.miniStatValue}>{value}</Text>
    </View>
  );
}

function StepperPreview({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stepperPreview}>
      <Text style={styles.stepperPreviewLabel}>{label}</Text>
      <Text style={styles.stepperPreviewValue}>{value}</Text>
    </View>
  );
}

function MetricPreview({
  label,
  value,
  width,
  color,
}: {
  label: string;
  value: string;
  width: `${number}%`;
  color: string;
}) {
  return (
    <View style={styles.metricPreview}>
      <View style={styles.metricPreviewHeader}>
        <Text style={styles.metricPreviewLabel}>{label}</Text>
        <Text style={styles.metricPreviewValue}>{value}</Text>
      </View>
      <View style={styles.metricPreviewTrack}>
        <View style={[styles.metricPreviewFill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#efe8dc",
  },
  backgroundWash: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundOrbA: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#d3ebe5",
    opacity: 0.7,
  },
  backgroundOrbB: {
    position: "absolute",
    bottom: 80,
    left: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#f0d8c8",
    opacity: 0.65,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 48,
    gap: 16,
  },
  headerFrame: {
    padding: 24,
    backgroundColor: "rgba(252, 250, 245, 0.9)",
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
  },
  brand: {
    color: everdreamTheme.colors.accent,
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: "700",
    marginBottom: 12,
  },
  title: {
    color: everdreamTheme.colors.ink,
    fontSize: 38,
    lineHeight: 42,
    fontFamily: everdreamTheme.displayFont,
    marginBottom: 12,
  },
  subtitle: {
    color: everdreamTheme.colors.muted,
    fontSize: 16,
    lineHeight: 23,
    maxWidth: 720,
  },
  tabRow: {
    gap: 12,
    paddingRight: 20,
  },
  tabChip: {
    width: 148,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: "rgba(248, 245, 238, 0.92)",
  },
  tabChipActive: {
    backgroundColor: everdreamTheme.colors.panelStrong,
    borderColor: everdreamTheme.colors.accent,
  },
  tabChipLabel: {
    color: everdreamTheme.colors.ink,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  tabChipLabelActive: {
    color: everdreamTheme.colors.accent,
  },
  tabChipMeta: {
    color: everdreamTheme.colors.muted,
    fontSize: 12,
  },
  tabChipMetaActive: {
    color: everdreamTheme.colors.ink,
  },
  previewNote: {
    color: everdreamTheme.colors.muted,
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 2,
  },
  sectionCard: {
    padding: 22,
    backgroundColor: "rgba(252, 250, 245, 0.95)",
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    gap: 16,
  },
  sectionEyebrow: {
    color: everdreamTheme.colors.deepWater,
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  sectionTitle: {
    color: everdreamTheme.colors.ink,
    fontSize: 28,
    lineHeight: 32,
    fontFamily: everdreamTheme.displayFont,
  },
  dualColumn: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  previewPanel: {
    flex: 1,
    minWidth: 260,
    padding: 16,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
    gap: 12,
  },
  panelTitle: {
    color: everdreamTheme.colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  panelBody: {
    color: everdreamTheme.colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  inlineChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: "#fcfaf5",
  },
  pillActive: {
    backgroundColor: everdreamTheme.colors.accentSoft,
    borderColor: everdreamTheme.colors.accent,
  },
  pillText: {
    color: everdreamTheme.colors.ink,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  pillTextActive: {
    color: everdreamTheme.colors.accent,
  },
  deviceFrame: {
    backgroundColor: "#f5f0e5",
  },
  cameraBlock: {
    width: "100%",
    aspectRatio: 4 / 5,
    backgroundColor: "#173038",
    borderWidth: 1,
    borderColor: "#244a55",
  },
  deviceControls: {
    flexDirection: "row",
    gap: 10,
  },
  miniStat: {
    minWidth: 88,
    padding: 12,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: "#fcfaf5",
    gap: 4,
  },
  miniStatLabel: {
    color: everdreamTheme.colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  miniStatValue: {
    color: everdreamTheme.colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  listWrap: {
    gap: 10,
  },
  listItem: {
    padding: 14,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
  },
  listItemCompact: {
    paddingVertical: 10,
  },
  listItemText: {
    color: everdreamTheme.colors.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  stepperPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: everdreamTheme.colors.line,
  },
  stepperPreviewLabel: {
    color: everdreamTheme.colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  stepperPreviewValue: {
    color: everdreamTheme.colors.accent,
    fontSize: 15,
    fontWeight: "700",
  },
  timelinePreview: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-end",
  },
  timelinePillar: {
    width: 74,
    alignItems: "center",
    gap: 10,
  },
  timelineTrack: {
    width: "100%",
    height: 160,
    justifyContent: "flex-end",
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: "#f0e6d4",
  },
  timelineFill: {
    width: "100%",
    backgroundColor: everdreamTheme.colors.deepWater,
  },
  timelineScore: {
    color: everdreamTheme.colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  metricPreview: {
    gap: 8,
  },
  metricPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricPreviewLabel: {
    color: everdreamTheme.colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  metricPreviewValue: {
    color: everdreamTheme.colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  metricPreviewTrack: {
    height: 18,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: "#f0e6d4",
  },
  metricPreviewFill: {
    height: "100%",
  },
  emotionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  emotionBubble: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: "#fcfaf5",
  },
  emotionBubbleActive: {
    backgroundColor: everdreamTheme.colors.berrySoft,
    borderColor: everdreamTheme.colors.berry,
  },
  emotionBubbleText: {
    color: everdreamTheme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  emotionBubbleTextActive: {
    color: everdreamTheme.colors.berry,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  scoreHero: {
    padding: 18,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.gold,
    backgroundColor: "#fcf6e6",
    gap: 6,
  },
  scoreHeroLabel: {
    color: everdreamTheme.colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  scoreHeroValue: {
    color: everdreamTheme.colors.ink,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "700",
  },
  scoreHeroMeta: {
    color: everdreamTheme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
