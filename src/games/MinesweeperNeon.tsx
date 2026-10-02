import React, { useState, useEffect, useRef } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Flag, Bomb, Shield, Timer, Trophy } from 'lucide-react';

interface MinesweeperNeonProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

export const MinesweeperNeon: React.FC<MinesweeperNeonProps> = ({ onGameOver, bestScore = 0 }) => {
  const ROWS = 9;
  const COLS = 9;
  const MINES = 10;

  const [grid, setGrid] = useState<Cell[][]>([]);
  const [flagMode, setFlagMode] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [flagsRemaining, setFlagsRemaining] = useState(MINES);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Initialize board
  const initBoard = () => {
    const newGrid: Cell[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push({
          row: r,
          col: c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0
        });
      }
      newGrid.push(row);
    }

    // Place mines randomly
    let placed = 0;
    while (placed < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if (!newGrid[r][c].isMine) {
        newGrid[r][c].isMine = true;
        placed++;
      }
    }

    // Calculate neighboring mines
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (newGrid[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newGrid[nr][nc].isMine) {
              count++;
            }
          }
        }
        newGrid[r][c].neighborMines = count;
      }
    }

    setGrid(newGrid);
    setIsGameOver(false);
    setIsWon(false);
    setScore(0);
    setTimer(0);
    setFlagsRemaining(MINES);
  };

  useEffect(() => {
    initBoard();
  }, []);

  // Timer
  useEffect(() => {
    if (isGameOver || isWon) return;
    const interval = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameOver, isWon]);

  // Reveal cell and propagate zeros
  const revealCell = (r: number, c: number) => {
    if (isGameOver || isWon) return;
    const cell = grid[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    if (cell.isMine) {
      // Boom!
      sound.playExplosion();
      const updated = grid.map(row => row.map(cell => ({ ...cell, isRevealed: cell.isMine ? true : cell.isRevealed })));
      setGrid(updated);
      setIsGameOver(true);
      onGameOver?.(score);
      return;
    }

    sound.playClick();
    const updated = grid.map(row => row.map(cell => ({ ...cell })));
    const queue: [number, number][] = [[r, c]];
    updated[r][c].isRevealed = true;
    let revealedCount = 1;

    while (queue.length > 0) {
      const [currR, currC] = queue.shift()!;
      if (updated[currR][currC].neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = currR + dr;
            const nc = currC + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              const neighbor = updated[nr][nc];
              if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
                neighbor.isRevealed = true;
                revealedCount++;
                if (neighbor.neighborMines === 0) {
                  queue.push([nr, nc]);
                }
              }
            }
          }
        }
      }
    }

    const newScore = score + revealedCount * 25;
    setScore(newScore);
    setGrid(updated);

    // Check Win
    let unrevealedNonMines = 0;
    for (let row of updated) {
      for (let cl of row) {
        if (!cl.isMine && !cl.isRevealed) unrevealedNonMines++;
      }
    }

    if (unrevealedNonMines === 0) {
      sound.playBullseye();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setIsWon(true);
      const winScore = newScore + Math.max(100, 1000 - timer * 10);
      setScore(winScore);
      onGameOver?.(winScore);
    }
  };

  const toggleFlag = (r: number, c: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    if (isGameOver || isWon) return;
    const cell = grid[r][c];
    if (cell.isRevealed) return;

    sound.playSwoosh();
    const updated = grid.map(row => row.map(cl => ({ ...cl })));
    const nowFlagged = !cell.isFlagged;
    updated[r][c].isFlagged = nowFlagged;
    setGrid(updated);
    setFlagsRemaining(prev => nowFlagged ? prev - 1 : prev + 1);
  };

  const getNumberColor = (num: number) => {
    switch (num) {
      case 1: return 'text-cyan-400';
      case 2: return 'text-emerald-400';
      case 3: return 'text-rose-400';
      case 4: return 'text-purple-400';
      case 5: return 'text-amber-400';
      case 6: return 'text-teal-400';
      case 7: return 'text-pink-400';
      case 8: return 'text-red-500';
      default: return 'text-neutral-300';
    }
  };

  return (
    <div className="relative w-full h-[620px] bg-[#090b10] rounded-2xl border border-neutral-800 p-6 flex flex-col items-center justify-between shadow-2xl select-none">
      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between bg-neutral-900/80 border border-neutral-800 px-4 py-2.5 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400">
            <Bomb className="w-4 h-4" />
            <span>{flagsRemaining}</span>
          </div>
          <div className="h-4 w-px bg-neutral-700" />
          <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-300">
            <Timer className="w-4 h-4 text-cyan-400" />
            <span>{timer}s</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFlagMode(!flagMode)}
            className={`px-3 py-1 rounded-lg text-xs font-arcade font-bold flex items-center gap-1 transition-all ${
              flagMode ? 'bg-amber-500 text-neutral-950 shadow-md' : 'bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{flagMode ? 'FLAG' : 'DIG'}</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              initBoard();
            }}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 9x9 Grid Board */}
      <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 shadow-inner grid grid-cols-9 gap-1.5 max-w-sm w-full aspect-square">
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => (flagMode ? toggleFlag(r, c) : revealCell(r, c))}
              onContextMenu={(e) => toggleFlag(r, c, e)}
              className={`w-full h-full rounded-lg font-mono font-bold text-sm sm:text-base flex items-center justify-center transition-all ${
                cell.isRevealed
                  ? cell.isMine
                    ? 'bg-rose-600/90 text-white animate-pulse'
                    : 'bg-neutral-900/90 border border-neutral-800'
                  : 'bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 shadow'
              }`}
            >
              {cell.isRevealed ? (
                cell.isMine ? (
                  <Bomb className="w-4 h-4" />
                ) : cell.neighborMines > 0 ? (
                  <span className={getNumberColor(cell.neighborMines)}>{cell.neighborMines}</span>
                ) : null
              ) : cell.isFlagged ? (
                <Flag className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              ) : null}
            </button>
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="w-full max-w-md flex items-center justify-between text-xs font-mono text-neutral-400">
        <div>Score: <span className="text-white font-bold">{score}</span></div>
        <div>Best: <span className="text-amber-400 font-bold">{bestScore}</span></div>
      </div>

      {/* Game Over / Win Modal */}
      {(isGameOver || isWon) && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-sm w-full rounded-2xl p-6 text-center shadow-2xl">
            <h3 className={`text-2xl font-arcade font-bold mb-2 ${isWon ? 'text-emerald-400' : 'text-rose-500'}`}>
              {isWon ? 'SECTOR CLEARED!' : 'DETONATION!'}
            </h3>
            <p className="text-xs text-neutral-400 mb-5">
              {isWon ? `All 10 mines defused in ${timer} seconds!` : 'You struck an explosive plasma charge.'}
            </p>
            <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl mb-5 font-mono">
              <div className="text-[10px] text-neutral-400 uppercase">Final Score</div>
              <div className="text-2xl font-bold text-amber-400">{score}</div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                initBoard();
              }}
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-arcade font-bold rounded-xl text-xs uppercase"
            >
              DEFUSE AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
