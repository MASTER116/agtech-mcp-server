#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/register.js";
import { loadConfig } from "./config/env.js";

const config = loadConfig();

const server = new McpServer(
  {
    name: "agtech-mcp-server",
    version: "1.0.0",
  },
  {
    instructions: "Agricultural data integration server providing 25+ tools for weather forecasts, soil analysis, satellite imagery (NDVI/EVI), crop statistics, plant identification, and pest databases. Tier 1 tools (weather, soil, statistics) work without API keys. Tier 2/3 tools require configuration — check available tools with tools/list.",
  },
);

registerAllTools(server, config);

const transport = new StdioServerTransport();
await server.connect(transport);
