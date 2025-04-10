export interface WeatherData {
  hourly: {
    // Données de l'API Marine
    wave_height?: number[];
    wave_period?: number[];
    wave_power?: number[];
    sea_surface_temperature?: number[];
    
    // Données de l'API Standard
    wind_speed_10m?: number[];
    temperature_2m?: number[];
    weathercode?: number[];
  };
} 