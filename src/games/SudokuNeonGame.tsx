import React, { useState, useEffect } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Lightbulb, Timer, Delete, Trophy } from 'lucide-react';

interface SudokuNeonProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

// Sample playable 9x9 board (0 = empty)
const SAMPLE_PUZZLE = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const SOLUTION = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

export const SudokuNeonGame: React.FC<SudokuNeonProps> = ({ onGameOver, bestScore = 0 }) => {
  const [board, setBoard] = useState<number[][]>(() => SAMPLE_PUZZLE.map(r => [...r]));
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const initGame = () => {
    setBoard(SAMPLE_PUZZLE.map(r => [...r]));
    setSelectedCell(null);
    setMistakes(0);
    setTimer(0);
    setIsWon(false);
    setIsGameOver(false);
  };

  useEffect(() => {
    if (isWon || isGameOver) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isWon, isGameOver]);

  const handleInputNumber = (num: number) => {
    if (!selectedCell || isWon || isGameOver) return;
    const { r, c } = selectedCell;

    // Can't edit original clues
    if (SAMPLE_PUZZLE[r][c] !== 0) return;

    if (SOLUTION[r][c] === num) {
      sound.playClick();
      const updated = board.map(row => [...row]);
      updated[r][c] = num;
      setBoard(updated);

      // Check complete
      const isComplete = updated.every((row, ri) => row.every((val, ci) => val === SOLUTION[ri][ci]));
      if (isComplete) {
        sound.playBullseye();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        setIsWon(true);
        const finalScore = Math.max(100, 2500 - timer * 5 - mistakes * 200);
        onGameOver?.(finalScore);
      }
    } else {
      sound.playHit();
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newMistakes >= 3) {
        sound.playGameOver();
        setIsGameOver(true);
        onGameOver?.(200);
      }
    }
  };

  const handleErase = () => {
    if (!selectedCell || isWon || isGameOver) return;
    const { r, c } = selectedCell;
    if (SAMPLE_PUZZLE[r][c] !== 0) return;
    sound.playSwoosh();
    const updated = board.map(row => [...row]);
    updated[r][c] = 0;
    setBoard(updated);
  };

  const handleHint = () => {
    if (!selectedCell || isWon || isGameOver) return;
    const { r, c } = selectedCell;
    if (SAMPLE_PUZZLE[r][c] !== 0) return;

    sound.playPowerup();
    const correctVal = SOLUTION[r][c];
    const updated = board.map(row => [...row]);
    updated[r][c] = correctVal;
    setBoard(updated);
  };

  return (
    <div className="relative w-full h-[620px] bg-neutral-950 rounded-2xl border border-neutral-800 p-6 flex flex-col items-center justify-between shadow-2xl select-none">
      {/* Top Header */}
      <div className="w-full max-w-sm flex items-center justify-between bg-neutral-900/80 border border-neutral-800 px-4 py-2.5 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1 text-cyan-400">
            <Timer className="w-4 h-4" />
            <span>{timer}s</span>
          </div>
          <div className="h-4 w-px bg-neutral-700" />
          <div className="text-rose-400">
            MISTAKES: <span className="font-bold">{mistakes}/3</span>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            initGame();
          }}
          className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 9x9 Sudoku Grid */}
      <div className="bg-neutral-900/95 p-2 rounded-2xl border border-neutral-700 shadow-2xl grid grid-cols-9 gap-0.5 w-full max-w-xs aspect-square">
        {board.map((row, r) =>
          row.map((val, c) => {
            const isOriginal = SAMPLE_PUZZLE[r][c] !== 0;
            const isSelected = selectedCell?.r === r && selectedCell?.c === c;
            const isBlockRightBorder = (c + 1) % 3 === 0 && c !== 8;
            const isBlockBottomBorder = (r + 1) % 3 === 0 && r !== 8;

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => setSelectedCell({ r, c })}
                className={`w-full h-full text-xs sm:text-sm font-mono font-bold flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-cyan-500/30 text-white border-2 border-cyan-400'
                    : isOriginal
                    ? 'bg-neutral-900 text-neutral-200'
                    : val !== 0
                    ? 'bg-neutral-800/80 text-cyan-400'
                    : 'bg-neutral-950/60 hover:bg-neutral-850 text-transparent'
                } ${isBlockRightBorder ? 'border-r-2 border-r-neutral-600' : ''} ${
                  isBlockBottomBorder ? 'border-b-2 border-b-neutral-600' : ''
                }`}
              >
                {val !== 0 ? val : ''}
              </button>
            );
          })
        )}
      </div>

      {/* 1-9 Number Keypad */}
      <div className="w-full max-w-sm flex items-center justify-between gap-1.5 bg-neutral-900/60 border border-neutral-800 p-2.5 rounded-2xl">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleInputNumber(num)}
            className="flex-1 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-mono font-bold text-xs sm:text-sm shadow"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleErase}
          className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-rose-400"
          title="Erase"
        >
          <Delete className="w-4 h-4" />
        </button>
        <button
          onClick={handleHint}
          className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300"
          title="Reveal Hint"
        >
          <Lightbulb className="w-4 h-4" />
        </button>
      </div>

      {/* Win / Loss Modal */}
      {(isWon || isGameOver) && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-xs w-full rounded-2xl p-6 text-center shadow-2xl">
            <h3 className={`text-2xl font-arcade font-bold mb-2 ${isWon ? 'text-emerald-400' : 'text-rose-500'}`}>
              {isWon ? 'SUDOKU SOLVED!' : 'SYSTEM LOCKOUT'}
            </h3>
            <p className="text-xs text-neutral-400 mb-5">
              {isWon ? `Completed in ${timer}s with ${mistakes} errors!` : '3 errors exceeded.'}
            </p>
            <button
              onClick={() => {
                sound.playClick();
                initGame();
              }}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-neutral-950 font-arcade font-bold rounded-xl text-xs uppercase"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
