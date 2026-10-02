import React, { useEffect, useRef, useState } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Trophy, Sparkles } from 'lucide-react';

interface CyberFlapProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

export const CyberFlap: React.FC<CyberFlapProps> = ({ onGameOver, bestScore = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const stateRef = useRef({
    birdY: 250,
    birdVy: 0,
    score: 0,
    pipes: [] as { x: number; topH: number; bottomY: number; passed: boolean }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[]
  });

  const flap = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      setIsGameOver(false);
      stateRef.current.score = 0;
      stateRef.current.birdY = 250;
      stateRef.current.birdVy = -7.5;
      stateRef.current.pipes = [];
      setScore(0);
      sound.playJump();
      return;
    }

    if (isGameOver) {
      setIsGameOver(false);
      stateRef.current.score = 0;
      stateRef.current.birdY = 250;
      stateRef.current.birdVy = -7.5;
      stateRef.current.pipes = [];
      setScore(0);
      sound.playJump();
      return;
    }

    stateRef.current.birdVy = -7.5;
    sound.playJump();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let spawnTimer = 0;

    const loop = () => {
      animId = requestAnimationFrame(loop);

      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const w = canvas.width;
      const h = canvas.height;
      const st = stateRef.current;

      // Clear background
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, w, h);

      // Cyber Grid Background
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (isPlaying && !isGameOver) {
        // Update Bird
        st.birdVy += 0.38; // gravity
        st.birdY += st.birdVy;

        // Ground/Ceiling collision
        if (st.birdY < 15 || st.birdY > h - 20) {
          setIsGameOver(true);
          sound.playGameOver();
          onGameOver?.(st.score);
        }

        // Spawn Pipes
        spawnTimer++;
        if (spawnTimer > 105) {
          spawnTimer = 0;
          const gap = 140;
          const minH = 60;
          const topH = Math.random() * (h - gap - minH * 2) + minH;
          st.pipes.push({
            x: w + 20,
            topH,
            bottomY: topH + gap,
            passed: false
          });
        }

        // Move Pipes & Check Collision
        const birdX = 90;
        const birdRadius = 14;

        st.pipes.forEach((p) => {
          p.x -= 2.6;

          // Check score pass
          if (!p.passed && p.x + 50 < birdX) {
            p.passed = true;
            st.score += 1;
            setScore(st.score);
            sound.playCoin();
          }

          // Check collision with top pipe or bottom pipe
          if (birdX + birdRadius > p.x && birdX - birdRadius < p.x + 50) {
            if (st.birdY - birdRadius < p.topH || st.birdY + birdRadius > p.bottomY) {
              setIsGameOver(true);
              sound.playExplosion();
              onGameOver?.(st.score);
              if (st.score > bestScore) {
                confetti({ particleCount: 50, spread: 60 });
              }
            }
          }
        });

        // Filter offscreen pipes
        st.pipes = st.pipes.filter((p) => p.x > -60);
      }

      // Draw Neon Pipes
      st.pipes.forEach((p) => {
        // Top Pipe
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;

        ctx.fillRect(p.x, 0, 50, p.topH);
        ctx.strokeRect(p.x, 0, 50, p.topH);

        // Pipe rim
        ctx.fillRect(p.x - 4, p.topH - 15, 58, 15);
        ctx.strokeRect(p.x - 4, p.topH - 15, 58, 15);

        // Bottom Pipe
        ctx.fillRect(p.x, p.bottomY, 50, h - p.bottomY);
        ctx.strokeRect(p.x, p.bottomY, 50, h - p.bottomY);

        ctx.fillRect(p.x - 4, p.bottomY, 58, 15);
        ctx.strokeRect(p.x - 4, p.bottomY, 58, 15);

        ctx.shadowBlur = 0;
      });

      // Draw Drone/Bird
      const birdX = 90;
      ctx.save();
      ctx.translate(birdX, st.birdY);
      ctx.rotate(Math.min(Math.PI / 4, Math.max(-Math.PI / 4, st.birdVy * 0.08)));

      // Drone Body
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(5, -3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(6, -3, 2, 0, Math.PI * 2);
      ctx.fill();

      // Wing
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.ellipse(-4, 3, 7, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver]);

  return (
    <div
      onClick={flap}
      className="relative w-full h-[620px] md:h-[720px] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col items-center justify-center select-none cursor-pointer"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Score HUD */}
      <div className="absolute top-6 flex items-center justify-between w-full px-8 pointer-events-none">
        <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 px-4 py-2 rounded-xl text-white font-mono text-2xl font-black">
          {score}
        </div>
        <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 px-4 py-2 rounded-xl text-amber-400 font-mono text-sm font-bold flex items-center gap-1.5">
          <Trophy className="w-4 h-4" /> Best: {Math.max(score, bestScore)}
        </div>
      </div>

      {/* Start screen */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
            Cyber Flap
          </h2>
          <p className="text-xs text-neutral-400 max-w-xs mb-6">
            Click, tap, or press Space to hover through cyber conduits!
          </p>
          <div className="px-6 py-3 rounded-xl bg-rose-500 text-white font-bold text-xs uppercase tracking-wider animate-pulse">
            Tap or Click to Fly
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-auto">
          <h3 className="text-2xl font-black text-rose-500 mb-1">Crashed!</h3>
          <p className="text-xs text-neutral-400 mb-4">You made it through {score} conduits</p>
          <button
            onClick={flap}
            className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs uppercase flex items-center gap-2 shadow-lg"
          >
            <RotateCcw className="w-4 h-4" /> Fly Again
          </button>
        </div>
      )}
    </div>
  );
};
