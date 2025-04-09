import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { fetchWeatherData } from '../services/weatherService'

const SurfScore = () => {
  const { location } = useStore()
  const [weatherData, setWeatherData] = useState<{
    waveHeight: number | null;
    wavePeriod: number | null;
    wavePower: number | null;
    windSpeed: number | null;
    airTemp: number | null;
  }>({
    waveHeight: null,
    wavePeriod: null,
    wavePower: null,
    windSpeed: null,
    airTemp: null
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!location) {
        setWeatherData({
          waveHeight: null,
          wavePeriod: null,
          wavePower: null,
          windSpeed: null,
          airTemp: null
        })
        return
      }

      try {
        const data = await fetchWeatherData(location.lat, location.lon)
        if (data.hourly) {
          setWeatherData({
            waveHeight: data.hourly.wave_height?.[0] || null,
            wavePeriod: data.hourly.wave_period?.[0] || null,
            wavePower: data.hourly.wave_power?.[0] || null,
            windSpeed: data.hourly.wind_speed_10m?.[0] || null,
            airTemp: data.hourly.temperature_2m?.[0] || null
          })
          setError(null)
        } else {
          setError('Aucune donnée météorologique disponible')
        }
      } catch (err) {
        setError('Erreur lors de la récupération des données')
        console.error('Erreur détaillée:', err)
      }
    }

    fetchData()
  }, [location])

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (!location) {
    return <div>Veuillez sélectionner un point sur la carte</div>
  }

  return (
    <div className="text-center p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Conditions météorologiques</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Hauteur des vagues</h3>
          <div className="text-3xl font-bold">
            {weatherData.waveHeight !== null ? `${weatherData.waveHeight.toFixed(1)} m` : 'N/A'}
          </div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Période des vagues</h3>
          <div className="text-3xl font-bold">
            {weatherData.wavePeriod !== null ? `${weatherData.wavePeriod.toFixed(1)} s` : 'N/A'}
          </div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Puissance des vagues</h3>
          <div className="text-3xl font-bold">
            {weatherData.wavePower !== null ? Math.round(weatherData.wavePower) : 'N/A'}
          </div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Vitesse du vent</h3>
          <div className="text-3xl font-bold">
            {weatherData.windSpeed !== null ? `${weatherData.windSpeed.toFixed(1)} km/h` : 'N/A'}
          </div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg col-span-2">
          <h3 className="text-lg font-semibold mb-2">Température de l'air</h3>
          <div className="text-3xl font-bold">
            {weatherData.airTemp !== null ? `${weatherData.airTemp.toFixed(1)} °C` : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SurfScore 