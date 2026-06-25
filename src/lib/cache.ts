type CacheEntry = {
  value: any;
  expiresAt: number;
};

// Global cache to persist across hot reloads in Next.js development
let cacheStore: Map<string, CacheEntry>;

if (process.env.NODE_ENV === "production") {
  cacheStore = new Map();
} else {
  if (!(global as any).__cacheStore) {
    (global as any).__cacheStore = new Map();
  }
  cacheStore = (global as any).__cacheStore;
}

export function getCache<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  
  return entry.value as T;
}

export function setCache(key: string, value: any, ttlSeconds: number): void {
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function invalidateCache(pattern: string): void {
  cacheStore.forEach((_, key) => {
    if (key.includes(pattern)) {
      cacheStore.delete(key);
    }
  });
}
