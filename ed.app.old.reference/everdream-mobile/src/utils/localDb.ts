import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { Dream, LocalDreamMedia, LocalSyncMetadata, SleepSession, SyncQueueItem } from "../types/database";

const DREAMS_KEY = "everdream:dreams_local";
const DREAM_MEDIA_KEY = "everdream:dream_media_local";
const SLEEP_SESSIONS_KEY = "everdream:sleep_sessions_local";
const SYNC_QUEUE_KEY = "everdream:sync_queue_local";
const SYNC_METADATA_KEY = "everdream:sync_metadata";

async function readCollection<T>(key: string, fallback: T): Promise<T> {
  if (Platform.OS === "web") {
    const { get } = await import("idb-keyval");
    return (await get<T>(key)) ?? fallback;
  }

  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) as T : fallback;
}

async function writeCollection<T>(key: string, value: T) {
  if (Platform.OS === "web") {
    const { set } = await import("idb-keyval");
    await set(key, value);
    return;
  }

  await AsyncStorage.setItem(key, JSON.stringify(value));
}

function upsertById<T extends { id: string }>(collection: T[], record: T) {
  const existing = collection.findIndex((item) => item.id === record.id);

  if (existing === -1) {
    return [record, ...collection];
  }

  const next = [...collection];
  next[existing] = record;
  return next;
}

export async function saveToLocal(dream: Dream) {
  const dreams = await getAllLocal();
  await writeCollection(DREAMS_KEY, upsertById(dreams, dream));
}

export async function getFromLocal(id: string) {
  const dreams = await getAllLocal();
  return dreams.find((dream) => dream.id === id) ?? null;
}

export async function getAllLocal() {
  return await readCollection<Dream[]>(DREAMS_KEY, []);
}

export async function clearLocal() {
  await writeCollection<Dream[]>(DREAMS_KEY, []);
}

export async function deleteLocalDream(id: string) {
  const dreams = await getAllLocal();
  await writeCollection(
    DREAMS_KEY,
    dreams.filter((dream) => dream.id !== id),
  );
}

export async function replaceLocalDreams(dreams: Dream[]) {
  await writeCollection(DREAMS_KEY, dreams);
}

export async function getLocalDreamMedia() {
  return await readCollection<LocalDreamMedia[]>(DREAM_MEDIA_KEY, []);
}

export async function saveLocalDreamMedia(media: LocalDreamMedia) {
  const mediaCollection = await getLocalDreamMedia();
  await writeCollection(DREAM_MEDIA_KEY, upsertById(mediaCollection, media));
}

export async function getLocalDreamMediaByDreamId(dreamId: string) {
  const mediaCollection = await getLocalDreamMedia();
  return mediaCollection.find((item) => item.dream_id === dreamId) ?? null;
}

export async function getLocalSleepSessions() {
  return await readCollection<SleepSession[]>(SLEEP_SESSIONS_KEY, []);
}

export async function saveLocalSleepSession(session: SleepSession) {
  const sessions = await getLocalSleepSessions();
  await writeCollection(SLEEP_SESSIONS_KEY, upsertById(sessions, session));
}

export async function getLocalSyncQueue() {
  return await readCollection<SyncQueueItem[]>(SYNC_QUEUE_KEY, []);
}

export async function enqueueLocalSyncItem(item: SyncQueueItem) {
  const queue = await getLocalSyncQueue();
  await writeCollection(SYNC_QUEUE_KEY, [...queue.filter((entry) => entry.id !== item.id), item]);
}

export async function patchLocalSyncItem(id: string, updates: Partial<SyncQueueItem>) {
  const queue = await getLocalSyncQueue();
  await writeCollection(
    SYNC_QUEUE_KEY,
    queue.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry)),
  );
}

export async function removeLocalSyncItems(ids: string[]) {
  const idSet = new Set(ids);
  const queue = await getLocalSyncQueue();
  await writeCollection(
    SYNC_QUEUE_KEY,
    queue.filter((entry) => !idSet.has(entry.id)),
  );
}

export async function clearLocalSyncQueue() {
  await writeCollection<SyncQueueItem[]>(SYNC_QUEUE_KEY, []);
}

export async function getSyncMetadata() {
  return await readCollection<LocalSyncMetadata>(SYNC_METADATA_KEY, {
    last_sync_timestamp: null,
    pending_operations_count: 0,
  });
}

export async function saveSyncMetadata(metadata: LocalSyncMetadata) {
  await writeCollection(SYNC_METADATA_KEY, metadata);
}
