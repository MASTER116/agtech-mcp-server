import { HttpClient } from "../lib/http-client.js";
import { RateLimiter } from "../lib/rate-limiter.js";
import { Cache } from "../lib/cache.js";
import { API_URLS, RATE_LIMITS, CACHE_TTL } from "../config/constants.js";
import type { YandexWeatherResponse } from "../types/yandex-weather.js";

const rateLimiter = new RateLimiter(RATE_LIMITS.YANDEX);
const cache = new Cache();
const client = new HttpClient({ rateLimiter, cache });

export async function getForecast(apiKey: string, params: {
  latitude: number;
  longitude: number;
  days?: number;
}): Promise<YandexWeatherResponse> {
  const days = params.days ?? 7;

  const query = `{
    weatherByPoint(request: { lat: ${params.latitude}, lon: ${params.longitude} }) {
      now {
        temperature
        humidity
        pressure
        windSpeed
        windDirection
        condition
        cloudiness
      }
      forecast {
        days(limit: ${days}) {
          time
          maxTemperature
          minTemperature
          maxWindSpeed
          totalPrecipitation
          condition
        }
      }
    }
  }`;

  return client.post<YandexWeatherResponse>(
    API_URLS.YANDEX_WEATHER,
    { query },
    { headers: { "X-Yandex-Weather-Key": apiKey } },
  );
}
