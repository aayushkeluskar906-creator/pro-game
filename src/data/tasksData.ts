import { TaskItem } from '../types/game';

export const INITIAL_TASKS: TaskItem[] = [
  // 1. Daily Quests (Reset / Refreshable)
  {
    id: 'daily-subway-500',
    title: 'Subway Sprinter',
    description: 'Sprint 500 meters in Subway Surfers 3D in a single run',
    category: 'daily',
    gameId: 'subway-runner',
    target: 500,
    current: 0,
    rewardCredits: 120,
    completed: false,
    claimed: false,
    icon: 'train'
  },
  {
    id: 'daily-coins-50',
    title: 'Gold Collector',
    description: 'Collect 50 gold coins across any game',
    category: 'daily',
    gameId: 'any',
    target: 50,
    current: 0,
    rewardCredits: 100,
    completed: false,
    claimed: false,
    icon: 'coins'
  },
  {
    id: 'daily-hoverboard-2',
    title: 'Hoverboard Ace',
    description: 'Deploy hoverboards 2 times during runs',
    category: 'daily',
    gameId: 'subway-runner',
    target: 2,
    current: 0,
    rewardCredits: 150,
    completed: false,
    claimed: false,
    icon: 'shield'
  },
  {
    id: 'daily-temple-run-400',
    title: 'Ruins Explorer',
    description: 'Survive 400 meters in Temple Run 3D escaping the demon ape',
    category: 'daily',
    gameId: 'temple-run',
    target: 400,
    current: 0,
    rewardCredits: 120,
    completed: false,
    claimed: false,
    icon: 'flame'
  },
  {
    id: 'daily-play-3',
    title: 'Arcade Hopper',
    description: 'Play at least 3 different games in the hub today',
    category: 'daily',
    gameId: 'any',
    target: 3,
    current: 0,
    rewardCredits: 180,
    completed: false,
    claimed: false,
    icon: 'gamepad'
  },

  // 2. Runner Multiplier Mission Sets (Increases permanent score multiplier 1x -> 2x -> 3x!)
  {
    id: 'mission-set-1-jump',
    title: 'Mission Set 1: High Leaper',
    description: 'Jump 15 times over roadblocks or train cars',
    category: 'runner',
    gameId: 'subway-runner',
    target: 15,
    current: 0,
    rewardCredits: 150,
    rewardMultiplier: 1,
    completed: false,
    claimed: false,
    icon: 'arrow-up'
  },
  {
    id: 'mission-set-1-slide',
    title: 'Mission Set 1: Ground Roll',
    description: 'Roll under high barriers or jungle roots 8 times',
    category: 'runner',
    gameId: 'subway-runner',
    target: 8,
    current: 0,
    rewardCredits: 150,
    rewardMultiplier: 1,
    completed: false,
    claimed: false,
    icon: 'arrow-down'
  },
  {
    id: 'mission-set-2-coins',
    title: 'Mission Set 2: Coin Craze',
    description: 'Collect 120 coins with Coin Magnet active',
    category: 'runner',
    gameId: 'any',
    target: 120,
    current: 0,
    rewardCredits: 200,
    rewardMultiplier: 1,
    completed: false,
    claimed: false,
    icon: 'zap'
  },
  {
    id: 'mission-set-2-distance',
    title: 'Mission Set 2: Ultra Marathon',
    description: 'Accumulate 2,500 total meters run on 3D tracks',
    category: 'runner',
    gameId: 'any',
    target: 2500,
    current: 0,
    rewardCredits: 250,
    rewardMultiplier: 1,
    completed: false,
    claimed: false,
    icon: 'trophy'
  },

  // 3. Platform Mastery Achievements
  {
    id: 'mastery-subway-1500',
    title: 'Subway Champion',
    description: 'Achieve a record score of 1,500m in Subway Surfers 3D',
    category: 'mastery',
    gameId: 'subway-runner',
    target: 1500,
    current: 0,
    rewardCredits: 500,
    completed: false,
    claimed: false,
    icon: 'crown'
  },
  {
    id: 'mastery-temple-1500',
    title: 'Demon Tamer',
    description: 'Achieve a record distance of 1,500m in Temple Run 3D',
    category: 'mastery',
    gameId: 'temple-run',
    target: 1500,
    current: 0,
    rewardCredits: 500,
    completed: false,
    claimed: false,
    icon: 'sparkles'
  },
  {
    id: 'mastery-total-coins-500',
    title: 'Cyber Tycoon',
    description: 'Gather a lifetime total of 500 gold coins',
    category: 'mastery',
    gameId: 'any',
    target: 500,
    current: 0,
    rewardCredits: 600,
    completed: false,
    claimed: false,
    icon: 'star'
  },
  {
    id: 'mastery-kills-50',
    title: 'Eliminator Elite',
    description: 'Eliminate 50 enemy drones in Cyber Storm or Target Matrix',
    category: 'mastery',
    gameId: 'cyber-storm',
    target: 50,
    current: 0,
    rewardCredits: 400,
    completed: false,
    claimed: false,
    icon: 'crosshair'
  }
];
