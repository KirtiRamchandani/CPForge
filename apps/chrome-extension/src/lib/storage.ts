const SESSION_KEY = "cp-forge-session";
const MISTAKE_KEY = "cp-forge-mistakes";
const IDB_NAME = "cp-forge";
const IDB_STORE = "sessions";

export interface SessionState {
  url: string;
  title: string;
  platform: string;
  status: string;
  notes: string;
  updatedAt: string;
  difficulty?: string;
  topics?: string[];
}

export const loadSession = async (url: string, fallback: SessionState): Promise<SessionState> => {
  const idb = await idbGet<Record<string, SessionState>>(SESSION_KEY);
  if (idb?.[url]) return idb[url];
  const stored = await chrome.storage.local.get(SESSION_KEY);
  const sessions = (stored[SESSION_KEY] ?? {}) as Record<string, SessionState>;
  return sessions[url] ?? fallback;
};

export const saveSession = async (url: string, patch: Partial<SessionState>, base: SessionState): Promise<SessionState> => {
  const next = { ...base, ...patch, updatedAt: new Date().toISOString() };
  const stored = await chrome.storage.local.get(SESSION_KEY);
  const sessions = (stored[SESSION_KEY] ?? {}) as Record<string, SessionState>;
  sessions[url] = next;
  await chrome.storage.local.set({ [SESSION_KEY]: sessions });
  await idbSet(SESSION_KEY, sessions);
  return next;
};

export const loadAllSessions = async (): Promise<Record<string, SessionState>> => {
  const idb = await idbGet<Record<string, SessionState>>(SESSION_KEY);
  if (idb) return idb;
  const stored = await chrome.storage.local.get(SESSION_KEY);
  return (stored[SESSION_KEY] ?? {}) as Record<string, SessionState>;
};

export const loadMistakeStats = async () => {
  const stored = await chrome.storage.local.get(MISTAKE_KEY);
  const list = (stored[MISTAKE_KEY] ?? []) as Array<{ category: string }>;
  const byCategory = list.reduce<Record<string, number>>((acc, m) => {
    acc[m.category] = (acc[m.category] ?? 0) + 1;
    return acc;
  }, {});
  return { total: list.length, byCategory };
};

const idbGet = <T>(key: string): Promise<T | undefined> =>
  new Promise((resolve) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(IDB_STORE);
    request.onsuccess = () => {
      const tx = request.result.transaction(IDB_STORE, "readonly");
      const get = tx.objectStore(IDB_STORE).get(key);
      get.onsuccess = () => resolve(get.result as T | undefined);
      get.onerror = () => resolve(undefined);
    };
    request.onerror = () => resolve(undefined);
  });

const idbSet = async (key: string, value: unknown) =>
  new Promise<void>((resolve) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(IDB_STORE);
    request.onsuccess = () => {
      const tx = request.result.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    };
    request.onerror = () => resolve();
  });
