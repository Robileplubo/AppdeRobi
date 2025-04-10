import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { fetchWeatherData } from './services/weatherService'
import LocationSearch from './components/LocationSearch'
import ScoreCircle from './components/ScoreCircle'
import WeatherDetails from './components/WeatherDetails'
import SpotList from './components/SpotList'
import SurfScore from './components/SurfScore'
import { WeatherData } from './types/weather'

function App() {
  const { location, setWeatherData, setLoading, setError } = useStore()

  useEffect(() => {
    const fetchData = async () => {
      if (!location) return

      try {
        setLoading(true)
        const data = await fetchWeatherData(location.lat, location.lon)
        setWeatherData(data as WeatherData)
      } catch (error) {
        setError('Erreur lors de la récupération des données météo')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [location, setWeatherData, setLoading, setError])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-white p-0">
      <div className="w-full py-6 mb-4" style={{ backgroundColor: "#FDFCFA" }}>
        <div className="max-w-sm mx-auto">
          <img 
            src="/graphic/surfscore_logo.png" 
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