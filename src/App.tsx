import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { fetchWeatherData } from './services/weatherService'
import LocationSearch from './components/LocationSearch'
import ScoreCircle from './components/ScoreCircle'
import WeatherDetails from './components/WeatherDetails'
import SpotList from './components/SpotList'
import SurfScore from './components/SurfScore'

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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          SurfScore
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
          <LocationSearch />
          <SurfScore />
        </div>
      </div>
    </div>
  )
}

export default App 