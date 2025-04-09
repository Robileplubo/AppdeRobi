import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'

const SurfScore = () => {
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const location = useStore((state) => state.location)

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Fonctions de calcul des scores
  const calculateHeightScore = (height: number): number => {
    // Score progressif basé sur la hauteur des vagues
    // Plus la vague est haute, plus le score est élevé
    // Score minimal à 0.3m, score maximal à 4m
    if (height < 0.3) return 0
    if (height > 4) return 100
    return Math.min(100, ((height - 0.3) / (4 - 0.3)) * 100)
  }

  const calculatePowerScore = (height: number, period: number): number => {
    const energy = Math.pow(height, 2) * period
    if (energy < 10) return 0
    if (energy < 30) return ((energy - 10) / 20) * 100
    if (energy <= 50) return 100
    return Math.max(0, 100 - (energy - 50) * 3)
  }

  const calculatePeriodScore = (period: number): number => {
    if (period < 7) return 0
    if (period <= 14) return ((period - 7) / 7) * 100
    return Math.max(0, 100 - (period - 14) * 10)
  }

  const calculateDirectionScore = (waveDirection: number, spotOrientation: number): number => {
    const delta = Math.abs(waveDirection - spotOrientation) % 360
    return Math.max(0, 100 - (delta / 180) * 100)
  }

  const calculateWindScore = (windSpeed: number, windDirection: number, spotOrientation: number): number => {
    const delta = Math.abs((windDirection - spotOrientation + 180) % 360 - 180)
    if (delta < 45 && windSpeed < 15) return 100
    if (windSpeed > 30) return 0
    return Math.max(0, 100 - windSpeed * 2)
  }

  useEffect(() => {
    const fetchSurfScore = async () => {
      if (!location) return

      setLoading(true)
      setError(null)
      setScore(null)

      try {
        const response = await fetch(
          `${import.meta.env.VITE_WEATHER_API_URL}/forecast?latitude=${location.lat}&longitude=${location.lon}&hourly=wave_height,wave_period,wind_speed_10m,wind_direction_10m,wave_direction`
        )
        
        if (!response.ok) {
          throw new Error('Erreur de connexion')
        }

        const data = await response.json()

        if (!data.hourly || !data.hourly.wave_height || !data.hourly.wave_period) {
          setError('Choisissez un point plus proche de la mer')
          setLoading(false)
          return
        }

        const waveHeight = data.hourly.wave_height[0]
        const wavePeriod = data.hourly.wave_period[0]
        const windSpeed = data.hourly.wind_speed_10m[0]
        const windDirection = data.hourly.wind_direction_10m[0]
        const waveDirection = data.hourly.wave_direction[0]

        if (waveHeight === null || wavePeriod === null) {
          setError('Choisissez un point plus proche de la mer')
          setLoading(false)
          return
        }
          
        const spotOrientation = waveDirection

        const heightScore = calculateHeightScore(waveHeight)
        const powerScore = calculatePowerScore(waveHeight, wavePeriod)
        const periodScore = calculatePeriodScore(wavePeriod)
        const directionScore = calculateDirectionScore(waveDirection, spotOrientation)
        const windScore = calculateWindScore(windSpeed, windDirection, spotOrientation)

        const finalScore = Math.round(
          0.50 * heightScore +  // La hauteur représente 50% du score
          0.20 * powerScore +
          0.15 * periodScore +
          0.10 * directionScore +
          0.05 * windScore
        )

        setScore(finalScore)
      } catch (error) {
        setError('Choisissez un point plus proche de la mer')
      } finally {
        setLoading(false)
      }
    }

    fetchSurfScore()
  }, [location])

  const getScoreColor = (score: number): { bg: string, ring: string } => {
    if (score <= 20) return { bg: 'bg-red-500', ring: 'ring-red-300' }
    if (score <= 40) return { bg: 'bg-orange-500', ring: 'ring-orange-300' }
    if (score <= 60) return { bg: 'bg-yellow-500', ring: 'ring-yellow-300' }
    if (score <= 80) return { bg: 'bg-green-500', ring: 'ring-green-300' }
    return { bg: 'bg-blue-500', ring: 'ring-blue-300' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="text-center space-y-6">
      {error && (
        <div className="error-popup animate-fade-out bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {score !== null && (
        <>
          <h2 className="text-2xl font-bold">Score de Surf</h2>
          <div 
            className={`inline-flex items-center justify-center ${getScoreColor(score).bg} rounded-full w-40 h-40 ring-4 ${getScoreColor(score).ring} shadow-lg transition-all duration-300`}
          >
            <span className="text-white text-6xl font-bold">{score}</span>
          </div>
        </>
      )}
    </div>
  )
}

export default SurfScore 