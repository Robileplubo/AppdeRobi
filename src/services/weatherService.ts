import { WeatherData } from '../types/weather';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const WEATHER_API_URL = import.meta.env.VITE_WEATHER_API_URL;

// URLs des API
const MARINE_API_URL = import.meta.env.VITE_WEATHER_API_URL || 'https://marine-api.open-meteo.com/v1';
const STANDARD_API_URL = 'https://api.open-meteo.com/v1';

// Nombre de jours de prévision
const FORECAST_DAYS = 7; // Jour actuel + 6 jours suivants

// Calcul de la puissance des vagues basé sur la hauteur et la période
const calculateWavePower = (height: number, period: number): number => {
  // Formule approximative : puissance ~ hauteur² * période
  return height * height * period;
};

export const fetchWeatherData = async (latitude: number, longitude: number): Promise<WeatherData> => {
  console.log('Fetching weather data for coordinates:', latitude, longitude);
  
  try {
    // Fetch marine data (waves, etc.)
    const marineUrl = `${MARINE_API_URL}/marine?latitude=${latitude}&longitude=${longitude}&hourly=wave_height,wave_period,wave_direction,sea_surface_temperature&forecast_days=${FORECAST_DAYS}`;
    console.log('Marine API URL:', marineUrl);
    
    const marineResponse = await fetch(marineUrl);
    console.log('Marine API response status:', marineResponse.status);
    
    if (!marineResponse.ok) {
      const errorText = await marineResponse.text();
      console.error('Marine API error:', errorText);
      throw new Error(`Failed to fetch marine data: ${marineResponse.status} ${errorText}`);
    }
    
    const marineData = await marineResponse.json();
    console.log('Marine data received:', marineData);
    
    // Fetch standard weather data (temperature, etc.)
    const standardUrl = `${STANDARD_API_URL}/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode,wind_speed_10m,wind_direction_10m&forecast_days=${FORECAST_DAYS}`;
    console.log('Standard API URL:', standardUrl);
    
    const standardResponse = await fetch(standardUrl);
    console.log('Standard API response status:', standardResponse.status);
    
    if (!standardResponse.ok) {
      const errorText = await standardResponse.text();
      console.error('Standard API error:', errorText);
      throw new Error(`Failed to fetch standard weather data: ${standardResponse.status} ${errorText}`);
    }
    
    const standardData = await standardResponse.json();
    console.log('Standard data received:', standardData);
    
    // Calculate wave power based on wave height and period
    const waveHeights = marineData.hourly?.wave_height || [];
    const wavePeriods = marineData.hourly?.wave_period || [];
    
    // Assume arrays are the same length
    const wavePower = waveHeights.map((height: number, index: number) => {
      const period = wavePeriods[index] || 0;
      // Calculate wave power: height^2 * period
      return height * height * period;
    });
    
    // Combine data from both APIs
    const combinedData: WeatherData = {
      hourly: {
        time: marineData.hourly?.time || standardData.hourly?.time,
        wave_height: marineData.hourly?.wave_height,
        wave_period: marineData.hourly?.wave_period,
        wave_power: wavePower,
        sea_surface_temperature: marineData.hourly?.sea_surface_temperature,
        temperature_2m: standardData.hourly?.temperature_2m,
        wind_speed_10m: standardData.hourly?.wind_speed_10m,
        weathercode: standardData.hourly?.weathercode
      }
    };
    
    console.log('Combined weather data:', combinedData);
    return combinedData;
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données météo:', error);
    throw error;
  }
}; 