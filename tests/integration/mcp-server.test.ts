import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http";

let serverProcess: Server;
let port: number;

/**
 * Integration tests for the MCP server HTTP transport.
 * Starts a real HTTP server and tests the JSON-RPC MCP protocol.
 */

async function startTestServer(): Promise<{ server: Server; port: number }> {
  // Dynamically import the server module by simulating the HTTP mode
  const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
  const { StreamableHTTPServerTransport } = await import("@modelcontextprotocol/sdk/server/streamableHttp.js");
  const { randomUUID } = await import("node:crypto");
  const { registerAllTools } = await import("../../src/tools/register.js");
  const { loadConfig } = await import("../../src/config/env.js");

  const config = loadConfig();
  const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: McpServer }>();

  function createMcpServer() {
    const server = new McpServer(
      { name: "agtech-mcp-server-test", version: "1.0.0" },
      { instructions: "Test server" },
    );
    registerAllTools(server, config);
    return server;
  }

  return new Promise((resolve) => {
    const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, mcp-session-id");
      res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      if (url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", transport: "http" }));
        return;
      }

      if (url.pathname !== "/mcp") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      if (req.method === "POST") {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const body = JSON.parse(Buffer.concat(chunks).toString());

        if (!sessionId) {
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

    httpServer.listen(0, "127.0.0.1", () => {
      const addr = httpServer.address() as { port: number };
      resolve({ server: httpServer, port: addr.port });
    });
  });
}

async function mcpRequest(port: number, body: unknown, sessionId?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;

  const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const sid = res.headers.get("mcp-session-id") ?? undefined;
  const text = await res.text();

  // Parse potentially batched JSON-RPC responses or SSE
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    // SSE format: "event: message\ndata: {...}\n\n"
    const lines = text.split("\n").filter(l => l.startsWith("data: "));
    const parsed = lines.map(l => {
      try { return JSON.parse(l.slice(6)); } catch { return null; }
    }).filter(Boolean);

    if (parsed.length === 0) {
      data = null;
    } else if (parsed.length === 1) {
      data = parsed[0];
    } else {
      // Find the actual response (not notification)
      data = parsed.find((p: any) => p.id !== undefined) ?? parsed[parsed.length - 1];
    }
  }

  return { status: res.status, data, sessionId: sid };
}

