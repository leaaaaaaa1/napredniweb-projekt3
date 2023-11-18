import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/asteroids.module.css'; 

interface intAster {
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: {
    x: number;
    y: number;
  };
}

interface intPlayer {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface intStar {
  x: number;
  y: number;
  velocity: number;
}

//generiranje određenog broja zvjezdica za pozadinu (u mom slucaju 100)
const settingStars = (count: number, canvasWidth: number, canvasHeight: number): intStar[] => {
  const stars: intStar[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({  //random pozicije i brzina za svaku
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      velocity: Math.random() * 2 + 1,
    });
  }
  return stars;
};

export default function Asteroids() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stars, setStars] = useState<intStar[]>([]);
  const directionRef = useRef({ x: 0, y: 0 });
  const [asteroids, setAsteroids] = useState<intAster[]>([]);
  const [player, setPlayer] = useState<intPlayer>({ x: 0, y: 0, width: 30, height: 30 });
  const [currentTime, setCurrentTime] = useState(0);
  const [bestTime, setBestTime] = useState(0);
  const spaceshipImage = useRef<HTMLImageElement | null>(null);
  const asteroidImage = useRef<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0); // okretanje slike asteroida po tipkama

  useEffect(() => {
    const img = new Image();
    img.src = '/spaceship.png'; //učitala posebnu sliku za igrača
    spaceshipImage.current = img;
    const asteroidImg = new Image();
    asteroidImg.src = '/asteroid.png'; //posebna slika za asteroide
    asteroidImage.current = asteroidImg;
    const canvas = canvasRef.current;
    if (canvas) {
      const canvasWidth = window.innerWidth;
      const canvasHeight = window.innerHeight;
      setStars(settingStars(100, canvasWidth, canvasHeight)); //stvaranje 100 zvjezdica
    }
    //na refresh cistim local storage kako bi svakim novim ucitavanjem igre mogli postaviti najbolje vrijeme
    const handleUnload = () => {
      localStorage.removeItem('bestTime'); 
    };
    //trenutno najbolje vrijeme uzimam iz local storagea da bih mogla dalje uspoređivati s njim
    const savedBestTime = Number(localStorage.getItem('bestTime')) || 0;
    setBestTime(savedBestTime);
    window.addEventListener('beforeunload', handleUnload);
  
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  type Direction = { x: number; y: number };
  //upravljanje asteroidom preko tipki, dodan rotation kako bi slika isla u ispravnom smjeru
  const commands: Record<string, { rotation: number; direction: Direction }> = {
    ArrowLeft: { rotation: -90, direction: { x: -5, y: 0 } },
    ArrowRight: { rotation: 90, direction: { x: 5, y: 0 } },
    ArrowUp: { rotation: 0, direction: { x: 0, y: -5 } },
    ArrowDown: { rotation: 180, direction: { x: 0, y: 5 } },
  };
  //kretanje asteroida ovisno o tipkama
  const down = (event: KeyboardEvent) => {
    const action = commands[event.key];
    if (action) {
      setRotation(action.rotation);
      directionRef.current = action.direction;
    }
  };
  //zaustavljam kretanje asteroida kada tipka nije pritisnuta
  const up = () => {
    directionRef.current = { x: 0, y: 0 };
  };
  
  useEffect(() => {
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
  
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);  
  //struktura za brzinu i poziciju
  type PositionVelocity = {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
  };
  
  type StrategyMap = {
    [key: number]: () => PositionVelocity;
  };
  
  const generatePositionAndScreenEntering = (side: number, speed: number): PositionVelocity => {
    const width = window.innerWidth, height = window.innerHeight;
  
    // postavljam tipove "strategija", kako bi asteroidi ulazili na ekran tj. s koje strane i kojom brzinom
    const strategies: StrategyMap = {
      0: () => ({ x: -60, y: Math.random() * height, velocityX: speed, velocityY: 0 }),
      1: () => ({ x: Math.random() * width, y: -60, velocityX: 0, velocityY: speed }),
      2: () => ({ x: width + 60, y: Math.random() * height, velocityX: -speed, velocityY: 0 }),
      3: () => ({ x: Math.random() * width, y: height + 60, velocityX: 0, velocityY: -speed }),
    };
  
    // po vrijednosti strane biram strategiju ulaska
    const strategy = strategies[side];
    if (!strategy) {
      throw new Error(`Invalid side: ${side}`);
    }
  
    return strategy();
  };
  
  const generateAsteroidsOutOfCanvas = (): intAster => {
    //generiranje novog asteroida s random brzinom i pozicijom
    const side = Math.floor(Math.random() * 4);
    const speed = Math.random() * 12 + 1;
    const { x, y, velocityX, velocityY } = generatePositionAndScreenEntering(side, speed);
  
    return {
      x,
      y,
      width: 40,
      height: 40,
      velocity: { x: velocityX, y: velocityY },
    };
  };  
  
//inicijalno stvaranje asteroida s obzirom da se kasnije dodaju novi
  const initialArrangementOfAsteroids = (count: number): intAster[] => {
    return Array.from({ length: count }, generateAsteroidsOutOfCanvas);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      //postavljamo canvas na trazenu velicinu tj da prekrije cijeli zaslon
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        //pozicioniramo igraca, centriramo ga preko x i y
        setPlayer({
          x: canvas.width / 2 - 15,
          y: canvas.height / 2 - 15,
          width: 30,
          height: 30
        });

        //kreiramo pocetne asteroide tj. njih 5
        setAsteroids(initialArrangementOfAsteroids(5));
      }
    }

    const asteroidInterval = setInterval(() => {
      setAsteroids(prevAsteroids => [...prevAsteroids, generateAsteroidsOutOfCanvas()]);
    }, 10000); //svakih 10 sekundi se dodaje novi asteroid

    return () => clearInterval(asteroidInterval);
  }, []);

  const [gameOver, setGameOver] = useState(false);

  //funkcija za prepoznavanje sudara
  const ifClash = (player: intPlayer, asteroid: intAster) => {
    const scaleFactor = 2; 
    const scaleFactor2 = 1.5;
    let playerRadius = 0;
    let asteroidRadius = 0;
    //s obzirom da slike nisu pravilnog oblika, određivanje sudara je malo kompliciranije i potrebni su neki dodatni izračuni
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
  //samo vracanje svega na pocetno stanje i restart vremena
  const restartGame = () => {
    setAsteroids([]); 
    setPlayer({ x: window.innerWidth / 2, y: window.innerHeight / 2, width: 30, height: 30 });
    setGameOver(false);
    setAsteroids(initialArrangementOfAsteroids(5)); 
    setCurrentTime(0);
  };

  useEffect(() => {
    const gameLoop = () => {
      const direction = directionRef.current;
      //prema trenutnoj poziciji azuriram poziciju igraca (direction je sada trenutna)
      setPlayer(prevPlayer => ({
        ...prevPlayer,
        x: (prevPlayer.x + direction.x + window.innerWidth) % window.innerWidth,
        y: (prevPlayer.y + direction.y + window.innerHeight) % window.innerHeight,
      }));
  
      //za svaki asteroid azuriram poziciju prema trenutnoj + brzini
      setAsteroids(prevAsteroids =>
        prevAsteroids.map(asteroid => {
          let newX = asteroid.x + asteroid.velocity.x;
          let newY = asteroid.y + asteroid.velocity.y;
  
          // Da omogućim prijelaz preko jednog ruba na suprotni
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
  
          //ako je doslo do sudara, oznacavamo da je dosla igra do kraja, 
          //postavljamo vrijeme u local storage ako je bolje od prethodnog najboljeg
          if (ifClash(player, asteroid)) {
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
      //ako nije "propao" igrac - azuriramo vrijeme
      if (!gameOver) {
        setCurrentTime((prevTime) => prevTime + 100);
      }
    };
    
    //frekvencija postavljena na 50 dakle gameloop se runna svakih 50ms
    const id = setInterval(gameLoop, 50);
    return () => clearInterval(id);
  }, [player, gameOver, currentTime, bestTime]);
  

  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height); //cistimo cijeli canvas 

          // prvo se radi iscrtkavanje zvjezdica a potom svemirskog broda i asteroida
          ctx.fillStyle = 'white';
          stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, 1, 0, Math.PI * 2); //s obzirom da su zvjezdice iscrtkane kao mali krugovi
            ctx.fill();
          });

          ctx.save();
          ctx.translate(player.x + player.width / 2, player.y + player.height / 2);   //pripremamo canvas da bi igrac mogao biti u sredini
          ctx.rotate((rotation * Math.PI) / 180);
          const scaleFactor = 2; // samo da mogu malo povećati sliku
          const scaleFactor2 = 1.5;
          if(spaceshipImage.current) {
            //iscrtkavanje slike s određenim skaliranjem i centriranjem
            ctx.drawImage(spaceshipImage.current, -player.width, -player.height, player.width * scaleFactor, player.height * scaleFactor);
          }
          ctx.restore();
          asteroids.forEach(asteroid => {
            if(asteroidImage.current) {
              //iscrtkavanje asteroida, svaki prema njegovoj poziciji
              ctx.drawImage(asteroidImage.current, asteroid.x, asteroid.y, asteroid.width * scaleFactor2, asteroid.height * scaleFactor2);
            }
          });

          requestAnimationFrame(render);
        }
      }
    };

    render(); //pozivanje rendera za iscrtkavanje
  }, [player, asteroids, rotation]);

  const timeForPrint = (time: number): string => {
    //samo za trazeno formatiranje vremena
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
          y: (star.y + star.velocity) % window.innerHeight, //ažuriranje pozicija zvjezdica u pozadini
        }))
      );
      requestAnimationFrame(updateStars);
    };
    requestAnimationFrame(updateStars);
  }, []);

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.gameCanvas}></canvas>
      <div className={styles.timer}>Time: {timeForPrint(currentTime)}</div>
      <div className={styles.bestTime}>Best Time: {timeForPrint(bestTime)}</div>
      {gameOver && (
        <div className={styles.overlay}>
          <div className={styles.form}>
            <h1 className={styles.heading}>Game Over</h1>
            <p className={styles.heading}>Your Time: {timeForPrint(currentTime)}</p>
            <div className={styles.heading}>Best Time: {timeForPrint(bestTime)}</div>
            <button className={styles.submitBtn} onClick={restartGame}>Restart Game</button>
          </div>
        </div>
      )}
    </div>
  );
}
