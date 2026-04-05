import { describe, it, expect } from "vitest";
import {
  coordinatesSchema,
  dateSchema,
  dateRangeSchema,
  yearRangeSchema,
  countryCodeSchema,
  boundingBoxSchema,
} from "../../src/lib/validators.js";

describe("Zod validators", () => {
  describe("coordinatesSchema", () => {
    it("accepts valid coordinates", () => {
      const result = coordinatesSchema.parse({ latitude: 55.75, longitude: 37.62 });
      expect(result.latitude).toBe(55.75);
      expect(result.longitude).toBe(37.62);
    });

    it("accepts boundary values", () => {
      expect(() => coordinatesSchema.parse({ latitude: -90, longitude: -180 })).not.toThrow();
      expect(() => coordinatesSchema.parse({ latitude: 90, longitude: 180 })).not.toThrow();
    });

    it("rejects out-of-range latitude", () => {
      expect(() => coordinatesSchema.parse({ latitude: 91, longitude: 0 })).toThrow();
      expect(() => coordinatesSchema.parse({ latitude: -91, longitude: 0 })).toThrow();
    });

    it("rejects out-of-range longitude", () => {
      expect(() => coordinatesSchema.parse({ latitude: 0, longitude: 181 })).toThrow();
      expect(() => coordinatesSchema.parse({ latitude: 0, longitude: -181 })).toThrow();
    });

    it("rejects missing fields", () => {
      expect(() => coordinatesSchema.parse({ latitude: 55 })).toThrow();
      expect(() => coordinatesSchema.parse({})).toThrow();
    });
  });

  describe("dateSchema", () => {
    it("accepts YYYY-MM-DD format", () => {
      expect(dateSchema.parse("2024-06-15")).toBe("2024-06-15");
    });

    it("rejects invalid formats", () => {
      expect(() => dateSchema.parse("06-15-2024")).toThrow();
      expect(() => dateSchema.parse("2024/06/15")).toThrow();
      expect(() => dateSchema.parse("not-a-date")).toThrow();
    });
  });

  describe("dateRangeSchema", () => {
    it("accepts valid date range", () => {
      const result = dateRangeSchema.parse({
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      });
      expect(result.start_date).toBe("2024-01-01");
      expect(result.end_date).toBe("2024-12-31");
    });

    it("rejects invalid dates in range", () => {
      expect(() =>
        dateRangeSchema.parse({ start_date: "bad", end_date: "2024-01-01" }),
      ).toThrow();
    });
  });

  describe("yearRangeSchema", () => {
    it("accepts valid year range", () => {
      const result = yearRangeSchema.parse({ year_start: 2000, year_end: 2024 });
      expect(result.year_start).toBe(2000);
    });

    it("rejects years outside 1900-2100", () => {
      expect(() => yearRangeSchema.parse({ year_start: 1800, year_end: 2024 })).toThrow();
      expect(() => yearRangeSchema.parse({ year_start: 2000, year_end: 2200 })).toThrow();
    });

    it("rejects non-integer years", () => {
      expect(() => yearRangeSchema.parse({ year_start: 2000.5, year_end: 2024 })).toThrow();
    });
  });

  describe("countryCodeSchema", () => {
    it("accepts 3-letter codes", () => {
      expect(countryCodeSchema.parse("RUS")).toBe("RUS");
      expect(countryCodeSchema.parse("USA")).toBe("USA");
    });

    it("rejects wrong-length codes", () => {
      expect(() => countryCodeSchema.parse("US")).toThrow();
      expect(() => countryCodeSchema.parse("USAA")).toThrow();
    });
  });

  describe("boundingBoxSchema", () => {
    it("accepts valid bounding box", () => {
      const result = boundingBoxSchema.parse({
        min_lat: 40, max_lat: 42,
        min_lon: -74, max_lon: -72,
      });
      expect(result.min_lat).toBe(40);
    });

    it("rejects out-of-range values", () => {
      expect(() =>
        boundingBoxSchema.parse({ min_lat: -91, max_lat: 42, min_lon: -74, max_lon: -72 }),
      ).toThrow();
    });
  });
});
