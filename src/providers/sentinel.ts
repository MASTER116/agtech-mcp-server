import { HttpClient } from "../lib/http-client.js";
import { RateLimiter } from "../lib/rate-limiter.js";
import { Cache } from "../lib/cache.js";
import { API_URLS, RATE_LIMITS, CACHE_TTL } from "../config/constants.js";
import type { SentinelToken, SentinelStatisticsResponse } from "../types/sentinel.js";
import { registerSatelliteProvider } from "../core/provider-registry.js";
import type { ProviderConfig } from "../core/provider-registry.js";

export const providerConfig: ProviderConfig = {
  name: "Sentinel Hub (Copernicus)",
  regions: ["US", "EU", "RU", "CN", "BR", "IN", "GLOBAL"],
  priority: 5,
  requiresApiKey: true,
  apiKeyEnvVar: "SENTINEL_CLIENT_ID",
};

const rateLimiter = new RateLimiter(RATE_LIMITS.SENTINEL);
const cache = new Cache();
const client = new HttpClient({ rateLimiter, cache });

let tokenCache: SentinelToken | null = null;

async function getToken(clientId: string, clientSecret: string): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.obtainedAt + (tokenCache.expires_in - 60) * 1000) {
    return tokenCache.access_token;
  }

  const response = await fetch(API_URLS.SENTINEL_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const data = await response.json() as { access_token: string; expires_in: number };
  tokenCache = { ...data, obtainedAt: Date.now() };
  return data.access_token;
}

function ndviEvalscript(): string {
  return `//VERSION=3
function setup() {
  return { input: ["B04", "B08"], output: { bands: 1 } };
}
function evaluatePixel(sample) {
  let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
  return [ndvi];
}`;
}

function eviEvalscript(): string {
  return `//VERSION=3
function setup() {
  return { input: ["B02", "B04", "B08"], output: { bands: 1 } };
}
function evaluatePixel(sample) {
  let evi = 2.5 * (sample.B08 - sample.B04) / (sample.B08 + 6 * sample.B04 - 7.5 * sample.B02 + 1);
  return [evi];
}`;
}

export async function getStatistics(
  clientId: string,
  clientSecret: string,
  params: {
    bbox: [number, number, number, number];
    start_date: string;
    end_date: string;
    index: "ndvi" | "evi";
    interval?: string;
  },
): Promise<SentinelStatisticsResponse> {
  const token = await getToken(clientId, clientSecret);
  const evalscript = params.index === "ndvi" ? ndviEvalscript() : eviEvalscript();

  const body = {
    input: {
      bounds: {
        bbox: params.bbox,
        properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
      },
      data: [{
        type: "sentinel-2-l2a",
        dataFilter: {
          timeRange: { from: `${params.start_date}T00:00:00Z`, to: `${params.end_date}T23:59:59Z` },
          maxCloudCoverage: 30,
        },
      }],
    },
    aggregation: {
      timeRange: { from: `${params.start_date}T00:00:00Z`, to: `${params.end_date}T23:59:59Z` },
      aggregationInterval: { of: params.interval ?? "P1D" },
      evalscript,
    },
  };

  return client.post<SentinelStatisticsResponse>(
    `${API_URLS.SENTINEL_BASE}/api/v1/statistics`,
    body,
    { headers: { Authorization: `Bearer ${token}` } },
  );
}

/**
 * Register Sentinel Hub as satellite provider for auto-routing.
 */
export function registerSentinelProvider(clientId: string, clientSecret: string): void {
  registerSatelliteProvider({
    config: providerConfig,
    getNdvi: (bbox, startDate, endDate) => getStatistics(clientId, clientSecret, {
      bbox, start_date: startDate, end_date: endDate, index: "ndvi",
    }),
  });
}
