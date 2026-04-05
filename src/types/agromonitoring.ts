export interface AgroWeather {
  dt: number;
  weather: Array<{ id: number; main: string; description: string }>;
  main: { temp: number; humidity: number; pressure: number };
  wind: { speed: number; deg: number };
  clouds: { all: number };
}

export interface AgroSoilData {
  dt: number;
  t10: number;
  moisture: number;
  t0: number;
}
