/**
 * videoStore — persists recorded dream videos as Blobs in IndexedDB.
 *
 * Kept deliberately separate from lib/storage/indexedDB.ts (the `everdream_local`
 * DB) so it doesn't touch that store's schema or version. Videos are keyed by
 * the dream id. A dream references its stored video via
 *   videoCapture.url = "idb:<dreamId>"
 * and resolveVideoURL() turns that back into a playable object URL on demand.
 */

const DB_NAME = 'everdream_videos';
const DB_VERSION = 1;
const STORE = 'videos';
export const IDB_VIDEO_PREFIX = 'idb:';

interface VideoRecord {
  id: string;
  blob: Blob;
  thumbnail?: string | null;
  duration?: number;
  createdAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Store a recorded video blob. Returns the "idb:<id>" reference to persist on the dream. */
export async function saveVideo(
  id: string,
  blob: Blob,
  meta?: { thumbnail?: string | null; duration?: number },
): Promise<string> {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({
        id,
        blob,
        thumbnail: meta?.thumbnail ?? null,
        duration: meta?.duration,
        createdAt: new Date().toISOString(),
      } as VideoRecord);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
  return IDB_VIDEO_PREFIX + id;
}

export async function getVideoBlob(id: string): Promise<Blob | null> {
  const db = await openDB();
  try {
    const rec = await new Promise<VideoRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const r = tx.objectStore(STORE).get(id);
      r.onsuccess = () => resolve(r.result as VideoRecord | undefined);
      r.onerror = () => reject(r.error);
    });
    return rec?.blob ?? null;
  } finally {
    db.close();
  }
}

export async function deleteVideo(id: string): Promise<void> {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/** Remove every stored video (used by the GDPR "delete all data" flow). */
export async function clearAllVideos(): Promise<void> {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export function isIdbVideoRef(ref: string | undefined | null): boolean {
  return !!ref && ref.startsWith(IDB_VIDEO_PREFIX);
}

/**
 * Turn a stored reference into a playable URL.
 * - "idb:<id>"  → looks up the blob and creates an object URL (call revoke() on cleanup)
 * - any other   → returned as-is (revoke is a no-op)
 */
export async function resolveVideoURL(
  ref: string | undefined | null,
): Promise<{ url: string | null; revoke: () => void }> {
  const noop = () => {};
  if (!ref) return { url: null, revoke: noop };
  if (!isIdbVideoRef(ref)) return { url: ref, revoke: noop };

  const id = ref.slice(IDB_VIDEO_PREFIX.length);
  const blob = await getVideoBlob(id);
  if (!blob) return { url: null, revoke: noop };

  const url = URL.createObjectURL(blob);
  return { url, revoke: () => URL.revokeObjectURL(url) };
}
