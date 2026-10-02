import React, { useEffect, useRef, useState } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Shield, Swords, Zap } from 'lucide-react';

interface ZombieDefenseProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

export const ZombieDefense: React.FC<ZombieDefenseProps> = ({ onGameOver, bestScore = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [hp, setHp] = useState(100);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const stateRef = useRef({
    score: 0,
    wave: 1,
    hp: 100,
    x: 400,
    y: 350,
    angle: 0,
    bullets: [] as { x: number; y: number; vx: number; vy: number; life: number }[],
    zombies: [] as { x: number; y: number; hp: number; maxHp: number; speed: number }[],
    keys: { w: false, a: false, s: false, d: false, shooting: false },
    mouse: { x: 0, y: 0 },
    fireTimer: 0,
    isGameOver: false
  });

  const resetRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const st = stateRef.current;

    const spawnWave = (wNum: number) => {
      st.zombies = [];
      const count = 10 + wNum * 6;
      for (let i = 0; i < count; i++) {
        const edge = Math.floor(Math.random() * 4);
        let zx = 0, zy = 0;
        if (edge === 0) { zx = Math.random() * 800; zy = -40; }
        else if (edge === 1) { zx = 840; zy = Math.random() * 700; }
        else if (edge === 2) { zx = Math.random() * 800; zy = 740; }
        else { zx = -40; zy = Math.random() * 700; }

        st.zombies.push({
          x: zx,
          y: zy,
          hp: 20 + wNum * 5,
          maxHp: 20 + wNum * 5,
          speed: 1.2 + Math.random() * 0.8
        });
      }
    };
    spawnWave(1);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      st.mouse.x = e.clientX - rect.left;
      st.mouse.y = e.clientY - rect.top;
    };
    const onMouseDown = () => { st.keys.shooting = true; };
    const onMouseUp = () => { st.keys.shooting = false; };
    const onKeyDown = (e: KeyboardEvent) => {
      if (['KeyW', 'ArrowUp'].includes(e.code)) st.keys.w = true;
      if (['KeyA', 'ArrowLeft'].includes(e.code)) st.keys.a = true;
      if (['KeyS', 'ArrowDown'].includes(e.code)) st.keys.s = true;
      if (['KeyD', 'ArrowRight'].includes(e.code)) st.keys.d = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (['KeyW', 'ArrowUp'].includes(e.code)) st.keys.w = false;
      if (['KeyA', 'ArrowLeft'].includes(e.code)) st.keys.a = false;
      if (['KeyS', 'ArrowDown'].includes(e.code)) st.keys.s = false;
      if (['KeyD', 'ArrowRight'].includes(e.code)) st.keys.d = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const reset = () => {
      st.score = 0;
      st.wave = 1;
      st.hp = 100;
      st.x = 400;
      st.y = 350;
      st.bullets = [];
      st.isGameOver = false;
      spawnWave(1);
      setIsGameOver(false);
      setScore(0);
      setWave(1);
      setHp(100);
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

      // Player Movement
      let mx = 0, my = 0;
      if (st.keys.w) my -= 1;
      if (st.keys.s) my += 1;
      if (st.keys.a) mx -= 1;
      if (st.keys.d) mx += 1;
      if (mx !== 0 && my !== 0) { mx *= 0.707; my *= 0.707; }
      st.x += mx * 3.8;
      st.y += my * 3.8;
      st.x = Math.max(20, Math.min(w - 20, st.x));
      st.y = Math.max(20, Math.min(h - 20, st.y));

      st.angle = Math.atan2(st.mouse.y - st.y, st.mouse.x - st.x);

      // Shooting
      st.fireTimer += dt;
      if (st.keys.shooting && st.fireTimer > 0.16) {
        st.fireTimer = 0;
        sound.playShotgun();
        for (let i = -1; i <= 1; i++) {
          const spread = i * 0.12;
          st.bullets.push({
            x: st.x + Math.cos(st.angle) * 22,
            y: st.y + Math.sin(st.angle) * 22,
            vx: Math.cos(st.angle + spread) * 16,
            vy: Math.sin(st.angle + spread) * 16,
            life: 1.0
          });
        }
      }

      // Update Bullets
      st.bullets.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        b.life -= dt;

        st.zombies.forEach(z => {
          if (z.hp > 0 && Math.hypot(b.x - z.x, b.y - z.y) < 18) {
            z.hp -= 20;
            b.life = 0;
            sound.playHit();
            if (z.hp <= 0) {
              sound.playExplosion();
              st.score += 50;
              setScore(st.score);
            }
          }
        });
      });
      st.bullets = st.bullets.filter(b => b.life > 0);

      // Update Zombies
      st.zombies.forEach(z => {
        if (z.hp <= 0) return;
        const za = Math.atan2(st.y - z.y, st.x - z.x);
        z.x += Math.cos(za) * z.speed;
        z.y += Math.sin(za) * z.speed;

        // Hit player
        if (Math.hypot(z.x - st.x, z.y - st.y) < 22) {
          st.hp -= dt * 25;
          setHp(Math.max(0, Math.floor(st.hp)));
          sound.playPlayerHurt();
          if (st.hp <= 0) {
            st.isGameOver = true;
            setIsGameOver(true);
            sound.playGameOver();
            onGameOver?.(st.score);
          }
        }
      });
      st.zombies = st.zombies.filter(z => z.hp > 0);

      // Check next wave
      if (st.zombies.length === 0) {
        confetti({ particleCount: 40 });
        st.wave += 1;
        setWave(st.wave);
        spawnWave(st.wave);
      }

      // Render
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, w, h);

      // Draw Zombies
      st.zombies.forEach(z => {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(z.x, z.y, 14, 0, Math.PI * 2);
        ctx.fill();
        // Arms
        const za = Math.atan2(st.y - z.y, st.x - z.x);
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(z.x, z.y);
        ctx.lineTo(z.x + Math.cos(za + 0.4) * 18, z.y + Math.sin(za + 0.4) * 18);
        ctx.moveTo(z.x, z.y);
        ctx.lineTo(z.x + Math.cos(za - 0.4) * 18, z.y + Math.sin(za - 0.4) * 18);
        ctx.stroke();
      });

      // Draw Player
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.rotate(st.angle);
      // Gun
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, -4, 24, 8);
      // Body
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw Bullets
      st.bullets.forEach(b => {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
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
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Wave</div>
            <div className="text-xl font-bold font-mono text-amber-400">{wave}</div>
          </div>
          <div className="h-8 w-px bg-neutral-800" />
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Survival HP</div>
            <div className="text-xl font-bold font-mono text-rose-500">{hp}%</div>
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
        WASD to Move · Cursor to Aim · Click to Fire Shotgun Spread
      </div>

      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full rounded-2xl p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tight mb-2">Infection Overrun</h2>
            <p className="text-sm text-neutral-400 mb-6">You survived up to wave {wave}.</p>
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
              <RotateCcw className="w-4 h-4" /> Defend Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
