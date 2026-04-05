import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as cropscape from "../providers/cropscape.js";
import { formatToolHandler } from "../lib/format.js";

export function registerCropScapeTools(server: McpServer): void {
  server.tool(
    "get_crop_type",
    "Identify the crop type at a specific point in Continental US using USDA CropScape Cropland Data Layer. Resolution 10m (since 2024). No API key required.",
    {
      latitude: z.number().min(24).max(50).describe("Latitude (Continental US: 24-50)"),
      longitude: z.number().min(-125).max(-66).describe("Longitude (Continental US: -125 to -66)"),
      year: z.number().int().min(2008).max(2025).describe("CDL year (2008-2025)"),
    },
    async (params) => formatToolHandler(() => cropscape.getCropType(params)),
  );

  server.tool(
    "get_crop_coverage_stats",
    "Get crop acreage statistics for a region in Continental US from USDA CropScape. Specify either bounding box or FIPS county code. No API key required.",
    {
      year: z.number().int().min(2008).max(2025).describe("CDL year"),
      fips: z.string().optional().describe("US county FIPS code (e.g. 19001 for Adair County, Iowa)"),
      min_lat: z.number().optional().describe("Bounding box min latitude"),
      max_lat: z.number().optional().describe("Bounding box max latitude"),
      min_lon: z.number().optional().describe("Bounding box min longitude"),
      max_lon: z.number().optional().describe("Bounding box max longitude"),
    },
    async (params) => {
      const bbox = (params.min_lat != null && params.max_lat != null && params.min_lon != null && params.max_lon != null)
        ? { min_lat: params.min_lat, max_lat: params.max_lat, min_lon: params.min_lon, max_lon: params.max_lon }
        : undefined;
      return formatToolHandler(() => cropscape.getCropStats({
        year: params.year,
        fips: params.fips,
        bbox,
      }));
    },
  );
}
