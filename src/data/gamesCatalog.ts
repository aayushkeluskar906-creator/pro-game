import { ShooterGameId, GameCategory } from '../types/game';

export interface CatalogGame {
  id: ShooterGameId;
  title: string;
  category: '3d' | 'io' | 'action' | 'arcade' | 'puzzle' | 'sports';
  isShooting?: boolean;
  vsComputer?: boolean;
  description: string;
  badge: string;
  accent: 'cyan' | 'rose' | 'amber' | 'emerald' | 'purple' | 'blue' | 'teal';
  tags: string[];
}

export const GAMES_CATALOG: CatalogGame[] = [
  // 1-4: 3D WebGL Games
  {
    id: 'subway-runner',
    title: 'Subway Surfers 3D',
    category: '3d',
    vsComputer: true,
    description: 'Hardware-accelerated 3D city rail runner with trains, hoverboards, super sneakers, jetpacks, inspector chaser, selectable runners & 1v1 VS Computer Rival race mode!',
    badge: '3D WEBGL UPDATE',
    accent: 'cyan',
    tags: ['3D WebGL', 'Subway Surfers', 'Hoverboard', 'Endless Runner', 'VS Computer']
  },
  {
    id: 'temple-run',
    title: 'Temple Run 3D',
    category: '3d',
    vsComputer: true,
    description: 'Escape ancient Mayan ruins with rolling boulders, flame traps, jumping over chasms, and fleeing the giant demon ape with 1v1 computer rival mode!',
    badge: '3D WEBGL UPDATE',
    accent: 'amber',
    tags: ['3D WebGL', 'Temple Run', 'Demon Ape', 'Boulders & Traps', 'VS Computer']
  },
  {
    id: 'cyber-racer-3d',
    title: 'Cyber Racer 3D',
    category: '3d',
    vsComputer: true,
    description: 'High-speed synthwave 3D highway racer. Weave through traffic, engage nitro boost, and race against Computer AI rival speedsters.',
    badge: '3D WEBGL',
    accent: 'rose',
    tags: ['3D WebGL', 'Racing', 'Nitro Boost', 'Synthwave', 'VS Computer']
  },
  {
    id: 'space-flight-3d',
    title: 'Starblade 3D Starfighter',
    category: '3d',
    isShooting: true,
    vsComputer: true,
    description: 'Full 3D space cockpit dogfight simulator. Lock on with photon cannons and homing torpedoes to eliminate Computer AI pirate dreadnoughts.',
    badge: '3D SHOOTER',
    accent: 'purple',
    tags: ['3D WebGL', 'Space Flight', 'Cockpit Dogfight', 'Shooter', 'Sci-Fi', 'VS Computer']
  },

  // 5-8: .IO Multiplayer Arenas (VS Computer AI Bots)
  {
    id: 'neon-io-arena',
    title: 'NeonSlither.io Arena',
    category: 'io',
    vsComputer: true,
    description: 'Real-time 16-player snake battle arena. Consume mass orbs, outmaneuver 15 Computer AI rival snakes, and climb the live leaderboard!',
    badge: '.IO ARENA',
    accent: 'emerald',
    tags: ['.IO Multiplayer', 'Slither.io', 'Leaderboard', 'Mass Grow', 'VS Computer']
  },
  {
    id: 'hole-io',
    title: 'Black Hole.io City',
    category: 'io',
    vsComputer: true,
    description: 'Devour cones, vehicles, and entire skyscrapers in a 60-second city conquest against 7 Computer AI black hole contenders.',
    badge: '.IO ARENA',
    accent: 'purple',
    tags: ['.IO Arena', 'Black Hole', 'City Eater', 'Timed', 'VS Computer']
  },
  {
    id: 'knife-io',
    title: 'BladeStorm.io Battle',
    category: 'io',
    isShooting: true,
    vsComputer: true,
    description: 'Spinning orbit blade combat. Expand your razor blade shield, launch projectile daggers at enemy Computer AI players, and become the last gladiator standing.',
    badge: '.IO ARENA',
    accent: 'cyan',
    tags: ['.IO Arena', 'Blade Orbit', 'Spin Combat', 'Survival', 'Shooter', 'VS Computer']
  },
  {
    id: 'tank-io',
    title: 'Neon Tank.io Blitz',
    category: 'io',
    isShooting: true,
    vsComputer: true,
    description: 'Top-down multi-turret armored tank shooter. Upgrade twin cannons, blast geometric pentagons, and destroy Computer AI tank commanders.',
    badge: 'TANK SHOOTER',
    accent: 'blue',
    tags: ['.IO Arena', 'Diep.io', 'Tank War', 'Shooter', 'Turret Upgrades', 'VS Computer']
  },

  // 9-14: Action, Shooters & Combat
  {
    id: 'cyber-storm',
    title: 'Cyber Storm Arena',
    category: 'action',
    isShooting: true,
    vsComputer: true,
    description: 'Top-down dual-stick shooter with upgradable plasma rifles, spread shotguns, high-velocity railguns, and colossal Computer AI boss fights.',
    badge: 'TOP SHOOTER',
    accent: 'rose',
    tags: ['Shooter', 'Boss Fights', 'Armory', 'Perks', 'Action', 'VS Computer']
  },
  {
    id: 'space-invaders',
    title: 'Space Invaders Neon',
    category: 'action',
    isShooting: true,
    vsComputer: true,
    description: 'Modernized arcade space defense. Blast descending Computer AI alien fleets, utilize bunker shields, and hunt the cyber mothership.',
    badge: 'SPACE SHOOTER',
    accent: 'purple',
    tags: ['Space Defense', 'Shooter', 'Alien Waves', 'Retro Arcade', 'Laser Cannon', 'VS Computer']
  },
  {
    id: 'zombie-defense',
    title: 'Zombie Outbreak Bunker',
    category: 'action',
    isShooting: true,
    vsComputer: true,
    description: 'Barricade defense against endless undead hordes. Shoot automatic assault rifles, deploy automated sentry guns, call tactical airstrikes, and survive the night.',
    badge: 'ZOMBIE SHOOTER',
    accent: 'rose',
    tags: ['Zombie Defense', 'Shooter', 'Turrets', 'Barricades', 'Waves', 'VS Computer']
  },
  {
    id: 'target-matrix',
    title: 'Target Matrix Precision',
    category: 'action',
    isShooting: true,
    vsComputer: true,
    description: 'Fast-paced cyber reflex aim trainer and shooting range with priority targets, time pressure, headshot multipliers, and duel against Computer AI marksman.',
    badge: 'AIM TRAINER',
    accent: 'amber',
    tags: ['Aim Trainer', 'Shooter', 'Reflex', 'Matrix', 'Precision', 'VS Computer']
  },
  {
    id: 'archery-master',
    title: 'Archery Master 2D',
    category: 'action',
    isShooting: true,
    vsComputer: true,
    description: 'Precision projectile archery physics with trajectory guides, wind resistance, bullseye streaks, moving targets, and competition against Computer AI archer.',
    badge: 'PHYSICS SHOOTER',
    accent: 'emerald',
    tags: ['Archery', 'Shooter', 'Physics Arc', 'Bullseye', 'Bow & Arrow', 'VS Computer']
  },
  {
    id: 'vector-void',
    title: 'Vector Void Hyperspace',
    category: 'action',
    description: 'Supersonic vector tunnel flight. Navigate rotating geometric gate obstacles at breakneck speeds with hypersonic reflex dodges.',
    badge: 'HIGH SPEED',
    accent: 'cyan',
    tags: ['Tunnel Runner', 'Vector Graphics', 'Hyperspeed', 'Dodger']
  },

  // 15-20: Arcade & Quick Play
  {
    id: 'pong-duo',
    title: 'Cyber Pong Duo',
    category: 'arcade',
    vsComputer: true,
    description: '1v1 Duel against Computer AI with selectable difficulty (Rookie, Pro, Cyber Master) and 2-Player mode with ball spin physics and speed rallies.',
    badge: 'VS COMPUTER 1V1',
    accent: 'blue',
    tags: ['Pong', 'Table Tennis', 'VS Computer', 'AI Match', 'Fast Rally']
  },
  {
    id: 'cyber-flap',
    title: 'Cyber Flap Synth',
    category: 'arcade',
    description: 'Flappy neon drone navigation through pulsating electric laser gates with synth beats and high score progression.',
    badge: 'ARCADE',
    accent: 'amber',
    tags: ['Flappy', 'Laser Gates', 'Timing', 'Addictive']
  },
  {
    id: 'neon-breakout',
    title: 'Neon Brick Breakout',
    category: 'arcade',
    description: 'Classic brick breaker with laser multi-balls, explosive bricks, paddle stretch power-ups, and neon sparks.',
    badge: 'ARCADE',
    accent: 'cyan',
    tags: ['Breakout', 'Bricks', 'Multi-ball', 'Laser Powerups']
  },
  {
    id: 'retro-pac',
    title: 'Cyber Pac Maze',
    category: 'arcade',
    vsComputer: true,
    description: 'Chomp cyber dots, grab power pellets, and outsmart 4 patrolling Computer AI ghost algorithms in a neon labyrinth.',
    badge: 'VS AI GHOSTS',
    accent: 'amber',
    tags: ['Pac Maze', 'Ghosts', 'Pellets', 'Retro', 'VS Computer']
  },
  {
    id: 'snake-retro',
    title: 'Retro Neon Snake',
    category: 'arcade',
    description: 'Classic arcade snake with glowing apple collectibles, speed scaling, and high score pursuit.',
    badge: 'RETRO',
    accent: 'emerald',
    tags: ['Snake', 'Arcade', 'Grid', 'Classic']
  },
  {
    id: 'dino-jump',
    title: 'Neon Dino Runner',
    category: 'arcade',
    description: 'Endless desert chrome runner with jumping over cacti, dodging pterodactyls, and night mode shifts.',
    badge: 'RUNNER',
    accent: 'teal',
    tags: ['Dino', 'Jump', 'Endless', 'Cactus Dodger']
  },

  // 21-26: Puzzle & Strategy
  {
    id: 'neon-2048',
    title: 'Neon 2048 Matrix',
    category: 'puzzle',
    description: 'Slide and merge cyber tiles to achieve the coveted 2048 block with smooth physics and neon glows.',
    badge: 'PUZZLE',
    accent: 'amber',
    tags: ['2048', 'Tile Sliding', 'Numbers', 'Brain Teaser']
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper Tactical',
    category: 'puzzle',
    description: 'Defuse plasma minefields on a tactical 9x9 cyber grid using logic deduction and warning flags.',
    badge: 'LOGIC',
    accent: 'rose',
    tags: ['Minesweeper', 'Logic Deduction', 'Flagging', 'Tactical']
  },
  {
    id: 'sudoku-neon',
    title: 'Sudoku Neon Cyber',
    category: 'puzzle',
    description: '9x9 brain training puzzle with note assists, error detection, and progressive difficulty.',
    badge: 'BRAIN',
    accent: 'cyan',
    tags: ['Sudoku', 'Numbers', 'Logic', '9x9 Grid']
  },
  {
    id: 'block-puzzle',
    title: 'Neon Jewel Block 8x8',
    category: 'puzzle',
    description: 'Place polyomino gem blocks into an 8x8 grid. Clear rows and columns with laser cascade clears!',
    badge: 'PUZZLE',
    accent: 'purple',
    tags: ['Block Puzzle', 'Jewel 8x8', 'Polyomino', 'Line Clear']
  },
  {
    id: 'memory-match',
    title: 'Memory Match Matrix',
    category: 'puzzle',
    description: 'Test memory recall by flipping and matching 16 neon cyber icon cards against the clock.',
    badge: 'MEMORY',
    accent: 'emerald',
    tags: ['Memory Match', 'Card Flip', 'Pairs', 'Brain Trainer']
  },
  {
    id: 'color-connect',
    title: 'Color Connect Flow',
    category: 'puzzle',
    description: 'Draw glowing circuit pipelines connecting matching color terminals without intersecting lines.',
    badge: 'FLOW',
    accent: 'blue',
    tags: ['Color Flow', 'Pipe Connect', 'Logic', 'Circuits']
  },

  // 27-31: Sports, Skill & Casual
  {
    id: 'hoop-shot',
    title: 'Hoop Shot Basketball',
    category: 'sports',
    description: 'Physics basketball shooting with arc guide trajectory, swish streaks, combos, and moving hoops.',
    badge: 'PHYSICS',
    accent: 'amber',
    tags: ['Basketball', 'Hoop Shot', 'Physics Arc', 'Swish Streak']
  },
  {
    id: 'knife-hit',
    title: 'Knife Hit Master',
    category: 'sports',
    isShooting: true,
    description: 'Throw and shoot blades into the spinning cyber wheel without hitting existing embedded daggers. Defeat bosses!',
    badge: 'BLADE SHOOTER',
    accent: 'cyan',
    tags: ['Knife Hit', 'Spinning Wheel', 'Blade Throw', 'Shooter', 'Boss Stages']
  },
  {
    id: 'cookie-clicker',
    title: 'Cyber Reactor Clicker',
    category: 'sports',
    description: 'Tap the reactor core to harvest joules. Purchase nanobots, fusion diodes, and trigger 3X Overdrive!',
    badge: 'IDLE/CLICKER',
    accent: 'amber',
    tags: ['Clicker', 'Idle Tycoon', 'Energy Core', 'Upgrades']
  },
  {
    id: 'rope-swing',
    title: 'Rope Swing Acrobat',
    category: 'sports',
    description: 'Pendulum ragdoll swing physics. Grapple overhead anchors to swing across the bottomless laser abyss.',
    badge: 'PHYSICS',
    accent: 'rose',
    tags: ['Rope Swing', 'Ragdoll Hook', 'Pendulum Physics', 'Endless']
  }
];
