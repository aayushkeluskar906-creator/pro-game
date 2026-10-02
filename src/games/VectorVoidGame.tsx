import React, { useEffect, useRef, useState } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Zap, Trophy } from 'lucide-react';

interface VectorVoidProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

interface TunnelGate {
  z: number;
  angle: number;
  gapAngle: number;
  gapSize: number;
  color: string;
}

export const VectorVoidGame: React.FC<VectorVoidProps> = ({ onGameOver, bestScore = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [distance, setDistance] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const stateRef = useRef({
    distance: 0,
    speed: 35,
    shipAngle: 0, // 0 to 2*PI around tunnel perimeter
    isGameOver: false,
    gates: [] as TunnelGate[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[]
  });

  const resetGame = () => {
    const st = stateRef.current;
    st.distance = 0;
    st.speed = 35;
    st.shipAngle = 0;
    st.isGameOver = false;
    st.gates = [];
    st.particles = [];

    // Generate initial gates
    for (let i = 0; i < 20; i++) {
      st.gates.push({
        z: 300 + i * 200,
        angle: Math.random() * Math.PI * 2,
        gapAngle: Math.random() * Math.PI * 2,
        gapSize: Math.PI / 2.2,
        color: i % 2 === 0 ? '#06b6d4' : '#f43f5e'
      });
    }

    setDistance(0);
    setIsGameOver(false);
  };

  useEffect(() => {
    resetGame();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let keys = { left: false, right: false };

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keys.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keys.right = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Mouse / Touch Steering
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      stateRef.current.shipAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        stateRef.current.shipAngle = Math.atan2(e.touches[0].clientY - cy, e.touches[0].clientX - cx);
      }
    };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const st = stateRef.current;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.fillStyle = '#06080e';
      ctx.fillRect(0, 0, width, height);

      if (!st.isGameOver) {
        // Keyboard steering
        if (keys.left) st.shipAngle -= 3.8 * dt;
        if (keys.right) st.shipAngle += 3.8 * dt;

        st.speed += dt * 0.4;
        st.distance += st.speed * dt * 4;
        setDistance(Math.floor(st.distance));

        // Advance Gates toward player
        st.gates.forEach(g => {
          g.z -= st.speed * dt * 10;
        });

        // Check Collision with Nearest Gate at z ~ 30
        st.gates.forEach(g => {
          if (g.z <= 35 && g.z >= 20) {
            // Check if shipAngle is inside the open gap
            const normShip = (st.shipAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            const normGap = (g.gapAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

            let diff = Math.abs(normShip - normGap);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;

            if (diff > g.gapSize / 2) {
              // Crash!
              sound.playExplosion();
              st.isGameOver = true;
              setIsGameOver(true);
              onGameOver?.(Math.floor(st.distance));
            } else {
              sound.playSwoosh();
            }
          }
        });

        // Recycle gates passed
        st.gates = st.gates.filter(g => g.z > 0);
        while (st.gates.length < 20) {
          const lastZ = st.gates[st.gates.length - 1].z;
          st.gates.push({
            z: lastZ + 200,
            angle: Math.random() * Math.PI * 2,
            gapAngle: Math.random() * Math.PI * 2,
            gapSize: Math.max(Math.PI / 3, Math.PI / 2.2 - (st.distance / 10000)),
            color: Math.random() < 0.5 ? '#06b6d4' : '#f43f5e'
          });
        }
      }

      // Draw 3D Tunnel Grid Lines
      const TUNNEL_RADIUS = 180;
      for (let z = 50; z < 800; z += 120) {
        const scale = 200 / z;
        const r = TUNNEL_RADIUS * scale;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw Gates
      st.gates.forEach(g => {
        if (g.z < 20 || g.z > 1200) return;
        const scale = 200 / g.z;
        const r = TUNNEL_RADIUS * scale;

        ctx.save();
        ctx.translate(cx, cy);

        // Draw solid blocked ring section
        ctx.strokeStyle = g.color;
        ctx.lineWidth = Math.max(2, 8 * scale);
        ctx.shadowColor = g.color;
        ctx.shadowBlur = 10 * scale;

        ctx.beginPath();
        ctx.arc(0, 0, r, g.gapAngle + g.gapSize / 2, g.gapAngle - g.gapSize / 2 + Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      });

      // Draw Player Vector Starfighter
      const shipR = TUNNEL_RADIUS * (200 / 30);
      const shipX = cx + Math.cos(st.shipAngle) * (shipR - 10);
      const shipY = cy + Math.sin(st.shipAngle) * (shipR - 10);

      ctx.save();
      ctx.translate(shipX, shipY);
      ctx.rotate(st.shipAngle + Math.PI / 2);

      // Ship Arrow shape
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(-9, 12);
      ctx.lineTo(0, 7);
      ctx.lineTo(9, 12);
      ctx.closePath();
      ctx.fill();

      // Thruster flame
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-4, 9);
      ctx.lineTo(0, 18 + Math.random() * 6);
      ctx.lineTo(4, 9);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] bg-neutral-950 rounded-2xl border border-neutral-800 p-6 flex flex-col items-center justify-between shadow-2xl select-none">
      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between bg-neutral-900/80 border border-neutral-800 px-4 py-2.5 rounded-xl shadow-lg">
        <div className="font-arcade text-xs text-rose-400">VECTOR VOID</div>
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
      <div className="w-full max-w-md h-[480px] relative cursor-crosshair">
        <canvas ref={canvasRef} width={480} height={520} className="w-full h-full rounded-2xl" />
        <div className="absolute bottom-2 left-0 right-0 text-center text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
          Move Mouse / Touch or A/D Keys to Steer Ship
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-xs w-full rounded-2xl p-6 text-center shadow-2xl">
            <h3 className="text-2xl font-arcade font-bold text-rose-500 mb-2">HULL BREACHED</h3>
            <p className="text-xs text-neutral-400 mb-5">You collided with a tunnel barrier.</p>
            <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl mb-5 font-mono">
              <div className="text-[10px] text-neutral-400 uppercase">Distance Traversed</div>
              <div className="text-2xl font-bold text-cyan-400">{distance}m</div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                resetGame();
              }}
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-arcade font-bold rounded-xl text-xs uppercase"
            >
              FLY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
