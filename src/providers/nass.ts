import { HttpClient } from "../lib/http-client.js";
import { RateLimiter } from "../lib/rate-limiter.js";
import { Cache } from "../lib/cache.js";
import { API_URLS, RATE_LIMITS, CACHE_TTL } from "../config/constants.js";
import type { NassResponse } from "../types/nass.js";
import { registerStatisticsProvider } from "../core/provider-registry.js";
import type { ProviderConfig } from "../core/provider-registry.js";

export const providerConfig: ProviderConfig = {
  name: "USDA NASS QuickStats",
  regions: ["US"],
  priority: 10,  // Local provider — highest priority for US
  requiresApiKey: true,
  apiKeyEnvVar: "NASS_API_KEY",
};

const CROP_NAME_MAP: Record<string, string> = {
  wheat: "WHEAT", corn: "CORN", maize: "CORN",
  rice: "RICE", soybeans: "SOYBEANS", soybean: "SOYBEANS",
  barley: "BARLEY", sunflower: "SUNFLOWER",
  potatoes: "POTATOES", potato: "POTATOES",
  cotton: "COTTON", rapeseed: "CANOLA", canola: "CANOLA",
};

const rateLimiter = new RateLimiter(RATE_LIMITS.NASS);
const cache = new Cache();
const client = new HttpClient({ rateLimiter, cache });

export async function getCropStatistics(apiKey: string, params: {
  commodity_desc?: string;
  statisticcat_desc?: string;
  state_name?: string;
  year?: number;
  year_ge?: number;
  agg_level_desc?: string;
}): Promise<NassResponse> {
  const url = new URL(`${API_URLS.NASS_BASE}/api_GET/`);
  url.searchParams.set("key", apiKey);
  if (params.commodity_desc) url.searchParams.set("commodity_desc", params.commodity_desc);
  if (params.statisticcat_desc) url.searchParams.set("statisticcat_desc", params.statisticcat_desc);
  if (params.state_name) url.searchParams.set("state_name", params.state_name);
  if (params.year) url.searchParams.set("year", String(params.year));
  if (params.year_ge) url.searchParams.set("year__GE", String(params.year_ge));
  if (params.agg_level_desc) url.searchParams.set("agg_level_desc", params.agg_level_desc);
  url.searchParams.set("format", "JSON");

  return client.get<NassResponse>(url.toString(), {
    cacheTtlMs: CACHE_TTL.STATISTICS,
  });
}

/**
 * Register NASS as a US-local statistics provider (priority 10).
 * Only registered if NASS_API_KEY is available.
 */
export function registerNassProvider(apiKey: string): void {
  registerStatisticsProvider({
    config: providerConfig,
    getCropStats: (commodity, _countryCode, yearStart, yearEnd) => {
      const commodityDesc = CROP_NAME_MAP[commodity.toLowerCase()] ?? commodity.toUpperCase();
      return getCropStatistics(apiKey, {
        commodity_desc: commodityDesc,
        statisticcat_desc: "YIELD",
        agg_level_desc: "NATIONAL",
        year_ge: yearStart,
        year: yearEnd,
      });
    },
  });
}
