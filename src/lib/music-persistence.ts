export interface PersistedTrack {
  blob: Blob;
  prompt: string;
  genre: string;
  language: string;
  lyrics: string;
}

const DB_NAME = "freestylemaker-music";
const DB_VERSION = 1;
const STORE_NAME = "tracks";

let dbInstance: IDBDatabase | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      // Reset cached instance if the database is closed externally
      dbInstance.onclose = () => {
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

function makeKey(projectId: string, gait: string): string {
  return `music-${projectId}-${gait}`;
}

export async function saveMusicTrack(
  projectId: string,
  gait: string,
  data: PersistedTrack,
): Promise<void> {
  try {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(data, makeKey(projectId, gait));
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("saveMusicTrack failed:", err);
  }
}

export async function loadMusicTrack(
  projectId: string,
  gait: string,
): Promise<PersistedTrack | null> {
  try {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(makeKey(projectId, gait));
    return await new Promise<PersistedTrack | null>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("loadMusicTrack failed:", err);
    return null;
  }
}

export async function loadAllMusicTracks(
  projectId: string,
  gaits: string[],
): Promise<Map<string, PersistedTrack>> {
  const results = await Promise.all(
    gaits.map(async (gait) => {
      const track = await loadMusicTrack(projectId, gait);
      return [gait, track] as const;
    }),
  );
  const map = new Map<string, PersistedTrack>();
  for (const [gait, track] of results) {
    if (track) map.set(gait, track);
  }
  return map;
}

export async function clearMusicCache(projectId: string): Promise<void> {
  try {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const prefix = `music-${projectId}-`;

    const request = store.openCursor();
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve();
          return;
        }
        if (typeof cursor.key === "string" && cursor.key.startsWith(prefix)) {
          cursor.delete();
        }
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("clearMusicCache failed:", err);
  }
}
