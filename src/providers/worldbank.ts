import { HttpClient } from "../lib/http-client.js";
import { RateLimiter } from "../lib/rate-limiter.js";
import { Cache } from "../lib/cache.js";
import { API_URLS, RATE_LIMITS, CACHE_TTL } from "../config/constants.js";
import type { WorldBankResponse, WorldBankIndicatorValue } from "../types/worldbank.js";

const rateLimiter = new RateLimiter(RATE_LIMITS.WORLDBANK);
const cache = new Cache();
const client = new HttpClient({ rateLimiter, cache });

export async function getIndicators(params: {
  country_code: string;
  indicators: string[];
  year_start?: number;
  year_end?: number;
}): Promise<WorldBankIndicatorValue[]> {
  const yearStart = params.year_start ?? 2000;
  const yearEnd = params.year_end ?? new Date().getFullYear();
  const results: WorldBankIndicatorValue[] = [];

  for (const indicator of params.indicators) {
    const url = `${API_URLS.WORLDBANK_BASE}/country/${params.country_code}/indicator/${indicator}?date=${yearStart}:${yearEnd}&format=json&per_page=500`;

    const response = await client.get<WorldBankResponse>(url, {
      cacheTtlMs: CACHE_TTL.STATISTICS,
    });

    if (response[1]) {
      results.push(...response[1]);
    }
  }

  return results;
}
