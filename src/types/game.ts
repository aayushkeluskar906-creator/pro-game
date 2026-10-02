export type ShooterGameId = 
  // 3D WebGL Games (4)
  | 'subway-runner' 
  | 'temple-run'
  | 'cyber-racer-3d'
  | 'space-flight-3d'
  // .IO & Arena Games (4)
  | 'neon-io-arena'
  | 'tank-io'
  | 'hole-io'
  | 'knife-io'
  // Action, Shooter & Combat (5)
  | 'cyber-storm' 
  | 'vector-void' 
  | 'target-matrix' 
  | 'archery-master' 
  | 'space-invaders'
  | 'zombie-defense'
  // Classic Arcade & Quick Play (6)
  | 'cyber-flap'
  | 'neon-breakout'
  | 'retro-pac'
  | 'snake-retro'
  | 'pong-duo'
  | 'dino-jump'
  // Puzzle & Strategy (6)
  | 'neon-2048'
  | 'minesweeper'
  | 'sudoku-neon'
  | 'block-puzzle'
  | 'memory-match'
  | 'color-connect'
  // Sports, Physics & Casual (5)
  | 'neon-pong-table'
  | 'hoop-shot'
  | 'knife-hit'
  | 'cookie-clicker'
  | 'rope-swing';

export type GameCategory = 'all' | 'shooting' | 'vs-computer' | '3d' | 'io' | 'action' | 'arcade' | 'puzzle' | 'sports';

export interface GameInfo {
  id: ShooterGameId;
  title: string;
  category: '3d' | 'io' | 'action' | 'arcade' | 'puzzle' | 'sports';
  isShooting?: boolean;
  vsComputer?: boolean;
  description: string;
  badge: string;
  accentColor: string;
  icon: string;
}

export type RunnerTheme = 'subway' | 'temple';

export type Lane = -1 | 0 | 1;

export interface RunnerObstacle {
  id: number;
  z: number; // distance ahead on track (e.g. 50 to 1200)
  lane: Lane;
  type: 'train' | 'barrier_low' | 'barrier_high' | 'temple_statue' | 'fire_trap';
  width: number;
  height: number;
  length?: number;
}

export interface RunnerCoin {
  id: number;
  z: number;
  lane: Lane;
  yOffset: number; // 0 for ground, 30 for on top of train or high jump
  collected: boolean;
}

export interface RunnerPowerup {
  id: number;
  z: number;
  lane: Lane;
  type: 'magnet' | 'hoverboard' | 'multiplier' | 'sneakers';
  collected: boolean;
}

export type ArrowType = 'standard' | 'fire' | 'triple' | 'bomb';

export interface Arrow {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  length: number;
  type: ArrowType;
  inFlight: boolean;
  stuckInTarget?: boolean;
  stuckOffset?: { x: number; y: number };
  scoreAwarded?: number;
}

export interface Weapon {
  id: string;
  name: string;
  type: 'rifle' | 'shotgun' | 'railgun' | 'rocket' | 'cryo';
  damage: number;
  fireRate: number; // ms between shots
  spread: number;
  bulletsPerShot: number;
  speed: number;
  color: string;
  unlocked: boolean;
  cost: number;
  level: number;
  description: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'runner' | 'mastery';
  gameId?: ShooterGameId | 'any';
  target: number;
  current: number;
  rewardCredits: number;
  rewardMultiplier?: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
}

export interface PlayerInventory {
  hoverboards: number;
  headstarts: number;
  mysteryBoxes: number;
  resurrectWings: number;
  magnetLevel: number;
  sneakersLevel: number;
  jetpackLevel: number;
  multiplierLevel: number;
  repairKits: number;
  shieldBoosters: number;
  sentryTurrets: number;
}

export interface PlayerShooterStats {
  credits: number;
  totalKills: number;
  bossesDefeated: number;
  highScores: Record<ShooterGameId, number>;
  unlockedWeapons: string[];
  weaponLevels: Record<string, number>;
  perks: {
    maxHealthLevel: number;
    speedLevel: number;
    shieldRegenLevel: number;
  };
  inventory?: PlayerInventory;
  tasks?: TaskItem[];
  multiplierRank?: number;
  totalCoinsCollected?: number;
  totalDistanceRun?: number;
  totalHoverboardsUsed?: number;
}

export interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  type: 'swarmer' | 'shooter' | 'tank' | 'teleporter' | 'boss';
  color: string;
  lastShot?: number;
  shootInterval?: number;
  teleportTimer?: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isEnemy?: boolean;
  color: string;
  pierce?: number;
  isExplosive?: boolean;
  isCryo?: boolean;
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  life: number;
  maxLife: number;
}

export interface PowerUp {
  x: number;
  y: number;
  type: 'health' | 'shield' | 'nuke' | 'rapid' | 'credits';
  color: string;
  radius: number;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}
