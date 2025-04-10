import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { fetchWeatherData } from './services/weatherService'
import LocationSearch from './components/LocationSearch'
import SurfScore from './components/SurfScore'
import { getAssetUrl } from './utils/vercelAdapter'

function App() {
  const { location, setWeatherData, setLoading, setError } = useStore()

  useEffect(() => {
    const fetchData = async () => {
      if (!location) return

      try {
        setLoading(true)
        const apiData = await fetchWeatherData(location.lat, location.lon)
        
        // Transformation des données API vers le format attendu par le store
        // Nous prenons le premier élément de chaque tableau de données horaires
        if (apiData.hourly) {
          const storeData = {
            waveHeight: apiData.hourly.wave_height?.[0] ?? 0,
            wavePeriod: apiData.hourly.wave_period?.[0] ?? 0,
            wavePower: apiData.hourly.wave_power?.[0] ?? 0,
            waveDirection: 0, // Non fourni par l'API, valeur par défaut
            windSpeed: apiData.hourly.wind_speed_10m?.[0] ?? 0,
            windDirection: 0, // Non fourni par l'API, valeur par défaut
            waterTemp: apiData.hourly.sea_surface_temperature?.[0] ?? 0,
            precipitation: 0 // Non fourni par l'API, valeur par défaut
          }
          setWeatherData(storeData)
        } else {
          setError('Aucune donnée météorologique disponible')
        }
      } catch (error) {
        setError('Erreur lors de la récupération des données météo')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [location, setWeatherData, setLoading, setError])

  // URL de l'image avec l'adaptateur Vercel
  const logoUrl = getAssetUrl('/graphic/surfscore_logo.png');

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-white p-0">
      <div className="w-full py-6 mb-4" style={{ backgroundColor: "#FDFCFA" }}>
        <div className="max-w-sm mx-auto">
          <img 
            src={logoUrl}
            alt="SurfScore Logo" 
            className="h-20 mx-auto"
          />
        </div>
      </div>
      <div className="max-w-sm mx-auto px-4 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-6 border border-sky-50">
          <LocationSearch />
          <SurfScore />
        </div>
      </div>
    </div>
  )
}

export default App 