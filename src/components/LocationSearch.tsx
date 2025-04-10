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

// Fonction pour calculer la distance entre deux points en km (formule de Haversine)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

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

  // Fonction pour trouver la commune la plus proche
  const findNearestCity = async (lat: number, lon: number): Promise<{name: string, distance: number}> => {
    try {
      // Utiliser l'API Nominatim pour trouver les communes à proximité
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=city&limit=10&addressdetails=1&viewbox=${lon-0.5},${lat-0.5},${lon+0.5},${lat+0.5}`
      );
      const data = await response.json();
      
      if (!data || data.length === 0) {
        return { name: "En mer", distance: Infinity };
      }
      
      // Calculer la distance pour chaque commune et trouver la plus proche
      let nearestCity = { name: "En mer", distance: Infinity };
      
      for (const place of data) {
        if (place.type === "city" || place.type === "town" || place.type === "village") {
          const distance = calculateDistance(lat, lon, parseFloat(place.lat), parseFloat(place.lon));
          if (distance < nearestCity.distance) {
            nearestCity = {
              name: place.display_name.split(",")[0],
              distance: distance
            };
          }
        }
      }
      
      return nearestCity;
    } catch (error) {
      console.error("Erreur lors de la recherche de la commune la plus proche:", error);
      return { name: "En mer", distance: Infinity };
    }
  };

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
        // Si on est en mer, chercher la commune la plus proche
        const nearestCity = await findNearestCity(lat, lon);
        
        // Si la commune la plus proche est à moins de 20 km, l'afficher
        if (nearestCity.distance <= 20) {
          return `${nearestCity.name} (à ${nearestCity.distance.toFixed(1)} km)`;
        }
        
        return oceanName;
      } else {
        // Si aucun nom n'est trouvé, c'est probablement en mer
        // Chercher la commune la plus proche
        const nearestCity = await findNearestCity(lat, lon);
        
        // Si la commune la plus proche est à moins de 20 km, l'afficher
        if (nearestCity.distance <= 20) {
          return `${nearestCity.name} (à ${nearestCity.distance.toFixed(1)} km)`;
        }
        
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
          className="bg-sky-400 text-white px-6 py-2 rounded-full hover:bg-sky-500 transition-colors flex items-center space-x-2 shadow-sm text-sm font-medium"
        >
          <MapPinIcon className="h-5 w-5" />
          <span>Me localiser</span>
        </button>
      </div>

      {error && (
        <div className="error-popup animate-fade-out bg-red-400 text-white px-4 py-2 rounded-lg shadow-sm text-sm">
          {error}
        </div>
      )}

      {nearestCity && (
        <div className="text-center">
          <span className="text-sky-700 font-medium bg-white px-4 py-2 rounded-full shadow-sm inline-block">
            {nearestCity}
          </span>
        </div>
      )}

      {/* Carte carrée */}
      <div className="aspect-square w-full rounded-xl overflow-hidden shadow-sm border border-sky-50">
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