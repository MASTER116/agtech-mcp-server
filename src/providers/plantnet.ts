import { HttpClient } from "../lib/http-client.js";
import { RateLimiter } from "../lib/rate-limiter.js";
import { Cache } from "../lib/cache.js";
import { API_URLS, RATE_LIMITS, CACHE_TTL } from "../config/constants.js";
import type { PlantNetResponse } from "../types/plantnet.js";

const rateLimiter = new RateLimiter(RATE_LIMITS.PLANTNET);
const cache = new Cache();
const client = new HttpClient({ rateLimiter, cache });

export async function identifyPlant(apiKey: string, params: {
  image_url: string;
  organs?: string[];
  project?: string;
  lang?: string;
}): Promise<PlantNetResponse> {
  const project = params.project ?? "all";
  const organs = params.organs ?? ["auto"];
  const lang = params.lang ?? "en";

  const url = new URL(`${API_URLS.PLANTNET_BASE}/identify/${project}`);
  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("lang", lang);
  url.searchParams.set("include-related-images", "false");

  for (const imageUrl of [params.image_url]) {
    url.searchParams.append("images", imageUrl);
  }
  for (const organ of organs) {
    url.searchParams.append("organs", organ);
  }

  return client.get<PlantNetResponse>(url.toString(), {
    cacheTtlMs: CACHE_TTL.PLANT_ID,
  });
}
