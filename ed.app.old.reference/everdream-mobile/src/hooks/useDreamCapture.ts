import { useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState, RecordingPresets } from "expo-audio";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { Directory, File, Paths } from "expo-file-system";
import { useShallow } from "zustand/react/shallow";
import { useDreamStore } from "../store/useDreamStore";
import type { Dream, LocalDreamMedia, MediaType } from "../types/database";
import {
  arrayBufferToHex,
  createTimestampBindingHash,
  deriveKeyForLocalVault,
  encryptDreamMedia,
  getOrCreateLocalActorId,
} from "../utils/crypto";
import { saveLocalDreamMedia } from "../utils/localDb";
import { getAuthUser } from "../lib/supabaseClient";

type DraftStatus = "draft" | "saved locally" | "pending sync" | "error";
type CaptureSource = "recorded" | "placeholder";
type PreparedMediaRecord = {
  blob: Blob;
  source: CaptureSource;
  mimeType: string;
  durationMs: number | null;
};
type PreparedMediaMap = Partial<Record<Exclude<MediaType, "text">, PreparedMediaRecord>>;

const MODE_TITLES: Record<MediaType, string> = {
  video: "video memo",
  audio: "audio memo",
  text: "text note",
};

function createId(prefix: string) {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildPlaceholderBlob(mode: Exclude<MediaType, "text">, narrative: string, timestamp: string) {
  const mimeType = mode === "video" ? "video/mp4" : "audio/mpeg";
  const payload = JSON.stringify({
    mode,
    timestamp,
    narrative,
    duration_seconds: mode === "video" ? 30 : 15,
    placeholder: true,
  });

  return new Blob([payload], { type: mimeType });
}

export function useDreamCapture() {
  const { addDream, isOnline } = useDreamStore(useShallow((state) => ({
    addDream: state.addDream,
    isOnline: state.isOnline,
  })));
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraMicPermission, requestCameraMicPermission] = useMicrophonePermissions();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioRecorderState = useAudioRecorderState(audioRecorder);
  const [mode, setMode] = useState<MediaType>("video");
  const [drafts, setDrafts] = useState<Record<MediaType, string>>({
    video: "",
    audio: "",
    text: "",
  });
  const [preparedMedia, setPreparedMedia] = useState<PreparedMediaMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("draft");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSavedDreamId, setLastSavedDreamId] = useState<string | null>(null);
  const [captureStartedAt, setCaptureStartedAt] = useState<number | null>(null);

  const activeDraft = drafts[mode];
  const activePreparedMedia = mode === "text" ? null : preparedMedia[mode];
  const isAudioRecording = audioRecorderState.isRecording ?? false;
  const isCaptureRecording = mode === "video" ? isVideoRecording : isAudioRecording;

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    void setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    }).catch((error) => {
      console.warn("Failed to initialize audio mode", error);
    });
  }, []);

  const helperText = useMemo(() => {
    if (mode === "text") {
      return "Write the dream in your own words. This path is fully live and saves offline first.";
    }

    if (mode === "video") {
      return "Default wake-state path. Record up to 5 minutes, then save the encrypted clip locally before sync.";
    }

    return "Fallback voice memo path. Record a short spoken dream note, then save it encrypted on the device.";
  }, [mode]);

  const canSubmit = Boolean(activeDraft.trim() || activePreparedMedia);

  const setDraftValue = (value: string) => {
    setDraftStatus("draft");
    setDrafts((current) => ({
      ...current,
      [mode]: value,
    }));
  };

  const requestVideoPermissions = async () => {
    const [cameraResult, microphoneResult] = await Promise.all([
      cameraPermission?.granted ? Promise.resolve(cameraPermission) : requestCameraPermission(),
      cameraMicPermission?.granted ? Promise.resolve(cameraMicPermission) : requestCameraMicPermission(),
    ]);

    if (!cameraResult.granted || !microphoneResult.granted) {
      throw new Error("Camera and microphone access are required to record video dreams.");
    }
  };

  const requestAudioPermissions = async () => {
    const permission = await requestRecordingPermissionsAsync();

    if (!permission.granted) {
      throw new Error("Microphone access is required to record audio dreams.");
    }
  };

  const stashPreparedMedia = (nextMode: Exclude<MediaType, "text">, media: PreparedMediaRecord) => {
    setPreparedMedia((current) => ({
      ...current,
      [nextMode]: media,
    }));
    setDraftStatus("draft");
  };

  const readRecordingBlob = async (uri: string, fallbackMimeType: string) => {
    const file = new File(uri);
    const buffer = await file.arrayBuffer();
    const mimeType = file.type || fallbackMimeType;
    return {
      blob: new Blob([buffer], { type: mimeType }),
      mimeType,
      byteLength: buffer.byteLength,
    };
  };

  const preparePlaceholderCapture = () => {
    if (mode === "text") {
      return;
    }

    const timestamp = new Date().toISOString();
    const narrative = drafts[mode].trim() || `${MODE_TITLES[mode]} prepared at ${timestamp}`;
    const blob = buildPlaceholderBlob(mode, narrative, timestamp);
    stashPreparedMedia(mode, {
      blob,
      source: "placeholder",
      mimeType: blob.type || (mode === "video" ? "video/mp4" : "audio/mpeg"),
      durationMs: mode === "video" ? 30000 : 15000,
    });
  };

  const startVideoRecording = async () => {
    try {
      setErrorMessage(null);
      await requestVideoPermissions();

      if (!cameraRef.current) {
        throw new Error("Camera preview is not ready yet.");
      }

      setCaptureStartedAt(Date.now());
      setIsVideoRecording(true);

      const result = await cameraRef.current.recordAsync({
        maxDuration: 300,
      });

      if (!result?.uri) {
        throw new Error("Video capture did not return a file.");
      }

      const media = await readRecordingBlob(result.uri, "video/mp4");
      stashPreparedMedia("video", {
        blob: media.blob,
        source: "recorded",
        mimeType: media.mimeType,
        durationMs: captureStartedAt ? Date.now() - captureStartedAt : null,
      });
    } catch (error) {
      console.error("Failed to record video dream", error);
      setDraftStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Video recording failed");
    } finally {
      setIsVideoRecording(false);
      setCaptureStartedAt(null);
    }
  };

  const stopVideoRecording = async () => {
    try {
      await cameraRef.current?.stopRecording();
    } catch (error) {
      console.warn("Failed to stop video recording cleanly", error);
    }
  };

  const toggleVideoRecording = async () => {
    if (isVideoRecording) {
      await stopVideoRecording();
      return;
    }

    await startVideoRecording();
  };

  const toggleAudioRecording = async () => {
    try {
      setErrorMessage(null);

      if (isAudioRecording) {
        await audioRecorder.stop();
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        });

        const recordingUri = audioRecorder.uri;

        if (!recordingUri) {
          throw new Error("Audio capture did not return a file.");
        }

        const media = await readRecordingBlob(recordingUri, "audio/m4a");
        stashPreparedMedia("audio", {
          blob: media.blob,
          source: "recorded",
          mimeType: media.mimeType,
          durationMs: audioRecorderState.durationMillis ?? null,
        });
        setCaptureStartedAt(null);
        return;
      }

      await requestAudioPermissions();
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setCaptureStartedAt(Date.now());
      setDraftStatus("draft");
    } catch (error) {
      console.error("Failed to record audio dream", error);
      setDraftStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Audio recording failed");
      setCaptureStartedAt(null);
    }
  };

  const persistEncryptedMediaFile = async (
    dreamId: string,
    mediaType: Exclude<MediaType, "text">,
    encryptedData: ArrayBuffer,
  ) => {
    if (Platform.OS === "web") {
      return {
        storage_kind: "inline" as const,
        encrypted_hex: arrayBufferToHex(encryptedData),
        encrypted_file_uri: null,
      };
    }

    const vaultDirectory = new Directory(Paths.document, "everdream-media");
    vaultDirectory.create({ idempotent: true, intermediates: true });
    const extension = mediaType === "video" ? "mp4.enc" : "m4a.enc";
    const encryptedFile = new File(vaultDirectory, `${dreamId}.${extension}`);
    encryptedFile.create({ overwrite: true, intermediates: true });
    encryptedFile.write(new Uint8Array(encryptedData));

    return {
      storage_kind: "file" as const,
      encrypted_hex: null,
      encrypted_file_uri: encryptedFile.uri,
    };
  };

  const submitCapture = async () => {
    const trimmedNarrative = activeDraft.trim();

    if (!trimmedNarrative && !activePreparedMedia) {
      setDraftStatus("error");
      setErrorMessage("Add a dream note or record a clip before saving.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const actorId = await getAuthUser()
        .then((user) => user.id)
        .catch(() => getOrCreateLocalActorId());
      const timestamp = new Date().toISOString();
      const dreamId = createId("dream");
      const bindingHash = await createTimestampBindingHash(timestamp, actorId);

      let mediaRecord: LocalDreamMedia | null = null;
      const narrative = trimmedNarrative || `${MODE_TITLES[mode]} captured at ${new Date(timestamp).toLocaleTimeString()}`;

      if (mode !== "text") {
        const clip = activePreparedMedia ?? {
          blob: buildPlaceholderBlob(mode, narrative, timestamp),
          source: "placeholder" as const,
          mimeType: mode === "video" ? "video/mp4" : "audio/mpeg",
          durationMs: mode === "video" ? 30000 : 15000,
        };
        const userKey = await deriveKeyForLocalVault(actorId);
        const encryptedData = await encryptDreamMedia(clip.blob, userKey);
        const persistedMedia = await persistEncryptedMediaFile(dreamId, mode, encryptedData);

        mediaRecord = {
          id: createId("media"),
          dream_id: dreamId,
          user_id: actorId,
          media_type: mode,
          storage_kind: persistedMedia.storage_kind,
          encrypted_hex: persistedMedia.encrypted_hex,
          encrypted_file_uri: persistedMedia.encrypted_file_uri,
          mime_type: clip.mimeType,
          byte_length: encryptedData.byteLength,
          capture_source: clip.source,
          duration_ms: clip.durationMs,
          created_at: timestamp,
          preview_text: narrative.slice(0, 120),
        };

        await saveLocalDreamMedia(mediaRecord);
      }

      const guessedLocalStatus = isOnline ? "saved_local" : "pending_sync";
      const dream: Dream = {
        id: dreamId,
        user_id: actorId,
        timestamp,
        media_type: mode,
        media_storage_path: mediaRecord ? `local://dream-media/${mediaRecord.id}` : null,
        narrative,
        themes: [],
        valence: 0,
        arousal: 0,
        resonance_score: 0,
        xp_score: 0,
        sleep_session_id: null,
        nft_token_id: null,
        nft_contract_address: null,
        nft_tx_hash: null,
        license_type: "CC-BY-SA-4.0",
        royalty_bps: 300,
        privacy: "private",
        ai_metadata: {
          status: "pending_verification",
        },
        verification_metadata: {
          capture_timestamp_hash: bindingHash,
          capture_local_status: guessedLocalStatus,
          capture_mode: mode,
          local_media_id: mediaRecord?.id ?? null,
          placeholder_media: mediaRecord?.capture_source === "placeholder",
          capture_duration_ms: mediaRecord?.duration_ms ?? null,
          submitted_at: timestamp,
        },
        created_at: timestamp,
        updated_at: timestamp,
      };

      const result = await addDream(dream);
      setLastSavedDreamId(result.dream.id);
      setDraftStatus(result.queued ? "pending sync" : "saved locally");
      setDrafts((current) => ({
        ...current,
        [mode]: "",
      }));

      if (mode !== "text") {
        setPreparedMedia((current) => {
          const next = { ...current };
          delete next[mode];
          return next;
        });
      }
    } catch (error) {
      console.error("Failed to save dream capture", error);
      setDraftStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Dream capture failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    mode,
    setMode,
    activeDraft,
    setDraftValue,
    helperText,
    preparePlaceholderCapture,
    submitCapture,
    cameraRef,
    cameraPermissionGranted: Boolean(cameraPermission?.granted),
    cameraMicrophonePermissionGranted: Boolean(cameraMicPermission?.granted),
    requestVideoPermissions,
    toggleVideoRecording,
    stopVideoRecording,
    toggleAudioRecording,
    isVideoRecording,
    isAudioRecording,
    recordingDurationMs: mode === "audio"
      ? (audioRecorderState.durationMillis ?? 0)
      : (isVideoRecording && captureStartedAt ? Date.now() - captureStartedAt : 0),
    isSubmitting,
    draftStatus,
    errorMessage,
    lastSavedDreamId,
    hasPreparedMedia: Boolean(activePreparedMedia),
    preparedMediaSource: activePreparedMedia?.source ?? null,
    canSubmit,
  };
}
