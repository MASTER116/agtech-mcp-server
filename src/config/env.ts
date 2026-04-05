import dotenv from "dotenv";

dotenv.config();

export interface Config {
  // Tier 2
  nassApiKey?: string;
  noaaToken?: string;
  sentinelClientId?: string;
  sentinelClientSecret?: string;
  earthdataUsername?: string;
  earthdataPassword?: string;
  plantnetApiKey?: string;
  eppoApiKey?: string;
  // Tier 3
  agromonitoringApiKey?: string;
  yandexWeatherApiKey?: string;
}

export function loadConfig(): Config {
  return {
    nassApiKey: process.env.NASS_API_KEY || undefined,
    noaaToken: process.env.NOAA_TOKEN || undefined,
    sentinelClientId: process.env.SENTINEL_CLIENT_ID || undefined,
    sentinelClientSecret: process.env.SENTINEL_CLIENT_SECRET || undefined,
    earthdataUsername: process.env.EARTHDATA_USERNAME || undefined,
    earthdataPassword: process.env.EARTHDATA_PASSWORD || undefined,
    plantnetApiKey: process.env.PLANTNET_API_KEY || undefined,
    eppoApiKey: process.env.EPPO_API_KEY || undefined,
    agromonitoringApiKey: process.env.AGROMONITORING_API_KEY || undefined,
    yandexWeatherApiKey: process.env.YANDEX_WEATHER_API_KEY || undefined,
  };
}
