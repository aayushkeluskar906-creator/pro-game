import React from 'react';
import { Gamepad2, Trophy, Zap, Volume2, VolumeX, Tv, Flame, Target, CheckSquare, ShoppingBag } from 'lucide-react';
import { sound } from '../utils/sound';
import { PlayerShooterStats } from '../types/game';

interface Props {
  playerStats: PlayerShooterStats;
  crtActive: boolean;
  onToggleCrt: () => void;
  onOpenArmory: () => void;
  onOpenLeaderboard: () => void;
  onOpenTasks?: () => void;
  unclaimedTasksCount?: number;
  onSelectGame: (gameId: string | null) => void;
}

export const ShooterHeader: React.FC<Props> = ({
  playerStats,
  crtActive,
  onToggleCrt,
  onOpenArmory,
  onOpenLeaderboard,
  onOpenTasks,
  unclaimedTasksCount = 0,
  onSelectGame,
}) => {
  const [isMuted, setIsMuted] = React.useState(sound.getMuted());

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={() => onSelectGame(null)}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-amber-500 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <Gamepad2 className="w-6 h-6 text-neutral-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-arcade text-lg sm:text-xl font-bold tracking-wider text-neutral-100 group-hover:text-cyan-400 transition-colors">
                GAMESPHERE
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-semibold border border-cyan-500/30">
                ARCADE
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest hidden sm:block">
              Web Games Hub
            </p>
          </div>
        </div>

        {/* Quick Game Switcher Links (Desktop/Tablet) */}
        <div className="hidden lg:flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-800 p-1 rounded-xl">
          <button
            onClick={() => {
              sound.playClick();
              onSelectGame('subway-runner');
            }}
            className="px-2.5 py-1 rounded-lg text-xs font-arcade font-bold text-cyan-400 hover:bg-neutral-800 transition-colors flex items-center gap-1"
          >
            <span>🚆 Subway 3D</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onSelectGame('temple-run');
            }}
            className="px-2.5 py-1 rounded-lg text-xs font-arcade font-bold text-amber-400 hover:bg-neutral-800 transition-colors flex items-center gap-1"
          >
            <span>🗿 Temple 3D</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onSelectGame('cyber-racer-3d');
            }}
            className="px-2.5 py-1 rounded-lg text-xs font-arcade font-bold text-rose-400 hover:bg-neutral-800 transition-colors flex items-center gap-1"
          >
            <span>🏎️ Racer 3D</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onSelectGame('neon-io-arena');
            }}
            className="px-2.5 py-1 rounded-lg text-xs font-arcade font-bold text-emerald-400 hover:bg-neutral-800 transition-colors flex items-center gap-1"
          >
            <span>🐍 Neon.IO</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onSelectGame('neon-2048');
            }}
            className="px-2 py-1 rounded-lg text-xs font-arcade font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            2048
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onSelectGame('cyber-flap');
            }}
            className="px-2 py-1 rounded-lg text-xs font-arcade font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Flap
          </button>
        </div>

        {/* Navigation & Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenTasks && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenTasks();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-arcade text-neutral-200 hover:text-cyan-400 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors relative"
            >
              <CheckSquare className="w-4 h-4 text-cyan-400" />
              <span>Tasks</span>
              {unclaimedTasksCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onOpenArmory();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-arcade text-neutral-200 hover:text-amber-400 bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 transition-colors shadow-sm"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Shop & Items ({playerStats.credits} CR)</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenLeaderboard();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-arcade text-neutral-200 hover:text-cyan-400 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
          >
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Records</span>
          </button>

          {/* CRT effect toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleCrt();
            }}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              crtActive
                ? 'bg-rose-950/60 text-rose-400 border-rose-800/80 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-neutral-300'
            }`}
            title="Toggle CRT Scanlines"
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Sound toggle */}
          <button
            onClick={() => {
              const muted = sound.toggleMute();
              setIsMuted(muted);
            }}
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-neutral-500" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
          </button>

          {/* Credits Display */}
          <div className="flex items-center gap-1.5 pl-3 border-l border-neutral-800 font-mono text-xs font-bold text-amber-400 bg-amber-950/30 border border-amber-800/40 px-2.5 py-1 rounded-lg">
            <span>{playerStats.credits} CR</span>
          </div>
        </div>
      </div>
    </header>
  );
};
