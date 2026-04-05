export interface SentinelToken {
  access_token: string;
  expires_in: number;
  obtainedAt: number;
}

export interface SentinelStatisticsResponse {
  data: Array<{
    interval: { from: string; to: string };
    outputs: Record<string, {
      bands: Record<string, {
        stats: { min: number; max: number; mean: number; stDev: number };
        histogram: { bins: Array<{ lowEdge: number; highEdge: number; count: number }> };
      }>;
    }>;
  }>;
}
