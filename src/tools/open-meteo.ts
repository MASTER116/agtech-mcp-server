import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as openMeteo from "../providers/open-meteo.js";
import { formatToolHandler } from "../lib/format.js";

export function registerOpenMeteoTools(server: McpServer): void {
  server.tool(
    "get_weather_forecast",
    "Get weather forecast with agricultural parameters (soil temperature/moisture, evapotranspiration, VPD). Uses Open-Meteo API, no API key required.",
    {
      latitude: z.number().min(-90).max(90).describe("Latitude (-90 to 90)"),
      longitude: z.number().min(-180).max(180).describe("Longitude (-180 to 180)"),
      preset: z.enum(["soil", "agro", "standard", "all"]).default("agro").describe("Parameter preset: soil (soil temp/moisture), agro (soil + ET0/VPD), standard (air temp/precip/wind), all"),
      hourly: z.array(z.string()).optional().describe("Custom hourly params (overrides preset)"),
      daily: z.array(z.string()).optional().describe("Custom daily params"),
      forecast_days: z.number().min(1).max(16).default(7).describe("Forecast days (1-16)"),
    },
    async (params) => formatToolHandler(() => openMeteo.getForecast(params)),
  );

  server.tool(
    "get_historical_weather",
    "Get historical weather and soil data for any date range since 1940. Uses Open-Meteo Archive API, no API key required.",
    {
      latitude: z.number().min(-90).max(90).describe("Latitude (-90 to 90)"),
      longitude: z.number().min(-180).max(180).describe("Longitude (-180 to 180)"),
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("End date (YYYY-MM-DD)"),
      preset: z.enum(["soil", "agro", "standard", "all"]).default("agro").describe("Parameter preset"),
      hourly: z.array(z.string()).optional().describe("Custom hourly params (overrides preset)"),
      daily: z.array(z.string()).optional().describe("Custom daily params"),
    },
    async (params) => formatToolHandler(() => openMeteo.getHistorical(params)),
  );

  server.tool(
    "get_climate_projection",
    "Get CMIP6 climate model projections for future temperature and precipitation. Uses Open-Meteo Climate API, no API key required.",
    {
      latitude: z.number().min(-90).max(90).describe("Latitude (-90 to 90)"),
      longitude: z.number().min(-180).max(180).describe("Longitude (-180 to 180)"),
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("End date (YYYY-MM-DD)"),
      models: z.array(z.string()).optional().describe("Climate models (default: EC_Earth3P_HR, MRI_AGCM3_2_S)"),
      daily: z.array(z.string()).optional().describe("Daily parameters (default: temperature_2m_max/min, precipitation_sum)"),
    },
    async (params) => formatToolHandler(() => openMeteo.getClimateProjection(params)),
  );
}
