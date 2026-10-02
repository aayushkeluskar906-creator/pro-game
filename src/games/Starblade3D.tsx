import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Crosshair, Zap, Shield, Play } from 'lucide-react';

interface Starblade3DProps {
  onGameOver?: (score: number) => void;
  bestScore?: number;
}

export const Starblade3D: React.FC<Starblade3DProps> = ({ onGameOver, bestScore = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [shields, setShields] = useState(100);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const stateRef = useRef({
    score: 0,
    shields: 100,
    isGameOver: false,
    shipX: 0,
    shipY: 0,
    targetX: 0,
    targetY: 0,
    roll: 0
  });

  const resetGameRef = useRef<() => void>(() => {});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060d);
    scene.fog = new THREE.FogExp2(0x04060d, 0.005);

    const camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 500);
    camera.position.set(0, 2.5, -6.5);
    camera.lookAt(0, 0, 25);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 1.2);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(20, 40, -10);
    scene.add(dirLight);

    // Starfield particles
    const starCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 200;
      starPos[i + 1] = (Math.random() - 0.5) * 200;
      starPos[i + 2] = Math.random() * 300;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true });
    const starfield = new THREE.Points(starGeo, starMat);
    scene.add(starfield);

    // 3D Player Starship
    const ship = new THREE.Group();
    scene.add(ship);

    const hullMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.4 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // Fuselage
    const fuseGeo = new THREE.ConeGeometry(0.8, 3.2, 5);
    fuseGeo.rotateX(Math.PI / 2);
    const fuse = new THREE.Mesh(fuseGeo, hullMat);
    ship.add(fuse);

    // Swept Wings
    const wingGeo = new THREE.BoxGeometry(4.2, 0.1, 1.4);
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(0, 0, -0.4);
    ship.add(wing);

    // Engines
    [-1.2, 1.2].forEach(ex => {
      const engGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.6, 8);
      engGeo.rotateX(Math.PI / 2);
      const eng = new THREE.Mesh(engGeo, glowMat);
      eng.position.set(ex, 0, -1.2);
      ship.add(eng);
    });

    // Asteroids & Lasers pool
    interface Asteroid {
      mesh: THREE.Mesh;
      hp: number;
      rotSpeed: { x: number; y: number };
    }
    interface Laser {
      mesh: THREE.Mesh;
      z: number;
    }

    let asteroids: Asteroid[] = [];
    let lasers: Laser[] = [];

    const astMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const laserMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    const spawnAsteroid = (zPos: number) => {
      const radius = 1.2 + Math.random() * 2.2;
      const geo = new THREE.DodecahedronGeometry(radius, 1);
      const mesh = new THREE.Mesh(geo, astMat);
      mesh.position.set(
        (Math.random() - 0.5) * 35,
        (Math.random() - 0.5) * 25,
        zPos
      );
      scene.add(mesh);
      asteroids.push({
        mesh,
        hp: Math.ceil(radius * 2),
        rotSpeed: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 }
      });
    };

    for (let i = 0; i < 20; i++) {
      spawnAsteroid(40 + i * 15);
    }

    // Fire laser
    const fireLaser = () => {
      if (stateRef.current.isGameOver) return;
      sound.playRailgun();
      [-1.2, 1.2].forEach(lx => {
        const lGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 6);
        lGeo.rotateX(Math.PI / 2);
        const lMesh = new THREE.Mesh(lGeo, laserMat);
        lMesh.position.set(ship.position.x + lx, ship.position.y, ship.position.z + 1.5);
        scene.add(lMesh);
        lasers.push({ mesh: lMesh, z: ship.position.z + 1.5 });
      });
    };

    // Mouse / touch steering
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      stateRef.current.targetX = nx * 16;
      stateRef.current.targetY = ny * 10;
    };

    const onMouseDown = () => {
      fireLaser();
    };

    window.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mousedown', onMouseDown);

    // Reset game
    const reset = () => {
      stateRef.current = {
        score: 0,
        shields: 100,
        isGameOver: false,
        shipX: 0,
        shipY: 0,
        targetX: 0,
        targetY: 0,
        roll: 0
      };
      asteroids.forEach(a => scene.remove(a.mesh));
      asteroids = [];
      lasers.forEach(l => scene.remove(l.mesh));
      lasers = [];
      for (let i = 0; i < 20; i++) spawnAsteroid(40 + i * 15);
      ship.position.set(0, 0, 0);
      setScore(0);
      setShields(100);
      setIsGameOver(false);
    };
    resetGameRef.current = reset;

    // Animation loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (stateRef.current.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      const st = stateRef.current;

      // Ship positioning lerp
      st.shipX += (st.targetX - st.shipX) * (dt * 7);
      st.shipY += (st.targetY - st.shipY) * (dt * 7);
      st.roll = (st.shipX - st.targetX) * 0.1;

      ship.position.set(st.shipX, st.shipY, 0);
      ship.rotation.z = st.roll;
      ship.rotation.x = (st.targetY - st.shipY) * 0.08;

      camera.position.x = st.shipX * 0.4;
      camera.position.y = st.shipY * 0.4 + 2.5;

      // Update Starfield
      const pos = starfield.geometry.attributes.position.array as Float32Array;
      for (let i = 2; i < starCount * 3; i += 3) {
        pos[i] -= 120 * dt;
        if (pos[i] < -20) pos[i] = 280;
      }
      starfield.geometry.attributes.position.needsUpdate = true;

      // Update Lasers
      lasers.forEach(l => {
        l.z += 180 * dt;
        l.mesh.position.z = l.z;
      });

      // Update Asteroids
      asteroids.forEach(a => {
        a.mesh.position.z -= 45 * dt;
        a.mesh.rotation.x += a.rotSpeed.x * dt;
        a.mesh.rotation.y += a.rotSpeed.y * dt;

        // Collision with Lasers
        lasers.forEach(l => {
          const dist = a.mesh.position.distanceTo(l.mesh.position);
          if (dist < 2.5) {
            a.hp -= 1;
            l.z = 9999;
            sound.playHit();
            if (a.hp <= 0) {
              sound.playExplosion();
              a.mesh.position.z = -9999;
              st.score += 150;
              setScore(st.score);
            }
          }
        });

        // Collision with Ship
        const shipDist = a.mesh.position.distanceTo(ship.position);
        if (shipDist < 2.4) {
          a.mesh.position.z = -9999;
          sound.playPlayerHurt();
          st.shields -= 25;
          setShields(Math.max(0, st.shields));
          if (st.shields <= 0) {
            st.isGameOver = true;
            setIsGameOver(true);
            sound.playGameOver();
            onGameOver?.(st.score);
            if (st.score > bestScore) confetti({ particleCount: 70, spread: 70 });
          }
        }

        // Recycle passed asteroids
        if (a.mesh.position.z < -15) {
          a.mesh.position.z = 250 + Math.random() * 50;
          a.mesh.position.x = (Math.random() - 0.5) * 35;
          a.mesh.position.y = (Math.random() - 0.5) * 25;
          a.hp = 3;
        }
      });

      // Clean lasers
      lasers = lasers.filter(l => {
        if (l.z > 300) {
          scene.remove(l.mesh);
          return false;
        }
        return true;
      });

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] md:h-[720px] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl select-none">
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800 px-4 py-2.5 rounded-xl flex items-center gap-5 text-white shadow-lg pointer-events-auto">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Score</div>
            <div className="text-xl md:text-2xl font-bold font-mono tracking-tight text-cyan-400">{score}</div>
          </div>
          <div className="h-8 w-px bg-neutral-800" />
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Shields</div>
            <div className="flex items-center gap-2 mt-0.5">
              <Shield className={`w-4 h-4 ${shields > 30 ? 'text-emerald-400' : 'text-rose-500'}`} />
              <div className="w-24 h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    shields > 50 ? 'bg-emerald-400' : shields > 25 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${shields}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-white">{shields}%</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(!sound.toggleMute())}
          className="p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 pointer-events-auto"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-neutral-400 font-mono bg-neutral-950/80 px-3 py-1.5 rounded-xl border border-neutral-800/80 pointer-events-none hidden sm:block">
        🖱️ Mouse to Aim/Steer · Left Click to Fire Dual Plasma Lasers
      </div>

      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full rounded-2xl p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tight mb-2">Ship Destroyed</h2>
            <p className="text-sm text-neutral-400 mb-6">Your hull succumbed to space asteroid collisions.</p>
            <div className="bg-neutral-950/60 border border-neutral-800 p-4 rounded-xl mb-6">
              <div className="text-xs text-neutral-400 font-mono uppercase">Final Score</div>
              <div className="text-3xl font-black font-mono text-cyan-400 mt-1">{score}</div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                resetGameRef.current();
              }}
              className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-xl text-sm uppercase flex items-center justify-center gap-2 shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Re-engage Fighter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
