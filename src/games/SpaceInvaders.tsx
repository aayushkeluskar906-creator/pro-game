import React, { useEffect, useRef, useState } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Shield, Play } from 'lucide-react';

interface SpaceInvadersProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

export const SpaceInvaders: React.FC<SpaceInvadersProps> = ({ onGameOver, bestScore = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const stateRef = useRef({
    score: 0,
    lives: 3,
    playerX: 300,
    bullets: [] as { x: number; y: number; vy: number; isAlien?: boolean }[],
    aliens: [] as { x: number; y: number; type: number; alive: boolean }[],
    alienDir: 1,
    alienSpeed: 1.2,
    keys: { left: false, right: false, fire: false },
    fireCooldown: 0,
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

    const initAliens = () => {
      st.aliens = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 8; c++) {
          st.aliens.push({
            x: 60 + c * 55,
            y: 50 + r * 40,
            type: r,
            alive: true
          });
        }
      }
    };
    initAliens();

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) st.keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) st.keys.right = true;
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) st.keys.fire = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) st.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) st.keys.right = false;
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) st.keys.fire = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const reset = () => {
      st.score = 0;
      st.lives = 3;
      st.playerX = 300;
      st.bullets = [];
      st.isGameOver = false;
      st.alienDir = 1;
      st.alienSpeed = 1.2;
      initAliens();
      setIsGameOver(false);
      setScore(0);
      setLives(3);
    };
    resetRef.current = reset;

    const loop = () => {
      animId = requestAnimationFrame(loop);

      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }
      const w = canvas.width;
      const h = canvas.height;

      if (st.isGameOver) return;

      // Move player
      if (st.keys.left) st.playerX = Math.max(30, st.playerX - 6);
      if (st.keys.right) st.playerX = Math.min(w - 30, st.playerX + 6);

      // Fire bullet
      st.fireCooldown--;
      if (st.keys.fire && st.fireCooldown <= 0) {
        st.fireCooldown = 15;
        sound.playRifle();
        st.bullets.push({ x: st.playerX, y: h - 50, vy: -12, isAlien: false });
      }

      // Move Aliens
      let hitEdge = false;
      st.aliens.forEach(a => {
        if (!a.alive) return;
        a.x += st.alienSpeed * st.alienDir;
        if (a.x > w - 40 || a.x < 30) hitEdge = true;
        // Alien shoot chance
        if (Math.random() < 0.003) {
          st.bullets.push({ x: a.x + 12, y: a.y + 16, vy: 5, isAlien: true });
        }
        // Invader reached bottom
        if (a.y > h - 80) {
          st.isGameOver = true;
          setIsGameOver(true);
          sound.playGameOver();
          onGameOver?.(st.score);
        }
      });

      if (hitEdge) {
        st.alienDir *= -1;
        st.alienSpeed = Math.min(4.5, st.alienSpeed + 0.15);
        st.aliens.forEach(a => { a.y += 14; });
      }

      // Update Bullets
      st.bullets.forEach(b => {
        b.y += b.vy;

        // Player bullet hits alien
        if (!b.isAlien) {
          st.aliens.forEach(a => {
            if (a.alive && b.x > a.x && b.x < a.x + 28 && b.y > a.y && b.y < a.y + 24) {
              a.alive = false;
              b.y = -999;
              sound.playHit();
              st.score += 100;
              setScore(st.score);
            }
          });
        } else {
          // Alien bullet hits player
          if (Math.abs(b.x - st.playerX) < 22 && Math.abs(b.y - (h - 40)) < 15) {
            b.y = 9999;
            sound.playPlayerHurt();
            st.lives -= 1;
            setLives(st.lives);
            if (st.lives <= 0) {
              st.isGameOver = true;
              setIsGameOver(true);
              sound.playGameOver();
              onGameOver?.(st.score);
            }
          }
        }
      });
      st.bullets = st.bullets.filter(b => b.y > 0 && b.y < h);

      // Check wave clear
      if (st.aliens.every(a => !a.alive)) {
        confetti({ particleCount: 50 });
        st.score += 500;
        setScore(st.score);
        initAliens();
        st.alienSpeed += 0.5;
      }

      // Render
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, w, h);

      // Draw Player Cannon
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(st.playerX - 20, h - 35, 40, 15);
      ctx.fillRect(st.playerX - 6, h - 45, 12, 10);

      // Draw Aliens
      st.aliens.forEach(a => {
        if (!a.alive) return;
        ctx.fillStyle = a.type === 0 ? '#f43f5e' : a.type === 1 ? '#fbbf24' : '#10b981';
        ctx.fillRect(a.x, a.y, 28, 20);
        ctx.fillStyle = '#000000';
        ctx.fillRect(a.x + 4, a.y + 6, 4, 4);
        ctx.fillRect(a.x + 20, a.y + 6, 4, 4);
      });

      // Draw Bullets
      st.bullets.forEach(b => {
        ctx.fillStyle = b.isAlien ? '#f43f5e' : '#38bdf8';
        ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
      });
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] md:h-[720px] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800 px-4 py-2 rounded-xl flex items-center gap-5 text-white pointer-events-auto">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Score</div>
            <div className="text-xl font-bold font-mono text-cyan-400">{score}</div>
          </div>
          <div className="h-8 w-px bg-neutral-800" />
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Shields</div>
            <div className="text-xl font-bold font-mono text-rose-400 flex items-center gap-1">
              <Shield className="w-4 h-4" /> {lives}
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
        ← / → to Strafe · Spacebar to Fire
      </div>

      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full rounded-2xl p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tight mb-2">Base Overrun</h2>
            <p className="text-sm text-neutral-400 mb-6">The alien armada destroyed your defense cannons.</p>
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
              <RotateCcw className="w-4 h-4" /> Deploy Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
