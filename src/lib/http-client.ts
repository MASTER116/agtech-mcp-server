import { ApiError } from "./errors.js";
import { RateLimiter } from "./rate-limiter.js";
import { Cache } from "./cache.js";

export interface HttpClientOptions {
  rateLimiter?: RateLimiter;
  cache?: Cache;
  timeoutMs?: number;
  maxRetries?: number;
}

export class HttpClient {
  private rateLimiter?: RateLimiter;
  private cache?: Cache;
  private timeoutMs: number;
  private maxRetries: number;

  constructor(options: HttpClientOptions = {}) {
    this.rateLimiter = options.rateLimiter;
    this.cache = options.cache;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.maxRetries = options.maxRetries ?? 3;
  }

  async get<T>(url: string, options?: {
    headers?: Record<string, string>;
    cacheTtlMs?: number;
    cacheKey?: string;
  }): Promise<T> {
    const cacheKey = options?.cacheKey ?? url;

    if (this.cache && options?.cacheTtlMs) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached !== undefined) return cached;
    }

    const data = await this.fetchWithRetry<T>(url, {
      method: "GET",
      headers: options?.headers,
    });

    if (this.cache && options?.cacheTtlMs) {
      this.cache.set(cacheKey, data, options.cacheTtlMs);
    }

    return data;
  }

  async post<T>(url: string, body: unknown, options?: {
    headers?: Record<string, string>;
  }): Promise<T> {
    return this.fetchWithRetry<T>(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: JSON.stringify(body),
    });
  }

  async getText(url: string, options?: {
    headers?: Record<string, string>;
    cacheTtlMs?: number;
    cacheKey?: string;
  }): Promise<string> {
    const cacheKey = options?.cacheKey ?? url;

    if (this.cache && options?.cacheTtlMs) {
      const cached = this.cache.get<string>(cacheKey);
      if (cached !== undefined) return cached;
    }

    if (this.rateLimiter) await this.rateLimiter.acquire();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: options?.headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new ApiError(response.status, url, body);
      }

      const text = await response.text();

      if (this.cache && options?.cacheTtlMs) {
        this.cache.set(cacheKey, text, options.cacheTtlMs);
      }

      return text;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchWithRetry<T>(url: string, init: RequestInit): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      if (this.rateLimiter) await this.rateLimiter.acquire();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.text().catch(() => "");
          const error = new ApiError(response.status, url, body);

          if (response.status === 429 || response.status >= 500) {
            lastError = error;
            const delay = Math.min(1000 * Math.pow(2, attempt), 10_000);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          throw error;
        }

        return await response.json() as T;
      } catch (e) {
        if (e instanceof ApiError) throw e;
        lastError = e as Error;
        if (attempt < this.maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10_000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError ?? new Error(`Failed after ${this.maxRetries} retries: ${url}`);
  }
}
