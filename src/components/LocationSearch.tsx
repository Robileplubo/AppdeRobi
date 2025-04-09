import { useCallback, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import "leaflet/dist/leaflet.css";
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useStore } from '../store/useStore'

// Configuration de l'icône par défaut de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Limites de la France métropolitaine (incluant la Corse)
const FRANCE_BOUNDS: L.LatLngBoundsExpression = [
  [41.333, -5.142], // Sud-Ouest (incluant la Corse)
  [51.089, 9.560]   // Nord-Est
];

// Vérifier si un point est en France
const isInFrance = (lat: number, lon: number): boolean => {
  return lat >= FRANCE_BOUNDS[0][0] && 
         lat <= FRANCE_BOUNDS[1][0] && 
         lon >= FRANCE_BOUNDS[0][1] && 
         lon <= FRANCE_BOUNDS[1][1];
};

// Récupérer le nom de la commune
const getNearestCity = async (lat: number, lon: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
    );
    const data = await response.json();
    
    // Si on est en mer, chercher la commune la plus proche
    if (!data.address || Object.keys(data.address).length === 0) {
      const nearbyResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=5&addressdetails=1`
      );
      const nearbyData = await nearbyResponse.json();
      
      return nearbyData.address?.city || 
             nearbyData.address?.town || 
             nearbyData.address?.village || 
             nearbyData.address?.municipality ||
             nearbyData.address?.county ||
             nearbyData.address?.state ||
             "En mer";
    }
    
    return data.address?.city || 
           data.address?.town || 
           data.address?.village || 
           data.address?.municipality ||
           data.address?.county ||
           data.address?.state ||
           "Lieu inconnu";
  } catch {
    return "Lieu inconnu";
  }
};

const checkCoastalLocation = async (lat: number, lon: number): Promise<boolean> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_WEATHER_API_URL}/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_period`
    )
    
    if (!response.ok) {
      console.error('Erreur API:', response.status)
      return false
    }

    const data = await response.json()
    console.log('Données de vagues:', data)

    // Si nous avons des données de vagues, c'est que nous sommes près de la côte
    return data.hourly?.wave_height?.[0] !== undefined && data.hourly?.wave_period?.[0] !== undefined
  } catch (error) {
    console.error('Erreur lors de la vérification du point côtier:', error)
    return false
  }
}

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lon: number) => void
}

const MapClickHandler = ({ onLocationSelect }: MapClickHandlerProps) => {
  const map = useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

const LocationSearch = () => {
  const [showMap, setShowMap] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nearestCity, setNearestCity] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(null)
  const setLocation = useStore((state) => state.setLocation)

  const handleGeolocation = useCallback(async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })

      const { latitude, longitude } = position.coords

      if (!isInFrance(latitude, longitude)) {
        setError("Vous devez être en France pour utiliser cette application")
        return
      }

      const cityName = await getNearestCity(latitude, longitude)
      setNearestCity(cityName)
      setSelectedLocation({ lat: latitude, lon: longitude })
      setLocation(latitude, longitude)
    } catch (error) {
      setError("Impossible de vous localiser")
    }
  }, [setLocation])

  const handleLocationSelect = useCallback(async (lat: number, lon: number) => {
    console.log('Point sélectionné:', { lat, lon })
    
    // Vérifier si le point est en France
    if (!isInFrance(lat, lon)) {
      setError('Veuillez sélectionner un point en France')
      return
    }

    try {
      // Récupérer le nom de la commune
      const cityName = await getNearestCity(lat, lon)
      setNearestCity(cityName)
      setSelectedLocation({ lat, lon })

      // Mettre à jour la location dans le store
      console.log('Mise à jour de la location dans le store:', { lat, lon })
      setLocation(lat, lon)
    } catch (error) {
      console.error('Erreur lors de la sélection du point:', error)
      setError('Une erreur est survenue, veuillez réessayer')
    }
  }, [setLocation, setError])

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <button
          onClick={() => setShowMap(!showMap)}
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
          <span>{showMap ? "Masquer la carte" : "Afficher la carte"}</span>
        </button>
        <button
          onClick={handleGeolocation}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Me localiser
        </button>
      </div>

      {error && (
        <div className="error-popup animate-fade-out bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {nearestCity && (
        <div className="text-center text-gray-600 font-medium">
          {nearestCity}
        </div>
      )}

      {showMap && (
        <div className="h-[400px] w-full rounded-lg overflow-hidden">
          <MapContainer
            center={[46.603354, 1.888334]}
            zoom={6}
            minZoom={5}
            maxZoom={13}
            maxBounds={FRANCE_BOUNDS}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {selectedLocation && (
              <Marker position={[selectedLocation.lat, selectedLocation.lon]}>
                <Popup>
                  {nearestCity}
                </Popup>
              </Marker>
            )}
            <MapClickHandler onLocationSelect={handleLocationSelect} />
          </MapContainer>
        </div>
      )}
    </div>
  )
}

export default LocationSearch 