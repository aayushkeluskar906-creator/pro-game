import React, { useEffect, useRef, useState } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, CircleDot, Trophy, Timer } from 'lucide-react';

interface BlackHoleIoProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

export const BlackHoleIo: React.FC<BlackHoleIoProps> = ({ onGameOver, bestScore = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [radius, setRadius] = useState(25);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const stateRef = useRef({
    score: 0,
    x: 800,
    y: 800,
    radius: 25,
    timeLeft: 60,
    isGameOver: false,
    mouse: { x: 0, y: 0 },
    items: [] as { x: number; y: number; size: number; value: number; color: string; type: 'cone' | 'barrel' | 'car' | 'building' }[],
    bots: [] as { x: number; y: number; radius: number; name: string; color: string; targetX: number; targetY: number }[]
  });

  const resetRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const WORLD = 2400;
    const st = stateRef.current;

    // Populate City items to consume
    st.items = [];
    for (let i = 0; i < 240; i++) {
      const roll = Math.random();
      if (roll < 0.45) {
        st.items.push({ x: Math.random() * WORLD, y: Math.random() * WORLD, size: 8, value: 10, color: '#f59e0b', type: 'cone' });
      } else if (roll < 0.75) {
        st.items.push({ x: Math.random() * WORLD, y: Math.random() * WORLD, size: 14, value: 30, color: '#06b6d4', type: 'barrel' });
      } else if (roll < 0.92) {
        st.items.push({ x: Math.random() * WORLD, y: Math.random() * WORLD, size: 24, value: 80, color: '#f43f5e', type: 'car' });
      } else {
        st.items.push({ x: Math.random() * WORLD, y: Math.random() * WORLD, size: 42, value: 250, color: '#8b5cf6', type: 'building' });
      }
    }

    // Bot Black Holes
    const BOT_NAMES = ['VoidEater', 'Graviton', 'SuperMass', 'Singularity', 'EventHorizon'];
    const BOT_COLORS = ['#f43f5e', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b'];
    st.bots = BOT_NAMES.map((name, i) => ({
      x: Math.random() * WORLD,
      y: Math.random() * WORLD,
      radius: 22 + Math.random() * 8,
      name,
      color: BOT_COLORS[i % BOT_COLORS.length],
      targetX: Math.random() * WORLD,
      targetY: Math.random() * WORLD
    }));

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      st.mouse.x = e.clientX - rect.left;
      st.mouse.y = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', onMouseMove);

    const reset = () => {
      st.score = 0;
      st.x = 800;
      st.y = 800;
      st.radius = 25;
      st.timeLeft = 60;
      st.isGameOver = false;
      setIsGameOver(false);
      setScore(0);
      setRadius(25);
      setTimeLeft(60);
    };
    resetRef.current = reset;

    let lastTime = performance.now();

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (st.isGameOver) return;

      st.timeLeft -= dt;
      setTimeLeft(Math.max(0, Math.ceil(st.timeLeft)));
      if (st.timeLeft <= 0) {
        st.isGameOver = true;
        setIsGameOver(true);
        sound.playGameOver();
        onGameOver?.(st.score);
        if (st.score > bestScore) confetti({ particleCount: 70 });
        return;
      }

      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Player move towards cursor
      const dx = st.mouse.x - cx;
      const dy = st.mouse.y - cy;
      const dist = Math.hypot(dx, dy);
      const speed = Math.max(3.5, 6.5 - st.radius * 0.03);

      if (dist > 10) {
        st.x += (dx / dist) * speed;
        st.y += (dy / dist) * speed;
      }
      st.x = Math.max(st.radius, Math.min(WORLD - st.radius, st.x));
      st.y = Math.max(st.radius, Math.min(WORLD - st.radius, st.y));

      // Update Bot Holes
      st.bots.forEach(bot => {
        const bdx = bot.targetX - bot.x;
        const bdy = bot.targetY - bot.y;
        const bdist = Math.hypot(bdx, bdy);
        if (bdist < 20 || Math.random() < 0.02) {
          bot.targetX = Math.random() * WORLD;
          bot.targetY = Math.random() * WORLD;
        } else {
          bot.x += (bdx / bdist) * 4.2;
          bot.y += (bdy / bdist) * 4.2;
        }
      });

      // Eat Items
      st.items.forEach(item => {
        const d = Math.hypot(item.x - st.x, item.y - st.y);
        if (d < st.radius && st.radius > item.size * 1.1) {
          sound.playPop();
          st.score += item.value;
          st.radius = Math.min(95, st.radius + item.value * 0.02);
          setScore(st.score);
          setRadius(Math.floor(st.radius));
          item.x = Math.random() * WORLD;
          item.y = Math.random() * WORLD;
        }

        // Bot eat items
        st.bots.forEach(bot => {
          const bd = Math.hypot(item.x - bot.x, item.y - bot.y);
          if (bd < bot.radius && bot.radius > item.size * 1.1) {
            bot.radius = Math.min(95, bot.radius + item.value * 0.015);
            item.x = Math.random() * WORLD;
            item.y = Math.random() * WORLD;
          }
        });
      });

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(cx - st.x, cy - st.y);

      // Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x <= WORLD; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, WORLD);
        ctx.stroke();
      }
      for (let y = 0; y <= WORLD; y += 80) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WORLD, y);
        ctx.stroke();
      }

      // Draw Items
      st.items.forEach(item => {
        ctx.fillStyle = item.color;
        if (item.type === 'cone') {
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'barrel') {
          ctx.fillRect(item.x - item.size, item.y - item.size, item.size * 2, item.size * 2);
        } else {
          ctx.fillRect(item.x - item.size * 1.2, item.y - item.size * 0.8, item.size * 2.4, item.size * 1.6);
        }
      });

      // Draw Bot Black Holes
      st.bots.forEach(bot => {
        ctx.beginPath();
        ctx.arc(bot.x, bot.y, bot.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = bot.color;
        ctx.stroke();

        ctx.fillStyle = bot.color;
        ctx.font = 'bold 11px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(bot.name, bot.x, bot.y - bot.radius - 6);
      });

      // Draw Player Black Hole
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.restore();
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] md:h-[720px] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl select-none">
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800 px-4 py-2.5 rounded-xl flex items-center gap-5 text-white pointer-events-auto">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Score</div>
            <div className="text-xl font-bold font-mono text-cyan-400">{score}</div>
          </div>
          <div className="h-8 w-px bg-neutral-800" />
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Time Left</div>
            <div className="text-xl font-bold font-mono text-amber-400 flex items-center gap-1">
              <Timer className="w-4 h-4" /> {timeLeft}s
            </div>
          </div>
          <div className="h-8 w-px bg-neutral-800" />
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Hole Radius</div>
            <div className="text-xl font-bold font-mono text-purple-400">{radius}m</div>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(!sound.toggleMute())}
          className="p-2.5 rounded-xl bg-neutral-900/80 text-neutral-300 border border-neutral-800 pointer-events-auto"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-neutral-400 font-mono bg-neutral-950/80 px-3 py-1.5 rounded-xl border border-neutral-800 pointer-events-none hidden sm:block">
        Move Cursor to Swallow Props & Grow Massive
      </div>

      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full rounded-2xl p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-amber-400 uppercase tracking-tight mb-2">Round Finished</h2>
            <p className="text-sm text-neutral-400 mb-6">Time is up! Here is your total city mass absorbed.</p>
            <div className="bg-neutral-950/60 border border-neutral-800 p-4 rounded-xl mb-6">
              <div className="text-xs text-neutral-400 font-mono uppercase">Mass Score</div>
              <div className="text-3xl font-black font-mono text-cyan-400 mt-1">{score}</div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                resetRef.current();
              }}
              className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-xl text-sm uppercase flex items-center justify-center gap-2 shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
