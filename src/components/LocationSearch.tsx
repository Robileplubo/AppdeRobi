import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useStore } from "../store/useStore";
import { MapPinIcon } from "@heroicons/react/24/outline";

// Configuration de l'icône par défaut de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Composant pour gérer les clics sur la carte
const MapClickHandler = ({ onMapClick }: { onMapClick: (e: L.LeafletMouseEvent) => void }) => {
  useMapEvents({
    click: onMapClick,
  });
  return null;
};

const LocationSearch = () => {
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [nearestCity, setNearestCity] = useState<string | null>(null);
  const setLocation = useStore((state) => state.setLocation);

  const getNearestCity = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
      );
      const data = await response.json();
      
      // Tenter d'obtenir le nom de la ville/village/etc.
      const locationName = data.address?.city || data.address?.town || data.address?.village;
      
      // Si un nom d'océan ou de mer est disponible, l'utiliser
      const oceanName = data.address?.ocean || data.address?.sea;
      
      if (locationName) {
        return locationName;
      } else if (oceanName) {
        return oceanName;
      } else {
        // Si aucun nom n'est trouvé, c'est probablement en mer
        return "En mer";
      }
    } catch (error) {
      return "En mer";
    }
  };

  const handleMapClick = async (e: L.LeafletMouseEvent) => {
    try {
      const { lat, lng } = e.latlng;
      
      // Récupérer le nom de la commune
      const cityName = await getNearestCity(lat, lng);
      setNearestCity(cityName);

      // Définir la position et l'envoyer au store
      setSelectedLocation({ lat, lon: lng });
      setLocation({ lat, lon: lng });
    } catch (error) {
      setError("Erreur lors de la sélection de l'emplacement");
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur");
      setTimeout(() => setError(null), 5000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Récupérer le nom de la commune
        const cityName = await getNearestCity(latitude, longitude);
        setNearestCity(cityName);

        // Définir la position et l'envoyer au store
        setSelectedLocation({ lat: latitude, lon: longitude });
        setLocation({ lat: latitude, lon: longitude });
      },
      (error) => {
        setError("Impossible d'obtenir votre position");
        setTimeout(() => setError(null), 5000);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-4">
      {/* Bouton de géolocalisation centré */}
      <div className="flex justify-center">
        <button
          onClick={handleGeolocation}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <MapPinIcon className="h-5 w-5" />
          <span>Me localiser</span>
        </button>
      </div>

      {error && (
        <div className="error-popup animate-fade-out bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {nearestCity && (
        <div className="text-center text-gray-600">
          {nearestCity}
        </div>
      )}

      {/* Carte toujours affichée */}
      <div className="h-[400px] w-full rounded-lg overflow-hidden">
        <MapContainer
          center={[46.603354, 1.888334]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
          minZoom={5}
          maxZoom={15}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lon]}>
              <Popup>Position sélectionnée</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default LocationSearch; 