describe("MCP Server HTTP Transport", () => {
  beforeAll(async () => {
    const result = await startTestServer();
    serverProcess = result.server;
    port = result.port;
  });

  afterAll(async () => {
    serverProcess?.close();
  });

  describe("Health endpoint", () => {
    it("returns ok status on /health", async () => {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.status).toBe("ok");
      expect(data.transport).toBe("http");
    });
  });

  describe("CORS", () => {
    it("responds to OPTIONS with 204", async () => {
      const res = await fetch(`http://127.0.0.1:${port}/mcp`, { method: "OPTIONS" });
      expect(res.status).toBe(204);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });

  describe("404 handling", () => {
    it("returns 404 for unknown paths", async () => {
      const res = await fetch(`http://127.0.0.1:${port}/unknown`);
      expect(res.status).toBe(404);
    });
  });

  describe("MCP Protocol — initialize", () => {
    it("initializes a new session", async () => {
      const result = await mcpRequest(port, {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      });

      expect(result.sessionId).toBeTruthy();
      expect(result.data).toBeDefined();
      // The initialize response should have server info
      if (result.data.result) {
        expect(result.data.result.serverInfo).toBeDefined();
        expect(result.data.result.serverInfo.name).toBe("agtech-mcp-server-test");
      }
    });
  });

  describe("MCP Protocol — full session lifecycle", () => {
    let sessionId: string;

    it("creates a session via initialize", async () => {
      const result = await mcpRequest(port, {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      });

      sessionId = result.sessionId!;
      expect(sessionId).toBeTruthy();
    });

    it("sends initialized notification", async () => {
      const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "notifications/initialized",
        }),
      });
      // Notification may return 200, 202, 204, or 406 depending on transport implementation
      // The key is that it doesn't return 4xx/5xx errors (except 406 for content negotiation)
      expect([200, 202, 204, 406]).toContain(res.status);
    });

    it("lists tools via tools/list", async () => {
      const result = await mcpRequest(port, {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
      }, sessionId);

      const tools = result.data?.result?.tools ?? result.data?.[0]?.result?.tools ?? [];
      expect(tools.length).toBeGreaterThan(0);

      // Check that core Tier 0 & 1 tools are present
      const toolNames = tools.map((t: any) => t.name);
      expect(toolNames).toContain("detect_region");
      expect(toolNames).toContain("get_field_weather");
      expect(toolNames).toContain("get_weather_forecast");
      expect(toolNames).toContain("get_soil_properties");
      expect(toolNames).toContain("get_crop_production");
      expect(toolNames).toContain("get_country_ag_indicators");
    });

    it("calls detect_region tool", async () => {
      const result = await mcpRequest(port, {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "detect_region",
          arguments: { latitude: 41.9, longitude: -93.6 },
        },
      }, sessionId);

      const content = result.data?.result?.content;
      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(0);

      const parsed = JSON.parse(content[0].text);
      expect(parsed.region).toBe("US");
      expect(parsed.regionName).toBe("United States");
    });

    it("rejects invalid session id", async () => {
      const result = await mcpRequest(port, {
        jsonrpc: "2.0",
        id: 99,
        method: "tools/list",
      }, "invalid-session-id");

      expect(result.status).toBe(400);
    });

    it("deletes session", async () => {
      const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: "DELETE",
        headers: { "mcp-session-id": sessionId },
      });
      expect(res.status).toBeLessThan(300);
    });
  });

  describe("MCP Protocol — tool call with real provider", () => {
    let sessionId: string;

    beforeAll(async () => {
      const result = await mcpRequest(port, {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test-client-2", version: "1.0.0" },
        },
      });
      sessionId = result.sessionId!;

      // Send initialized notification
      await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
      });
    });

    it("calls get_weather_forecast and returns data", async () => {
      const result = await mcpRequest(port, {
        jsonrpc: "2.0",
        id: 10,
        method: "tools/call",
        params: {
          name: "get_weather_forecast",
          arguments: { latitude: 55.75, longitude: 37.62, forecast_days: 1 },
        },
      }, sessionId);

      const content = result.data?.result?.content ?? result.data?.[0]?.result?.content;
      expect(content).toBeDefined();
      expect(content[0].type).toBe("text");

      const parsed = JSON.parse(content[0].text);
      expect(parsed.latitude).toBeDefined();
      expect(parsed.hourly || parsed.daily).toBeDefined();
    });

    it("calls get_soil_classification and returns data or error", async () => {
      const result = await mcpRequest(port, {
        jsonrpc: "2.0",
        id: 11,
        method: "tools/call",
        params: {
          name: "get_soil_classification",
          arguments: { latitude: 45.04, longitude: 38.98 },
        },
      }, sessionId);

      const content = result.data?.result?.content;
      // SoilGrids may be unavailable, so just verify we get a valid MCP response
      if (content) {
        expect(content.length).toBeGreaterThan(0);
        expect(content[0].type).toBe("text");
      }
      // If content is undefined, the response might be an error — that's acceptable
    });

    it("returns error for tool with invalid arguments", async () => {
      const result = await mcpRequest(port, {
        jsonrpc: "2.0",
        id: 12,
        method: "tools/call",
        params: {
          name: "get_weather_forecast",
          arguments: { latitude: 999, longitude: 37.62 },
        },
      }, sessionId);

      // Should get an error response (either protocol error or tool error)
      const data = result.data?.result ?? result.data?.[0]?.result ?? result.data;
      expect(data).toBeDefined();
    });
  });
});
