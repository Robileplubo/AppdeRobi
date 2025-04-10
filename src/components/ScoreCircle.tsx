import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'

const ScoreCircle = () => {
  const { surfScore, isLoading } = useStore()

  const circumference = 2 * Math.PI * 45 // Rayon de 45
  const strokeDashoffset = circumference - (surfScore / 100) * circumference

  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg className="w-full h-full transform -rotate-90">
        {/* Cercle de fond */}
        <circle
          cx="128"
          cy="128"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-sky-100"
        />
        {/* Cercle de progression */}
        <motion.circle
          cx="128"
          cy="128"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-sky-400"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeInOut" }}
          strokeLinecap="round"
        />
      </svg>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold text-sky-800"
          >
            {isLoading ? '...' : Math.round(surfScore)}
          </motion.div>
          <div className="text-sm font-medium text-sky-600">
            Score de surf
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScoreCircle 