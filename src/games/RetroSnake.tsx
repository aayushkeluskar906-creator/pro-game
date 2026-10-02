import React, { useEffect, useRef, useState } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Trophy } from 'lucide-react';

interface RetroSnakeProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

export const RetroSnake: React.FC<RetroSnakeProps> = ({ onGameOver, bestScore = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const stateRef = useRef({
    score: 0,
    snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    apple: { x: 15, y: 10 },
    isGameOver: false
  });

  const resetRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let stepTimer = 0;
    const GRID_SIZE = 24;
    const st = stateRef.current;

    const spawnApple = () => {
      st.apple = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code) && st.dir.x === 0) st.nextDir = { x: -1, y: 0 };
      if (['ArrowRight', 'KeyD'].includes(e.code) && st.dir.x === 0) st.nextDir = { x: 1, y: 0 };
      if (['ArrowUp', 'KeyW'].includes(e.code) && st.dir.y === 0) st.nextDir = { x: 0, y: -1 };
      if (['ArrowDown', 'KeyS'].includes(e.code) && st.dir.y === 0) st.nextDir = { x: 0, y: 1 };
    };
    window.addEventListener('keydown', onKeyDown);

    const reset = () => {
      st.score = 0;
      st.snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
      st.dir = { x: 1, y: 0 };
      st.nextDir = { x: 1, y: 0 };
      st.isGameOver = false;
      spawnApple();
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

      if (st.isGameOver) return;

      stepTimer++;
      if (stepTimer > 8) {
        stepTimer = 0;
        st.dir = st.nextDir;

        const head = { x: st.snake[0].x + st.dir.x, y: st.snake[0].y + st.dir.y };

        // Wall hit
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          st.isGameOver = true;
          setIsGameOver(true);
          sound.playGameOver();
          onGameOver?.(st.score);
          return;
        }

        // Self hit
        if (st.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
          st.isGameOver = true;
          setIsGameOver(true);
          sound.playGameOver();
          onGameOver?.(st.score);
          return;
        }

        st.snake.unshift(head);

        // Apple hit
        if (head.x === st.apple.x && head.y === st.apple.y) {
          sound.playPop();
          st.score += 10;
          setScore(st.score);
          spawnApple();
        } else {
          st.snake.pop();
        }
      }

      // Render
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, w, h);

      const cellW = w / GRID_SIZE;
      const cellH = h / GRID_SIZE;

      // Draw Grid lines
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      for (let x = 0; x <= GRID_SIZE; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellW, 0);
        ctx.lineTo(x * cellW, h);
        ctx.stroke();
      }
      for (let y = 0; y <= GRID_SIZE; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellH);
        ctx.lineTo(w, y * cellH);
        ctx.stroke();
      }

      // Draw Apple
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(st.apple.x * cellW + cellW / 2, st.apple.y * cellH + cellH / 2, cellW * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Snake
      st.snake.forEach((seg, idx) => {
        ctx.fillStyle = idx === 0 ? '#38bdf8' : '#0284c7';
        ctx.fillRect(seg.x * cellW + 1, seg.y * cellH + 1, cellW - 2, cellH - 2);
      });
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
        Use WASD or Arrow Keys to Direct Snake
      </div>

      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full rounded-2xl p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tight mb-2">Snake Crashed</h2>
            <p className="text-sm text-neutral-400 mb-6">You bit your tail or struck the arena perimeter.</p>
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
