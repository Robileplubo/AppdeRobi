import { create } from 'zustand'

interface Location {
  lat: number
  lon: number
}

interface WeatherData {
  waveHeight: number
  wavePeriod: number
  wavePower: number
  waveDirection: number
  windSpeed: number
  windDirection: number
  waterTemp: number
  precipitation: number
}

interface SurfScoreState {
  location: Location | null
  weatherData: WeatherData | null
  surfScore: number
  isLoading: boolean
  error: string | null
  setLocation: (lat: number, lon: number) => void
  setWeatherData: (data: WeatherData) => void
  setSurfScore: (score: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  calculateSurfScore: () => void
}

export const useStore = create<SurfScoreState>((set, get) => ({
  location: null,
  weatherData: null,
  surfScore: 0,
  isLoading: false,
  error: null,

  setLocation: (lat, lon) => {
    set({ location: { lat, lon } })
    set({ surfScore: 0 })
  },
  setWeatherData: (data) => {
    set({ weatherData: data })
    get().calculateSurfScore()
  },
  setSurfScore: (score) => set({ surfScore: score }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  calculateSurfScore: () => {
    const { weatherData } = get()
    if (!weatherData) return

    // Facteurs de pondération
    const WAVE_HEIGHT_WEIGHT = 0.3
    const WAVE_PERIOD_WEIGHT = 0.3
    const WAVE_POWER_WEIGHT = 0.2
    const WAVE_DIRECTION_WEIGHT = 0.1
    const WIND_WEIGHT = 0.1

    // Score pour la hauteur des vagues (0-100)
    const waveHeightScore = (() => {
      const height = weatherData.waveHeight
      if (height < 0.5) return height * 100
      if (height <= 1.5) return 100
      if (height <= 3) return Math.max(0, 100 - ((height - 1.5) * 50))
      return 0
    })()

    // Score pour la période des vagues (0-100)
    const wavePeriodScore = (() => {
      const period = weatherData.wavePeriod
      if (period < 8) return period * 12.5
      if (period <= 12) return 100
      if (period <= 16) return Math.max(0, 100 - ((period - 12) * 25))
      return 0
    })()

    // Score pour la puissance des vagues (0-100)
    const wavePowerScore = (() => {
      const power = weatherData.wavePower
      if (power < 4) return power * 25
      if (power <= 8) return 100
      if (power <= 12) return Math.max(0, 100 - ((power - 8) * 25))
      return 0
    })()

    // Score pour la direction des vagues (0-100)
    const waveDirectionScore = (() => {
      const direction = weatherData.waveDirection
      const optimalDirection = 180 // Direction optimale (offshore)
      const angleDiff = Math.abs((direction + 180) % 360 - 180)
      return Math.max(0, 100 - (angleDiff * 0.9))
    })()

    // Score pour le vent (0-100)
    const windScore = (() => {
      const speed = weatherData.windSpeed
      const direction = weatherData.windDirection
      const waveDirection = weatherData.waveDirection
      
      // Score pour la vitesse du vent
      const speedScore = (() => {
        if (speed < 5) return speed * 20
        if (speed <= 15) return 100
        if (speed <= 30) return Math.max(0, 100 - ((speed - 15) * 6.67))
        return 0
      })()

      // Score pour la direction du vent par rapport aux vagues
      const directionScore = (() => {
        const angleDiff = Math.abs((direction - waveDirection + 180) % 360 - 180)
        return Math.max(0, 100 - (angleDiff * 0.9))
      })()

      return (speedScore + directionScore) / 2
    })()

    // Calcul du score final
    const finalScore = 
      waveHeightScore * WAVE_HEIGHT_WEIGHT +
      wavePeriodScore * WAVE_PERIOD_WEIGHT +
      wavePowerScore * WAVE_POWER_WEIGHT +
      waveDirectionScore * WAVE_DIRECTION_WEIGHT +
      windScore * WIND_WEIGHT

    set({ surfScore: Math.round(finalScore) })
  },
})) 