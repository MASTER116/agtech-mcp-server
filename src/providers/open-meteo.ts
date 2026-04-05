import { HttpClient } from "../lib/http-client.js";
import { RateLimiter } from "../lib/rate-limiter.js";
import { Cache } from "../lib/cache.js";
import { API_URLS, RATE_LIMITS, CACHE_TTL, OPEN_METEO_PARAMS } from "../config/constants.js";
import type { OpenMeteoResponse, OpenMeteoClimateResponse } from "../types/open-meteo.js";
import { registerWeatherProvider } from "../core/provider-registry.js";
import type { ProviderConfig } from "../core/provider-registry.js";

export const providerConfig: ProviderConfig = {
  name: "Open-Meteo",
  regions: ["US", "EU", "RU", "CN", "BR", "IN", "GLOBAL"],
  priority: 5,
  requiresApiKey: false,
};

const rateLimiter = new RateLimiter(RATE_LIMITS.OPEN_METEO);
const cache = new Cache();
const client = new HttpClient({ rateLimiter, cache });

export type Preset = "soil" | "agro" | "standard" | "all";

function getHourlyParams(preset: Preset, custom?: string[]): string[] {
  if (custom && custom.length > 0) return custom;
  switch (preset) {
    case "soil": return [...OPEN_METEO_PARAMS.SOIL_HOURLY];
    case "agro": return [...OPEN_METEO_PARAMS.SOIL_HOURLY, ...OPEN_METEO_PARAMS.AGRO_HOURLY];
    case "standard": return [...OPEN_METEO_PARAMS.STANDARD_HOURLY];
    case "all": return [...OPEN_METEO_PARAMS.STANDARD_HOURLY, ...OPEN_METEO_PARAMS.SOIL_HOURLY, ...OPEN_METEO_PARAMS.AGRO_HOURLY];
  }
}

function getDailyParams(custom?: string[]): string[] {
  if (custom && custom.length > 0) return custom;
  return [...OPEN_METEO_PARAMS.AGRO_DAILY];
}

export async function getForecast(params: {
  latitude: number;
  longitude: number;
  preset?: Preset;
  hourly?: string[];
  daily?: string[];
  forecast_days?: number;
}): Promise<OpenMeteoResponse> {
  const preset = params.preset ?? "agro";
  const hourly = getHourlyParams(preset, params.hourly);
  const daily = getDailyParams(params.daily);
  const days = params.forecast_days ?? 7;

  const url = new URL(API_URLS.OPEN_METEO_FORECAST);
  url.searchParams.set("latitude", String(params.latitude));
  url.searchParams.set("longitude", String(params.longitude));
  url.searchParams.set("hourly", hourly.join(","));
  url.searchParams.set("daily", daily.join(","));
  url.searchParams.set("forecast_days", String(days));
  url.searchParams.set("timezone", "auto");

  return client.get<OpenMeteoResponse>(url.toString(), {
    cacheTtlMs: CACHE_TTL.WEATHER_FORECAST,
  });
}

export async function getHistorical(params: {
  latitude: number;
  longitude: number;
  start_date: string;
  end_date: string;
  preset?: Preset;
  hourly?: string[];
  daily?: string[];
}): Promise<OpenMeteoResponse> {
  const preset = params.preset ?? "agro";
  const hourly = getHourlyParams(preset, params.hourly);
  const daily = getDailyParams(params.daily);

  const url = new URL(API_URLS.OPEN_METEO_ARCHIVE);
  url.searchParams.set("latitude", String(params.latitude));
  url.searchParams.set("longitude", String(params.longitude));
  url.searchParams.set("start_date", params.start_date);
  url.searchParams.set("end_date", params.end_date);
  url.searchParams.set("hourly", hourly.join(","));
  url.searchParams.set("daily", daily.join(","));
  url.searchParams.set("timezone", "auto");

  return client.get<OpenMeteoResponse>(url.toString(), {
    cacheTtlMs: CACHE_TTL.WEATHER_HISTORICAL,
  });
}

export async function getClimateProjection(params: {
  latitude: number;
  longitude: number;
  start_date: string;
  end_date: string;
  models?: string[];
  daily?: string[];
}): Promise<OpenMeteoClimateResponse> {
  const models = params.models ?? ["EC_Earth3P_HR", "MRI_AGCM3_2_S"];
  const daily = params.daily ?? ["temperature_2m_max", "temperature_2m_min", "precipitation_sum"];

  const url = new URL(API_URLS.OPEN_METEO_CLIMATE);
  url.searchParams.set("latitude", String(params.latitude));
  url.searchParams.set("longitude", String(params.longitude));
  url.searchParams.set("start_date", params.start_date);
  url.searchParams.set("end_date", params.end_date);
  url.searchParams.set("models", models.join(","));
  url.searchParams.set("daily", daily.join(","));

  return client.get<OpenMeteoClimateResponse>(url.toString(), {
    cacheTtlMs: CACHE_TTL.CLIMATE,
  });
}

// Register as weather provider for auto-routing
registerWeatherProvider({
  config: providerConfig,
  getWeather: (lat, lon, days) => getForecast({ latitude: lat, longitude: lon, preset: "standard", forecast_days: days }),
  getAgroMetrics: (lat, lon) => getForecast({ latitude: lat, longitude: lon, preset: "agro", forecast_days: 1 }),
});
