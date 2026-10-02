import React, { useEffect, useRef, useState } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Swords, Shield, Zap } from 'lucide-react';

interface BladeStormIoProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

export const BladeStormIo: React.FC<BladeStormIoProps> = ({ onGameOver, bestScore = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [blades, setBlades] = useState(4);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const stateRef = useRef({
    score: 0,
    x: 800,
    y: 800,
    bladeCount: 4,
    bladeAngle: 0,
    isShielding: false,
    isGameOver: false,
    mouse: { x: 0, y: 0, down: false },
    looseBlades: [] as { x: number; y: number; angle: number }[],
    bots: [] as { x: number; y: number; bladeCount: number; bladeAngle: number; name: string; color: string; dead: boolean }[]
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

    // Populate collectible ground blades
    st.looseBlades = [];
    for (let i = 0; i < 180; i++) {
      st.looseBlades.push({
        x: Math.random() * (WORLD - 100) + 50,
        y: Math.random() * (WORLD - 100) + 50,
        angle: Math.random() * Math.PI * 2
      });
    }

    // Populate AI Bots
    const NAMES = ['VortexBlade', 'SteelPhantom', 'ApexSlicer', 'KatarKing', 'RazorEdge', 'ShadowScythe'];
    const COLORS = ['#f43f5e', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#38bdf8'];
    st.bots = NAMES.map((name, idx) => ({
      x: Math.random() * (WORLD - 300) + 150,
      y: Math.random() * (WORLD - 300) + 150,
      bladeCount: 3 + Math.floor(Math.random() * 4),
      bladeAngle: Math.random() * Math.PI * 2,
      name,
      color: COLORS[idx % COLORS.length],
      dead: false
    }));

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      st.mouse.x = e.clientX - rect.left;
      st.mouse.y = e.clientY - rect.top;
    };
    const onMouseDown = () => { st.mouse.down = true; };
    const onMouseUp = () => { st.mouse.down = false; };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    const reset = () => {
      st.score = 0;
      st.x = 800;
      st.y = 800;
      st.bladeCount = 4;
      st.isGameOver = false;
      st.bots.forEach(b => { b.dead = false; b.bladeCount = 4; });
      setIsGameOver(false);
      setScore(0);
      setBlades(4);
    };
    resetRef.current = reset;

    let lastTime = performance.now();

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (st.isGameOver) return;

      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Player move & blade spin
      const dx = st.mouse.x - cx;
      const dy = st.mouse.y - cy;
      const dist = Math.hypot(dx, dy);
      const speed = st.mouse.down ? 7.5 : 4.5;
      st.isShielding = st.mouse.down;

      if (dist > 10) {
        st.x += (dx / dist) * speed;
        st.y += (dy / dist) * speed;
      }
      st.x = Math.max(30, Math.min(WORLD - 30, st.x));
      st.y = Math.max(30, Math.min(WORLD - 30, st.y));

      st.bladeAngle += (st.isShielding ? 14 : 7) * dt;

      // Collect ground blades
      st.looseBlades = st.looseBlades.filter(b => {
        const d = Math.hypot(b.x - st.x, b.y - st.y);
        if (d < 36) {
          sound.playCoin();
          st.bladeCount = Math.min(24, st.bladeCount + 1);
          st.score += 50;
          setScore(st.score);
          setBlades(st.bladeCount);
          return false;
        }
        return true;
      });

      // Refill ground blades
      while (st.looseBlades.length < 180) {
        st.looseBlades.push({
          x: Math.random() * (WORLD - 100) + 50,
          y: Math.random() * (WORLD - 100) + 50,
          angle: Math.random() * Math.PI * 2
        });
      }

      // Update Bots
      st.bots.forEach(bot => {
        if (bot.dead) return;
        bot.bladeAngle += 6 * dt;

        // Bot follow or wander
        const bdx = st.x - bot.x;
        const bdy = st.y - bot.y;
        const bdist = Math.hypot(bdx, bdy);

        if (bdist < 300) {
          if (bot.bladeCount > st.bladeCount) {
            // Chase player!
            bot.x += (bdx / bdist) * 4.2;
            bot.y += (bdy / bdist) * 4.2;
          } else {
            // Flee player!
            bot.x -= (bdx / bdist) * 4.2;
            bot.y -= (bdy / bdist) * 4.2;
          }
        } else {
          bot.x += (Math.random() - 0.5) * 4;
          bot.y += (Math.random() - 0.5) * 4;
        }

        // Blade Clash with Player
        if (bdist < 75) {
          if (st.bladeCount > bot.bladeCount) {
            // Kill bot!
            bot.dead = true;
            sound.playExplosion();
            st.score += 500;
            st.bladeCount = Math.min(24, st.bladeCount + 2);
            setScore(st.score);
            setBlades(st.bladeCount);
            confetti({ particleCount: 40, spread: 60 });
          } else if (bot.bladeCount > st.bladeCount) {
            // Player killed!
            st.isGameOver = true;
            setIsGameOver(true);
            sound.playGameOver();
            onGameOver?.(st.score);
          }
        }
      });

      // Render
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(cx - st.x, cy - st.y);

      // Grid
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      for (let x = 0; x <= WORLD; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, WORLD);
        ctx.stroke();
      }
      for (let y = 0; y <= WORLD; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WORLD, y);
        ctx.stroke();
      }

      // Draw Loose Blades
      st.looseBlades.forEach(b => {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(-2, -12, 4, 24);
        ctx.restore();
      });

      // Draw Bots
      st.bots.forEach(bot => {
        if (bot.dead) return;
        // Draw Bot Orbiting Blades
        const orbitR = 38;
        for (let i = 0; i < bot.bladeCount; i++) {
          const a = bot.bladeAngle + (i * Math.PI * 2) / bot.bladeCount;
          const bx = bot.x + Math.cos(a) * orbitR;
          const by = bot.y + Math.sin(a) * orbitR;
          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(a + Math.PI / 2);
          ctx.fillStyle = bot.color;
          ctx.fillRect(-2.5, -14, 5, 28);
          ctx.restore();
        }

        // Bot Core
        ctx.beginPath();
        ctx.arc(bot.x, bot.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = bot.color;
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(bot.name, bot.x, bot.y - 24);
      });

      // Draw Player Orbiting Blades
      const playerOrbitR = st.isShielding ? 28 : 42;
      for (let i = 0; i < st.bladeCount; i++) {
        const a = st.bladeAngle + (i * Math.PI * 2) / st.bladeCount;
        const bx = st.x + Math.cos(a) * playerOrbitR;
        const by = st.y + Math.sin(a) * playerOrbitR;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.fillRect(-3, -16, 6, 32);
        ctx.restore();
      }
      ctx.shadowBlur = 0;

      // Player Core
      ctx.beginPath();
      ctx.arc(st.x, st.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#0891b2';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();

      ctx.restore();
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
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
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Orbiting Blades</div>
            <div className="text-xl font-bold font-mono text-amber-400 flex items-center gap-1.5">
              <Swords className="w-4 h-4 text-amber-400" /> {blades}
            </div>
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
        Move Cursor to Steer · Hold Click to Tighten Blades into High-Speed Shield
      </div>

      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full rounded-2xl p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tight mb-2">Blades Shattered</h2>
            <p className="text-sm text-neutral-400 mb-6">A larger blade swarm overwhelmed you in combat.</p>
            <div className="bg-neutral-950/60 border border-neutral-800 p-4 rounded-xl mb-6">
              <div className="text-xs text-neutral-400 font-mono uppercase">Final Score</div>
              <div className="text-3xl font-black font-mono text-cyan-400 mt-1">{score}</div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                resetRef.current();
              }}
              className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-xl text-sm uppercase flex items-center justify-center gap-2 shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Respawn Blades
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
