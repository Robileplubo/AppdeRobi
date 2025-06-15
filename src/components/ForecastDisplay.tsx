import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { fetchWeatherData } from '../services/weatherService';
import { 
  calculateWaveHeightScore, 
  calculateWindScore, 
  calculateWavePeriodScore, 
  calculateTemperatureScore, 
  calculateWavePowerScore,
} from './SurfScore';

// Fonction utilitaire pour formater la date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', { 
    weekday: 'short', 
    day: 'numeric',
    month: 'short'
  }).format(date);
};

// Formater la date pour Google Calendar
const formatCalendarDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// Formater l'heure pour Google Calendar
const formatCalendarTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}${minutes}00`;
};

// Fonction pour obtenir une icône basée sur le code météo
const getWeatherIcon = (weatherCode: number) => {
  // Chemins des icônes
  const sunIcon = '/graphic/sun.png';
  const cloudIcon = '/graphic/cloud.png'; // Note: cette icône n'est pas listée, utiliser un fallback
  const rainIcon = '/graphic/rain.png';
  const snowIcon = '/graphic/snow.png';
  const stormIcon = '/graphic/storm.png';
  
  // Codes basés sur la documentation Open-Meteo
  if (weatherCode <= 3) return sunIcon; // Ciel dégagé à partiellement nuageux
  if (weatherCode <= 49) return cloudIcon; // Nuageux ou brumeux
  if (weatherCode <= 69) return rainIcon; // Pluie
  if (weatherCode <= 79) return snowIcon; // Neige
  if (weatherCode <= 99) return stormIcon; // Orage
  return sunIcon; // Par défaut
};

// Fonction pour calculer le score total de surf
const calculateTotalScore = (
  waveHeight: number,
  wavePeriod: number,
  wavePower: number,
  windSpeed: number,
  airTemp: number,
  waterTemp: number
): number => {
  const heightScore = calculateWaveHeightScore(waveHeight);
  const windScore = calculateWindScore(windSpeed);
  const periodScore = calculateWavePeriodScore(wavePeriod);
  const temperatureScore = calculateTemperatureScore(airTemp, waterTemp);
  const powerScore = calculateWavePowerScore(wavePower);
  
  // Calculer le score total (somme des scores individuels)
  const totalScore = Math.round(heightScore + windScore + periodScore + temperatureScore + powerScore);
  
  // S'assurer que le score total n'est pas NaN
  return isNaN(totalScore) ? 0 : totalScore;
};

// Composant de cercle de score modifié sans le texte "Score de surf"
const ForecastScoreCircle = ({ score, size = 60 }: { score: number, size?: number }) => {
  // Déterminer la couleur en fonction du score
  let color = 'text-red-500';
  if (score >= 70) color = 'text-green-500';
  else if (score >= 50) color = 'text-yellow-500';
  else if (score >= 30) color = 'text-orange-500';
  
  // Calculer le pourcentage pour le cercle
  const percentage = score;
  const radius = size / 2 - 5;
  const dashArray = 2 * Math.PI * radius;
  const dashOffset = dashArray - (dashArray * percentage) / 100;
  
  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size/2}
          cy={size/2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="4"
        />
        <circle
          cx={size/2}
          cy={size/2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          className={color}
        />
        <text
          x={size/2}
          y={size/2 + 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-lg font-bold"
        >
          {score}
        </text>
      </svg>
    </div>
  );
};

const ForecastDisplay = () => {
  const { location } = useStore();
  const [forecastData, setForecastData] = useState<{
    dates: string[];
    waveHeights: number[];
    wavePeriods: number[];
    wavePowers: number[];
    temperatures: number[];
    waterTemps: number[];
    windSpeeds: number[];
    weatherCodes: number[];
    scores: number[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string>('Spot de surf');

  useEffect(() => {
    const fetchForecast = async () => {
      if (!location) {
        setForecastData(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchWeatherData(location.lat, location.lon);

        // Vérifier si les données marines sont disponibles
        if (!data.hourly?.wave_height || data.hourly.wave_height.length === 0 || 
            data.hourly.wave_height.every((val: any) => val === null || val === 0)) {
          setError('Aucune donnée marine pour cette position');
          setLoading(false);
          return;
        }

        if (!data.hourly?.time || data.hourly.time.length === 0) {
          setError('Aucune donnée de prévision disponible');
          setLoading(false);
          return;
        }

        // Extraire les données pour chaque jour (à 12h)
        const dailyData: {
          dates: string[];
          waveHeights: number[];
          wavePeriods: number[];
          wavePowers: number[];
          temperatures: number[];
          waterTemps: number[];
          windSpeeds: number[];
          weatherCodes: number[];
          scores: number[];
        } = {
          dates: [],
          waveHeights: [],
          wavePeriods: [],
          wavePowers: [],
          temperatures: [],
          waterTemps: [],
          windSpeeds: [],
          weatherCodes: [],
          scores: []
        };

        // Supposons que les données sont triées chronologiquement
        // Nous voulons une entrée par jour, donc on prend les indices 12, 36, 60, etc. (12h chaque jour)
        for (let i = 12; i < Math.min(168, data.hourly.time.length); i += 24) {
          const date = data.hourly.time?.[i];
          
          // Vérifier si la date existe et l'ajouter
          if (date) {
            // Récupérer les données correspondantes pour cette heure
            const waveHeight = data.hourly.wave_height?.[i] ?? 0;
            const wavePeriod = data.hourly.wave_period?.[i] ?? 0;
            const wavePower = data.hourly.wave_power?.[i] ?? 0;
            const airTemp = data.hourly.temperature_2m?.[i] ?? 0;
            const waterTemp = data.hourly.sea_surface_temperature?.[i] ?? 0;
            const windSpeed = data.hourly.wind_speed_10m?.[i] ?? 0;
            const weatherCode = data.hourly.weathercode?.[i] ?? 0;
            
            // Calculer le score pour ce jour
            const score = calculateTotalScore(
              waveHeight,
              wavePeriod,
              wavePower,
              windSpeed,
              airTemp,
              waterTemp
            );
            
            // Ajouter toutes les données au tableau
            dailyData.dates.push(date);
            dailyData.waveHeights.push(waveHeight);
            dailyData.wavePeriods.push(wavePeriod);
            dailyData.wavePowers.push(wavePower);
            dailyData.temperatures.push(airTemp);
            dailyData.waterTemps.push(waterTemp);
            dailyData.windSpeeds.push(windSpeed);
            dailyData.weatherCodes.push(weatherCode);
            dailyData.scores.push(score);
          }
        }

        setForecastData(dailyData);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des prévisions:', err);
        setError('Impossible de charger les prévisions');
        setLoading(false);
      }
    };

    fetchForecast();
  }, [location]);

  useEffect(() => {
    const fetchCity = async () => {
      if (location) {
        const name = await getNearestCityName(location.lat, location.lon);
        setCityName(name);
      }
    };
    fetchCity();
  }, [location]);

  // Fonction pour ajouter directement au calendrier Google
  const handleAddToCalendar = (date: string, index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!forecastData) return;
    
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 3); // Session de surf de 3 heures
    
    const locationName = cityName;
    
    // Préparer les données pour l'événement
    const title = `Session de surf à ${locationName}`;
    const description = `Conditions de surf à ${locationName}:

