import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/asteroids.module.css'; 

interface IAsteroid {
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: {
    x: number;
    y: number;
  };
}

interface IPlayer {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface IStar {
  x: number;
  y: number;
  velocity: number;
}

const generateStars = (count: number, canvasWidth: number, canvasHeight: number): IStar[] => {
  const stars: IStar[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      velocity: Math.random() * 2 + 1, // Random velocity for each star
    });
  }
  return stars;
};

export default function Asteroids() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stars, setStars] = useState<IStar[]>([]);
  const directionRef = useRef({ x: 0, y: 0 });
  const [asteroids, setAsteroids] = useState<IAsteroid[]>([]);
  const [player, setPlayer] = useState<IPlayer>({ x: 0, y: 0, width: 30, height: 30 });
  const [currentTime, setCurrentTime] = useState(0);
  const [bestTime, setBestTime] = useState(0);
  const spaceshipImage = useRef<HTMLImageElement | null>(null);
  const asteroidImage = useRef<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0); // okretanje slike po tipkama

  useEffect(() => {
    const img = new Image();
    img.src = '/spaceship.png'; //učitala posebnu sliku za igrača
    spaceshipImage.current = img;
    const asteroidImg = new Image();
    asteroidImg.src = '/asteroid.png'; // Adjust this path to your asteroid image
    asteroidImage.current = asteroidImg;
    const canvas = canvasRef.current;
    if (canvas) {
      const canvasWidth = window.innerWidth;
      const canvasHeight = window.innerHeight;
      setStars(generateStars(100, canvasWidth, canvasHeight)); // Generate 100 stars
    }
    const handleUnload = () => {
      localStorage.removeItem('bestTime'); 
    };
  
    const savedBestTime = Number(localStorage.getItem('bestTime')) || 0;
    setBestTime(savedBestTime);
    window.addEventListener('beforeunload', handleUnload);
  
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        setRotation(-90);
        directionRef.current = { x: -5, y: 0 };
        break;
      case 'ArrowRight':
        setRotation(90);
        directionRef.current = { x: 5, y: 0 };
        break;
      case 'ArrowUp':
        setRotation(0);
        directionRef.current = { x: 0, y: -5 };
        break;
      case 'ArrowDown':
        setRotation(180);
        directionRef.current = { x: 0, y: 5 };
        break;
    }
  };

  const handleKeyUp = () => {
    directionRef.current = { x: 0, y: 0 };
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const generateOffscreenAsteroid = (): IAsteroid => {
    const side = Math.floor(Math.random() * 4); 
    let x = 0, y = 0;
    let velocityX = 0, velocityY = 0;
  
    const speed = Math.random() * 8 + 1; // brzina
  
    switch(side) {
      case 0: // npr da ulaze u scenu s lijeve strane, itd..
        x = -60;
        y = Math.random() * window.innerHeight;
        velocityX = speed;
        break;
      case 1:
        x = Math.random() * window.innerWidth;
        y = -60;
        velocityY = speed;
        break;
      case 2: 
        x = window.innerWidth + 60;
        y = Math.random() * window.innerHeight;
        velocityX = -speed;
        break;
      case 3: 
        x = Math.random() * window.innerWidth;
        y = window.innerHeight + 60;
        velocityY = -speed;
        break;
    }
  
    return {
      x,
      y,
      width: 40,
      height: 40,
      velocity: { x: velocityX, y: velocityY },
    };
  };
  

  const createInitialAsteroids = (count: number): IAsteroid[] => {
    return Array.from({ length: count }, generateOffscreenAsteroid);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        setPlayer({
          x: canvas.width / 2 - 15,
          y: canvas.height / 2 - 15,
          width: 30,
          height: 30
        });

        setAsteroids(createInitialAsteroids(5));
      }
    }

    const asteroidInterval = setInterval(() => {
      setAsteroids(prevAsteroids => [...prevAsteroids, generateOffscreenAsteroid()]);
    }, 10000); //svakih 10 sekundi se dodaje novi asteroid

    return () => clearInterval(asteroidInterval);
  }, []);

  const [gameOver, setGameOver] = useState(false);

  const checkCollision = (player: IPlayer, asteroid: IAsteroid) => {
    const scaleFactor = 2; // samo da mogu malo povećati sliku
    const scaleFactor2 = 1.5;
    let playerRadius = 0;
    let asteroidRadius = 0;
    if(rotation === 180 || rotation === 90) {
      playerRadius = Math.min(player.width, player.height) * scaleFactor / 3;
      asteroidRadius = Math.min(asteroid.width, asteroid.height) * scaleFactor2 / 3;
    } else {
      playerRadius = Math.min(player.width, player.height) * scaleFactor / 2;
      asteroidRadius = Math.min(asteroid.width, asteroid.height) * scaleFactor2 / 2;
    }
  
    const dx = player.x - asteroid.x;
    const dy = player.y - asteroid.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
  
    return distance < (playerRadius + asteroidRadius);
  };  
  const restartGame = () => {
    setAsteroids([]); 
    setPlayer({ x: window.innerWidth / 2, y: window.innerHeight / 2, width: 30, height: 30 });
    setGameOver(false);
    setAsteroids(createInitialAsteroids(5)); 
    setCurrentTime(0);
  };

  useEffect(() => {
    const gameLoop = () => {
      if (gameOver) return;
  
      const direction = directionRef.current;
      setPlayer(prevPlayer => ({
        ...prevPlayer,
        x: (prevPlayer.x + direction.x + window.innerWidth) % window.innerWidth,
        y: (prevPlayer.y + direction.y + window.innerHeight) % window.innerHeight,
      }));
  
      setAsteroids(prevAsteroids =>
        prevAsteroids.map(asteroid => {
          let newX = asteroid.x + asteroid.velocity.x;
          let newY = asteroid.y + asteroid.velocity.y;
  
          // Wrap around the canvas
          if (newX < -asteroid.width) {
            newX = window.innerWidth;
          } else if (newX > window.innerWidth) {
            newX = -asteroid.width;
          }
  
          if (newY < -asteroid.height) {
            newY = window.innerHeight;
          } else if (newY > window.innerHeight) {
            newY = -asteroid.height;
          }
  
          if (checkCollision(player, asteroid)) {
            setGameOver(true);
            const adjustedTime = currentTime + 100;
            if (currentTime > bestTime) {
              setBestTime(adjustedTime);
              localStorage.setItem('bestTime', adjustedTime.toString());
            }
          }
          return {
            ...asteroid,
            x: newX,
            y: newY,
          };
        })
      );
      if (!gameOver) {
        setCurrentTime((prevTime) => prevTime + 100);
      }
    };
  
    const id = setInterval(gameLoop, 100);
    return () => clearInterval(id);
  }, [player, gameOver, currentTime, bestTime]);
  

  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw stars
          ctx.fillStyle = 'white';
          stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, 1, 0, Math.PI * 2);
            ctx.fill();
          });

          ctx.save();
          ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          const scaleFactor = 2; // samo da mogu malo povećati sliku
          const scaleFactor2 = 1.5;
          if(spaceshipImage.current) {
            ctx.drawImage(spaceshipImage.current, -player.width, -player.height, player.width * scaleFactor, player.height * scaleFactor);
          }
          ctx.restore();
          asteroids.forEach(asteroid => {
            if(asteroidImage.current) {
                ctx.drawImage(asteroidImage.current, asteroid.x, asteroid.y, asteroid.width * scaleFactor2, asteroid.height * scaleFactor2);
            }
          });

          requestAnimationFrame(render);
        }
      }
    };

    render();
  }, [player, asteroids, rotation]);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = time % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  useEffect(() => {
    const updateStars = () => {
      setStars(prevStars => 
        prevStars.map(star => ({
          ...star,
          y: (star.y + star.velocity) % window.innerHeight, // Update each star's position
        }))
      );
      requestAnimationFrame(updateStars);
    };
    requestAnimationFrame(updateStars);
  }, []);

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.gameCanvas}></canvas>
      <div className={styles.timer}>Time: {formatTime(currentTime)}</div>
      <div className={styles.bestTime}>Best Time: {formatTime(bestTime)}</div>
      {gameOver && (
        <div className={styles.overlay}>
          <div className={styles.form}>
            <h1 className={styles.heading}>Game Over</h1>
            <p className={styles.heading}>Your Time: {formatTime(currentTime)}</p>
            <div className={styles.heading}>Best Time: {formatTime(bestTime)}</div>
            <button className={styles.submitBtn} onClick={restartGame}>Restart Game</button>
          </div>
        </div>
      )}
    </div>
  );
}
