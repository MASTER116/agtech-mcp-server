import { describe, it, expect } from "vitest";
import { resolveRegion, getRegionName, validateGeoPoint } from "../../src/core/geo-resolver.js";

describe("geo-resolver", () => {
  describe("resolveRegion", () => {
    it("resolves Moscow to EU (EU bounds checked before RU, Moscow lon=37.62 is within EU lon range)", () => {
      // Moscow falls within EU bounds (lat 35-72, lon -11 to 40) which is checked before RU
      expect(resolveRegion(55.75, 37.62)).toBe("EU");
    });

    it("resolves Novosibirsk to RU (lon 82.9 is outside EU range)", () => {
      expect(resolveRegion(55.03, 82.93)).toBe("RU");
    });

    it("resolves Iowa to US", () => {
      expect(resolveRegion(41.9, -93.6)).toBe("US");
    });

    it("resolves Berlin to EU", () => {
      expect(resolveRegion(52.52, 13.41)).toBe("EU");
    });

    it("resolves Beijing to CN", () => {
      expect(resolveRegion(39.9, 116.4)).toBe("CN");
    });

    it("resolves São Paulo to BR", () => {
      expect(resolveRegion(-23.55, -46.63)).toBe("BR");
    });

    it("resolves Mumbai to IN", () => {
      expect(resolveRegion(19.08, 72.88)).toBe("IN");
    });

    it("resolves Antarctica to GLOBAL", () => {
      expect(resolveRegion(-80, 0)).toBe("GLOBAL");
    });

    it("resolves middle of Pacific to GLOBAL", () => {
      expect(resolveRegion(0, -150)).toBe("GLOBAL");
    });

    it("resolves Australia to GLOBAL (no specific region)", () => {
      expect(resolveRegion(-25.27, 133.78)).toBe("GLOBAL");
    });

    // Boundary cases
    it("US boundary: lat=24.5, lon=-125", () => {
      expect(resolveRegion(24.5, -125)).toBe("US");
    });

    it("US boundary: lat=49.5, lon=-66.5", () => {
      expect(resolveRegion(49.5, -66.5)).toBe("US");
    });
  });

  describe("getRegionName", () => {
    it("returns 'Russia' for RU", () => {
      expect(getRegionName("RU")).toBe("Russia");
    });

    it("returns 'United States' for US", () => {
      expect(getRegionName("US")).toBe("United States");
    });

    it("returns 'Global' for GLOBAL", () => {
      expect(getRegionName("GLOBAL")).toBe("Global");
    });
  });

  describe("validateGeoPoint", () => {
    it("returns null for valid point", () => {
      expect(validateGeoPoint(55.75, 37.62)).toBeNull();
    });

    it("returns null for boundary values", () => {
      expect(validateGeoPoint(-90, -180)).toBeNull();
      expect(validateGeoPoint(90, 180)).toBeNull();
    });

    it("returns error for latitude > 90", () => {
      expect(validateGeoPoint(91, 0)).toContain("Latitude");
    });

    it("returns error for latitude < -90", () => {
      expect(validateGeoPoint(-91, 0)).toContain("Latitude");
    });

    it("returns error for longitude > 180", () => {
      expect(validateGeoPoint(0, 181)).toContain("Longitude");
    });

    it("returns error for longitude < -180", () => {
      expect(validateGeoPoint(0, -181)).toContain("Longitude");
    });
  });
});
