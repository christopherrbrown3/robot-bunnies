/**
 * Optional parent pronunciation recordings (FINAL_SPEC §4), stored ONLY on
 * this device in IndexedDB. Never uploaded, never committed.
 * Keyed by the exact normalized word, so one recording serves every week
 * that contains that word.
 */

export interface WordRecording {
  word: string;
  blob: Blob;
  type: string;
  createdAt: string;
}

const DB_NAME = 'robot-bunnies-audio';
const STORE = 'recordings';
const MAX_BYTES = 2 * 1024 * 1024;

let dbPromise: Promise<IDBDatabase> | null = null;

export function recordingsSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

function open(): Promise<IDBDatabase> {
  if (!recordingsSupported()) return Promise.reject(new Error('This browser cannot store recordings.'));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: 'word' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { dbPromise = null; reject(request.error ?? new Error('Could not open recordings.')); };
  });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(db => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = action(tx.objectStore(STORE));
    let result: T;
    request.onsuccess = () => { result = request.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error ?? request.error ?? new Error('Recording storage failed.'));
    tx.onabort = () => reject(tx.error ?? new Error('Recording storage was interrupted.'));
  }));
}

/**
 * Old iPad Safari cannot always store Blobs in IndexedDB, so recordings are
 * stored as ArrayBuffers and rebuilt into Blobs on read.
 */
interface StoredRecording { word: string; data: ArrayBuffer; type: string; createdAt: string }

function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

export async function saveRecording(word: string, blob: Blob): Promise<void> {
  if (blob.size === 0) throw new Error('That recording was empty. Please try again.');
  if (blob.size > MAX_BYTES) throw new Error('That recording is too long. Keep it to a few seconds.');
  const type = blob.type || 'audio/mp4';
  if (!type.startsWith('audio/') && !type.startsWith('video/')) throw new Error('Please choose an audio file.');
  const record: StoredRecording = { word, data: await blobToArrayBuffer(blob), type, createdAt: new Date().toISOString() };
  await run('readwrite', store => store.put(record));
}

export async function getRecording(word: string): Promise<WordRecording | null> {
  if (!recordingsSupported()) return null;
  try {
    const stored = await run<StoredRecording | undefined>('readonly', store => store.get(word));
    if (!stored) return null;
    return { word: stored.word, type: stored.type, createdAt: stored.createdAt, blob: new Blob([stored.data], { type: stored.type }) };
  } catch {
    return null;
  }
}

export async function deleteRecording(word: string): Promise<void> {
  await run('readwrite', store => store.delete(word));
}

export async function listRecordedWords(): Promise<Set<string>> {
  if (!recordingsSupported()) return new Set();
  try {
    const keys = await run<IDBValidKey[]>('readonly', store => store.getAllKeys());
    return new Set(keys.filter((k): k is string => typeof k === 'string'));
  } catch {
    return new Set();
  }
}

export async function eraseRecordings(): Promise<void> {
  if (!recordingsSupported()) return;
  await run('readwrite', store => store.clear());
}

// ---- Separate recordings backup (the word-list JSON backup excludes audio) ----

const BACKUP_FORMAT = 'robot-bunnies-recordings';

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(text: string): ArrayBuffer {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function exportRecordings(): Promise<{ json: string; count: number }> {
  const all = await run<StoredRecording[]>('readonly', store => store.getAll());
  const json = JSON.stringify({
    format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(),
    recordings: all.map(r => ({ word: r.word, type: r.type, createdAt: r.createdAt, data: toBase64(r.data) }))
  });
  return { json, count: all.length };
}

export async function importRecordings(content: string): Promise<number> {
  const parsed = JSON.parse(content) as { format?: unknown; version?: unknown; recordings?: unknown };
  if (parsed.format !== BACKUP_FORMAT || parsed.version !== 1 || !Array.isArray(parsed.recordings)) {
    throw new Error('This is not a Robot Bunnies recordings backup.');
  }
  let imported = 0;
  for (const item of parsed.recordings as Array<Record<string, unknown>>) {
    if (typeof item.word !== 'string' || !/^[a-z]+(?:[ '-][a-z]+)*$/.test(item.word) || item.word.length > 40 ||
        typeof item.type !== 'string' || typeof item.data !== 'string') continue;
    const data = fromBase64(item.data);
    if (data.byteLength === 0 || data.byteLength > MAX_BYTES) continue;
    const record: StoredRecording = {
      word: item.word, type: item.type, data,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString()
    };
    await run('readwrite', store => store.put(record));
    imported++;
  }
  return imported;
}
