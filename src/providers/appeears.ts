import { HttpClient } from "../lib/http-client.js";
import { RateLimiter } from "../lib/rate-limiter.js";
import { API_URLS, RATE_LIMITS } from "../config/constants.js";
import type { AppEEARSTask, AppEEARSBundle, AppEEARSToken } from "../types/appeears.js";

const rateLimiter = new RateLimiter(RATE_LIMITS.APPEEARS);
const client = new HttpClient({ rateLimiter });

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken(username: string, password: string): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const response = await fetch(`${API_URLS.APPEEARS_BASE}/login`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
    },
  });

  const data = await response.json() as AppEEARSToken;
  tokenCache = {
    token: data.token,
    expiresAt: new Date(data.expiration).getTime() - 60_000,
  };
  return data.token;
}

export async function submitTask(
  username: string,
  password: string,
  params: {
    task_name: string;
    latitude: number;
    longitude: number;
    start_date: string;
    end_date: string;
    product: string;
    layer: string;
  },
): Promise<AppEEARSTask> {
  const token = await getToken(username, password);

  return client.post<AppEEARSTask>(
    `${API_URLS.APPEEARS_BASE}/task`,
    {
      task_type: "point",
      task_name: params.task_name,
      params: {
        dates: [{ startDate: params.start_date, endDate: params.end_date }],
        layers: [{ product: params.product, layer: params.layer }],
        coordinates: [{
          latitude: params.latitude,
          longitude: params.longitude,
          id: "point_1",
        }],
      },
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );
}

export async function getTaskStatus(
  username: string,
  password: string,
  taskId: string,
): Promise<AppEEARSTask> {
  const token = await getToken(username, password);

  return client.get<AppEEARSTask>(
    `${API_URLS.APPEEARS_BASE}/task/${taskId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
}

export async function getTaskBundle(
  username: string,
  password: string,
  taskId: string,
): Promise<AppEEARSBundle> {
  const token = await getToken(username, password);

  return client.get<AppEEARSBundle>(
    `${API_URLS.APPEEARS_BASE}/bundle/${taskId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
}
