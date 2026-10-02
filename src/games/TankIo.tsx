import React, { useEffect, useRef, useState } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Shield, Zap, Crosshair, Trophy } from 'lucide-react';

interface TankIoProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

export const TankIo: React.FC<TankIoProps> = ({ onGameOver, bestScore = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [hp, setHp] = useState(100);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const stateRef = useRef({
    score: 0,
    level: 1,
    hp: 100,
    maxHp: 100,
    x: 1000,
    y: 1000,
    angle: 0,
    speed: 4.0,
    fireTimer: 0,
    isGameOver: false,
    keys: { w: false, a: false, s: false, d: false, shooting: false },
    mouse: { x: 0, y: 0 },
    bullets: [] as { x: number; y: number; vx: number; vy: number; life: number; isEnemy?: boolean }[],
    shapes: [] as { x: number; y: number; hp: number; maxHp: number; type: 'square' | 'triangle' | 'pentagon'; angle: number }[],
    enemies: [] as { x: number; y: number; hp: number; angle: number; fireTimer: number; name: string }[]
  });

  const resetRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const WORLD = 2500;
    const st = stateRef.current;

    // Populate shapes (polygons to shoot for exp)
    st.shapes = [];
    for (let i = 0; i < 180; i++) {
      const type = Math.random() < 0.6 ? 'square' : Math.random() < 0.85 ? 'triangle' : 'pentagon';
      st.shapes.push({
        x: Math.random() * (WORLD - 100) + 50,
        y: Math.random() * (WORLD - 100) + 50,
        hp: type === 'square' ? 10 : type === 'triangle' ? 25 : 70,
        maxHp: type === 'square' ? 10 : type === 'triangle' ? 25 : 70,
        type,
        angle: Math.random() * Math.PI * 2
      });
    }

    // Populate Bot Tanks
    const BOT_NAMES = ['Destroyer_9', 'AlphaTank', 'NeonPredator', 'SniperBot', 'GigaDrill', 'Valkyrie'];
    st.enemies = BOT_NAMES.map(name => ({
      x: Math.random() * (WORLD - 300) + 150,
      y: Math.random() * (WORLD - 300) + 150,
      hp: 80,
      angle: Math.random() * Math.PI * 2,
      fireTimer: 0,
      name
    }));

    // Listeners
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
      if (e.code === 'Space') st.keys.shooting = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (['KeyW', 'ArrowUp'].includes(e.code)) st.keys.w = false;
      if (['KeyA', 'ArrowLeft'].includes(e.code)) st.keys.a = false;
      if (['KeyS', 'ArrowDown'].includes(e.code)) st.keys.s = false;
      if (['KeyD', 'ArrowRight'].includes(e.code)) st.keys.d = false;
      if (e.code === 'Space') st.keys.shooting = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Reset
    const reset = () => {
      st.score = 0;
      st.level = 1;
      st.hp = 100;
      st.x = 1000;
      st.y = 1000;
      st.isGameOver = false;
      st.bullets = [];
      setIsGameOver(false);
      setScore(0);
      setHp(100);
      setLevel(1);
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
      if (mx !== 0 && my !== 0) {
        mx *= 0.707;
        my *= 0.707;
      }
      st.x += mx * st.speed;
      st.y += my * st.speed;
      st.x = Math.max(30, Math.min(WORLD - 30, st.x));
      st.y = Math.max(30, Math.min(WORLD - 30, st.y));

      // Player Aim
      const cx = w / 2;
      const cy = h / 2;
      st.angle = Math.atan2(st.mouse.y - cy, st.mouse.x - cx);

      // Player Shooting
      st.fireTimer += dt;
      if (st.keys.shooting && st.fireTimer > 0.22) {
        st.fireTimer = 0;
        sound.playRifle();
        const bulletSpeed = 16;
        st.bullets.push({
          x: st.x + Math.cos(st.angle) * 32,
          y: st.y + Math.sin(st.angle) * 32,
          vx: Math.cos(st.angle) * bulletSpeed,
          vy: Math.sin(st.angle) * bulletSpeed,
          life: 1.5,
          isEnemy: false
        });
      }

      // Update Enemies (Bots)
      st.enemies.forEach(bot => {
        // Move towards center or player
        const distToPlayer = Math.hypot(st.x - bot.x, st.y - bot.y);
        bot.angle = Math.atan2(st.y - bot.y, st.x - bot.x);

        if (distToPlayer > 350) {
          bot.x += Math.cos(bot.angle) * 2.2;
          bot.y += Math.sin(bot.angle) * 2.2;
        }

        bot.fireTimer += dt;
        if (distToPlayer < 500 && bot.fireTimer > 1.2) {
          bot.fireTimer = 0;
          st.bullets.push({
            x: bot.x + Math.cos(bot.angle) * 26,
            y: bot.y + Math.sin(bot.angle) * 26,
            vx: Math.cos(bot.angle) * 11,
            vy: Math.sin(bot.angle) * 11,
            life: 1.8,
            isEnemy: true
          });
        }
      });

      // Update Bullets
      st.bullets.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        b.life -= dt;

        // Collision with player
        if (b.isEnemy) {
          const d = Math.hypot(b.x - st.x, b.y - st.y);
          if (d < 24) {
            b.life = 0;
            st.hp -= 15;
            setHp(Math.max(0, st.hp));
            sound.playPlayerHurt();
            if (st.hp <= 0) {
              st.isGameOver = true;
              setIsGameOver(true);
              sound.playGameOver();
              onGameOver?.(st.score);
            }
          }
        } else {
          // Collision with shapes
          st.shapes.forEach(sh => {
            const shDist = Math.hypot(b.x - sh.x, b.y - sh.y);
            const radius = sh.type === 'square' ? 16 : sh.type === 'triangle' ? 20 : 28;
            if (shDist < radius + 8) {
              b.life = 0;
              sh.hp -= 10;
              sound.playHit();
              if (sh.hp <= 0) {
                const add = sh.type === 'square' ? 20 : sh.type === 'triangle' ? 50 : 150;
                st.score += add;
                setScore(st.score);
                setLevel(Math.floor(st.score / 200) + 1);
                // Respawn shape
                sh.x = Math.random() * (WORLD - 100) + 50;
                sh.y = Math.random() * (WORLD - 100) + 50;
                sh.hp = sh.maxHp;
              }
            }
          });

          // Collision with Enemies
          st.enemies.forEach(bot => {
            const botDist = Math.hypot(b.x - bot.x, b.y - bot.y);
            if (botDist < 26) {
              b.life = 0;
              bot.hp -= 25;
              sound.playHit();
              if (bot.hp <= 0) {
                sound.playExplosion();
                st.score += 500;
                setScore(st.score);
                confetti({ particleCount: 30, spread: 50 });
                // Respawn bot
                bot.x = Math.random() * (WORLD - 300) + 150;
                bot.y = Math.random() * (WORLD - 300) + 150;
                bot.hp = 80;
              }
            }
          });
        }
      });
      st.bullets = st.bullets.filter(b => b.life > 0);

      // Render
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(cx - st.x, cy - st.y);

      // Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let gx = 0; gx <= WORLD; gx += 60) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, WORLD);
        ctx.stroke();
      }
      for (let gy = 0; gy <= WORLD; gy += 60) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(WORLD, gy);
        ctx.stroke();
      }

      // Draw Shapes
      st.shapes.forEach(sh => {
        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(sh.angle);
        if (sh.type === 'square') {
          ctx.fillStyle = '#fbbf24';
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 3;
          ctx.fillRect(-12, -12, 24, 24);
          ctx.strokeRect(-12, -12, 24, 24);
        } else if (sh.type === 'triangle') {
          ctx.fillStyle = '#f43f5e';
          ctx.strokeStyle = '#be123c';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, -16);
          ctx.lineTo(14, 12);
          ctx.lineTo(-14, 12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 4;
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const px = Math.cos(a) * 22;
            const py = Math.sin(a) * 22;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      });

      // Draw Enemies
      st.enemies.forEach(bot => {
        ctx.save();
        ctx.translate(bot.x, bot.y);
        ctx.rotate(bot.angle);
        // Turret
        ctx.fillStyle = '#475569';
        ctx.fillRect(0, -6, 26, 12);
        // Body
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Bot Name
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 11px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(bot.name, bot.x, bot.y - 26);
      });

      // Draw Player Tank
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.rotate(st.angle);
      // Barrel
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, -7, 30, 14);
      // Tank Body
      ctx.fillStyle = '#06b6d4';
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Draw Bullets
      st.bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.isEnemy ? 7 : 8, 0, Math.PI * 2);
        ctx.fillStyle = b.isEnemy ? '#f43f5e' : '#06b6d4';
        ctx.shadowColor = b.isEnemy ? '#f43f5e' : '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      ctx.restore();
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
        <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800 px-4 py-2 rounded-xl flex items-center gap-4 text-white pointer-events-auto">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Score</div>
            <div className="text-xl font-bold font-mono text-cyan-400">{score}</div>
          </div>
          <div className="h-8 w-px bg-neutral-800" />
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Level</div>
            <div className="text-xl font-bold font-mono text-amber-400">{level}</div>
          </div>
          <div className="h-8 w-px bg-neutral-800" />
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Hull HP</div>
            <div className="text-xl font-bold font-mono text-emerald-400">{hp}%</div>
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
        WASD to Drive · Cursor to Aim Turret · Click to Shoot
      </div>

      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full rounded-2xl p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tight mb-2">Tank Destroyed</h2>
            <p className="text-sm text-neutral-400 mb-6">Your chassis was shattered in the arena battle.</p>
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
              <RotateCcw className="w-4 h-4" /> Respawn Tank
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
