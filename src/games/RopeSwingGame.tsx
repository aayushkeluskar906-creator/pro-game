import React, { useEffect, useRef, useState } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Sparkles, Trophy } from 'lucide-react';

interface RopeSwingProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

interface Anchor {
  x: number;
  y: number;
}

export const RopeSwingGame: React.FC<RopeSwingProps> = ({ onGameOver, bestScore = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [distance, setDistance] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const stateRef = useRef({
    distance: 0,
    isGameOver: false,
    player: { x: 100, y: 300, vx: 5, vy: 0, r: 12 },
    hookedAnchor: null as Anchor | null,
    ropeLength: 0,
    ropeAngle: 0,
    angularVel: 0,
    anchors: [] as Anchor[],
    coins: [] as { x: number; y: number; collected: boolean }[],
    cameraX: 0
  });

  const resetGame = () => {
    const st = stateRef.current;
    st.distance = 0;
    st.isGameOver = false;
    st.player = { x: 100, y: 300, vx: 5, vy: 0, r: 12 };
    st.hookedAnchor = null;
    st.ropeLength = 0;
    st.ropeAngle = 0;
    st.angularVel = 0;
    st.cameraX = 0;

    // Generate anchors
    st.anchors = [];
    st.coins = [];
    for (let i = 0; i < 60; i++) {
      const ax = 180 + i * 160 + Math.random() * 40;
      const ay = 100 + Math.random() * 80;
      st.anchors.push({ x: ax, y: ay });
      st.coins.push({ x: ax + 80, y: ay + 120, collected: false });
    }

    setDistance(0);
    setIsGameOver(false);
  };

  useEffect(() => {
    resetGame();
  }, []);

  const attachHook = () => {
    const st = stateRef.current;
    if (st.isGameOver) return;

    // Find nearest anchor ahead of player
    let closest: Anchor | null = null;
    let minD = Infinity;

    for (const a of st.anchors) {
      if (a.x > st.player.x - 40 && a.x < st.player.x + 220) {
        const d = Math.hypot(a.x - st.player.x, a.y - st.player.y);
        if (d < minD && d < 260) {
          minD = d;
          closest = a;
        }
      }
    }

    if (closest) {
      sound.playSwoosh();
      st.hookedAnchor = closest;
      st.ropeLength = minD;
      st.ropeAngle = Math.atan2(st.player.y - closest.y, st.player.x - closest.x);
      // Tangential velocity from vx, vy
      const tangentX = -Math.sin(st.ropeAngle);
      const tangentY = Math.cos(st.ropeAngle);
      st.angularVel = (st.player.vx * tangentX + st.player.vy * tangentY) / st.ropeLength;
    }
  };

  const releaseHook = () => {
    const st = stateRef.current;
    if (!st.hookedAnchor) return;

    sound.playPowerup();
    // Convert angular velocity to linear vx, vy
    const speed = st.angularVel * st.ropeLength;
    st.player.vx = -Math.sin(st.ropeAngle) * speed;
    st.player.vy = Math.cos(st.ropeAngle) * speed;

    st.hookedAnchor = null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (stateRef.current.hookedAnchor) releaseHook();
        else attachHook();
      }
    };
    window.addEventListener('keydown', onKey);

    const onPointerDown = () => {
      if (stateRef.current.hookedAnchor) releaseHook();
      else attachHook();
    };
    canvas.addEventListener('pointerdown', onPointerDown);

    const loop = () => {
      animId = requestAnimationFrame(loop);
      const st = stateRef.current;
      const p = st.player;

      ctx.fillStyle = '#090b12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!st.isGameOver) {
        if (st.hookedAnchor) {
          // Pendulum Physics
          const gravity = 0.45;
          const angularAcc = (-gravity / st.ropeLength) * Math.sin(st.ropeAngle);
          st.angularVel += angularAcc;
          st.angularVel *= 0.995; // light damping
          st.ropeAngle += st.angularVel;

          p.x = st.hookedAnchor.x + Math.sin(st.ropeAngle) * st.ropeLength;
          p.y = st.hookedAnchor.y + Math.cos(st.ropeAngle) * st.ropeLength;
        } else {
          // Free Flight Physics
          p.vy += 0.38; // gravity
          p.x += p.vx;
          p.y += p.vy;
        }

        // Camera follow
        st.cameraX += (p.x - 140 - st.cameraX) * 0.1;
        const currentDist = Math.max(0, Math.floor(p.x / 10));
        st.distance = currentDist;
        setDistance(currentDist);

        // Check Coin collection
        st.coins.forEach(c => {
          if (!c.collected && Math.hypot(p.x - c.x, p.y - c.y) < p.r + 14) {
            c.collected = true;
            sound.playCoin();
          }
        });

        // Check Abyss Death
        if (p.y > canvas.height + 30) {
          st.isGameOver = true;
          setIsGameOver(true);
          sound.playGameOver();
          onGameOver?.(currentDist);
        }
      }

      ctx.save();
      ctx.translate(-st.cameraX, 0);

      // Draw Laser Abyss
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(st.cameraX - 50, 520);
      ctx.lineTo(st.cameraX + canvas.width + 50, 520);
      ctx.stroke();

      // Draw Anchors
      st.anchors.forEach(a => {
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(a.x, a.y, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Coins
      st.coins.forEach(c => {
        if (!c.collected) {
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw Rope / Laser Tether
      if (st.hookedAnchor) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(st.hookedAnchor.x, st.hookedAnchor.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      // Draw Player Ball
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#e11d48';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] bg-neutral-950 rounded-2xl border border-neutral-800 p-6 flex flex-col items-center justify-between shadow-2xl select-none">
      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between bg-neutral-900/80 border border-neutral-800 px-4 py-2.5 rounded-xl shadow-lg">
        <div className="font-arcade text-xs text-cyan-400">ROPE SWING 2D</div>
        <div className="font-mono text-sm font-bold text-white">
          DISTANCE: {distance}m
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
      <div className="w-full max-w-md h-[480px] relative cursor-pointer">
        <canvas ref={canvasRef} width={480} height={520} className="w-full h-full rounded-2xl" />
        <div className="absolute bottom-2 left-0 right-0 text-center text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
          Tap Screen or Space to Hook / Release
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-xs w-full rounded-2xl p-6 text-center shadow-2xl">
            <h3 className="text-2xl font-arcade font-bold text-rose-500 mb-2">FELL INTO ABYSS</h3>
            <p className="text-xs text-neutral-400 mb-5">You missed the anchor tether.</p>
            <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl mb-5 font-mono">
              <div className="text-[10px] text-neutral-400 uppercase">Distance Swung</div>
              <div className="text-2xl font-bold text-cyan-400">{distance}m</div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                resetGame();
              }}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-neutral-950 font-arcade font-bold rounded-xl text-xs uppercase"
            >
              SWING AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
