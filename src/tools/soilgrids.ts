import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as soilgrids from "../providers/soilgrids.js";
import { formatToolHandler } from "../lib/format.js";

export function registerSoilGridsTools(server: McpServer): void {
  server.tool(
    "get_soil_properties",
    "Get soil physical and chemical properties (pH, texture, organic carbon, nitrogen, bulk density, CEC, water content) at any global coordinates. Resolution 250m. Uses ISRIC SoilGrids API, no API key required.",
    {
      latitude: z.number().min(-90).max(90).describe("Latitude (-90 to 90)"),
      longitude: z.number().min(-180).max(180).describe("Longitude (-180 to 180)"),
      properties: z.array(z.enum(["phh2o", "soc", "clay", "sand", "silt", "nitrogen", "bdod", "cec", "wv0010", "wv0033", "wv1500"]))
        .default(["phh2o", "clay", "sand", "silt", "soc", "nitrogen"])
        .describe("Soil properties to query"),
      depths: z.array(z.enum(["0-5cm", "5-15cm", "15-30cm", "30-60cm", "60-100cm", "100-200cm"]))
        .default(["0-5cm", "5-15cm", "15-30cm", "30-60cm"])
        .describe("Depth intervals"),
    },
    async (params) => formatToolHandler(() => soilgrids.getProperties(params)),
  );

  server.tool(
    "get_soil_classification",
    "Get WRB (World Reference Base) soil classification at given coordinates. Uses ISRIC SoilGrids API, no API key required.",
    {
      latitude: z.number().min(-90).max(90).describe("Latitude (-90 to 90)"),
      longitude: z.number().min(-180).max(180).describe("Longitude (-180 to 180)"),
      number_classes: z.number().int().min(1).max(10).optional().describe("Number of top probable classes to return"),
    },
    async (params) => formatToolHandler(() => soilgrids.getClassification(params)),
  );
}
