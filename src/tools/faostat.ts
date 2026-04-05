import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as faostat from "../providers/faostat.js";
import { formatToolHandler } from "../lib/format.js";

const areaCodeDesc = "FAO area code (e.g. 185=Russia, 231=USA, 351=China, 21=Brazil, 100=India)";
const itemCodeDesc = "FAO item code (e.g. 15=Wheat, 56=Maize, 27=Rice, 236=Soybeans, 44=Barley)";

export function registerFaostatTools(server: McpServer): void {
  server.tool(
    "get_crop_production",
    "Get crop and livestock production data (area harvested, yield, production quantity) from FAOSTAT. Global coverage, 245+ countries since 1961. No API key required.",
    {
      area_code: z.string().describe(areaCodeDesc),
      item_code: z.string().describe(itemCodeDesc),
      year_start: z.number().int().min(1961).optional().describe("Start year (default: all available)"),
      year_end: z.number().int().optional().describe("End year"),
      element_code: z.string().optional().describe("Element code (5312=Area harvested, 5510=Production, 5419=Yield)"),
    },
    async (params) => formatToolHandler(() => faostat.getCropProduction(params)),
  );

  server.tool(
    "get_food_prices",
    "Get producer prices for agricultural commodities from FAOSTAT. No API key required.",
    {
      area_code: z.string().describe(areaCodeDesc),
      item_code: z.string().describe(itemCodeDesc),
      year_start: z.number().int().min(1961).optional(),
      year_end: z.number().int().optional(),
    },
    async (params) => formatToolHandler(() => faostat.getFoodPrices(params)),
  );

  server.tool(
    "get_trade_data",
    "Get import/export trade data for agricultural commodities from FAOSTAT. No API key required.",
    {
      area_code: z.string().describe(areaCodeDesc),
      item_code: z.string().describe(itemCodeDesc),
      element: z.string().optional().describe("Trade element filter"),
      year_start: z.number().int().min(1961).optional(),
      year_end: z.number().int().optional(),
    },
    async (params) => formatToolHandler(() => faostat.getTradeData(params)),
  );

  server.tool(
    "get_food_balance",
    "Get food balance sheet data (supply, utilization, per capita) from FAOSTAT. No API key required.",
    {
      area_code: z.string().describe(areaCodeDesc),
      item_code: z.string().describe(itemCodeDesc),
      year_start: z.number().int().min(1961).optional(),
      year_end: z.number().int().optional(),
    },
    async (params) => formatToolHandler(() => faostat.getFoodBalance(params)),
  );

  server.tool(
    "get_land_use",
    "Get agricultural land use data from FAOSTAT. No API key required.",
    {
      area_code: z.string().describe(areaCodeDesc),
      year_start: z.number().int().min(1961).optional(),
      year_end: z.number().int().optional(),
    },
    async (params) => formatToolHandler(() => faostat.getLandUse(params)),
  );

  server.tool(
    "get_fertilizer_use",
    "Get fertilizer usage data from FAOSTAT. No API key required.",
    {
      area_code: z.string().describe(areaCodeDesc),
      item_code: z.string().optional().describe("Fertilizer item code"),
      year_start: z.number().int().min(1961).optional(),
      year_end: z.number().int().optional(),
    },
    async (params) => formatToolHandler(() => faostat.getFertilizerUse(params)),
  );
}
