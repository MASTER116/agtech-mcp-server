import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as eppo from "../providers/eppo.js";
import { formatToolHandler } from "../lib/format.js";

export function registerEppoTools(server: McpServer, apiKey: string): void {
  server.tool(
    "search_pest_database",
    "Search the EPPO Global Database for pests, diseases, and quarantine organisms (97,800+ species). Requires EPPO API key.",
    {
      query: z.string().describe("Search term (pest name, scientific name)"),
      type: z.string().optional().describe("Filter by type (pest, disease, weed, etc.)"),
    },
    async (params) => formatToolHandler(() => eppo.searchPests(apiKey, params)),
  );

  server.tool(
    "get_pest_info",
    "Get detailed information about a specific pest/organism from EPPO by its EPPO code. Requires EPPO API key.",
    {
      eppo_code: z.string().describe("EPPO code (e.g. HELIAR for Helicoverpa armigera)"),
    },
    async (params) => formatToolHandler(() => eppo.getPestInfo(apiKey, params.eppo_code)),
  );
}
