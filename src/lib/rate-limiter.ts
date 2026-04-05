interface Window {
  tokens: number;
  maxTokens: number;
  refillIntervalMs: number;
  lastRefill: number;
}

export interface RateLimitConfig {
  perMinute?: number;
  perHour?: number;
  perDay?: number;
}

export class RateLimiter {
  private windows: Window[] = [];

  constructor(config: RateLimitConfig) {
    const now = Date.now();
    if (config.perMinute) {
      this.windows.push({ tokens: config.perMinute, maxTokens: config.perMinute, refillIntervalMs: 60_000, lastRefill: now });
    }
    if (config.perHour) {
      this.windows.push({ tokens: config.perHour, maxTokens: config.perHour, refillIntervalMs: 3_600_000, lastRefill: now });
    }
    if (config.perDay) {
      this.windows.push({ tokens: config.perDay, maxTokens: config.perDay, refillIntervalMs: 86_400_000, lastRefill: now });
    }
  }

  async acquire(): Promise<void> {
    const now = Date.now();

    for (const w of this.windows) {
      const elapsed = now - w.lastRefill;
      if (elapsed >= w.refillIntervalMs) {
        w.tokens = w.maxTokens;
        w.lastRefill = now;
      } else {
        const refill = Math.floor((elapsed / w.refillIntervalMs) * w.maxTokens);
        w.tokens = Math.min(w.maxTokens, w.tokens + refill);
        if (refill > 0) w.lastRefill = now;
      }
    }

    const bottleneck = this.windows.find(w => w.tokens <= 0);
    if (bottleneck) {
      const waitMs = bottleneck.refillIntervalMs - (now - bottleneck.lastRefill);
      await new Promise(resolve => setTimeout(resolve, Math.min(waitMs, 60_000)));
      return this.acquire();
    }

    for (const w of this.windows) {
      w.tokens--;
    }
  }
}
