import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { fetchWeatherData } from '../services/weatherService';
import { 
  calculateWaveHeightScore, 
  calculateWindScore, 
  calculateWavePeriodScore, 
  calculateTemperatureScore, 
  calculateWavePowerScore,
  ScoreCircle
} from './SurfScore';
import CalendarPopup from './CalendarPopup';

// Fonction utilitaire pour formater la date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', { 
    weekday: 'short', 
    day: 'numeric',
    month: 'short'
  }).format(date);
};

// Fonction pour obtenir une icône basée sur le code météo
const getWeatherIcon = (weatherCode: number) => {
  // Codes basés sur la documentation Open-Meteo
  if (weatherCode <= 3) return '☀️'; // Ciel dégagé à partiellement nuageux
  if (weatherCode <= 49) return '☁️'; // Nuageux ou brumeux
  if (weatherCode <= 69) return '🌧️'; // Pluie
  if (weatherCode <= 79) return '❄️'; // Neige
  if (weatherCode <= 99) return '⛈️'; // Orage
  return '🌡️'; // Par défaut
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
  const [calendarPopup, setCalendarPopup] = useState<{
    show: boolean;
    date: string;
    forecasts: {
      temperature: number;
      waveHeight: number;
      score: number;
    };
  }>({
    show: false,
    date: '',
    forecasts: { temperature: 0, waveHeight: 0, score: 0 }
  });

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

  // Fonction pour ouvrir la popup de confirmation
  const handleAddToCalendar = (date: string, index: number) => {
    if (!forecastData) return;
    
    setCalendarPopup({
      show: true,
      date: date,
      forecasts: {
        temperature: forecastData.temperatures[index],
        waveHeight: forecastData.waveHeights[index],
        score: forecastData.scores[index]
      }
    });
  };

  // Fonction pour fermer la popup
  const handleClosePopup = () => {
    setCalendarPopup(prev => ({ ...prev, show: false }));
  };

  if (!location) {
    return null;
  }

  if (loading) {
    return <div className="text-center p-4">Chargement des prévisions...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!forecastData || forecastData.dates.length === 0) {
    return <div className="text-center p-4">Aucune prévision disponible</div>;
  }

  return (
    <>
      <div className="mt-8 bg-white rounded-xl p-4 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-sky-800 text-center">Prévisions sur 7 jours</h2>
        
        <div className="overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            {forecastData.dates.map((date, index) => (
              <div key={date} className="flex-shrink-0 w-24 p-2 bg-gradient-to-br from-white to-sky-50 rounded-lg border border-sky-100 text-center">
                <div className="font-medium text-sky-700 text-sm mb-1">{formatDate(date)}</div>
                
                <ForecastScoreCircle score={forecastData.scores[index]} />
                
                <div className="flex items-center justify-center mt-2 space-x-1">
                  <span className="text-xl">{getWeatherIcon(forecastData.weatherCodes[index])}</span>
                  <span className="font-bold text-sky-700">{forecastData.temperatures[index].toFixed(1)}°C</span>
                </div>
                
                <div className="mt-2 text-sm font-medium text-sky-600">
                  {forecastData.waveHeights[index].toFixed(1)}m
                </div>
                
                {/* Bouton pour ajouter au calendrier */}
                <button 
                  onClick={() => handleAddToCalendar(date, index)}
                  className="mt-2 w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 mx-auto text-sm"
                  title="Ajouter à l'agenda"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popup de confirmation pour l'ajout au calendrier */}
      {calendarPopup.show && forecastData && (
        <CalendarPopup
          onClose={handleClosePopup}
          forecast={{ date: calendarPopup.date }}
          waveHeight={calendarPopup.forecasts.waveHeight}
          wavePeriod={forecastData.wavePeriods[forecastData.dates.findIndex(d => d === calendarPopup.date)]}
          waveDirection={0} // À remplacer par la vraie valeur si disponible
          windSpeed={forecastData.windSpeeds[forecastData.dates.findIndex(d => d === calendarPopup.date)]}
          windDirection={0} // À remplacer par la vraie valeur si disponible
          airTemp={calendarPopup.forecasts.temperature}
          waterTemp={forecastData.waterTemps[forecastData.dates.findIndex(d => d === calendarPopup.date)]}
          totalScore={calendarPopup.forecasts.score}
          city={location ? getNearestCityName(location.lat, location.lon) : "Spot de surf"}
        />
      )}
    </>
  );
};

// Fonction pour obtenir le nom de la ville la plus proche (simplifiée)
const getNearestCityName = (lat: number, lon: number): string => {
  // Cette fonction pourrait être améliorée avec une API de géocodage inversé
  // Mais pour l'instant, nous retournons juste une valeur par défaut
  return "Spot de surf";
};

export default ForecastDisplay; 