import { create } from "zustand";
import { deleteDreamRemote, fetchDreamsRemote, insertDreamRemote, invokeSyncProcessor, updateDreamRemote } from "../lib/syncApi";
import { getAuthUser } from "../lib/supabaseClient";
import type { Dream, DreamInsert, DreamUpdate, Json, LocalSyncMetadata, SyncQueueItem } from "../types/database";
import {
  clearLocal,
  deleteLocalDream,
  enqueueLocalSyncItem,
  getAllLocal,
  getLocalSyncQueue,
  getSyncMetadata,
  patchLocalSyncItem,
  removeLocalSyncItems,
  replaceLocalDreams,
  saveSyncMetadata,
  saveToLocal,
} from "../utils/localDb";

type SyncState = "idle" | "syncing" | "error";

export interface DreamWriteResult {
  queued: boolean;
  dream: Dream;
}

export interface DreamState {
  dreams: Dream[];
  syncQueue: SyncQueueItem[];
  isOnline: boolean;
  syncState: SyncState;
  lastSyncTimestamp: string | null;
  addDream: (dream: Dream) => Promise<DreamWriteResult>;
  updateDream: (id: string, updates: Partial<Dream>) => Promise<void>;
  deleteDream: (id: string) => Promise<void>;
  syncPending: () => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
  hydrateLocal: () => Promise<void>;
}

function sortDreams(dreams: Dream[]) {
  return [...dreams].sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));
}

function upsertDream(collection: Dream[], dream: Dream) {
  const existing = collection.findIndex((item) => item.id === dream.id);

  if (existing === -1) {
    return sortDreams([dream, ...collection]);
  }

  const next = [...collection];
  next[existing] = dream;
  return sortDreams(next);
}

function buildSyncMetadata(syncQueue: SyncQueueItem[], lastSyncTimestamp: string | null): LocalSyncMetadata {
  return {
    last_sync_timestamp: lastSyncTimestamp,
    pending_operations_count: syncQueue.filter((entry) => entry.status !== "synced").length,
  };
}

