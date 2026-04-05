import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as appeears from "../providers/appeears.js";
import { formatToolHandler } from "../lib/format.js";

export function registerAppEEARSTools(server: McpServer, username: string, password: string): void {
  server.tool(
    "get_modis_ndvi",
    "Submit a MODIS NDVI extraction task to NASA AppEEARS. Returns a task ID — use check_appeears_task to get results when ready. Requires NASA Earthdata credentials.",
    {
      latitude: z.number().min(-90).max(90).describe("Latitude"),
      longitude: z.number().min(-180).max(180).describe("Longitude"),
      start_date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/).describe("Start date (MM-DD-YYYY)"),
      end_date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/).describe("End date (MM-DD-YYYY)"),
      task_name: z.string().default("modis_ndvi").describe("Task name"),
      product: z.string().default("MOD13Q1.061").describe("MODIS product ID"),
      layer: z.string().default("_250m_16_days_NDVI").describe("Product layer"),
    },
    async (params) => formatToolHandler(() => appeears.submitTask(username, password, params)),
  );

  server.tool(
    "check_appeears_task",
    "Check status of a NASA AppEEARS task and get download links when complete. Requires NASA Earthdata credentials.",
    {
      task_id: z.string().describe("Task ID from get_modis_ndvi"),
    },
    async (params) => formatToolHandler(async () => {
      const status = await appeears.getTaskStatus(username, password, params.task_id);
      if (status.status === "done") {
        const bundle = await appeears.getTaskBundle(username, password, params.task_id);
        return { ...status, files: bundle.files };
      }
      return status;
    }),
  );
}
