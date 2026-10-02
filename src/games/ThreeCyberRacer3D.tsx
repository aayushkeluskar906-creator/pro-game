import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Gauge,
  Zap,
  Play,
  Pause,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Flame,
  Award
} from 'lucide-react';

interface ThreeCyberRacer3DProps {
  onGameOver: (score: number) => void;
  bestScore: number;
}

export const ThreeCyberRacer3D: React.FC<ThreeCyberRacer3DProps> = ({
  onGameOver,
  bestScore
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState(140);
  const [distance, setDistance] = useState(0);
  const [nitro, setNitro] = useState(100);
  const [isBoosting, setIsBoosting] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [score, setScore] = useState(0);

  const stateRef = useRef({
    score: 0,
    distance: 0,
    speed: 140,
    baseSpeed: 140,
    maxBoostSpeed: 280,
    nitro: 100,
    isBoosting: false,
    isGameOver: false,
    isPaused: false,
    playerX: 0,
    targetX: 0,
    turnVelocity: 0,
    cameraShake: 0,
    combo: 1,
  });

  const resetGameRef = useRef<() => void>(() => {});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060810);
    scene.fog = new THREE.FogExp2(0x060810, 0.007);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      70,
      container.clientWidth / container.clientHeight,
      0.1,
      450
    );
    camera.position.set(0, 4.2, -7.5);
    camera.lookAt(0, 1.8, 20);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf43f5e, 1.8);
    dirLight.position.set(10, 30, -20);
    scene.add(dirLight);

    // 5. Materials
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const borderMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.8 });
    const carPaint = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8, roughness: 0.2 });
    const carGlass = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
    const carThruster = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const rivalCarMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.4 });
    const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });

    // 6. Build Player Hovercar
    const playerCar = new THREE.Group();
    scene.add(playerCar);

    // Main Chassis
    const chassisGeo = new THREE.BoxGeometry(2.1, 0.6, 4.2);
    const chassis = new THREE.Mesh(chassisGeo, carPaint);
    chassis.position.y = 0.6;
    chassis.castShadow = true;
    playerCar.add(chassis);

    // Aerodynamic Cockpit Cabin
    const cabinGeo = new THREE.BoxGeometry(1.4, 0.5, 2.0);
    const cabin = new THREE.Mesh(cabinGeo, carGlass);
    cabin.position.set(0, 1.0, -0.2);
    playerCar.add(cabin);

    // Dual Thrusters
    [-0.6, 0.6].forEach((tx) => {
      const thrusterGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.4, 12);
      thrusterGeo.rotateX(Math.PI / 2);
      const thruster = new THREE.Mesh(thrusterGeo, carThruster);
      thruster.position.set(tx, 0.55, -2.1);
      playerCar.add(thruster);
    });

    // 7. Highway Segments
    const trackSegments: THREE.Group[] = [];
    const SEG_LEN = 50;
    const NUM_SEGS = 7;
    const ROAD_WIDTH = 18;

    const createRoadSegment = (zPos: number) => {
      const seg = new THREE.Group();
      seg.position.z = zPos;

      // Road Surface
      const roadGeo = new THREE.BoxGeometry(ROAD_WIDTH, 0.4, SEG_LEN);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.y = -0.2;
      seg.add(road);

      // Guardrails
      [-ROAD_WIDTH / 2, ROAD_WIDTH / 2].forEach((bx) => {
        const borderGeo = new THREE.BoxGeometry(0.5, 1.2, SEG_LEN);
        const border = new THREE.Mesh(borderGeo, borderMat);
        border.position.set(bx, 0.5, 0);
        seg.add(border);
      });

      // Lane Dash Lines
      [-4.5, 0, 4.5].forEach((lx) => {
        for (let z = -SEG_LEN / 2; z < SEG_LEN / 2; z += 8) {
          const dashGeo = new THREE.BoxGeometry(0.2, 0.05, 4);
          const dash = new THREE.Mesh(dashGeo, lineMat);
          dash.position.set(lx, 0.02, z);
          seg.add(dash);
        }
      });

      // Neon Horizon Skyscrapers
      for (let side of [-1, 1]) {
        const bH = 30 + Math.random() * 50;
        const bGeo = new THREE.BoxGeometry(10, bH, 15);
        const bMat = new THREE.MeshStandardMaterial({
          color: 0x090d16,
          roughness: 0.9
        });
        const building = new THREE.Mesh(bGeo, bMat);
        building.position.set(side * (ROAD_WIDTH / 2 + 15 + Math.random() * 10), bH / 2, (Math.random() - 0.5) * SEG_LEN);
        seg.add(building);
      }

      scene.add(seg);
      return seg;
    };

    for (let i = 0; i < NUM_SEGS; i++) {
      trackSegments.push(createRoadSegment(i * SEG_LEN));
    }

    // 8. Rival Traffic & Boost Pads Pools
    interface TrafficCar {
      mesh: THREE.Group;
      x: number;
      z: number;
      speed: number;
      lane: number;
    }

    interface BoostPad {
      mesh: THREE.Mesh;
      x: number;
      z: number;
      collected: boolean;
    }

    let traffic: TrafficCar[] = [];
    let boostPads: BoostPad[] = [];

    const createRivalCar = () => {
      const car = new THREE.Group();
      const bodyGeo = new THREE.BoxGeometry(2.0, 0.65, 4.0);
      const body = new THREE.Mesh(bodyGeo, rivalCarMat);
      body.position.y = 0.6;
      car.add(body);

      // Red Taillights
      [-0.6, 0.6].forEach((tx) => {
        const tGeo = new THREE.BoxGeometry(0.3, 0.15, 0.1);
        const tail = new THREE.Mesh(tGeo, tailLightMat);
        tail.position.set(tx, 0.6, -2.05);
        car.add(tail);
      });

      return car;
    };

    const createBoostPadMesh = () => {
      const padGeo = new THREE.BoxGeometry(2.5, 0.08, 4.5);
      const padMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
      return new THREE.Mesh(padGeo, padMat);
    };

    let nextSpawnZ = 60;
    const LANES_X = [-6.5, -2.2, 2.2, 6.5];

    const spawnTrafficAndPads = (playerZ: number) => {
      while (nextSpawnZ < playerZ + 220) {
        nextSpawnZ += 26 + Math.random() * 20;
        const lane = Math.floor(Math.random() * LANES_X.length);
        const lx = LANES_X[lane];

        if (Math.random() < 0.7) {
          // Rival traffic vehicle
          const rCar = createRivalCar();
          rCar.position.set(lx, 0, nextSpawnZ);
          scene.add(rCar);
          traffic.push({
            mesh: rCar,
            x: lx,
            z: nextSpawnZ,
            speed: 50 + Math.random() * 40,
            lane
          });
        } else {
          // Neon Boost Pad
          const pad = createBoostPadMesh();
          pad.position.set(lx, 0.04, nextSpawnZ);
          scene.add(pad);
          boostPads.push({
            mesh: pad,
            x: lx,
            z: nextSpawnZ,
            collected: false
          });
        }
      }
    };

    // 9. Particle Exhaust System
    const pCount = 80;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pVel = new Float32Array(pCount * 3);
    const pLife = new Float32Array(pCount);

    for (let i = 0; i < pCount; i++) {
      pLife[i] = 0;
      pPos[i * 3] = 0;
      pPos[i * 3 + 1] = 0;
      pPos[i * 3 + 2] = 0;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.35,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const exhaustParticles = new THREE.Points(pGeo, pMat);
    scene.add(exhaustParticles);

    const emitThrusterSparks = (x: number, y: number, z: number) => {
      for (let i = 0; i < pCount; i++) {
        if (pLife[i] <= 0) {
          pLife[i] = 0.5;
          pPos[i * 3] = x + (Math.random() - 0.5) * 0.6;
          pPos[i * 3 + 1] = y + (Math.random() - 0.5) * 0.2;
          pPos[i * 3 + 2] = z - 2.2;

          pVel[i * 3] = (Math.random() - 0.5) * 2;
          pVel[i * 3 + 1] = Math.random() * 1;
          pVel[i * 3 + 2] = -Math.random() * 15 - 5;
          break;
        }
      }
      pGeo.attributes.position.needsUpdate = true;
    };

    // 10. Key listeners
    const keys = { left: false, right: false, up: false, down: false, boost: false };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
      if (e.key === ' ' || e.key === 'Shift') {
        keys.boost = true;
        sound.playNitro();
      }
      if (e.key === 'p' || e.key === 'P') setIsPaused(p => !p);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
      if (e.key === ' ' || e.key === 'Shift') keys.boost = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Reset game
    const resetGame = () => {
      stateRef.current = {
        score: 0,
        distance: 0,
        speed: 140,
        baseSpeed: 140,
        maxBoostSpeed: 280,
        nitro: 100,
        isBoosting: false,
        isGameOver: false,
        isPaused: false,
        playerX: 0,
        targetX: 0,
        turnVelocity: 0,
        cameraShake: 0,
        combo: 1
      };

      traffic.forEach(t => scene.remove(t.mesh));
      traffic = [];
      boostPads.forEach(b => scene.remove(b.mesh));
      boostPads = [];

      nextSpawnZ = 60;
      playerCar.position.set(0, 0, 0);

      setIsGameOver(false);
      setDistance(0);
      setScore(0);
      setNitro(100);
      setSpeed(140);
      setIsBoosting(false);
    };

    resetGameRef.current = resetGame;

    // 11. Main Loop
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (stateRef.current.isGameOver || isPaused) {
        renderer.render(scene, camera);
        return;
      }

      const st = stateRef.current;

      // Handle Steering
      if (keys.left) st.turnVelocity = -12;
      else if (keys.right) st.turnVelocity = 12;
      else st.turnVelocity *= 0.85;

      st.playerX += st.turnVelocity * dt;
      // Clamp to road borders
      const MAX_X = ROAD_WIDTH / 2 - 1.6;
      st.playerX = Math.max(-MAX_X, Math.min(MAX_X, st.playerX));

      playerCar.position.x = st.playerX;
      playerCar.rotation.z = -st.turnVelocity * 0.035; // Car dynamic banking tilt
      playerCar.rotation.y = -st.turnVelocity * 0.025;

      // Boost & Nitro Logic
      const wantsBoost = (keys.boost || keys.up) && st.nitro > 0;
      st.isBoosting = wantsBoost;
      setIsBoosting(wantsBoost);

      if (wantsBoost) {
        st.nitro = Math.max(0, st.nitro - dt * 25);
        st.speed = Math.min(st.maxBoostSpeed, st.speed + dt * 120);
        emitThrusterSparks(st.playerX, 0.6, playerCar.position.z);
      } else {
        st.nitro = Math.min(100, st.nitro + dt * 8); // gradual recharge
        if (keys.down) {
          st.speed = Math.max(80, st.speed - dt * 100);
        } else {
          st.speed += (st.baseSpeed - st.speed) * (dt * 3);
        }
      }

      setNitro(Math.floor(st.nitro));
      setSpeed(Math.floor(st.speed));

      // Forward Movement
      const forwardMeters = (st.speed / 3.6) * dt; // km/h to m/s
      st.distance += forwardMeters;
      playerCar.position.z += forwardMeters;

      st.score += Math.floor(forwardMeters * 1.5);
      setDistance(Math.floor(st.distance));
      setScore(st.score);

      // Camera Follow
      camera.position.x += (st.playerX * 0.5 - camera.position.x) * (dt * 8);
      camera.position.z = playerCar.position.z - 7.5;
      camera.position.y = 4.2;

      // FOV widening when boosting!
      camera.fov = THREE.MathUtils.lerp(camera.fov, wantsBoost ? 84 : 70, dt * 5);
      camera.updateProjectionMatrix();

      camera.lookAt(st.playerX * 0.3, 1.8, playerCar.position.z + 24);

      // Recycle Road
      trackSegments.forEach((seg) => {
        if (seg.position.z < playerCar.position.z - SEG_LEN * 1.5) {
          seg.position.z += SEG_LEN * NUM_SEGS;
        }
      });

      // Spawn traffic & boost pads ahead
      spawnTrafficAndPads(playerCar.position.z);

      const pZ = playerCar.position.z;

      // Update Boost Pads
      boostPads.forEach((pad) => {
        if (pad.collected) return;
        const dz = Math.abs(pad.z - pZ);
        const dx = Math.abs(pad.x - st.playerX);
        if (dz < 2.5 && dx < 2.0) {
          pad.collected = true;
          sound.playNitro();
          st.speed = 260;
          st.nitro = Math.min(100, st.nitro + 35);
          st.score += 500;
        }
      });

      // Update Rival Traffic
      traffic.forEach((car) => {
        // Move rival car forward
        car.z += (car.speed / 3.6) * dt;
        car.mesh.position.z = car.z;

        // Collision Check with Player
        const dz = Math.abs(car.z - pZ);
        const dx = Math.abs(car.x - st.playerX);

        if (dz < 3.8 && dx < 1.8) {
          // Crash!
          st.isGameOver = true;
          setIsGameOver(true);
          sound.playExplosion();
          onGameOver(st.score);
          if (st.score > bestScore) {
            confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
          }
        }
      });

      // Update Particles
      for (let i = 0; i < pCount; i++) {
        if (pLife[i] > 0) {
          pLife[i] -= dt * 2.0;
          pPos[i * 3] += pVel[i * 3] * dt;
          pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt;
          pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
        }
      }
      pGeo.attributes.position.needsUpdate = true;

      // Clean old objects
      traffic = traffic.filter((t) => {
        if (t.z < pZ - 30) {
          scene.remove(t.mesh);
          return false;
        }
        return true;
      });
      boostPads = boostPads.filter((b) => {
        if (b.z < pZ - 20) {
          scene.remove(b.mesh);
          return false;
        }
        return true;
      });

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] md:h-[720px] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl select-none">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Glass HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800 px-4 py-2.5 rounded-xl flex items-center gap-5 text-white shadow-lg pointer-events-auto">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Speed</div>
            <div className="text-xl md:text-2xl font-bold font-mono tracking-tight text-cyan-400 flex items-center gap-1">
              <Gauge className="w-5 h-5 text-cyan-400" />
              {speed}<span className="text-xs text-neutral-400 font-normal">km/h</span>
            </div>
          </div>
          <div className="h-8 w-px bg-neutral-800" />
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Distance</div>
            <div className="text-xl md:text-2xl font-bold font-mono tracking-tight text-white">
              {distance}<span className="text-xs text-neutral-400 font-normal ml-1">m</span>
            </div>
          </div>
          <div className="h-8 w-px bg-neutral-800" />
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-amber-400">Score</div>
            <div className="text-xl md:text-2xl font-bold font-mono tracking-tight text-amber-400">
              {score}
            </div>
          </div>
        </div>

        {/* Right: Nitro & Controls */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Nitro Tank Bar */}
          <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800 px-3 py-2 rounded-xl flex items-center gap-2">
            <Zap className={`w-4 h-4 ${nitro > 25 ? 'text-cyan-400' : 'text-neutral-500'}`} />
            <div className="w-24 h-2.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-100 ${
                  isBoosting ? 'bg-cyan-400 animate-pulse' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                }`}
                style={{ width: `${nitro}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-cyan-300 font-bold">{nitro}%</span>
          </div>

          <button
            onClick={() => {
              const muted = sound.toggleMute();
              setSoundEnabled(!muted);
            }}
            className="p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* On-screen Mobile Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onMouseDown={() => (stateRef.current.turnVelocity = -12)}
            onMouseUp={() => (stateRef.current.turnVelocity = 0)}
            onTouchStart={() => (stateRef.current.turnVelocity = -12)}
            onTouchEnd={() => (stateRef.current.turnVelocity = 0)}
            className="w-14 h-14 rounded-2xl bg-neutral-900/85 active:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white shadow-xl backdrop-blur-md"
            aria-label="Steer Left"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onMouseDown={() => (stateRef.current.turnVelocity = 12)}
            onMouseUp={() => (stateRef.current.turnVelocity = 0)}
            onTouchStart={() => (stateRef.current.turnVelocity = 12)}
            onTouchEnd={() => (stateRef.current.turnVelocity = 0)}
            className="w-14 h-14 rounded-2xl bg-neutral-900/85 active:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white shadow-xl backdrop-blur-md"
            aria-label="Steer Right"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* Boost Button */}
        <div className="pointer-events-auto">
          <button
            onMouseDown={() => {
              stateRef.current.isBoosting = true;
              sound.playNitro();
            }}
            onMouseUp={() => (stateRef.current.isBoosting = false)}
            onTouchStart={() => {
              stateRef.current.isBoosting = true;
              sound.playNitro();
            }}
            onTouchEnd={() => (stateRef.current.isBoosting = false)}
            className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl backdrop-blur-md border transition-all ${
              isBoosting
                ? 'bg-cyan-500 text-neutral-950 border-cyan-400 scale-105'
                : 'bg-neutral-900/85 border-neutral-700 text-cyan-300'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Nitro Boost [Space]</span>
          </button>
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full rounded-2xl p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-500">
              <Flame className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
              Vehicle Totaled!
            </h2>
            <p className="text-sm text-neutral-400 mb-6">
              You collided with high-speed highway traffic.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-xl text-center">
                <div className="text-[11px] font-mono text-neutral-400 uppercase">Distance</div>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">{distance}m</div>
              </div>
              <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-xl text-center">
                <div className="text-[11px] font-mono text-neutral-400 uppercase">Score</div>
                <div className="text-2xl font-bold font-mono text-cyan-400 mt-0.5">{score}</div>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                resetGameRef.current();
              }}
              className="w-full py-3.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Respawn Vehicle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
