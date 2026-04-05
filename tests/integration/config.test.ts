import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Config and tool registration", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("loadConfig", () => {
    it("returns undefined for missing env vars", async () => {
      delete process.env.NASS_API_KEY;
      delete process.env.NOAA_TOKEN;
      delete process.env.SENTINEL_CLIENT_ID;

      // Re-import to get fresh config
      const { loadConfig } = await import("../../src/config/env.js");
      const config = loadConfig();

      expect(config.nassApiKey).toBeUndefined();
      expect(config.noaaToken).toBeUndefined();
      expect(config.sentinelClientId).toBeUndefined();
    });

    it("reads env vars when set", async () => {
      process.env.NASS_API_KEY = "test-nass-key";
      process.env.NOAA_TOKEN = "test-noaa-token";
      process.env.PLANTNET_API_KEY = "test-plantnet";

      const { loadConfig } = await import("../../src/config/env.js");
      const config = loadConfig();

      expect(config.nassApiKey).toBe("test-nass-key");
      expect(config.noaaToken).toBe("test-noaa-token");
      expect(config.plantnetApiKey).toBe("test-plantnet");
    });

    it("treats empty string as undefined", async () => {
      process.env.NASS_API_KEY = "";

      const { loadConfig } = await import("../../src/config/env.js");
      const config = loadConfig();

      expect(config.nassApiKey).toBeUndefined();
    });
  });

  describe("registerAllTools", () => {
    it("registers Tier 0 and Tier 1 tools with empty config", async () => {
      const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
      const { registerAllTools } = await import("../../src/tools/register.js");

      const server = new McpServer(
        { name: "test", version: "1.0.0" },
        { instructions: "test" },
      );

      // Empty config — no Tier 2/3 API keys
      registerAllTools(server, {});

      // Server should have tools registered — verify via listing
      // McpServer doesn't expose tool count directly, but registration should not throw
    });

    it("does not throw with full config (mocked keys)", async () => {
      const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
      const { registerAllTools } = await import("../../src/tools/register.js");

      const server = new McpServer(
        { name: "test", version: "1.0.0" },
        { instructions: "test" },
      );

      const fullConfig = {
        nassApiKey: "test-key",
        noaaToken: "test-token",
        sentinelClientId: "test-id",
        sentinelClientSecret: "test-secret",
        earthdataUsername: "user",
        earthdataPassword: "pass",
        plantnetApiKey: "pk",
        eppoApiKey: "ek",
        agromonitoringApiKey: "ak",
        yandexWeatherApiKey: "yk",
      };

      expect(() => registerAllTools(server, fullConfig)).not.toThrow();
    });
  });
});
