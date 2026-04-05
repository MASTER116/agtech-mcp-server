import { HttpClient } from "../lib/http-client.js";
import { RateLimiter } from "../lib/rate-limiter.js";
import { Cache } from "../lib/cache.js";
import { API_URLS, RATE_LIMITS, CACHE_TTL } from "../config/constants.js";
import type { FaostatResponse } from "../types/faostat.js";
import { registerStatisticsProvider } from "../core/provider-registry.js";
import type { ProviderConfig } from "../core/provider-registry.js";

export const providerConfig: ProviderConfig = {
  name: "FAOSTAT",
  regions: ["US", "EU", "RU", "CN", "BR", "IN", "GLOBAL"],
  priority: 5,
  requiresApiKey: false,
};

// FAO country code mappings
const COUNTRY_MAP: Record<string, string> = {
  US: "231", USA: "231",
  RU: "185", RUS: "185",
  CN: "351", CHN: "351",
  BR: "21", BRA: "21",
  IN: "100", IND: "100",
  DE: "79", DEU: "79",
  FR: "68", FRA: "68",
  UA: "230", UKR: "230",
  KZ: "108", KAZ: "108",
  BY: "57", BLR: "57",
  AR: "9", ARG: "9",
  AU: "10", AUS: "10",
  CA: "33", CAN: "33",
};

// FAO crop code mappings
const CROP_MAP: Record<string, string> = {
  wheat: "15", corn: "56", maize: "56",
  rice: "27", soybeans: "236", soybean: "236",
  barley: "44", sunflower: "267",
  potatoes: "116", potato: "116",
  cotton: "328", rapeseed: "270", canola: "270",
};

const rateLimiter = new RateLimiter(RATE_LIMITS.FAOSTAT);
const cache = new Cache();
const client = new HttpClient({ rateLimiter, cache, timeoutMs: 60_000 });

async function queryDomain(domain: string, params: {
  area?: string;
  item?: string;
  element?: string;
  year_start?: number;
  year_end?: number;
}): Promise<FaostatResponse> {
  const url = new URL(`${API_URLS.FAOSTAT_BASE}/data/${domain}`);
  if (params.area) url.searchParams.set("area", params.area);
  if (params.item) url.searchParams.set("item", params.item);
  if (params.element) url.searchParams.set("element", params.element);
  if (params.year_start && params.year_end) {
    url.searchParams.set("year", `${params.year_start}:${params.year_end}`);
  }
  url.searchParams.set("area_cs", "FAO");
  url.searchParams.set("show_codes", "true");
  url.searchParams.set("show_flags", "true");
  url.searchParams.set("output_type", "objects");

  return client.get<FaostatResponse>(url.toString(), {
    cacheTtlMs: CACHE_TTL.STATISTICS,
  });
}

export async function getCropProduction(params: {
  area_code: string;
  item_code: string;
  year_start?: number;
  year_end?: number;
  element_code?: string;
}): Promise<FaostatResponse> {
  return queryDomain("QCL", {
    area: params.area_code,
    item: params.item_code,
    element: params.element_code,
    year_start: params.year_start,
    year_end: params.year_end,
  });
}

export async function getFoodPrices(params: {
  area_code: string;
  item_code: string;
  year_start?: number;
  year_end?: number;
}): Promise<FaostatResponse> {
  return queryDomain("PP", {
    area: params.area_code,
    item: params.item_code,
    year_start: params.year_start,
    year_end: params.year_end,
  });
}

export async function getTradeData(params: {
  area_code: string;
  item_code: string;
  element?: string;
  year_start?: number;
  year_end?: number;
}): Promise<FaostatResponse> {
  return queryDomain("TP", {
    area: params.area_code,
    item: params.item_code,
    element: params.element,
    year_start: params.year_start,
    year_end: params.year_end,
  });
}

export async function getFoodBalance(params: {
  area_code: string;
  item_code: string;
  year_start?: number;
  year_end?: number;
}): Promise<FaostatResponse> {
  return queryDomain("FBS", {
    area: params.area_code,
    item: params.item_code,
    year_start: params.year_start,
    year_end: params.year_end,
  });
}

export async function getLandUse(params: {
  area_code: string;
  year_start?: number;
  year_end?: number;
}): Promise<FaostatResponse> {
  return queryDomain("RL", {
    area: params.area_code,
    year_start: params.year_start,
    year_end: params.year_end,
  });
}

export async function getFertilizerUse(params: {
  area_code: string;
  item_code?: string;
  year_start?: number;
  year_end?: number;
}): Promise<FaostatResponse> {
  return queryDomain("RFN", {
    area: params.area_code,
    item: params.item_code,
    year_start: params.year_start,
    year_end: params.year_end,
  });
}

// Register as statistics provider for auto-routing (international fallback)
registerStatisticsProvider({
  config: providerConfig,
  getCropStats: (commodity, countryCode, yearStart, yearEnd) => {
    const areaCode = COUNTRY_MAP[countryCode.toUpperCase()] ?? countryCode;
    const itemCode = CROP_MAP[commodity.toLowerCase()] ?? commodity;
    return getCropProduction({ area_code: areaCode, item_code: itemCode, year_start: yearStart, year_end: yearEnd });
  },
});
