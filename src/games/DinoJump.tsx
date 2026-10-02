import React, { useEffect, useRef, useState } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Trophy } from 'lucide-react';

interface DinoJumpProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

export const DinoJump: React.FC<DinoJumpProps> = ({ onGameOver, bestScore = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const stateRef = useRef({
    score: 0,
    dinoY: 0,
    dinoVy: 0,
    isJumping: false,
    speed: 6.5,
    obstacles: [] as { x: number; w: number; h: number; type: 'cactus' | 'bird' }[],
    isGameOver: false
  });

  const jump = () => {
    const st = stateRef.current;
    if (st.isGameOver) return;
    if (!st.isJumping) {
      st.isJumping = true;
      st.dinoVy = -13.5;
      sound.playJump();
    }
  };

  const resetRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let spawnTimer = 0;
    const st = stateRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('mousedown', jump);

    const reset = () => {
      st.score = 0;
      st.dinoY = 0;
      st.dinoVy = 0;
      st.isJumping = false;
      st.speed = 6.5;
      st.obstacles = [];
      st.isGameOver = false;
      setIsGameOver(false);
      setScore(0);
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
      const groundY = h - 60;

      if (st.isGameOver) return;

      // Dino physics
      if (st.isJumping) {
        st.dinoVy += 0.65;
        st.dinoY += st.dinoVy;
        if (st.dinoY >= 0) {
          st.dinoY = 0;
          st.dinoVy = 0;
          st.isJumping = false;
        }
      }

      // Speed up & score
      st.score += 1;
      if (st.score % 10 === 0) setScore(st.score);
      st.speed = Math.min(13, 6.5 + st.score * 0.003);

      // Spawn obstacles
      spawnTimer++;
      if (spawnTimer > 75 + Math.random() * 50) {
        spawnTimer = 0;
        const isBird = Math.random() < 0.25 && st.score > 250;
        st.obstacles.push({
          x: w + 20,
          w: isBird ? 35 : 22,
          h: isBird ? 24 : 45,
          type: isBird ? 'bird' : 'cactus'
        });
      }

      // Update obstacles & collision
      const dinoBox = {
        x: 80,
        y: groundY - 45 + st.dinoY,
        w: 36,
        h: 45
      };

      st.obstacles.forEach(obs => {
        obs.x -= st.speed;

        const obsY = obs.type === 'bird' ? groundY - 70 : groundY - obs.h;

        // Collision box
        if (
          dinoBox.x + dinoBox.w > obs.x &&
          dinoBox.x < obs.x + obs.w &&
          dinoBox.y + dinoBox.h > obsY &&
          dinoBox.y < obsY + obs.h
        ) {
          st.isGameOver = true;
          setIsGameOver(true);
          sound.playGameOver();
          onGameOver?.(st.score);
        }
      });
      st.obstacles = st.obstacles.filter(o => o.x > -60);

      // Render
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, w, h);

      // Ground Line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(w, groundY);
      ctx.stroke();

      // Draw Dino (Cyber T-Rex)
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.fillRect(dinoBox.x, dinoBox.y, dinoBox.w, dinoBox.h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(dinoBox.x + 24, dinoBox.y + 8, 4, 4);
      ctx.shadowBlur = 0;

      // Draw Obstacles
      st.obstacles.forEach(o => {
        if (o.type === 'cactus') {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(o.x, groundY - o.h, o.w, o.h);
        } else {
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(o.x, groundY - 70, o.w, o.h);
        }
      });
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('mousedown', jump);
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] md:h-[720px] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl select-none">
      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />

      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800 px-4 py-2 rounded-xl flex items-center gap-5 text-white pointer-events-auto">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Score</div>
            <div className="text-xl font-bold font-mono text-cyan-400">{score}</div>
          </div>
          <div className="h-8 w-px bg-neutral-800" />
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Best</div>
            <div className="text-xl font-bold font-mono text-amber-400">{Math.max(score, bestScore)}</div>
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
        Press Spacebar, Up Arrow, or Click to Jump
      </div>

      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full rounded-2xl p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tight mb-2">Trip Collision</h2>
            <p className="text-sm text-neutral-400 mb-6">You clipped a cyber obstacle in your sprint.</p>
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
              <RotateCcw className="w-4 h-4" /> Jump Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
