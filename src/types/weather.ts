export interface WeatherData {
  hourly: {
    time: string[];
    wave_height?: number[];
    wave_period?: number[];
    wave_power?: number[];
    sea_surface_temperature?: number[];
    temperature_2m?: number[];
    wind_speed_10m?: number[];
    weathercode?: number[];
  };
}

export interface Forecast {
  date: string | Date;
  score?: number;
} 