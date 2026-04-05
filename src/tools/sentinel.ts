import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as sentinel from "../providers/sentinel.js";
import { formatToolHandler } from "../lib/format.js";

export function registerSentinelTools(server: McpServer, clientId: string, clientSecret: string): void {
  server.tool(
    "get_ndvi",
    "Get NDVI (Normalized Difference Vegetation Index) statistics for a bounding box and date range from Sentinel-2 satellite imagery. Resolution 10m. Requires Copernicus Data Space credentials.",
    {
      min_lon: z.number().describe("Bounding box min longitude"),
      min_lat: z.number().describe("Bounding box min latitude"),
      max_lon: z.number().describe("Bounding box max longitude"),
      max_lat: z.number().describe("Bounding box max latitude"),
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("End date (YYYY-MM-DD)"),
      interval: z.string().optional().describe("Aggregation interval (e.g. P1D, P5D, P1M)"),
    },
    async (params) => formatToolHandler(() => sentinel.getStatistics(clientId, clientSecret, {
      bbox: [params.min_lon, params.min_lat, params.max_lon, params.max_lat],
      start_date: params.start_date,
      end_date: params.end_date,
      index: "ndvi",
      interval: params.interval,
    })),
  );

  server.tool(
    "get_evi",
    "Get EVI (Enhanced Vegetation Index) statistics for a bounding box from Sentinel-2. Requires Copernicus Data Space credentials.",
    {
      min_lon: z.number().describe("Bounding box min longitude"),
      min_lat: z.number().describe("Bounding box min latitude"),
      max_lon: z.number().describe("Bounding box max longitude"),
      max_lat: z.number().describe("Bounding box max latitude"),
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("End date (YYYY-MM-DD)"),
      interval: z.string().optional().describe("Aggregation interval"),
    },
    async (params) => formatToolHandler(() => sentinel.getStatistics(clientId, clientSecret, {
      bbox: [params.min_lon, params.min_lat, params.max_lon, params.max_lat],
      start_date: params.start_date,
      end_date: params.end_date,
      index: "evi",
      interval: params.interval,
    })),
  );
}
