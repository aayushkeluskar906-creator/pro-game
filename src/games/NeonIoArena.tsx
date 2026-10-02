import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Zap,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  Swords,
  Maximize2,
  Flame,
  Radio,
  User,
  Palette
} from 'lucide-react';

interface NeonIoArenaProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

interface SnakeSegment {
  x: number;
  y: number;
}

interface SnakePlayer {
  id: string;
  name: string;
  isBot: boolean;
  color: string;
  secondaryColor: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  targetAngle: number;
  speed: number;
  baseSpeed: number;
  boostSpeed: number;
  isBoosting: boolean;
  length: number;
  score: number;
  body: SnakeSegment[];
  kills: number;
  dead: boolean;
}

interface FoodPellet {
  x: number;
  y: number;
  radius: number;
  color: string;
  value: number;
}

interface KillEvent {
  killer: string;
  victim: string;
  id: number;
  time: number;
}

const SKINS = [
  { id: 'cyan', name: 'Cyber Neon', primary: '#06b6d4', secondary: '#0891b2' },
  { id: 'rose', name: 'Crimson Fury', primary: '#f43f5e', secondary: '#be123c' },
  { id: 'gold', name: 'Solar Apex', primary: '#f59e0b', secondary: '#b45309' },
  { id: 'emerald', name: 'Toxic Venom', primary: '#10b981', secondary: '#047857' },
  { id: 'violet', name: 'Void Phantom', primary: '#8b5cf6', secondary: '#6d28d9' }
];

const BOT_NAMES = [
  'ShadowNinja', 'GhostRider', 'CyberWolf', 'NeonQueen', 'ApexPredator',
  'Vortex', 'PixelKing', 'BlazeX', 'HyperDrive', 'TitanStrike',
  'ZeroCool', 'PhantomByte', 'Solaris', 'QuantumFox', 'IronClaw'
];

