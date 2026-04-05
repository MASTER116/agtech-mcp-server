import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Cache } from "../../src/lib/cache.js";

describe("Cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and retrieves a value", () => {
    const cache = new Cache();
    cache.set("key1", { temp: 22 }, 60_000);
    expect(cache.get("key1")).toEqual({ temp: 22 });
  });

  it("returns undefined for missing key", () => {
    const cache = new Cache();
    expect(cache.get("nope")).toBeUndefined();
  });

  it("returns undefined for expired entry", () => {
    const cache = new Cache();
    cache.set("key1", "data", 1000);
    vi.advanceTimersByTime(1001);
    expect(cache.get("key1")).toBeUndefined();
  });

  it("still returns value before expiry", () => {
    const cache = new Cache();
    cache.set("key1", "data", 5000);
    vi.advanceTimersByTime(4999);
    expect(cache.get("key1")).toBe("data");
  });

  it("evicts LRU entry when maxEntries exceeded", () => {
    const cache = new Cache(3);
    cache.set("a", 1, 60_000);
    vi.advanceTimersByTime(10);
    cache.set("b", 2, 60_000);
    vi.advanceTimersByTime(10);
    cache.set("c", 3, 60_000);

    // Access "a" to make it recently used
    cache.get("a");
    vi.advanceTimersByTime(10);

    // Adding "d" should evict "b" (least recently accessed)
    cache.set("d", 4, 60_000);

    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
    expect(cache.get("d")).toBe(4);
  });

  it("makeKey produces deterministic keys regardless of param order", () => {
    const cache = new Cache();
    const k1 = cache.makeKey("weather", { lat: 55.75, lon: 37.62, days: 7 });
    const k2 = cache.makeKey("weather", { days: 7, lon: 37.62, lat: 55.75 });
    expect(k1).toBe(k2);
  });

  it("makeKey produces different keys for different prefixes", () => {
    const cache = new Cache();
    const k1 = cache.makeKey("weather", { lat: 55 });
    const k2 = cache.makeKey("soil", { lat: 55 });
    expect(k1).not.toBe(k2);
  });

  it("overwrites existing key", () => {
    const cache = new Cache();
    cache.set("k", "old", 60_000);
    cache.set("k", "new", 60_000);
    expect(cache.get("k")).toBe("new");
  });
});
