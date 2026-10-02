import React, { useState, useEffect, useRef } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Zap, Sparkles, Cpu, Award } from 'lucide-react';

interface CookieClickerProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

interface Generator {
  id: string;
  name: string;
  cost: number;
  rate: number;
  count: number;
  icon: string;
}

export const CookieClickerNeon: React.FC<CookieClickerProps> = ({ onGameOver, bestScore = 0 }) => {
  const [energy, setEnergy] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [overdrive, setOverdrive] = useState(0); // 0 to 100
  const [isOverdriveActive, setIsOverdriveActive] = useState(false);
  const [clickSparks, setClickSparks] = useState<{ id: number; x: number; y: number; val: number }[]>([]);

  const [generators, setGenerators] = useState<Generator[]>([
    { id: 'nanobot', name: 'Nanobots', cost: 15, rate: 1, count: 0, icon: '🤖' },
    { id: 'diode', name: 'Fusion Diodes', cost: 100, rate: 8, count: 0, icon: '⚡' },
    { id: 'turbine', name: 'Quantum Turbines', cost: 650, rate: 45, count: 0, icon: '🌀' },
    { id: 'antimatter', name: 'Antimatter Coil', cost: 3500, rate: 260, count: 0, icon: '🌌' },
    { id: 'singularity', name: 'Singularity Core', cost: 18000, rate: 1200, count: 0, icon: '🪐' },
  ]);

  // Passive income per second
  const energyPerSec = generators.reduce((acc, g) => acc + g.rate * g.count, 0) * (isOverdriveActive ? 3 : 1);

  // Passive production tick
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy(e => {
        const next = e + energyPerSec / 10;
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [energyPerSec, isOverdriveActive]);

  // Overdrive decay
  useEffect(() => {
    const interval = setInterval(() => {
      setOverdrive(od => {
        if (od <= 0) {
          setIsOverdriveActive(false);
          return 0;
        }
        return Math.max(0, od - 2);
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleCoreClick = (e: React.MouseEvent) => {
    sound.playClick();
    const clickVal = (1 + Math.floor(energyPerSec * 0.05)) * (isOverdriveActive ? 3 : 1);

    setEnergy(prev => prev + clickVal);
    setTotalClicks(c => c + 1);

    // Boost Overdrive meter
    setOverdrive(od => {
      const next = Math.min(100, od + 5);
      if (next >= 100 && !isOverdriveActive) {
        setIsOverdriveActive(true);
        sound.playBullseye();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 } });
      }
      return next;
    });

    // Particle
    const rect = e.currentTarget.getBoundingClientRect();
    const sparkX = e.clientX - rect.left;
    const sparkY = e.clientY - rect.top;
    const sparkId = Math.random();

    setClickSparks(prev => [...prev.slice(-10), { id: sparkId, x: sparkX, y: sparkY, val: clickVal }]);
    setTimeout(() => {
      setClickSparks(prev => prev.filter(s => s.id !== sparkId));
    }, 700);
  };

  const buyGenerator = (id: string) => {
    const gen = generators.find(g => g.id === id);
    if (!gen || energy < gen.cost) return;

    sound.playPowerup();
    setEnergy(prev => prev - gen.cost);
    setGenerators(prev =>
      prev.map(g =>
        g.id === id
          ? { ...g, count: g.count + 1, cost: Math.floor(g.cost * 1.15) }
          : g
      )
    );
  };

  return (
    <div className="relative w-full h-[620px] bg-neutral-950 rounded-2xl border border-neutral-800 p-6 flex flex-col items-center justify-between shadow-2xl select-none">
      {/* Top Header */}
      <div className="w-full max-w-xl flex items-center justify-between bg-neutral-900/80 border border-neutral-800 px-4 py-2.5 rounded-xl shadow-lg">
        <div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">Total Energy</div>
          <div className="text-xl md:text-2xl font-bold font-mono text-white flex items-baseline gap-1">
            {Math.floor(energy).toLocaleString()} <span className="text-xs text-cyan-400">JOULES</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase font-mono tracking-wider text-amber-400">Energy Rate</div>
          <div className="text-sm md:text-base font-bold font-mono text-amber-400">
            +{energyPerSec.toFixed(1)}/sec
          </div>
        </div>
      </div>

      {/* Main Center Area: Core & Upgrades Grid */}
      <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-1 py-4">
        {/* Left: Giant Reactor Core */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <div
            onClick={handleCoreClick}
            className={`w-40 h-40 md:w-48 md:h-48 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all duration-100 transform active:scale-95 shadow-2xl relative ${
              isOverdriveActive
                ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 border-amber-300 shadow-[0_0_40px_rgba(245,158,11,0.8)] animate-pulse'
                : 'bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-950 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)]'
            }`}
          >
            <Zap className="w-16 h-16 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />

            {/* Floating Spark Numbers */}
            {clickSparks.map(spark => (
              <div
                key={spark.id}
                className="absolute text-sm font-arcade font-bold text-amber-300 pointer-events-none animate-bounce"
                style={{ left: spark.x, top: spark.y }}
              >
                +{spark.val}
              </div>
            ))}
          </div>

          {/* Overdrive Meter */}
          <div className="w-40 mt-4">
            <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
              <span>OVERDRIVE</span>
              <span>{isOverdriveActive ? '3X BOOST!' : `${overdrive}%`}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-900 overflow-hidden border border-neutral-800">
              <div
                className={`h-full transition-all ${
                  isOverdriveActive ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]' : 'bg-cyan-500'
                }`}
                style={{ width: `${overdrive}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Automation Generator Upgrades */}
        <div className="md:col-span-7 space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {generators.map(gen => {
            const canAfford = energy >= gen.cost;
            return (
              <button
                key={gen.id}
                onClick={() => buyGenerator(gen.id)}
                disabled={!canAfford}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                  canAfford
                    ? 'bg-neutral-900/90 hover:bg-neutral-850 border-neutral-700 hover:border-cyan-400 text-white shadow'
                    : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-500 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{gen.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                      {gen.name}
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800">
                        x{gen.count}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-400">
                      +{gen.rate}/sec each
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xs font-mono font-bold ${canAfford ? 'text-amber-400' : 'text-neutral-500'}`}>
                    {gen.cost.toLocaleString()} J
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer info */}
      <div className="w-full max-w-xl flex items-center justify-between text-xs font-mono text-neutral-400">
        <div>Clicks: <span className="text-white font-bold">{totalClicks}</span></div>
        <div>Best Energy: <span className="text-amber-400 font-bold">{bestScore}</span></div>
      </div>
    </div>
  );
};
