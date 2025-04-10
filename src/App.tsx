import { useEffect, useState } from 'react'
import { useStore } from './store/useStore'
import { fetchWeatherData } from './services/weatherService'
import LocationSearch from './components/LocationSearch'
import SurfScore from './components/SurfScore'
import { getAssetUrl } from './utils/vercelAdapter'
import ForecastDisplay from './components/ForecastDisplay'

function App() {
  const { location, setWeatherData, setLoading, setError } = useStore()
  const [hasValidData, setHasValidData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!location) return

      try {
        setLoading(true)
        const apiData = await fetchWeatherData(location.lat, location.lon)
        
        // Vérifier les données marines
        if (!apiData.hourly?.wave_height || apiData.hourly.wave_height.length === 0 || 
            apiData.hourly.wave_height.every(val => val === null || val === 0)) {
          setHasValidData(false);
          setLoading(false);
          return;
        }

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
          setHasValidData(true);
        } else {
          setError('Aucune donnée météorologique disponible')
          setHasValidData(false);
        }
      } catch (error) {
        setError('Erreur lors de la récupération des données météo')
        setHasValidData(false);
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [location, setWeatherData, setLoading, setError])

  // URL de l'image avec l'adaptateur Vercel
  const logoUrl = getAssetUrl('/graphic/surfscore_logo.png');

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white">
      {/* Header fixe avec logo */}
      <header className="mobile-header">
        <img 
          src={logoUrl}
          alt="SurfScore" 
          className="mobile-logo"
        />
      </header>
      
      {/* Corps principal */}
      <main className="mobile-body">
        {/* Composant carte */}
        <section className="mobile-map-container">
          <LocationSearch />
        </section>
        
        {/* Composant score */}
        <section className="mobile-score-card">
          <SurfScore />
        </section>
        
        {/* Prévisions - n'afficher que si nous avons des données valides */}
        {location && hasValidData && (
          <section className="mobile-score-card">
            <ForecastDisplay />
          </section>
        )}
      </main>
    </div>
  )
}

export default App 