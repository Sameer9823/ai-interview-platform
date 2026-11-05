import "server-only";

export interface StorageAdapter {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  exists(key: string): Promise<boolean>;
}

let storageAdapter: StorageAdapter | null = null;

export function setStorageAdapter(adapter: StorageAdapter) {
  storageAdapter = adapter;
}

export function getStorageAdapter(): StorageAdapter {
  if (!storageAdapter) {
    // Development fallback - in-memory storage
    if (process.env.NODE_ENV !== "production") {
      return getDevStorageAdapter();
    }
    throw new Error("Storage adapter not configured. Set STORAGE_PROVIDER and credentials.");
  }
  return storageAdapter;
}

function getDevStorageAdapter(): StorageAdapter {
  const store = new Map<string, { data: Buffer; contentType: string }>();

  return {
    async put(key: string, data: Buffer, contentType: string) {
      store.set(key, { data, contentType });
    },
    async get(key: string) {
      return store.get(key)?.data ?? null;
    },
    async delete(key: string) {
      store.delete(key);
    },
    async getSignedUrl(key: string) {
      return `/api/dev/storage/${encodeURIComponent(key)}`;
    },
    async exists(key: string) {
      return store.has(key);
    },
  };
}

export async function uploadFile(
  key: string,
  data: Buffer,
  contentType: string
): Promise<void> {
  const adapter = getStorageAdapter();
  await adapter.put(key, data, contentType);
}

export async function downloadFile(key: string): Promise<Buffer | null> {
  const adapter = getStorageAdapter();
  return adapter.get(key);
}

export async function deleteFile(key: string): Promise<void> {
  const adapter = getStorageAdapter();
  await adapter.delete(key);
}

export async function getFileSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const adapter = getStorageAdapter();
  return adapter.getSignedUrl(key, expiresInSeconds);
}

export async function fileExists(key: string): Promise<boolean> {
  const adapter = getStorageAdapter();
  return adapter.exists(key);
}

export async function copyFile(sourceKey: string, destKey: string): Promise<void> {
  const adapter = getStorageAdapter();
  const data = await adapter.get(sourceKey);
  if (!data) throw new Error("Source file not found");
  await adapter.put(destKey, data, "application/octet-stream");
}

export async function listFiles(prefix: string): Promise<string[]> {
  // Not implemented for all adapters - implement per adapter if needed
  return [];
}