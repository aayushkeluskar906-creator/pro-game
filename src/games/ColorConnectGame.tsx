import React, { useState, useEffect } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Shuffle, Trophy, CheckCircle2 } from 'lucide-react';

interface ColorConnectProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

interface Point {
  r: number;
  c: number;
}

interface Terminal {
  id: number;
  color: string;
  points: [Point, Point];
}

const LEVELS: Terminal[][] = [
  // Level 1 (Simple 5x5)
  [
    { id: 1, color: '#06b6d4', points: [{ r: 0, c: 0 }, { r: 4, c: 0 }] },
    { id: 2, color: '#f43f5e', points: [{ r: 0, c: 1 }, { r: 0, c: 4 }] },
    { id: 3, color: '#f59e0b', points: [{ r: 1, c: 1 }, { r: 3, c: 1 }] },
    { id: 4, color: '#10b981', points: [{ r: 2, c: 2 }, { r: 4, c: 4 }] },
  ],
  // Level 2
  [
    { id: 1, color: '#06b6d4', points: [{ r: 0, c: 0 }, { r: 3, c: 3 }] },
    { id: 2, color: '#f43f5e', points: [{ r: 1, c: 0 }, { r: 4, c: 2 }] },
    { id: 3, color: '#a855f7', points: [{ r: 0, c: 3 }, { r: 4, c: 4 }] },
    { id: 4, color: '#10b981', points: [{ r: 2, c: 1 }, { r: 2, c: 3 }] },
  ],
  // Level 3
  [
    { id: 1, color: '#06b6d4', points: [{ r: 0, c: 1 }, { r: 4, c: 1 }] },
    { id: 2, color: '#f43f5e', points: [{ r: 0, c: 3 }, { r: 3, c: 0 }] },
    { id: 3, color: '#f59e0b', points: [{ r: 1, c: 2 }, { r: 4, c: 4 }] },
    { id: 4, color: '#a855f7', points: [{ r: 0, c: 4 }, { r: 4, c: 0 }] },
  ]
];

export const ColorConnectGame: React.FC<ColorConnectProps> = ({ onGameOver, bestScore = 0 }) => {
  const GRID_SIZE = 5;
  const [levelIdx, setLevelIdx] = useState(0);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [paths, setPaths] = useState<Record<string, Point[]>>({});
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [score, setScore] = useState(0);

  const currentLevel = LEVELS[levelIdx % LEVELS.length];

  const initLevel = () => {
    setPaths({});
    setActiveColor(null);
    setIsLevelComplete(false);
  };

  useEffect(() => {
    initLevel();
  }, [levelIdx]);

  // Terminal check
  const getTerminalAt = (r: number, c: number) => {
    for (const t of currentLevel) {
      if ((t.points[0].r === r && t.points[0].c === c) || (t.points[1].r === r && t.points[1].c === c)) {
        return t;
      }
    }
    return null;
  };

  const handleCellClick = (r: number, c: number) => {
    const term = getTerminalAt(r, c);

    if (term) {
      sound.playClick();
      setActiveColor(term.color);
      setPaths(prev => ({ ...prev, [term.color]: [{ r, c }] }));
      return;
    }

    if (!activeColor) return;

    const currentPath = paths[activeColor] || [];
    if (currentPath.length === 0) return;

    const last = currentPath[currentPath.length - 1];
    const isAdjacent = Math.abs(last.r - r) + Math.abs(last.c - c) === 1;

    if (isAdjacent) {
      sound.playSwoosh();
      const updatedPath = [...currentPath, { r, c }];
      const newPaths = { ...paths, [activeColor]: updatedPath };
      setPaths(newPaths);

      // Check if reached second terminal
      const termMatch = currentLevel.find(t => t.color === activeColor)!;
      const targetTerm =
        (termMatch.points[0].r === r && termMatch.points[0].c === c) ||
        (termMatch.points[1].r === r && termMatch.points[1].c === c);

      if (targetTerm && updatedPath.length > 1) {
        sound.playCoin();
        setActiveColor(null);

        // Check if all terminals connected
        const allConnected = currentLevel.every(t => {
          const p = newPaths[t.color];
          if (!p || p.length < 2) return false;
          const first = p[0];
          const lastP = p[p.length - 1];
          const hasP1 = (first.r === t.points[0].r && first.c === t.points[0].c) || (lastP.r === t.points[0].r && lastP.c === t.points[0].c);
          const hasP2 = (first.r === t.points[1].r && first.c === t.points[1].c) || (lastP.r === t.points[1].r && lastP.c === t.points[1].c);
          return hasP1 && hasP2;
        });

        if (allConnected) {
          sound.playBullseye();
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 } });
          setIsLevelComplete(true);
          const newScore = score + 500;
          setScore(newScore);
          onGameOver?.(newScore);
        }
      }
    }
  };

  const getCellColor = (r: number, c: number) => {
    for (const [color, pts] of Object.entries(paths)) {
      if (pts.some(p => p.r === r && p.c === c)) return color;
    }
    return null;
  };

  return (
    <div className="relative w-full h-[620px] bg-neutral-950 rounded-2xl border border-neutral-800 p-6 flex flex-col items-center justify-between shadow-2xl select-none">
      {/* Top Header */}
      <div className="w-full max-w-sm flex items-center justify-between bg-neutral-900/80 border border-neutral-800 px-4 py-2.5 rounded-xl shadow-lg">
        <div className="text-xs font-arcade text-neutral-300">
          LEVEL {levelIdx + 1}
        </div>
        <div className="font-mono text-sm font-bold text-amber-400">
          SCORE: {score}
        </div>
        <button
          onClick={() => {
            sound.playClick();
            initLevel();
          }}
          className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 5x5 Flow Grid */}
      <div className="bg-neutral-900/90 p-3 rounded-2xl border border-neutral-800 shadow-2xl grid grid-cols-5 gap-2 w-full max-w-xs aspect-square">
        {Array.from({ length: GRID_SIZE }).map((_, r) =>
          Array.from({ length: GRID_SIZE }).map((_, c) => {
            const term = getTerminalAt(r, c);
            const pathColor = getCellColor(r, c);

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className="w-full h-full rounded-xl border border-neutral-800 flex items-center justify-center transition-all relative"
                style={{
                  backgroundColor: pathColor ? `${pathColor}26` : '#0b0f19',
                  borderColor: pathColor ? pathColor : '#1e293b'
                }}
              >
                {term && (
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-lg animate-pulse"
                    style={{
                      backgroundColor: term.color,
                      boxShadow: `0 0 12px ${term.color}`
                    }}
                  />
                )}
                {!term && pathColor && (
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: pathColor }}
                  />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Instructions */}
      <div className="text-[11px] font-mono text-neutral-400 text-center">
        Click terminal to start pipe, then click adjacent cells to connect matching color!
      </div>

      {/* Level Complete Modal */}
      {isLevelComplete && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-xs w-full rounded-2xl p-6 text-center shadow-2xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-2xl font-arcade font-bold text-emerald-400 mb-2">CIRCUIT LINKED!</h3>
            <p className="text-xs text-neutral-400 mb-5">All terminals successfully bridged.</p>
            <button
              onClick={() => {
                sound.playClick();
                setLevelIdx(prev => prev + 1);
              }}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-neutral-950 font-arcade font-bold rounded-xl text-xs uppercase"
            >
              NEXT PUZZLE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
