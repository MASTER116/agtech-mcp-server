export const API_URLS = {
  // Tier 1
  OPEN_METEO_FORECAST: "https://api.open-meteo.com/v1/forecast",
  OPEN_METEO_ARCHIVE: "https://archive-api.open-meteo.com/v1/archive",
  OPEN_METEO_CLIMATE: "https://climate-api.open-meteo.com/v1/climate",
  SOILGRIDS_BASE: "https://rest.isric.org/soilgrids/v2.0",
  FAOSTAT_BASE: "https://fenixservices.fao.org/faostat/api/v1/en",
  WORLDBANK_BASE: "https://api.worldbank.org/v2",
  CROPSCAPE_BASE: "https://nassgeodata.gmu.edu/axis2/services/CDLService",
  // Tier 2
  NASS_BASE: "https://quickstats.nass.usda.gov/api",
  NOAA_BASE: "https://www.ncei.noaa.gov/cdo-web/api/v2",
  SENTINEL_BASE: "https://sh.dataspace.copernicus.eu",
  SENTINEL_TOKEN: "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
  APPEEARS_BASE: "https://appeears.earthdatacloud.nasa.gov/api",
  PLANTNET_BASE: "https://my-api.plantnet.org/v2",
  EPPO_BASE: "https://data.eppo.int/api/rest/1.0",
  // Tier 3
  AGROMONITORING_BASE: "http://api.agromonitoring.com/agro/1.0",
  YANDEX_WEATHER: "https://api.weather.yandex.ru/graphql/query",
} as const;

export const RATE_LIMITS = {
  OPEN_METEO: { perMinute: 600, perHour: 5000, perDay: 10000 },
  SOILGRIDS: { perMinute: 30 },
  FAOSTAT: { perMinute: 30 },
  WORLDBANK: { perMinute: 60 },
  CROPSCAPE: { perMinute: 30 },
  NASS: { perMinute: 60 },
  NOAA: { perMinute: 300 },
  SENTINEL: { perMinute: 60 },
  APPEEARS: { perMinute: 30 },
  PLANTNET: { perMinute: 30, perDay: 500 },
  EPPO: { perMinute: 60 },
  AGROMONITORING: { perMinute: 60, perDay: 500 },
  YANDEX: { perMinute: 60 },
} as const;

export const CACHE_TTL = {
  WEATHER_FORECAST: 15 * 60 * 1000,          // 15 min
  WEATHER_HISTORICAL: 24 * 60 * 60 * 1000,   // 24 hr
  CLIMATE: 7 * 24 * 60 * 60 * 1000,          // 7 days
  SOIL: 7 * 24 * 60 * 60 * 1000,             // 7 days
  STATISTICS: 60 * 60 * 1000,                 // 1 hr
  SATELLITE: 60 * 60 * 1000,                  // 1 hr
  PLANT_ID: 24 * 60 * 60 * 1000,             // 24 hr
  PEST: 24 * 60 * 60 * 1000,                 // 24 hr
} as const;

export const OPEN_METEO_PARAMS = {
  SOIL_HOURLY: [
    "soil_temperature_0cm", "soil_temperature_6cm",
    "soil_temperature_18cm", "soil_temperature_54cm",
    "soil_moisture_0_to_1cm", "soil_moisture_1_to_3cm",
    "soil_moisture_3_to_9cm", "soil_moisture_9_to_27cm",
    "soil_moisture_27_to_81cm",
  ],
  AGRO_HOURLY: [
    "et0_fao_evapotranspiration", "evapotranspiration",
    "vapour_pressure_deficit",
  ],
  STANDARD_HOURLY: [
    "temperature_2m", "relative_humidity_2m", "precipitation",
    "wind_speed_10m", "surface_pressure", "cloud_cover",
  ],
  AGRO_DAILY: [
    "temperature_2m_max", "temperature_2m_min",
    "precipitation_sum", "et0_fao_evapotranspiration",
    "wind_speed_10m_max",
  ],
} as const;

export const SOILGRIDS_PROPERTIES = [
  "phh2o", "soc", "clay", "sand", "silt",
  "nitrogen", "bdod", "cec",
  "wv0010", "wv0033", "wv1500",
] as const;

export const SOILGRIDS_DEPTHS = [
  "0-5cm", "5-15cm", "15-30cm", "30-60cm", "60-100cm", "100-200cm",
] as const;
