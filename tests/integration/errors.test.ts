import { describe, it, expect } from "vitest";
import { ApiError, RateLimitError, ValidationError, ConfigError } from "../../src/lib/errors.js";

describe("Error classes", () => {
  describe("ApiError", () => {
    it("stores status, url, and body", () => {
      const err = new ApiError(404, "https://api.example.com/data", "Not found");
      expect(err.status).toBe(404);
      expect(err.url).toBe("https://api.example.com/data");
      expect(err.body).toBe("Not found");
      expect(err.name).toBe("ApiError");
      expect(err.message).toContain("404");
      expect(err.message).toContain("https://api.example.com/data");
    });

    it("truncates body in message to 200 chars", () => {
      const longBody = "x".repeat(300);
      const err = new ApiError(500, "http://a.com", longBody);
      expect(err.message.length).toBeLessThan(300);
      expect(err.body).toBe(longBody); // full body preserved in property
    });

    it("is an instance of Error", () => {
      const err = new ApiError(500, "url", "body");
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe("RateLimitError", () => {
    it("has status 429 and retryAfterMs", () => {
      const err = new RateLimitError("https://api.example.com", 5000);
      expect(err.status).toBe(429);
      expect(err.retryAfterMs).toBe(5000);
      expect(err.name).toBe("RateLimitError");
    });

    it("extends ApiError", () => {
      const err = new RateLimitError("url", 1000);
      expect(err).toBeInstanceOf(ApiError);
    });
  });

  describe("ValidationError", () => {
    it("stores field name and message", () => {
      const err = new ValidationError("latitude", "must be between -90 and 90");
      expect(err.field).toBe("latitude");
      expect(err.message).toContain("latitude");
      expect(err.name).toBe("ValidationError");
    });
  });

  describe("ConfigError", () => {
    it("mentions the missing key", () => {
      const err = new ConfigError("NASS_API_KEY");
      expect(err.keyName).toBe("NASS_API_KEY");
      expect(err.message).toContain("NASS_API_KEY");
      expect(err.message).toContain(".env");
      expect(err.name).toBe("ConfigError");
    });
  });
});
