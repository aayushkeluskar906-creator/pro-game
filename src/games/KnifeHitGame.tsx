import React, { useEffect, useRef, useState } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Swords, Trophy, Sparkles } from 'lucide-react';

interface KnifeHitProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

interface EmbeddedKnife {
  angle: number; // in radians
}

interface FlyingKnife {
  y: number;
  speed: number;
}

export const KnifeHitGame: React.FC<KnifeHitProps> = ({ onGameOver, bestScore = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [stage, setStage] = useState(1);
  const [knivesRemaining, setKnivesRemaining] = useState(7);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const stateRef = useRef({
    score: 0,
    stage: 1,
    targetAngle: 0,
    targetSpeed: 0.03,
    targetRadius: 75,
    knivesRemaining: 7,
    embeddedKnives: [] as EmbeddedKnife[],
    flyingKnife: null as FlyingKnife | null,
    isGameOver: false,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[]
  });

  const nextStage = () => {
    const st = stateRef.current;
    st.stage += 1;
    st.knivesRemaining = Math.min(12, 6 + Math.floor(st.stage / 2));
    st.embeddedKnives = [];
    st.targetSpeed = (Math.random() < 0.5 ? 1 : -1) * (0.025 + Math.min(0.06, st.stage * 0.005));

    // Initial obstacle knives on wheel for higher stages
    const initialHazards = Math.min(4, Math.floor(st.stage / 2));
    for (let i = 0; i < initialHazards; i++) {
      st.embeddedKnives.push({ angle: Math.random() * Math.PI * 2 });
    }

    setStage(st.stage);
    setKnivesRemaining(st.knivesRemaining);
    sound.playPowerup();
  };

  const throwKnife = () => {
    const st = stateRef.current;
    if (st.isGameOver || st.flyingKnife || st.knivesRemaining <= 0) return;

    sound.playSwoosh();
    st.knivesRemaining -= 1;
    setKnivesRemaining(st.knivesRemaining);
    st.flyingKnife = { y: 480, speed: 28 };
  };

  const resetGame = () => {
    const st = stateRef.current;
    st.score = 0;
    st.stage = 1;
    st.targetAngle = 0;
    st.targetSpeed = 0.03;
    st.knivesRemaining = 7;
    st.embeddedKnives = [];
    st.flyingKnife = null;
    st.isGameOver = false;
    st.particles = [];

    setScore(0);
    setStage(1);
    setKnivesRemaining(7);
    setIsGameOver(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        throwKnife();
      }
    };
    window.addEventListener('keydown', onKey);

    const loop = () => {
      animId = requestAnimationFrame(loop);
      const st = stateRef.current;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = 160;

      ctx.fillStyle = '#08090d';
      ctx.fillRect(0, 0, width, height);

      // Rotate target wheel
      st.targetAngle += st.targetSpeed;
      if (Math.random() < 0.015) {
        st.targetSpeed = (Math.random() < 0.5 ? 1 : -1) * (0.025 + Math.min(0.06, st.stage * 0.005));
      }

      // Draw Center Target Core
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(st.targetAngle);

      // Outer target glow ring
      ctx.beginPath();
      ctx.arc(0, 0, st.targetRadius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = st.stage % 5 === 0 ? '#ef4444' : '#06b6d4';
      ctx.lineWidth = 4;
      ctx.shadowColor = st.stage % 5 === 0 ? '#ef4444' : '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.stroke();

      // Main wheel disc
      ctx.beginPath();
      ctx.arc(0, 0, st.targetRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();

      // Cyber grooves
      for (let g = 0; g < 8; g++) {
        const ga = (g * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ga) * st.targetRadius, Math.sin(ga) * st.targetRadius);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Center core gem
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fillStyle = st.stage % 5 === 0 ? '#ef4444' : '#f59e0b';
      ctx.fill();

      // Draw embedded knives
      st.embeddedKnives.forEach(k => {
        ctx.save();
        ctx.rotate(k.angle);
        // Knife handle & blade pointing outward
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-3, st.targetRadius - 10, 6, 35);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(-2, st.targetRadius + 25, 4, 15);
        ctx.restore();
      });

      ctx.restore();

      // Update Flying Knife
      if (st.flyingKnife && !st.isGameOver) {
        st.flyingKnife.y -= st.flyingKnife.speed;

        // Check if reaches target wheel edge
        if (st.flyingKnife.y <= centerY + st.targetRadius) {
          const hitAngle = -st.targetAngle + Math.PI / 2;
          const normalizedHit = (hitAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

          // Check collision with any existing embedded knife
          let collided = false;
          for (const ek of st.embeddedKnives) {
            const normEk = (ek.angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            let diff = Math.abs(normalizedHit - normEk);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff < 0.22) {
              collided = true;
              break;
            }
          }

          if (collided) {
            // Deflect! Game Over
            sound.playExplosion();
            st.isGameOver = true;
            setIsGameOver(true);
            onGameOver?.(st.score);
            st.flyingKnife = null;
          } else {
            // Embed successfully!
            sound.playHit();
            st.embeddedKnives.push({ angle: normalizedHit });
            st.score += 10 * st.stage;
            setScore(st.score);
            st.flyingKnife = null;

            // Trigger hit sparks
            for (let p = 0; p < 12; p++) {
              st.particles.push({
                x: centerX,
                y: centerY + st.targetRadius,
                vx: (Math.random() - 0.5) * 6,
                vy: Math.random() * 4 + 1,
                color: '#06b6d4',
                life: 1.0
              });
            }

            // Stage complete?
            if (st.knivesRemaining <= 0) {
              if (st.stage % 5 === 0) {
                confetti({ particleCount: 70, spread: 60, origin: { y: 0.4 } });
              }
              setTimeout(nextStage, 350);
            }
          }
        }
      }

      // Draw Flying Knife if active
      if (st.flyingKnife) {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(centerX - 3, st.flyingKnife.y, 6, 35);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(centerX - 2, st.flyingKnife.y + 35, 4, 15);
      } else if (!st.isGameOver && st.knivesRemaining > 0) {
        // Ready Knife at bottom
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(centerX - 3, 480, 6, 35);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(centerX - 2, 515, 4, 15);
      }

      // Update Particles
      st.particles.forEach((p, idx) => {
        p.life -= 0.04;
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
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] bg-neutral-950 rounded-2xl border border-neutral-800 p-6 flex flex-col items-center justify-between shadow-2xl select-none">
      {/* Top Header */}
      <div className="w-full max-w-sm flex items-center justify-between bg-neutral-900/80 border border-neutral-800 px-4 py-2.5 rounded-xl shadow-lg">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-cyan-400" />
          <span className="font-arcade text-xs text-neutral-300">STAGE {stage}</span>
        </div>
        <div className="font-mono text-sm font-bold text-amber-400">
          SCORE: {score}
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

      {/* Main Canvas */}
      <div
        onClick={throwKnife}
        className="w-full max-w-sm h-[480px] cursor-pointer flex items-center justify-center relative"
      >
        <canvas ref={canvasRef} width={380} height={540} className="w-full h-full rounded-2xl" />

        {/* Knives left meter */}
        <div className="absolute left-2 bottom-6 flex flex-col-reverse gap-1.5">
          {Array.from({ length: knivesRemaining }).map((_, i) => (
            <div key={i} className="w-2.5 h-6 rounded-sm bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          ))}
        </div>

        <div className="absolute bottom-2 text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
          Tap Screen or Space to Throw
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-xs w-full rounded-2xl p-6 text-center shadow-2xl">
            <h3 className="text-2xl font-arcade font-bold text-rose-500 mb-2">BLADE DEFLECTED</h3>
            <p className="text-xs text-neutral-400 mb-5">Your blade struck an embedded knife.</p>
            <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl mb-5 font-mono">
              <div className="text-[10px] text-neutral-400 uppercase">Stage Reached</div>
              <div className="text-2xl font-bold text-amber-400">Stage {stage}</div>
              <div className="text-xs text-neutral-400 mt-1">Score: {score}</div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                resetGame();
              }}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-neutral-950 font-arcade font-bold rounded-xl text-xs uppercase"
            >
              THROW AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
