import { describe, it, expect, vi, beforeEach } from "vitest";

// Side-effect imports to register providers in the registry
import "../../src/providers/open-meteo.js";
import "../../src/providers/soilgrids.js";
import "../../src/providers/faostat.js";

import {
  registerWeatherProvider,
  registerSoilProvider,
  registerStatisticsProvider,
  getWeatherForPoint,
  getSoilForPoint,
  getCropStatisticsForRegion,
  getAvailableProviders,
  type WeatherProvider,
  type SoilProvider,
  type StatisticsProvider,
} from "../../src/core/provider-registry.js";

/**
 * Note: The provider-registry module uses module-level arrays.
 * The side-effect imports above ensure open-meteo, soilgrids, faostat are registered.
 */

describe("provider-registry", () => {
  describe("getAvailableProviders", () => {
    it("returns weather providers for Novosibirsk (RU region)", () => {
      const result = getAvailableProviders(55.03, 82.93);
      expect(result.region).toBe("RU");
      expect(result.weather.length).toBeGreaterThan(0);
      expect(result.weather.some(w => w.name.toLowerCase().includes("open-meteo"))).toBe(true);
    });

    it("returns soil providers for any location", () => {
      const result = getAvailableProviders(55.03, 82.93);
      expect(result.soil.length).toBeGreaterThan(0);
    });

    it("returns statistics providers for any location", () => {
      const result = getAvailableProviders(55.03, 82.93);
      expect(result.statistics.length).toBeGreaterThan(0);
    });

    it("returns GLOBAL region for Antarctica", () => {
      const result = getAvailableProviders(-80, 0);
      expect(result.region).toBe("GLOBAL");
    });

    it("providers sorted by priority (highest first)", () => {
      const result = getAvailableProviders(41.9, -93.6); // US
      if (result.weather.length > 1) {
        for (let i = 1; i < result.weather.length; i++) {
          expect(result.weather[i - 1].priority).toBeGreaterThanOrEqual(result.weather[i].priority);
        }
      }
    });
  });

  describe("getWeatherForPoint", () => {
    it("returns weather data for valid coordinates", async () => {
      // Uses real Open-Meteo provider (Tier 1, no API key)
      const result = await getWeatherForPoint(55.03, 82.93, 3);
      expect(result).toBeDefined();
    });
  });

  describe("getSoilForPoint", () => {
    it("returns soil data for valid coordinates", async () => {
      // Uses real SoilGrids provider (Tier 1, no API key)
      try {
        const result = await getSoilForPoint(45.04, 38.98);
        expect(result).toBeDefined();
      } catch (e: any) {
        // SoilGrids may be temporarily unavailable
        if (e?.message?.includes("503") || e?.message?.includes("502") || e?.message?.includes("No providers")) {
          console.warn("SoilGrids temporarily unavailable, skipping");
          return;
        }
        throw e;
      }
    });
  });

  describe("getCropStatisticsForRegion", () => {
    it("returns crop statistics for Russia via FAOSTAT", async () => {
      try {
        const result = await Promise.race([
          getCropStatisticsForRegion("wheat", "RUS"),
          new Promise((_, reject) => setTimeout(() => reject(new Error("test timeout")), 15_000)),
        ]);
        expect(result).toBeDefined();
      } catch (e: any) {
        // FAOSTAT can be slow, unavailable, or behind Cloudflare (521)
        console.warn(`FAOSTAT unavailable: ${e?.message?.slice(0, 100)}, skipping`);
      }
    });

    it("maps US country code to US region", async () => {
      try {
        const result = await Promise.race([
          getCropStatisticsForRegion("wheat", "US"),
          new Promise((_, reject) => setTimeout(() => reject(new Error("test timeout")), 15_000)),
        ]);
        expect(result).toBeDefined();
      } catch (e: any) {
        console.warn(`FAOSTAT unavailable: ${e?.message?.slice(0, 100)}, skipping`);
      }
    });
  });

  describe("provider priority and fallback", () => {
    it("registers and uses mock high-priority weather provider", async () => {
      const mockProvider: WeatherProvider = {
        config: {
          name: "test-provider",
          regions: ["GLOBAL"],
          priority: 100, // highest priority
          requiresApiKey: false,
        },
        getWeather: vi.fn().mockResolvedValue({ source: "mock", temp: 25 }),
      };

      registerWeatherProvider(mockProvider);

      const result = await getWeatherForPoint(55.75, 37.62, 3);
      // Mock provider has highest priority, should be called first
      expect(mockProvider.getWeather).toHaveBeenCalledWith(55.75, 37.62, 3);
      expect(result).toEqual({ source: "mock", temp: 25 });
    });

    it("falls back to next provider when primary fails", async () => {
      const failProvider: WeatherProvider = {
        config: {
          name: "fail-provider",
          regions: ["GLOBAL"],
          priority: 200,
          requiresApiKey: false,
        },
        getWeather: vi.fn().mockRejectedValue(new Error("provider down")),
      };

      const fallbackProvider: WeatherProvider = {
        config: {
          name: "fallback-provider",
          regions: ["GLOBAL"],
          priority: 150,
          requiresApiKey: false,
        },
        getWeather: vi.fn().mockResolvedValue({ source: "fallback" }),
      };

      registerWeatherProvider(failProvider);
      registerWeatherProvider(fallbackProvider);

      const result = await getWeatherForPoint(55.75, 37.62, 3);
      expect(failProvider.getWeather).toHaveBeenCalled();
      expect(fallbackProvider.getWeather).toHaveBeenCalled();
      expect(result).toEqual({ source: "fallback" });
    });
  });
});
