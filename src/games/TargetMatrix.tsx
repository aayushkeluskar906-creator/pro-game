import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Award, Crosshair, Play, Pause, Target, Bot, User, Sparkles } from 'lucide-react';

interface Props {
  onGameOver: (score: number, creditsEarned: number) => void;
  bestScore: number;
}

interface TargetEntity {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'hostile' | 'drone' | 'hostage';
  lifeTime: number;
  maxLife: number;
  headshotRadius: number;
  isHit?: boolean;
}

interface ImpactSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export const TargetMatrix: React.FC<Props> = ({ onGameOver, bestScore }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [shotsFired, setShotsFired] = useState(0);
  const [shotsHit, setShotsHit] = useState(0);
  const [headshots, setHeadshots] = useState(0);
  const [combo, setCombo] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vsComputer, setVsComputer] = useState(true);

  const targetsRef = useRef<TargetEntity[]>([]);
  const sparksRef = useRef<ImpactSpark[]>([]);
  const nextTargetId = useRef(1);
  const animationFrameRef = useRef<number | null>(null);
  const mousePosRef = useRef({ x: 320, y: 180 });
  const botPosRef = useRef({ x: 100, y: 100, targetX: 100, targetY: 100, shootTimer: 0 });
  
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const botScoreRef = useRef(0);
  botScoreRef.current = botScore;
  const isGameOverRef = useRef(false);
  isGameOverRef.current = isGameOver;
  const vsComputerRef = useRef(vsComputer);
  vsComputerRef.current = vsComputer;

  const resetGame = useCallback(() => {
    setScore(0);
    setBotScore(0);
    setTimeLeft(45);
    setShotsFired(0);
    setShotsHit(0);
    setHeadshots(0);
    setCombo(1);
    setIsGameOver(false);
    setIsPaused(false);
    targetsRef.current = [];
    sparksRef.current = [];
  }, []);

  const spawnTarget = useCallback((canvas: HTMLCanvasElement) => {
    if (targetsRef.current.length >= 6) return;
    const w = canvas.width;
    const h = canvas.height;

    const randType = Math.random() < 0.15 ? 'hostage' : Math.random() < 0.35 ? 'drone' : 'hostile';
    const targetW = randType === 'drone' ? 38 : 48;
    const targetH = randType === 'drone' ? 38 : 72;

    const posX = 40 + Math.random() * (w - 80 - targetW);
    const posY = 50 + Math.random() * (h - 100 - targetH);

    targetsRef.current.push({
      id: nextTargetId.current++,
      x: posX,
      y: posY,
      w: targetW,
      h: targetH,
      type: randType,
      lifeTime: randType === 'drone' ? 85 : 120,
      maxLife: randType === 'drone' ? 85 : 120,
      headshotRadius: 10,
    });
  }, []);

  const addSparks = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      sparksRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color
      });
    }
  };

  // Timer countdown
  useEffect(() => {
    if (isGameOver || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          sound.playGameOver();
          const finalCredits = Math.max(10, Math.floor(scoreRef.current / 20));
          onGameOver(scoreRef.current, finalCredits);
          if (scoreRef.current > botScoreRef.current) {
            confetti({ particleCount: 70, spread: 70 });
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused, onGameOver]);

  // Main canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    resetGame();
    let lastSpawn = 0;

    const loop = (timestamp: number) => {
      if (!isGameOverRef.current && !isPaused) {
        if (timestamp - lastSpawn > 550) {
          lastSpawn = timestamp;
          spawnTarget(canvas);
        }

        // Update targets
        for (let i = targetsRef.current.length - 1; i >= 0; i--) {
          const t = targetsRef.current[i];
          t.lifeTime--;
          if (t.lifeTime <= 0) {
            targetsRef.current.splice(i, 1);
            if (t.type === 'hostile') {
              setCombo(1);
            }
          }
        }

        // Computer AI Marksman logic (if enabled)
        if (vsComputerRef.current && targetsRef.current.length > 0) {
          const bot = botPosRef.current;
          // Target a hostile or drone
          const hostiles = targetsRef.current.filter(t => t.type !== 'hostage');
          if (hostiles.length > 0) {
            const chosen = hostiles[0];
            bot.targetX = chosen.x + chosen.w / 2;
            bot.targetY = chosen.y + chosen.h * 0.4;
          }

          // Smooth tracking
          bot.x += (bot.targetX - bot.x) * 0.08;
          bot.y += (bot.targetY - bot.y) * 0.08;

          // AI firing cycle (realistic cadence ~850ms)
          bot.shootTimer++;
          if (bot.shootTimer > 45) {
            bot.shootTimer = 0;
            // Check if AI hit target
            const hitIndex = targetsRef.current.findIndex(t => 
              t.type !== 'hostage' &&
              Math.hypot(bot.x - (t.x + t.w / 2), bot.y - (t.y + t.h / 2)) < t.w
            );

            if (hitIndex !== -1) {
              const hitT = targetsRef.current[hitIndex];
              addSparks(hitT.x + hitT.w / 2, hitT.y + hitT.h / 2, '#c084fc', 8);
              targetsRef.current.splice(hitIndex, 1);
              setBotScore(b => b + 150);
              sound.playLaser();
            }
          }
        }

        // Update Sparks
        for (let i = sparksRef.current.length - 1; i >= 0; i--) {
          const sp = sparksRef.current[i];
          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.life -= 0.04;
          if (sp.life <= 0) {
            sparksRef.current.splice(i, 1);
          }
        }
      }

      drawGame(ctx, canvas);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPaused, resetGame, spawnTarget]);

  // Shoot click handler
  const handleShoot = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isGameOver || isPaused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    sound.playShotgun();
    setShotsFired(s => s + 1);

    let hit = false;

    for (let i = targetsRef.current.length - 1; i >= 0; i--) {
      const t = targetsRef.current[i];

      // Check hit bounds
      if (clickX >= t.x && clickX <= t.x + t.w && clickY >= t.y && clickY <= t.y + t.h) {
        hit = true;
        setShotsHit(h => h + 1);
        targetsRef.current.splice(i, 1);

        if (t.type === 'hostage') {
          sound.playPlayerHurt();
          addSparks(clickX, clickY, '#10b981', 16);
          setScore(s => Math.max(0, s - 300));
          setCombo(1);
        } else {
          const isHeadshot = clickY <= t.y + t.h * 0.32;
          if (isHeadshot) {
            sound.playPowerup();
            addSparks(clickX, clickY, '#fbbf24', 20);
            setHeadshots(hs => hs + 1);
            setScore(s => s + 250 * combo);
          } else {
            sound.playHit();
            addSparks(clickX, clickY, '#f43f5e', 14);
            setScore(s => s + 100 * combo);
          }
          setCombo(c => Math.min(8, c + 1));
        }
        break;
      }
    }

    if (!hit) {
      addSparks(clickX, clickY, '#38bdf8', 6);
      setCombo(1);
    }
  };

  const drawGame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const w = canvas.width;
    const h = canvas.height;

    // Tactical training facility background
    ctx.fillStyle = '#080b12';
    ctx.fillRect(0, 0, w, h);

    // Range distance markers
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let y = 90; y < h; y += 70) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.font = '10px monospace';
      ctx.fillText(`${y}M TACTICAL LINE`, 15, y - 4);
    }

    // Draw Targets
    targetsRef.current.forEach(t => {
      ctx.save();
      const progress = t.lifeTime / t.maxLife;

      if (t.type === 'hostage') {
        // Civilian decoy (Green)
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 10;
        ctx.fillRect(t.x, t.y, t.w, t.h);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ALLY', t.x + t.w / 2, t.y + t.h / 2);
      } else if (t.type === 'drone') {
        // Flying fast drone (Amber)
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(t.x + t.w / 2, t.y + t.h / 2, t.w / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(t.x + t.w / 2, t.y + t.h / 2, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Hostile robot silhouette (Red)
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 14;

        // Head (Bullseye zone)
        ctx.beginPath();
        ctx.arc(t.x + t.w / 2, t.y + 14, 12, 0, Math.PI * 2);
        ctx.fill();

        // Torso
        ctx.fillRect(t.x + 4, t.y + 26, t.w - 8, t.h - 26);

        // Headshot indicator ring
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(t.x + t.w / 2, t.y + 14, 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Lifebar indicator
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(t.x, t.y + t.h + 3, t.w, 3);
      ctx.fillStyle = progress > 0.3 ? '#38bdf8' : '#ef4444';
      ctx.fillRect(t.x, t.y + t.h + 3, t.w * progress, 3);

      ctx.restore();
    });

    // Draw Sparks
    sparksRef.current.forEach(sp => {
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = Math.max(0, sp.life);
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Computer Bot Crosshair (Purple)
    if (vsComputerRef.current) {
      const bx = botPosRef.current.x;
      const by = botPosRef.current.y;
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, by, 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#c084fc';
      ctx.font = '9px monospace';
      ctx.fillText('AI BOT', bx + 12, by + 4);
    }

    // Draw Player Crosshair (Cyan)
    const mx = mousePosRef.current.x;
    const my = mousePosRef.current.y;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(mx, my, 12, 0, Math.PI * 2);
    ctx.moveTo(mx - 18, my);
    ctx.lineTo(mx - 6, my);
    ctx.moveTo(mx + 6, my);
    ctx.lineTo(mx + 18, my);
    ctx.moveTo(mx, my - 18);
    ctx.lineTo(mx, my - 6);
    ctx.moveTo(mx, my + 6);
    ctx.lineTo(mx, my + 18);
    ctx.stroke();
  };

  const accuracy = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 100;

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* Header HUD */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-t-xl text-xs font-arcade">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <User className="w-3.5 h-3.5" />
            <span className="text-neutral-500 mr-1">YOU:</span>
            <span className="text-base font-mono">{score}</span>
          </div>

          {vsComputer && (
            <div className="flex items-center gap-1.5 text-purple-400 font-bold">
              <Bot className="w-3.5 h-3.5" />
              <span className="text-neutral-500 mr-1">AI BOT:</span>
              <span className="text-base font-mono">{botScore}</span>
            </div>
          )}

          <div className="text-amber-400 font-bold">
            <span className="text-neutral-500 mr-1.5">TIME</span>
            <span className="text-base font-mono">{timeLeft}s</span>
          </div>

          <div className="text-emerald-400 font-bold hidden sm:block">
            <span className="text-neutral-500 mr-1.5">ACCURACY</span>
            <span className="font-mono">{accuracy}%</span>
          </div>

          {combo > 1 && (
            <div className="text-rose-400 font-bold animate-pulse">{combo}X STREAK</div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* VS Computer AI Marksman Mode Toggle */}
          <button
            onClick={() => setVsComputer(v => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-arcade flex items-center gap-1 transition-all ${
              vsComputer
                ? 'bg-purple-950/80 text-purple-300 border border-purple-700'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{vsComputer ? '1v1 VS BOT [ON]' : 'VS BOT'}</span>
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

      {/* Main Canvas */}
      <div className="relative w-full aspect-[16/9] border-x border-b border-neutral-800 bg-neutral-950 rounded-b-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            mousePosRef.current = {
              x: (e.clientX - rect.left) * (640 / rect.width),
              y: (e.clientY - rect.top) * (360 / rect.height),
            };
          }}
          onClick={handleShoot}
          className="w-full h-full block cursor-crosshair touch-none"
        />

        {isGameOver && (
          <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className={`font-arcade text-2xl sm:text-3xl font-bold tracking-widest mb-1 ${
              vsComputer ? (score > botScore ? 'text-cyan-400' : 'text-purple-400') : 'text-cyan-400'
            }`}>
              {vsComputer 
                ? (score > botScore ? 'VICTORY OVER AI MARKSMAN!' : 'AI MARKSMAN WON!') 
                : 'RANGE SESSION COMPLETE'}
            </div>
            <p className="text-neutral-400 text-xs sm:text-sm mb-4">Precision qualification debriefing</p>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 mb-5 w-full max-w-xs space-y-2 font-arcade">
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">PLAYER SCORE</span>
                <span className="text-cyan-400 text-xl font-bold">{score}</span>
              </div>
              {vsComputer && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">COMPUTER BOT SCORE</span>
                  <span className="text-purple-400 text-xl font-bold">{botScore}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">ACCURACY</span>
                <span className="text-emerald-400 font-bold">{accuracy}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">HEADSHOTS</span>
                <span className="text-amber-400 font-bold">{headshots}</span>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-arcade font-bold tracking-wider transition-all transform hover:scale-105"
            >
              RUN DRILL AGAIN
            </button>
          </div>
        )}
      </div>

      <div className="mt-2 text-xs font-mono text-neutral-500 text-center">
        Click targets to fire • Red = Hostile (+100) • Yellow Dot = Headshot (+250) • Green = Friendly Hostage (-300 PENALTY!)
      </div>
    </div>
  );
};
