import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as plantnet from "../providers/plantnet.js";
import { formatToolHandler } from "../lib/format.js";

export function registerPlantNetTools(server: McpServer, apiKey: string): void {
  server.tool(
    "identify_plant",
    "Identify a plant species from an image URL using Pl@ntNet AI (78,123 species). Returns top matches with confidence scores. Requires Pl@ntNet API key.",
    {
      image_url: z.string().url().describe("URL of the plant image to identify"),
      organs: z.array(z.enum(["auto", "flower", "leaf", "fruit", "bark", "habit"]))
        .default(["auto"])
        .describe("Plant organ in the image"),
      project: z.string().default("all").describe("Flora project (all, weurope, namerica, etc.)"),
      lang: z.string().default("en").describe("Language for common names (en, ru, fr, etc.)"),
    },
    async (params) => formatToolHandler(() => plantnet.identifyPlant(apiKey, params)),
  );
}
