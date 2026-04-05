import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as worldbank from "../providers/worldbank.js";
import { formatToolHandler } from "../lib/format.js";

export function registerWorldBankTools(server: McpServer): void {
  server.tool(
    "get_country_ag_indicators",
    "Get macroeconomic agricultural indicators from World Bank (land use %, fertilizer use, agriculture share of GDP, agricultural employment). 200+ countries since 1960. No API key required.",
    {
      country_code: z.string().length(3).describe("ISO 3166-1 alpha-3 country code (e.g. RUS, USA, BRA, CHN, IND)"),
      indicators: z.array(z.string())
        .default(["AG.LND.AGRI.ZS", "AG.CON.FERT.ZS", "NV.AGR.TOTL.ZS", "SL.AGR.EMPL.ZS"])
        .describe("World Bank indicator codes. Key agricultural ones: AG.LND.AGRI.ZS (agricultural land %), AG.CON.FERT.ZS (fertilizer kg/ha), NV.AGR.TOTL.ZS (agriculture % of GDP), SL.AGR.EMPL.ZS (agricultural employment %)"),
      year_start: z.number().int().min(1960).optional().describe("Start year (default: 2000)"),
      year_end: z.number().int().optional().describe("End year (default: current year)"),
    },
    async (params) => formatToolHandler(() => worldbank.getIndicators(params)),
  );
}