export const NeonIoArena: React.FC<NeonIoArenaProps> = ({
  onGameOver,
  bestScore = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerName, setPlayerName] = useState('Player_1');
  const [selectedSkin, setSelectedSkin] = useState(SKINS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD States
  const [myScore, setMyScore] = useState(100);
  const [myKills, setMyKills] = useState(0);
  const [myRank, setMyRank] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(16);
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: number; isPlayer: boolean }[]>([]);
  const [killFeed, setKillFeed] = useState<KillEvent[]>([]);

  // Simulation references
  const WORLD_SIZE = 4000;
  const stateRef = useRef<{
    player: SnakePlayer | null;
    bots: SnakePlayer[];
    food: FoodPellet[];
    particles: { x: number; y: number; vx: number; vy: number; color: string; life: number }[];
    mouse: { x: number; y: number; active: boolean; worldX: number; worldY: number; boosting: boolean };
    killEvents: KillEvent[];
  }>({
    player: null,
    bots: [],
    food: [],
    particles: [],
    mouse: { x: 0, y: 0, active: false, worldX: 0, worldY: 0, boosting: false },
    killEvents: []
  });

  // Spawn random pellet
  const spawnPellet = (x?: number, y?: number, value = 1, color?: string): FoodPellet => {
    const colors = ['#38bdf8', '#fbbf24', '#f43f5e', '#34d399', '#a78bfa', '#f97316'];
    return {
      x: x ?? Math.random() * WORLD_SIZE,
      y: y ?? Math.random() * WORLD_SIZE,
      radius: Math.min(2.5 + value * 0.4, 7),
      color: color ?? colors[Math.floor(Math.random() * colors.length)],
      value
    };
  };

  // Start new match
  const startMatch = () => {
    sound.playClick();
    const st = stateRef.current;

    // Create Player
    const playerStartX = WORLD_SIZE / 2 + (Math.random() - 0.5) * 600;
    const playerStartY = WORLD_SIZE / 2 + (Math.random() - 0.5) * 600;
    const player: SnakePlayer = {
      id: 'player_0',
      name: playerName.trim() || 'Player_1',
      isBot: false,
      color: selectedSkin.primary,
      secondaryColor: selectedSkin.secondary,
      x: playerStartX,
      y: playerStartY,
      vx: 0,
      vy: 0,
      angle: 0,
      targetAngle: 0,
      speed: 4.8,
      baseSpeed: 4.8,
      boostSpeed: 8.8,
      isBoosting: false,
      length: 22,
      score: 100,
      body: [],
      kills: 0,
      dead: false
    };

    // Initialize body segments
    for (let i = 0; i < player.length; i++) {
      player.body.push({ x: playerStartX - i * 6, y: playerStartY });
    }
    st.player = player;

    // Create 15 Bots
    st.bots = BOT_NAMES.map((bName, idx) => {
      const skin = SKINS[idx % SKINS.length];
      const bx = Math.random() * (WORLD_SIZE - 400) + 200;
      const by = Math.random() * (WORLD_SIZE - 400) + 200;
      const botLen = 18 + Math.floor(Math.random() * 25);
      const bot: SnakePlayer = {
        id: `bot_${idx}`,
        name: bName,
        isBot: true,
        color: skin.primary,
        secondaryColor: skin.secondary,
        x: bx,
        y: by,
        vx: 0,
        vy: 0,
        angle: Math.random() * Math.PI * 2,
        targetAngle: Math.random() * Math.PI * 2,
        speed: 4.4,
        baseSpeed: 4.4,
        boostSpeed: 8.2,
        isBoosting: false,
        length: botLen,
        score: botLen * 10,
        body: [],
        kills: Math.floor(Math.random() * 2),
        dead: false
      };
      for (let s = 0; s < bot.length; s++) {
        bot.body.push({ x: bx - s * 6, y: by });
      }
      return bot;
    });

    // Populate Food Pellets
    st.food = [];
    for (let f = 0; f < 800; f++) {
      st.food.push(spawnPellet());
    }

    st.particles = [];
    st.killEvents = [];
    setKillFeed([]);
    setIsGameOver(false);
    setIsPlaying(true);
    setMyScore(100);
    setMyKills(0);
  };

  // Main Canvas Game Loop
  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let killCounter = 0;

    // Push kill feed event
    const recordKill = (killer: string, victim: string) => {
      killCounter++;
      const ev: KillEvent = { killer, victim, id: killCounter, time: Date.now() };
      stateRef.current.killEvents.unshift(ev);
      if (stateRef.current.killEvents.length > 5) stateRef.current.killEvents.pop();
      setKillFeed([...stateRef.current.killEvents]);
    };

    // Explode dead snake into mass pellets
    const explodeSnake = (snake: SnakePlayer) => {
      sound.playExplosion();
      const st = stateRef.current;
      // Scatter pellets along body
      snake.body.forEach((seg, i) => {
        if (i % 2 === 0) {
          st.food.push(spawnPellet(
            seg.x + (Math.random() - 0.5) * 16,
            seg.y + (Math.random() - 0.5) * 16,
            Math.floor(Math.random() * 3) + 2,
            snake.color
          ));
        }
      });
      // Visual sparkles
      for (let p = 0; p < 35; p++) {
        st.particles.push({
          x: snake.x,
          y: snake.y,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12,
          color: snake.color,
          life: 1.0
        });
      }
    };

    // Input Listeners
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const st = stateRef.current;
      st.mouse.x = e.clientX - rect.left;
      st.mouse.y = e.clientY - rect.top;
      st.mouse.active = true;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        stateRef.current.mouse.boosting = true;
        sound.playNitro();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        stateRef.current.mouse.boosting = false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        stateRef.current.mouse.boosting = true;
        sound.playNitro();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        stateRef.current.mouse.boosting = false;
      }
    };

    // Touch controls
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        stateRef.current.mouse.x = e.touches[0].clientX - rect.left;
        stateRef.current.mouse.y = e.touches[0].clientY - rect.top;
        stateRef.current.mouse.active = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Loop
    const loop = (currentTime: number) => {
      animId = requestAnimationFrame(loop);

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const st = stateRef.current;
      const player = st.player;

      // Resize canvas if needed
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const viewW = canvas.width;
      const viewH = canvas.height;

      // 1. UPDATE PLAYER
      if (player && !player.dead) {
        // Player direction to mouse
        const centerX = viewW / 2;
        const centerY = viewH / 2;
        const dx = st.mouse.x - centerX;
        const dy = st.mouse.y - centerY;

        if (st.mouse.active && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
          player.targetAngle = Math.atan2(dy, dx);
        }

        // Smooth angle lerp
        let diff = player.targetAngle - player.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        player.angle += diff * Math.min(dt * 9, 1.0);

        // Boost logic
        player.isBoosting = st.mouse.boosting && player.score > 30;
        player.speed = player.isBoosting ? player.boostSpeed : player.baseSpeed;

        if (player.isBoosting) {
          player.score -= dt * 6;
          player.length = Math.max(12, Math.floor(player.score / 6));
          // Drop pellet exhaust
          if (Math.random() < 0.25) {
            const tail = player.body[player.body.length - 1] || player;
            st.food.push(spawnPellet(tail.x, tail.y, 1, player.color));
          }
        }

        // Move head
        player.x += Math.cos(player.angle) * player.speed;
        player.y += Math.sin(player.angle) * player.speed;

        // Boundary bounce / wrap
        player.x = Math.max(20, Math.min(WORLD_SIZE - 20, player.x));
        player.y = Math.max(20, Math.min(WORLD_SIZE - 20, player.y));

        // Update body segment follow
        player.body.unshift({ x: player.x, y: player.y });
        while (player.body.length > player.length) {
          player.body.pop();
        }

        setMyScore(Math.floor(player.score));
      }

      // 2. UPDATE BOTS
      st.bots.forEach((bot, bIdx) => {
        if (bot.dead) return;

        // Bot AI: Find closest pellet or hunt/flee
        let closestFood: FoodPellet | null = null;
        let minDist = 400;

        for (let i = 0; i < st.food.length; i += 4) {
          const f = st.food[i];
          const fDist = Math.hypot(f.x - bot.x, f.y - bot.y);
          if (fDist < minDist) {
            minDist = fDist;
            closestFood = f;
          }
        }

        if (closestFood) {
          bot.targetAngle = Math.atan2(closestFood.y - bot.y, closestFood.x - bot.x);
        } else if (Math.random() < 0.02) {
          bot.targetAngle += (Math.random() - 0.5) * 1.5;
        }

        // Turn towards target
        let bDiff = bot.targetAngle - bot.angle;
        while (bDiff < -Math.PI) bDiff += Math.PI * 2;
        while (bDiff > Math.PI) bDiff -= Math.PI * 2;
        bot.angle += bDiff * Math.min(dt * 7, 1.0);

        // Bot move
        bot.speed = bot.isBoosting ? bot.boostSpeed : bot.baseSpeed;
        bot.x += Math.cos(bot.angle) * bot.speed;
        bot.y += Math.sin(bot.angle) * bot.speed;

        // Boundary clamp
        bot.x = Math.max(30, Math.min(WORLD_SIZE - 30, bot.x));
        bot.y = Math.max(30, Math.min(WORLD_SIZE - 30, bot.y));

        // Body segments
        bot.body.unshift({ x: bot.x, y: bot.y });
        while (bot.body.length > bot.length) {
          bot.body.pop();
        }
      });

      // 3. COLLISION: FOOD COLLECTION
      const allSnakes = [player, ...st.bots].filter((s): s is SnakePlayer => s !== null && !s.dead);

      st.food = st.food.filter((f) => {
        for (const s of allSnakes) {
          const dist = Math.hypot(f.x - s.x, f.y - s.y);
          const headRadius = 14 + Math.min(s.length * 0.15, 12);
          if (dist < headRadius + f.radius) {
            s.score += f.value * 4;
            s.length = Math.min(180, 15 + Math.floor(s.score / 7));
            if (!s.isBot) sound.playPop();
            return false;
          }
        }
        return true;
      });

      // Refill food if getting low
      while (st.food.length < 800) {
        st.food.push(spawnPellet());
      }

      // 4. COLLISION: HEAD TO BODY ELIMINATIONS
      allSnakes.forEach((s1) => {
        if (s1.dead) return;
        const s1Radius = 12 + Math.min(s1.length * 0.15, 10);

        allSnakes.forEach((s2) => {
          if (s1.id === s2.id || s2.dead) return;

          // Check if s1's head collides with any body segment of s2
          for (let segIdx = 3; segIdx < s2.body.length; segIdx += 2) {
            const seg = s2.body[segIdx];
            const dist = Math.hypot(s1.x - seg.x, s1.y - seg.y);
            const segRadius = 10 + Math.min(s2.length * 0.12, 9);

            if (dist < s1Radius + segRadius) {
              // S1 Crashes and Dies!
              s1.dead = true;
              s2.kills += 1;
              s2.score += Math.floor(s1.score * 0.4);
              s2.length = Math.min(220, 15 + Math.floor(s2.score / 7));
              recordKill(s2.name, s1.name);
              explodeSnake(s1);

              if (!s2.isBot) {
                setMyKills(k => k + 1);
                sound.playPowerup();
                confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 } });
              }

              if (!s1.isBot) {
                // Player Died!
                setIsGameOver(true);
                onGameOver?.(Math.floor(s1.score));
              }
              break;
            }
          }
        });
      });

      // Respawn dead bots after a delay
      st.bots.forEach((bot, bIdx) => {
        if (bot.dead && Math.random() < 0.015) {
          const skin = SKINS[bIdx % SKINS.length];
          bot.dead = false;
          bot.x = Math.random() * (WORLD_SIZE - 400) + 200;
          bot.y = Math.random() * (WORLD_SIZE - 400) + 200;
          bot.length = 20;
          bot.score = 120;
          bot.body = [];
          for (let s = 0; s < bot.length; s++) {
            bot.body.push({ x: bot.x, y: bot.y });
          }
        }
      });

      // 5. UPDATE LEADERBOARD
      const sorted = [...allSnakes].sort((a, b) => b.score - a.score);
      setLeaderboard(sorted.slice(0, 10).map(s => ({
        name: s.name,
        score: Math.floor(s.score),
        isPlayer: !s.isBot
      })));

      if (player && !player.dead) {
        const pRank = sorted.findIndex(s => s.id === player.id) + 1;
        setMyRank(pRank || sorted.length);
      }
      setTotalPlayers(sorted.length);

      // 6. RENDER SCENE
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, viewW, viewH);

      // Camera offset following player (or world center if player dead)
      const camX = player ? player.x : WORLD_SIZE / 2;
      const camY = player ? player.y : WORLD_SIZE / 2;
      const offsetX = viewW / 2 - camX;
      const offsetY = viewH / 2 - camY;

      ctx.save();
      ctx.translate(offsetX, offsetY);

      // Draw Grid Lines
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      const GRID_SIZE = 80;
      const startGridX = Math.floor((camX - viewW / 2) / GRID_SIZE) * GRID_SIZE;
      const endGridX = Math.ceil((camX + viewW / 2) / GRID_SIZE) * GRID_SIZE;
      const startGridY = Math.floor((camY - viewH / 2) / GRID_SIZE) * GRID_SIZE;
      const endGridY = Math.ceil((camY + viewH / 2) / GRID_SIZE) * GRID_SIZE;

      ctx.beginPath();
      for (let gx = startGridX; gx <= endGridX; gx += GRID_SIZE) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, WORLD_SIZE);
      }
      for (let gy = startGridY; gy <= endGridY; gy += GRID_SIZE) {
        ctx.moveTo(0, gy);
        ctx.lineTo(WORLD_SIZE, gy);
      }
      ctx.stroke();

      // World Boundary Neon Border
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 8;
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 15;
      ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);
      ctx.shadowBlur = 0;

      // Draw Food Pellets
      st.food.forEach((f) => {
        if (
          f.x >= camX - viewW / 2 - 20 &&
          f.x <= camX + viewW / 2 + 20 &&
          f.y >= camY - viewH / 2 - 20 &&
          f.y <= camY + viewH / 2 + 20
        ) {
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
          ctx.fillStyle = f.color;
          ctx.shadowColor = f.color;
          ctx.shadowBlur = 8;
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;

      // Draw All Snakes (bodies first, then heads)
      allSnakes.forEach((snake) => {
        if (snake.dead || snake.body.length < 2) return;

        const bodyRadius = 12 + Math.min(snake.length * 0.12, 11);

        // Body segments
        for (let i = snake.body.length - 1; i >= 0; i -= 2) {
          const seg = snake.body[i];
          const segScale = Math.max(0.6, 1 - (i / snake.body.length) * 0.4);
          ctx.beginPath();
          ctx.arc(seg.x, seg.y, bodyRadius * segScale, 0, Math.PI * 2);
          ctx.fillStyle = i % 4 === 0 ? snake.secondaryColor : snake.color;
          ctx.fill();
        }

        // Head
        ctx.beginPath();
        ctx.arc(snake.x, snake.y, bodyRadius + 2, 0, Math.PI * 2);
        ctx.fillStyle = snake.color;
        ctx.shadowColor = snake.color;
        ctx.shadowBlur = snake.isBoosting ? 18 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eyes
        const eyeOffset = bodyRadius * 0.6;
        const eyeAngle = snake.angle;
        const eyeLX = snake.x + Math.cos(eyeAngle + 0.5) * eyeOffset;
        const eyeLY = snake.y + Math.sin(eyeAngle + 0.5) * eyeOffset;
        const eyeRX = snake.x + Math.cos(eyeAngle - 0.5) * eyeOffset;
        const eyeRY = snake.y + Math.sin(eyeAngle - 0.5) * eyeOffset;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeLX, eyeLY, 3.8, 0, Math.PI * 2);
        ctx.arc(eyeRX, eyeRY, 3.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(eyeLX + Math.cos(eyeAngle) * 1.5, eyeLY + Math.sin(eyeAngle) * 1.5, 1.8, 0, Math.PI * 2);
        ctx.arc(eyeRX + Math.cos(eyeAngle) * 1.5, eyeRY + Math.sin(eyeAngle) * 1.5, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Name tag over head
        ctx.font = '600 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = snake.isBot ? 'rgba(255,255,255,0.75)' : '#38bdf8';
        ctx.fillText(snake.name, snake.x, snake.y - bodyRadius - 8);
      });

      // Draw Particles
      st.particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      ctx.restore();

      // Clean dead particles
      st.particles = st.particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt * 2.0;
        return p.life > 0;
      });
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isPlaying]);

  return (
    <div className="relative w-full h-[620px] md:h-[720px] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl select-none">
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair active:cursor-grabbing"
      />

      {/* Start / Name Selection Lobby Screen */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-6 z-20">
          <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Radio className="w-8 h-8" />
            </div>

            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-1">
              NeonSlither.io
            </h2>
            <p className="text-xs text-neutral-400 mb-6">
              Enter the glowing multiplayer arena. Consume energy mass, encircle rival serpents, and dominate the global top 10!
            </p>

            {/* Nickname input */}
            <div className="mb-4 text-left">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Player Nickname
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
                placeholder="Enter gamer tag..."
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Skin Selector */}
            <div className="mb-6 text-left">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                Select Skin
              </label>
              <div className="grid grid-cols-5 gap-2">
                {SKINS.map((skin) => (
                  <button
                    key={skin.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedSkin(skin);
                    }}
                    style={{ backgroundColor: skin.primary }}
                    className={`h-11 rounded-xl transition-all flex items-center justify-center shadow-md ${
                      selectedSkin.id === skin.id
                        ? 'ring-2 ring-white scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title={skin.name}
                  >
                    {selectedSkin.id === skin.id && (
                      <Sparkles className="w-4 h-4 text-neutral-950" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Launch button */}
            <button
              onClick={startMatch}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 transition-all"
            >
              <Play className="w-4 h-4 fill-neutral-950" />
              Enter Arena
            </button>
          </div>
        </div>
      )}

      {/* In-Game HUD: Top Left (Score & Rank) */}
      {isPlaying && (
        <div className="absolute top-4 left-4 flex items-center gap-3 z-10 pointer-events-none">
          <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800 px-4 py-2.5 rounded-xl flex items-center gap-4 text-white shadow-lg pointer-events-auto">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Mass</div>
              <div className="text-xl md:text-2xl font-bold font-mono tracking-tight text-cyan-400">
                {myScore}
              </div>
            </div>
            <div className="h-8 w-px bg-neutral-800" />
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-rose-400">Kills</div>
              <div className="text-xl md:text-2xl font-bold font-mono tracking-tight text-rose-400 flex items-center gap-1">
                <Swords className="w-4 h-4" />
                {myKills}
              </div>
            </div>
            <div className="h-8 w-px bg-neutral-800" />
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-amber-400">Rank</div>
              <div className="text-xl md:text-2xl font-bold font-mono tracking-tight text-amber-400 flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                #{myRank} <span className="text-xs text-neutral-500 font-normal">/ {totalPlayers}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-Game HUD: Top Right (Leaderboard) */}
      {isPlaying && (
        <div className="absolute top-4 right-4 bg-neutral-950/80 backdrop-blur-md border border-neutral-800 p-3 rounded-2xl w-48 md:w-56 shadow-xl z-10 pointer-events-none">
          <div className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-neutral-800/80 mb-2">
            <span className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Leaderboard
            </span>
            <span className="text-[10px] font-mono text-neutral-500">TOP 10</span>
          </div>
          <div className="space-y-1">
            {leaderboard.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between text-xs px-2 py-0.5 rounded ${
                  item.isPlayer
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-neutral-400'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-mono text-[10px] text-neutral-500 w-3">{idx + 1}.</span>
                  <span className="truncate max-w-[90px]">{item.name}</span>
                </div>
                <span className="font-mono text-[10px] text-neutral-300">{item.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kill Feed Notification (Top Center) */}
      {isPlaying && killFeed.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10 pointer-events-none">
          {killFeed.slice(0, 3).map((k) => (
            <div
              key={k.id}
              className="bg-neutral-950/80 backdrop-blur-md border border-rose-500/30 px-3 py-1 rounded-full text-[11px] text-neutral-300 flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <span className="font-bold text-cyan-400">{k.killer}</span>
              <span className="text-neutral-500">eliminated</span>
              <span className="font-bold text-rose-400">{k.victim}</span>
            </div>
          ))}
        </div>
      )}

      {/* In-Game HUD: Bottom Center Controls Help & Boost */}
      {isPlaying && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
          {/* Controls helper */}
          <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800 px-3 py-1.5 rounded-xl text-[11px] text-neutral-400 hidden sm:flex items-center gap-3">
            <span>🖱️ Move Cursor to Steer</span>
            <span>·</span>
            <span>⚡ Hold Space / Click to Boost</span>
          </div>

          {/* Mobile on-screen Boost Button */}
          <div className="pointer-events-auto ml-auto">
            <button
              onMouseDown={() => {
                stateRef.current.mouse.boosting = true;
                sound.playNitro();
              }}
              onMouseUp={() => {
                stateRef.current.mouse.boosting = false;
              }}
              onTouchStart={() => {
                stateRef.current.mouse.boosting = true;
                sound.playNitro();
              }}
              onTouchEnd={() => {
                stateRef.current.mouse.boosting = false;
              }}
              className="px-6 py-3.5 rounded-2xl bg-cyan-500/20 active:bg-cyan-500/40 border border-cyan-400/50 text-cyan-300 font-bold uppercase tracking-wider text-xs flex items-center gap-2 shadow-xl backdrop-blur-md transition-all"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Speed Boost</span>
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full rounded-2xl p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-500">
              <Swords className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
              You Got Consumed!
            </h2>
            <p className="text-sm text-neutral-400 mb-6">
              Another serpent cut you off! Your mass was scattered across the grid.
            </p>

            <div className="grid grid-cols-3 gap-2.5 mb-6">
              <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-xl text-center">
                <div className="text-[10px] font-mono text-neutral-400 uppercase">Final Mass</div>
                <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">{myScore}</div>
              </div>
              <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-xl text-center">
                <div className="text-[10px] font-mono text-neutral-400 uppercase">Kills</div>
                <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">{myKills}</div>
              </div>
              <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-xl text-center">
                <div className="text-[10px] font-mono text-neutral-400 uppercase">Rank</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">#{myRank}</div>
              </div>
            </div>

            <button
              onClick={startMatch}
              className="w-full py-3.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Respawn & Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
