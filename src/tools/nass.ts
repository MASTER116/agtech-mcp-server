import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as nass from "../providers/nass.js";
import { formatToolHandler } from "../lib/format.js";

export function registerNassTools(server: McpServer, apiKey: string): void {
  server.tool(
    "get_usda_crop_statistics",
    "Get detailed US crop statistics from USDA NASS QuickStats — prices, yields, acreage by state/county. Requires NASS API key.",
    {
      commodity_desc: z.string().optional().describe("Commodity (e.g. CORN, WHEAT, SOYBEANS)"),
      statisticcat_desc: z.string().optional().describe("Statistic category (e.g. YIELD, AREA HARVESTED, PRODUCTION, PRICE RECEIVED)"),
      state_name: z.string().optional().describe("US state name (e.g. IOWA, VIRGINIA)"),
      year: z.number().int().optional().describe("Specific year"),
      year_ge: z.number().int().optional().describe("Year greater or equal (e.g. 2010 for data since 2010)"),
      agg_level_desc: z.string().optional().describe("Aggregation level (STATE, COUNTY, NATIONAL)"),
    },
    async (params) => formatToolHandler(() => nass.getCropStatistics(apiKey, params)),
  );
}
