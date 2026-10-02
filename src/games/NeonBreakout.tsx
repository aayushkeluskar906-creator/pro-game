import React, { useEffect, useRef, useState } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Shield, Play } from 'lucide-react';

interface NeonBreakoutProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

export const NeonBreakout: React.FC<NeonBreakoutProps> = ({ onGameOver, bestScore = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const stateRef = useRef({
    score: 0,
    lives: 3,
    paddleX: 300,
    paddleW: 90,
    ballX: 300,
    ballY: 450,
    ballVx: 4,
    ballVy: -5,
    ballRadius: 7,
    inPlay: false,
    bricks: [] as { x: number; y: number; w: number; h: number; color: string; alive: boolean; hp: number }[],
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

    const initBricks = () => {
      st.bricks = [];
      const colors = ['#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 8; c++) {
          st.bricks.push({
            x: 45 + c * 85,
            y: 50 + r * 30,
            w: 75,
            h: 20,
            color: colors[r],
            alive: true,
            hp: 1
          });
        }
      }
    };
    initBricks();

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      st.paddleX = Math.max(st.paddleW / 2, Math.min(canvas.width - st.paddleW / 2, e.clientX - rect.left));
      if (!st.inPlay) {
        st.ballX = st.paddleX;
      }
    };

    const onMouseDown = () => {
      if (!st.inPlay && !st.isGameOver) {
        st.inPlay = true;
        st.ballVx = (Math.random() - 0.5) * 4;
        st.ballVy = -6;
        sound.playPop();
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);

    const reset = () => {
      st.score = 0;
      st.lives = 3;
      st.inPlay = false;
      st.ballX = 300;
      st.ballY = 450;
      st.isGameOver = false;
      initBricks();
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

      if (st.inPlay) {
        st.ballX += st.ballVx;
        st.ballY += st.ballVy;

        // Wall collisions
        if (st.ballX - st.ballRadius < 0) {
          st.ballX = st.ballRadius;
          st.ballVx *= -1;
          sound.playHit();
        } else if (st.ballX + st.ballRadius > w) {
          st.ballX = w - st.ballRadius;
          st.ballVx *= -1;
          sound.playHit();
        }
        if (st.ballY - st.ballRadius < 0) {
          st.ballY = st.ballRadius;
          st.ballVy *= -1;
          sound.playHit();
        }

        // Paddle collision
        const paddleY = h - 35;
        if (
          st.ballY + st.ballRadius >= paddleY &&
          st.ballY - st.ballRadius <= paddleY + 14 &&
          st.ballX >= st.paddleX - st.paddleW / 2 &&
          st.ballX <= st.paddleX + st.paddleW / 2
        ) {
          st.ballVy = -Math.abs(st.ballVy);
          // Angle bounce based on hit position
          const offset = (st.ballX - st.paddleX) / (st.paddleW / 2);
          st.ballVx = offset * 6;
          sound.playPop();
        }

        // Bottom death
        if (st.ballY > h) {
          st.lives -= 1;
          setLives(st.lives);
          sound.playPlayerHurt();
          if (st.lives <= 0) {
            st.isGameOver = true;
            setIsGameOver(true);
            sound.playGameOver();
            onGameOver?.(st.score);
          } else {
            st.inPlay = false;
            st.ballY = paddleY - 20;
            st.ballX = st.paddleX;
          }
        }

        // Brick collision
        st.bricks.forEach(b => {
          if (!b.alive) return;
          if (
            st.ballX + st.ballRadius > b.x &&
            st.ballX - st.ballRadius < b.x + b.w &&
            st.ballY + st.ballRadius > b.y &&
            st.ballY - st.ballRadius < b.y + b.h
          ) {
            b.alive = false;
            st.ballVy *= -1;
            sound.playHit();
            st.score += 50;
            setScore(st.score);
          }
        });

        // Wave clear
        if (st.bricks.every(b => !b.alive)) {
          confetti({ particleCount: 50 });
          initBricks();
          st.inPlay = false;
          st.ballY = paddleY - 20;
          st.ballX = st.paddleX;
          st.score += 500;
          setScore(st.score);
        }
      }

      // Render
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, w, h);

      // Draw Bricks
      st.bricks.forEach(b => {
        if (!b.alive) return;
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.shadowBlur = 0;
      });

      // Draw Paddle
      const paddleY = h - 35;
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.fillRect(st.paddleX - st.paddleW / 2, paddleY, st.paddleW, 14);
      ctx.shadowBlur = 0;

      // Draw Ball
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(st.ballX, st.ballY, st.ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] md:h-[720px] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl select-none">
      <canvas ref={canvasRef} className="w-full h-full block cursor-none" />

      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800 px-4 py-2 rounded-xl flex items-center gap-5 text-white pointer-events-auto">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Score</div>
            <div className="text-xl font-bold font-mono text-cyan-400">{score}</div>
          </div>
          <div className="h-8 w-px bg-neutral-800" />
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Balls</div>
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
        Move Mouse to Guide Paddle · Click to Launch Ball
      </div>

      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full rounded-2xl p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tight mb-2">Game Over</h2>
            <p className="text-sm text-neutral-400 mb-6">All breakout balls were lost.</p>
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
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
