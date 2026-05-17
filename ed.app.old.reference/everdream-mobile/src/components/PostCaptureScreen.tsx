import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useShallow } from "zustand/react/shallow";
import { useDreamStore } from "../store/useDreamStore";
import { everdreamTheme } from "../theme/everdreamTheme";
import { ENABLE_PHASE2 } from "../config/featureFlags";
import { SharingService } from "../lib/sharing";

const palette = everdreamTheme.colors;

export function PostCaptureScreen() {
  const router = useRouter();
  const [showVisualization, setShowVisualization] = useState(false);
  const [privacy, setPrivacy] = useState<"private" | "copyleft" | "remix">("copyleft");

  const { dreams } = useDreamStore(useShallow((state) => ({
    dreams: state.dreams,
  })));

  const latestDream = dreams[0]; // Most recent dream

  const handleVisualizationRequest = () => {
    if (!ENABLE_PHASE2) {
      // Show placeholder for Phase 2 feature
      setShowVisualization(true);
      return;
    }
    // TODO: Implement actual visualization generation
    console.log("Visualization requested for dream:", latestDream?.id);
  };

  const handleShare = async () => {
    if (!latestDream) return;

    try {
      const shareOptions = SharingService.generateShareText(latestDream, privacy);
      await SharingService.shareDream(shareOptions);
    } catch (error) {
      console.error("Failed to share dream:", error);
      // TODO: Show error message to user
    }
  };

  const handleViewLongitudinal = () => {
    router.push("/longitudinal");
  };

  if (!latestDream) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No Recent Dreams</Text>
        <Text style={styles.subtitle}>Capture a dream to see post-capture options</Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/capture")}
        >
          <Text style={styles.primaryButtonText}>Capture Dream</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBand}>
        <Text style={styles.eyebrow}>EVERDREAM</Text>
        <Text style={styles.title}>Dream Captured!</Text>
        <Text style={styles.subtitle}>
          Your dream is safely stored. What would you like to do next?
        </Text>
      </View>

      {/* Visualization Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visualize Your Dream</Text>
        <Text style={styles.sectionSubtitle}>
          Generate an image or video representation of your experience
        </Text>

        {showVisualization ? (
          <View style={styles.visualizationPlaceholder}>
            <Text style={styles.placeholderText}>
              🎨 Visualization Coming Soon
            </Text>
            <Text style={styles.placeholderSubtext}>
              Phase 2 feature - generates AI art from your dream themes
            </Text>
          </View>
        ) : (
          <Pressable
            style={styles.secondaryButton}
            onPress={handleVisualizationRequest}
          >
            <Text style={styles.secondaryButtonText}>
              Generate Dream Image
            </Text>
          </Pressable>
        )}
      </View>

      {/* Privacy & Sharing Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Sharing</Text>
        <Text style={styles.sectionSubtitle}>
          Control how your dream can be used and shared
        </Text>

        <View style={styles.privacyOptions}>
          {[
            { key: "private", label: "Private", desc: "Only you can see this" },
            { key: "copyleft", label: "Copyleft", desc: "Remixable with attribution" },
            { key: "remix", label: "Public Remix", desc: "Anyone can remix freely" },
          ].map((option) => (
            <Pressable
              key={option.key}
              style={[
                styles.privacyOption,
                privacy === option.key && styles.privacyOptionSelected,
              ]}
              onPress={() => setPrivacy(option.key as typeof privacy)}
            >
              <Text style={[
                styles.privacyOptionText,
                privacy === option.key && styles.privacyOptionTextSelected,
              ]}>
                {option.label}
              </Text>
              <Text style={styles.privacyOptionDesc}>{option.desc}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.primaryButton} onPress={handleShare}>
          <Text style={styles.primaryButtonText}>Share Dream</Text>
        </Pressable>
      </View>

      {/* Longitudinal View Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explore Your Dream Journey</Text>
        <Text style={styles.sectionSubtitle}>
          View patterns and insights across your dreams over time
        </Text>

        <Pressable
          style={styles.outlineButton}
          onPress={handleViewLongitudinal}
        >
          <Text style={styles.outlineButtonText}>View Dream Calendar</Text>
        </Pressable>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable
          style={styles.quickAction}
          onPress={() => router.push("/capture")}
        >
          <Text style={styles.quickActionText}>Capture Another</Text>
        </Pressable>
        <Pressable
          style={styles.quickAction}
          onPress={() => router.push("/")}
        >
          <Text style={styles.quickActionText}>Done</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: 24,
  },
  headerBand: {
    marginBottom: 32,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.accent,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: palette.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: palette.muted,
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: palette.ink,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: palette.muted,
    marginBottom: 16,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: palette.accent,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: {
    color: palette.background,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: "600",
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: palette.accent,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  outlineButtonText: {
    color: palette.accent,
    fontSize: 16,
    fontWeight: "600",
  },
  visualizationPlaceholder: {
    backgroundColor: palette.panel,
    padding: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "600",
    color: palette.ink,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: palette.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  privacyOptions: {
    marginBottom: 16,
  },
  privacyOption: {
    backgroundColor: palette.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: palette.line,
  },
  privacyOptionSelected: {
    backgroundColor: palette.accentSoft,
    borderColor: palette.accent,
  },
  privacyOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.ink,
    marginBottom: 4,
  },
  privacyOptionTextSelected: {
    color: palette.accent,
  },
  privacyOptionDesc: {
    fontSize: 14,
    color: palette.muted,
  },
  quickActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
  },
  quickAction: {
    flex: 1,
    backgroundColor: palette.surface,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.ink,
  },
});