interface GeocodingResponse {
  address: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
  };
}

export const getCityFromCoordinates = async (lat: number, lon: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          'User-Agent': 'SurfScore/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Erreur lors de la requête Nominatim');
    }

    const data: GeocodingResponse = await response.json();
    const address = data.address;
    
    return address.city || address.town || address.village || address.county || 'Inconnu';
  } catch (error) {
    console.error('Erreur de géocodage inversé:', error);
    return 'Erreur';
  }
}; 