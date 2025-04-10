/**
 * Utilitaire pour adapter l'application au déploiement Vercel
 */

/**
 * Obtient la base URL pour les ressources statiques en fonction de l'environnement
 */
export const getBaseUrl = (): string => {
  if (import.meta.env.DEV) {
    return '';
  }
  // Vercel expose automatiquement VERCEL_URL qui contient le déploiement URL
  return import.meta.env.VERCEL_URL 
    ? `https://${import.meta.env.VERCEL_URL}` 
    : '';
};

/**
 * Obtient l'URL complète pour une ressource statique
 */
export const getAssetUrl = (path: string): string => {
  const baseUrl = getBaseUrl();
  // S'assurer que le chemin commence par un slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Vérifie si l'environnement est en production
 */
export const isProduction = (): boolean => {
  return import.meta.env.PROD === true;
};

/**
 * Fonction pour préparer une URL d'API avec proxy CORS si nécessaire
 */
export const prepareApiUrl = (url: string): string => {
  if (import.meta.env.DEV) {
    return url;
  }
  
  // En production sur Vercel, utiliser le proxy
  if (url.includes('marine-api.open-meteo.com')) {
    return url.replace('https://marine-api.open-meteo.com', '/api');
  }
  
  return url;
}; 