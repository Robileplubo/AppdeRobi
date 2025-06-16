import { useEffect, useState } from 'react';
import { getCityFromCoordinates } from '../services/geocodingService';

interface CityDisplayProps {
  lat: number;
  lon: number;
  className?: string;
}

export const CityDisplay: React.FC<CityDisplayProps> = ({ lat, lon, className = '' }) => {
  const [city, setCity] = useState<string>('');

  useEffect(() => {
    const fetchCity = async () => {
      const cityName = await getCityFromCoordinates(lat, lon);
      setCity(cityName);
    };

    if (lat && lon) {
      fetchCity();
    }
  }, [lat, lon]);

  if (!lat || !lon) return null;

  return (
    <div className={className}>
      {city && <span>{city}</span>}
    </div>
  );
}; 