import type { RegionCode } from "./geo-resolver.js";
import { resolveRegion } from "./geo-resolver.js";

/**
 * Provider configuration with region support and priority.
 * Higher priority = preferred for a given region.
 * Local providers (priority 10) override international (priority 5).
 */
export interface ProviderConfig {
  name: string;
  regions: RegionCode[];
  priority: number;
  requiresApiKey: boolean;
  apiKeyEnvVar?: string;
}

export interface WeatherProvider {
  config: ProviderConfig;
  getWeather(latitude: number, longitude: number, days?: number): Promise<unknown>;
  getAgroMetrics?(latitude: number, longitude: number): Promise<unknown>;
}

export interface SoilProvider {
  config: ProviderConfig;
  getSoilProperties(latitude: number, longitude: number, properties?: string[], depths?: string[]): Promise<unknown>;
}

export interface StatisticsProvider {
  config: ProviderConfig;
  getCropStats(commodity: string, countryCode: string, yearStart?: number, yearEnd?: number): Promise<unknown>;
}

export interface SatelliteProvider {
  config: ProviderConfig;
  getNdvi(bbox: [number, number, number, number], startDate: string, endDate: string): Promise<unknown>;
}

export interface PlantIdProvider {
  config: ProviderConfig;
  identify(imageUrl: string, organs?: string[]): Promise<unknown>;
}

export interface PestProvider {
  config: ProviderConfig;
  search(query: string): Promise<unknown>;
  getInfo(code: string): Promise<unknown>;
}

/**
 * Selects providers matching a region, sorted by priority (highest first).
 * Returns all matching providers for fallback.
 */
function selectProviders<T extends { config: ProviderConfig }>(
  providers: T[],
  region: RegionCode,
): T[] {
  return providers
    .filter(p => p.config.regions.includes(region) || p.config.regions.includes("GLOBAL"))
    .sort((a, b) => b.config.priority - a.config.priority);
}

/**
 * Tries providers in priority order, falling back to next on failure.
 */
async function tryProviders<T extends { config: ProviderConfig }, R>(
  providers: T[],
  region: RegionCode,
  fn: (provider: T) => Promise<R>,
): Promise<R> {
  const sorted = selectProviders(providers, region);
  if (sorted.length === 0) {
    throw new Error(`No providers available for region: ${region}`);
  }

  let lastError: Error | undefined;
  for (const provider of sorted) {
    try {
      return await fn(provider);
    } catch (e) {
      lastError = e as Error;
      console.error(`Provider ${provider.config.name} failed for region ${region}: ${lastError.message}`);
    }
  }

  throw lastError ?? new Error("All providers failed");
}

// ─── Provider Registries ────────────────────────────────────────

const weatherProviders: WeatherProvider[] = [];
const soilProviders: SoilProvider[] = [];
const statisticsProviders: StatisticsProvider[] = [];
const satelliteProviders: SatelliteProvider[] = [];
const plantIdProviders: PlantIdProvider[] = [];
const pestProviders: PestProvider[] = [];

export function registerWeatherProvider(p: WeatherProvider) { weatherProviders.push(p); }
export function registerSoilProvider(p: SoilProvider) { soilProviders.push(p); }
export function registerStatisticsProvider(p: StatisticsProvider) { statisticsProviders.push(p); }
export function registerSatelliteProvider(p: SatelliteProvider) { satelliteProviders.push(p); }
export function registerPlantIdProvider(p: PlantIdProvider) { plantIdProviders.push(p); }
export function registerPestProvider(p: PestProvider) { pestProviders.push(p); }

// ─── Public API with auto-routing ───────────────────────────────

export async function getWeatherForPoint(latitude: number, longitude: number, days?: number) {
  const region = resolveRegion(latitude, longitude);
  return tryProviders(weatherProviders, region, p => p.getWeather(latitude, longitude, days));
}

export async function getAgroMetricsForPoint(latitude: number, longitude: number) {
  const region = resolveRegion(latitude, longitude);
  return tryProviders(
    weatherProviders.filter(p => p.getAgroMetrics),
    region,
    p => p.getAgroMetrics!(latitude, longitude),
  );
}

export async function getSoilForPoint(latitude: number, longitude: number, properties?: string[], depths?: string[]) {
  const region = resolveRegion(latitude, longitude);
  return tryProviders(soilProviders, region, p => p.getSoilProperties(latitude, longitude, properties, depths));
}

export async function getCropStatisticsForRegion(commodity: string, countryCode: string, yearStart?: number, yearEnd?: number) {
  const regionMap: Record<string, RegionCode> = {
    US: "US", USA: "US",
    RU: "RU", RUS: "RU",
    CN: "CN", CHN: "CN",
    BR: "BR", BRA: "BR",
    IN: "IN", IND: "IN",
    DE: "EU", FR: "EU", IT: "EU", ES: "EU", PL: "EU", UA: "EU",
  };
  const region = regionMap[countryCode.toUpperCase()] ?? "GLOBAL";
  return tryProviders(statisticsProviders, region, p => p.getCropStats(commodity, countryCode, yearStart, yearEnd));
}

export async function getNdviForArea(bbox: [number, number, number, number], startDate: string, endDate: string) {
  const centerLat = (bbox[1] + bbox[3]) / 2;
  const centerLon = (bbox[0] + bbox[2]) / 2;
  const region = resolveRegion(centerLat, centerLon);
  return tryProviders(satelliteProviders, region, p => p.getNdvi(bbox, startDate, endDate));
}

export async function identifyPlantFromImage(imageUrl: string, organs?: string[]) {
  return tryProviders(plantIdProviders, "GLOBAL", p => p.identify(imageUrl, organs));
}

export async function searchPests(query: string) {
  return tryProviders(pestProviders, "GLOBAL", p => p.search(query));
}

/**
 * Returns info about available providers for a given location.
 */
export function getAvailableProviders(latitude: number, longitude: number) {
  const region = resolveRegion(latitude, longitude);
  const available = (label: string, providers: Array<{ config: ProviderConfig }>) =>
    selectProviders(providers, region).map(p => ({
      name: p.config.name,
      priority: p.config.priority,
      isLocal: p.config.priority >= 10,
    }));

  return {
    region,
    weather: available("weather", weatherProviders),
    soil: available("soil", soilProviders),
    statistics: available("statistics", statisticsProviders),
    satellite: available("satellite", satelliteProviders),
    plantId: available("plantId", plantIdProviders),
    pest: available("pest", pestProviders),
  };
}
