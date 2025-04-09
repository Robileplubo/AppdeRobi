export interface WeatherData {
  hourly: {
    wave_height?: number[];
    wave_period?: number[];
    wave_power?: number[];
    wind_speed_10m?: number[];
    temperature_2m?: number[];
  };
} 