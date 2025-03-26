import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [isJumping, setIsJumping] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [obstacles, setObstacles] = useState([])
  const playerRef = useRef(null)
  const gameRef = useRef(null)

  // Position initiale du joueur
  const playerPosition = {
    x: 100,
    y: 200
  }

  // Génération des obstacles
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const generateObstacle = () => {
        const newObstacle = {
          x: 800,
          y: 200,
          type: Math.random() > 0.5 ? 'spike' : 'block'
        }
        setObstacles(prev => [...prev, newObstacle])
      }

      const obstacleInterval = setInterval(generateObstacle, 2000)
      return () => clearInterval(obstacleInterval)
    }
  }, [gameStarted, gameOver])

  // Animation du joueur
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const animate = () => {
        if (playerRef.current) {
          const player = playerRef.current
          if (isJumping) {
            player.style.transform = 'translateY(-100px)'
          } else {
            player.style.transform = 'translateY(0)'
          }
        }
      }

      const animationFrame = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(animationFrame)
    }
  }, [isJumping, gameStarted, gameOver])

  // Déplacement des obstacles
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const moveObstacles = () => {
        setObstacles(prev => 
          prev.map(obs => ({
            ...obs,
            x: obs.x - 5
          })).filter(obs => obs.x > -50)
        )
      }

      const moveInterval = setInterval(moveObstacles, 16)
      return () => clearInterval(moveInterval)
    }
  }, [gameStarted, gameOver])

  // Gestion des collisions
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const checkCollisions = () => {
        const player = playerRef.current
        if (!player) return

        const playerRect = player.getBoundingClientRect()
        const gameRect = gameRef.current.getBoundingClientRect()

        obstacles.forEach(obstacle => {
          const obstacleX = obstacle.x + gameRect.left
          const obstacleY = obstacle.y + gameRect.top

          if (
            playerRect.left < obstacleX + 30 &&
            playerRect.right > obstacleX &&
            playerRect.top < obstacleY + 30 &&
            playerRect.bottom > obstacleY
          ) {
            setGameOver(true)
          }
        })
      }

      const collisionInterval = setInterval(checkCollisions, 16)
      return () => clearInterval(collisionInterval)
    }
  }, [obstacles, gameStarted, gameOver])

  // Gestion du score
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const updateScore = () => {
        setScore(prev => prev + 1)
      }

      const scoreInterval = setInterval(updateScore, 100)
      return () => clearInterval(scoreInterval)
    }
  }, [gameStarted, gameOver])

  const handleKeyPress = (e) => {
    if (e.code === 'Space') {
      if (!gameStarted) {
        setGameStarted(true)
      } else if (!gameOver) {
        setIsJumping(true)
        setTimeout(() => setIsJumping(false), 500)
      }
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameStarted, gameOver])

  const resetGame = () => {
    setGameStarted(false)
    setGameOver(false)
    setScore(0)
    setObstacles([])
    setIsJumping(false)
  }

  return (
    <div className="game-container">
      <h1>Geometry Dash</h1>
      <div className="score">Score: {score}</div>
      <div className="game-area" ref={gameRef}>
        <div className="player" ref={playerRef} />
        {obstacles.map((obstacle, index) => (
          <div
            key={index}
            className={`obstacle ${obstacle.type}`}
            style={{
              left: `${obstacle.x}px`,
              top: `${obstacle.y}px`
            }}
          />
        ))}
        <div className="ground" />
      </div>
      {!gameStarted && (
        <div className="start-screen">
          <h2>Appuyez sur ESPACE pour commencer</h2>
        </div>
      )}
      {gameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Score final: {score}</p>
          <button onClick={resetGame}>Rejouer</button>
        </div>
      )}
      <div className="controls">
        <p>Utilisez ESPACE pour sauter</p>
      </div>
    </div>
  )
}

export default App
