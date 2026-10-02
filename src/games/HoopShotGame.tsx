import React, { useEffect, useRef, useState } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Flame, Trophy, Award } from 'lucide-react';

interface HoopShotProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

export const HoopShotGame: React.FC<HoopShotProps> = ({ onGameOver, bestScore = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [ballsLeft, setBallsLeft] = useState(5);
  const [isGameOver, setIsGameOver] = useState(false);

  const stateRef = useRef({
    score: 0,
    streak: 0,
    ballsLeft: 5,
    isGameOver: false,
    // Ball physics
    ball: { x: 120, y: 440, vx: 0, vy: 0, r: 18, inFlight: false, scored: false },
    // Hoop position
    hoop: { x: 380, y: 220, vx: 0, rimW: 60, rimH: 8, backboardH: 85 },
    // Aim drag
    dragStart: null as { x: number; y: number } | null,
    currentDrag: null as { x: number; y: number } | null,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[]
  });

  const resetGame = () => {
    const st = stateRef.current;
    st.score = 0;
    st.streak = 0;
    st.ballsLeft = 5;
    st.isGameOver = false;
    st.ball = { x: 120, y: 440, vx: 0, vy: 0, r: 18, inFlight: false, scored: false };
    st.hoop = { x: 380, y: 220, vx: 0, rimW: 60, rimH: 8, backboardH: 85 };
    st.dragStart = null;
    st.currentDrag = null;
    st.particles = [];

    setScore(0);
    setStreak(0);
    setBallsLeft(5);
    setIsGameOver(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const onMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const st = stateRef.current;
      if (st.isGameOver || st.ball.inFlight) return;
      st.dragStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      st.currentDrag = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const st = stateRef.current;
      if (st.dragStart) {
        st.currentDrag = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }
    };

    const onMouseUp = () => {
      const st = stateRef.current;
      if (!st.dragStart || !st.currentDrag || st.ball.inFlight) return;

      const dx = st.dragStart.x - st.currentDrag.x;
      const dy = st.dragStart.y - st.currentDrag.y;
      const power = Math.min(Math.hypot(dx, dy) * 0.16, 26);
      const angle = Math.atan2(dy, dx);

      if (power > 3) {
        sound.playSwoosh();
        st.ball.vx = Math.cos(angle) * power;
        st.ball.vy = Math.sin(angle) * power;
        st.ball.inFlight = true;
        st.ball.scored = false;
      }

      st.dragStart = null;
      st.currentDrag = null;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const st = stateRef.current;
        if (st.isGameOver || st.ball.inFlight) return;
        st.dragStart = { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        st.currentDrag = { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0 && stateRef.current.dragStart) {
        const rect = canvas.getBoundingClientRect();
        stateRef.current.currentDrag = { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
    };
    const onTouchEnd = () => {
      onMouseUp();
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    const loop = () => {
      animId = requestAnimationFrame(loop);
      const st = stateRef.current;
      const b = st.ball;
      const h = st.hoop;

      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Moving hoop on higher score
      if (st.score >= 50) {
        h.y += Math.sin(Date.now() * 0.003) * 1.2;
      }

      // Draw Court Backdrop
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 480);
      ctx.lineTo(canvas.width, 480);
      ctx.stroke();

      // Draw Backboard & Rim
      const bbX = h.x + h.rimW;
      const bbY = h.y - h.backboardH / 2;
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(bbX, bbY, 8, h.backboardH);

      // Net Strings
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(h.x, h.y);
      ctx.lineTo(h.x + 12, h.y + 36);
      ctx.lineTo(h.x + h.rimW - 12, h.y + 36);
      ctx.lineTo(h.x + h.rimW, h.y);
      ctx.stroke();

      // Rim
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(h.x, h.y - 3, h.rimW, h.rimH);

      // Aim Trajectory Line
      if (st.dragStart && st.currentDrag) {
        const dx = st.dragStart.x - st.currentDrag.x;
        const dy = st.dragStart.y - st.currentDrag.y;
        const power = Math.min(Math.hypot(dx, dy) * 0.16, 26);
        const angle = Math.atan2(dy, dx);

        ctx.fillStyle = '#38bdf8';
        let simX = b.x;
        let simY = b.y;
        let simVx = Math.cos(angle) * power;
        let simVy = Math.sin(angle) * power;

        for (let i = 0; i < 22; i++) {
          simX += simVx;
          simY += simVy;
          simVy += 0.55;
          if (i % 2 === 0) {
            ctx.beginPath();
            ctx.arc(simX, simY, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Ball Physics
      if (b.inFlight) {
        b.vy += 0.55; // gravity
        b.x += b.vx;
        b.y += b.vy;

        // Backboard bounce
        if (b.x + b.r >= bbX && b.x - b.r <= bbX + 8 && b.y >= bbY && b.y <= bbY + h.backboardH) {
          b.vx = -Math.abs(b.vx) * 0.65;
          sound.playHit();
        }

        // Rim bounce (left rim peg)
        const dRimL = Math.hypot(b.x - h.x, b.y - h.y);
        if (dRimL < b.r + 4) {
          b.vx = -b.vx * 0.7;
          b.vy = -b.vy * 0.7;
          sound.playHit();
        }

        // Check Swish Score (passing down through the rim opening)
        if (!b.scored && b.vy > 0 && b.y >= h.y && b.y <= h.y + 14 && b.x > h.x + 8 && b.x < h.x + h.rimW - 8) {
          b.scored = true;
          sound.playBullseye();
          st.streak += 1;
          const streakMult = Math.min(4, st.streak);
          const pts = 10 * streakMult;
          st.score += pts;
          setScore(st.score);
          setStreak(st.streak);

          // Confetti on 3+ streak
          if (st.streak >= 3) {
            confetti({ particleCount: 50, spread: 60, origin: { x: h.x / canvas.width, y: h.y / canvas.height } });
          }

          // Net swirl sparks
          for (let p = 0; p < 18; p++) {
            st.particles.push({
              x: h.x + h.rimW / 2,
              y: h.y + 10,
              vx: (Math.random() - 0.5) * 6,
              vy: Math.random() * 4,
              color: '#f59e0b',
              life: 1.0
            });
          }
        }

        // Ball out of bounds / floor hit
        if (b.y > canvas.height + 40 || b.x > canvas.width + 40 || b.x < -40) {
          b.inFlight = false;
          if (!b.scored) {
            st.streak = 0;
            st.ballsLeft -= 1;
            setStreak(0);
            setBallsLeft(st.ballsLeft);
            if (st.ballsLeft <= 0) {
              st.isGameOver = true;
              setIsGameOver(true);
              sound.playGameOver();
              onGameOver?.(st.score);
            }
          }
          // Reset ball to shooter spot
          b.x = 80 + Math.random() * 80;
          b.y = 440;
          b.vx = 0;
          b.vy = 0;
          b.scored = false;
        }
      }

      // Draw Basketball
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = st.streak >= 2 ? 15 : 0;
      ctx.fill();

      // Basketball seams
      ctx.strokeStyle = '#431407';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.moveTo(b.x - b.r, b.y);
      ctx.lineTo(b.x + b.r, b.y);
      ctx.stroke();
      ctx.restore();

      // Update Particles
      st.particles.forEach(p => {
        p.life -= 0.035;
        p.x += p.vx;
        p.y += p.vy;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      st.particles = st.particles.filter(p => p.life > 0);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] bg-neutral-950 rounded-2xl border border-neutral-800 p-6 flex flex-col items-center justify-between shadow-2xl select-none">
      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between bg-neutral-900/80 border border-neutral-800 px-4 py-2.5 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="font-mono text-sm font-bold text-amber-400">
            SCORE: {score}
          </div>
          {streak > 1 && (
            <div className="flex items-center gap-1 text-xs font-arcade font-bold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800 animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-orange-400" />
              <span>{streak}X STREAK</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-mono text-neutral-300">
            <span>BALLS:</span>
            <div className="flex gap-1">
              {Array.from({ length: ballsLeft }).map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]" />
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              resetGame();
            }}
            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Basketball Court Canvas */}
      <div className="w-full max-w-md h-[480px] flex items-center justify-center relative cursor-crosshair">
        <canvas ref={canvasRef} width={480} height={520} className="w-full h-full rounded-2xl" />
        <div className="absolute bottom-2 text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
          Drag & Release Ball to Aim & Shoot
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-xs w-full rounded-2xl p-6 text-center shadow-2xl">
            <h3 className="text-2xl font-arcade font-bold text-orange-400 mb-2">FINAL BUZZER</h3>
            <p className="text-xs text-neutral-400 mb-5">Out of basketballs! Great shooting session.</p>
            <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl mb-5 font-mono">
              <div className="text-[10px] text-neutral-400 uppercase">Final Score</div>
              <div className="text-2xl font-bold text-amber-400">{score}</div>
              <div className="text-xs text-neutral-400 mt-1">Best: {bestScore}</div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                resetGame();
              }}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 font-arcade font-bold rounded-xl text-xs uppercase"
            >
              SHOOT AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
