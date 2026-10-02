import React, { useState, useEffect } from 'react';
import { ShooterGameId, PlayerShooterStats, GameCategory, TaskItem, PlayerInventory } from './types/game';
import { GAMES_CATALOG, CatalogGame } from './data/gamesCatalog';
import { INITIAL_TASKS } from './data/tasksData';

// Game Components
import { ThreeEndlessRunner3D } from './games/ThreeEndlessRunner3D';
import { ThreeCyberRacer3D } from './games/ThreeCyberRacer3D';
import { Starblade3D } from './games/Starblade3D';
import { NeonIoArena } from './games/NeonIoArena';
import { TankIo } from './games/TankIo';
import { BlackHoleIo } from './games/BlackHoleIo';
import { BladeStormIo } from './games/BladeStormIo';
import { CyberStorm } from './games/CyberStorm';
import { VectorVoidGame } from './games/VectorVoidGame';
import { TargetMatrix } from './games/TargetMatrix';
import { ArcheryMaster } from './games/ArcheryMaster';
import { SpaceInvaders } from './games/SpaceInvaders';
import { ZombieDefense } from './games/ZombieDefense';
import { CyberFlap } from './games/CyberFlap';
import { NeonBreakout } from './games/NeonBreakout';
import { RetroPac } from './games/RetroPac';
import { RetroSnake } from './games/RetroSnake';
import { CyberPong } from './games/CyberPong';
import { DinoJump } from './games/DinoJump';
import { Neon2048 } from './games/Neon2048';
import { MinesweeperNeon } from './games/MinesweeperNeon';
import { SudokuNeonGame } from './games/SudokuNeonGame';
import { BlockPuzzleGame } from './games/BlockPuzzleGame';
import { MemoryMatchGame } from './games/MemoryMatchGame';
import { ColorConnectGame } from './games/ColorConnectGame';
import { HoopShotGame } from './games/HoopShotGame';
import { KnifeHitGame } from './games/KnifeHitGame';
import { CookieClickerNeon } from './games/CookieClickerNeon';
import { RopeSwingGame } from './games/RopeSwingGame';

// UI Components
import { ShooterHeader } from './components/ShooterHeader';
import { ArmoryModal } from './components/ArmoryModal';
import { ShooterLeaderboard } from './components/ShooterLeaderboard';
import { TasksModal } from './components/TasksModal';
import { 
  Crosshair, 
  Target, 
  Zap, 
  Flame, 
  Play, 
  ArrowLeft, 
  Trophy,
  ChevronRight,
  Wind,
  Train,
  Footprints,
  Radio,
  Gamepad2,
  Box,
  Layers,
  Sparkles,
  Gauge,
  Search,
  Sword,
  Swords,
  Grid,
  Heart,
  CheckSquare,
  Bot,
  Shield,
  Star,
  ShoppingBag
} from 'lucide-react';
import { sound } from './utils/sound';

const STORAGE_KEY = 'gamesphere_shooter_v1';

export const DEFAULT_INVENTORY: PlayerInventory = {
  hoverboards: 3,
  headstarts: 1,
  mysteryBoxes: 0,
  resurrectWings: 1,
  magnetLevel: 1,
  sneakersLevel: 1,
  jetpackLevel: 1,
  multiplierLevel: 1,
  repairKits: 2,
  shieldBoosters: 1,
  sentryTurrets: 0,
};

const DEFAULT_STATS: PlayerShooterStats = {
  credits: 350,
  totalKills: 0,
  bossesDefeated: 0,
  multiplierRank: 1,
  inventory: DEFAULT_INVENTORY,
  tasks: INITIAL_TASKS,
  highScores: {
    'subway-runner': 0,
    'temple-run': 0,
    'cyber-racer-3d': 0,
    'space-flight-3d': 0,
    'neon-io-arena': 0,
    'tank-io': 0,
    'hole-io': 0,
    'knife-io': 0,
    'cyber-storm': 0,
    'vector-void': 0,
    'target-matrix': 0,
    'archery-master': 0,
    'space-invaders': 0,
    'zombie-defense': 0,
    'cyber-flap': 0,
    'neon-breakout': 0,
    'retro-pac': 0,
    'snake-retro': 0,
    'pong-duo': 0,
    'dino-jump': 0,
    'neon-2048': 0,
    'minesweeper': 0,
    'sudoku-neon': 0,
    'block-puzzle': 0,
    'memory-match': 0,
    'color-connect': 0,
    'neon-pong-table': 0,
    'hoop-shot': 0,
    'knife-hit': 0,
    'cookie-clicker': 0,
    'rope-swing': 0,
  },
  unlockedWeapons: ['plasma-rifle'],
  weaponLevels: {
    'plasma-rifle': 1,
  },
  perks: {
    maxHealthLevel: 1,
    speedLevel: 1,
    shieldRegenLevel: 1,
  },
};

