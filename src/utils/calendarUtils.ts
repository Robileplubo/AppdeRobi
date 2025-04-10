/**
 * Utilitaires pour générer des fichiers iCalendar (.ics)
 */

/**
 * Génère un identifiant unique pour un événement iCalendar
 */
const generateUID = (): string => {
  return 'surfscore-' + 
    Math.random().toString(36).substring(2, 15) + 
    Math.random().toString(36).substring(2, 15) + 
    '@surfscore.app';
};

/**
 * Formate une date au format iCalendar
 */
const formatICalDate = (date: Date): string => {
  return date.toISOString().replace(/-|:|\.\d+/g, '');
};

/**
 * Crée un événement iCalendar avec les prévisions de surf
 */
export const createSurfEvent = (
  date: string, 
  forecasts: { 
    temperature: number;
    waveHeight: number;
    score: number;
  }
): string => {
  // Convertir la date de prévision (qui est à midi) en objet Date
  const eventDate = new Date(date);
  
  // Définir la durée de l'événement (3 heures)
  const endDate = new Date(eventDate);
  endDate.setHours(eventDate.getHours() + 3);
  
  // Calculer la qualité des conditions de surf
  let surfQuality = 'mauvaises';
  if (forecasts.score >= 70) surfQuality = 'excellentes';
  else if (forecasts.score >= 50) surfQuality = 'bonnes';
  else if (forecasts.score >= 30) surfQuality = 'moyennes';
  
  // Formater la date pour l'affichage dans le titre
  const displayDate = new Intl.DateTimeFormat('fr-FR', { 
    day: 'numeric',
    month: 'short'
  }).format(eventDate);
  
  // Créer le contenu de l'événement
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SurfScore//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${generateUID()}`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${formatICalDate(eventDate)}`,
    `DTEND:${formatICalDate(endDate)}`,
    `SUMMARY:Session de surf - ${displayDate} (Score: ${forecasts.score})`,
    `DESCRIPTION:Prévisions de surf pour le ${displayDate}\\n` +
    `Score: ${forecasts.score}\\n` +
    `Hauteur des vagues: ${forecasts.waveHeight.toFixed(1)}m\\n` +
    `Température: ${forecasts.temperature.toFixed(1)}°C\\n\\n` +
    `Conditions ${surfQuality} pour le surf!`,
    'STATUS:CONFIRMED',
    'TRANSP:TRANSPARENT',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsContent;
};

/**
 * Télécharge un fichier iCalendar
 */
export const downloadICalFile = (icsContent: string, date: string): void => {
  // Créer un blob avec le contenu ics
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  
  // Créer une URL pour le blob
  const url = URL.createObjectURL(blob);
  
  // Extraire la date pour le nom du fichier
  const eventDate = new Date(date);
  const fileName = `surf_session_${eventDate.toISOString().split('T')[0]}.ics`;
  
  // Créer un lien de téléchargement et cliquer dessus
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  
  // Nettoyer
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}; 