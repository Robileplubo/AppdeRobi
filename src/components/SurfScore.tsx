import { useEffect, useState, useCallback } from 'react'
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

  useEffect(() => {
    if (location) {
      console.log('Nouvelle location détectée:', location)
      calculateScore()
    }
  }, [location])

  const calculateScore = useCallback(async () => {
    if (!location) return

    setLoading(true)
    setError(null)
    setScore(null)

    try {
      console.log('Début du calcul du score pour:', location)
      
      // Appel à l'API Marine Weather
      const url = `${import.meta.env.VITE_WEATHER_API_URL}/marine?latitude=${location.lat}&longitude=${location.lon}&hourly=wave_height,wave_period,wind_wave_height,wind_wave_period,wind_wave_direction,wind_speed_10m,wind_direction_10m`
      console.log('URL de l\'API:', url)

      const response = await fetch(url)
      console.log('Statut de la réponse:', response.status)

      if (!response.ok) {
        throw new Error(`Erreur de connexion à l'API météo: ${response.status}`)
      }

      const data = await response.json()
      console.log('Données complètes de l\'API:', data)

      if (!data.hourly) {
        throw new Error('Données horaires non disponibles')
      }

      // Vérification des données disponibles
      const availableData = {
        waveHeight: data.hourly.wave_height?.[0] !== undefined,
        wavePeriod: data.hourly.wave_period?.[0] !== undefined,
        windSpeed: data.hourly.wind_speed_10m?.[0] !== undefined,
        windDirection: data.hourly.wind_direction_10m?.[0] !== undefined,
        waveDirection: data.hourly.wind_wave_direction?.[0] !== undefined
      }
      console.log('Données disponibles:', availableData)

      // Extraction des données avec vérification
      const currentData = {
        waveHeight: data.hourly.wave_height?.[0] ?? 0,
        wavePeriod: data.hourly.wave_period?.[0] ?? 0,
        windSpeed: data.hourly.wind_speed_10m?.[0] ?? 0,
        windDirection: data.hourly.wind_direction_10m?.[0] ?? 0,
        waveDirection: data.hourly.wind_wave_direction?.[0] ?? 0
      }

      console.log('Données extraites:', currentData)

      // Vérification si nous avons des données valides
      if (currentData.waveHeight === 0 && currentData.wavePeriod === 0) {
        throw new Error('Aucune donnée de vagues disponible pour ce point')
      }

      // Calcul des scores individuels
      const scores = {
        height: calculateWaveHeightScore(currentData.waveHeight),
        period: calculateWavePeriodScore(currentData.wavePeriod),
        power: calculateWavePowerScore(currentData.waveHeight, currentData.wavePeriod),
        wind: calculateWindScore(currentData.windSpeed, currentData.windDirection, currentData.waveDirection)
      }

      console.log('Scores individuels calculés:', scores)

      // Calcul du score final avec pondération
      const finalScore = Math.round(
        scores.height * 0.4 +    // Hauteur des vagues (40%)
        scores.period * 0.2 +    // Période des vagues (20%)
        scores.power * 0.3 +     // Puissance des vagues (30%)
        scores.wind * 0.1        // Vent (10%)
      )

      console.log('Score final calculé:', finalScore)
      setScore(finalScore)
    } catch (error) {
      console.error('Erreur détaillée:', error)
      setError(error instanceof Error ? error.message : 'Impossible de calculer le score pour ce point')
    } finally {
      setLoading(false)
    }
  }, [location])

  // Fonctions de calcul des scores individuels
  const calculateWaveHeightScore = (height: number): number => {
    if (height <= 0) return 0
    if (height >= 3) return 100
    return Math.round((height / 3) * 100)
  }

  const calculateWavePeriodScore = (period: number): number => {
    if (period <= 0) return 0
    if (period >= 15) return 100
    return Math.round((period / 15) * 100)
  }

  const calculateWavePowerScore = (height: number, period: number): number => {
    const power = height * period
    if (power <= 0) return 0
    if (power >= 20) return 100
    return Math.round((power / 20) * 100)
  }

  const calculateWindScore = (speed: number, direction: number, waveDirection: number): number => {
    // Calcul de la différence d'angle entre le vent et les vagues
    const angleDiff = Math.abs((direction - waveDirection + 180) % 360 - 180)
    
    // Score basé sur la vitesse du vent
    let speedScore = 100
    if (speed > 25) speedScore = 0
    else if (speed > 15) speedScore = 50
    else if (speed > 10) speedScore = 75

    // Score basé sur l'angle
    let angleScore = 100
    if (angleDiff > 90) angleScore = 0
    else if (angleDiff > 45) angleScore = 50
    else if (angleDiff > 30) angleScore = 75

    return Math.round((speedScore + angleScore) / 2)
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-yellow-500'
    if (score >= 20) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="error-popup animate-fade-out bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      </div>
    )
  }

  if (!score) {
    return null
  }

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Score de Surf</h2>
      <div className={`inline-flex items-center justify-center ${getScoreColor(score)} text-white rounded-full w-32 h-32 text-4xl font-bold shadow-lg`}>
        {score}
      </div>
    </div>
  )
}

export default SurfScore 