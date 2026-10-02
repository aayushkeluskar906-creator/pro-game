import React, { useState, useEffect, useCallback } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Trophy,
  Undo2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface Neon2048Props {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

type Board = number[][];

const TILE_COLORS: Record<number, { bg: string; text: string; glow: string }> = {
  2: { bg: 'bg-neutral-800', text: 'text-neutral-200', glow: 'shadow-neutral-800/40' },
  4: { bg: 'bg-neutral-700', text: 'text-white', glow: 'shadow-neutral-700/40' },
  8: { bg: 'bg-amber-600', text: 'text-white', glow: 'shadow-amber-600/50' },
  16: { bg: 'bg-amber-500', text: 'text-neutral-950 font-bold', glow: 'shadow-amber-500/60' },
  32: { bg: 'bg-orange-500', text: 'text-white', glow: 'shadow-orange-500/60' },
  64: { bg: 'bg-rose-500', text: 'text-white', glow: 'shadow-rose-500/60' },
  128: { bg: 'bg-rose-600', text: 'text-white', glow: 'shadow-rose-600/70' },
  256: { bg: 'bg-cyan-500', text: 'text-neutral-950 font-bold', glow: 'shadow-cyan-500/70' },
  512: { bg: 'bg-cyan-400', text: 'text-neutral-950 font-bold', glow: 'shadow-cyan-400/80' },
  1024: { bg: 'bg-purple-500', text: 'text-white font-extrabold', glow: 'shadow-purple-500/80' },
  2048: { bg: 'bg-emerald-400', text: 'text-neutral-950 font-black', glow: 'shadow-emerald-400/90' }
};

export const Neon2048: React.FC<Neon2048Props> = ({ onGameOver, bestScore = 0 }) => {
  const [board, setBoard] = useState<Board>(() => getInitialBoard());
  const [previousBoard, setPreviousBoard] = useState<Board | null>(null);
  const [score, setScore] = useState(0);
  const [previousScore, setPreviousScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  function getInitialBoard(): Board {
    const b: Board = Array(4).fill(0).map(() => Array(4).fill(0));
    addRandomTile(b);
    addRandomTile(b);
    return b;
  }

  function addRandomTile(b: Board) {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return;
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    b[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
  }

  const move = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameOver) return;

    setBoard((prev) => {
      let moved = false;
      let gainedScore = 0;
      const newBoard = prev.map((row) => [...row]);

      const rotate = (m: Board) => m[0].map((_, i) => m.map((row) => row[i]).reverse());

      let rotations = 0;
      if (direction === 'UP') rotations = 3;
      if (direction === 'RIGHT') rotations = 2;
      if (direction === 'DOWN') rotations = 1;

      let transformed = newBoard;
      for (let i = 0; i < rotations; i++) transformed = rotate(transformed);

      for (let r = 0; r < 4; r++) {
        const row = transformed[r].filter((v) => v !== 0);
        for (let i = 0; i < row.length - 1; i++) {
          if (row[i] === row[i + 1]) {
            row[i] *= 2;
            gainedScore += row[i];
            if (row[i] === 2048) {
              setHasWon(true);
              confetti({ particleCount: 100, spread: 70 });
            }
            row.splice(i + 1, 1);
            moved = true;
          }
        }
        while (row.length < 4) row.push(0);

        for (let c = 0; c < 4; c++) {
          if (transformed[r][c] !== row[c]) moved = true;
          transformed[r][c] = row[c];
        }
      }

      // Rotate back
      for (let i = 0; i < (4 - rotations) % 4; i++) transformed = rotate(transformed);

      if (moved) {
        setPreviousBoard(prev.map((row) => [...row]));
        setPreviousScore(score);
        addRandomTile(transformed);
        sound.playPop();
        setScore((s) => s + gainedScore);

        // Check Game Over
        let canMove = false;
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (transformed[r][c] === 0) canMove = true;
            if (r < 3 && transformed[r][c] === transformed[r + 1][c]) canMove = true;
            if (c < 3 && transformed[r][c] === transformed[r][c + 1]) canMove = true;
          }
        }

        if (!canMove) {
          setGameOver(true);
          sound.playGameOver();
          onGameOver?.(score + gainedScore);
        }
      }

      return transformed;
    });
  }, [gameOver, score, onGameOver]);

  const undo = () => {
    if (previousBoard) {
      setBoard(previousBoard);
      setScore(previousScore);
      setPreviousBoard(null);
      setGameOver(false);
      sound.playClick();
    }
  };

  const reset = () => {
    sound.playClick();
    setBoard(getInitialBoard());
    setPreviousBoard(null);
    setScore(0);
    setGameOver(false);
    setHasWon(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        move('UP');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        move('DOWN');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        move('LEFT');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        move('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  return (
    <div className="relative w-full h-[620px] md:h-[720px] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col items-center justify-center p-6 select-none">
      {/* Top Header */}
      <div className="w-full max-w-sm flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            2048 <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono">NEON</span>
          </h2>
          <p className="text-xs text-neutral-400">Join the numbers to reach the 2048 tile!</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl text-center">
            <div className="text-[10px] font-mono uppercase text-neutral-500">Score</div>
            <div className="text-lg font-bold font-mono text-cyan-400">{score}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl text-center">
            <div className="text-[10px] font-mono uppercase text-neutral-500">Best</div>
            <div className="text-lg font-bold font-mono text-amber-400">{Math.max(score, bestScore)}</div>
          </div>
        </div>
      </div>

      {/* 4x4 Grid Board */}
      <div className="w-full max-w-sm aspect-square bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3 grid grid-cols-4 gap-2.5 shadow-2xl relative">
        {board.map((row, r) =>
          row.map((val, c) => {
            const tileStyle = TILE_COLORS[val] || {
              bg: 'bg-emerald-500',
              text: 'text-neutral-950 font-black',
              glow: 'shadow-emerald-500/90'
            };

            return (
              <div
                key={`${r}-${c}`}
                className={`rounded-xl flex items-center justify-center text-xl md:text-2xl font-bold font-mono transition-all duration-100 ${
                  val === 0
                    ? 'bg-neutral-950/60 border border-neutral-800/40 text-transparent'
                    : `${tileStyle.bg} ${tileStyle.text} shadow-md ${tileStyle.glow} scale-100`
                }`}
              >
                {val !== 0 ? val : ''}
              </div>
            );
          })
        )}

        {/* Win Notification */}
        {hasWon && (
          <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 z-10 animate-in fade-in">
            <Sparkles className="w-12 h-12 text-amber-400 mb-2 animate-bounce" />
            <h3 className="text-2xl font-black text-white mb-1">2048 Reached!</h3>
            <p className="text-xs text-neutral-300 mb-4">You have achieved victory!</p>
            <button
              onClick={() => setHasWon(false)}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-xl text-xs uppercase"
            >
              Keep Playing
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 z-20 animate-in fade-in">
            <h3 className="text-2xl font-black text-rose-500 mb-1">Game Over</h3>
            <p className="text-xs text-neutral-400 mb-4">No more moves possible!</p>
            <button
              onClick={reset}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs uppercase flex items-center gap-2 shadow-lg shadow-rose-500/25"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons & Mobile D-pad */}
      <div className="w-full max-w-sm flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!previousBoard}
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-neutral-300 rounded-xl border border-neutral-800 transition-colors"
            title="Undo move"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={reset}
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl border border-neutral-800 transition-colors"
            title="Restart game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Mini Directional Arrow Buttons */}
        <div className="grid grid-cols-3 gap-1">
          <div />
          <button
            onClick={() => move('UP')}
            className="p-2 bg-neutral-900 active:bg-neutral-800 rounded-lg text-white border border-neutral-800"
            aria-label="Up"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div />
          <button
            onClick={() => move('LEFT')}
            className="p-2 bg-neutral-900 active:bg-neutral-800 rounded-lg text-white border border-neutral-800"
            aria-label="Left"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => move('DOWN')}
            className="p-2 bg-neutral-900 active:bg-neutral-800 rounded-lg text-white border border-neutral-800"
            aria-label="Down"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => move('RIGHT')}
            className="p-2 bg-neutral-900 active:bg-neutral-800 rounded-lg text-white border border-neutral-800"
            aria-label="Right"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
