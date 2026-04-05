interface CacheEntry {
  data: unknown;
  expiresAt: number;
  lastAccess: number;
}

export class Cache {
  private store = new Map<string, CacheEntry>();
  private maxEntries: number;

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    entry.lastAccess = Date.now();
    return entry.data as T;
  }

  set(key: string, data: unknown, ttlMs: number): void {
    if (this.store.size >= this.maxEntries) {
      this.evictLRU();
    }
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
      lastAccess: Date.now(),
    });
  }

  private evictLRU(): void {
    let oldestKey: string | undefined;
    let oldestAccess = Infinity;
    for (const [key, entry] of this.store) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestKey = key;
      }
    }
    if (oldestKey) this.store.delete(oldestKey);
  }

  makeKey(prefix: string, params: Record<string, unknown>): string {
    const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("&");
    return `${prefix}:${sorted}`;
  }
}
