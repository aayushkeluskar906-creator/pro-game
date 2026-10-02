import React, { useState, useEffect } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Grid, Trophy, Sparkles } from 'lucide-react';

interface BlockPuzzleProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

type ShapeMatrix = number[][];

interface ShapeItem {
  id: number;
  matrix: ShapeMatrix;
  color: string;
}

const SHAPES: { matrix: ShapeMatrix; color: string }[] = [
  { matrix: [[1]], color: '#06b6d4' },
  { matrix: [[1, 1]], color: '#3b82f6' },
  { matrix: [[1, 1, 1]], color: '#8b5cf6' },
  { matrix: [[1, 1, 1, 1]], color: '#ec4899' },
  { matrix: [[1, 1], [1, 1]], color: '#f59e0b' },
  { matrix: [[1, 0], [1, 0], [1, 1]], color: '#10b981' },
  { matrix: [[0, 1], [0, 1], [1, 1]], color: '#f43f5e' },
  { matrix: [[1, 1, 1], [0, 1, 0]], color: '#a855f7' },
  { matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: '#eab308' },
];

export const BlockPuzzleGame: React.FC<BlockPuzzleProps> = ({ onGameOver, bestScore = 0 }) => {
  const GRID_SIZE = 8;
  const [grid, setGrid] = useState<string[][]>(() =>
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''))
  );
  const [score, setScore] = useState(0);
  const [availableShapes, setAvailableShapes] = useState<ShapeItem[]>([]);
  const [selectedShape, setSelectedShape] = useState<ShapeItem | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  // Generate 3 random shapes
  const generateNewShapes = () => {
    const list: ShapeItem[] = [];
    for (let i = 0; i < 3; i++) {
      const def = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      list.push({ id: Math.random(), matrix: def.matrix, color: def.color });
    }
    setAvailableShapes(list);
  };

  const initGame = () => {
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('')));
    setScore(0);
    setIsGameOver(false);
    setSelectedShape(null);
    generateNewShapes();
  };

  useEffect(() => {
    initGame();
  }, []);

  // Check if shape can be placed at (r, c)
  const canPlace = (matrix: ShapeMatrix, r: number, c: number, currentGrid: string[][]) => {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 1) {
          const targetR = r + row;
          const targetC = c + col;
          if (targetR >= GRID_SIZE || targetC >= GRID_SIZE || currentGrid[targetR][targetC] !== '') {
            return false;
          }
        }
      }
    }
    return true;
  };

  // Place shape
  const handleCellClick = (r: number, c: number) => {
    if (!selectedShape || isGameOver) return;
    if (!canPlace(selectedShape.matrix, r, c, grid)) {
      sound.playHit();
      return;
    }

    sound.playClick();
    const newGrid = grid.map(row => [...row]);
    let blocksPlaced = 0;

    for (let row = 0; row < selectedShape.matrix.length; row++) {
      for (let col = 0; col < selectedShape.matrix[row].length; col++) {
        if (selectedShape.matrix[row][col] === 1) {
          newGrid[r + row][c + col] = selectedShape.color;
          blocksPlaced++;
        }
      }
    }

    // Check full rows & columns
    const fullRows: number[] = [];
    const fullCols: number[] = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      if (newGrid[row].every(cell => cell !== '')) fullRows.push(row);
    }
    for (let col = 0; col < GRID_SIZE; col++) {
      let full = true;
      for (let row = 0; row < GRID_SIZE; row++) {
        if (newGrid[row][col] === '') {
          full = false;
          break;
        }
      }
      if (full) fullCols.push(col);
    }

    // Clear completed lines
    fullRows.forEach(row => {
      for (let col = 0; col < GRID_SIZE; col++) newGrid[row][col] = '';
    });
    fullCols.forEach(col => {
      for (let row = 0; row < GRID_SIZE; row++) newGrid[row][col] = '';
    });

    const linesCleared = fullRows.length + fullCols.length;
    if (linesCleared > 0) {
      sound.playBullseye();
      if (linesCleared >= 2) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      }
    }

    const earned = blocksPlaced * 10 + linesCleared * 100 * linesCleared;
    const newScore = score + earned;
    setScore(newScore);
    setGrid(newGrid);

    // Remove used shape
    const remaining = availableShapes.filter(s => s.id !== selectedShape.id);
    setSelectedShape(null);

    if (remaining.length === 0) {
      generateNewShapes();
    } else {
      setAvailableShapes(remaining);
      // Check if any remaining shape can fit anywhere on the board
      let anyCanFit = false;
      for (const sh of remaining) {
        for (let checkR = 0; checkR < GRID_SIZE; checkR++) {
          for (let checkC = 0; checkC < GRID_SIZE; checkC++) {
            if (canPlace(sh.matrix, checkR, checkC, newGrid)) {
              anyCanFit = true;
              break;
            }
          }
          if (anyCanFit) break;
        }
        if (anyCanFit) break;
      }

      if (!anyCanFit) {
        sound.playGameOver();
        setIsGameOver(true);
        onGameOver?.(newScore);
      }
    }
  };

  return (
    <div className="relative w-full h-[620px] bg-neutral-950 rounded-2xl border border-neutral-800 p-6 flex flex-col items-center justify-between shadow-2xl select-none">
      {/* Top Header */}
      <div className="w-full max-w-sm flex items-center justify-between bg-neutral-900/80 border border-neutral-800 px-4 py-2.5 rounded-xl shadow-lg">
        <div className="flex items-center gap-2 text-xs font-arcade text-neutral-300">
          <Grid className="w-4 h-4 text-purple-400" />
          <span>BLOCK PUZZLE</span>
        </div>
        <div className="font-mono text-sm font-bold text-amber-400">
          SCORE: {score}
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

      {/* 8x8 Grid */}
      <div className="bg-neutral-900/90 p-3 rounded-2xl border border-neutral-800 shadow-2xl grid grid-cols-8 gap-1.5 w-full max-w-xs aspect-square">
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => handleCellClick(r, c)}
              className="w-full h-full rounded-md transition-all flex items-center justify-center border"
              style={{
                backgroundColor: cell ? cell : '#0f172a',
                borderColor: cell ? cell : '#1e293b',
                boxShadow: cell ? `0 0 10px ${cell}66` : 'none'
              }}
            />
          ))
        )}
      </div>

      {/* Shapes Tray */}
      <div className="w-full max-w-sm flex items-center justify-center gap-4 bg-neutral-900/60 border border-neutral-800 p-3 rounded-2xl">
        {availableShapes.map(sh => (
          <div
            key={sh.id}
            onClick={() => {
              sound.playClick();
              setSelectedShape(sh);
            }}
            className={`p-2 rounded-xl cursor-pointer border transition-all flex flex-col gap-1 items-center justify-center ${
              selectedShape?.id === sh.id
                ? 'bg-neutral-800 border-cyan-400 scale-105 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            {sh.matrix.map((row, r) => (
              <div key={r} className="flex gap-1">
                {row.map((val, c) => (
                  <div
                    key={c}
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: val === 1 ? sh.color : 'transparent' }}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-xs w-full rounded-2xl p-6 text-center shadow-2xl">
            <h3 className="text-2xl font-arcade font-bold text-rose-500 mb-2">GRID BLOCKED</h3>
            <p className="text-xs text-neutral-400 mb-5">No available space remaining for shapes.</p>
            <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl mb-5 font-mono">
              <div className="text-[10px] text-neutral-400 uppercase">Final Score</div>
              <div className="text-2xl font-bold text-amber-400">{score}</div>
              <div className="text-xs text-neutral-400 mt-1">Best: {bestScore}</div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                initGame();
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-arcade font-bold rounded-xl text-xs uppercase"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
