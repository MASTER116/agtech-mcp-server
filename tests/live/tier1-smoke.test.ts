import { describe, it, expect } from "vitest";
import * as openMeteo from "../../src/providers/open-meteo.js";
import * as soilgrids from "../../src/providers/soilgrids.js";
import * as worldbank from "../../src/providers/worldbank.js";
import * as cropscape from "../../src/providers/cropscape.js";
import { ApiError } from "../../src/lib/errors.js";

describe("Tier 1 Live API Smoke Tests", () => {
  it("Open-Meteo: weather forecast for Moscow", async () => {
    const result = await openMeteo.getForecast({
      latitude: 55.75,
      longitude: 37.62,
      preset: "agro",
      forecast_days: 3,
    });

    expect(result.latitude).toBeCloseTo(55.75, 0);
    expect(result.longitude).toBeCloseTo(37.62, 0);
    expect(result.hourly).toBeDefined();
    expect(result.hourly!.time.length).toBeGreaterThan(0);
    expect(result.hourly!.soil_temperature_6cm).toBeDefined();
    expect(typeof (result.hourly!.soil_temperature_6cm as number[])[0]).toBe("number");
  });

  it("Open-Meteo: historical weather for Moscow (June 2024)", async () => {
    const result = await openMeteo.getHistorical({
      latitude: 55.75,
      longitude: 37.62,
      start_date: "2024-06-01",
      end_date: "2024-06-07",
      preset: "standard",
    });

    expect(result.hourly).toBeDefined();
    expect(result.hourly!.time.length).toBeGreaterThanOrEqual(7 * 24);
  });

  it("SoilGrids: soil properties for Krasnodar", async () => {
    try {
      const result = await soilgrids.getProperties({
        latitude: 45.04,
        longitude: 38.98,
        properties: ["phh2o", "clay"],
        depths: ["0-5cm", "5-15cm"],
      });

      expect(result.properties).toBeDefined();
      expect(result.properties.layers).toBeDefined();
      expect(result.properties.layers.length).toBeGreaterThan(0);
    } catch (e) {
      // SoilGrids API is in beta and may be temporarily unavailable
      if (e instanceof ApiError && (e.status === 503 || e.status === 502)) {
        console.warn("SoilGrids API temporarily unavailable (503), skipping test");
        return;
      }
      throw e;
    }
  });

  it("SoilGrids: soil classification for Krasnodar", async () => {
    try {
      const result = await soilgrids.getClassification({
        latitude: 45.04,
        longitude: 38.98,
      });

      expect(result.properties).toBeDefined();
      expect(result.properties.most_probable).toBeTruthy();
    } catch (e) {
      if (e instanceof ApiError && (e.status === 503 || e.status === 502)) {
        console.warn("SoilGrids API temporarily unavailable (503), skipping test");
        return;
      }
      throw e;
    }
  });

  it("World Bank: agricultural indicators for Russia", async () => {
    const result = await worldbank.getIndicators({
      country_code: "RUS",
      indicators: ["AG.LND.AGRI.ZS"],
      year_start: 2018,
      year_end: 2022,
    });

    expect(result.length).toBeGreaterThan(0);
    const withValue = result.find(r => r.value !== null);
    expect(withValue).toBeDefined();
    expect(withValue!.value).toBeGreaterThan(10);
    expect(withValue!.value).toBeLessThan(90);
  });

  it("CropScape: crop type in Iowa", async () => {
    try {
      const result = await cropscape.getCropType({
        latitude: 41.9,
        longitude: -93.6,
        year: 2022,
      });

      expect(result.category).toBeTruthy();
      expect(result.category).not.toBe("Unknown");
    } catch (e) {
      // CropScape service can be unreliable
      if (e instanceof ApiError && e.status >= 500) {
        console.warn(`CropScape API error (${e.status}), skipping test`);
        return;
      }
      throw e;
    }
  });
});
