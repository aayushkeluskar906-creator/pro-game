import React, { useEffect, useRef, useState } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Bot, User, Trophy, ShieldAlert, Cpu } from 'lucide-react';

interface CyberPongProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

type AIDifficulty = 'rookie' | 'pro' | 'master' | 'terminator';

const DIFFICULTY_CONFIG: Record<AIDifficulty, { label: string; speed: number; error: number; color: string }> = {
  rookie: { label: 'Rookie AI', speed: 0.055, error: 28, color: 'text-emerald-400' },
  pro: { label: 'Pro AI Bot', speed: 0.088, error: 14, color: 'text-cyan-400' },
  master: { label: 'Cyber Master', speed: 0.135, error: 6, color: 'text-amber-400' },
  terminator: { label: 'Terminator AI', speed: 0.19, error: 1, color: 'text-rose-500' }
};

export const CyberPong: React.FC<CyberPongProps> = ({ onGameOver, bestScore = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('pro');
  const [matchLength, setMatchLength] = useState<number>(7);

  const stateRef = useRef({
    playerScore: 0,
    aiScore: 0,
    playerY: 250,
    aiY: 250,
    ballX: 400,
    ballY: 300,
    ballVx: 7,
    ballVy: 4,
    paddleH: 90,
    paddleW: 14,
    isGameOver: false,
    rally: 0,
    maxRally: 0
  });

  const diffRef = useRef(difficulty);
  diffRef.current = difficulty;

  const matchLenRef = useRef(matchLength);
  matchLenRef.current = matchLength;

  const resetRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const st = stateRef.current;

    const updatePlayerPosition = (clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      st.playerY = Math.max(st.paddleH / 2, Math.min(canvas.height - st.paddleH / 2, relativeY));
    };

    const onMouseMove = (e: MouseEvent) => {
      updatePlayerPosition(e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePlayerPosition(e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchstart', onTouchMove, { passive: true });

    const resetBall = (dir: number) => {
      st.ballX = canvas.width / 2;
      st.ballY = canvas.height / 2;
      const speed = 7.5;
      st.ballVx = dir * speed;
      st.ballVy = (Math.random() - 0.5) * 8;
      st.rally = 0;
    };

    const reset = () => {
      st.playerScore = 0;
      st.aiScore = 0;
      st.isGameOver = false;
      st.rally = 0;
      st.maxRally = 0;
      resetBall(Math.random() > 0.5 ? 1 : -1);
      setIsGameOver(false);
      setPlayerScore(0);
      setAiScore(0);
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

      // Ball move
      st.ballX += st.ballVx;
      st.ballY += st.ballVy;

      // Top / bottom bounce
      if (st.ballY < 12) {
        st.ballY = 12;
        st.ballVy *= -1;
        sound.playPop();
      } else if (st.ballY > h - 12) {
        st.ballY = h - 12;
        st.ballVy *= -1;
        sound.playPop();
      }

      // Computer AI Paddle Follow with configured difficulty
      const curConfig = DIFFICULTY_CONFIG[diffRef.current];
      // Target with slight imperfection based on difficulty error offset
      const aiTarget = st.ballY + (Math.sin(Date.now() * 0.003) * curConfig.error);
      st.aiY += (aiTarget - st.aiY) * curConfig.speed;
      st.aiY = Math.max(st.paddleH / 2, Math.min(h - st.paddleH / 2, st.aiY));

      // Player Paddle Collision (Left side)
      if (
        st.ballX - 10 <= 30 + st.paddleW &&
        st.ballX - 10 >= 30 &&
        st.ballY >= st.playerY - st.paddleH / 2 - 8 &&
        st.ballY <= st.playerY + st.paddleH / 2 + 8
      ) {
        const offset = (st.ballY - st.playerY) / (st.paddleH / 2);
        st.ballVx = Math.abs(st.ballVx) * 1.04; // slight speedup per rally
        st.ballVx = Math.min(st.ballVx, 18);
        st.ballVy = offset * 9;
        st.ballX = 30 + st.paddleW + 10;
        st.rally++;
        if (st.rally > st.maxRally) st.maxRally = st.rally;
        sound.playLaser();
      }

      // AI Paddle Collision (Right side)
      const aiPaddleX = w - 30 - st.paddleW;
      if (
        st.ballX + 10 >= aiPaddleX &&
        st.ballX + 10 <= aiPaddleX + st.paddleW &&
        st.ballY >= st.aiY - st.paddleH / 2 - 8 &&
        st.ballY <= st.aiY + st.paddleH / 2 + 8
      ) {
        const offset = (st.ballY - st.aiY) / (st.paddleH / 2);
        st.ballVx = -Math.abs(st.ballVx) * 1.04;
        st.ballVx = Math.max(st.ballVx, -18);
        st.ballVy = offset * 9;
        st.ballX = aiPaddleX - 10;
        st.rally++;
        if (st.rally > st.maxRally) st.maxRally = st.rally;
        sound.playPop();
      }

      // Scoring
      if (st.ballX < 0) {
        // AI scores
        st.aiScore++;
        setAiScore(st.aiScore);
        sound.playHit();
        if (st.aiScore >= matchLenRef.current) {
          st.isGameOver = true;
          setIsGameOver(true);
          onGameOver?.(st.playerScore * 100);
        } else {
          resetBall(1);
        }
      } else if (st.ballX > w) {
        // Player scores
        st.playerScore++;
        setPlayerScore(st.playerScore);
        sound.playCoin();
        if (st.playerScore >= matchLenRef.current) {
          st.isGameOver = true;
          setIsGameOver(true);
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
          onGameOver?.(st.playerScore * 200 + st.maxRally * 20);
        } else {
          resetBall(-1);
        }
      }

      // Render
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, w, h);

      // Subtle Cyber Grid Pattern
      ctx.strokeStyle = '#0e1526';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Center Line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.setLineDash([14, 14]);
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Player Paddle (Cyan)
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 14;
      ctx.fillRect(30, st.playerY - st.paddleH / 2, st.paddleW, st.paddleH);

      // Draw AI Paddle (Rose)
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 14;
      ctx.fillRect(w - 30 - st.paddleW, st.aiY - st.paddleH / 2, st.paddleW, st.paddleH);
      ctx.shadowBlur = 0;

      // Draw Ball (Glowing white / cyan)
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(st.ballX, st.ballY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Ball Trail particle
      ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.beginPath();
      ctx.arc(st.ballX - st.ballVx * 1.5, st.ballY - st.ballVy * 1.5, 6, 0, Math.PI * 2);
      ctx.fill();
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchstart', onTouchMove);
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] md:h-[720px] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl select-none flex flex-col">
      {/* Top Banner: VS COMPUTER MATCH */}
      <div className="bg-neutral-900/90 border-b border-neutral-800 px-4 py-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 font-arcade text-xs">
            <User className="w-3.5 h-3.5" />
            <span>PLAYER (YOU)</span>
          </div>
          <span className="text-xs font-arcade font-bold text-neutral-500">VS</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-300 font-arcade text-xs">
            <Bot className="w-3.5 h-3.5" />
            <span>COMPUTER AI ({DIFFICULTY_CONFIG[difficulty].label})</span>
          </div>
        </div>

        {/* AI Difficulty Selector */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline">AI LEVEL:</span>
          {(['rookie', 'pro', 'master', 'terminator'] as AIDifficulty[]).map(d => (
            <button
              key={d}
              onClick={() => {
                sound.playClick();
                setDifficulty(d);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-arcade uppercase transition-all ${
                difficulty === d
                  ? 'bg-rose-500 text-white font-bold shadow'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => setSoundEnabled(!sound.toggleMute())}
            className="p-1.5 ml-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="relative flex-1 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block cursor-none" />

        {/* Center Live Scoreboard HUD */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-8 pointer-events-none z-10 bg-neutral-950/60 backdrop-blur-sm px-6 py-2 rounded-2xl border border-neutral-800/60 shadow-xl">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono tracking-widest text-cyan-400 uppercase">PLAYER</span>
            <span className="text-4xl sm:text-5xl font-mono font-black text-cyan-400">{playerScore}</span>
          </div>
          <div className="text-neutral-600 font-mono text-2xl font-bold">:</div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono tracking-widest text-rose-400 uppercase">COMPUTER AI</span>
            <span className="text-4xl sm:text-5xl font-mono font-black text-rose-500">{aiScore}</span>
          </div>
        </div>

        {/* Bottom Hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-neutral-400 font-mono bg-neutral-950/85 px-4 py-1.5 rounded-xl border border-neutral-800 pointer-events-none flex items-center gap-2">
          <span>🎮 Move cursor or touch-drag to control left paddle</span>
          <span className="text-neutral-600">·</span>
          <span>Target: First to {matchLength} Points</span>
        </div>

        {/* Game Over Modal */}
        {isGameOver && (
          <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
            <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full rounded-2xl p-6 text-center shadow-2xl">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-neutral-800">
                {playerScore > aiScore ? (
                  <Trophy className="w-8 h-8 text-amber-400" />
                ) : (
                  <Bot className="w-8 h-8 text-rose-500" />
                )}
              </div>
              <h2 className={`text-2xl font-arcade font-black uppercase tracking-tight mb-1 ${
                playerScore > aiScore ? 'text-cyan-400' : 'text-rose-500'
              }`}>
                {playerScore > aiScore ? 'VICTORY OVER COMPUTER AI!' : 'DEFEATED BY COMPUTER BOT!'}
              </h2>
              <p className="text-xs text-neutral-400 mb-6 font-mono">
                Final Score: <strong className="text-white">{playerScore}</strong> (Player) vs <strong className="text-white">{aiScore}</strong> ({DIFFICULTY_CONFIG[difficulty].label})
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    sound.playClick();
                    resetRef.current();
                  }}
                  className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-arcade font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-2 shadow-lg"
                >
                  <RotateCcw className="w-4 h-4" /> Rematch Computer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
