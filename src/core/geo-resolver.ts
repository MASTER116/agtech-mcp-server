export type RegionCode = "US" | "EU" | "RU" | "CN" | "BR" | "IN" | "GLOBAL";

interface RegionBounds {
  code: RegionCode;
  name: string;
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

const REGION_BOUNDS: RegionBounds[] = [
  { code: "US", name: "United States", latMin: 24.5, latMax: 49.5, lonMin: -125, lonMax: -66.5 },
  { code: "EU", name: "European Union", latMin: 35, latMax: 72, lonMin: -11, lonMax: 40 },
  { code: "RU", name: "Russia", latMin: 41, latMax: 82, lonMin: 19, lonMax: 180 },
  { code: "CN", name: "China", latMin: 18, latMax: 54, lonMin: 73, lonMax: 135 },
  { code: "BR", name: "Brazil", latMin: -34, latMax: 6, lonMin: -74, lonMax: -34 },
  { code: "IN", name: "India", latMin: 6, latMax: 36, lonMin: 68, lonMax: 97.5 },
];

export function resolveRegion(latitude: number, longitude: number): RegionCode {
  for (const r of REGION_BOUNDS) {
    if (latitude >= r.latMin && latitude <= r.latMax && longitude >= r.lonMin && longitude <= r.lonMax) {
      return r.code;
    }
  }
  return "GLOBAL";
}

export function getRegionName(code: RegionCode): string {
  const found = REGION_BOUNDS.find(r => r.code === code);
  return found?.name ?? "Global";
}

export function validateGeoPoint(latitude: number, longitude: number): string | null {
  if (latitude < -90 || latitude > 90) return "Latitude must be between -90 and 90";
  if (longitude < -180 || longitude > 180) return "Longitude must be between -180 and 180";
  return null;
}
