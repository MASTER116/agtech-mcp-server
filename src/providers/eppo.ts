import { HttpClient } from "../lib/http-client.js";
import { RateLimiter } from "../lib/rate-limiter.js";
import { Cache } from "../lib/cache.js";
import { API_URLS, RATE_LIMITS, CACHE_TTL } from "../config/constants.js";
import type { EppoSearchResult, EppoPestInfo } from "../types/eppo.js";

const rateLimiter = new RateLimiter(RATE_LIMITS.EPPO);
const cache = new Cache();
const client = new HttpClient({ rateLimiter, cache });

export async function searchPests(apiKey: string, params: {
  query: string;
  type?: string;
}): Promise<EppoSearchResult[]> {
  const url = new URL(`${API_URLS.EPPO_BASE}/tools/search`);
  url.searchParams.set("authtoken", apiKey);
  url.searchParams.set("searchstring", params.query);
  if (params.type) url.searchParams.set("type", params.type);

  return client.get<EppoSearchResult[]>(url.toString(), {
    cacheTtlMs: CACHE_TTL.PEST,
  });
}

export async function getPestInfo(apiKey: string, eppoCode: string): Promise<EppoPestInfo> {
  const url = new URL(`${API_URLS.EPPO_BASE}/pests/${eppoCode}`);
  url.searchParams.set("authtoken", apiKey);

  return client.get<EppoPestInfo>(url.toString(), {
    cacheTtlMs: CACHE_TTL.PEST,
  });
}