function createId(prefix: string) {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createQueueEntry(userId: string, recordId: string, operationType: SyncQueueItem["operation_type"], payload: Json): SyncQueueItem {
  return {
    id: createId("sync"),
    user_id: userId,
    operation_type: operationType,
    table_name: "dreams",
    record_id: recordId,
    payload,
    status: "pending",
    retry_count: 0,
    last_error: null,
    created_at: new Date().toISOString(),
    synced_at: null,
  };
}

async function persistQueueState(syncQueue: SyncQueueItem[], lastSyncTimestamp: string | null) {
  await saveSyncMetadata(buildSyncMetadata(syncQueue, lastSyncTimestamp));
}

export const useDreamStore = create<DreamState>((set, get) => ({
  dreams: [],
  syncQueue: [],
  isOnline: true,
  syncState: "idle",
  lastSyncTimestamp: null,

  hydrateLocal: async () => {
    const [dreams, syncQueue, metadata] = await Promise.all([
      getAllLocal(),
      getLocalSyncQueue(),
      getSyncMetadata(),
    ]);

    set({
      dreams: sortDreams(dreams),
      syncQueue,
      lastSyncTimestamp: metadata.last_sync_timestamp,
    });
  },

  setOnlineStatus: (status) => {
    set({ isOnline: status });
  },

  addDream: async (dream) => {
    const normalizedDream: Dream = {
      ...dream,
      created_at: dream.created_at ?? new Date().toISOString(),
      updated_at: dream.updated_at ?? new Date().toISOString(),
    };

    set((state) => ({
      dreams: upsertDream(state.dreams, normalizedDream),
    }));
    await saveToLocal(normalizedDream);

    try {
      if (!get().isOnline) {
        throw new Error("offline");
      }

      const remoteDream = await insertDreamRemote(normalizedDream as DreamInsert);
      set((state) => ({
        dreams: upsertDream(state.dreams, remoteDream),
      }));
      await saveToLocal(remoteDream);
      return {
        queued: false,
        dream: remoteDream,
      };
    } catch {
      const queueEntry = createQueueEntry(normalizedDream.user_id, normalizedDream.id, "CREATE", normalizedDream as unknown as Json);
      const syncQueue = [...get().syncQueue.filter((entry) => entry.record_id !== normalizedDream.id), queueEntry];
      set({ syncQueue });
      await enqueueLocalSyncItem(queueEntry);
      await persistQueueState(syncQueue, get().lastSyncTimestamp);
      return {
        queued: true,
        dream: normalizedDream,
      };
    }
  },

  updateDream: async (id, updates) => {
    const existingDream = get().dreams.find((dream) => dream.id === id);

    if (!existingDream) {
      return;
    }

    const nextDream: Dream = {
      ...existingDream,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    set((state) => ({
      dreams: upsertDream(state.dreams, nextDream),
    }));
    await saveToLocal(nextDream);

    try {
      if (!get().isOnline) {
        throw new Error("offline");
      }

      const remoteDream = await updateDreamRemote(id, nextDream.user_id, updates as DreamUpdate);
      set((state) => ({
        dreams: upsertDream(state.dreams, remoteDream),
      }));
      await saveToLocal(remoteDream);
    } catch {
      const queueEntry = createQueueEntry(existingDream.user_id, id, "UPDATE", nextDream as unknown as Json);
      const syncQueue = [...get().syncQueue.filter((entry) => entry.record_id !== id), queueEntry];
      set({ syncQueue });
      await enqueueLocalSyncItem(queueEntry);
      await persistQueueState(syncQueue, get().lastSyncTimestamp);
    }
  },

  deleteDream: async (id) => {
    const existingDream = get().dreams.find((dream) => dream.id === id);

    if (!existingDream) {
      return;
    }

    set((state) => ({
      dreams: state.dreams.filter((dream) => dream.id !== id),
    }));
    await deleteLocalDream(id);

    try {
      if (!get().isOnline) {
        throw new Error("offline");
      }

      await deleteDreamRemote(id, existingDream.user_id);
    } catch {
      const queueEntry = createQueueEntry(existingDream.user_id, id, "DELETE", {
        id,
        user_id: existingDream.user_id,
        updated_at: new Date().toISOString(),
      });
      const syncQueue = [...get().syncQueue.filter((entry) => entry.record_id !== id), queueEntry];
      set({ syncQueue });
      await enqueueLocalSyncItem(queueEntry);
      await persistQueueState(syncQueue, get().lastSyncTimestamp);
    }
  },

  syncPending: async () => {
    if (!get().isOnline) {
      return;
    }

    const queueEntries = await getLocalSyncQueue();

    if (!queueEntries.length) {
      set({ syncState: "idle" });
      return;
    }

    set({ syncState: "syncing" });

    try {
      await getAuthUser();
      const result = await invokeSyncProcessor(queueEntries);

      if (result.synced_ids.length) {
        await removeLocalSyncItems(result.synced_ids);
      }

      for (const failedEntry of result.failed) {
        await patchLocalSyncItem(failedEntry.id, {
          status: "failed",
          retry_count: (queueEntries.find((entry) => entry.id === failedEntry.id)?.retry_count ?? 0) + 1,
          last_error: failedEntry.error,
        });
      }

      const [remoteDreams, nextQueue] = await Promise.all([
        fetchDreamsRemote(),
        getLocalSyncQueue(),
      ]);

      await clearLocal();
      await replaceLocalDreams(remoteDreams);

      const lastSyncTimestamp = new Date().toISOString();
      set({
        dreams: sortDreams(remoteDreams),
        syncQueue: nextQueue,
        syncState: result.failed.length ? "error" : "idle",
        lastSyncTimestamp,
      });
      await persistQueueState(nextQueue, lastSyncTimestamp);
    } catch (error) {
      console.warn("Failed to sync pending Everdream operations", error);
      set({ syncState: "error" });
    }
  },
}));
