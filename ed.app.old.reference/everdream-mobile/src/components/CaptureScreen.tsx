import { useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useDreamCapture } from "../hooks/useDreamCapture";
import { useDreamStore } from "../store/useDreamStore";
import type { MediaType } from "../types/database";
import { CameraView } from "expo-camera";
import { everdreamTheme } from "../theme/everdreamTheme";

const CAPTURE_MODES: MediaType[] = ["video", "audio", "text"];
const palette = everdreamTheme.colors;

const modeLabels: Record<MediaType, string> = {
  video: "Video",
  audio: "Audio",
  text: "Text",
};

const statusColors = {
  draft: palette.panel,
  "saved locally": palette.accentSoft,
  "pending sync": "#f6e1a7",
  error: palette.claySoft,
} as const;

function prettyTime(timestamp: string) {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function prettyDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function CaptureScreen() {
  const { dreams, syncQueue, isOnline, syncState } = useDreamStore(useShallow((state) => ({
    dreams: state.dreams,
    syncQueue: state.syncQueue,
    isOnline: state.isOnline,
    syncState: state.syncState,
  })));
  const pendingCount = syncQueue.filter((entry) => entry.status !== "synced").length;
  const {
    mode,
    setMode,
    activeDraft,
    setDraftValue,
    helperText,
    preparePlaceholderCapture,
    submitCapture,
    cameraRef,
    cameraPermissionGranted,
    cameraMicrophonePermissionGranted,
    requestVideoPermissions,
    toggleVideoRecording,
    toggleAudioRecording,
    isVideoRecording,
    isAudioRecording,
    recordingDurationMs,
    isSubmitting,
    draftStatus,
    errorMessage,
    lastSavedDreamId,
    hasPreparedMedia,
    preparedMediaSource,
    canSubmit,
  } = useDreamCapture();

  const queueRecordIds = useMemo(
    () => new Set(syncQueue.map((entry) => entry.record_id)),
    [syncQueue],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heroBand}>
          <Text style={styles.eyebrow}>EVERDREAM</Text>
          <Text style={styles.title}>Capture Dream</Text>
          <Text style={styles.subtitle}>
            Wake, record, hold the memory locally first. Verification and minting can follow.
          </Text>
        </View>

        <View style={styles.statusBand}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Network</Text>
            <Text style={styles.statusValue}>{isOnline ? "Online" : "Offline"}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Queue</Text>
            <Text style={styles.statusValue}>{pendingCount} pending</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Sync</Text>
            <Text style={styles.statusValue}>{syncState}</Text>
          </View>
        </View>

        <View style={styles.composerBand}>
          <View style={styles.modeRow}>
            {CAPTURE_MODES.map((captureMode) => {
              const selected = captureMode === mode;
              return (
                <Pressable
                  key={captureMode}
                  onPress={() => setMode(captureMode)}
                  style={[styles.modeChip, selected ? styles.modeChipActive : null]}
                >
                  <Text style={[styles.modeChipText, selected ? styles.modeChipTextActive : null]}>
                    {modeLabels[captureMode]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.helperText}>{helperText}</Text>

          {mode === "video" ? (
            <View style={styles.capturePanel}>
              {cameraPermissionGranted && cameraMicrophonePermissionGranted ? (
                <CameraView
                  ref={cameraRef}
                  style={styles.cameraPreview}
                  facing="front"
                  mode="video"
                  mute={false}
                  mirror
                />
              ) : (
                <View style={styles.permissionPanel}>
                  <Text style={styles.permissionTitle}>Camera access needed</Text>
                  <Text style={styles.permissionText}>
                    Grant camera and microphone access to record a wake-state dream clip.
                  </Text>
                  <Pressable onPress={requestVideoPermissions} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Grant video permissions</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.recorderRow}>
                <Text style={styles.recorderText}>
                  {isVideoRecording ? `Recording ${prettyDuration(recordingDurationMs)}` : "Ready to record up to 5:00"}
                </Text>
                <Pressable onPress={toggleVideoRecording} style={styles.recorderButton}>
                  <Text style={styles.recorderButtonText}>{isVideoRecording ? "Stop" : "Record"}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {mode === "audio" ? (
            <View style={styles.capturePanel}>
              <Text style={styles.permissionTitle}>Voice Memo</Text>
              <Text style={styles.permissionText}>
                Record a spoken dream note, then save it encrypted on the device.
              </Text>
              <View style={styles.recorderRow}>
                <Text style={styles.recorderText}>
                  {isAudioRecording ? `Recording ${prettyDuration(recordingDurationMs)}` : "Tap record when you are ready"}
                </Text>
                <Pressable onPress={toggleAudioRecording} style={styles.recorderButton}>
                  <Text style={styles.recorderButtonText}>{isAudioRecording ? "Stop" : "Record"}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.statusBadgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[draftStatus] }]}>
              <Text style={styles.statusBadgeText}>{draftStatus}</Text>
            </View>
            {mode !== "text" && hasPreparedMedia ? (
              <View style={[styles.statusBadge, styles.preparedBadge]}>
                <Text style={styles.statusBadgeText}>
                  {preparedMediaSource === "recorded" ? "clip recorded" : "clip prepared"}
                </Text>
              </View>
            ) : null}
          </View>

          <TextInput
            multiline
            placeholder={mode === "text" ? "Write the dream while it is still bright..." : "Describe what the recording will contain..."}
            placeholderTextColor={palette.muted}
            style={styles.input}
            value={activeDraft}
            onChangeText={setDraftValue}
            textAlignVertical="top"
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {mode !== "text" && !hasPreparedMedia ? (
            <Pressable onPress={preparePlaceholderCapture} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>
                {mode === "video" ? "Use placeholder clip instead" : "Use placeholder memo instead"}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={submitCapture}
            style={[styles.primaryButton, !canSubmit || isSubmitting ? styles.primaryButtonDisabled : null]}
            disabled={!canSubmit || isSubmitting}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? "Saving..." : "Save dream locally"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.feedBand}>
          <Text style={styles.feedTitle}>Recent Captures</Text>
          {dreams.length === 0 ? (
            <Text style={styles.emptyText}>No dreams saved yet. The first one you catch will land here.</Text>
          ) : (
            dreams.map((dream) => {
              const queued = queueRecordIds.has(dream.id);
              const isFresh = dream.id === lastSavedDreamId;

              return (
                <View key={dream.id} style={styles.dreamItem}>
                  <View style={styles.dreamHeader}>
                    <Text style={styles.dreamType}>{modeLabels[dream.media_type]}</Text>
                    <Text style={styles.dreamMeta}>{prettyTime(dream.timestamp)}</Text>
                  </View>
                  <Text style={styles.dreamNarrative} numberOfLines={3}>
                    {dream.narrative}
                  </Text>
                  <View style={styles.dreamFooter}>
                    <Text style={styles.dreamBadge}>{queued ? "pending sync" : "saved locally"}</Text>
                    {isFresh ? <Text style={styles.dreamFresh}>new</Text> : null}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    paddingBottom: 56,
  },
  heroBand: {
    paddingTop: 72,
    paddingHorizontal: 24,
    paddingBottom: 28,
    backgroundColor: palette.panel,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  eyebrow: {
    color: palette.accent,
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 12,
    fontWeight: "700",
  },
  title: {
    color: palette.ink,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: everdreamTheme.displayFont,
    marginBottom: 12,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 23,
  },
  statusBand: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    backgroundColor: palette.surface,
  },
  statusRow: {
    flex: 1,
  },
  statusLabel: {
    color: palette.muted,
    fontSize: 12,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  statusValue: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  composerBand: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  modeChip: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
  },
  modeChipActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  modeChipText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "600",
  },
  modeChipTextActive: {
    color: "#f7fcfb",
  },
  helperText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  statusBadgeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: palette.line,
  },
  preparedBadge: {
    backgroundColor: palette.surface,
  },
  statusBadgeText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  capturePanel: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: "#fcfaf5",
    overflow: "hidden",
  },
  cameraPreview: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: "#101614",
  },
  permissionPanel: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  permissionTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  permissionText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  recorderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    gap: 12,
  },
  recorderText: {
    flex: 1,
    color: palette.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  recorderButton: {
    minWidth: 88,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.ink,
    paddingHorizontal: 14,
  },
  recorderButtonText: {
    color: "#f9f6ef",
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    minHeight: 168,
    backgroundColor: "#fcfaf5",
    borderWidth: 1,
    borderColor: palette.line,
    color: palette.ink,
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  errorText: {
    color: palette.warning,
    fontSize: 13,
    marginBottom: 12,
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.accent,
    backgroundColor: palette.accentSoft,
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: palette.accent,
    fontSize: 15,
    fontWeight: "700",
  },
  primaryButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.clay,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#fff8f2",
    fontSize: 16,
    fontWeight: "700",
  },
  feedBand: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  feedTitle: {
    color: palette.ink,
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 16,
    fontFamily: everdreamTheme.displayFont,
  },
  emptyText: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  dreamItem: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  dreamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  dreamType: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  dreamMeta: {
    color: palette.muted,
    fontSize: 13,
  },
  dreamNarrative: {
    color: palette.ink,
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 10,
  },
  dreamFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dreamBadge: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  dreamFresh: {
    color: palette.clay,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
