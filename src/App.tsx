import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { fetchWeatherData } from './services/weatherService'
import LocationSearch from './components/LocationSearch'
import ScoreCircle from './components/ScoreCircle'
import WeatherDetails from './components/WeatherDetails'
import SpotList from './components/SpotList'

function App() {
  const { location, setWeatherData, setLoading, setError } = useStore()

  useEffect(() => {
    const fetchData = async () => {
      if (!location) return

      try {
        setLoading(true)
        const data = await fetchWeatherData(location.lat, location.lon)
        setWeatherData(data)
      } catch (error) {
        setError('Erreur lors de la récupération des données météo')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [location, setWeatherData, setLoading, setError])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
          SurfScore
        </h1>
        
        <LocationSearch />
        <ScoreCircle />
        <WeatherDetails />
        <SpotList />
      </div>
    </div>
  )
}

export default App 