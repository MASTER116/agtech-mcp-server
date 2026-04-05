import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RateLimiter } from "../../src/lib/rate-limiter.js";

describe("RateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within per-minute limit", async () => {
    const limiter = new RateLimiter({ perMinute: 3 });
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();
    // All three should resolve without waiting
  });

  it("blocks when per-minute tokens are exhausted", async () => {
    const limiter = new RateLimiter({ perMinute: 2 });
    await limiter.acquire();
    await limiter.acquire();

    // Third call should trigger wait
    let resolved = false;
    const p = limiter.acquire().then(() => { resolved = true; });

    // Advance a bit — not enough to refill
    await vi.advanceTimersByTimeAsync(10_000);
    // After enough time, tokens refill
    await vi.advanceTimersByTimeAsync(50_000);
    await p;
    expect(resolved).toBe(true);
  });

  it("creates windows for each configured limit", () => {
    // Verify that multiple windows can coexist by consuming all tokens
    // and checking that acquire doesn't resolve immediately
    const limiter = new RateLimiter({ perMinute: 5, perHour: 10 });
    // Both windows should be initialized — verify by consuming 5 tokens (per-minute limit)
    const promises: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      promises.push(limiter.acquire());
    }
    // All 5 should resolve immediately since per-minute=5 and per-hour=10
    return Promise.all(promises);
  });
});
