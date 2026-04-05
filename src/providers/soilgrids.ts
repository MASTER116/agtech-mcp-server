import { HttpClient } from "../lib/http-client.js";
import { RateLimiter } from "../lib/rate-limiter.js";
import { Cache } from "../lib/cache.js";
import { API_URLS, RATE_LIMITS, CACHE_TTL } from "../config/constants.js";
import type { SoilGridsPropertyResponse, SoilGridsClassificationResponse } from "../types/soilgrids.js";
import { registerSoilProvider } from "../core/provider-registry.js";
import type { ProviderConfig } from "../core/provider-registry.js";

export const providerConfig: ProviderConfig = {
  name: "SoilGrids (ISRIC)",
  regions: ["US", "EU", "RU", "CN", "BR", "IN", "GLOBAL"],
  priority: 5,
  requiresApiKey: false,
};

const rateLimiter = new RateLimiter(RATE_LIMITS.SOILGRIDS);
const cache = new Cache();
const client = new HttpClient({ rateLimiter, cache });

export async function getProperties(params: {
  latitude: number;
  longitude: number;
  properties?: string[];
  depths?: string[];
}): Promise<SoilGridsPropertyResponse> {
  const properties = params.properties ?? ["phh2o", "clay", "sand", "silt", "soc", "nitrogen"];
  const depths = params.depths ?? ["0-5cm", "5-15cm", "15-30cm", "30-60cm"];

  const url = new URL(`${API_URLS.SOILGRIDS_BASE}/properties/query`);
  url.searchParams.set("lon", String(params.longitude));
  url.searchParams.set("lat", String(params.latitude));
  for (const p of properties) url.searchParams.append("property", p);
  for (const d of depths) url.searchParams.append("depth", d);
  url.searchParams.set("value", "mean");

  return client.get<SoilGridsPropertyResponse>(url.toString(), {
    cacheTtlMs: CACHE_TTL.SOIL,
  });
}

export async function getClassification(params: {
  latitude: number;
  longitude: number;
  number_classes?: number;
}): Promise<SoilGridsClassificationResponse> {
  const url = new URL(`${API_URLS.SOILGRIDS_BASE}/classification/query`);
  url.searchParams.set("lon", String(params.longitude));
  url.searchParams.set("lat", String(params.latitude));
  if (params.number_classes) url.searchParams.set("number_classes", String(params.number_classes));

  return client.get<SoilGridsClassificationResponse>(url.toString(), {
    cacheTtlMs: CACHE_TTL.SOIL,
  });
}

// Register as soil provider for auto-routing
registerSoilProvider({
  config: providerConfig,
  getSoilProperties: (lat, lon, properties, depths) => getProperties({ latitude: lat, longitude: lon, properties, depths }),
});
