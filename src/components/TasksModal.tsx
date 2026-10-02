import React, { useState } from 'react';
import { TaskItem, ShooterGameId } from '../types/game';
import { 
  X, 
  CheckSquare, 
  Trophy, 
  Coins, 
  Zap, 
  Flame, 
  Train, 
  Shield, 
  Gamepad2, 
  ArrowUp, 
  ArrowDown, 
  Crown, 
  Sparkles, 
  Star, 
  Crosshair, 
  CheckCircle2, 
  Gift, 
  Play
} from 'lucide-react';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  multiplierRank: number;
  onClaimTask: (taskId: string) => void;
  onClaimAll: () => void;
  onPlayGame?: (gameId: ShooterGameId) => void;
}

export const TasksModal: React.FC<TasksModalProps> = ({
  isOpen,
  onClose,
  tasks,
  multiplierRank,
  onClaimTask,
  onClaimAll,
  onPlayGame
}) => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'daily' | 'runner' | 'mastery'>('all');

  if (!isOpen) return null;

  const filteredTasks = tasks.filter(t => selectedTab === 'all' || t.category === selectedTab);
  const unclaimedCount = tasks.filter(t => t.completed && !t.claimed).length;

  const getTaskIcon = (iconName: string) => {
    switch (iconName) {
      case 'train': return <Train className="w-5 h-5 text-cyan-400" />;
      case 'flame': return <Flame className="w-5 h-5 text-amber-400" />;
      case 'coins': return <Coins className="w-5 h-5 text-yellow-400" />;
      case 'shield': return <Shield className="w-5 h-5 text-cyan-400" />;
      case 'arrow-up': return <ArrowUp className="w-5 h-5 text-emerald-400" />;
      case 'arrow-down': return <ArrowDown className="w-5 h-5 text-amber-400" />;
      case 'crown': return <Crown className="w-5 h-5 text-amber-400" />;
      case 'sparkles': return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'star': return <Star className="w-5 h-5 text-yellow-400" />;
      case 'crosshair': return <Crosshair className="w-5 h-5 text-rose-400" />;
      case 'zap': return <Zap className="w-5 h-5 text-blue-400" />;
      default: return <CheckSquare className="w-5 h-5 text-cyan-400" />;
    }
  };

  const handleClaim = (taskId: string) => {
    sound.playBullseye();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    onClaimTask(taskId);
  };

  const handleClaimAll = () => {
    sound.playBullseye();
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    onClaimAll();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4 pr-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-arcade text-xl sm:text-2xl font-bold text-neutral-100 tracking-wide">
                  MISSIONS & TASKS
                </h2>
                {unclaimedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-arcade text-[10px] font-bold animate-pulse">
                    {unclaimedCount} REWARD{unclaimedCount > 1 ? 'S' : ''} READY
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Complete quests to unlock credits & permanent score multiplier
              </p>
            </div>
          </div>
        </div>

        {/* Score Multiplier Status Bar */}
        <div className="bg-gradient-to-r from-purple-950/40 via-cyan-950/40 to-neutral-950/60 border border-purple-800/40 p-3.5 rounded-2xl mb-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold font-arcade text-xs">
              <Star className="w-4 h-4 fill-purple-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-purple-300 font-bold">Subway & Temple Base Multiplier</div>
              <div className="text-sm sm:text-base font-arcade font-bold text-white flex items-center gap-1.5">
                <span>{multiplierRank}x SCORE MULTIPLIER</span>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-950 px-1.5 py-0.2 rounded border border-purple-800">
                  RANK {multiplierRank}
                </span>
              </div>
            </div>
          </div>

          {unclaimedCount > 0 && (
            <button
              onClick={handleClaimAll}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-arcade font-bold text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all transform hover:scale-[1.02]"
            >
              <Gift className="w-4 h-4" />
              <span>CLAIM ALL ({unclaimedCount})</span>
            </button>
          )}
        </div>

        {/* Tabs Filter Bar */}
        <div className="flex items-center gap-1.5 border-b border-neutral-800 pb-3 mb-4 text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              selectedTab === 'all'
                ? 'bg-neutral-100 text-neutral-950 font-bold shadow'
                : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
            }`}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setSelectedTab('daily')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              selectedTab === 'daily'
                ? 'bg-cyan-500 text-neutral-950 font-bold shadow'
                : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
            }`}
          >
            Daily Quests ({tasks.filter(t => t.category === 'daily').length})
          </button>
          <button
            onClick={() => setSelectedTab('runner')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              selectedTab === 'runner'
                ? 'bg-purple-500 text-white font-bold shadow'
                : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
            }`}
          >
            Multiplier Missions ({tasks.filter(t => t.category === 'runner').length})
          </button>
          <button
            onClick={() => setSelectedTab('mastery')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              selectedTab === 'mastery'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow'
                : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
            }`}
          >
            Mastery Badges ({tasks.filter(t => t.category === 'mastery').length})
          </button>
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredTasks.map(task => {
            const pct = Math.min(100, Math.floor((task.current / task.target) * 100));

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  task.claimed
                    ? 'bg-neutral-950/40 border-neutral-800/60 opacity-65'
                    : task.completed
                    ? 'bg-gradient-to-r from-amber-950/30 via-neutral-900 to-neutral-900 border-amber-500/50 shadow-lg shadow-amber-500/10'
                    : 'bg-neutral-950/70 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                {/* Left: Icon & Details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                    {getTaskIcon(task.icon)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-arcade text-sm font-bold text-neutral-100 truncate">
                        {task.title}
                      </h4>
                      <span className="text-[9px] font-mono uppercase px-2 py-0.2 rounded bg-neutral-800 text-neutral-400">
                        {task.category}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                      {task.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            task.completed ? 'bg-emerald-400' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-neutral-300 shrink-0">
                        {task.current} / {task.target} ({pct}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Rewards & Action */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/60">
                  {/* Rewards Badge */}
                  <div className="flex flex-col items-start sm:items-end">
                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400">
                      <Zap className="w-3.5 h-3.5" />
                      +{task.rewardCredits} CR
                    </div>
                    {task.rewardMultiplier && (
                      <div className="text-[10px] font-mono text-purple-400 font-bold flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-purple-400" />
                        +{task.rewardMultiplier}x Mult
                      </div>
                    )}
                  </div>

                  {/* Claim or Launch Button */}
                  {task.claimed ? (
                    <div className="px-3.5 py-1.5 rounded-xl bg-neutral-800/60 text-neutral-500 font-arcade text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>CLAIMED</span>
                    </div>
                  ) : task.completed ? (
                    <button
                      onClick={() => handleClaim(task.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-arcade font-bold text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-amber-500/25 animate-pulse"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>CLAIM</span>
                    </button>
                  ) : task.gameId && task.gameId !== 'any' && onPlayGame ? (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onClose();
                        onPlayGame(task.gameId as ShooterGameId);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-cyan-400 font-arcade text-xs flex items-center gap-1 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>GO</span>
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 font-arcade text-[11px]">
                      {pct}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
