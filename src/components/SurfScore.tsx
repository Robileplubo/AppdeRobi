import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { fetchWeatherData } from '../services/weatherService'
import ForecastDisplay from './ForecastDisplay'

// Export des fonctions de calcul pour les réutiliser dans ForecastDisplay
export const calculateWaveHeightScore = (height: number): number => {
  if (height === null || height === undefined || isNaN(height)) return 0;
  
  // +4 points pour chaque 0,10m de hauteur
  const score = height * 10 * 4; 
  // Limiter à 80 points maximum
  return Math.min(score, 80);
};

export const calculateWindScore = (windSpeed: number): number => {
  if (windSpeed === null || windSpeed === undefined || isNaN(windSpeed)) return 0;
  
  // Moins de vent est mieux
  if (windSpeed <= 5) return 5; // Idéal: vent très faible
  if (windSpeed >= 30) return 0; // Très mauvais: vent fort
  
  // Formule linéaire entre 5 et 30 km/h
  return 5 * (1 - (windSpeed - 5) / 25);
};

export const calculateWavePeriodScore = (period: number): number => {
  if (period === null || period === undefined || isNaN(period)) return 0;
  
  if (period < 4) return 0; // Trop court
  if (period > 18) return 0; // Trop long
  
  // Entre 8 et 14 secondes: score maximum
  if (period >= 8 && period <= 14) return 5;
  
  // Entre 4 et 8 secondes: croissance linéaire
  if (period < 8) return 5 * ((period - 4) / 4);
  
  // Entre 14 et 18 secondes: décroissance linéaire
  return 5 * (1 - (period - 14) / 4);
};

export const calculateTemperatureScore = (airTemp: number, waterTemp: number): number => {
  // La vérification des valeurs nulles est déjà faite avant l'appel de cette fonction
  
  // Différence entre températures (plus c'est proche, mieux c'est)
  const tempDifference = Math.abs(airTemp - waterTemp);
  let diffScore = 0;
  
  if (tempDifference <= 2) diffScore = 2.5;
  else if (tempDifference <= 5) diffScore = 1.5;
  else if (tempDifference <= 10) diffScore = 0.5;
  else diffScore = 0;
  
  // Niveau de température (plus c'est chaud, mieux c'est, jusqu'à un certain point)
  let tempLevelScore = 0;
  const avgTemp = (airTemp + waterTemp) / 2;
  
  if (avgTemp >= 22) tempLevelScore = 2.5;
  else if (avgTemp >= 18) tempLevelScore = 2;
  else if (avgTemp >= 15) tempLevelScore = 1.5;
  else if (avgTemp >= 10) tempLevelScore = 1;
  else tempLevelScore = 0.5;
  
  return diffScore + tempLevelScore;
};

export const calculateWavePowerScore = (power: number): number => {
  if (power === null || power === undefined || isNaN(power)) return 0;
  
  // La puissance idéale est entre 30 et 100
  if (power < 5) return 0; // Trop faible
  if (power > 200) return 0; // Trop puissant/dangereux
  
  if (power >= 30 && power <= 100) return 5; // Idéal
  
  if (power < 30) {
    // Croissance linéaire entre 5 et 30
    return 5 * ((power - 5) / 25);
  } else {
    // Décroissance linéaire entre 100 et 200
    return 5 * (1 - (power - 100) / 100);
  }
};

