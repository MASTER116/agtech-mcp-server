import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { resolveRegion, getRegionName } from "../core/geo-resolver.js";
import {
  getWeatherForPoint,
  getAgroMetricsForPoint,
  getSoilForPoint,
  getCropStatisticsForRegion,
  getAvailableProviders,
} from "../core/provider-registry.js";
import { formatToolHandler } from "../lib/format.js";

export function registerSmartRoutingTools(server: McpServer): void {
  server.tool(
    "detect_region",
    "Detect the agricultural region for given coordinates and show which data providers are available. Returns region code and available providers with their priority (local providers have higher priority).",
    {
      latitude: z.number().min(-90).max(90).describe("Latitude"),
      longitude: z.number().min(-180).max(180).describe("Longitude"),
    },
    async (params) => formatToolHandler(async () => {
      const region = resolveRegion(params.latitude, params.longitude);
      const providers = getAvailableProviders(params.latitude, params.longitude);
      return {
        region,
        regionName: getRegionName(region),
        latitude: params.latitude,
        longitude: params.longitude,
        providers,
      };
    }),
  );

  server.tool(
    "get_field_weather",
    "Smart weather tool with auto-routing: automatically selects the best weather provider for the given location. Local providers (higher priority) are tried first, with international fallback. No API key required for basic usage.",
    {
      latitude: z.number().min(-90).max(90).describe("Latitude"),
      longitude: z.number().min(-180).max(180).describe("Longitude"),
      forecast_days: z.number().min(1).max(16).default(7).describe("Forecast days"),
    },
    async (params) => formatToolHandler(() =>
      getWeatherForPoint(params.latitude, params.longitude, params.forecast_days),
    ),
  );

  server.tool(
    "get_agro_metrics",
    "Smart agro metrics with auto-routing: soil temperature (multiple depths), soil moisture, evapotranspiration (ET0), VPD, frost risk. Automatically uses the best provider for the region.",
    {
      latitude: z.number().min(-90).max(90).describe("Latitude"),
      longitude: z.number().min(-180).max(180).describe("Longitude"),
    },
    async (params) => formatToolHandler(() =>
      getAgroMetricsForPoint(params.latitude, params.longitude),
    ),
  );

  server.tool(
    "get_soil_analysis",
    "Smart soil analysis with auto-routing: pH, texture, organic carbon, nitrogen, bulk density. Automatically selects the best soil data provider for the region.",
    {
      latitude: z.number().min(-90).max(90).describe("Latitude"),
      longitude: z.number().min(-180).max(180).describe("Longitude"),
      properties: z.array(z.string()).optional().describe("Soil properties to query"),
      depths: z.array(z.string()).optional().describe("Depth intervals"),
    },
    async (params) => formatToolHandler(() =>
      getSoilForPoint(params.latitude, params.longitude, params.properties, params.depths),
    ),
  );

  server.tool(
    "get_crop_statistics",
    "Smart crop statistics with auto-routing: for US queries, uses USDA NASS (local, higher priority) if API key is configured, falls back to FAOSTAT (international). For other countries, uses FAOSTAT directly.",
    {
      commodity: z.string().describe("Crop name (e.g. wheat, corn, rice, soybeans, barley)"),
      country_code: z.string().describe("Country code: US, RUS, CHN, BRA, IND, DEU, FRA, UKR, etc."),
      year_start: z.number().int().optional().describe("Start year"),
      year_end: z.number().int().optional().describe("End year"),
    },
    async (params) => formatToolHandler(() =>
      getCropStatisticsForRegion(params.commodity, params.country_code, params.year_start, params.year_end),
    ),
  );
}
