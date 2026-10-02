import React, { useState, useEffect } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Sparkles, Trophy, Timer, Eye } from 'lucide-react';

interface MemoryMatchProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

interface CardItem {
  id: number;
  iconId: number;
  symbol: string;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ICONS = [
  { symbol: '⚡', color: '#facc15' },
  { symbol: '🚀', color: '#f43f5e' },
  { symbol: '💎', color: '#06b6d4' },
  { symbol: '👑', color: '#f59e0b' },
  { symbol: '🔥', color: '#ea580c' },
  { symbol: '🛡️', color: '#3b82f6' },
  { symbol: '👾', color: '#a855f7' },
  { symbol: '⭐', color: '#10b981' },
];

export const MemoryMatchGame: React.FC<MemoryMatchProps> = ({ onGameOver, bestScore = 0 }) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [score, setScore] = useState(0);

  const initGame = () => {
    const deck: CardItem[] = [];
    let idCounter = 0;
    ICONS.forEach((item, iconIdx) => {
      // 2 of each icon for matching pairs
      for (let i = 0; i < 2; i++) {
        deck.push({
          id: idCounter++,
          iconId: iconIdx,
          symbol: item.symbol,
          color: item.color,
          isFlipped: false,
          isMatched: false
        });
      }
    });

    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIds([]);
    setMoves(0);
    setTimer(0);
    setIsWon(false);
    setScore(0);
  };

  useEffect(() => {
    initGame();
  }, []);

  // Timer
  useEffect(() => {
    if (isWon) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isWon]);

  const handleCardClick = (id: number) => {
    if (flippedIds.length >= 2) return;
    const clicked = cards.find(c => c.id === id);
    if (!clicked || clicked.isFlipped || clicked.isMatched) return;

    sound.playClick();
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    setCards(prev => prev.map(c => (c.id === id ? { ...c, isFlipped: true } : c)));

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [firstId, secondId] = newFlipped;
      const c1 = cards.find(c => c.id === firstId)!;
      const c2 = clicked;

      if (c1.iconId === c2.iconId) {
        // Match found!
        sound.playCoin();
        setTimeout(() => {
          setCards(prev =>
            prev.map(c => (c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c))
          );
          setFlippedIds([]);
          setScore(s => s + 200);

          // Check Win
          setCards(latest => {
            const allMatched = latest.every(c => c.isMatched || c.id === firstId || c.id === secondId);
            if (allMatched) {
              sound.playBullseye();
              confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
              setIsWon(true);
              const finalScore = 2000 - moves * 20 - timer * 10;
              setScore(Math.max(200, finalScore));
              onGameOver?.(Math.max(200, finalScore));
            }
            return latest;
          });
        }, 400);
      } else {
        // No match - flip back
        setTimeout(() => {
          setCards(prev =>
            prev.map(c => (c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c))
          );
          setFlippedIds([]);
        }, 900);
      }
    }
  };

  return (
    <div className="relative w-full h-[620px] bg-neutral-950 rounded-2xl border border-neutral-800 p-6 flex flex-col items-center justify-between shadow-2xl select-none">
      {/* Top Header */}
      <div className="w-full max-w-sm flex items-center justify-between bg-neutral-900/80 border border-neutral-800 px-4 py-2.5 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 text-xs font-mono text-neutral-300">
          <div className="flex items-center gap-1 text-cyan-400">
            <Timer className="w-4 h-4" />
            <span>{timer}s</span>
          </div>
          <div className="h-4 w-px bg-neutral-700" />
          <div>MOVES: <span className="text-white font-bold">{moves}</span></div>
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

      {/* 4x4 Cards Grid */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-sm aspect-square p-2">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isFlipped || card.isMatched}
            className={`w-full h-full rounded-2xl border text-3xl flex items-center justify-center transition-all duration-300 transform ${
              card.isFlipped || card.isMatched
                ? 'bg-neutral-900/90 border-neutral-700 scale-100 rotate-0 shadow-lg'
                : 'bg-neutral-800/80 hover:bg-neutral-750 border-neutral-700 hover:border-cyan-500/60 shadow hover:scale-[1.03]'
            }`}
            style={{
              borderColor: card.isMatched ? card.color : undefined,
              boxShadow: card.isMatched ? `0 0 14px ${card.color}44` : undefined
            }}
          >
            {card.isFlipped || card.isMatched ? (
              <span className="animate-in fade-in zoom-in duration-200">{card.symbol}</span>
            ) : (
              <Sparkles className="w-5 h-5 text-neutral-500" />
            )}
          </button>
        ))}
      </div>

      {/* Footer info */}
      <div className="w-full max-w-sm flex items-center justify-between text-xs font-mono text-neutral-400">
        <div>Pairs Matched: <span className="text-emerald-400 font-bold">{cards.filter(c => c.isMatched).length / 2}/8</span></div>
        <div>Best: <span className="text-amber-400 font-bold">{bestScore}</span></div>
      </div>

      {/* Win Modal */}
      {isWon && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-xs w-full rounded-2xl p-6 text-center shadow-2xl">
            <h3 className="text-2xl font-arcade font-bold text-emerald-400 mb-2">SYNCHRONIZED!</h3>
            <p className="text-xs text-neutral-400 mb-5">All 8 cyber memory pairs matched.</p>
            <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl mb-5 font-mono">
              <div className="text-[10px] text-neutral-400 uppercase">Final Score</div>
              <div className="text-2xl font-bold text-amber-400">{score}</div>
              <div className="text-xs text-neutral-400 mt-1">Time: {timer}s | Moves: {moves}</div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                initGame();
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-neutral-950 font-arcade font-bold rounded-xl text-xs uppercase"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
