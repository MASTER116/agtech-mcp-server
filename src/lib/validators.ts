import { z } from "zod";

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Latitude in decimal degrees (-90 to 90)"),
  longitude: z.number().min(-180).max(180).describe("Longitude in decimal degrees (-180 to 180)"),
});

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format");

export const dateRangeSchema = z.object({
  start_date: dateSchema.describe("Start date in YYYY-MM-DD format"),
  end_date: dateSchema.describe("End date in YYYY-MM-DD format"),
});

export const yearRangeSchema = z.object({
  year_start: z.number().int().min(1900).max(2100).describe("Start year"),
  year_end: z.number().int().min(1900).max(2100).describe("End year"),
});

export const countryCodeSchema = z.string().length(3).describe("ISO 3166-1 alpha-3 country code (e.g. RUS, USA, BRA)");

export const boundingBoxSchema = z.object({
  min_lat: z.number().min(-90).max(90),
  max_lat: z.number().min(-90).max(90),
  min_lon: z.number().min(-180).max(180),
  max_lon: z.number().min(-180).max(180),
});
