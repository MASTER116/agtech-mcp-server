export interface YandexWeatherResponse {
  data: {
    weatherByPoint: {
      now: {
        temperature: number;
        humidity: number;
        pressure: number;
        windSpeed: number;
        windDirection: string;
        condition: string;
        cloudiness: number;
      };
      forecast?: {
        days: Array<{
          time: string;
          maxTemperature: number;
          minTemperature: number;
          maxWindSpeed: number;
          totalPrecipitation: number;
          condition: string;
        }>;
      };
    };
  };
}