// Exporter le composant ScoreCircle pour réutilisation dans ForecastDisplay
export const ScoreCircle = ({ score, size = 120, fontSize = '3xl' }: { score: number, size?: number, fontSize?: string }) => {
  // Déterminer la couleur en fonction du score
  let color = 'text-red-500';
  if (score >= 70) color = 'text-green-500';
  else if (score >= 50) color = 'text-yellow-500';
  else if (score >= 30) color = 'text-orange-500';
  
  // Calculer le pourcentage pour le cercle
  const percentage = score;
  const radius = size / 2 - 15;
  const dashArray = 2 * Math.PI * radius;
  const dashOffset = dashArray - (dashArray * percentage) / 100;
  
  return (
    <div className="flex flex-col items-center justify-center mb-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size/2}
          cy={size/2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx={size/2}
          cy={size/2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          className={color}
        />
        <text
          x={size/2}
          y={size/2 + 5}
          textAnchor="middle"
          dominantBaseline="middle"
          className={`text-${fontSize} font-bold`}
        >
          {score}
        </text>
      </svg>
      <div className="mt-2 text-xl font-bold">Score de surf</div>
    </div>
  );
};

// Composant pour la pop-up
const Popup = ({ message, onClose }: { message: string; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
        <h3 className="text-xl font-bold mb-4 text-red-600">Attention</h3>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// Créer un nouveau composant cercle sans le texte "Score de surf" en dessous
const MainScoreCircle = ({ score }: { score: number }) => {
  // Déterminer la couleur en fonction du score
  let color = 'text-red-500';
  if (score >= 70) color = 'text-green-500';
  else if (score >= 50) color = 'text-yellow-500';
  else if (score >= 30) color = 'text-orange-500';
  
  // Calculer le pourcentage pour le cercle
  const percentage = score;
  const radius = 45;
  const dashArray = 2 * Math.PI * radius;
  const dashOffset = dashArray - (dashArray * percentage) / 100;
  
  return (
    <div className="flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 60 60)"
          className={color}
        />
        <text
          x="60"
          y="65"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-3xl font-bold"
        >
          {score}
        </text>
      </svg>
    </div>
  );
};

const SurfScore = () => {
  const { location } = useStore()
  const [weatherData, setWeatherData] = useState<{
    waveHeight: number | null;
    wavePeriod: number | null;
    wavePower: number | null;
    windSpeed: number | null;
    airTemp: number | null;
    waterTemp: number | null;
    weatherCode: number | null;
  }>({
    waveHeight: null,
    wavePeriod: null,
    wavePower: null,
    windSpeed: null,
    airTemp: null,
    waterTemp: null,
    weatherCode: null
  })
  const [scores, setScores] = useState<{
    heightScore: number;
    windScore: number;
    periodScore: number;
    temperatureScore: number;
    powerScore: number;
    totalScore: number;
  }>({
    heightScore: 0,
    windScore: 0,
    periodScore: 0,
    temperatureScore: 0,
    powerScore: 0,
    totalScore: 0
  })
  const [error, setError] = useState<string | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [popupMessage, setPopupMessage] = useState("")
  const [hasValidData, setHasValidData] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!location) {
        setWeatherData({
          waveHeight: null,
          wavePeriod: null,
          wavePower: null,
          windSpeed: null,
          airTemp: null,
          waterTemp: null,
          weatherCode: null
        })
        setScores({
          heightScore: 0,
          windScore: 0,
          periodScore: 0,
          temperatureScore: 0,
          powerScore: 0,
          totalScore: 0
        })
        setHasValidData(false)
        return
      }

      try {
        const data = await fetchWeatherData(location.lat, location.lon)
        
        // Vérification des données de vagues
        if (!data.hourly?.wave_height || data.hourly.wave_height.length === 0 || 
            data.hourly.wave_height.every(val => val === null || val === 0)) {
          setPopupMessage("Veuillez sélectionner un point plus proche de la mer")
          setShowPopup(true)
          setScores({
            heightScore: 0,
            windScore: 0,
            periodScore: 0,
            temperatureScore: 0,
            powerScore: 0,
            totalScore: 0
          })
          setHasValidData(false)
          return
        }
        
        if (data.hourly) {
          const waveHeight = data.hourly.wave_height?.[0] ?? null
          const wavePeriod = data.hourly.wave_period?.[0] ?? null
          const wavePower = data.hourly.wave_power?.[0] ?? null
          const windSpeed = data.hourly.wind_speed_10m?.[0] ?? null
          const airTemp = data.hourly.temperature_2m?.[0] ?? null
          const waterTemp = data.hourly.sea_surface_temperature?.[0] ?? null
          const weatherCode = data.hourly.weathercode?.[0] ?? null
          
          setWeatherData({
            waveHeight,
            wavePeriod,
            wavePower,
            windSpeed,
            airTemp,
            waterTemp,
            weatherCode
          })
          
          // Calculer tous les scores individuels
          const heightScore = waveHeight !== null ? calculateWaveHeightScore(waveHeight) : 0
          const windScore = windSpeed !== null ? calculateWindScore(windSpeed) : 0
          const periodScore = wavePeriod !== null ? calculateWavePeriodScore(wavePeriod) : 0
          const temperatureScore = (airTemp !== null && waterTemp !== null) 
            ? calculateTemperatureScore(airTemp, waterTemp) : 0
          const powerScore = wavePower !== null ? calculateWavePowerScore(wavePower) : 0
          
          // Calculer le score total (somme des scores individuels)
          const totalScore = Math.round(heightScore + windScore + periodScore + 
                                      temperatureScore + powerScore)
          
          // S'assurer que le score total n'est pas NaN
          const finalScore = isNaN(totalScore) ? 0 : totalScore
          
          setScores({
            heightScore: isNaN(heightScore) ? 0 : heightScore,
            windScore: isNaN(windScore) ? 0 : windScore,
            periodScore: isNaN(periodScore) ? 0 : periodScore,
            temperatureScore: isNaN(temperatureScore) ? 0 : temperatureScore,
            powerScore: isNaN(powerScore) ? 0 : powerScore,
            totalScore: finalScore
          })
          
          setHasValidData(true)
          setError(null)
        } else {
          setError('Aucune donnée météorologique disponible')
          setHasValidData(false)
        }
      } catch (err) {
        setError('Erreur lors de la récupération des données')
        console.error('Erreur détaillée:', err)
        setHasValidData(false)
      }
    }

    fetchData()
  }, [location])

  // Si aucun lieu n'est sélectionné, ne pas afficher le composant du tout
  if (!location) {
    return null
  }

  // Si une erreur s'est produite, afficher le message d'erreur
  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <>
      {showPopup && (
        <Popup 
          message={popupMessage} 
          onClose={() => setShowPopup(false)} 
        />
      )}
      
      {hasValidData && !showPopup && (
        <>
          <div className="text-center p-4 bg-white rounded-xl mb-6">
            {/* Nouvel agencement du score du jour même */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex-shrink-0">
                <MainScoreCircle score={scores.totalScore} />
              </div>
              
              <div className="flex-grow ml-4 text-left">
                <div className="flex items-center mb-2">
                  <span className="text-3xl mr-2">
                    {weatherData.airTemp !== null ? 
                     getWeatherIcon(weatherData.weatherCode || 0) : '🌡️'}
                  </span>
                  <span className="text-2xl font-bold text-sky-700">
                    {weatherData.airTemp !== null ? `${weatherData.airTemp.toFixed(1)} °C` : 'N/A'}
                  </span>
                </div>
                
                <div className="text-xl font-medium text-sky-600">
                  Vagues: <span className="font-bold">{weatherData.waveHeight !== null ? `${weatherData.waveHeight.toFixed(1)} m` : 'N/A'}</span>
                </div>
              </div>
            </div>
            
            {/* Prévisions des jours suivants */}
            <ForecastDisplay />
            
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="mt-4 px-6 py-3 bg-sky-400 text-white rounded-full hover:bg-sky-500 transition-colors shadow-sm text-sm font-medium touch-manipulation active:bg-sky-600"
            >
              {showDetails ? 'Masquer les détails' : 'Afficher les détails'}
            </button>
            
            {showDetails && (
              <>
                <h2 className="text-xl font-semibold mt-6 mb-4 text-sky-800">Conditions météorologiques actuelles</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-white to-sky-50 rounded-xl shadow-sm border border-sky-50">
                    <h3 className="text-base font-medium mb-2 text-sky-700">Hauteur des vagues</h3>
                    <div className="text-3xl font-bold text-sky-800">
                      {weatherData.waveHeight !== null ? `${weatherData.waveHeight.toFixed(1)} m` : 'N/A'}
                    </div>
                    <div className="text-xs mt-1 text-sky-600">
                      Score: {scores.heightScore.toFixed(1)}/80
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-white to-sky-50 rounded-xl shadow-sm border border-sky-50">
                    <h3 className="text-base font-medium mb-2 text-sky-700">Période des vagues</h3>
                    <div className="text-3xl font-bold text-sky-800">
                      {weatherData.wavePeriod !== null ? `${weatherData.wavePeriod.toFixed(1)} s` : 'N/A'}
                    </div>
                    <div className="text-xs mt-1 text-sky-600">
                      Score: {scores.periodScore.toFixed(1)}/5
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-white to-sky-50 rounded-xl shadow-sm border border-sky-50">
                    <h3 className="text-base font-medium mb-2 text-sky-700">Puissance des vagues</h3>
                    <div className="text-3xl font-bold text-sky-800">
                      {weatherData.wavePower !== null ? Math.round(weatherData.wavePower) : 'N/A'}
                    </div>
                    <div className="text-xs mt-1 text-sky-600">
                      Score: {scores.powerScore.toFixed(1)}/5
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-white to-sky-50 rounded-xl shadow-sm border border-sky-50">
                    <h3 className="text-base font-medium mb-2 text-sky-700">Vitesse du vent</h3>
                    <div className="text-3xl font-bold text-sky-800">
                      {weatherData.windSpeed !== null ? `${weatherData.windSpeed.toFixed(1)} km/h` : 'N/A'}
                    </div>
                    <div className="text-xs mt-1 text-sky-600">
                      Score: {scores.windScore.toFixed(1)}/5
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-white to-sky-50 rounded-xl shadow-sm border border-sky-50 col-span-1 sm:col-span-2">
                    <h3 className="text-base font-medium mb-2 text-sky-700">Températures</h3>
                    <div className="flex justify-center space-x-6 sm:space-x-8">
                      <div className="text-center">
                        <span className="text-xs text-sky-600">Air</span>
                        <div className="text-2xl font-bold text-sky-800">
                          {weatherData.airTemp !== null ? `${weatherData.airTemp.toFixed(1)} °C` : 'N/A'}
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-xs text-sky-600">Eau</span>
                        <div className="text-2xl font-bold text-sky-800">
                          {weatherData.waterTemp !== null ? `${weatherData.waterTemp.toFixed(1)} °C` : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs mt-1 text-sky-600">
                      Score: {scores.temperatureScore.toFixed(1)}/5
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  )
}

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

export default SurfScore 