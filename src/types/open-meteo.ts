export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  hourly?: {
    time: string[];
    [key: string]: string[] | number[];
  };
  daily?: {
    time: string[];
    [key: string]: string[] | number[];
  };
  hourly_units?: Record<string, string>;
  daily_units?: Record<string, string>;
}

export interface OpenMeteoClimateResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  daily?: {
    time: string[];
    [key: string]: string[] | number[];
  };
  daily_units?: Record<string, string>;
}
