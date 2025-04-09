import { useStore } from '../store/useStore'

const SPOTS = [
  {
    name: 'Saint-Lunaire',
    lat: 48.6361,
    lon: -2.1139,
  },
  {
    name: 'Biarritz',
    lat: 43.4832,
    lon: -1.5586,
  },
]

const SpotList = () => {
  const { setLocation, location } = useStore()

  const handleSpotClick = (lat: number, lon: number) => {
    setLocation(lat, lon)
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Spots de surf
      </h2>
      <div className="space-y-2">
        {SPOTS.map((spot) => (
          <button
            key={spot.name}
            onClick={() => handleSpotClick(spot.lat, spot.lon)}
            className={`w-full p-4 rounded-lg transition-colors ${
              location?.lat === spot.lat && location?.lon === spot.lon
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{spot.name}</span>
              <span className="text-sm opacity-75">
                {spot.lat.toFixed(4)}, {spot.lon.toFixed(4)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default SpotList 