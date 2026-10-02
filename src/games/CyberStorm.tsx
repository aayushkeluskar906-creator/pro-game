import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';
import { 
  Weapon, 
  Enemy, 
  Bullet, 
  Particle, 
  PowerUp, 
  FloatText 
} from '../types/game';
import { INITIAL_WEAPONS } from '../data/weaponsData';
import { 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Shield, 
  Heart, 
  Award, 
  Zap, 
  Flame, 
  Crosshair, 
  Play, 
  Pause,
  Bomb
} from 'lucide-react';

interface Props {
  unlockedWeapons: string[];
  weaponLevels: Record<string, number>;
  onGameOver: (score: number, creditsEarned: number, kills: number) => void;
  bestScore: number;
}

export const CyberStorm: React.FC<Props> = ({
  unlockedWeapons,
  weaponLevels,
  onGameOver,
  bestScore,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Available weapons for this run
  const activeWeapons = useRef<Weapon[]>([]);
  activeWeapons.current = INITIAL_WEAPONS.filter(w => unlockedWeapons.includes(w.id)).map(w => {
    const lvl = weaponLevels[w.id] || 1;
    return {
      ...w,
      level: lvl,
      damage: Math.round(w.damage * (1 + (lvl - 1) * 0.25)),
      fireRate: Math.max(60, Math.round(w.fireRate * (1 - (lvl - 1) * 0.08))),
    };
  });

  const [currentWeaponIndex, setCurrentWeaponIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [credits, setCredits] = useState(0);
  const [wave, setWave] = useState(1);
  const [health, setHealth] = useState(100);
  const [maxHealth] = useState(100);
  const [shield, setShield] = useState(50);
  const [maxShield] = useState(50);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bossHealth, setBossHealth] = useState<number | null>(null);
  const [bossMaxHealth, setBossMaxHealth] = useState<number | null>(null);
  const [combo, setCombo] = useState(1);
  const [nukeReady, setNukeReady] = useState(false);

  // Player state
  const playerRef = useRef({
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    radius: 16,
    speed: 3.8,
    angle: 0,
    shooting: false,
    lastShot: 0,
    invincibleTimer: 60,
    rapidFireTimer: 0,
  });

  const mousePosRef = useRef({ x: 400, y: 300 });
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const enemyBulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const floatTextsRef = useRef<FloatText[]>([]);
  const killsRef = useRef(0);
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const creditsRef = useRef(0);
  creditsRef.current = credits;
  const animationFrameRef = useRef<number | null>(null);
  const waveSpawningRef = useRef(false);
  const enemiesRemainingToSpawn = useRef(0);
  const spawnTimerRef = useRef(0);

  // Auto aim toggle for touch/mobile
  const autoAimRef = useRef(true);

  const startWave = useCallback((w: number) => {
    enemiesRemainingToSpawn.current = 6 + w * 4;
    setWave(w);

    if (w % 5 === 0) {
      // Boss wave!
      sound.playBossAlert();
      floatTextsRef.current.push({
        x: 400,
        y: 200,
        text: `WARNING: TITAN DREADNOUGHT LEVEL ${w / 5}`,
        color: '#f43f5e',
        life: 120,
      });

      // Spawn boss immediately
      const bossHp = 1200 + w * 450;
      enemiesRef.current.push({
        x: 400,
        y: 80,
        vx: 0,
        vy: 0,
        radius: 38,
        hp: bossHp,
        maxHp: bossHp,
        speed: 1.2,
        type: 'boss',
        color: '#f43f5e',
        lastShot: 0,
        shootInterval: 75,
      });
      setBossHealth(bossHp);
      setBossMaxHealth(bossHp);
    } else {
      setBossHealth(null);
      setBossMaxHealth(null);
    }
  }, []);

  const resetGame = useCallback(() => {
    setScore(0);
    setCredits(0);
    setHealth(100);
    setShield(50);
    setIsGameOver(false);
    setIsPaused(false);
    setBossHealth(null);
    setCombo(1);
    setNukeReady(false);
    killsRef.current = 0;

    const canvas = canvasRef.current;
    playerRef.current = {
      x: canvas ? canvas.width / 2 : 400,
      y: canvas ? canvas.height / 2 : 300,
      vx: 0,
      vy: 0,
      radius: 16,
      speed: 3.8,
      angle: 0,
      shooting: false,
      lastShot: 0,
      invincibleTimer: 60,
      rapidFireTimer: 0,
    };

    enemiesRef.current = [];
    bulletsRef.current = [];
    enemyBulletsRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    floatTextsRef.current = [];

    startWave(1);
  }, [startWave]);

  // Keyboard navigation & weapon switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
      if (e.code === 'KeyP') setIsPaused(p => !p);
      if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(e.code)) {
        const idx = parseInt(e.key) - 1;
        if (idx < activeWeapons.current.length) {
          setCurrentWeaponIndex(idx);
          sound.playClick();
        }
      }
      if (e.code === 'Space') {
        playerRef.current.shooting = true;
      }
      if (e.code === 'KeyB' && nukeReady) {
        triggerNuke();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
      if (e.code === 'Space') {
        playerRef.current.shooting = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nukeReady]);

  const triggerNuke = () => {
    setNukeReady(false);
    sound.playExplosion();

    // Damage all enemies
    enemiesRef.current.forEach(e => {
      e.hp -= 400;
    });

    // Screen flash & particles
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      particlesRef.current.push({
        x: playerRef.current.x,
        y: playerRef.current.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#facc15',
        radius: Math.random() * 4 + 2,
        life: 50,
        maxLife: 50,
      });
    }

    floatTextsRef.current.push({
      x: playerRef.current.x,
      y: playerRef.current.y - 40,
      text: 'TACTICAL EMP DETONATED!',
      color: '#facc15',
      life: 60,
    });
  };

  // Mouse aim and shoot tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mousePosRef.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) playerRef.current.shooting = true;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 0) playerRef.current.shooting = false;
  };

  // Main canvas setup and animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const w = parent.clientWidth;
        const h = Math.min(620, Math.max(450, Math.floor(w * 0.65)));
        canvas.width = w;
        canvas.height = h;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    resetGame();

    const loop = () => {
      if (!isGameOver && !isPaused) {
        updateGame(canvas);
      }
      drawGame(ctx, canvas);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isGameOver, isPaused, resetGame]);

  // Spawn hostile logic
  const spawnHostile = (canvas: HTMLCanvasElement, currentWave: number) => {
    const w = canvas.width;
    const h = canvas.height;

    // Pick spawn along outer perimeter
    let x = 0;
    let y = 0;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? -25 : w + 25;
      y = Math.random() * h;
    } else {
      x = Math.random() * w;
      y = Math.random() < 0.5 ? -25 : h + 25;
    }

    const types: Enemy['type'][] = ['swarmer'];
    if (currentWave >= 2) types.push('shooter');
    if (currentWave >= 3) types.push('tank');
    if (currentWave >= 4) types.push('teleporter');

    const randType = types[Math.floor(Math.random() * types.length)];

    let radius = 13;
    let hp = 40 + currentWave * 12;
    let speed = 2.4;
    let color = '#ef4444';

    if (randType === 'tank') {
      radius = 24;
      hp = 180 + currentWave * 40;
      speed = 1.3;
      color = '#e11d48';
    } else if (randType === 'shooter') {
      radius = 15;
      hp = 60 + currentWave * 15;
      speed = 1.8;
      color = '#f97316';
    } else if (randType === 'teleporter') {
      radius = 12;
      hp = 50 + currentWave * 15;
      speed = 3.2;
      color = '#a855f7';
    }

    enemiesRef.current.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius,
      hp,
      maxHp: hp,
      speed,
      type: randType,
      color,
      lastShot: 0,
      shootInterval: 120 + Math.random() * 60,
      teleportTimer: 180,
    });
  };

  // Game update logic
  const updateGame = (canvas: HTMLCanvasElement) => {
    const p = playerRef.current;
    const w = canvas.width;
    const h = canvas.height;

    // Movement WASD
    let moveX = 0;
    let moveY = 0;
    if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) moveY -= 1;
    if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) moveY += 1;
    if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) moveX -= 1;
    if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) moveX += 1;

    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.7071;
      moveY *= 0.7071;
    }

    p.x = Math.max(p.radius, Math.min(w - p.radius, p.x + moveX * p.speed));
    p.y = Math.max(p.radius, Math.min(h - p.radius, p.y + moveY * p.speed));

    // Aim angle towards mouse
    p.angle = Math.atan2(mousePosRef.current.y - p.y, mousePosRef.current.x - p.x);

    // Timers
    if (p.invincibleTimer > 0) p.invincibleTimer--;
    if (p.rapidFireTimer > 0) p.rapidFireTimer--;

    // Weapon shooting
    const weapon = activeWeapons.current[currentWeaponIndex] || activeWeapons.current[0];
    const now = Date.now();
    const effectiveFireRate = p.rapidFireTimer > 0 ? weapon.fireRate * 0.5 : weapon.fireRate;

    if (p.shooting && now - p.lastShot > effectiveFireRate) {
      p.lastShot = now;

      // Play audio based on weapon type
      if (weapon.type === 'rifle') sound.playRifle();
      else if (weapon.type === 'shotgun') sound.playShotgun();
      else if (weapon.type === 'railgun') sound.playRailgun();
      else if (weapon.type === 'rocket') sound.playExplosion();
      else sound.playRifle();

      for (let i = 0; i < weapon.bulletsPerShot; i++) {
        const spreadAngle = p.angle + (Math.random() - 0.5) * weapon.spread;
        bulletsRef.current.push({
          x: p.x + Math.cos(p.angle) * p.radius,
          y: p.y + Math.sin(p.angle) * p.radius,
          vx: Math.cos(spreadAngle) * weapon.speed,
          vy: Math.sin(spreadAngle) * weapon.speed,
          radius: weapon.type === 'railgun' ? 3.5 : weapon.type === 'rocket' ? 5 : 2.5,
          damage: weapon.damage,
          color: weapon.color,
          pierce: weapon.type === 'railgun' ? 3 : 1,
          isExplosive: weapon.type === 'rocket',
          isCryo: weapon.type === 'cryo',
          life: 80,
        });
      }

      // Muzzle recoil particles
      for (let m = 0; m < 3; m++) {
        particlesRef.current.push({
          x: p.x + Math.cos(p.angle) * (p.radius + 6),
          y: p.y + Math.sin(p.angle) * (p.radius + 6),
          vx: Math.cos(p.angle + (Math.random() - 0.5) * 0.4) * (Math.random() * 3 + 1),
          vy: Math.sin(p.angle + (Math.random() - 0.5) * 0.4) * (Math.random() * 3 + 1),
          color: weapon.color,
          radius: Math.random() * 2 + 1,
          life: 15,
          maxLife: 15,
        });
      }
    }

    // Spawn wave hostiles progressively
    if (enemiesRemainingToSpawn.current > 0) {
      spawnTimerRef.current++;
      if (spawnTimerRef.current > 40) {
        spawnTimerRef.current = 0;
        spawnHostile(canvas, wave);
        enemiesRemainingToSpawn.current--;
      }
    }

    // Update bullets
    for (let bIdx = bulletsRef.current.length - 1; bIdx >= 0; bIdx--) {
      const b = bulletsRef.current[bIdx];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      if (b.x < 0 || b.x > w || b.y < 0 || b.y > h || b.life <= 0) {
        bulletsRef.current.splice(bIdx, 1);
        continue;
      }

      // Bullet hit enemy
      for (let eIdx = enemiesRef.current.length - 1; eIdx >= 0; eIdx--) {
        const e = enemiesRef.current[eIdx];
        const dist = Math.hypot(b.x - e.x, b.y - e.y);

        if (dist < e.radius + b.radius) {
          e.hp -= b.damage;
          sound.playHit();

          // Particle sparks
          for (let sp = 0; sp < 4; sp++) {
            particlesRef.current.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              color: b.color,
              radius: 1.5,
              life: 18,
              maxLife: 18,
            });
          }

          // Rocket AoE splash
          if (b.isExplosive) {
            sound.playExplosion();
            enemiesRef.current.forEach(otherE => {
              const blastDist = Math.hypot(b.x - otherE.x, b.y - otherE.y);
              if (blastDist < 85) {
                otherE.hp -= b.damage * 0.7;
              }
            });
          }

          // Cryo slow
          if (b.isCryo) {
            e.speed = Math.max(0.8, e.speed * 0.6);
          }

          // Pierce calculation
          b.pierce = (b.pierce || 1) - 1;
          if (b.pierce <= 0) {
            bulletsRef.current.splice(bIdx, 1);
          }

          // Check enemy death
          if (e.hp <= 0) {
            sound.playExplosion();
            killsRef.current++;

            // Death burst particles
            const count = e.type === 'boss' ? 80 : 16;
            for (let dp = 0; dp < count; dp++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = Math.random() * 4 + 1;
              particlesRef.current.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: e.color,
                radius: Math.random() * 3 + 1,
                life: 30,
                maxLife: 30,
              });
            }

            const pointsEarned = e.type === 'boss' ? 2500 : e.type === 'tank' ? 200 : 80;
            const credsEarned = e.type === 'boss' ? 120 : e.type === 'tank' ? 25 : 8;

            setScore(s => s + pointsEarned * combo);
            setCredits(c => c + credsEarned);
            setCombo(cb => Math.min(8, cb + 1));

            // Chance for powerup drop
            if (Math.random() < 0.22 || e.type === 'boss') {
              const puTypes: PowerUp['type'][] = ['health', 'shield', 'rapid', 'nuke', 'credits'];
              const chosenType = puTypes[Math.floor(Math.random() * puTypes.length)];
              const puColors = {
                health: '#10b981',
                shield: '#06b6d4',
                rapid: '#f59e0b',
                nuke: '#f43f5e',
                credits: '#eab308',
              };
              powerUpsRef.current.push({
                x: e.x,
                y: e.y,
                type: chosenType,
                color: puColors[chosenType],
                radius: 10,
              });
            }

            if (e.type === 'boss') {
              setBossHealth(null);
              confetti({ particleCount: 100, spread: 80 });
            }

            enemiesRef.current.splice(eIdx, 1);
          } else if (e.type === 'boss') {
            setBossHealth(e.hp);
          }
          break;
        }
      }
    }

    // Update enemy bullets
    for (let ebIdx = enemyBulletsRef.current.length - 1; ebIdx >= 0; ebIdx--) {
      const eb = enemyBulletsRef.current[ebIdx];
      eb.x += eb.vx;
      eb.y += eb.vy;
      eb.life--;

      if (eb.x < 0 || eb.x > w || eb.y < 0 || eb.y > h || eb.life <= 0) {
        enemyBulletsRef.current.splice(ebIdx, 1);
        continue;
      }

      // Check collision with player
      if (p.invincibleTimer <= 0) {
        const pDist = Math.hypot(eb.x - p.x, eb.y - p.y);
        if (pDist < p.radius + eb.radius) {
          enemyBulletsRef.current.splice(ebIdx, 1);
          takeDamage(eb.damage);
        }
      }
    }

    // Update enemies
    enemiesRef.current.forEach(e => {
      // Move towards player
      const angleToPlayer = Math.atan2(p.y - e.y, p.x - e.x);

      // Flocking avoidance between enemies
      let repX = 0;
      let repY = 0;
      enemiesRef.current.forEach(other => {
        if (other !== e) {
          const d = Math.hypot(e.x - other.x, e.y - other.y);
          if (d < e.radius + other.radius + 6) {
            repX += (e.x - other.x) / d;
            repY += (e.y - other.y) / d;
          }
        }
      });

      e.vx = Math.cos(angleToPlayer) * e.speed + repX * 0.5;
      e.vy = Math.sin(angleToPlayer) * e.speed + repY * 0.5;

      e.x += e.vx;
      e.y += e.vy;

      // Shooter enemy attacks
      if (e.type === 'shooter' || e.type === 'boss') {
        const distToPlayer = Math.hypot(p.x - e.x, p.y - e.y);
        if (distToPlayer < 450) {
          e.shootInterval = (e.shootInterval || 100) - 1;
          if (e.shootInterval <= 0) {
            e.shootInterval = e.type === 'boss' ? 45 : 95;

            if (e.type === 'boss') {
              // Boss radial burst
              for (let a = 0; a < 6; a++) {
                const bAngle = angleToPlayer + (a - 2.5) * 0.35;
                enemyBulletsRef.current.push({
                  x: e.x,
                  y: e.y,
                  vx: Math.cos(bAngle) * 5,
                  vy: Math.sin(bAngle) * 5,
                  radius: 4,
                  damage: 15,
                  color: '#f43f5e',
                  life: 110,
                });
              }
            } else {
              enemyBulletsRef.current.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(angleToPlayer) * 4.5,
                vy: Math.sin(angleToPlayer) * 4.5,
                radius: 3,
                damage: 12,
                color: '#f97316',
                life: 90,
              });
            }
          }
        }
      }

      // Teleporter enemy jump
      if (e.type === 'teleporter') {
        e.teleportTimer = (e.teleportTimer || 120) - 1;
        if (e.teleportTimer <= 0) {
          e.teleportTimer = 160;
          // Warp to random position near player
          const warpAngle = Math.random() * Math.PI * 2;
          const warpDist = 90 + Math.random() * 80;
          e.x = Math.max(30, Math.min(w - 30, p.x + Math.cos(warpAngle) * warpDist));
          e.y = Math.max(30, Math.min(h - 30, p.y + Math.sin(warpAngle) * warpDist));

          for (let tp = 0; tp < 12; tp++) {
            particlesRef.current.push({
              x: e.x,
              y: e.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              color: '#c084fc',
              radius: 2,
              life: 20,
              maxLife: 20,
            });
          }
        }
      }

      // Melee touch damage on player
      if (p.invincibleTimer <= 0) {
        const contactDist = Math.hypot(p.x - e.x, p.y - e.y);
        if (contactDist < p.radius + e.radius) {
          takeDamage(e.type === 'tank' ? 24 : 14);
        }
      }
    });

    // Update powerups & collection
    for (let puIdx = powerUpsRef.current.length - 1; puIdx >= 0; puIdx--) {
      const pu = powerUpsRef.current[puIdx];
      const dist = Math.hypot(p.x - pu.x, p.y - pu.y);

      if (dist < p.radius + pu.radius) {
        sound.playPowerup();
        powerUpsRef.current.splice(puIdx, 1);

        if (pu.type === 'health') {
          setHealth(h => Math.min(maxHealth, h + 35));
          floatTextsRef.current.push({ x: p.x, y: p.y - 20, text: '+35 HP', color: '#10b981', life: 40 });
        } else if (pu.type === 'shield') {
          setShield(s => Math.min(maxShield, s + 35));
          floatTextsRef.current.push({ x: p.x, y: p.y - 20, text: '+SHIELD', color: '#06b6d4', life: 40 });
        } else if (pu.type === 'rapid') {
          p.rapidFireTimer = 280;
          floatTextsRef.current.push({ x: p.x, y: p.y - 20, text: 'HYPER FIRE ACTIVE', color: '#f59e0b', life: 40 });
        } else if (pu.type === 'nuke') {
          setNukeReady(true);
          floatTextsRef.current.push({ x: p.x, y: p.y - 20, text: 'TACTICAL EMP READY [B]', color: '#f43f5e', life: 50 });
        } else if (pu.type === 'credits') {
          setCredits(c => c + 50);
          floatTextsRef.current.push({ x: p.x, y: p.y - 20, text: '+50 CREDITS', color: '#eab308', life: 40 });
        }
      }
    }

    // Update particles
    for (let pIdx = particlesRef.current.length - 1; pIdx >= 0; pIdx--) {
      const pt = particlesRef.current[pIdx];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) particlesRef.current.splice(pIdx, 1);
    }

    // Update floating text
    for (let fIdx = floatTextsRef.current.length - 1; fIdx >= 0; fIdx--) {
      const ft = floatTextsRef.current[fIdx];
      ft.y -= 0.8;
      ft.life--;
      if (ft.life <= 0) floatTextsRef.current.splice(fIdx, 1);
    }

    // Check wave complete
    if (enemiesRemainingToSpawn.current <= 0 && enemiesRef.current.length === 0 && !waveSpawningRef.current) {
      waveSpawningRef.current = true;
      sound.playPowerup();
      setTimeout(() => {
        startWave(wave + 1);
        waveSpawningRef.current = false;
      }, 1400);
    }
  };

  const takeDamage = (amount: number) => {
    const p = playerRef.current;
    p.invincibleTimer = 45;
    sound.playPlayerHurt();
    setCombo(1);

    setShield(currShield => {
      if (currShield >= amount) {
        return currShield - amount;
      } else {
        const remainder = amount - currShield;
        setHealth(currHp => {
          const newHp = currHp - remainder;
          if (newHp <= 0) {
            setIsGameOver(true);
            sound.playGameOver();
            onGameOver(scoreRef.current, creditsRef.current, killsRef.current);
            if (scoreRef.current > bestScore && scoreRef.current > 0) {
              confetti({ particleCount: 80, spread: 70 });
            }
          }
          return Math.max(0, newHp);
        });
        return 0;
      }
    });
  };

  // Draw scene
  const drawGame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const w = canvas.width;
    const h = canvas.height;

    // Arena Floor
    ctx.fillStyle = '#06070b';
    ctx.fillRect(0, 0, w, h);

    // Cyber Arena grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Perimeter boundary border
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.25)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    // Draw Particles
    particlesRef.current.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.life / pt.maxLife;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw PowerUps
    powerUpsRef.current.forEach(pu => {
      ctx.fillStyle = pu.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = pu.color;
      ctx.beginPath();
      ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner icon symbol
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pu.type[0].toUpperCase(), pu.x, pu.y);
    });
    ctx.shadowBlur = 0;

    // Draw Bullets (Player)
    bulletsRef.current.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Draw Enemy Bullets
    enemyBulletsRef.current.forEach(eb => {
      ctx.fillStyle = eb.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = eb.color;
      ctx.beginPath();
      ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Draw Enemies
    enemiesRef.current.forEach(e => {
      ctx.save();
      ctx.translate(e.x, e.y);

      ctx.fillStyle = e.color;
      ctx.shadowBlur = e.type === 'boss' ? 20 : 10;
      ctx.shadowColor = e.color;

      if (e.type === 'boss') {
        // Boss octagon
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const px = Math.cos(a) * e.radius;
          const py = Math.sin(a) * e.radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Inner glowing core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'tank') {
        // Square armored drone
        ctx.fillRect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);
      } else if (e.type === 'teleporter') {
        // Diamond phantom
        ctx.beginPath();
        ctx.moveTo(0, -e.radius);
        ctx.lineTo(e.radius, 0);
        ctx.lineTo(0, e.radius);
        ctx.lineTo(-e.radius, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        // Circle swarmer / shooter
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Enemy Health bar
      if (e.hp < e.maxHp && e.type !== 'boss') {
        const hpBarW = e.radius * 2.2;
        const hpRatio = e.hp / e.maxHp;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-hpBarW / 2, -e.radius - 8, hpBarW, 3);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-hpBarW / 2, -e.radius - 8, hpBarW * hpRatio, 3);
      }

      ctx.restore();
      ctx.shadowBlur = 0;
    });

    // Draw Player
    const p = playerRef.current;
    if (health > 0) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Flashing if hurt
      if (p.invincibleTimer === 0 || Math.floor(p.invincibleTimer / 4) % 2 === 0) {
        // Player Body
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#0284c7';

        // Armored combat chassis
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Gun barrel
        const weapon = activeWeapons.current[currentWeaponIndex] || activeWeapons.current[0];
        ctx.fillStyle = weapon.color;
        ctx.fillRect(p.radius * 0.5, -3, 14, 6);

        // Cockpit visor
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.arc(4, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Shield Aura
      if (shield > 0) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
      ctx.shadowBlur = 0;
    }

    // Aim Reticle at mouse position
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1.5;
    const mx = mousePosRef.current.x;
    const my = mousePosRef.current.y;
    ctx.beginPath();
    ctx.arc(mx, my, 8, 0, Math.PI * 2);
    ctx.moveTo(mx - 12, my);
    ctx.lineTo(mx + 12, my);
    ctx.moveTo(mx, my - 12);
    ctx.lineTo(mx, my + 12);
    ctx.stroke();

    // Floating text
    floatTextsRef.current.forEach(ft => {
      ctx.font = 'bold 12px "Chakra Petch", sans-serif';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    });
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Top Combat HUD */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-t-xl text-xs font-arcade">
        {/* Vitals */}
        <div className="flex items-center gap-4">
          {/* Health */}
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-emerald-400 fill-emerald-500/40" />
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400">HP {health} / {maxHealth}</span>
              <div className="w-20 sm:w-24 h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${(health / maxHealth) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Shield */}
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400 fill-cyan-500/40" />
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400">SHIELD {shield} / {maxShield}</span>
              <div className="w-16 sm:w-20 h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-200"
                  style={{ width: `${(shield / maxShield) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Wave & Combo */}
          <div className="hidden md:flex items-center gap-3 pl-2 border-l border-neutral-800">
            <div className="text-amber-400 font-bold">WAVE {wave}</div>
            {combo > 1 && (
              <div className="text-rose-400 font-bold animate-pulse">{combo}X COMBO</div>
            )}
          </div>
        </div>

        {/* Score & Controls */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm sm:text-base font-bold text-neutral-100">{score.toLocaleString()}</div>
            <div className="text-[10px] text-amber-400 font-mono font-bold">+{credits} CREDITS</div>
          </div>

          {/* Nuke Button if ready */}
          {nukeReady && (
            <button
              onClick={triggerNuke}
              className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-neutral-100 font-bold text-xs animate-bounce flex items-center gap-1 shadow-lg shadow-rose-600/30"
              title="Tactical EMP Nuke [B]"
            >
              <Bomb className="w-3.5 h-3.5" />
              <span>EMP</span>
            </button>
          )}

          <button
            onClick={() => setIsPaused(p => !p)}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              const muted = sound.toggleMute();
              setSoundEnabled(!muted);
            }}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
          </button>

          <button
            onClick={resetGame}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Boss Health Bar Overlay if active */}
      {bossHealth !== null && bossMaxHealth !== null && (
        <div className="w-full bg-neutral-950 px-4 py-2 border-x border-neutral-800 flex flex-col items-center">
          <div className="flex justify-between w-full max-w-md text-xs font-arcade text-rose-400 font-bold mb-1">
            <span>TITAN DREADNOUGHT</span>
            <span>{Math.round((bossHealth / bossMaxHealth) * 100)}%</span>
          </div>
          <div className="w-full max-w-md h-3 bg-neutral-900 border border-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-150"
              style={{ width: `${(bossHealth / bossMaxHealth) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Canvas Arena */}
      <div className="relative w-full border-x border-b border-neutral-800 bg-neutral-950 rounded-b-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="w-full block cursor-crosshair touch-none"
        />

        <div className="absolute inset-0 crt-overlay pointer-events-none" />

        {/* Game Over Screen */}
        {isGameOver && (
          <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="text-rose-500 font-arcade text-3xl sm:text-4xl font-bold tracking-widest mb-1 drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]">
              OPERATIVE KIA
            </div>
            <p className="text-neutral-400 text-xs sm:text-sm mb-6">Combat perimeter breached by hostiles</p>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 mb-6 w-full max-w-xs space-y-2 font-arcade">
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">COMBAT SCORE</span>
                <span className="text-cyan-400 text-xl font-bold">{score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">WAVE REACHED</span>
                <span className="text-amber-400 font-bold">{wave}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">CREDITS EARNED</span>
                <span className="text-yellow-400 font-bold">+{credits}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-neutral-800 pt-2">
                <span className="text-neutral-400">RECORD</span>
                <span className="text-emerald-400 font-bold">{Math.max(score, bestScore).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="px-6 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-neutral-950 font-arcade font-bold tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/25 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              DEPLOY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Bottom Weapon Selection Bar */}
      <div className="w-full mt-3 p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          {activeWeapons.current.map((w, idx) => (
            <button
              key={w.id}
              onClick={() => {
                sound.playClick();
                setCurrentWeaponIndex(idx);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-arcade flex items-center gap-2 border transition-all ${
                currentWeaponIndex === idx
                  ? 'bg-neutral-800 text-cyan-300 border-cyan-500 shadow-md shadow-cyan-500/20'
                  : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <span className="font-mono text-[10px] text-neutral-500">[{idx + 1}]</span>
              <span className="font-bold">{w.name}</span>
              <span className="text-[10px] px-1 py-0.5 rounded bg-neutral-800 text-neutral-300">
                LVL {w.level}
              </span>
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-neutral-500">
          <span>WASD / Move</span>
          <span>·</span>
          <span>Mouse / Aim & Shoot</span>
          <span>·</span>
          <span>1-5 / Switch Weapon</span>
        </div>
      </div>

      {/* Mobile Touch Controls */}
      <div className="w-full mt-3 p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl grid grid-cols-2 gap-4 sm:hidden select-none">
        {/* Left Direction Pad */}
        <div className="grid grid-cols-3 gap-1.5 w-32">
          <div />
          <button
            onTouchStart={() => (keysPressed.current['KeyW'] = true)}
            onTouchEnd={() => (keysPressed.current['KeyW'] = false)}
            className="w-10 h-10 rounded-lg bg-neutral-800 active:bg-cyan-500 text-cyan-400 font-bold flex items-center justify-center border border-neutral-700"
          >
            ▲
          </button>
          <div />
          <button
            onTouchStart={() => (keysPressed.current['KeyA'] = true)}
            onTouchEnd={() => (keysPressed.current['KeyA'] = false)}
            className="w-10 h-10 rounded-lg bg-neutral-800 active:bg-cyan-500 text-cyan-400 font-bold flex items-center justify-center border border-neutral-700"
          >
            ◀
          </button>
          <button
            onTouchStart={() => (keysPressed.current['KeyS'] = true)}
            onTouchEnd={() => (keysPressed.current['KeyS'] = false)}
            className="w-10 h-10 rounded-lg bg-neutral-800 active:bg-cyan-500 text-cyan-400 font-bold flex items-center justify-center border border-neutral-700"
          >
            ▼
          </button>
          <button
            onTouchStart={() => (keysPressed.current['KeyD'] = true)}
            onTouchEnd={() => (keysPressed.current['KeyD'] = false)}
            className="w-10 h-10 rounded-lg bg-neutral-800 active:bg-cyan-500 text-cyan-400 font-bold flex items-center justify-center border border-neutral-700"
          >
            ▶
          </button>
        </div>

        {/* Right Fire & Aim Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onTouchStart={() => (playerRef.current.shooting = true)}
            onTouchEnd={() => (playerRef.current.shooting = false)}
            className="w-20 h-20 rounded-2xl bg-rose-500/20 active:bg-rose-500 border border-rose-500/50 text-rose-300 active:text-neutral-950 font-arcade font-bold text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-rose-500/20"
          >
            <Crosshair className="w-6 h-6" />
            <span>FIRE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
