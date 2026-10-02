import React, { useEffect, useRef, useState } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Shield, Play } from 'lucide-react';

interface RetroPacProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

export const RetroPac: React.FC<RetroPacProps> = ({ onGameOver, bestScore = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const stateRef = useRef({
    score: 0,
    lives: 3,
    x: 9,
    y: 11,
    dirX: 0,
    dirY: 0,
    nextDirX: 0,
    nextDirY: 0,
    mouthAngle: 0.2,
    mouthOpening: true,
    isGameOver: false,
    powerTimer: 0,
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
      [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
      [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
      [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
      [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
      [1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1],
      [0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0],
      [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
      [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
      [1,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
      [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
      [1,2,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,2,1],
      [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
      [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    ghosts: [
      { x: 9, y: 7, color: '#f43f5e', dirX: 1, dirY: 0 },
      { x: 8, y: 7, color: '#ec4899', dirX: -1, dirY: 0 },
      { x: 10, y: 7, color: '#06b6d4', dirX: 0, dirY: 1 },
      { x: 9, y: 8, color: '#f59e0b', dirX: 0, dirY: -1 }
    ]
  });

  const resetRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let moveTimer = 0;
    const st = stateRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) { st.nextDirX = -1; st.nextDirY = 0; }
      if (['ArrowRight', 'KeyD'].includes(e.code)) { st.nextDirX = 1; st.nextDirY = 0; }
      if (['ArrowUp', 'KeyW'].includes(e.code)) { st.nextDirX = 0; st.nextDirY = -1; }
      if (['ArrowDown', 'KeyS'].includes(e.code)) { st.nextDirX = 0; st.nextDirY = 1; }
    };
    window.addEventListener('keydown', onKeyDown);

    const reset = () => {
      st.score = 0;
      st.lives = 3;
      st.x = 9;
      st.y = 11;
      st.dirX = 0;
      st.dirY = 0;
      st.powerTimer = 0;
      st.isGameOver = false;
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

      moveTimer++;
      if (moveTimer > 10) {
        moveTimer = 0;

        // Try apply nextDir
        const nx = st.x + st.nextDirX;
        const ny = st.y + st.nextDirY;
        if (st.grid[ny] && st.grid[ny][nx] !== 1) {
          st.dirX = st.nextDirX;
          st.dirY = st.nextDirY;
        }

        // Move
        const nextX = st.x + st.dirX;
        const nextY = st.y + st.dirY;
        if (st.grid[nextY] && st.grid[nextY][nextX] !== 1) {
          st.x = nextX;
          st.y = nextY;
          // Tunnel warp
          if (st.x < 0) st.x = 18;
          if (st.x > 18) st.x = 0;

          // Eat pellet
          if (st.grid[st.y][st.x] === 2) {
            st.grid[st.y][st.x] = 0;
            st.score += 10;
            setScore(st.score);
            sound.playPop();
          } else if (st.grid[st.y][st.x] === 3) {
            // Power energizer!
            st.grid[st.y][st.x] = 0;
            st.score += 50;
            st.powerTimer = 60;
            setScore(st.score);
            sound.playBullseye();
          }
        }

        if (st.powerTimer > 0) st.powerTimer--;

        // Move Ghosts
        st.ghosts.forEach(g => {
          const gx = g.x + g.dirX;
          const gy = g.y + g.dirY;
          if (st.grid[gy] && st.grid[gy][gx] !== 1 && Math.random() < 0.75) {
            g.x = gx;
            g.y = gy;
          } else {
            const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
            const valid = dirs.filter(d => st.grid[g.y + d.y] && st.grid[g.y + d.y][g.x + d.x] !== 1);
            if (valid.length > 0) {
              const ch = valid[Math.floor(Math.random() * valid.length)];
              g.dirX = ch.x;
              g.dirY = ch.y;
              g.x += g.dirX;
              g.y += g.dirY;
            }
          }

          // Collision with Player
          if (g.x === st.x && g.y === st.y) {
            if (st.powerTimer > 0) {
              // Eat ghost!
              sound.playExplosion();
              st.score += 200;
              setScore(st.score);
              g.x = 9;
              g.y = 7;
            } else {
              // Ghost catches player!
              sound.playPlayerHurt();
              st.lives -= 1;
              setLives(st.lives);
              st.x = 9;
              st.y = 11;
              if (st.lives <= 0) {
                st.isGameOver = true;
                setIsGameOver(true);
                sound.playGameOver();
                onGameOver?.(st.score);
              }
            }
          }
        });
      }

      // Mouth animation
      if (st.mouthOpening) {
        st.mouthAngle += 0.05;
        if (st.mouthAngle > 0.4) st.mouthOpening = false;
      } else {
        st.mouthAngle -= 0.05;
        if (st.mouthAngle < 0.05) st.mouthOpening = true;
      }

      // Render
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, w, h);

      const cellW = w / 19;
      const cellH = h / 19;

      // Draw Grid
      for (let r = 0; r < 19; r++) {
        for (let c = 0; c < 19; c++) {
          const val = st.grid[r][c];
          if (val === 1) {
            // Neon Wall
            ctx.fillStyle = '#1e1b4b';
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2;
            ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
            ctx.strokeRect(c * cellW, r * cellH, cellW, cellH);
          } else if (val === 2) {
            // Pellet
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(c * cellW + cellW / 2, r * cellH + cellH / 2, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (val === 3) {
            // Power Pellet
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(c * cellW + cellW / 2, r * cellH + cellH / 2, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // Draw Ghosts
      st.ghosts.forEach(g => {
        ctx.fillStyle = st.powerTimer > 0 ? '#3b82f6' : g.color;
        ctx.beginPath();
        ctx.arc(g.x * cellW + cellW / 2, g.y * cellH + cellH / 2 - 2, cellW * 0.4, Math.PI, 0);
        ctx.lineTo(g.x * cellW + cellW * 0.9, g.y * cellH + cellH * 0.8);
        ctx.lineTo(g.x * cellW + cellW * 0.1, g.y * cellH + cellH * 0.8);
        ctx.closePath();
        ctx.fill();
      });

      // Draw Cyber Man (Player)
      const px = st.x * cellW + cellW / 2;
      const py = st.y * cellH + cellH / 2;
      let rot = 0;
      if (st.dirX === 1) rot = 0;
      else if (st.dirX === -1) rot = Math.PI;
      else if (st.dirY === 1) rot = Math.PI / 2;
      else if (st.dirY === -1) rot = -Math.PI / 2;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rot);
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, cellW * 0.42, st.mouthAngle, Math.PI * 2 - st.mouthAngle);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
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
            <div className="text-xl font-bold font-mono text-amber-400">{score}</div>
          </div>
          <div className="h-8 w-px bg-neutral-800" />
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Lives</div>
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
        Use Arrow Keys or WASD to Navigate Cyber Labyrinth
      </div>

      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full rounded-2xl p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tight mb-2">Caught by Ghosts</h2>
            <p className="text-sm text-neutral-400 mb-6">You ran out of lives in the neon maze.</p>
            <div className="bg-neutral-950/60 border border-neutral-800 p-4 rounded-xl mb-6">
              <div className="text-xs text-neutral-400 font-mono uppercase">Final Score</div>
              <div className="text-3xl font-black font-mono text-amber-400 mt-1">{score}</div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                resetRef.current();
              }}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-sm uppercase flex items-center justify-center gap-2 shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Try Maze Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
