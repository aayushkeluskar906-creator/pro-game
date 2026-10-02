import React from 'react';
import { ShooterGameId } from '../types/game';
import { Trophy, X, Crown, User, Flame } from 'lucide-react';
import { sound } from '../utils/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  highScores: Record<ShooterGameId, number>;
}

export const ShooterLeaderboard: React.FC<Props> = ({ isOpen, onClose, highScores }) => {
  const [selectedGame, setSelectedGame] = React.useState<ShooterGameId>('cyber-storm');

  if (!isOpen) return null;

  const mockRanks: Partial<Record<ShooterGameId, { name: string; score: number }[]>> = {
    'cyber-storm': [
      { name: 'Valkyrie_9', score: 18450 },
      { name: 'ApexPhantom', score: 14200 },
      { name: 'Ghost_Recon', score: 11800 },
      { name: 'BulletHellPro', score: 9400 },
    ],
    'vector-void': [
      { name: 'StarKiller', score: 8600 },
      { name: 'VoidSniper', score: 7100 },
      { name: 'AstroDrifter', score: 5900 },
    ],
    'target-matrix': [
      { name: 'Deadshot_AI', score: 4800 },
      { name: 'QuickDraw99', score: 4200 },
      { name: 'ReflexGod', score: 3650 },
    ],
    'archery-master': [
      { name: 'Robin_Cyber', score: 3200 },
      { name: 'HawkEye_X', score: 2750 },
      { name: 'BullseyeKing', score: 2300 },
      { name: 'ArrowSmith', score: 1950 },
    ],
    'subway-runner': [
      { name: 'NeonSkater', score: 8400 },
      { name: 'TrackDodge', score: 6950 },
      { name: 'HoverKing', score: 5120 },
      { name: 'RailRider', score: 3900 },
    ],
    'temple-run': [
      { name: 'RelicHunter', score: 9200 },
      { name: 'IdolRunner', score: 7450 },
      { name: 'JungleGhost', score: 5600 },
      { name: 'AncientFox', score: 4100 },
    ],
    'cyber-racer-3d': [
      { name: 'SpeedDemon', score: 14200 },
      { name: 'NitroKing', score: 11500 },
      { name: 'TurboViper', score: 9200 },
      { name: 'DriftMaster', score: 7600 },
    ],
    'neon-io-arena': [
      { name: 'ShadowNinja', score: 2850 },
      { name: 'ApexPredator', score: 2340 },
      { name: 'GhostRider', score: 1890 },
      { name: 'CyberWolf', score: 1450 },
    ],
    'neon-2048': [
      { name: 'MathWizard', score: 18450 },
      { name: 'TileMaster', score: 12400 },
      { name: 'NumberKing', score: 8900 },
      { name: 'GridSolver', score: 5600 },
    ],
    'cyber-flap': [
      { name: 'FlapLegend', score: 142 },
      { name: 'SkyDodge', score: 98 },
      { name: 'WingCommander', score: 76 },
      { name: 'GlidePro', score: 54 },
    ],
  };

  const list = [...(mockRanks[selectedGame] || [])];
  const myScore = highScores[selectedGame] || 0;
  if (myScore > 0) {
    list.push({ name: 'You (Operative)', score: myScore });
  }
  list.sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-arcade text-xl font-bold text-neutral-100">
              HALL OF OPERATIVES
            </h2>
            <p className="text-xs text-neutral-400 font-mono">
              High score leaderboard records
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 mb-4 border-b border-neutral-800 pb-2 overflow-x-auto text-xs font-arcade">
          <button
            onClick={() => setSelectedGame('subway-runner')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap ${
              selectedGame === 'subway-runner'
                ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Subway 3D
          </button>
          <button
            onClick={() => setSelectedGame('temple-run')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap ${
              selectedGame === 'temple-run'
                ? 'bg-neutral-800 text-amber-400 border border-neutral-700 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Temple 3D
          </button>
          <button
            onClick={() => setSelectedGame('cyber-racer-3d')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap ${
              selectedGame === 'cyber-racer-3d'
                ? 'bg-neutral-800 text-rose-400 border border-neutral-700 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Racer 3D
          </button>
          <button
            onClick={() => setSelectedGame('neon-io-arena')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap ${
              selectedGame === 'neon-io-arena'
                ? 'bg-neutral-800 text-emerald-400 border border-neutral-700 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Neon.IO
          </button>
          <button
            onClick={() => setSelectedGame('cyber-storm')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap ${
              selectedGame === 'cyber-storm'
                ? 'bg-neutral-800 text-rose-400 border border-neutral-700 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Cyber Storm
          </button>
          <button
            onClick={() => setSelectedGame('archery-master')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap ${
              selectedGame === 'archery-master'
                ? 'bg-neutral-800 text-amber-400 border border-neutral-700 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Archery
          </button>
          <button
            onClick={() => setSelectedGame('neon-2048')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap ${
              selectedGame === 'neon-2048'
                ? 'bg-neutral-800 text-purple-400 border border-neutral-700 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            2048
          </button>
          <button
            onClick={() => setSelectedGame('cyber-flap')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap ${
              selectedGame === 'cyber-flap'
                ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Flap
          </button>
        </div>

        {/* List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {list.map((item, idx) => {
            const isMe = item.name.includes('You');
            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isMe
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-arcade text-sm font-bold text-neutral-400">#{idx + 1}</span>
                  <div className="font-arcade text-sm font-semibold">{item.name}</div>
                </div>
                <div className="font-arcade text-base font-bold text-amber-400">
                  {item.score.toLocaleString()} PTS
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
