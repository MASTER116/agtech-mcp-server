import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as agromonitoring from "../providers/agromonitoring.js";
import { formatToolHandler } from "../lib/format.js";

export function registerAgromonitoringTools(server: McpServer, apiKey: string): void {
  server.tool(
    "get_agro_weather",
    "Get current weather for a point from Agromonitoring (OpenWeatherMap Agro). Requires Agromonitoring API key.",
    {
      latitude: z.number().min(-90).max(90).describe("Latitude"),
      longitude: z.number().min(-180).max(180).describe("Longitude"),
    },
    async (params) => formatToolHandler(() => agromonitoring.getWeather(apiKey, params)),
  );

  server.tool(
    "get_agro_satellite",
    "Get soil temperature and moisture data for a polygon from Agromonitoring. Requires polygon ID (create via Agromonitoring dashboard). Requires API key.",
    {
      poly_id: z.string().describe("Polygon ID from Agromonitoring"),
    },
    async (params) => formatToolHandler(() => agromonitoring.getSoilData(apiKey, params.poly_id)),
  );
}
