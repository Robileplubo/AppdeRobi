import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { fetchWeatherData } from '../services/weatherService'

// Fonction pour traduire le code météo en description
const getWeatherDescription = (code: number): string => {
  // Codes basés sur la documentation Open-Meteo
  if (code === 0) return "Ciel dégagé";
  if (code === 1) return "Principalement dégagé";
  if (code === 2) return "Partiellement nuageux";
  if (code === 3) return "Couvert";
  if (code >= 45 && code <= 48) return "Brouillard";
  if (code >= 51 && code <= 55) return "Bruine légère";
  if (code >= 56 && code <= 57) return "Bruine verglaçante";
  if (code >= 61 && code <= 65) return "Pluie";
  if (code >= 66 && code <= 67) return "Pluie verglaçante";
  if (code >= 71 && code <= 77) return "Neige";
  if (code >= 80 && code <= 82) return "Averses";
  if (code >= 85 && code <= 86) return "Averses de neige";
  if (code >= 95 && code <= 99) return "Orage";
  return "Inconnu";
};

// Fonction pour savoir s'il pleut
const isRaining = (code: number): boolean => {
  // Codes correspondant à la pluie
  return (
    (code >= 51 && code <= 57) || // Bruine
    (code >= 61 && code <= 67) || // Pluie
    (code >= 80 && code <= 82) || // Averses
    (code >= 95 && code <= 99)    // Orage
  );
};

// Fonction pour calculer le score en fonction de la hauteur des vagues (max 80 points)
const calculateWaveHeightScore = (height: number): number => {
  // +4 points pour chaque 0,10m de hauteur
  const score = height * 10 * 4; 
  // Limiter à 80 points maximum
  return Math.min(score, 80);
};

// Fonction pour calculer le score du vent (max 5 points)
const calculateWindScore = (windSpeed: number): number => {
  // Moins de vent est mieux
  if (windSpeed <= 5) return 5; // Idéal: vent très faible
  if (windSpeed >= 30) return 0; // Très mauvais: vent fort
  
  // Formule linéaire entre 5 et 30 km/h
  return 5 * (1 - (windSpeed - 5) / 25);
};

// Fonction pour calculer le score de la période des vagues (max 5 points)
const calculateWavePeriodScore = (period: number): number => {
  if (period < 4) return 0; // Trop court
  if (period > 18) return 0; // Trop long
  
  // Entre 8 et 14 secondes: score maximum
  if (period >= 8 && period <= 14) return 5;
  
  // Entre 4 et 8 secondes: croissance linéaire
  if (period < 8) return 5 * ((period - 4) / 4);
  
  // Entre 14 et 18 secondes: décroissance linéaire
  return 5 * (1 - (period - 14) / 4);
};

// Fonction pour calculer le score des températures (max 5 points)
const calculateTemperatureScore = (airTemp: number, waterTemp: number): number => {
  if (airTemp === null || waterTemp === null) return 0;
  
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

// Fonction pour calculer le score de la puissance des vagues (max 5 points)
const calculateWavePowerScore = (power: number): number => {
  if (power === null) return 0;
  
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

// Composant pour afficher le score dans un cercle
const ScoreCircle = ({ score }: { score: number }) => {
  // Déterminer la couleur en fonction du score
  let color = 'text-red-500';
  if (score >= 70) color = 'text-green-500';
  else if (score >= 50) color = 'text-yellow-500';
  else if (score >= 30) color = 'text-orange-500';
  
  // Calculer le pourcentage pour le cercle
  const percentage = score;
  const dashArray = 283; // 2 * PI * 45 (rayon)
  const dashOffset = dashArray - (dashArray * percentage) / 100;
  
  return (
    <div className="flex flex-col items-center justify-center mb-6">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r="45"
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
      <div className="mt-2 text-xl font-bold">Score de surf</div>
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
  }>({
    waveHeight: null,
    wavePeriod: null,
    wavePower: null,
    windSpeed: null,
    airTemp: null,
    waterTemp: null
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
          waterTemp: null
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
          
          setWeatherData({
            waveHeight,
            wavePeriod,
            wavePower,
            windSpeed,
            airTemp,
            waterTemp
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
          
          setScores({
            heightScore,
            windScore,
            periodScore,
            temperatureScore,
            powerScore,
            totalScore
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
        <div className="text-center p-4 bg-white rounded-xl">
          <ScoreCircle score={scores.totalScore} />
          
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="mt-4 px-6 py-2 bg-sky-400 text-white rounded-full hover:bg-sky-500 transition-colors shadow-sm text-sm font-medium"
          >
            {showDetails ? 'Masquer les détails' : 'Afficher les détails'}
          </button>
          
          {showDetails && (
            <>
              <h2 className="text-xl font-semibold mt-6 mb-4 text-sky-800">Conditions météorologiques</h2>
              <div className="grid grid-cols-2 gap-4">
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
                <div className="p-4 bg-gradient-to-br from-white to-sky-50 rounded-xl shadow-sm border border-sky-50 col-span-2">
                  <h3 className="text-base font-medium mb-2 text-sky-700">Températures</h3>
                  <div className="flex justify-center space-x-8">
                    <div>
                      <span className="text-xs text-sky-600">Air</span>
                      <div className="text-2xl font-bold text-sky-800">
                        {weatherData.airTemp !== null ? `${weatherData.airTemp.toFixed(1)} °C` : 'N/A'}
                      </div>
                    </div>
                    <div>
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
      )}
    </>
  )
}

export default SurfScore 