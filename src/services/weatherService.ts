import { WeatherData } from '../types/weather';

// URLs des API
const MARINE_API_URL = 'https://marine-api.open-meteo.com/v1';
const STANDARD_API_URL = 'https://api.open-meteo.com/v1';

// Calcul de la puissance des vagues basé sur la hauteur et la période
const calculateWavePower = (height: number, period: number): number => {
  // Formule approximative : puissance ~ hauteur² * période
  return height * height * period;
};

export const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    // PREMIÈRE API : Marine API pour les données des vagues
    console.log('API MARINE - URL de base:', MARINE_API_URL);
    const marineUrl = `${MARINE_API_URL}/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_period`;
    console.log('API MARINE - URL complète:', marineUrl);

    const marineResponse = await fetch(marineUrl);
    
    if (!marineResponse.ok) {
      const errorText = await marineResponse.text();
      console.error('API MARINE - Erreur de réponse:', errorText);
      throw new Error(`Erreur HTTP API MARINE ${marineResponse.status}: ${errorText}`);
    }

    const marineData = await marineResponse.json();
    console.log('API MARINE - Données reçues:', marineData);

    // DEUXIÈME API : API Standard pour les données météo générales
    console.log('API STANDARD - URL de base:', STANDARD_API_URL);
    const standardUrl = `${STANDARD_API_URL}/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m,temperature_2m`;
    console.log('API STANDARD - URL complète:', standardUrl);

    const standardResponse = await fetch(standardUrl);
    
    if (!standardResponse.ok) {
      const errorText = await standardResponse.text();
      console.error('API STANDARD - Erreur de réponse:', errorText);
      throw new Error(`Erreur HTTP API STANDARD ${standardResponse.status}: ${errorText}`);
    }

    const standardData = await standardResponse.json();
    console.log('API STANDARD - Données reçues:', standardData);

    // Calculer la puissance des vagues à partir des données marines
    let wavePower: number[] = [];
    if (marineData.hourly?.wave_height && marineData.hourly?.wave_period) {
      wavePower = marineData.hourly.wave_height.map((height: number, index: number) => {
        const period = marineData.hourly.wave_period?.[index] || 0;
        return calculateWavePower(height, period);
      });
    }

    // Créer un objet combiné en précisant la source de chaque donnée
    const combinedData: WeatherData = {
      hourly: {
        // Données de l'API Marine
        wave_height: marineData.hourly?.wave_height,
        wave_period: marineData.hourly?.wave_period,
        wave_power: wavePower,
        
        // Données de l'API Standard
        wind_speed_10m: standardData.hourly?.wind_speed_10m,
        temperature_2m: standardData.hourly?.temperature_2m
      }
    };

    console.log('Données combinées des deux API:', combinedData);
    
    return combinedData;
  } catch (error) {
    console.error('Erreur détaillée dans fetchWeatherData:', error);
    throw error;
  }
}; 