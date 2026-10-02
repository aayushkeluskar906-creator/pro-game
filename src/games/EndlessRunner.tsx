import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';
import { RunnerTheme, Lane, RunnerObstacle, RunnerCoin, RunnerPowerup, Particle } from '../types/game';
import { 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Award, 
  Coins, 
  Shield, 
  Zap, 
  Play, 
  Pause, 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Flame,
  Train
} from 'lucide-react';

interface Props {
  initialTheme?: RunnerTheme;
  onGameOver: (score: number, creditsEarned: number) => void;
  bestScore: number;
}

export const EndlessRunner: React.FC<Props> = ({
  initialTheme = 'subway',
  onGameOver,
  bestScore,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [theme, setTheme] = useState<RunnerTheme>(initialTheme);
  const [distance, setDistance] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active Powerups
  const [activeHoverboard, setActiveHoverboard] = useState(false);
  const [activeMagnet, setActiveMagnet] = useState(0); // countdown frames
  const [activeSneakers, setActiveSneakers] = useState(0);

  // Player state
  const playerRef = useRef({
    currentLane: 0 as Lane, // -1, 0, 1
    targetLane: 0 as Lane,
    laneX: 0, // smoothly interpolated (-1 to 1)
    y: 0, // jump height off ground
    vy: 0,
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
    hasShield: false,
  });

  const speedRef = useRef(14);
  const distanceRef = useRef(0);
  distanceRef.current = distance;
  const coinsRef = useRef(0);
  coinsRef.current = coinsCollected;
  const isGameOverRef = useRef(false);
  isGameOverRef.current = isGameOver;

  const obstaclesRef = useRef<RunnerObstacle[]>([]);
  const coinsArrayRef = useRef<RunnerCoin[]>([]);
  const powerupsArrayRef = useRef<RunnerPowerup[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const nextEntityZ = useRef(400);
  const nextEntityId = useRef(1);
  const animationFrameRef = useRef<number | null>(null);

  // Touch gesture tracking for mobile
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Reset Game
  const resetGame = useCallback(() => {
    setDistance(0);
    setCoinsCollected(0);
    setMultiplier(1);
    setIsGameOver(false);
    setIsPaused(false);
    setActiveHoverboard(false);
    setActiveMagnet(0);
    setActiveSneakers(0);

    speedRef.current = 14;
    playerRef.current = {
      currentLane: 0,
      targetLane: 0,
      laneX: 0,
      y: 0,
      vy: 0,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
      hasShield: false,
    };

    obstaclesRef.current = [];
    coinsArrayRef.current = [];
    powerupsArrayRef.current = [];
    particlesRef.current = [];
    nextEntityZ.current = 500;
  }, []);

  // Keyboard navigation
  const switchLane = useCallback((dir: 'left' | 'right') => {
    const p = playerRef.current;
    if (dir === 'left' && p.targetLane > -1) {
      p.targetLane = (p.targetLane - 1) as Lane;
      sound.playSwoosh();
    } else if (dir === 'right' && p.targetLane < 1) {
      p.targetLane = (p.targetLane + 1) as Lane;
      sound.playSwoosh();
    }
  }, []);

  const jump = useCallback(() => {
    const p = playerRef.current;
    if (!p.isJumping) {
      const jumpImpulse = activeSneakers > 0 ? 15 : 12;
      p.isJumping = true;
      p.isSliding = false;
      p.vy = jumpImpulse;
      sound.playJump();
    }
  }, [activeSneakers]);

  const slide = useCallback(() => {
    const p = playerRef.current;
    if (p.isJumping) {
      // Fast fall down
      p.vy = -16;
    }
    p.isSliding = true;
    p.slideTimer = 35; // 35 frames duration
    sound.playSlide();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        switchLane('left');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        switchLane('right');
      } else if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        e.preventDefault();
        jump();
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        slide();
      } else if (e.code === 'KeyP') {
        setIsPaused(prev => !prev);
      } else if (e.code === 'KeyB') {
        // Toggle hoverboard
        setActiveHoverboard(h => !h);
        sound.playPowerup();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump, slide, switchLane]);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 25) {
      if (absX > absY) {
        if (dx > 0) switchLane('right');
        else switchLane('left');
      } else {
        if (dy > 0) slide();
        else jump();
      }
    }
    touchStartRef.current = null;
  };

  // Generate track hazards, trains, and coin lines ahead
  const populateTrackSegment = (startZ: number) => {
    const lanes: Lane[] = [-1, 0, 1];
    const randPattern = Math.random();

    if (randPattern < 0.35) {
      // Train or Big Obstacle in one lane
      const trainLane = lanes[Math.floor(Math.random() * lanes.length)];
      obstaclesRef.current.push({
        id: nextEntityId.current++,
        z: startZ,
        lane: trainLane,
        type: theme === 'subway' ? 'train' : 'temple_statue',
        width: 65,
        height: 80,
        length: 220,
      });

      if (theme === 'subway') {
        if (Math.random() < 0.35) sound.playTrainHorn();
      } else {
        if (Math.random() < 0.35) sound.playDemonRoar();
      }

      // Place coin trail on the remaining clear lane
      const otherLanes = lanes.filter(l => l !== trainLane);
      const coinLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
      for (let c = 0; c < 5; c++) {
        coinsArrayRef.current.push({
          id: nextEntityId.current++,
          z: startZ + c * 40,
          lane: coinLane,
          yOffset: 0,
          collected: false,
        });
      }
    } else if (randPattern < 0.65) {
      // Low jump barrier or high slide barrier
      const barrierLane = lanes[Math.floor(Math.random() * lanes.length)];
      const isLow = Math.random() > 0.45;
      obstaclesRef.current.push({
        id: nextEntityId.current++,
        z: startZ,
        lane: barrierLane,
        type: isLow ? 'barrier_low' : 'barrier_high',
        width: 60,
        height: isLow ? 24 : 50,
      });

      // Coins over barrier
      for (let c = 0; c < 4; c++) {
        coinsArrayRef.current.push({
          id: nextEntityId.current++,
          z: startZ - 40 + c * 35,
          lane: barrierLane,
          yOffset: isLow ? 35 : 0,
          collected: false,
        });
      }
    } else {
      // Double lane hazard (only 1 safe lane)
      const safeLane = lanes[Math.floor(Math.random() * lanes.length)];
      lanes.forEach(l => {
        if (l !== safeLane) {
          obstaclesRef.current.push({
            id: nextEntityId.current++,
            z: startZ,
            lane: l,
            type: Math.random() > 0.5 ? 'barrier_low' : 'barrier_high',
            width: 60,
            height: 30,
          });
        } else {
          // Coins in safe lane
          for (let c = 0; c < 4; c++) {
            coinsArrayRef.current.push({
              id: nextEntityId.current++,
              z: startZ + c * 35,
              lane: l,
              yOffset: 0,
              collected: false,
            });
          }
        }
      });
    }

    // Occasional Powerup drop
    if (Math.random() < 0.18) {
      const pLanes: Lane[] = [-1, 0, 1];
      const pLane = pLanes[Math.floor(Math.random() * pLanes.length)];
      const types: RunnerPowerup['type'][] = ['magnet', 'hoverboard', 'sneakers', 'multiplier'];
      powerupsArrayRef.current.push({
        id: nextEntityId.current++,
        z: startZ + 120,
        lane: pLane,
        type: types[Math.floor(Math.random() * types.length)],
        collected: false,
      });
    }
  };

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    resetGame();

    const loop = () => {
      if (!isGameOverRef.current && !isPaused) {
        updateGame(canvas);
      }
      drawGame(ctx, canvas);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPaused, resetGame, theme]);

  // Game update logic
  const updateGame = (canvas: HTMLCanvasElement) => {
    const p = playerRef.current;

    // Smooth lane shift interpolation
    p.laneX += (p.targetLane - p.laneX) * 0.22;
    if (Math.abs(p.laneX - p.targetLane) < 0.02) {
      p.laneX = p.targetLane;
      p.currentLane = p.targetLane;
    }

    // Jump Physics
    if (p.isJumping) {
      p.y += p.vy;
      p.vy -= 0.75; // gravity
      if (p.y <= 0) {
        p.y = 0;
        p.vy = 0;
        p.isJumping = false;
      }
    }

    // Slide timer
    if (p.isSliding) {
      p.slideTimer--;
      if (p.slideTimer <= 0) {
        p.isSliding = false;
      }
    }

    // Speed progression
    speedRef.current = Math.min(26, 14 + distanceRef.current * 0.004);

    // Distance accumulation
    setDistance(d => {
      const nextD = d + Math.round(speedRef.current * 0.1);
      return nextD;
    });

    // Magnet & Sneakers timer countdown
    if (activeMagnet > 0) setActiveMagnet(m => m - 1);
    if (activeSneakers > 0) setActiveSneakers(s => s - 1);

    // Track generation ahead
    nextEntityZ.current -= speedRef.current;
    if (nextEntityZ.current < 900) {
      populateTrackSegment(1400);
      nextEntityZ.current = 1400;
    }

    // Move Obstacles closer along Z-axis
    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      const obs = obstaclesRef.current[i];
      obs.z -= speedRef.current;

      // Check collision with player when at Z ~ 50 to 90
      if (obs.z > 40 && obs.z < 100) {
        // Check lane alignment
        const laneDiff = Math.abs(p.laneX - obs.lane);
        if (laneDiff < 0.6) {
          let hasCrashed = false;

          if (obs.type === 'barrier_low') {
            // Must jump over!
            if (p.y < 28) hasCrashed = true;
          } else if (obs.type === 'barrier_high') {
            // Must slide under!
            if (!p.isSliding) hasCrashed = true;
          } else {
            // Train or large solid block
            // Can only survive if jumped onto top of train!
            if (p.y < 65) hasCrashed = true;
          }

          if (hasCrashed) {
            // Check if protected by hoverboard/shield
            if (activeHoverboard || p.hasShield) {
              setActiveHoverboard(false);
              p.hasShield = false;
              sound.playExplosion();
              obstaclesRef.current.splice(i, 1); // destroy obstacle

              // Shield shatter particles
              for (let sp = 0; sp < 25; sp++) {
                particlesRef.current.push({
                  x: canvas.width / 2 + p.laneX * 90,
                  y: canvas.height * 0.72 - p.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  color: '#38bdf8',
                  radius: 3,
                  life: 25,
                  maxLife: 25,
                });
              }
              continue;
            } else {
              // FATAL CRASH!
              triggerGameOver();
              return;
            }
          }
        }
      }

      // Despawn passed obstacles
      if (obs.z < -60) {
        obstaclesRef.current.splice(i, 1);
      }
    }

    // Move & Collect Coins
    for (let i = coinsArrayRef.current.length - 1; i >= 0; i--) {
      const c = coinsArrayRef.current[i];
      c.z -= speedRef.current;

      // Magnet attraction
      if (activeMagnet > 0 && c.z < 350 && c.z > 20) {
        c.lane = p.targetLane;
        if (c.yOffset > p.y) c.yOffset -= 2;
        else if (c.yOffset < p.y) c.yOffset += 2;
      }

      // Check pickup
      if (c.z > 30 && c.z < 110 && !c.collected) {
        const laneDiff = Math.abs(p.laneX - c.lane);
        const yDiff = Math.abs(p.y - c.yOffset);
        if (laneDiff < 0.65 && yDiff < 35) {
          c.collected = true;
          sound.playCoin();
          setCoinsCollected(prev => prev + 1);

          // Sparkle particles
          for (let sp = 0; sp < 3; sp++) {
            particlesRef.current.push({
              x: canvas.width / 2 + p.laneX * 90,
              y: canvas.height * 0.75 - p.y,
              vx: (Math.random() - 0.5) * 3,
              vy: -Math.random() * 3,
              color: '#facc15',
              radius: 2,
              life: 18,
              maxLife: 18,
            });
          }
        }
      }

      if (c.z < -40) coinsArrayRef.current.splice(i, 1);
    }

    // Move & Collect Powerups
    for (let i = powerupsArrayRef.current.length - 1; i >= 0; i--) {
      const pu = powerupsArrayRef.current[i];
      pu.z -= speedRef.current;

      if (pu.z > 30 && pu.z < 110 && !pu.collected) {
        const laneDiff = Math.abs(p.laneX - pu.lane);
        if (laneDiff < 0.65) {
          pu.collected = true;
          sound.playPowerup();

          if (pu.type === 'magnet') setActiveMagnet(480);
          else if (pu.type === 'hoverboard') setActiveHoverboard(true);
          else if (pu.type === 'sneakers') setActiveSneakers(450);
          else if (pu.type === 'multiplier') setMultiplier(m => m * 2);
        }
      }

      if (pu.z < -40) powerupsArrayRef.current.splice(i, 1);
    }

    // Update particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const pt = particlesRef.current[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) particlesRef.current.splice(i, 1);
    }
  };

  const triggerGameOver = () => {
    setIsGameOver(true);
    sound.playGameOver();
    const finalScore = distanceRef.current + coinsRef.current * 10;
    const earnedCredits = Math.max(10, Math.floor(finalScore / 25));
    onGameOver(finalScore, earnedCredits);
    if (finalScore > bestScore && finalScore > 0) {
      confetti({ particleCount: 75, spread: 65 });
    }
  };

  // Draw 2.5D Perspective Scene
  const drawGame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const w = canvas.width;
    const h = canvas.height;
    const vanishingX = w / 2;
    const vanishingY = h * 0.32;
    const groundY = h * 0.78;
    const focalLength = 320;
    const laneSpacing = 160;

    // Helper: Project 3D (laneOffset, heightY, z) -> 2D (screenX, screenY, scale)
    const project = (laneOffset: number, heightY: number, z: number) => {
      const scale = focalLength / (z + focalLength);
      const screenX = vanishingX + laneOffset * laneSpacing * scale;
      const screenY = groundY - heightY * scale - (z * 0.25 * scale);
      return { x: screenX, y: screenY, scale };
    };

    // Background Sky / Environment
    if (theme === 'subway') {
      // Cityscape neon dusk
      const bgGrad = ctx.createLinearGradient(0, 0, 0, vanishingY);
      bgGrad.addColorStop(0, '#0a0d18');
      bgGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, vanishingY);

      // Distant skyscrapers
      ctx.fillStyle = '#0f172a';
      for (let b = 0; b < 12; b++) {
        const bx = (b * (w / 10));
        const bw = 45 + (b % 3) * 15;
        const bh = 50 + (b % 4) * 25;
        ctx.fillRect(bx, vanishingY - bh, bw, bh);

        // Building windows
        ctx.fillStyle = (b % 2 === 0) ? '#f59e0b' : '#38bdf8';
        ctx.fillRect(bx + 8, vanishingY - bh + 10, 4, 6);
        ctx.fillRect(bx + 18, vanishingY - bh + 10, 4, 6);
        ctx.fillStyle = '#0f172a';
      }
    } else {
      // Ancient Temple Jungle
      const bgGrad = ctx.createLinearGradient(0, 0, 0, vanishingY);
      bgGrad.addColorStop(0, '#04160c');
      bgGrad.addColorStop(1, '#0e3a20');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, vanishingY);

      // Distant Temple pyramids & Jungle trees
      ctx.fillStyle = '#062413';
      ctx.beginPath();
      ctx.moveTo(w * 0.2, vanishingY);
      ctx.lineTo(w * 0.35, vanishingY - 60);
      ctx.lineTo(w * 0.5, vanishingY);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w * 0.55, vanishingY);
      ctx.lineTo(w * 0.75, vanishingY - 80);
      ctx.lineTo(w * 0.95, vanishingY);
      ctx.closePath();
      ctx.fill();
    }

    // Ground Runway / Tracks
    ctx.fillStyle = theme === 'subway' ? '#070913' : '#141c10';
    ctx.fillRect(0, vanishingY, w, h - vanishingY);

    // 3 Runway Lane Lines converging to vanishing point
    const laneDividers = [-1.5, -0.5, 0.5, 1.5];
    ctx.strokeStyle = theme === 'subway' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(234, 179, 8, 0.3)';
    ctx.lineWidth = 2;

    laneDividers.forEach(ld => {
      const topP = project(ld, 0, 1200);
      const bottomP = project(ld, 0, 0);
      ctx.beginPath();
      ctx.moveTo(topP.x, topP.y);
      ctx.lineTo(bottomP.x, bottomP.y);
      ctx.stroke();
    });

    // Horizontal track sleepers / stone tiles moving with distance
    const sleeperOffset = (distance * 3) % 40;
    ctx.strokeStyle = theme === 'subway' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(234, 179, 8, 0.12)';
    ctx.lineWidth = 1;

    for (let z = 0; z < 1000; z += 50) {
      const actualZ = z - sleeperOffset;
      if (actualZ > 0) {
        const leftP = project(-1.5, 0, actualZ);
        const rightP = project(1.5, 0, actualZ);
        ctx.beginPath();
        ctx.moveTo(leftP.x, leftP.y);
        ctx.lineTo(rightP.x, rightP.y);
        ctx.stroke();
      }
    }

    // Sort entities by Z-depth (draw farthest first for proper depth occlusion)
    const renderList: Array<{
      type: 'obstacle' | 'coin' | 'powerup';
      z: number;
      data: RunnerObstacle | RunnerCoin | RunnerPowerup;
    }> = [];

    obstaclesRef.current.forEach(o => renderList.push({ type: 'obstacle', z: o.z, data: o }));
    coinsArrayRef.current.forEach(c => {
      if (!c.collected) renderList.push({ type: 'coin', z: c.z, data: c });
    });
    powerupsArrayRef.current.forEach(pu => {
      if (!pu.collected) renderList.push({ type: 'powerup', z: pu.z, data: pu });
    });

    renderList.sort((a, b) => b.z - a.z); // descending: farthest first

    // Draw Entities
    renderList.forEach(item => {
      if (item.type === 'obstacle') {
        const obs = item.data as RunnerObstacle;
        const p = project(obs.lane, 0, obs.z);
        const wScaled = obs.width * p.scale;
        const hScaled = obs.height * p.scale;

        if (obs.type === 'train' || obs.type === 'temple_statue') {
          // 3D Box for Subway Train / Temple Idol
          ctx.fillStyle = theme === 'subway' ? '#1e293b' : '#3f2e18';
          ctx.strokeStyle = theme === 'subway' ? '#38bdf8' : '#eab308';
          ctx.lineWidth = 2 * p.scale;

          // Front face
          ctx.fillRect(p.x - wScaled / 2, p.y - hScaled, wScaled, hScaled);
          ctx.strokeRect(p.x - wScaled / 2, p.y - hScaled, wScaled, hScaled);

          // Headlights or Idol Eyes
          ctx.fillStyle = theme === 'subway' ? '#facc15' : '#ef4444';
          ctx.shadowBlur = 10 * p.scale;
          ctx.shadowColor = ctx.fillStyle;
          ctx.beginPath();
          ctx.arc(p.x - wScaled * 0.28, p.y - hScaled * 0.4, 4 * p.scale, 0, Math.PI * 2);
          ctx.arc(p.x + wScaled * 0.28, p.y - hScaled * 0.4, 4 * p.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (obs.type === 'barrier_low') {
          // Low Barrier (Striped Roadblock / Fallen Log)
          ctx.fillStyle = theme === 'subway' ? '#ef4444' : '#78350f';
          ctx.fillRect(p.x - wScaled / 2, p.y - hScaled, wScaled, hScaled);

          // Caution stripes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(p.x - wScaled * 0.25, p.y - hScaled, wScaled * 0.2, hScaled);
          ctx.fillRect(p.x + wScaled * 0.1, p.y - hScaled, wScaled * 0.2, hScaled);
        } else if (obs.type === 'barrier_high') {
          // High Barrier to slide under
          ctx.fillStyle = theme === 'subway' ? '#38bdf8' : '#f59e0b';
          ctx.fillRect(p.x - wScaled / 2, p.y - hScaled - 30 * p.scale, wScaled, 18 * p.scale);

          // Support poles on sides
          ctx.fillStyle = '#64748b';
          ctx.fillRect(p.x - wScaled / 2, p.y - hScaled - 30 * p.scale, 4 * p.scale, hScaled + 30 * p.scale);
          ctx.fillRect(p.x + wScaled / 2 - 4 * p.scale, p.y - hScaled - 30 * p.scale, 4 * p.scale, hScaled + 30 * p.scale);
        }
      } else if (item.type === 'coin') {
        const c = item.data as RunnerCoin;
        const p = project(c.lane, c.yOffset, c.z);
        const r = 9 * p.scale;

        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12 * p.scale;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5 * p.scale;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (item.type === 'powerup') {
        const pu = item.data as RunnerPowerup;
        const p = project(pu.lane, 20, pu.z);
        const r = 12 * p.scale;

        const colors = {
          magnet: '#38bdf8',
          hoverboard: '#f43f5e',
          sneakers: '#10b981',
          multiplier: '#a855f7',
        };

        ctx.fillStyle = colors[pu.type];
        ctx.shadowBlur = 14 * p.scale;
        ctx.shadowColor = colors[pu.type];
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(10 * p.scale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pu.type[0].toUpperCase(), p.x, p.y);
        ctx.shadowBlur = 0;
      }
    });

    // Draw Runner Character (Close foreground)
    const player = playerRef.current;
    const playerP = project(player.laneX, player.y, 45); // close Z
    const charW = player.isSliding ? 48 : 34;
    const charH = player.isSliding ? 22 : 56;

    // Ground Shadow under player
    const shadowP = project(player.laneX, 0, 45);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(shadowP.x, shadowP.y, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hoverboard under feet if active
    if (activeHoverboard) {
      ctx.fillStyle = '#f43f5e';
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#f43f5e';
      ctx.beginPath();
      ctx.roundRect(playerP.x - 24, playerP.y + 4, 48, 8, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Runner Avatar
    ctx.save();
    ctx.translate(playerP.x, playerP.y - charH / 2);

    if (theme === 'subway') {
      // Cyberpunk Subway Surfer Outfit
      ctx.fillStyle = '#0284c7';
      ctx.roundRect(-charW / 2, -charH / 2, charW, charH, 6);
      ctx.fill();

      // Cap / Head
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -charH / 2 - 8, 10, 0, Math.PI * 2);
      ctx.fill();

      // Cap visor pointing forward
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-2, -charH / 2 - 14, 14, 4);
    } else {
      // Temple Relic Explorer Outfit
      ctx.fillStyle = '#b45309';
      ctx.roundRect(-charW / 2, -charH / 2, charW, charH, 6);
      ctx.fill();

      // Fedora hat / Explorer head
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(0, -charH / 2 - 8, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-14, -charH / 2 - 10, 28, 4);
    }

    // Magnet aura if active
    if (activeMagnet > 0) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();

    // Chaser pursuing closely behind (Foreground / low Z)
    if (theme === 'temple') {
      // Demon Monkey Chaser
      const chaserP = project(player.laneX, 0, 15);
      ctx.save();
      ctx.translate(chaserP.x, chaserP.y - 40);

      // Dark muscular gorilla silhouette
      ctx.fillStyle = '#0f0804';
      ctx.beginPath();
      ctx.arc(0, -20, 18, 0, Math.PI * 2); // head
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(-24, -12, 48, 36, 10); // torso
      ctx.fill();

      // Menacing glowing red eyes
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(-7, -22, 3, 0, Math.PI * 2);
      ctx.arc(7, -22, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Claws reaching forward
      ctx.fillStyle = '#1c1007';
      ctx.beginPath();
      ctx.roundRect(-30, -5, 12, 28, 4);
      ctx.roundRect(18, -5, 12, 28, 4);
      ctx.fill();

      ctx.restore();
    } else {
      // Subway Inspector & Guard Dog pursuit silhouette
      const chaserP = project(player.laneX, 0, 15);
      ctx.save();
      ctx.translate(chaserP.x - 18, chaserP.y - 32);

      // Inspector silhouette
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -18, 11, 0, Math.PI * 2); // head
      ctx.fill();
      ctx.roundRect(-14, -8, 28, 32, 6); // coat
      ctx.fill();

      // Guard Dog next to inspector
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(22, 2, 22, 14, 4); // dog body
      ctx.arc(42, -2, 6, 0, Math.PI * 2); // dog head
      ctx.fill();

      ctx.restore();
    }

    // Particles (Slide sparks, coin pick sparkles)
    particlesRef.current.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.life / pt.maxLife;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full flex flex-col items-center select-none"
    >
      {/* Top Runner HUD */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-t-xl text-xs font-arcade">
        {/* Distance & Coins */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <span className="text-neutral-500 font-mono">DIST</span>
            <span className="text-base tracking-wider">{distance}m</span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-base">{coinsCollected}</span>
          </div>

          {activeHoverboard && (
            <div className="flex items-center gap-1 text-rose-400 font-bold animate-pulse">
              <Shield className="w-3.5 h-3.5" />
              <span>HOVERBOARD ON</span>
            </div>
          )}

          {activeMagnet > 0 && (
            <div className="flex items-center gap-1 text-cyan-300 font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>MAGNET</span>
            </div>
          )}
        </div>

        {/* Theme Switch & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Selector Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              setTheme(t => (t === 'subway' ? 'temple' : 'subway'));
              resetGame();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-arcade text-neutral-200 border border-neutral-700 transition-colors"
          >
            {theme === 'subway' ? (
              <>
                <Train className="w-3.5 h-3.5 text-cyan-400" />
                <span>SUBWAY SURF</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>TEMPLE RUN</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsPaused(p => !p)}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              const muted = sound.toggleMute();
              setSoundEnabled(!muted);
            }}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
          </button>

          <button
            onClick={resetGame}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Runway */}
      <div className="relative w-full aspect-[16/9] border-x border-b border-neutral-800 bg-neutral-950 rounded-b-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={640}
          height={380}
          className="w-full h-full block touch-none"
        />

        <div className="absolute inset-0 crt-overlay pointer-events-none" />

        {/* Game Over Screen */}
        {isGameOver && (
          <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="text-rose-500 font-arcade text-3xl sm:text-4xl font-bold tracking-widest mb-1 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]">
              CRASH DETECTED!
            </div>
            <p className="text-neutral-400 text-xs sm:text-sm mb-6">
              {theme === 'subway' ? 'Collision with hyper-rail barrier' : 'Ancient relic guardian caught up!'}
            </p>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 mb-6 w-full max-w-xs space-y-2 font-arcade">
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">DISTANCE REACHED</span>
                <span className="text-cyan-400 text-xl font-bold">{distance}m</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">COINS GATHERED</span>
                <span className="text-amber-400 font-bold">{coinsCollected}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">FINAL SCORE</span>
                <span className="text-emerald-400 font-bold">{distance + coinsCollected * 10}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-neutral-800 pt-2">
                <span className="text-neutral-400">RECORD</span>
                <span className="text-neutral-200 font-bold">{Math.max(distance + coinsCollected * 10, bestScore)}</span>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-arcade font-bold tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              RUN AGAIN
            </button>
          </div>
        )}
      </div>

      {/* On-Screen Touch Direction & Action Controls for Mobile */}
      <div className="w-full mt-3 p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl grid grid-cols-2 gap-4 sm:hidden select-none">
        {/* Left / Right Lane Switch */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => switchLane('left')}
            className="w-14 h-14 rounded-xl bg-neutral-800 active:bg-cyan-500 active:text-neutral-950 text-cyan-400 font-arcade font-bold text-lg flex items-center justify-center border border-neutral-700"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => switchLane('right')}
            className="w-14 h-14 rounded-xl bg-neutral-800 active:bg-cyan-500 active:text-neutral-950 text-cyan-400 font-arcade font-bold text-lg flex items-center justify-center border border-neutral-700"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* Jump / Slide Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={jump}
            className="w-14 h-14 rounded-xl bg-neutral-800 active:bg-emerald-500 active:text-neutral-950 text-emerald-400 font-arcade font-bold text-xs flex flex-col items-center justify-center border border-neutral-700"
          >
            <ArrowUp className="w-5 h-5" />
            <span>JUMP</span>
          </button>
          <button
            onClick={slide}
            className="w-14 h-14 rounded-xl bg-neutral-800 active:bg-amber-500 active:text-neutral-950 text-amber-400 font-arcade font-bold text-xs flex flex-col items-center justify-center border border-neutral-700"
          >
            <ArrowDown className="w-5 h-5" />
            <span>SLIDE</span>
          </button>
        </div>
      </div>

      {/* Desktop Key Controls Guide */}
      <div className="mt-2 text-xs font-mono text-neutral-500 text-center hidden sm:block">
        ← / → or A / D to Switch Lanes • ↑ or W or Space to JUMP • ↓ or S to SLIDE • B for Hoverboard
      </div>
    </div>
  );
};
