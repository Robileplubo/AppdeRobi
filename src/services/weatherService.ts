import { WeatherData } from '../types/weather';
import { prepareApiUrl } from '../utils/vercelAdapter';

// URLs des API
const MARINE_API_URL = import.meta.env.VITE_WEATHER_API_URL || 'https://marine-api.open-meteo.com/v1';
const STANDARD_API_URL = 'https://api.open-meteo.com/v1';

// Calcul de la puissance des vagues basé sur la hauteur et la période
const calculateWavePower = (height: number, period: number): number => {
  // Formule approximative : puissance ~ hauteur² * période
  return height * height * period;
};

export const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    // PREMIÈRE API : Marine API pour les données des vagues et température de l'eau
    console.log('API MARINE - URL de base:', MARINE_API_URL);
    const marineUrlRaw = `${MARINE_API_URL}/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_period,sea_surface_temperature`;
    const marineUrl = prepareApiUrl(marineUrlRaw);
    console.log('API MARINE - URL complète:', marineUrl);

    // Utilisation de mode: 'cors' pour éviter les problèmes CORS
    const marineResponse = await fetch(marineUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });
    
    if (!marineResponse.ok) {
      const errorText = await marineResponse.text();
      console.error('API MARINE - Erreur de réponse:', errorText);
      throw new Error(`Erreur HTTP API MARINE ${marineResponse.status}: ${errorText}`);
    }

    const marineData = await marineResponse.json();
    console.log('API MARINE - Données reçues:', marineData);
    
    // Log des propriétés disponibles dans l'API marine
    console.log('API MARINE - Propriétés de hourly:', Object.keys(marineData.hourly || {}));

    // DEUXIÈME API : API Standard pour les données météo générales
    console.log('API STANDARD - URL de base:', STANDARD_API_URL);
    const standardUrlRaw = `${STANDARD_API_URL}/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m,temperature_2m,weathercode`;
    const standardUrl = prepareApiUrl(standardUrlRaw);
    console.log('API STANDARD - URL complète:', standardUrl);

    // Utilisation de mode: 'cors' pour éviter les problèmes CORS
    const standardResponse = await fetch(standardUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });
    
    if (!standardResponse.ok) {
      const errorText = await standardResponse.text();
      console.error('API STANDARD - Erreur de réponse:', errorText);
      throw new Error(`Erreur HTTP API STANDARD ${standardResponse.status}: ${errorText}`);
    }

    const standardData = await standardResponse.json();
    console.log('API STANDARD - Données reçues:', standardData);
    
    // Log des propriétés disponibles dans l'API standard
    console.log('API STANDARD - Propriétés de hourly:', Object.keys(standardData.hourly || {}));
    console.log('API STANDARD - weathercode disponible?', Array.isArray(standardData.hourly?.weathercode));
    if (standardData.hourly?.weathercode) {
      console.log('API STANDARD - Premier code météo:', standardData.hourly.weathercode[0]);
    }

    // Calculer la puissance des vagues à partir des données marines
    let wavePower: number[] = [];
    if (marineData.hourly?.wave_height && marineData.hourly?.wave_period) {
      wavePower = marineData.hourly.wave_height.map((height: number, index: number) => {
        const period = marineData.hourly.wave_period?.[index] ?? 0;
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
        sea_surface_temperature: marineData.hourly?.sea_surface_temperature,
        
        // Données de l'API Standard
        wind_speed_10m: standardData.hourly?.wind_speed_10m,
        temperature_2m: standardData.hourly?.temperature_2m,
        weathercode: standardData.hourly?.weathercode
      }
    };

    console.log('Données combinées des deux API:', combinedData);
    
    return combinedData;
  } catch (error) {
    console.error('Erreur détaillée dans fetchWeatherData:', error);
    // Retourner un objet vide mais valide pour éviter les erreurs
    return {
      hourly: {
        wave_height: [],
        wave_period: [],
        wave_power: [],
        sea_surface_temperature: [],
        wind_speed_10m: [],
        temperature_2m: [],
        weathercode: []
      }
    };
  }
}; 