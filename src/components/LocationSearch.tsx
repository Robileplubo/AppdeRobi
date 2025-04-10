import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useStore } from "../store/useStore";
import { MapPinIcon } from "@heroicons/react/24/outline";

// Créer une icône personnalisée pour le marqueur
const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzM4YmRmOCIgc3Ryb2tlPSJub25lIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLW1hcC1waW4iPjxwYXRoIGQ9Ik0yMSAxMWMwIDctOSAxMy05IDEzcy05LTYtOS0xM2E5IDkgMCAwIDEgMTggMHoiPjwvcGF0aD48Y2lyY2xlIGN4PSIxMiIgY3k9IjEwIiByPSIzIiBmaWxsPSJ3aGl0ZSI+PC9jaXJjbGU+PC9zdmc+',
  iconSize: [38, 45],
  iconAnchor: [19, 45],
  popupAnchor: [0, -45]
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
  const setLocation = useStore((state) => state.setLocation);

  const handleMapClick = async (e: L.LeafletMouseEvent) => {
    try {
      const { lat, lng } = e.latlng;
      
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
        
        // Définir la position et l'envoyer au store
        setSelectedLocation({ lat: latitude, lon: longitude });
        setLocation({ lat: latitude, lon: longitude });
      },
      (_error) => {
        setError("Impossible d'obtenir votre position");
        setTimeout(() => setError(null), 5000);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return (
    <>
      {error && (
        <div className="error-popup animate-fade-out bg-red-400 text-white px-4 py-2 rounded-lg shadow-sm text-sm">
          {error}
        </div>
      )}

      {/* Carte en plein écran */}
      <MapContainer
        center={[46.603354, 1.888334]}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        minZoom={5}
        maxZoom={15}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler onMapClick={handleMapClick} />
        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lon]} icon={customIcon}>
            <Popup className="custom-popup">Spot sélectionné</Popup>
          </Marker>
        )}
      </MapContainer>
      
      {/* Bouton de géolocalisation flottant */}
      <button
        onClick={handleGeolocation}
        className="mobile-geolocation-button"
        aria-label="Me localiser"
      >
        <MapPinIcon className="h-6 w-6" />
      </button>
    </>
  );
};

export default LocationSearch; 