import React from 'react';
import { atcb_action } from 'add-to-calendar-button';
import { Forecast } from '../types/weather';
import { formatDate, formatDateForDisplay } from '../utils/dateUtils';
import './CalendarPopup.css';

interface CalendarPopupProps {
  onClose: () => void;
  forecast: Forecast;
  waveHeight: number;
  wavePeriod: number;
  waveDirection: number;
  windSpeed: number;
  windDirection: number;
  airTemp: number;
  waterTemp: number;
  totalScore: number;
  city: string;
}

const CalendarPopup: React.FC<CalendarPopupProps> = ({
  onClose,
  forecast,
  waveHeight,
  wavePeriod,
  waveDirection,
  windSpeed,
  windDirection,
  airTemp,
  waterTemp,
  totalScore,
  city
}) => {
  const handleAddToCalendar = () => {
    const forecastDate = new Date(forecast.date);
    const endDate = new Date(forecastDate);
    endDate.setHours(endDate.getHours() + 3); // Session de surf de 3 heures
    
    const formattedDate = formatDate(forecastDate);
    const formattedEndDate = formatDate(endDate);
    
    const startTime = `${forecastDate.getHours().toString().padStart(2, '0')}:${forecastDate.getMinutes().toString().padStart(2, '0')}`;
    const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
    
    const description = `
      Conditions de surf à ${city}:
      
      Score total: ${totalScore}/100
      Hauteur des vagues: ${waveHeight.toFixed(1)}m
      Période des vagues: ${wavePeriod.toFixed(1)}s
      Direction des vagues: ${waveDirection}°
      Vitesse du vent: ${windSpeed.toFixed(1)}km/h
      Direction du vent: ${windDirection}°
      Température de l'air: ${airTemp.toFixed(1)}°C
      Température de l'eau: ${waterTemp.toFixed(1)}°C
    `;
    
    atcb_action({
      name: `Session de surf à ${city}`,
      description,
      startDate: formattedDate,
      endDate: formattedEndDate,
      startTime,
      endTime,
      location: city,
      options: ["Google", "Apple", "iCal", "Outlook.com"],
      timeZone: 'Europe/Paris',
      iCalFileName: `surf-session-${city}-${formattedDate}`,
    });
  };

  return (
    <div className="calendar-popup-overlay">
      <div className="calendar-popup">
        <h2>Ajouter au calendrier</h2>
        
        <div className="calendar-details">
          <p><strong>Date:</strong> {forecast.date instanceof Date ? formatDateForDisplay(forecast.date) : formatDateForDisplay(new Date(forecast.date))}</p>
          <p><strong>Lieu:</strong> {city}</p>
          <p><strong>Score:</strong> {totalScore}/100</p>
          <p><strong>Hauteur des vagues:</strong> {waveHeight.toFixed(1)}m</p>
        </div>
        
        <div className="calendar-buttons">
          <button onClick={handleAddToCalendar} className="add-button">
            Ajouter au calendrier
          </button>
          <button onClick={onClose} className="cancel-button">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarPopup; 