export default function App() {
  const [stats, setStats] = useState<PlayerShooterStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.tasks || parsed.tasks.length === 0) {
          parsed.tasks = INITIAL_TASKS;
        }
        if (!parsed.multiplierRank) {
          parsed.multiplierRank = 1;
        }
        if (!parsed.inventory) {
          parsed.inventory = DEFAULT_INVENTORY;
        }
        return parsed;
      }
    } catch {}
    return DEFAULT_STATS;
  });

  const [activeGame, setActiveGame] = useState<ShooterGameId | null>(null);
  const [armoryOpen, setArmoryOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [crtActive, setCrtActive] = useState(false);
  const [hubCategory, setHubCategory] = useState<GameCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {}
  }, [stats]);

  // Tasks progress tracking helper
  const updateTaskProgress = (type: 'jump' | 'slide' | 'hoverboard' | 'coin' | 'distance' | 'kill' | 'play', amount: number, gameId?: ShooterGameId) => {
    setStats(prev => {
      const currentTasks = prev.tasks && prev.tasks.length > 0 ? prev.tasks : INITIAL_TASKS;
      const updated = currentTasks.map(t => {
        if (t.completed) return t;
        let matches = false;

        if (t.gameId === 'any' || t.gameId === gameId) {
          if (type === 'distance' && (t.id.includes('500') || t.id.includes('400') || t.id.includes('distance') || t.id.includes('1500'))) matches = true;
          if (type === 'coin' && (t.id.includes('coin') || t.id.includes('tycoon'))) matches = true;
          if (type === 'jump' && t.id.includes('jump')) matches = true;
          if (type === 'slide' && t.id.includes('slide')) matches = true;
          if (type === 'hoverboard' && t.id.includes('hoverboard')) matches = true;
          if (type === 'kill' && (t.id.includes('kills') || t.id.includes('eliminate'))) matches = true;
          if (type === 'play' && t.id.includes('play')) matches = true;
        }

        if (matches) {
          const nextVal = Math.min(t.target, t.current + Math.floor(amount));
          return {
            ...t,
            current: nextVal,
            completed: nextVal >= t.target
          };
        }
        return t;
      });

      return { ...prev, tasks: updated };
    });
  };

  const handleClaimTask = (taskId: string) => {
    setStats(prev => {
      const currentTasks = prev.tasks || INITIAL_TASKS;
      const task = currentTasks.find(t => t.id === taskId);
      if (!task || !task.completed || task.claimed) return prev;

      const multAdd = task.rewardMultiplier || 0;
      return {
        ...prev,
        credits: prev.credits + task.rewardCredits,
        multiplierRank: (prev.multiplierRank || 1) + multAdd,
        tasks: currentTasks.map(t => (t.id === taskId ? { ...t, claimed: true } : t))
      };
    });
  };

  const handleClaimAll = () => {
    setStats(prev => {
      const currentTasks = prev.tasks || INITIAL_TASKS;
      let creditsToAdd = 0;
      let multToAdd = 0;
      const updatedTasks = currentTasks.map(t => {
        if (t.completed && !t.claimed) {
          creditsToAdd += t.rewardCredits;
          multToAdd += (t.rewardMultiplier || 0);
          return { ...t, claimed: true };
        }
        return t;
      });

      return {
        ...prev,
        credits: prev.credits + creditsToAdd,
        multiplierRank: (prev.multiplierRank || 1) + multToAdd,
        tasks: updatedTasks
      };
    });
  };

  const handleUnlockWeapon = (weaponId: string, cost: number) => {
    setStats(prev => ({
      ...prev,
      credits: prev.credits - cost,
      unlockedWeapons: [...prev.unlockedWeapons, weaponId],
      weaponLevels: { ...prev.weaponLevels, [weaponId]: 1 },
    }));
  };

  const handleUpgradeWeapon = (weaponId: string, cost: number) => {
    setStats(prev => ({
      ...prev,
      credits: prev.credits - cost,
      weaponLevels: {
        ...prev.weaponLevels,
        [weaponId]: (prev.weaponLevels[weaponId] || 1) + 1,
      },
    }));
  };

  const handleBuyItem = (itemId: keyof PlayerInventory, cost: number, count = 1) => {
    setStats(prev => {
      if (prev.credits < cost) return prev;
      const curInv = prev.inventory || DEFAULT_INVENTORY;
      const curCount = (curInv[itemId] as number) || 0;
      return {
        ...prev,
        credits: prev.credits - cost,
        inventory: {
          ...curInv,
          [itemId]: curCount + count,
        }
      };
    });
  };

  const handleUpgradeBooster = (boosterKey: keyof PlayerInventory, cost: number) => {
    setStats(prev => {
      if (prev.credits < cost) return prev;
      const curInv = prev.inventory || DEFAULT_INVENTORY;
      const curLevel = (curInv[boosterKey] as number) || 1;
      return {
        ...prev,
        credits: prev.credits - cost,
        inventory: {
          ...curInv,
          [boosterKey]: curLevel + 1,
        }
      };
    });
  };

  const handleReviveRunner = () => {
    let success = false;
    setStats(prev => {
      const curInv = prev.inventory || DEFAULT_INVENTORY;
      if (curInv.resurrectWings > 0) {
        success = true;
        return {
          ...prev,
          inventory: {
            ...curInv,
            resurrectWings: curInv.resurrectWings - 1,
          }
        };
      } else if (prev.credits >= 300) {
        success = true;
        return {
          ...prev,
          credits: prev.credits - 300,
        };
      }
      return prev;
    });
    return success;
  };

  const handleConsumeHoverboard = () => {
    setStats(prev => {
      const curInv = prev.inventory || DEFAULT_INVENTORY;
      return {
        ...prev,
        totalHoverboardsUsed: (prev.totalHoverboardsUsed || 0) + 1,
        inventory: {
          ...curInv,
          hoverboards: Math.max(0, curInv.hoverboards - 1),
        }
      };
    });
  };

  const handleConsumeHeadstart = () => {
    setStats(prev => {
      const curInv = prev.inventory || DEFAULT_INVENTORY;
      return {
        ...prev,
        inventory: {
          ...curInv,
          headstarts: Math.max(0, curInv.headstarts - 1),
        }
      };
    });
  };

  // Game Over Handlers
  const handleGenericGameOver = (gameId: ShooterGameId, score: number, creditsEarned: number = Math.max(10, Math.floor(score / 5))) => {
    updateTaskProgress('play', 1, gameId);
    setStats(prev => ({
      ...prev,
      credits: prev.credits + creditsEarned,
      highScores: {
        ...prev.highScores,
        [gameId]: Math.max(prev.highScores[gameId] || 0, score),
      },
    }));
  };

  const handleCyberStormGameOver = (score: number, creditsEarned: number, kills: number) => {
    updateTaskProgress('kill', kills, 'cyber-storm');
    updateTaskProgress('play', 1, 'cyber-storm');
    setStats(prev => ({
      ...prev,
      credits: prev.credits + creditsEarned,
      totalKills: prev.totalKills + kills,
      highScores: {
        ...prev.highScores,
        'cyber-storm': Math.max(prev.highScores['cyber-storm'] || 0, score),
      },
    }));
  };

  const handleSubwayGameOver = (
    score: number, 
    coins: number, 
    extra?: { jumps: number; slides: number; hoverboards: number }
  ) => {
    updateTaskProgress('distance', score, 'subway-runner');
    updateTaskProgress('coin', coins, 'subway-runner');
    if (extra) {
      if (extra.jumps > 0) updateTaskProgress('jump', extra.jumps, 'subway-runner');
      if (extra.slides > 0) updateTaskProgress('slide', extra.slides, 'subway-runner');
      if (extra.hoverboards > 0) updateTaskProgress('hoverboard', extra.hoverboards, 'subway-runner');
    }
    updateTaskProgress('play', 1, 'subway-runner');

    setStats(prev => ({
      ...prev,
      credits: prev.credits + Math.floor(score / 3) + coins * 2,
      highScores: {
        ...prev.highScores,
        'subway-runner': Math.max(prev.highScores['subway-runner'] || 0, score),
      },
    }));
  };

  const handleTempleGameOver = (
    score: number, 
    coins: number,
    extra?: { jumps: number; slides: number; hoverboards: number }
  ) => {
    updateTaskProgress('distance', score, 'temple-run');
    updateTaskProgress('coin', coins, 'temple-run');
    if (extra) {
      if (extra.jumps > 0) updateTaskProgress('jump', extra.jumps, 'temple-run');
      if (extra.slides > 0) updateTaskProgress('slide', extra.slides, 'temple-run');
    }
    updateTaskProgress('play', 1, 'temple-run');

    setStats(prev => ({
      ...prev,
      credits: prev.credits + Math.floor(score / 3) + coins * 2,
      highScores: {
        ...prev.highScores,
        'temple-run': Math.max(prev.highScores['temple-run'] || 0, score),
      },
    }));
  };

  // Filter Catalog
  const filteredGames = GAMES_CATALOG.filter(game => {
    let matchesCat = false;
    if (hubCategory === 'all') matchesCat = true;
    else if (hubCategory === 'shooting') matchesCat = !!game.isShooting;
    else if (hubCategory === 'vs-computer') matchesCat = !!game.vsComputer;
    else matchesCat = game.category === hubCategory;

    const matchesQuery = !searchQuery || 
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const unclaimedTasksCount = (stats.tasks || INITIAL_TASKS).filter(t => t.completed && !t.claimed).length;

  return (
    <div className="min-h-screen bg-[#08090d] text-neutral-100 flex flex-col relative selection:bg-rose-500 selection:text-neutral-950 font-sans">
      {/* Global Scanlines Overlay */}
      {crtActive && <div className="fixed inset-0 crt-overlay z-50 pointer-events-none" />}

      {/* Header */}
      <ShooterHeader
        playerStats={stats}
        crtActive={crtActive}
        onToggleCrt={() => setCrtActive(c => !c)}
        onOpenArmory={() => setArmoryOpen(true)}
        onOpenLeaderboard={() => setLeaderboardOpen(true)}
        onOpenTasks={() => setTasksOpen(true)}
        unclaimedTasksCount={unclaimedTasksCount}
        onSelectGame={id => setActiveGame(id as ShooterGameId | null)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {activeGame ? (
          /* Active Gameplay Stage */
          <div className="w-full flex flex-col items-center">
            {/* Stage Controls */}
            <div className="w-full max-w-5xl flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveGame(null);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs sm:text-sm font-arcade text-neutral-300 hover:text-neutral-100 transition-colors shadow-md"
              >
                <ArrowLeft className="w-4 h-4 text-rose-400" />
                <span>EXIT TO HUB (30 GAMES)</span>
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setTasksOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-xs font-arcade text-cyan-300 hover:bg-cyan-900/40 transition-colors relative"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>TASKS</span>
                  {unclaimedTasksCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
                  )}
                </button>

                <button
                  onClick={() => setArmoryOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-xs font-arcade text-amber-400 hover:bg-amber-900/40 transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>SHOP & ITEMS ({stats.credits} CR)</span>
                </button>
              </div>
            </div>

            {/* Render Active Game */}
            <div className="w-full max-w-5xl">
              {/* 3D WebGL Games (With VS Computer mode, In-Game Item Shop & Tasks HUD) */}
              {activeGame === 'subway-runner' && (
                <ThreeEndlessRunner3D
                  initialTheme="subway"
                  onGameOver={handleSubwayGameOver}
                  bestScore={stats.highScores['subway-runner'] || 0}
                  baseMultiplier={stats.multiplierRank || 1}
                  activeTask={(stats.tasks || INITIAL_TASKS).find(t => !t.completed && (t.gameId === 'subway-runner' || t.gameId === 'any'))}
                  onTaskProgress={(type, amount) => updateTaskProgress(type, amount, 'subway-runner')}
                  onOpenTasksModal={() => setTasksOpen(true)}
                  playerCredits={stats.credits}
                  inventory={stats.inventory || DEFAULT_INVENTORY}
                  onOpenShopModal={() => setArmoryOpen(true)}
                  onReviveWithCredits={handleReviveRunner}
                  onConsumeHoverboard={handleConsumeHoverboard}
                  onConsumeHeadstart={handleConsumeHeadstart}
                />
              )}
              {activeGame === 'temple-run' && (
                <ThreeEndlessRunner3D
                  initialTheme="temple"
                  onGameOver={handleTempleGameOver}
                  bestScore={stats.highScores['temple-run'] || 0}
                  baseMultiplier={stats.multiplierRank || 1}
                  activeTask={(stats.tasks || INITIAL_TASKS).find(t => !t.completed && (t.gameId === 'temple-run' || t.gameId === 'any'))}
                  onTaskProgress={(type, amount) => updateTaskProgress(type, amount, 'temple-run')}
                  onOpenTasksModal={() => setTasksOpen(true)}
                  playerCredits={stats.credits}
                  inventory={stats.inventory || DEFAULT_INVENTORY}
                  onOpenShopModal={() => setArmoryOpen(true)}
                  onReviveWithCredits={handleReviveRunner}
                  onConsumeHoverboard={handleConsumeHoverboard}
                  onConsumeHeadstart={handleConsumeHeadstart}
                />
              )}
              {activeGame === 'cyber-racer-3d' && (
                <ThreeCyberRacer3D
                  onGameOver={score => handleGenericGameOver('cyber-racer-3d', score)}
                  bestScore={stats.highScores['cyber-racer-3d'] || 0}
                />
              )}
              {activeGame === 'space-flight-3d' && (
                <Starblade3D
                  onGameOver={score => handleGenericGameOver('space-flight-3d', score)}
                  bestScore={stats.highScores['space-flight-3d'] || 0}
                />
              )}

              {/* .IO Arenas (VS Computer Bots & Multiplayer Simulation) */}
              {activeGame === 'neon-io-arena' && (
                <NeonIoArena
                  onGameOver={score => handleGenericGameOver('neon-io-arena', score)}
                  bestScore={stats.highScores['neon-io-arena'] || 0}
                />
              )}
              {activeGame === 'tank-io' && (
                <TankIo
                  onGameOver={score => handleGenericGameOver('tank-io', score)}
                  bestScore={stats.highScores['tank-io'] || 0}
                />
              )}
              {activeGame === 'hole-io' && (
                <BlackHoleIo
                  onGameOver={score => handleGenericGameOver('hole-io', score)}
                  bestScore={stats.highScores['hole-io'] || 0}
                />
              )}
              {activeGame === 'knife-io' && (
                <BladeStormIo
                  onGameOver={score => handleGenericGameOver('knife-io', score)}
                  bestScore={stats.highScores['knife-io'] || 0}
                />
              )}

              {/* Action, Shooters & Combat vs Computer AI */}
              {activeGame === 'cyber-storm' && (
                <CyberStorm
                  unlockedWeapons={stats.unlockedWeapons}
                  weaponLevels={stats.weaponLevels}
                  onGameOver={handleCyberStormGameOver}
                  bestScore={stats.highScores['cyber-storm'] || 0}
                />
              )}
              {activeGame === 'vector-void' && (
                <VectorVoidGame
                  onGameOver={score => handleGenericGameOver('vector-void', score)}
                  bestScore={stats.highScores['vector-void'] || 0}
                />
              )}
              {activeGame === 'target-matrix' && (
                <TargetMatrix
                  onGameOver={(score, credits) => handleGenericGameOver('target-matrix', score, credits)}
                  bestScore={stats.highScores['target-matrix'] || 0}
                />
              )}
              {activeGame === 'archery-master' && (
                <ArcheryMaster
                  onGameOver={(score, credits) => handleGenericGameOver('archery-master', score, credits)}
                  bestScore={stats.highScores['archery-master'] || 0}
                />
              )}
              {activeGame === 'space-invaders' && (
                <SpaceInvaders
                  onGameOver={score => handleGenericGameOver('space-invaders', score)}
                  bestScore={stats.highScores['space-invaders'] || 0}
                />
              )}
              {activeGame === 'zombie-defense' && (
                <ZombieDefense
                  onGameOver={score => handleGenericGameOver('zombie-defense', score)}
                  bestScore={stats.highScores['zombie-defense'] || 0}
                />
              )}

              {/* Arcade Classics */}
              {activeGame === 'cyber-flap' && (
                <CyberFlap
                  onGameOver={score => handleGenericGameOver('cyber-flap', score)}
                  bestScore={stats.highScores['cyber-flap'] || 0}
                />
              )}
              {activeGame === 'neon-breakout' && (
                <NeonBreakout
                  onGameOver={score => handleGenericGameOver('neon-breakout', score)}
                  bestScore={stats.highScores['neon-breakout'] || 0}
                />
              )}
              {activeGame === 'retro-pac' && (
                <RetroPac
                  onGameOver={score => handleGenericGameOver('retro-pac', score)}
                  bestScore={stats.highScores['retro-pac'] || 0}
                />
              )}
              {activeGame === 'snake-retro' && (
                <RetroSnake
                  onGameOver={score => handleGenericGameOver('snake-retro', score)}
                  bestScore={stats.highScores['snake-retro'] || 0}
                />
              )}
              {activeGame === 'pong-duo' && (
                <CyberPong
                  onGameOver={score => handleGenericGameOver('pong-duo', score)}
                  bestScore={stats.highScores['pong-duo'] || 0}
                />
              )}
              {activeGame === 'dino-jump' && (
                <DinoJump
                  onGameOver={score => handleGenericGameOver('dino-jump', score)}
                  bestScore={stats.highScores['dino-jump'] || 0}
                />
              )}

              {/* Puzzle & Strategy */}
              {activeGame === 'neon-2048' && (
                <Neon2048
                  onGameOver={score => handleGenericGameOver('neon-2048', score)}
                  bestScore={stats.highScores['neon-2048'] || 0}
                />
              )}
              {activeGame === 'minesweeper' && (
                <MinesweeperNeon
                  onGameOver={score => handleGenericGameOver('minesweeper', score)}
                  bestScore={stats.highScores['minesweeper'] || 0}
                />
              )}
              {activeGame === 'sudoku-neon' && (
                <SudokuNeonGame
                  onGameOver={score => handleGenericGameOver('sudoku-neon', score)}
                  bestScore={stats.highScores['sudoku-neon'] || 0}
                />
              )}
              {activeGame === 'block-puzzle' && (
                <BlockPuzzleGame
                  onGameOver={score => handleGenericGameOver('block-puzzle', score)}
                  bestScore={stats.highScores['block-puzzle'] || 0}
                />
              )}
              {activeGame === 'memory-match' && (
                <MemoryMatchGame
                  onGameOver={score => handleGenericGameOver('memory-match', score)}
                  bestScore={stats.highScores['memory-match'] || 0}
                />
              )}
              {activeGame === 'color-connect' && (
                <ColorConnectGame
                  onGameOver={score => handleGenericGameOver('color-connect', score)}
                  bestScore={stats.highScores['color-connect'] || 0}
                />
              )}

              {/* Sports & Casual */}
              {activeGame === 'hoop-shot' && (
                <HoopShotGame
                  onGameOver={score => handleGenericGameOver('hoop-shot', score)}
                  bestScore={stats.highScores['hoop-shot'] || 0}
                />
              )}
              {activeGame === 'knife-hit' && (
                <KnifeHitGame
                  onGameOver={score => handleGenericGameOver('knife-hit', score)}
                  bestScore={stats.highScores['knife-hit'] || 0}
                />
              )}
              {activeGame === 'cookie-clicker' && (
                <CookieClickerNeon
                  onGameOver={score => handleGenericGameOver('cookie-clicker', score)}
                  bestScore={stats.highScores['cookie-clicker'] || 0}
                />
              )}
              {activeGame === 'rope-swing' && (
                <RopeSwingGame
                  onGameOver={score => handleGenericGameOver('rope-swing', score)}
                  bestScore={stats.highScores['rope-swing'] || 0}
                />
              )}
            </div>
          </div>
        ) : (
          /* Populated 30-Games Arcade Hub */
          <div className="space-y-10">
            {/* Top Tasks & Competition with Computer Alert Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-cyan-950/40 via-neutral-900 to-purple-950/40 border border-neutral-800 p-3.5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-arcade font-bold text-white flex items-center gap-2">
                    <span>DAILY MISSIONS & TASKS ACTIVE</span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      MULTIPLIER RANK {stats.multiplierRank || 1}x
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono">
                    Complete Subway & Temple missions to permanently boost score multiplier & claim credits!
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTasksOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-arcade font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-neutral-950" />
                  <span>VIEW TASKS ({unclaimedTasksCount > 0 ? `${unclaimedTasksCount} READY` : 'QUESTS'})</span>
                </button>
              </div>
            </div>

            {/* Hero Showcase: Subway Surfers & Temple Run 3D + Competition with Computer */}
            <div className="relative w-full rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 sm:p-8 md:p-10 overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider">
                    <span className="text-cyan-400 flex items-center gap-1.5">
                      <Box className="w-4 h-4" />
                      3D WEBGL ENGINE
                    </span>
                    <span className="text-neutral-600">·</span>
                    <span className="text-rose-400 flex items-center gap-1.5">
                      <Bot className="w-4 h-4" />
                      COMPETITION WITH COMPUTER (1v1 BOT RIVAL)
                    </span>
                  </div>

                  <h1 className="font-arcade text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-100">
                    SUBWAY SURFERS & TEMPLE RUN 3D
                  </h1>

                  <p className="text-neutral-300 text-sm sm:text-base leading-relaxed max-w-xl">
                    Experience hardware-accelerated 3D racing with full missions, tasks, and <strong>1v1 Competition with Computer Bot Rivals</strong>! Sprint down subway tracks or temple ruins alongside an AI rival runner in head-to-head race battles.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setActiveGame('subway-runner');
                      }}
                      className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-arcade font-bold tracking-wider text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 transform hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <Train className="w-4 h-4 text-neutral-950" />
                      SUBWAY 3D (VS BOT)
                    </button>

                    <button
                      onClick={() => {
                        sound.playClick();
                        setActiveGame('temple-run');
                      }}
                      className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-arcade font-bold tracking-wider text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 transform hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <Footprints className="w-4 h-4 text-neutral-950" />
                      TEMPLE 3D (VS BOT)
                    </button>

                    <button
                      onClick={() => {
                        sound.playClick();
                        setHubCategory('action');
                      }}
                      className="px-4 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-rose-400 font-arcade font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Crosshair className="w-4 h-4" />
                      <span>SHOOTING GAMES (6)</span>
                    </button>
                  </div>
                </div>

                {/* Right Interactive Preview Cards */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                  <div
                    onClick={() => {
                      sound.playClick();
                      setActiveGame('subway-runner');
                    }}
                    className="aspect-square rounded-2xl border border-cyan-500/40 bg-neutral-950/80 p-4 flex flex-col justify-between group cursor-pointer shadow-xl hover:border-cyan-400 hover:scale-[1.02] transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Train className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">VS COMPUTER BOT</span>
                      <h4 className="font-arcade text-sm font-bold text-neutral-100 group-hover:text-cyan-400">SUBWAY SURF 3D</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Tasks, 1v1 Bot Race & Trains</p>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      sound.playClick();
                      setActiveGame('cyber-storm');
                    }}
                    className="aspect-square rounded-2xl border border-rose-500/40 bg-neutral-950/80 p-4 flex flex-col justify-between group cursor-pointer shadow-xl hover:border-rose-400 hover:scale-[1.02] transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Crosshair className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold">SHOOTING ARENA</span>
                      <h4 className="font-arcade text-sm font-bold text-neutral-100 group-hover:text-rose-400">CYBER STORM</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Weapons, Bosses & Drone Waves</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Tasks & Mission Control Dashboard Widget */}
            {(() => {
              const currentTasks = stats.tasks || INITIAL_TASKS;
              const activeList = currentTasks.filter(t => !t.claimed).slice(0, 3);
              const completedUnclaimed = currentTasks.filter(t => t.completed && !t.claimed).length;

              return (
                <div className="bg-gradient-to-r from-cyan-950/40 via-neutral-900/80 to-purple-950/40 border border-neutral-800/80 rounded-2xl p-5 shadow-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                        <CheckSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-arcade text-sm sm:text-base font-bold text-neutral-100">
                            DAILY TASKS & MISSION REWARDS
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {stats.multiplierRank || 1}x MULTIPLIER
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400">
                          Complete tasks across Subway Surfers 3D, shooters, and arenas to permanently level up multipliers!
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {completedUnclaimed > 0 && (
                        <button
                          onClick={() => {
                            sound.playReward();
                            handleClaimAll();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-arcade text-xs font-bold transition-all shadow-lg shadow-amber-500/20 animate-pulse flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 fill-current" />
                          <span>CLAIM ALL ({completedUnclaimed})</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          sound.playClick();
                          setTasksOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-arcade font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <span>VIEW ALL TASKS</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 3 Active Tasks Preview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {activeList.map(task => {
                      const pct = Math.min(100, Math.round((task.current / task.target) * 100));

                      return (
                        <div
                          key={task.id}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                            task.completed
                              ? 'bg-amber-950/30 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                              : 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="font-arcade text-xs font-bold text-neutral-200 line-clamp-1">
                                {task.title}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0">
                                +{task.rewardCredits} CR
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 line-clamp-2 mb-3">
                              {task.description}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                              <span>Progress</span>
                              <span className={task.completed ? 'text-emerald-400 font-bold' : 'text-neutral-300'}>
                                {task.current} / {task.target} ({pct}%)
                              </span>
                            </div>

                            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  task.completed ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-cyan-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {task.completed ? (
                              <button
                                onClick={() => {
                                  sound.playReward();
                                  handleClaimTask(task.id);
                                }}
                                className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-arcade text-[11px] font-bold transition-all shadow flex items-center justify-center gap-1"
                              >
                                <Sparkles className="w-3 h-3 fill-current" />
                                <span>CLAIM REWARD</span>
                              </button>
                            ) : task.gameId && task.gameId !== 'any' ? (
                              <button
                                onClick={() => {
                                  sound.playClick();
                                  setActiveGame(task.gameId as ShooterGameId);
                                }}
                                className="w-full py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-arcade text-[10px] transition-colors flex items-center justify-center gap-1"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                <span>PLAY FOR TASK</span>
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Filter Navigation & Search Bar */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
                  <button
                    onClick={() => setHubCategory('all')}
                    className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                      hubCategory === 'all'
                        ? 'bg-neutral-100 text-neutral-950 font-bold shadow'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    All Games ({GAMES_CATALOG.length})
                  </button>

                  {/* Dedicated Shooting Games Filter */}
                  <button
                    onClick={() => setHubCategory('shooting')}
                    className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      hubCategory === 'shooting'
                        ? 'bg-rose-500 text-white font-bold shadow'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    Shooting Games (8)
                  </button>

                  {/* Dedicated VS Computer AI Filter */}
                  <button
                    onClick={() => setHubCategory('vs-computer')}
                    className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      hubCategory === 'vs-computer'
                        ? 'bg-purple-600 text-white font-bold shadow'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    VS Computer AI (15)
                  </button>

                  <button
                    onClick={() => setHubCategory('3d')}
                    className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      hubCategory === '3d'
                        ? 'bg-cyan-500 text-neutral-950 font-bold shadow'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    3D WebGL (4)
                  </button>
                  <button
                    onClick={() => setHubCategory('io')}
                    className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      hubCategory === 'io'
                        ? 'bg-emerald-500 text-neutral-950 font-bold shadow'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    .IO Arenas (4)
                  </button>
                  <button
                    onClick={() => setHubCategory('arcade')}
                    className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      hubCategory === 'arcade'
                        ? 'bg-amber-500 text-neutral-950 font-bold shadow'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Arcade Classics (6)
                  </button>
                  <button
                    onClick={() => setHubCategory('puzzle')}
                    className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      hubCategory === 'puzzle'
                        ? 'bg-purple-500 text-white font-bold shadow'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    Puzzle & Brain (6)
                  </button>
                  <button
                    onClick={() => setHubCategory('sports')}
                    className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      hubCategory === 'sports'
                        ? 'bg-blue-500 text-white font-bold shadow'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    Sports & Skill (4)
                  </button>
                </div>

                {/* Instant Search Bar */}
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search 30 games..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Complete 30-Game Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGames.map(game => {
                const best = stats.highScores[game.id] || 0;
                const isUpdated = game.id === 'subway-runner' || game.id === 'temple-run';
                const hasVsComputer = !!game.vsComputer;
                const isShooting = !!game.isShooting;

                return (
                  <div
                    key={game.id}
                    onClick={() => {
                      sound.playClick();
                      setActiveGame(game.id);
                    }}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer group shadow-xl hover:-translate-y-1 duration-200 flex flex-col justify-between ${
                      isUpdated
                        ? 'border-cyan-500/50 bg-neutral-900/80 hover:border-cyan-400 hover:shadow-cyan-500/20'
                        : isShooting
                        ? 'border-rose-500/30 bg-neutral-900/70 hover:border-rose-400'
                        : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                            game.accent === 'cyan' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' :
                            game.accent === 'amber' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            game.accent === 'rose' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                            game.accent === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                            game.accent === 'purple' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {game.category === '3d' ? <Box className="w-6 h-6" /> :
                           game.category === 'io' ? <Radio className="w-6 h-6" /> :
                           isShooting ? <Crosshair className="w-6 h-6" /> :
                           game.category === 'puzzle' ? <Grid className="w-6 h-6" /> :
                           game.category === 'sports' ? <Target className="w-6 h-6" /> :
                           <Sparkles className="w-6 h-6" />}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {isShooting && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/80 flex items-center gap-1">
                              <Crosshair className="w-2.5 h-2.5" />
                              SHOOTER
                            </span>
                          )}
                          {hasVsComputer && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/80 flex items-center gap-1">
                              <Bot className="w-2.5 h-2.5" />
                              VS BOT
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                              isUpdated
                                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.4)] animate-pulse'
                                : 'bg-neutral-950/60 text-neutral-400 border-neutral-800'
                            }`}
                          >
                            {game.badge}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-arcade text-lg font-bold text-neutral-100 group-hover:text-white transition-colors">
                        {game.title}
                      </h3>

                      <p className="text-xs text-neutral-400 mt-2 leading-relaxed line-clamp-2">
                        {game.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Best: <strong className="text-white">{best}</strong></span>
                      </div>

                      <button className="px-3 py-1.5 rounded-lg bg-neutral-800 group-hover:bg-neutral-100 group-hover:text-neutral-950 text-neutral-300 font-arcade text-xs font-bold transition-all flex items-center gap-1">
                        <Play className="w-3 h-3 fill-current" />
                        <span>PLAY</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <ArmoryModal
        isOpen={armoryOpen}
        onClose={() => setArmoryOpen(false)}
        playerStats={stats}
        onUnlockWeapon={handleUnlockWeapon}
        onUpgradeWeapon={handleUpgradeWeapon}
        onBuyItem={handleBuyItem}
        onUpgradeBooster={handleUpgradeBooster}
      />

      <ShooterLeaderboard
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        highScores={stats.highScores}
      />

      <TasksModal
        isOpen={tasksOpen}
        onClose={() => setTasksOpen(false)}
        tasks={stats.tasks || INITIAL_TASKS}
        multiplierRank={stats.multiplierRank || 1}
        onClaimTask={handleClaimTask}
        onClaimAll={handleClaimAll}
        onPlayGame={gameId => {
          setActiveGame(gameId);
          setTasksOpen(false);
        }}
      />
    </div>
  );
}
