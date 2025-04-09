import { useStore } from '../store/useStore'
import {
  ArrowLongUpIcon,
  ArrowPathIcon,
  BeakerIcon,
  ChartBarIcon,
  BoltIcon,
  CloudIcon,
} from '@heroicons/react/24/outline'

const WeatherDetails = () => {
  const { weatherData, isLoading } = useStore()

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    )
  }

  if (!weatherData) return null

  const details = [
    {
      icon: BeakerIcon,
      label: 'Hauteur des vagues',
      value: `${weatherData.waveHeight.toFixed(1)}m`,
    },
    {
      icon: ChartBarIcon,
      label: 'Période des vagues',
      value: `${weatherData.wavePeriod.toFixed(1)}s`,
    },
    {
      icon: BoltIcon,
      label: 'Puissance des vagues',
      value: `${weatherData.wavePower.toFixed(1)}`,
    },
    {
      icon: ArrowLongUpIcon,
      label: 'Direction des vagues',
      value: `${weatherData.waveDirection}°`,
      style: { transform: `rotate(${weatherData.waveDirection}deg)` },
    },
    {
      icon: ArrowPathIcon,
      label: 'Vitesse du vent',
      value: `${weatherData.windSpeed.toFixed(1)} km/h`,
    },
    {
      icon: CloudIcon,
      label: 'Précipitations',
      value: `${weatherData.precipitation.toFixed(1)}mm`,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {details.map((detail, index) => (
        <div
          key={index}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <detail.icon
              className="w-6 h-6 text-primary-500"
              style={detail.style}
            />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {detail.value}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {detail.label}
          </p>
        </div>
      ))}
    </div>
  )
}

export default WeatherDetails 