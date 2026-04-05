import { describe, it, expect } from "vitest";
import { toolResult, toolError, formatToolHandler } from "../../src/lib/format.js";

describe("Format utilities", () => {
  describe("toolResult", () => {
    it("serializes object to JSON text", () => {
      const result = toolResult({ temp: 22, unit: "C" });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.temp).toBe(22);
    });

    it("passes string as-is", () => {
      const result = toolResult("plain text");
      expect(result.content[0].text).toBe("plain text");
    });

    it("does not set isError", () => {
      const result = toolResult("ok");
      expect((result as any).isError).toBeUndefined();
    });
  });

  describe("toolError", () => {
    it("returns error-flagged content", () => {
      const result = toolError("something broke");
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("something broke");
    });
  });

  describe("formatToolHandler", () => {
    it("wraps successful promise in toolResult", async () => {
      const result = await formatToolHandler(async () => ({ ok: true }));
      expect(result.content[0].type).toBe("text");
      expect(JSON.parse(result.content[0].text)).toEqual({ ok: true });
      expect((result as any).isError).toBeUndefined();
    });

    it("wraps rejected promise in toolError", async () => {
      const result = await formatToolHandler(async () => {
        throw new Error("fail");
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("fail");
    });

    it("handles non-Error throws", async () => {
      const result = await formatToolHandler(async () => {
        throw "string error";
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("string error");
    });
  });
});
