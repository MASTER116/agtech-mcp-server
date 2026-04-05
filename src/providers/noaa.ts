import { HttpClient } from "../lib/http-client.js";
import { RateLimiter } from "../lib/rate-limiter.js";
import { Cache } from "../lib/cache.js";
import { API_URLS, RATE_LIMITS, CACHE_TTL } from "../config/constants.js";
import type { NoaaResponse } from "../types/noaa.js";

const rateLimiter = new RateLimiter(RATE_LIMITS.NOAA);
const cache = new Cache();
const client = new HttpClient({ rateLimiter, cache });

export async function getData(token: string, params: {
  datasetid: string;
  locationid?: string;
  stationid?: string;
  datatypeid?: string;
  startdate: string;
  enddate: string;
  limit?: number;
}): Promise<NoaaResponse> {
  const url = new URL(`${API_URLS.NOAA_BASE}/data`);
  url.searchParams.set("datasetid", params.datasetid);
  if (params.locationid) url.searchParams.set("locationid", params.locationid);
  if (params.stationid) url.searchParams.set("stationid", params.stationid);
  if (params.datatypeid) url.searchParams.set("datatypeid", params.datatypeid);
  url.searchParams.set("startdate", params.startdate);
  url.searchParams.set("enddate", params.enddate);
  url.searchParams.set("limit", String(params.limit ?? 1000));
  url.searchParams.set("units", "metric");

  return client.get<NoaaResponse>(url.toString(), {
    headers: { token },
    cacheTtlMs: CACHE_TTL.WEATHER_HISTORICAL,
  });
}
