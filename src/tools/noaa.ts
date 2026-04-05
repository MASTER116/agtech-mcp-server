import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as noaa from "../providers/noaa.js";
import { formatToolHandler } from "../lib/format.js";

export function registerNoaaTools(server: McpServer, token: string): void {
  server.tool(
    "get_historical_climate",
    "Get historical climate observations from NOAA Climate Data Online — daily/monthly station data since 1763. Requires NOAA token.",
    {
      datasetid: z.enum(["GHCND", "GSOM", "GSOY"]).default("GHCND").describe("Dataset: GHCND (daily), GSOM (monthly), GSOY (yearly)"),
      locationid: z.string().optional().describe("Location ID (e.g. ZIP:28801, FIPS:37, CITY:US130001)"),
      stationid: z.string().optional().describe("Station ID (e.g. GHCND:USW00013880)"),
      datatypeid: z.string().optional().describe("Data type (e.g. TMAX, TMIN, PRCP, SNOW)"),
      startdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Start date (YYYY-MM-DD)"),
      enddate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("End date (YYYY-MM-DD)"),
      limit: z.number().int().min(1).max(1000).optional().describe("Max records (default 1000)"),
    },
    async (params) => formatToolHandler(() => noaa.getData(token, params)),
  );
}
