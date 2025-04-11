/**
 * Utilitaires pour la gestion des emplacements
 */

/**
 * Interface pour les réponses de Nominatim
 */
interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
  name?: string;
}

/**
 * Récupère le nom de la commune à partir des coordonnées
 * @param lat Latitude
 * @param lon Longitude
 * @returns Promise avec le nom de la commune
 */
export const getCityName = async (lat: number, lon: number): Promise<string> => {
  try {
    // Utiliser directement l'API, avec un timeout court pour ne pas bloquer l'interface
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    
    console.log("Tentative de récupération du nom de ville pour:", lat, lon);
    
    // Créer un contrôleur d'abandon pour limiter le temps d'attente
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 secondes de timeout
    
    // Effectuer la requête avec l'en-tête User-Agent approprié
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SurfScore/1.0',
        'Accept-Language': 'fr'
      },
      signal: controller.signal
    }).catch(err => {
      console.error("Erreur de fetch:", err);
      clearTimeout(timeoutId);
      return null;
    });
    
    clearTimeout(timeoutId);
    
    if (!response || !response.ok) {
      console.error("Erreur HTTP:", response?.status, response?.statusText);
      // Utiliser la fonction offline en cas d'erreur HTTP
      return getLocationNameOffline(lat, lon);
    }
    
    const data: NominatimResponse = await response.json();
    console.log("Données Nominatim reçues:", data);
    
    // Extraire le nom de la commune à partir de la réponse
    if (data.address) {
      const cityName = data.address.city || 
             data.address.town || 
             data.address.village || 
             data.address.municipality || 
             data.address.county ||
             data.display_name.split(',')[0];
      
      console.log("Nom de ville trouvé:", cityName);
      return cityName;
    }
    
    // Si aucun détail d'adresse n'est disponible, utiliser le début du nom complet
    const locationName = data.display_name.split(',')[0];
    console.log("Nom de lieu extrait du display_name:", locationName);
    return locationName;
  } catch (error) {
    console.error('Erreur de géocodage inversé:', error);
    // Utiliser la méthode offline en cas d'erreur
    return getLocationNameOffline(lat, lon);
  }
};

/**
 * Fonction simplifiée pour obtenir le nom de l'emplacement (peut être utilisée pour le développement sans requêtes réseau)
 */
export const getLocationNameOffline = (lat: number, lon: number): string => {
  console.log("Utilisation du mode offline pour les coordonnées:", lat, lon);
  
  // France metropolitaine
  if (lat >= 41 && lat <= 51.5 && lon >= -5 && lon <= 10) {
    // Côte atlantique
    if (lon < 0) return "Côte Atlantique";
    // Côte méditerranéenne
    if (lat < 44 && lon > 3) return "Côte Méditerranéenne";
    // Bretagne
    if (lat > 47.5 && lon < 2) return "Bretagne";
    // Normandie
    if (lat > 48.5 && lon > 0) return "Normandie";
    
    // Régions spécifiques
    if (lat > 48.8 && lat < 49 && lon > 2.2 && lon < 2.4) return "Paris";
    if (lat > 43.2 && lat < 43.4 && lon > 5.3 && lon < 5.5) return "Marseille";
    if (lat > 45.7 && lat < 45.8 && lon > 4.8 && lon < 4.9) return "Lyon";
    if (lat > 43.6 && lat < 43.7 && lon > 1.4 && lon < 1.5) return "Toulouse";
    if (lat > 47.2 && lat < 47.3 && lon > -1.6 && lon < -1.5) return "Nantes";
    if (lat > 44.8 && lat < 44.9 && lon > -0.6 && lon < -0.5) return "Bordeaux";
    
    return "France";
  }
  
  // Autres régions du monde
  if (lat > 35 && lat < 43 && lon > -10 && lon < -5) return "Portugal";
  if (lat > 35 && lat < 45 && lon > -10 && lon < 3 && lon < 0) return "Espagne";
  if (lat > 50 && lat < 59 && lon > -11 && lon < -1) return "Royaume-Uni";
  if (lat > 36 && lat < 47 && lon > 7 && lon < 19) return "Italie";
  
  // Spot générique par défaut
  return "Spot de surf";
}; 