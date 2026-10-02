import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';
import { Arrow, ArrowType, Particle, FloatText } from '../types/game';
import { 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Award, 
  Wind, 
  Flame, 
  Target, 
  Play, 
  Pause,
  Sparkles,
  Info
} from 'lucide-react';

interface Props {
  onGameOver: (score: number, creditsEarned: number) => void;
  bestScore: number;
}

interface TargetBoard {
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  minY: number;
  maxY: number;
  distance: number; // in meters (25m to 70m)
  hasApple: boolean;
  appleY: number;
  appleHit: boolean;
}

interface Balloon {
  x: number;
  y: number;
  radius: number;
  vy: number;
  color: string;
  points: number;
}

export const ArcheryMaster: React.FC<Props> = ({ onGameOver, bestScore }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [arrowsRemaining, setArrowsRemaining] = useState(10);
  const [level, setLevel] = useState(1);
  const [selectedArrowType, setSelectedArrowType] = useState<ArrowType>('standard');
  const [unlockedTypes, setUnlockedTypes] = useState<ArrowType[]>(['standard', 'fire']);
  const [wind, setWind] = useState({ speed: 1.2, direction: 1 }); // speed in m/s, direction 1 (right) or -1 (left)
  const [combo, setCombo] = useState(1);
  const [bullseyes, setBullseyes] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastShotFeedback, setLastShotFeedback] = useState<string | null>(null);

  // Bow & Aiming state
  const bowPosRef = useRef({ x: 90, y: 320 });
  const isAimingRef = useRef(false);
  const dragStartRef = useRef({ x: 90, y: 320 });
  const dragCurrentRef = useRef({ x: 90, y: 320 });
  const pullPowerRef = useRef(0); // 0 to 1
  const pullAngleRef = useRef(0); // in radians

  // Target board state
  const targetRef = useRef<TargetBoard>({
    x: 620,
    y: 300,
    w: 24,
    h: 140,
    vy: 0,
    minY: 180,
    maxY: 420,
    distance: 30,
    hasApple: true,
    appleY: 300 - 85,
    appleHit: false,
  });

  const arrowsRef = useRef<Arrow[]>([]);
  const balloonsRef = useRef<Balloon[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatTextsRef = useRef<FloatText[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const arrowsRemainingRef = useRef(10);
  arrowsRemainingRef.current = arrowsRemaining;
  const isGameOverRef = useRef(false);
  isGameOverRef.current = isGameOver;

  // New level configuration
  const setupTargetForLevel = useCallback((lvl: number) => {
    const canvas = canvasRef.current;
    const w = canvas ? canvas.width : 760;
    const targetX = Math.min(w - 70, 520 + lvl * 25);
    const speed = lvl >= 2 ? (lvl - 1) * 0.9 : 0;

    targetRef.current = {
      x: targetX,
      y: 290,
      w: 22,
      h: Math.max(100, 150 - lvl * 8),
      vy: speed,
      minY: 160,
      maxY: 420,
      distance: 25 + lvl * 10,
      hasApple: true,
      appleY: 290 - 75,
      appleHit: false,
    };

    // Randomize wind
    const newWindSpeed = Number((Math.random() * (1.5 + lvl * 0.6)).toFixed(1));
    const newWindDir = Math.random() > 0.5 ? 1 : -1;
    setWind({ speed: newWindSpeed, direction: newWindDir });

    // Spawn bonus balloon
    if (Math.random() < 0.6) {
      balloonsRef.current.push({
        x: 350 + Math.random() * 150,
        y: 480,
        radius: 14,
        vy: -1.2 - Math.random() * 0.8,
        color: Math.random() > 0.5 ? '#f43f5e' : '#eab308',
        points: 150,
      });
    }
  }, []);

  const resetGame = useCallback(() => {
    setScore(0);
    setArrowsRemaining(10);
    setLevel(1);
    setCombo(1);
    setBullseyes(0);
    setIsGameOver(false);
    setIsPaused(false);
    setLastShotFeedback(null);
    arrowsRef.current = [];
    balloonsRef.current = [];
    particlesRef.current = [];
    floatTextsRef.current = [];
    setupTargetForLevel(1);
  }, [setupTargetForLevel]);

  // Main canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const w = parent.clientWidth;
        const h = Math.min(540, Math.max(380, Math.floor(w * 0.58)));
        canvas.width = w;
        canvas.height = h;
        bowPosRef.current = { x: 85, y: h * 0.58 };
      }
    };
    resize();
    window.addEventListener('resize', resize);
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
      window.removeEventListener('resize', resize);
    };
  }, [isPaused, resetGame]);

  // Launch Arrow Logic
  const fireArrow = () => {
    if (arrowsRemainingRef.current <= 0) return;

    const power = pullPowerRef.current;
    if (power < 0.15) return; // Too weak, cancelled shot

    sound.playBowRelease();

    const speed = 10 + power * 18;
    const angle = pullAngleRef.current;
    const bowX = bowPosRef.current.x;
    const bowY = bowPosRef.current.y;

    if (selectedArrowType === 'triple') {
      // Fire 3 arrows
      [-0.08, 0, 0.08].forEach(spread => {
        arrowsRef.current.push({
          x: bowX,
          y: bowY,
          vx: Math.cos(angle + spread) * speed,
          vy: Math.sin(angle + spread) * speed,
          angle: angle + spread,
          length: 42,
          type: 'triple',
          inFlight: true,
        });
      });
    } else {
      arrowsRef.current.push({
        x: bowX,
        y: bowY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: angle,
        length: 44,
        type: selectedArrowType,
        inFlight: true,
      });
    }

    setArrowsRemaining(prev => {
      const next = prev - 1;
      arrowsRemainingRef.current = next;
      return next;
    });
  };

  // Drag Aim Handling
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isGameOver || isPaused || arrowsRemaining <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const posX = (e.clientX - rect.left) * scaleX;
    const posY = (e.clientY - rect.top) * scaleY;

    isAimingRef.current = true;
    dragStartRef.current = { x: posX, y: posY };
    dragCurrentRef.current = { x: posX, y: posY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isAimingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const posX = (e.clientX - rect.left) * scaleX;
    const posY = (e.clientY - rect.top) * scaleY;

    dragCurrentRef.current = { x: posX, y: posY };

    // Pull vector: pulling backward pulls string, aiming forward
    const dx = dragStartRef.current.x - posX;
    const dy = dragStartRef.current.y - posY;
    const dist = Math.hypot(dx, dy);

    pullPowerRef.current = Math.min(1.0, dist / 110);
    // Aiming angle in direction of arrow launch
    pullAngleRef.current = Math.atan2(-dy, dx);
  };

  const handlePointerUp = () => {
    if (!isAimingRef.current) return;
    isAimingRef.current = false;
    fireArrow();
    pullPowerRef.current = 0;
  };

  // Game update cycle
  const updateGame = (canvas: HTMLCanvasElement) => {
    const w = canvas.width;
    const h = canvas.height;
    const target = targetRef.current;

    // Move target vertically if moving level
    if (target.vy !== 0) {
      target.y += target.vy;
      if (target.y < target.minY) {
        target.y = target.minY;
        target.vy = Math.abs(target.vy);
      } else if (target.y > target.maxY) {
        target.y = target.maxY;
        target.vy = -Math.abs(target.vy);
      }
      target.appleY = target.y - target.h / 2 - 12;
    }

    // Update Balloons
    for (let bIdx = balloonsRef.current.length - 1; bIdx >= 0; bIdx--) {
      const b = balloonsRef.current[bIdx];
      b.y += b.vy;
      b.x += wind.direction * wind.speed * 0.3;
      if (b.y < -30) balloonsRef.current.splice(bIdx, 1);
    }

    // Update Arrows
    let anyInFlight = false;

    arrowsRef.current.forEach(arrow => {
      if (!arrow.inFlight) {
        // If stuck in moving target, move with target!
        if (arrow.stuckInTarget && arrow.stuckOffset) {
          arrow.x = target.x + arrow.stuckOffset.x;
          arrow.y = target.y + arrow.stuckOffset.y;
        }
        return;
      }

      anyInFlight = true;

      // Ballistic gravity & wind drift
      arrow.vy += 0.22; // gravity
      arrow.vx += wind.direction * (wind.speed * 0.025); // wind effect

      arrow.x += arrow.vx;
      arrow.y += arrow.vy;
      arrow.angle = Math.atan2(arrow.vy, arrow.vx);

      // Fire Arrow flame particles
      if (arrow.type === 'fire') {
        for (let fp = 0; fp < 3; fp++) {
          particlesRef.current.push({
            x: arrow.x - Math.cos(arrow.angle) * 15,
            y: arrow.y - Math.sin(arrow.angle) * 15,
            vx: -Math.cos(arrow.angle) * 1.5 + (Math.random() - 0.5),
            vy: -Math.sin(arrow.angle) * 1.5 - Math.random() * 1.5,
            color: Math.random() > 0.5 ? '#f97316' : '#facc15',
            radius: Math.random() * 2.5 + 1,
            life: 18,
            maxLife: 18,
          });
        }
      }

      // Check collision with Bonus Balloons
      for (let bIdx = balloonsRef.current.length - 1; bIdx >= 0; bIdx--) {
        const b = balloonsRef.current[bIdx];
        const dist = Math.hypot(arrow.x - b.x, arrow.y - b.y);
        if (dist < b.radius + 8) {
          sound.playPop();
          balloonsRef.current.splice(bIdx, 1);
          setScore(s => s + b.points);

          // Balloon pop particles
          for (let bp = 0; bp < 20; bp++) {
            const bAngle = Math.random() * Math.PI * 2;
            const bSpd = Math.random() * 3 + 1;
            particlesRef.current.push({
              x: b.x,
              y: b.y,
              vx: Math.cos(bAngle) * bSpd,
              vy: Math.sin(bAngle) * bSpd,
              color: b.color,
              radius: 2,
              life: 25,
              maxLife: 25,
            });
          }

          floatTextsRef.current.push({
            x: b.x,
            y: b.y - 15,
            text: `+${b.points} BALLOON POP!`,
            color: b.color,
            life: 45,
          });
        }
      }

      // Check collision with Golden Apple atop target
      if (target.hasApple && !target.appleHit) {
        const appleX = target.x + target.w / 2;
        const appleY = target.appleY;
        const appleDist = Math.hypot(arrow.x - appleX, arrow.y - appleY);

        if (appleDist < 16) {
          target.appleHit = true;
          sound.playBullseye();
          sound.playPop();

          const applePts = 300 * combo;
          setScore(s => s + applePts);
          setArrowsRemaining(a => a + 1); // Extra arrow reward!

          floatTextsRef.current.push({
            x: appleX,
            y: appleY - 25,
            text: `GOLDEN APPLE! +${applePts} (+1 ARROW)`,
            color: '#facc15',
            life: 60,
          });

          confetti({ particleCount: 50, spread: 60, origin: { x: appleX / w, y: appleY / h } });
        }
      }

      // Check collision with Target Board
      const targetTop = target.y - target.h / 2;
      const targetBottom = target.y + target.h / 2;

      if (
        arrow.x >= target.x - 6 &&
        arrow.x <= target.x + target.w + 6 &&
        arrow.y >= targetTop &&
        arrow.y <= targetBottom
      ) {
        arrow.inFlight = false;
        arrow.stuckInTarget = true;
        arrow.stuckOffset = {
          x: arrow.x - target.x,
          y: arrow.y - target.y,
        };

        sound.playArrowHit();

        // Calculate score based on distance from center
        const centerDist = Math.abs(arrow.y - target.y);
        const halfH = target.h / 2;
        const normalized = centerDist / halfH; // 0 = dead center, 1 = rim edge

        let pts = 10;
        let feedback = 'OUTER 1';

        if (normalized < 0.12) {
          pts = 100;
          feedback = 'PERFECT BULLSEYE 10X!';
          sound.playBullseye();
          setBullseyes(b => b + 1);
          setCombo(c => Math.min(5, c + 1));
          confetti({ particleCount: 65, spread: 55 });
        } else if (normalized < 0.28) {
          pts = 80;
          feedback = 'GOLD RING 10';
          sound.playBullseye();
          setCombo(c => Math.min(5, c + 1));
        } else if (normalized < 0.50) {
          pts = 60;
          feedback = 'RED RING 8';
        } else if (normalized < 0.72) {
          pts = 40;
          feedback = 'BLUE RING 6';
        } else if (normalized < 0.88) {
          pts = 25;
          feedback = 'BLACK RING 4';
        } else {
          pts = 10;
          feedback = 'WHITE RING 2';
        }

        const totalEarned = pts * combo;
        arrow.scoreAwarded = totalEarned;
        setScore(s => s + totalEarned);
        setLastShotFeedback(`${feedback} (+${totalEarned})`);

        floatTextsRef.current.push({
          x: target.x - 30,
          y: arrow.y - 10,
          text: feedback,
          color: normalized < 0.28 ? '#facc15' : '#38bdf8',
          life: 50,
        });

        // Bomb arrow explosion
        if (arrow.type === 'bomb') {
          sound.playExplosion();
          for (let bp = 0; bp < 35; bp++) {
            const pAngle = Math.random() * Math.PI * 2;
            const pSpd = Math.random() * 5 + 1;
            particlesRef.current.push({
              x: arrow.x,
              y: arrow.y,
              vx: Math.cos(pAngle) * pSpd,
              vy: Math.sin(pAngle) * pSpd,
              color: '#f43f5e',
              radius: Math.random() * 3 + 1,
              life: 30,
              maxLife: 30,
            });
          }
        }
      }

      // Check ground collision
      if (arrow.y > h - 35) {
        arrow.inFlight = false;
        arrow.y = h - 35;
        sound.playArrowHit();
        setCombo(1);
        setLastShotFeedback('MISSED TARGET (GROUND)');
      }

      // Flew past screen right
      if (arrow.x > w + 50) {
        arrow.inFlight = false;
        setCombo(1);
        setLastShotFeedback('MISSED TARGET (OVER-SHOT)');
      }
    });

    // Check round over (no arrows remaining and all fired arrows landed)
    if (arrowsRemainingRef.current <= 0 && !anyInFlight && !isGameOverRef.current) {
      setTimeout(() => {
        setIsGameOver(true);
        sound.playGameOver();
        const earnedCredits = Math.max(15, Math.floor(scoreRef.current / 15));
        onGameOver(scoreRef.current, earnedCredits);
      }, 900);
    }

    // Update Particles
    for (let pIdx = particlesRef.current.length - 1; pIdx >= 0; pIdx--) {
      const pt = particlesRef.current[pIdx];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) particlesRef.current.splice(pIdx, 1);
    }

    // Update Float Texts
    for (let fIdx = floatTextsRef.current.length - 1; fIdx >= 0; fIdx--) {
      const ft = floatTextsRef.current[fIdx];
      ft.y -= 0.6;
      ft.life--;
      if (ft.life <= 0) floatTextsRef.current.splice(fIdx, 1);
    }
  };

  // Draw scene
  const drawGame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const w = canvas.width;
    const h = canvas.height;
    const target = targetRef.current;
    const bow = bowPosRef.current;

    // Outdoor archery range gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#091522');
    skyGrad.addColorStop(0.65, '#13283e');
    skyGrad.addColorStop(1, '#0e1d2c');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Distant mountain silhouette
    ctx.fillStyle = 'rgba(8, 17, 28, 0.6)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    ctx.lineTo(w * 0.25, h * 0.52);
    ctx.lineTo(w * 0.55, h * 0.68);
    ctx.lineTo(w * 0.85, h * 0.48);
    ctx.lineTo(w, h * 0.65);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Grass range ground
    ctx.fillStyle = '#0a1d13';
    ctx.fillRect(0, h - 35, w, 35);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, h - 35);
    ctx.lineTo(w, h - 35);
    ctx.stroke();

    // Distance hash markers along ground
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = '10px "JetBrains Mono"';
    for (let d = 20; d <= 80; d += 15) {
      const markX = 140 + (d / 80) * (w - 220);
      ctx.fillRect(markX, h - 35, 1, 6);
      ctx.fillText(`${d}M`, markX - 8, h - 18);
    }

    // Draw Balloons
    balloonsRef.current.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Balloon string
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + b.radius);
      ctx.lineTo(b.x + Math.sin(b.y * 0.05) * 4, b.y + b.radius + 16);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // Draw Target Stand & Butt
    const targetTop = target.y - target.h / 2;
    const targetH = target.h;

    // Wooden A-frame tripod legs
    ctx.strokeStyle = '#52341d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(target.x + target.w / 2, target.y);
    ctx.lineTo(target.x - 14, h - 35);
    ctx.moveTo(target.x + target.w / 2, target.y);
    ctx.lineTo(target.x + target.w + 14, h - 35);
    ctx.stroke();

    // Target backboard
    ctx.fillStyle = '#29180d';
    ctx.fillRect(target.x - 4, targetTop - 4, target.w + 8, targetH + 8);

    // Target Concentric Colored Bands (Cross-section view from side/slight angle)
    const rings = [
      { ratio: 1.0, color: '#f8fafc' }, // White (1-2)
      { ratio: 0.82, color: '#1e293b' }, // Black (3-4)
      { ratio: 0.62, color: '#0284c7' }, // Blue (5-6)
      { ratio: 0.42, color: '#dc2626' }, // Red (7-8)
      { ratio: 0.22, color: '#facc15' }, // Gold (9-10)
      { ratio: 0.08, color: '#ea580c' }, // Center X Ring
    ];

    rings.forEach(ring => {
      const ringHeight = targetH * ring.ratio;
      const ry = target.y - ringHeight / 2;
      ctx.fillStyle = ring.color;
      ctx.fillRect(target.x, ry, target.w, ringHeight);
    });

    // Golden Apple atop target
    if (target.hasApple && !target.appleHit) {
      const appleX = target.x + target.w / 2;
      const appleY = target.appleY;
      ctx.fillStyle = '#facc15';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#facc15';
      ctx.beginPath();
      ctx.arc(appleX, appleY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Stem
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(appleX, appleY - 7);
      ctx.lineTo(appleX + 3, appleY - 11);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw Stuck and Flying Arrows
    arrowsRef.current.forEach(arrow => {
      ctx.save();
      ctx.translate(arrow.x, arrow.y);
      ctx.rotate(arrow.angle);

      // Arrow shaft
      ctx.strokeStyle = arrow.type === 'fire' ? '#ea580c' : arrow.type === 'bomb' ? '#e11d48' : '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-arrow.length * 0.75, 0);
      ctx.lineTo(arrow.length * 0.25, 0);
      ctx.stroke();

      // Arrow head (triangular point)
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(arrow.length * 0.25, -3);
      ctx.lineTo(arrow.length * 0.25 + 6, 0);
      ctx.lineTo(arrow.length * 0.25, 3);
      ctx.closePath();
      ctx.fill();

      // Arrow fletching feathers at nock
      ctx.fillStyle = arrow.type === 'fire' ? '#f97316' : '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(-arrow.length * 0.75, 0);
      ctx.lineTo(-arrow.length * 0.75 - 6, -3);
      ctx.lineTo(-arrow.length * 0.75 - 2, 0);
      ctx.lineTo(-arrow.length * 0.75 - 6, 3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });

    // Draw Aiming Guide Trajectory Arc if aiming
    if (isAimingRef.current && pullPowerRef.current > 0.05) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);

      ctx.beginPath();
      let simX = bow.x;
      let simY = bow.y;
      const simSpeed = 10 + pullPowerRef.current * 18;
      let simVx = Math.cos(pullAngleRef.current) * simSpeed;
      let simVy = Math.sin(pullAngleRef.current) * simSpeed;

      ctx.moveTo(simX, simY);
      for (let step = 0; step < 26; step++) {
        simVy += 0.22;
        simVx += wind.direction * (wind.speed * 0.025);
        simX += simVx;
        simY += simVy;
        ctx.lineTo(simX, simY);
        if (simY > h - 35) break;
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Bow & Archer Rig
    ctx.save();
    ctx.translate(bow.x, bow.y);

    const aimAngle = isAimingRef.current ? pullAngleRef.current : -0.2;
    ctx.rotate(aimAngle);

    // Bow wooden curved stave
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 32, -Math.PI * 0.45, Math.PI * 0.45, false);
    ctx.stroke();

    // Bowstring
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    const topNockY = -Math.sin(Math.PI * 0.45) * 32;
    const topNockX = Math.cos(Math.PI * 0.45) * 32;
    const bottomNockY = Math.sin(Math.PI * 0.45) * 32;
    const bottomNockX = topNockX;

    const pullBackDist = isAimingRef.current ? pullPowerRef.current * 24 : 0;

    ctx.beginPath();
    ctx.moveTo(topNockX, topNockY);
    ctx.lineTo(-pullBackDist, 0); // drawn string pinch
    ctx.lineTo(bottomNockX, bottomNockY);
    ctx.stroke();

    // Notched arrow in bow
    if (arrowsRemaining > 0) {
      ctx.strokeStyle = selectedArrowType === 'fire' ? '#ea580c' : '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-pullBackDist, 0);
      ctx.lineTo(34 - pullBackDist, 0);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(34 - pullBackDist, -2.5);
      ctx.lineTo(40 - pullBackDist, 0);
      ctx.lineTo(34 - pullBackDist, 2.5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // Draw Particles
    particlesRef.current.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.life / pt.maxLife;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Floating Texts
    floatTextsRef.current.forEach(ft => {
      ctx.font = 'bold 12px "Chakra Petch", sans-serif';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    });
  };

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* HUD Header */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-t-xl text-xs font-arcade">
        {/* Vitals / Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="text-neutral-500">SCORE</span>
            <span className="text-base font-bold tracking-wider">{score}</span>
          </div>

          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <span className="text-neutral-500">QUIVER</span>
            <span>{arrowsRemaining} / 10</span>
          </div>

          {/* Wind Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300">
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            <span>WIND: {wind.speed} m/s {wind.direction > 0 ? '▶' : '◀'}</span>
          </div>

          {combo > 1 && (
            <div className="hidden sm:inline text-rose-400 font-bold animate-pulse">
              {combo}X STREAK!
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 text-neutral-400">
            <Award className="w-4 h-4 text-amber-400" />
            <span>RECORD: <strong className="text-neutral-200">{Math.max(score, bestScore)}</strong></span>
          </div>

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
            title="Restart Match"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full aspect-[16/9] border-x border-b border-neutral-800 bg-neutral-950 rounded-b-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full block cursor-crosshair touch-none"
        />

        <div className="absolute inset-0 crt-overlay pointer-events-none" />

        {/* Pull Power Meter if aiming */}
        {pullPowerRef.current > 0.05 && (
          <div className="absolute top-4 left-4 bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl font-mono text-xs flex flex-col gap-1 w-36 pointer-events-none">
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>DRAW POWER</span>
              <span className="text-cyan-400 font-bold">{Math.round(pullPowerRef.current * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 transition-all duration-75"
                style={{ width: `${pullPowerRef.current * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Last Shot Feedback Pill */}
        {lastShotFeedback && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-neutral-900/90 border border-neutral-700 px-4 py-1.5 rounded-full font-arcade text-xs text-amber-300 font-bold shadow-lg pointer-events-none animate-in fade-in slide-in-from-bottom-2">
            {lastShotFeedback}
          </div>
        )}

        {/* Game Over Screen */}
        {isGameOver && (
          <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="text-amber-400 font-arcade text-3xl sm:text-4xl font-bold tracking-widest mb-1 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              ROUND FINISHED
            </div>
            <p className="text-neutral-400 text-xs sm:text-sm mb-6">Quiver depleted. Final qualification scores tallied.</p>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 mb-6 w-full max-w-xs space-y-2 font-arcade">
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">TOTAL SCORE</span>
                <span className="text-cyan-400 text-xl font-bold">{score}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">PERFECT BULLSEYES</span>
                <span className="text-amber-400 font-bold">{bullseyes}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">CREDITS EARNED</span>
                <span className="text-emerald-400 font-bold">+{Math.max(15, Math.floor(score / 15))} CR</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-neutral-800 pt-2">
                <span className="text-neutral-400">RECORD</span>
                <span className="text-neutral-200 font-bold">{Math.max(score, bestScore)}</span>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-arcade font-bold tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/25 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              SHOOT NEW ROUND
            </button>
          </div>
        )}
      </div>

      {/* Quiver Arrow Selection Bar */}
      <div className="w-full mt-3 p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-arcade text-neutral-400 mr-1">ARROW TYPE:</span>

          <button
            onClick={() => {
              sound.playClick();
              setSelectedArrowType('standard');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-arcade font-semibold transition-all ${
              selectedArrowType === 'standard'
                ? 'bg-neutral-800 text-cyan-400 border border-cyan-500/60 shadow-sm'
                : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
            }`}
          >
            Classic Broadhead
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setSelectedArrowType('fire');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-arcade font-semibold flex items-center gap-1 transition-all ${
              selectedArrowType === 'fire'
                ? 'bg-neutral-800 text-amber-400 border border-amber-500/60 shadow-sm'
                : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Flame Arrow</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setSelectedArrowType('triple');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-arcade font-semibold transition-all ${
              selectedArrowType === 'triple'
                ? 'bg-neutral-800 text-purple-400 border border-purple-500/60 shadow-sm'
                : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
            }`}
          >
            Triple Volley
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setSelectedArrowType('bomb');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-arcade font-semibold transition-all ${
              selectedArrowType === 'bomb'
                ? 'bg-neutral-800 text-rose-400 border border-rose-500/60 shadow-sm'
                : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
            }`}
          >
            Bomb Arrow
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click & Drag backward to draw string • Release to shoot arrow</span>
        </div>
      </div>
    </div>
  );
};
