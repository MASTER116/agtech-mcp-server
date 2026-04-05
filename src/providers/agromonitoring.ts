import { HttpClient } from "../lib/http-client.js";
import { RateLimiter } from "../lib/rate-limiter.js";
import { Cache } from "../lib/cache.js";
import { API_URLS, RATE_LIMITS, CACHE_TTL } from "../config/constants.js";
import type { AgroWeather, AgroSoilData } from "../types/agromonitoring.js";

const rateLimiter = new RateLimiter(RATE_LIMITS.AGROMONITORING);
const cache = new Cache();
const client = new HttpClient({ rateLimiter, cache });

export async function getWeather(apiKey: string, params: {
  latitude: number;
  longitude: number;
}): Promise<AgroWeather> {
  const url = `${API_URLS.AGROMONITORING_BASE}/weather?lat=${params.latitude}&lon=${params.longitude}&appid=${apiKey}`;
  return client.get<AgroWeather>(url, {
    cacheTtlMs: CACHE_TTL.WEATHER_FORECAST,
  });
}

export async function getSoilData(apiKey: string, polyId: string): Promise<AgroSoilData> {
  const url = `${API_URLS.AGROMONITORING_BASE}/soil?polyid=${polyId}&appid=${apiKey}`;
  return client.get<AgroSoilData>(url, {
    cacheTtlMs: CACHE_TTL.WEATHER_FORECAST,
  });
}
