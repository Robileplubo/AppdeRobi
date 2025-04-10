import React from 'react';
import { Forecast } from '../types/weather';

interface CalendarPopupProps {
  onClose: () => void;
  forecast: Forecast;
  waveHeight: number;
  wavePeriod: number;
  windSpeed: number;
  temperature: number;
  waterTemp: number;
  score: number;
  location: string;
}

const CalendarPopup: React.FC<CalendarPopupProps> = ({
  onClose,
  forecast,
  waveHeight,
  wavePeriod,
  windSpeed,
  temperature,
  waterTemp,
  score,
  location
}) => {
  // Formater la date pour l'affichage
  const formatDisplayDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Formater la date pour l'utilisation dans le calendrier
  const formatCalendarDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };
  
  // Formater l'heure pour l'utilisation dans le calendrier
  const formatCalendarTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}${minutes}00`;
  };

  // Gérer l'ajout au calendrier
  const handleAddToCalendar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startDate = new Date(forecast.date);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 3); // Session de surf de 3 heures
    
    // Créer les données d'événement au format iCalendar
    const title = `Session de surf à ${location}`;
    const description = `Conditions de surf à ${location}:\n\nScore: ${score}/100\nHauteur des vagues: ${waveHeight.toFixed(1)}m\nPériode: ${wavePeriod.toFixed(1)}s\nVent: ${windSpeed.toFixed(1)}km/h\nTempérature: ${temperature.toFixed(1)}°C\nTempérature de l'eau: ${waterTemp.toFixed(1)}°C`;
    
    // Formater les dates pour l'URL
    const formattedStartDate = formatCalendarDate(startDate);
    const formattedEndDate = formatCalendarDate(endDate);
    const formattedStartTime = formatCalendarTime(startDate);
    const formattedEndTime = formatCalendarTime(endDate);
    
    // Créer l'URL pour Google Calendar
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formattedStartDate}T${formattedStartTime}Z/${formattedEndDate}T${formattedEndTime}Z&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}&sprop=&sprop=name:`;
    
    // Ouvrir l'URL dans un nouvel onglet
    window.open(googleUrl, '_blank');
    
    // Fermer la popup
    onClose();
  };
  
  // Gérer l'annulation
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  // Empêcher les clics de se propager
  const handlePopupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div 
        className="w-[90%] max-w-md bg-white rounded-xl p-5 shadow-lg"
        onClick={handlePopupClick}
      >
        <h2 className="text-xl font-bold mb-4 text-sky-800 text-center">
          Ajouter au calendrier
        </h2>
        
        <div className="mb-4 bg-sky-50 p-3 rounded-lg">
          <p className="mb-1">
            <span className="font-semibold text-sky-800">Date:</span> {formatDisplayDate(forecast.date)}
          </p>
          <p className="mb-1">
            <span className="font-semibold text-sky-800">Lieu:</span> {location}
          </p>
          <p>
            <span className="font-semibold text-sky-800">Score:</span> {score}/100
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="text-center bg-slate-50 p-2 rounded-lg">
            <p className="text-lg font-semibold">{waveHeight.toFixed(1)}m</p>
            <p className="text-xs text-slate-500">Hauteur</p>
          </div>
          <div className="text-center bg-slate-50 p-2 rounded-lg">
            <p className="text-lg font-semibold">{wavePeriod.toFixed(1)}s</p>
            <p className="text-xs text-slate-500">Période</p>
          </div>
          <div className="text-center bg-slate-50 p-2 rounded-lg">
            <p className="text-lg font-semibold">{temperature.toFixed(1)}°C</p>
            <p className="text-xs text-slate-500">Température</p>
          </div>
          <div className="text-center bg-slate-50 p-2 rounded-lg">
            <p className="text-lg font-semibold">{windSpeed.toFixed(1)}km/h</p>
            <p className="text-xs text-slate-500">Vent</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={handleAddToCalendar}
            className="w-full bg-sky-500 text-white py-3 px-4 rounded-lg font-medium active:bg-sky-600 touch-manipulation"
            type="button"
          >
            Ajouter à Google Calendar
          </button>
          
          <button
            onClick={handleCancel}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium active:bg-gray-200 touch-manipulation"
            type="button"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarPopup; 