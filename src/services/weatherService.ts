import axios from 'axios'

const MARINE_API_URL = 'https://marine-api.open-meteo.com/v1/marine'
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast'

export const fetchWeatherData = async (lat: number, lon: number) => {
  try {
    // Récupération des données marines
    const marineResponse = await axios.get(MARINE_API_URL, {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: 'wave_height,wave_direction,wave_period'
      }
    })

    // Récupération des données météo générales
    const weatherResponse = await axios.get(WEATHER_API_URL, {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: 'temperature_2m,precipitation,wind_speed_10m,wind_direction_10m',
        current: 'temperature_2m,precipitation,wind_speed_10m,wind_direction_10m'
      }
    })

    const currentHour = new Date().getHours()
    const marineData = marineResponse.data.hourly
    const current = weatherResponse.data.current

    return {
      waveHeight: marineData.wave_height[currentHour],
      wavePeriod: marineData.wave_period[currentHour],
      wavePower: marineData.wave_height[currentHour] * marineData.wave_period[currentHour],
      waveDirection: marineData.wave_direction[currentHour],
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      waterTemp: current.temperature_2m,
      precipitation: current.precipitation
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données météo:', error)
    throw new Error('Impossible de récupérer les données météo')
  }
} 