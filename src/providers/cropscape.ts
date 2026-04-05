import { HttpClient } from "../lib/http-client.js";
import { RateLimiter } from "../lib/rate-limiter.js";
import { Cache } from "../lib/cache.js";
import { API_URLS, RATE_LIMITS, CACHE_TTL } from "../config/constants.js";
import type { CropScapeValue, CropScapeStat } from "../types/cropscape.js";

const rateLimiter = new RateLimiter(RATE_LIMITS.CROPSCAPE);
const cache = new Cache();
const client = new HttpClient({ rateLimiter, cache });

function parseXmlValue(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
  return match?.[1] ?? "";
}

export async function getCropType(params: {
  latitude: number;
  longitude: number;
  year: number;
}): Promise<CropScapeValue> {
  const url = `${API_URLS.CROPSCAPE_BASE}/GetCDLValue?year=${params.year}&x=${params.longitude}&y=${params.latitude}&proj=4326`;

  const xml = await client.getText(url, {
    cacheTtlMs: CACHE_TTL.STATISTICS,
  });

  const category = parseXmlValue(xml, "category") || parseXmlValue(xml, "Category");
  const cropCodeStr = parseXmlValue(xml, "cropcode") || parseXmlValue(xml, "Cropcode");

  return {
    category: category || "Unknown",
    cropCode: parseInt(cropCodeStr) || 0,
  };
}

export async function getCropStats(params: {
  year: number;
  bbox?: { min_lat: number; max_lat: number; min_lon: number; max_lon: number };
  fips?: string;
}): Promise<CropScapeStat[]> {
  let url: string;
  if (params.fips) {
    url = `${API_URLS.CROPSCAPE_BASE}/GetCDLStat?year=${params.year}&fips=${params.fips}&format=json`;
  } else if (params.bbox) {
    const { min_lon, min_lat, max_lon, max_lat } = params.bbox;
    url = `${API_URLS.CROPSCAPE_BASE}/GetCDLStat?year=${params.year}&bbox=${min_lon},${min_lat},${max_lon},${max_lat}&format=json`;
  } else {
    throw new Error("Either bbox or fips must be provided");
  }

  const xml = await client.getText(url, {
    cacheTtlMs: CACHE_TTL.STATISTICS,
  });

  const stats: CropScapeStat[] = [];
  const rowRegex = /<Row[^>]*>([\s\S]*?)<\/Row>/gi;
  let match;
  while ((match = rowRegex.exec(xml)) !== null) {
    const row = match[1];
    const category = parseXmlValue(row, "Category") || parseXmlValue(row, "category");
    const acreage = parseFloat(parseXmlValue(row, "Acreage") || parseXmlValue(row, "acreage")) || 0;
    const percentage = parseFloat(parseXmlValue(row, "Percentage") || parseXmlValue(row, "percentage")) || 0;
    if (category) {
      stats.push({ category, acreage, percentage });
    }
  }

  return stats;
}