Score: ${forecastData.scores[index]}/100
Hauteur des vagues: ${forecastData.waveHeights[index].toFixed(1)}m
Période: ${forecastData.wavePeriods[index].toFixed(1)}s
Vent: ${forecastData.windSpeeds[index].toFixed(1)}km/h
Température: ${forecastData.temperatures[index].toFixed(1)}°C
Température de l'eau: ${forecastData.waterTemps[index].toFixed(1)}°C`;
    
    // Formater les dates pour l'URL
    const formattedStartDate = formatCalendarDate(startDate);
    const formattedEndDate = formatCalendarDate(endDate);
    const formattedStartTime = formatCalendarTime(startDate);
    const formattedEndTime = formatCalendarTime(endDate);
    
    // Créer l'URL pour Google Calendar
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formattedStartDate}T${formattedStartTime}Z/${formattedEndDate}T${formattedEndTime}Z&details=${encodeURIComponent(description)}&location=${encodeURIComponent(locationName)}&sprop=&sprop=name:`;
    
    // Ouvrir l'URL dans un nouvel onglet
    window.open(googleUrl, '_blank');
  };

  if (!location) {
    return null;
  }

  return (
    <>
      {loading ? (
        <div className="text-center p-4">
          <div className="flex justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="mt-2 text-slate-600 text-sm">Chargement des prévisions...</p>
        </div>
      ) : error ? (
        <div className="text-center p-4">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      ) : !forecastData || forecastData.dates.length === 0 ? (
        <div className="text-center p-4">
          <p className="text-slate-600 text-sm">Aucune prévision disponible</p>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-center text-slate-800">Prévisions sur 7 jours</h2>
          
          <div className="mobile-forecast-scroll">
            <div className="flex">
              {forecastData.dates.map((date, index) => (
                <div key={date} className="mobile-forecast-item">
                  <div className="font-medium text-sky-700 text-xs mb-1 whitespace-nowrap overflow-hidden text-ellipsis">{formatDate(date)}</div>
                  
                  <ForecastScoreCircle score={forecastData.scores[index]} size={50} />
                  
                  <div className="mt-2 flex flex-col items-center">
                    <img 
                      src={getWeatherIcon(forecastData.weatherCodes[index])} 
                      alt="Weather icon" 
                      className="w-6 h-6 mb-1"
                    />
                    <span className="font-medium text-slate-800 text-sm">{forecastData.temperatures[index].toFixed(1)}°C</span>
                  </div>
                  
                  <div className="mt-2 text-sm text-sky-600 font-medium">
                    {forecastData.waveHeights[index].toFixed(1)}m
                  </div>
                  
                  <button 
                    onClick={(e) => handleAddToCalendar(date, index, e)}
                    className="mt-2 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600"
                    title="Ajouter à l'agenda"
                  >
                    <img src="/graphic/calendar.png" alt="Calendar" className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const getNearestCityName = async (lat: number, lon: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
    );
    const data = await response.json();
    return data.display_name || 'Lieu inconnu';
  } catch (error) {
    console.error('Erreur lors de la récupération du nom de la ville:', error);
    return 'Lieu inconnu';
  }
};

export default ForecastDisplay; 