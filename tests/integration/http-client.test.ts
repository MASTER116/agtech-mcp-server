import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HttpClient } from "../../src/lib/http-client.js";
import { Cache } from "../../src/lib/cache.js";
import { RateLimiter } from "../../src/lib/rate-limiter.js";
import { ApiError } from "../../src/lib/errors.js";

describe("HttpClient", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function mockFetch(response: { ok: boolean; status?: number; json?: unknown; text?: string }) {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: response.ok,
      status: response.status ?? (response.ok ? 200 : 500),
      json: async () => response.json,
      text: async () => response.text ?? JSON.stringify(response.json ?? ""),
    });
  }

  describe("GET requests", () => {
    it("fetches and returns JSON", async () => {
      mockFetch({ ok: true, json: { temperature: 22 } });
      const client = new HttpClient({ maxRetries: 1 });
      const result = await client.get<{ temperature: number }>("https://api.example.com/data");
      expect(result.temperature).toBe(22);
    });

    it("uses cache on second call", async () => {
      mockFetch({ ok: true, json: { temp: 22 } });
      const cache = new Cache();
      const client = new HttpClient({ cache, maxRetries: 1 });

      await client.get("https://api.example.com/data", { cacheTtlMs: 60_000 });
      await client.get("https://api.example.com/data", { cacheTtlMs: 60_000 });

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it("respects custom cache key", async () => {
      mockFetch({ ok: true, json: { a: 1 } });
      const cache = new Cache();
      const client = new HttpClient({ cache, maxRetries: 1 });

      await client.get("https://api.example.com/data?a=1", {
        cacheTtlMs: 60_000,
        cacheKey: "custom-key",
      });

      expect(cache.get("custom-key")).toEqual({ a: 1 });
    });
  });

  describe("POST requests", () => {
    it("sends JSON body", async () => {
      mockFetch({ ok: true, json: { id: 1 } });
      const client = new HttpClient({ maxRetries: 1 });
      const result = await client.post<{ id: number }>("https://api.example.com/create", { name: "test" });

      expect(result.id).toBe(1);
      const [, init] = (globalThis.fetch as any).mock.calls[0];
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual({ name: "test" });
      expect(init.headers["Content-Type"]).toBe("application/json");
    });
  });

  describe("getText", () => {
    it("returns raw text", async () => {
      mockFetch({ ok: true, text: "<xml>data</xml>" });
      const client = new HttpClient({ maxRetries: 1 });
      const result = await client.getText("https://api.example.com/xml");
      expect(result).toBe("<xml>data</xml>");
    });

    it("caches text responses", async () => {
      mockFetch({ ok: true, text: "cached-text" });
      const cache = new Cache();
      const client = new HttpClient({ cache, maxRetries: 1 });

      await client.getText("https://api.example.com/text", { cacheTtlMs: 60_000 });
      await client.getText("https://api.example.com/text", { cacheTtlMs: 60_000 });

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error handling", () => {
    it("throws ApiError on non-retryable HTTP error", async () => {
      mockFetch({ ok: false, status: 404, text: "Not found" });
      const client = new HttpClient({ maxRetries: 1 });

      await expect(client.get("https://api.example.com/data"))
        .rejects.toThrow(ApiError);
    });

    it("retries on 5xx errors", async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          return { ok: false, status: 500, text: async () => "error" };
        }
        return { ok: true, json: async () => ({ ok: true }), text: async () => '{"ok":true}' };
      });

      const client = new HttpClient({ maxRetries: 3 });
      const result = await client.get<{ ok: boolean }>("https://api.example.com/data");
      expect(result.ok).toBe(true);
      expect(callCount).toBe(3);
    });

    it("retries on 429 rate limit", async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return { ok: false, status: 429, text: async () => "rate limited" };
        }
        return { ok: true, json: async () => ({ data: true }), text: async () => '{}' };
      });

      const client = new HttpClient({ maxRetries: 2 });
      const result = await client.get<{ data: boolean }>("https://api.example.com/data");
      expect(result.data).toBe(true);
      expect(callCount).toBe(2);
    });

    it("getText throws ApiError on HTTP error", async () => {
      mockFetch({ ok: false, status: 503, text: "Unavailable" });
      const client = new HttpClient({ maxRetries: 1 });

      await expect(client.getText("https://api.example.com/data"))
        .rejects.toThrow(ApiError);
    });
  });

  describe("Rate limiter integration", () => {
    it("calls rate limiter acquire before fetch", async () => {
      mockFetch({ ok: true, json: { ok: true } });
      const limiter = new RateLimiter({ perMinute: 100 });
      const acquireSpy = vi.spyOn(limiter, "acquire");
      const client = new HttpClient({ rateLimiter: limiter, maxRetries: 1 });

      await client.get("https://api.example.com/data");
      expect(acquireSpy).toHaveBeenCalled();
    });
  });
});
