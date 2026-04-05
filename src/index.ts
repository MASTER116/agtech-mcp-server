#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { registerAllTools } from "./tools/register.js";
import { loadConfig } from "./config/env.js";

const config = loadConfig();
const PORT = parseInt(process.env.PORT ?? "3000", 10);
const TRANSPORT = process.env.TRANSPORT ?? (process.env.PORT ? "http" : "stdio");

function createMcpServer() {
  const server = new McpServer(
    { name: "agtech-mcp-server", version: "1.0.0" },
    {
      instructions: "Agricultural data integration server providing 30 tools for weather forecasts, soil analysis, satellite imagery (NDVI/EVI), crop statistics, plant identification, and pest databases. Smart region-based routing: local APIs (priority 10) override international (priority 5) with automatic fallback. Tier 1 tools work without API keys.",
    },
  );
  registerAllTools(server, config);
  return server;
}

if (TRANSPORT === "http") {
  // HTTP/SSE mode — for cloud deployment and Smithery
  const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: McpServer }>();

  const httpServer = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, mcp-session-id");
    res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health check
    if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", transport: "http", tools: 30 }));
      return;
    }

    if (url.pathname !== "/mcp") {
      res.writeHead(404);
      res.end("Not found. Use /mcp for MCP protocol or /health for status.");
      return;
    }

    // Parse session ID from header
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (req.method === "POST") {
      // Read body
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = JSON.parse(Buffer.concat(chunks).toString());

      if (!sessionId) {
        // New session — initialize
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid) => {
            sessions.set(sid, { transport, server: mcpServer });
          },
        });
        const mcpServer = createMcpServer();
        await mcpServer.connect(transport);
        await transport.handleRequest(req, res, body);
      } else {
        const session = sessions.get(sessionId);
        if (!session) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid session" }));
          return;
        }
        await session.transport.handleRequest(req, res, body);
      }
    } else if (req.method === "GET") {
      if (!sessionId || !sessions.has(sessionId)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Session required for GET (SSE stream)" }));
        return;
      }
      await sessions.get(sessionId)!.transport.handleRequest(req, res);
    } else if (req.method === "DELETE") {
      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        await session.transport.handleRequest(req, res);
        await session.server.close();
        sessions.delete(sessionId);
      } else {
        res.writeHead(204);
        res.end();
      }
    } else {
      res.writeHead(405);
      res.end("Method not allowed");
    }
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.error(`AgTech MCP Server (HTTP) listening on http://0.0.0.0:${PORT}/mcp`);
  });
} else {
  // stdio mode — for local MCP clients (Claude Desktop, Claude Code)
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
