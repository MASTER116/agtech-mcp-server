import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as yandex from "../providers/yandex-weather.js";
import { formatToolHandler } from "../lib/format.js";

export function registerYandexWeatherTools(server: McpServer, apiKey: string): void {
  server.tool(
    "get_yandex_forecast",
    "Get weather forecast from Yandex Weather (GraphQL API, 150+ parameters). Best for Russian regions. Requires Yandex Weather API key.",
    {
      latitude: z.number().min(-90).max(90).describe("Latitude"),
      longitude: z.number().min(-180).max(180).describe("Longitude"),
      days: z.number().int().min(1).max(10).default(7).describe("Forecast days (1-10)"),
    },
    async (params) => formatToolHandler(() => yandex.getForecast(apiKey, params)),
  );
}
