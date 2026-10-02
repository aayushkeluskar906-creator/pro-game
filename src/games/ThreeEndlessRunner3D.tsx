import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { sound } from '@/src/utils/sound';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Coins,
  Shield,
  Zap,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Flame,
  Train,
  Sparkles,
  Rocket,
  Heart,
  Crown,
  Gift,
  Star,
  Users,
  Layers,
  ChevronDown,
  Bot,
  CheckSquare,
  Award,
  ShoppingBag
} from 'lucide-react';
import subwaySkyboxUrl from '../assets/images/skybox_subway_cyber_1790956726733.jpg';
import templeSkyboxUrl from '../assets/images/skybox_temple_ruins_1790956739501.jpg';
import { PlayerInventory } from '../types/game';

interface ThreeEndlessRunner3DProps {
  initialTheme?: 'subway' | 'temple';
  onGameOver: (score: number, coins: number, extra?: { jumps: number; slides: number; hoverboards: number }) => void;
  bestScore: number;
  baseMultiplier?: number;
  activeTask?: { id: string; title: string; current: number; target: number };
  onTaskProgress?: (type: 'jump' | 'slide' | 'hoverboard' | 'coin' | 'distance', delta: number) => void;
  onOpenTasksModal?: () => void;
  playerCredits?: number;
  inventory?: PlayerInventory;
  onOpenShopModal?: () => void;
  onReviveWithCredits?: () => boolean;
  onConsumeHoverboard?: () => void;
  onConsumeHeadstart?: () => void;
}

export interface CharacterDef {
  id: string;
  name: string;
  theme: 'subway' | 'temple';
  hoodie: number;
  pants: number;
  cap: number;
  accessory?: string;
  tagline: string;
}

const CHARACTERS: CharacterDef[] = [
  // Subway Surfers Crew
  { id: 'jake', name: 'Jake', theme: 'subway', hoodie: 0x0284c7, pants: 0x1e293b, cap: 0xe11d48, accessory: 'Spray Can', tagline: 'The classic subway graffiti runner' },
  { id: 'tricky', name: 'Tricky', theme: 'subway', hoodie: 0xec4899, pants: 0x334155, cap: 0xf1f5f9, accessory: 'Beanie & Shades', tagline: 'Agile skater with pink beanie' },
  { id: 'fresh', name: 'Fresh', theme: 'subway', hoodie: 0x10b981, pants: 0x475569, cap: 0xf59e0b, accessory: 'Boombox', tagline: 'Groovy tunes on the shoulder' },
  { id: 'yutani', name: 'Yutani', theme: 'subway', hoodie: 0x22c55e, pants: 0x14532d, cap: 0x06b6d4, accessory: 'Science Suit', tagline: 'Alien tech hover specialist' },

  // Temple Run Adventurers
  { id: 'guy', name: 'Guy Dangerous', theme: 'temple', hoodie: 0xb45309, pants: 0x78350f, cap: 0x451a03, accessory: 'Fedora & Satchel', tagline: 'Fearless tomb explorer' },
  { id: 'scarlett', name: 'Scarlett Fox', theme: 'temple', hoodie: 0xd97706, pants: 0x991b1b, cap: 0xef4444, accessory: 'Fox Bandana', tagline: 'Fastest runner in the Mayan ruins' },
  { id: 'karma', name: 'Karma Lee', theme: 'temple', hoodie: 0x047857, pants: 0x064e3b, cap: 0x022c22, accessory: 'Dragon Robe', tagline: 'Mystic temple guardian' }
];

export const ThreeEndlessRunner3D: React.FC<ThreeEndlessRunner3DProps> = ({
  initialTheme = 'subway',
  onGameOver,
  bestScore,
  baseMultiplier = 1,
  activeTask,
  onTaskProgress,
  onOpenTasksModal,
  playerCredits = 0,
  inventory,
  onOpenShopModal,
  onReviveWithCredits,
  onConsumeHoverboard,
  onConsumeHeadstart
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'subway' | 'temple'>(initialTheme);
  const [selectedChar, setSelectedChar] = useState<CharacterDef>(
    initialTheme === 'subway' ? CHARACTERS[0] : CHARACTERS[4]
  );
  const [showCharSelect, setShowCharSelect] = useState(false);

  // VS Computer Rival mode state
  const [vsComputer, setVsComputer] = useState(false);
  const [rivalDistance, setRivalDistance] = useState(0);
  const [rivalStatus, setRivalStatus] = useState<'racing' | 'crashed' | 'behind' | 'ahead'>('racing');

  // In-run Task tracking
  const [inRunTaskProgress, setInRunTaskProgress] = useState(activeTask?.current || 0);
  const [taskCompletedToast, setTaskCompletedToast] = useState<string | null>(null);

  // HUD stats
  const [distance, setDistance] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [multiplier, setMultiplier] = useState(baseMultiplier);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Powerup HUD Timers & Inventory Stock
  const [activeHoverboard, setActiveHoverboard] = useState(false);
  const [hoverboardCount, setHoverboardCount] = useState(inventory?.hoverboards ?? 3);
  const [activeMagnet, setActiveMagnet] = useState(0);
  const [activeSneakers, setActiveSneakers] = useState(0);
  const [activeJetpack, setActiveJetpack] = useState(0);
  const [activeMultiplier, setActiveMultiplier] = useState(0);
  const [hasResurrectWings, setHasResurrectWings] = useState((inventory?.resurrectWings ?? 1) > 0);
  const [recentReward, setRecentReward] = useState<string | null>(null);

  // Mutable Game State Reference (high frequency loop)
  const stateRef = useRef({
    theme: initialTheme,
    char: initialTheme === 'subway' ? CHARACTERS[0] : CHARACTERS[4],
    distance: 0,
    coins: 0,
    multiplier: baseMultiplier,
    speed: 40,
    maxSpeed: 100,
    isGameOver: false,
    isPaused: false,
    // VS Computer Rival State
    vsComputer: false,
    rivalZ: 0,
    rivalX: 3.3,
    rivalLane: 1,
    rivalTargetX: 3.3,
    rivalSpeed: 40,
    rivalCrashed: false,
    rivalVy: 0,
    rivalY: 0,
    rivalIsJumping: false,
    // In-Run Action Stats for Tasks
    jumpsCount: 0,
    slidesCount: 0,
    hoverboardsCount: 0,
    // Powerups & Inventory
    hoverboard: false,
    hoverboardStock: inventory?.hoverboards ?? 3,
    headstartsStock: inventory?.headstarts ?? 1,
    resurrectWings: (inventory?.resurrectWings ?? 1) > 0,
    magnetTime: 0,
    sneakersTime: 0,
    jetpackTime: 0,
    multiplierTime: 0,
    // Booster levels
    magnetLevel: inventory?.magnetLevel || 1,
    sneakersLevel: inventory?.sneakersLevel || 1,
    jetpackLevel: inventory?.jetpackLevel || 1,
    multiplierLevel: inventory?.multiplierLevel || 1,
    // Coordinates & Physics
    currentLane: 0, // -1 (left), 0 (center), 1 (right)
    targetLaneX: 0,
    playerX: 0,
    playerY: 0,
    groundY: 0,
    vy: 0,
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
    stumbleTimer: 0,
    chaserDistance: 5.0,
    lastBarkTime: 0,
    lastHonkTime: 0,
  });

  // Sync stateRef when inventory changes
  useEffect(() => {
    if (inventory) {
      setHoverboardCount(inventory.hoverboards);
      stateRef.current.hoverboardStock = inventory.hoverboards;
      stateRef.current.headstartsStock = inventory.headstarts;
      stateRef.current.resurrectWings = inventory.resurrectWings > 0;
      stateRef.current.magnetLevel = inventory.magnetLevel || 1;
      stateRef.current.sneakersLevel = inventory.sneakersLevel || 1;
      stateRef.current.jetpackLevel = inventory.jetpackLevel || 1;
      stateRef.current.multiplierLevel = inventory.multiplierLevel || 1;
      setHasResurrectWings(inventory.resurrectWings > 0);
    }
  }, [inventory]);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const resetGameRef = useRef<() => void>(() => {});

  // Update refs when props change
  useEffect(() => {
    stateRef.current.theme = theme;
  }, [theme]);

  useEffect(() => {
    stateRef.current.char = selectedChar;
  }, [selectedChar]);

  useEffect(() => {
    stateRef.current.vsComputer = vsComputer;
  }, [vsComputer]);

  // Main Three.js Scene Setup & Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animFrameId: number;
    const LANE_WIDTH = 3.3;
    const LANES = [-LANE_WIDTH, 0, LANE_WIDTH];

    // 1. Scene & Atmosphere Setup
    const scene = new THREE.Scene();
    const isSub = stateRef.current.theme === 'subway';
    
    // Background sky texture
    const texLoader = new THREE.TextureLoader();
    const skyUrl = isSub ? subwaySkyboxUrl : templeSkyboxUrl;
    texLoader.load(
      skyUrl,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
      },
      undefined,
      () => {
        scene.background = new THREE.Color(isSub ? 0x070b14 : 0x0d1810);
      }
    );

    scene.fog = new THREE.FogExp2(isSub ? 0x090e1a : 0x091a10, 0.0075);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 400);
    camera.position.set(0, 5.2, -6.8);
    camera.lookAt(0, 1.8, 12);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(isSub ? 0xd0e3ff : 0xffe8c2, isSub ? 1.3 : 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(isSub ? 0x93c5fd : 0xf59e0b, isSub ? 2.0 : 2.4);
    dirLight.position.set(20, 35, -12);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const playerPointLight = new THREE.PointLight(isSub ? 0x38bdf8 : 0xf97316, 2.5, 22);
    scene.add(playerPointLight);

    // 5. Materials Catalog
    const mats = {
      // Subway
      railSteel: new THREE.MeshStandardMaterial({ color: 0xa8b4c4, metalness: 0.85, roughness: 0.2 }),
      railSleeper: new THREE.MeshStandardMaterial({ color: 0x3f2e1e, roughness: 0.9 }),
      ballast: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 }),
      tunnelTruss: new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 }),
      neonSignYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 1.8 }),
      neonSignRed: new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.0 }),
      trainSilver: new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.75, roughness: 0.25 }),
      trainRed: new THREE.MeshStandardMaterial({ color: 0xd92638, metalness: 0.5, roughness: 0.35 }),
      trainBlue: new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.5, roughness: 0.35 }),
      trainWindow: new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.9 }),
      trainHeadlight: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3.5 }),
      rampWood: new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 }),
      roadblock: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 }),
      // Temple
      templeStone: new THREE.MeshStandardMaterial({ color: 0x2c3b2f, roughness: 0.85 }),
      templeGold: new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 }),
      boulderRock: new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.95 }),
      torchFlame: new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff3300, emissiveIntensity: 3.0 }),
      ancientFire: new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 2.8 }),
      // Collectibles & Powerups
      coinGold: new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.1, emissive: 0xd97706, emissiveIntensity: 0.4 }),
      hoverboardBlue: new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 1.2, metalness: 0.8 }),
      hoverboardThruster: new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.5 }),
      magnetMat: new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, emissiveIntensity: 0.85 }),
      sneakerMat: new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.85 }),
      jetpackMat: new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.9 }),
      starMultiplierMat: new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 0.9 }),
      pogoMat: new THREE.MeshStandardMaterial({ color: 0xeab308, emissive: 0xca8a04, emissiveIntensity: 0.8 }),
      mysteryBoxMat: new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.9, metalness: 0.6 }),
      // Chaser Materials
      chaserOfficer: new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 }),
      chaserDog: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }),
      chaserDemonApe: new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.95 }),
      chaserEyeGlow: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
      // Rival Computer Bot Material
      rivalSuit: new THREE.MeshStandardMaterial({ color: 0x9333ea, emissive: 0x7e22ce, emissiveIntensity: 0.4, roughness: 0.5 }),
      rivalVisor: new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.2 })
    };

    // 6. Build Player Rig
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);

    const charDef = stateRef.current.char;
    const playerSuitMat = new THREE.MeshStandardMaterial({ color: charDef.hoodie, roughness: 0.6 });
    const playerPantsMat = new THREE.MeshStandardMaterial({ color: charDef.pants, roughness: 0.7 });
    const playerSkinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.8 });
    const capMat = new THREE.MeshStandardMaterial({ color: charDef.cap });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.5), playerSuitMat);
    torso.position.y = 1.3;
    torso.castShadow = true;
    playerGroup.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), playerSkinMat);
    head.position.y = 2.1;
    head.castShadow = true;
    playerGroup.add(head);

    // Cap
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.68), capMat);
    cap.position.set(0, 2.32, -0.06);
    playerGroup.add(cap);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.24, 0.8, 0.24);
    const leftArm = new THREE.Mesh(armGeo, playerSuitMat);
    leftArm.position.set(-0.55, 1.2, 0);
    playerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, playerSuitMat);
    rightArm.position.set(0.55, 1.2, 0);
    playerGroup.add(rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.28, 0.9, 0.28);
    const leftLeg = new THREE.Mesh(legGeo, playerPantsMat);
    leftLeg.position.set(-0.24, 0.45, 0);
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, playerPantsMat);
    rightLeg.position.set(0.24, 0.45, 0);
    playerGroup.add(rightLeg);

    // Hoverboard Mesh under feet
    const hoverboardGroup = new THREE.Group();
    const boardDeck = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.12, 2.3), mats.hoverboardBlue);
    hoverboardGroup.add(boardDeck);
    [-0.35, 0.35].forEach(tx => {
      const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15, 8), mats.hoverboardThruster);
      thruster.position.set(tx, -0.08, -0.8);
      hoverboardGroup.add(thruster);
    });
    hoverboardGroup.position.y = -0.05;
    hoverboardGroup.visible = false;
    playerGroup.add(hoverboardGroup);

    // Jetpack on back
    const jetpackGroup = new THREE.Group();
    [-0.25, 0.25].forEach(jx => {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.75, 8), mats.jetpackMat);
      tube.position.set(jx, 1.4, -0.38);
      jetpackGroup.add(tube);
    });
    jetpackGroup.visible = false;
    playerGroup.add(jetpackGroup);

    // 7. Computer Rival 3D Bot Rig (for VS Computer Mode!)
    const rivalGroup = new THREE.Group();
    scene.add(rivalGroup);

    const rivalTorso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.0, 0.5), mats.rivalSuit);
    rivalTorso.position.y = 1.3;
    rivalGroup.add(rivalTorso);

    const rivalHead = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.52, 0.52), mats.rivalSuit);
    rivalHead.position.y = 2.1;
    rivalGroup.add(rivalHead);

    const rivalVisor = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.3), mats.rivalVisor);
    rivalVisor.position.set(0, 2.15, 0.24);
    rivalGroup.add(rivalVisor);

    // Rival Floating Crown / Target Beacon
    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.24), mats.starMultiplierMat);
    beacon.position.set(0, 2.8, 0);
    rivalGroup.add(beacon);

    const rivalLeftLeg = new THREE.Mesh(legGeo, mats.rivalSuit);
    rivalLeftLeg.position.set(-0.24, 0.45, 0);
    rivalGroup.add(rivalLeftLeg);

    const rivalRightLeg = new THREE.Mesh(legGeo, mats.rivalSuit);
    rivalRightLeg.position.set(0.24, 0.45, 0);
    rivalGroup.add(rivalRightLeg);

    rivalGroup.position.set(LANES[2], 0, 0);
    rivalGroup.visible = stateRef.current.vsComputer;

    // 8. Chaser Rig (Inspector + Dog OR Demon Ape)
    const chaserGroup = new THREE.Group();
    scene.add(chaserGroup);

    if (isSub) {
      // Subway Inspector & Dog
      const officer = new THREE.Group();
      const oBody = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.4, 0.8), mats.chaserOfficer);
      oBody.position.y = 1.4;
      officer.add(oBody);

      const oHead = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), playerSkinMat);
      oHead.position.y = 2.3;
      officer.add(oHead);

      const oCap = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.75), mats.chaserOfficer);
      oCap.position.set(0, 2.55, 0.05);
      officer.add(oCap);
      chaserGroup.add(officer);

      // Police Bulldog
      const dog = new THREE.Group();
      const dogBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.9), mats.chaserDog);
      dogBody.position.set(1.1, 0.5, 0.2);
      dog.add(dogBody);

      const dogHead = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.45), mats.chaserDog);
      dogHead.position.set(1.1, 0.75, 0.7);
      dog.add(dogHead);
      chaserGroup.add(dog);
    } else {
      // Demon Monkey Ape (Temple Run)
      const ape = new THREE.Group();
      const apeTorso = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.8, 1.4), mats.chaserDemonApe);
      apeTorso.position.y = 1.6;
      ape.add(apeTorso);

      const apeHead = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 1.1), mats.chaserDemonApe);
      apeHead.position.set(0, 2.7, 0.3);
      ape.add(apeHead);

      const eyeGeo = new THREE.SphereGeometry(0.14, 8, 8);
      const eyeL = new THREE.Mesh(eyeGeo, mats.chaserEyeGlow);
      eyeL.position.set(-0.3, 2.75, 0.85);
      ape.add(eyeL);
      const eyeR = new THREE.Mesh(eyeGeo, mats.chaserEyeGlow);
      eyeR.position.set(0.3, 2.75, 0.85);
      ape.add(eyeR);

      chaserGroup.add(ape);
    }

    // 9. Track Architecture & Endless Chunk Recycling
    const trackSegments: THREE.Group[] = [];
    const SEGMENT_LENGTH = 44;
    const TOTAL_SEGMENTS = 7;

    const createTrackSegment = (zOffset: number) => {
      const segment = new THREE.Group();
      segment.position.z = zOffset;

      if (stateRef.current.theme === 'subway') {
        const ground = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.5, SEGMENT_LENGTH), mats.ballast);
        ground.position.y = -0.25;
        ground.receiveShadow = true;
        segment.add(ground);

        LANES.forEach((laneX) => {
          const railL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, SEGMENT_LENGTH), mats.railSteel);
          railL.position.set(laneX - 0.75, 0.08, 0);
          segment.add(railL);

          const railR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, SEGMENT_LENGTH), mats.railSteel);
          railR.position.set(laneX + 0.75, 0.08, 0);
          segment.add(railR);

          for (let z = -SEGMENT_LENGTH / 2; z < SEGMENT_LENGTH / 2; z += 2.4) {
            const sleeper = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 0.4), mats.railSleeper);
            sleeper.position.set(laneX, 0.04, z);
            segment.add(sleeper);
          }
        });

        // Overhead Truss Arch with Neon Lights
        const arch = new THREE.Group();
        const archBeam = new THREE.Mesh(new THREE.BoxGeometry(14.8, 0.5, 0.6), mats.tunnelTruss);
        archBeam.position.y = 6.2;
        arch.add(archBeam);

        [-7.2, 7.2].forEach(px => {
          const col = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6.4, 0.6), mats.tunnelTruss);
          col.position.set(px, 3.2, 0);
          arch.add(col);
        });

        LANES.forEach(lx => {
          const sig = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mats.neonSignYellow);
          sig.position.set(lx, 6.0, 0.35);
          arch.add(sig);
        });

        arch.position.z = 0;
        segment.add(arch);
      } else {
        // Ancient Temple Stone Causeway
        const ground = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.8, SEGMENT_LENGTH), mats.templeStone);
        ground.position.y = -0.4;
        ground.receiveShadow = true;
        segment.add(ground);

        [-6.0, 6.0].forEach(bx => {
          const border = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, SEGMENT_LENGTH), mats.templeGold);
          border.position.set(bx, 0.2, 0);
          segment.add(border);
        });

        for (let z = -SEGMENT_LENGTH / 2 + 5; z < SEGMENT_LENGTH / 2; z += 14) {
          [-5.4, 5.4].forEach(bx => {
            const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 1.3, 8), mats.templeStone);
            brazier.position.set(bx, 0.65, z);
            segment.add(brazier);

            const flame = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), mats.torchFlame);
            flame.position.set(bx, 1.45, z);
            segment.add(flame);
          });
        }
      }

      scene.add(segment);
      return segment;
    };

    for (let i = 0; i < TOTAL_SEGMENTS; i++) {
      trackSegments.push(createTrackSegment(i * SEGMENT_LENGTH));
    }

    // 10. Active Objects, Hazards & Collectibles
    interface ActiveTrain {
      mesh: THREE.Group;
      lane: number;
      z: number;
      length: number;
      hasRamp: boolean;
      speed: number;
    }

    interface ActiveHazard {
      mesh: THREE.Group | THREE.Mesh;
      lane: number;
      z: number;
      type: 'barrier_low' | 'barrier_high' | 'boulder' | 'flame_trap' | 'tree_root';
      speed?: number;
    }

    interface ActiveCoin {
      mesh: THREE.Mesh;
      lane: number;
      z: number;
      y: number;
      collected: boolean;
      isGoldenIdol?: boolean;
    }

    interface ActivePowerup {
      mesh: THREE.Group;
      lane: number;
      z: number;
      type: 'hoverboard' | 'magnet' | 'sneakers' | 'jetpack' | 'multiplier' | 'mystery';
      collected: boolean;
    }

    let trains: ActiveTrain[] = [];
    let hazards: ActiveHazard[] = [];
    let coins: ActiveCoin[] = [];
    let powerups: ActivePowerup[] = [];

    const createSubwayTrain = (hasRamp: boolean, isMoving: boolean) => {
      const train = new THREE.Group();

      const body = new THREE.Mesh(new THREE.BoxGeometry(2.7, 3.7, 22), mats.trainSilver);
      body.position.y = 1.85;
      body.castShadow = true;
      train.add(body);

      const nose = new THREE.Mesh(new THREE.BoxGeometry(2.75, 3.75, 2.6), isMoving ? mats.trainRed : mats.trainBlue);
      nose.position.set(0, 1.85, -9.8);
      train.add(nose);

      [-0.85, 0.85].forEach(hx => {
        const headGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 10);
        headGeo.rotateX(Math.PI / 2);
        const headLight = new THREE.Mesh(headGeo, mats.trainHeadlight);
        headLight.position.set(hx, 1.3, -11.1);
        train.add(headLight);
      });

      if (hasRamp) {
        const rampGeo = new THREE.BoxGeometry(2.6, 0.25, 6.8);
        rampGeo.rotateX(-0.52);
        const ramp = new THREE.Mesh(rampGeo, mats.rampWood);
        ramp.position.set(0, 1.85, -13.6);
        train.add(ramp);
      }

      return train;
    };

    let nextSpawnZ = 35;

    const spawnTrackObjects = (playerZ: number) => {
      while (nextSpawnZ < playerZ + 220) {
        nextSpawnZ += 28 + Math.random() * 16;
        const lane = Math.floor(Math.random() * 3) - 1;
        const laneX = LANES[lane + 1];
        const isSubTheme = stateRef.current.theme === 'subway';

        const roll = Math.random();

        if (isSubTheme) {
          if (roll < 0.38) {
            const isMoving = Math.random() < 0.45;
            const hasRamp = !isMoving && Math.random() < 0.65;
            const trainMesh = createSubwayTrain(hasRamp, isMoving);
            trainMesh.position.set(laneX, 0, nextSpawnZ);
            scene.add(trainMesh);

            trains.push({
              mesh: trainMesh,
              lane,
              z: nextSpawnZ,
              length: 24,
              hasRamp,
              speed: isMoving ? 16 : 0
            });

            if (hasRamp) {
              for (let tc = -7; tc <= 7; tc += 3) {
                const cMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.1, 12), mats.coinGold);
                cMesh.geometry.rotateX(Math.PI / 2);
                cMesh.position.set(laneX, 4.3, nextSpawnZ + tc);
                scene.add(cMesh);
                coins.push({ mesh: cMesh, lane, z: nextSpawnZ + tc, y: 4.3, collected: false });
              }
            }
          } else if (roll < 0.68) {
            const bar = new THREE.Group();
            const beam = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.38, 0.25), mats.roadblock);
            beam.position.y = 0.65;
            bar.add(beam);
            bar.position.set(laneX, 0, nextSpawnZ);
            scene.add(bar);
            hazards.push({ mesh: bar, lane, z: nextSpawnZ, type: 'barrier_low' });
          } else if (roll < 0.85) {
            const arch = new THREE.Group();
            const top = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 0.4), mats.roadblock);
            top.position.y = 3.3;
            arch.add(top);
            arch.position.set(laneX, 0, nextSpawnZ);
            scene.add(arch);
            hazards.push({ mesh: arch, lane, z: nextSpawnZ, type: 'barrier_high' });
          }
        } else {
          // Temple Run Hazards
          if (roll < 0.35) {
            const boulderGeo = new THREE.DodecahedronGeometry(1.6, 1);
            const boulderMesh = new THREE.Mesh(boulderGeo, mats.boulderRock);
            boulderMesh.position.set(laneX, 1.6, nextSpawnZ);
            scene.add(boulderMesh);
            hazards.push({ mesh: boulderMesh, lane, z: nextSpawnZ, type: 'boulder', speed: 12 });
          } else if (roll < 0.65) {
            const trap = new THREE.Group();
            const grate = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 2.4), mats.templeStone);
            trap.add(grate);
            const flameJet = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.4, 8), mats.ancientFire);
            flameJet.position.y = 1.2;
            trap.add(flameJet);
            trap.position.set(laneX, 0.05, nextSpawnZ);
            scene.add(trap);
            hazards.push({ mesh: trap, lane, z: nextSpawnZ, type: 'flame_trap' });
          } else {
            const root = new THREE.Group();
            const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.8, 8), mats.templeStone);
            beam.rotation.z = Math.PI / 2;
            beam.position.y = 1.8;
            root.add(beam);
            root.position.set(laneX, 0, nextSpawnZ);
            scene.add(root);
            hazards.push({ mesh: root, lane, z: nextSpawnZ, type: 'tree_root' });
          }
        }

        // Coins on ground track
        [-1, 0, 1].forEach(cl => {
          if (cl !== lane && Math.random() < 0.55) {
            for (let c = 0; c < 3; c++) {
              const cz = nextSpawnZ + c * 2.4;
              const isIdol = !isSubTheme && Math.random() < 0.06;
              const cGeo = isIdol
                ? new THREE.OctahedronGeometry(0.55)
                : new THREE.CylinderGeometry(0.38, 0.38, 0.1, 12);
              if (!isIdol) cGeo.rotateX(Math.PI / 2);

              const cMesh = new THREE.Mesh(cGeo, mats.coinGold);
              cMesh.position.set(LANES[cl + 1], 1.0, cz);
              scene.add(cMesh);
              coins.push({ mesh: cMesh, lane, z: cz, y: 1.0, collected: false, isGoldenIdol: isIdol });
            }
          }
        });

        // Power-ups
        if (Math.random() < 0.22) {
          const pLane = Math.floor(Math.random() * 3) - 1;
          const pTypes: ('hoverboard' | 'magnet' | 'sneakers' | 'jetpack' | 'multiplier' | 'mystery')[] = [
            'hoverboard', 'magnet', 'sneakers', 'jetpack', 'multiplier', 'mystery'
          ];
          const pType = pTypes[Math.floor(Math.random() * pTypes.length)];

          const pGroup = new THREE.Group();
          const pBox = new THREE.Mesh(
            pType === 'mystery' ? new THREE.DodecahedronGeometry(0.65) : new THREE.BoxGeometry(0.9, 0.9, 0.9),
            pType === 'hoverboard' ? mats.hoverboardBlue :
            pType === 'magnet' ? mats.magnetMat :
            pType === 'sneakers' ? mats.sneakerMat :
            pType === 'jetpack' ? mats.jetpackMat :
            pType === 'multiplier' ? mats.starMultiplierMat : mats.mysteryBoxMat
          );
          pGroup.add(pBox);
          pGroup.position.set(LANES[pLane + 1], 1.4, nextSpawnZ + 4);
          scene.add(pGroup);
          powerups.push({ mesh: pGroup, lane: pLane, z: nextSpawnZ + 4, type: pType, collected: false });
        }
      }
    };

    // 11. Particle System
    const pCount = 140;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pVel = new Float32Array(pCount * 3);
    const pLife = new Float32Array(pCount);
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xfbbf24, size: 0.35, transparent: true });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    const triggerBurst = (x: number, y: number, z: number, count = 20, colorHex = 0xfbbf24) => {
      pMat.color.setHex(colorHex);
      let t = 0;
      for (let i = 0; i < pCount && t < count; i++) {
        if (pLife[i] <= 0) {
          pLife[i] = 1.0;
          pPos[i * 3] = x;
          pPos[i * 3 + 1] = y;
          pPos[i * 3 + 2] = z;
          pVel[i * 3] = (Math.random() - 0.5) * 9;
          pVel[i * 3 + 1] = Math.random() * 6 + 2;
          pVel[i * 3 + 2] = (Math.random() - 0.5) * 9;
          t++;
        }
      }
      pGeo.attributes.position.needsUpdate = true;
    };

    // 12. Controls & Input
    const handleLaneSwitch = (delta: number) => {
      const st = stateRef.current;
      if (st.isGameOver || st.isPaused) return;
      const newLane = Math.max(-1, Math.min(1, st.currentLane + delta));
      if (newLane !== st.currentLane) {
        st.currentLane = newLane;
        st.targetLaneX = LANES[newLane + 1];
        sound.playSwoosh();
        triggerBurst(st.playerX, st.playerY + 0.3, playerGroup.position.z, 10, 0x38bdf8);
      }
    };

    const handleJump = () => {
      const st = stateRef.current;
      if (st.isGameOver || st.isPaused) return;
      if (!st.isJumping) {
        const jumpH = st.sneakersTime > 0 ? 22.0 : 15.0;
        st.vy = jumpH;
        st.isJumping = true;
        st.isSliding = false;
        st.jumpsCount += 1;
        onTaskProgress?.('jump', 1);
        sound.playJump();
        if (st.sneakersTime > 0) {
          triggerBurst(st.playerX, st.playerY, playerGroup.position.z, 16, 0x10b981);
        }
      }
    };

    const handleSlide = () => {
      const st = stateRef.current;
      if (st.isGameOver || st.isPaused) return;
      if (!st.isSliding) {
        st.isSliding = true;
        st.slideTimer = 0.75;
        st.slidesCount += 1;
        onTaskProgress?.('slide', 1);
        if (st.isJumping) st.vy = -20;
        sound.playSlide();
        triggerBurst(st.playerX, st.groundY + 0.1, playerGroup.position.z, 12, 0xd97706);
      }
    };

    const handleHoverboard = () => {
      const st = stateRef.current;
      if (st.isGameOver || st.isPaused) return;
      if (!st.hoverboard && st.hoverboardStock > 0) {
        st.hoverboard = true;
        st.hoverboardStock -= 1;
        st.hoverboardsCount += 1;
        onTaskProgress?.('hoverboard', 1);
        setActiveHoverboard(true);
        setHoverboardCount(st.hoverboardStock);
        hoverboardGroup.visible = true;
        sound.playPowerup();
        triggerBurst(st.playerX, st.playerY + 0.2, playerGroup.position.z, 30, 0x06b6d4);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) handleLaneSwitch(-1);
      if (['ArrowRight', 'KeyD'].includes(e.code)) handleLaneSwitch(1);
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        e.preventDefault();
        handleJump();
      }
      if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        handleSlide();
      }
      if (e.code === 'KeyB') handleHoverboard();
      if (e.code === 'KeyP') setIsPaused(p => !p);
    };

    window.addEventListener('keydown', onKeyDown);

    let lastTap = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const now = performance.now();
        if (now - lastTap < 300) {
          handleHoverboard();
        }
        lastTap = now;
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: now };
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 25) {
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) handleLaneSwitch(1);
          else handleLaneSwitch(-1);
        } else {
          if (dy < 0) handleJump();
          else handleSlide();
        }
      }
      touchStartRef.current = null;
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    // Reset Game
    const resetGame = () => {
      stateRef.current = {
        theme,
        char: selectedChar,
        distance: 0,
        coins: 0,
        multiplier: baseMultiplier,
        speed: 40,
        maxSpeed: 100,
        isGameOver: false,
        isPaused: false,
        vsComputer,
        rivalZ: 0,
        rivalX: 3.3,
        rivalLane: 1,
        rivalTargetX: 3.3,
        rivalSpeed: 40,
        rivalCrashed: false,
        rivalVy: 0,
        rivalY: 0,
        rivalIsJumping: false,
        jumpsCount: 0,
        slidesCount: 0,
        hoverboardsCount: 0,
        hoverboard: false,
        hoverboardStock: inventory?.hoverboards ?? 3,
        headstartsStock: inventory?.headstarts ?? 1,
        magnetTime: 0,
        sneakersTime: 0,
        jetpackTime: 0,
        multiplierTime: 0,
        resurrectWings: (inventory?.resurrectWings ?? 1) > 0,
        magnetLevel: inventory?.magnetLevel || 1,
        sneakersLevel: inventory?.sneakersLevel || 1,
        jetpackLevel: inventory?.jetpackLevel || 1,
        multiplierLevel: inventory?.multiplierLevel || 1,
        currentLane: 0,
        targetLaneX: 0,
        playerX: 0,
        playerY: 0,
        groundY: 0,
        vy: 0,
        isJumping: false,
        isSliding: false,
        slideTimer: 0,
        stumbleTimer: 0,
        chaserDistance: 5.0,
        lastBarkTime: 0,
        lastHonkTime: 0,
      };

      trains.forEach(t => scene.remove(t.mesh));
      trains = [];
      hazards.forEach(h => scene.remove(h.mesh));
      hazards = [];
      coins.forEach(c => scene.remove(c.mesh));
      coins = [];
      powerups.forEach(p => scene.remove(p.mesh));
      powerups = [];

      nextSpawnZ = 35;
      playerGroup.position.set(0, 0, 0);
      rivalGroup.position.set(LANES[2], 0, 0);
      rivalGroup.visible = vsComputer;
      hoverboardGroup.visible = false;
      jetpackGroup.visible = false;

      setIsGameOver(false);
      setDistance(0);
      setRivalDistance(0);
      setRivalStatus('racing');
      setCoinsCollected(0);
      setMultiplier(baseMultiplier);
      setActiveHoverboard(false);
      setHoverboardCount(3);
      setActiveMagnet(0);
      setActiveSneakers(0);
      setActiveJetpack(0);
      setActiveMultiplier(0);
      setHasResurrectWings(true);
      setRecentReward(null);
    };
    resetGameRef.current = resetGame;

    // 13. Main Animation & Physics Loop
    let lastTime = performance.now();
    let runAnimTime = 0;
    let rivalAnimTime = 0;
    let rivalDecisionTimer = 0;

    const animate = (currentTime: number) => {
      animFrameId = requestAnimationFrame(animate);
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const st = stateRef.current;
      if (st.isGameOver || isPaused) {
        renderer.render(scene, camera);
        return;
      }

      // Acceleration with distance
      if (st.speed < st.maxSpeed) st.speed += dt * 0.5;

      const currentMult = (baseMultiplier + Math.min(29, Math.floor(st.distance / 150))) * (st.multiplierTime > 0 ? 2 : 1);
      st.multiplier = currentMult;
      setMultiplier(currentMult);

      const forwardM = st.speed * dt;
      st.distance += forwardM;
      playerGroup.position.z += forwardM;
      setDistance(Math.floor(st.distance));
      onTaskProgress?.('distance', forwardM);

      // Player Lane Lerp
      st.playerX += (st.targetLaneX - st.playerX) * Math.min(dt * 15, 1.0);
      playerGroup.position.x = st.playerX;
      playerGroup.rotation.z = (st.playerX - st.targetLaneX) * 0.19;
      playerGroup.rotation.y = (st.targetLaneX - st.playerX) * 0.22;

      // Check if Player is on TOP of a train roof
      const pZ = playerGroup.position.z;
      let onTrainRoof = false;

      trains.forEach(train => {
        const laneX = LANES[train.lane + 1];
        const isSameLane = Math.abs(st.playerX - laneX) < 1.35;
        const dz = pZ - train.z;
        if (isSameLane && dz > -11 && dz < 11) {
          if (train.hasRamp || st.playerY >= 3.3) onTrainRoof = true;
        }
      });
      st.groundY = onTrainRoof ? 3.7 : 0;

      // Jetpack Flight
      if (st.jetpackTime > 0) {
        st.jetpackTime -= dt;
        setActiveJetpack(Math.ceil(st.jetpackTime));
        jetpackGroup.visible = true;
        st.playerY += (14.0 - st.playerY) * (dt * 6.5);
        triggerBurst(st.playerX - 0.2, st.playerY + 1.2, pZ - 0.5, 3, 0xf43f5e);
        triggerBurst(st.playerX + 0.2, st.playerY + 1.2, pZ - 0.5, 3, 0xfacc15);
      } else {
        jetpackGroup.visible = false;
        if (st.isJumping || st.playerY > st.groundY) {
          st.vy -= 36 * dt;
          st.playerY += st.vy * dt;
          if (st.playerY <= st.groundY) {
            st.playerY = st.groundY;
            st.vy = 0;
            st.isJumping = false;
            triggerBurst(st.playerX, st.playerY + 0.1, pZ, 8, 0x94a3b8);
          }
        } else {
          st.playerY = st.groundY;
        }
      }

      playerGroup.position.y = st.playerY;

      // Slide roll animation
      if (st.isSliding) {
        st.slideTimer -= dt;
        torso.rotation.x = -Math.PI / 2.2;
        torso.position.y = 0.55;
        head.position.y = 0.55;
        if (st.slideTimer <= 0) {
          st.isSliding = false;
          torso.rotation.x = 0;
          torso.position.y = 1.3;
          head.position.y = 2.1;
        }
      }

      // Player Running animation
      if (!st.isJumping && !st.isSliding && st.jetpackTime <= 0) {
        runAnimTime += dt * (st.speed * 0.42);
        leftLeg.rotation.x = Math.sin(runAnimTime) * 0.8;
        rightLeg.rotation.x = -Math.sin(runAnimTime) * 0.8;
        leftArm.rotation.x = -Math.sin(runAnimTime) * 0.8;
        rightArm.rotation.x = Math.sin(runAnimTime) * 0.8;
        torso.position.y = 1.3 + Math.abs(Math.sin(runAnimTime * 2)) * 0.1;
      }

      // ==========================================
      // VS COMPUTER RIVAL BOT AI & PHYSICS
      // ==========================================
      if (st.vsComputer && !st.rivalCrashed) {
        rivalGroup.visible = true;

        // Computer bot smart speed & rubber-banding
        const distDiff = pZ - st.rivalZ;
        // Pacing: speed up slightly if behind, ease off slightly if far ahead
        const targetBotSpeed = st.speed + (distDiff > 5 ? 2.5 : distDiff < -10 ? -2.0 : 0.5);
        st.rivalSpeed += (targetBotSpeed - st.rivalSpeed) * (dt * 2.0);
        st.rivalZ += st.rivalSpeed * dt;
        setRivalDistance(Math.floor(st.rivalZ));

        // Update race status banner
        if (st.rivalZ < pZ - 8) setRivalStatus('behind');
        else if (st.rivalZ > pZ + 8) setRivalStatus('ahead');
        else setRivalStatus('racing');

        // Computer AI obstacle avoidance & lane switching
        rivalDecisionTimer -= dt;
        if (rivalDecisionTimer <= 0) {
          rivalDecisionTimer = 0.35 + Math.random() * 0.4;
          // Check upcoming hazards in rival's lane within 28m
          const obstacleAhead = hazards.some(h => h.lane === st.rivalLane && h.z > st.rivalZ && h.z < st.rivalZ + 28) ||
                               trains.some(t => t.lane === st.rivalLane && t.z > st.rivalZ - 6 && t.z < st.rivalZ + 24 && !t.hasRamp);

          if (obstacleAhead) {
            // Find clear lane
            const possibleLanes = [-1, 0, 1].filter(l => l !== st.rivalLane);
            const clearLane = possibleLanes.find(l => 
              !hazards.some(h => h.lane === l && Math.abs(h.z - st.rivalZ) < 22) &&
              !trains.some(t => t.lane === l && Math.abs(t.z - st.rivalZ) < 22 && !t.hasRamp)
            );

            if (clearLane !== undefined) {
              st.rivalLane = clearLane;
              st.rivalTargetX = LANES[clearLane + 1];
            } else if (!st.rivalIsJumping) {
              // Jump over!
              st.rivalVy = 16.0;
              st.rivalIsJumping = true;
            }
          }
        }

        // Rival Lane Lerp
        st.rivalX += (st.rivalTargetX - st.rivalX) * Math.min(dt * 14, 1.0);
        rivalGroup.position.x = st.rivalX;
        rivalGroup.position.z = st.rivalZ;

        // Rival Jumping Physics
        if (st.rivalIsJumping || st.rivalY > 0) {
          st.rivalVy -= 36 * dt;
          st.rivalY += st.rivalVy * dt;
          if (st.rivalY <= 0) {
            st.rivalY = 0;
            st.rivalVy = 0;
            st.rivalIsJumping = false;
          }
        }
        rivalGroup.position.y = st.rivalY;

        // Rival running limb swing
        rivalAnimTime += dt * (st.rivalSpeed * 0.42);
        rivalLeftLeg.rotation.x = Math.sin(rivalAnimTime) * 0.8;
        rivalRightLeg.rotation.x = -Math.sin(rivalAnimTime) * 0.8;
        beacon.rotation.y += dt * 3.0;

        // Check if rival bot hits oncoming train head-on (small chance of AI miscalculation!)
        trains.forEach(t => {
          if (t.lane === st.rivalLane && Math.abs(t.z - st.rivalZ) < 6 && !t.hasRamp && st.rivalY < 2.5) {
            // Rival bot crashes!
            st.rivalCrashed = true;
            setRivalStatus('crashed');
            sound.playExplosion();
            triggerBurst(st.rivalX, st.rivalY + 1.2, st.rivalZ, 50, 0x9333ea);
            rivalGroup.visible = false;
            confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 } });
            setRecentReward('RIVAL CRASHED! +250 CREDITS');
            st.coins += 250;
            setCoinsCollected(st.coins);
            setTimeout(() => setRecentReward(null), 3500);
          }
        });
      } else if (!st.vsComputer) {
        rivalGroup.visible = false;
      }

      // Camera Follow
      camera.position.x += (st.playerX * 0.65 - camera.position.x) * (dt * 8);
      camera.position.z = pZ - (st.jetpackTime > 0 ? 10.5 : 7.5);
      camera.position.y = 5.2 + st.playerY * 0.5;
      camera.lookAt(st.playerX * 0.35, 1.8 + st.playerY * 0.4, pZ + 14);

      playerPointLight.position.set(st.playerX, st.playerY + 2.0, pZ + 1);

      // Chaser Animation & Follow
      if (st.stumbleTimer > 0) {
        st.stumbleTimer -= dt;
        st.chaserDistance = Math.max(1.8, st.chaserDistance - dt * 5.5);
        if (currentTime - st.lastBarkTime > 2500) {
          st.lastBarkTime = currentTime;
          if (st.theme === 'subway') sound.playDogBark();
          else sound.playDemonRoar();
        }
      } else {
        st.chaserDistance = Math.min(5.2, st.chaserDistance + dt * 1.8);
      }
      chaserGroup.position.x += (st.playerX - chaserGroup.position.x) * (dt * 7);
      chaserGroup.position.z = pZ - st.chaserDistance;

      // Recycle track chunks
      trackSegments.forEach(seg => {
        if (seg.position.z < pZ - SEGMENT_LENGTH * 1.5) {
          seg.position.z += SEGMENT_LENGTH * TOTAL_SEGMENTS;
        }
      });

      // Spawn track hazards & rewards
      spawnTrackObjects(pZ);

      // Coins Collection
      coins.forEach(coin => {
        if (coin.collected) return;
        coin.mesh.rotation.z += dt * 3.5;

        if (st.magnetTime > 0 && Math.abs(coin.z - pZ) < 26) {
          coin.mesh.position.x += (st.playerX - coin.mesh.position.x) * (dt * 10);
          coin.mesh.position.y += (st.playerY + 1.2 - coin.mesh.position.y) * (dt * 10);
        }

        const dz = Math.abs(coin.z - pZ);
        const dx = Math.abs(coin.mesh.position.x - st.playerX);
        const dy = Math.abs(coin.mesh.position.y - (st.playerY + 1.2));

        if (dz < 1.5 && dx < 1.35 && dy < 1.9) {
          coin.collected = true;
          scene.remove(coin.mesh);
          const val = coin.isGoldenIdol ? 25 : 1;
          const totalEarned = val * (st.multiplierTime > 0 ? 2 : 1);
          st.coins += totalEarned;
          setCoinsCollected(st.coins);
          onTaskProgress?.('coin', totalEarned);
          sound.playCoin();
          triggerBurst(coin.mesh.position.x, coin.mesh.position.y, coin.z, coin.isGoldenIdol ? 30 : 12, coin.isGoldenIdol ? 0xf59e0b : 0xfbbf24);
        }
      });

      // Power-up Timer Updates
      if (st.magnetTime > 0) {
        st.magnetTime -= dt;
        setActiveMagnet(Math.ceil(st.magnetTime));
      }
      if (st.sneakersTime > 0) {
        st.sneakersTime -= dt;
        setActiveSneakers(Math.ceil(st.sneakersTime));
      }
      if (st.multiplierTime > 0) {
        st.multiplierTime -= dt;
        setActiveMultiplier(Math.ceil(st.multiplierTime));
      }

      // Collect Power-ups
      powerups.forEach(pu => {
        if (pu.collected) return;
        pu.mesh.rotation.y += dt * 2.8;

        if (Math.abs(pu.z - pZ) < 1.6 && Math.abs(pu.mesh.position.x - st.playerX) < 1.4) {
          pu.collected = true;
          scene.remove(pu.mesh);
          sound.playPowerup();

          if (pu.type === 'hoverboard') {
            st.hoverboard = true;
            setActiveHoverboard(true);
            hoverboardGroup.visible = true;
            triggerBurst(st.playerX, st.playerY + 0.5, pZ, 25, 0x06b6d4);
          } else if (pu.type === 'magnet') {
            st.magnetTime = 14;
            setActiveMagnet(14);
            triggerBurst(st.playerX, st.playerY + 1.0, pZ, 25, 0x3b82f6);
          } else if (pu.type === 'sneakers') {
            st.sneakersTime = 14;
            setActiveSneakers(14);
            triggerBurst(st.playerX, st.playerY + 0.5, pZ, 25, 0x10b981);
          } else if (pu.type === 'jetpack') {
            st.jetpackTime = 10;
            setActiveJetpack(10);
            sound.playJetpack();
            triggerBurst(st.playerX, st.playerY + 1.2, pZ, 35, 0xf43f5e);
          } else if (pu.type === 'multiplier') {
            st.multiplierTime = 15;
            setActiveMultiplier(15);
            triggerBurst(st.playerX, st.playerY + 1.0, pZ, 25, 0xa855f7);
          } else if (pu.type === 'mystery') {
            sound.playMysteryBox();
            triggerBurst(st.playerX, st.playerY + 1.0, pZ, 45, 0xf59e0b);
            const rewards = ['+150 Gold Coins!', '+1 Extra Hoverboard!', '2X Score Surge!'];
            const chosen = rewards[Math.floor(Math.random() * rewards.length)];
            setRecentReward(chosen);
            setTimeout(() => setRecentReward(null), 3000);
            if (chosen.includes('Coins')) {
              st.coins += 150;
              setCoinsCollected(st.coins);
            } else if (chosen.includes('Hoverboard')) {
              st.hoverboardStock += 1;
              setHoverboardCount(st.hoverboardStock);
            } else {
              st.multiplierTime = 15;
              setActiveMultiplier(15);
            }
          }
        }
      });

      // Crash Handler
      const triggerCrash = () => {
        if (st.hoverboard) {
          st.hoverboard = false;
          setActiveHoverboard(false);
          hoverboardGroup.visible = false;
          sound.playExplosion();
          triggerBurst(st.playerX, st.playerY + 1.5, pZ, 45, 0x06b6d4);
          st.stumbleTimer = 2.5;
        } else if (st.resurrectWings) {
          st.resurrectWings = false;
          setHasResurrectWings(false);
          sound.playBullseye();
          triggerBurst(st.playerX, st.playerY + 2.0, pZ, 60, 0xfbbf24);
          st.playerY = 4.5;
          st.vy = 9.0;
          st.isJumping = true;
        } else {
          st.isGameOver = true;
          setIsGameOver(true);
          sound.playGameOver();
          if (st.theme === 'temple') sound.playDemonRoar();
          triggerBurst(st.playerX, st.playerY + 1.5, pZ, 70, 0xef4444);
          onGameOver(Math.floor(st.distance), st.coins, {
            jumps: st.jumpsCount,
            slides: st.slidesCount,
            hoverboards: st.hoverboardsCount
          });
          if (Math.floor(st.distance) > bestScore) {
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
          }
        }
      };

      // Check Train Collisions
      if (st.jetpackTime <= 0) {
        trains.forEach(t => {
          t.z -= t.speed * dt;
          t.mesh.position.z = t.z;

          if (t.speed > 0 && Math.abs(t.z - pZ) < 35 && currentTime - st.lastHonkTime > 6000) {
            st.lastHonkTime = currentTime;
            sound.playTrainHorn();
          }

          const laneX = LANES[t.lane + 1];
          const isSameLane = Math.abs(st.playerX - laneX) < 1.35;
          const dz = t.z - pZ;

          if (isSameLane && dz < 10.5 && dz > 8.5 && !t.hasRamp && st.playerY < 3.2) {
            triggerCrash();
          }
        });

        // Hazards Collisions
        hazards.forEach(h => {
          if (h.type === 'boulder' && h.speed) {
            h.z -= h.speed * dt;
            (h.mesh as THREE.Mesh).position.z = h.z;
            (h.mesh as THREE.Mesh).rotation.x -= dt * 6;
          }

          const laneX = LANES[h.lane + 1];
          const isSameLane = Math.abs(st.playerX - laneX) < 1.35;
          const dz = Math.abs(h.z - pZ);

          if (isSameLane && dz < 1.3 && st.playerY < 3.0) {
            let avoids = false;
            if (h.type === 'barrier_low' && st.playerY > 1.2) avoids = true;
            if (h.type === 'barrier_high' && st.isSliding) avoids = true;
            if (h.type === 'tree_root' && st.isSliding) avoids = true;
            if (!avoids) triggerCrash();
          }
        });
      }

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

      // Clean offscreen
      trains = trains.filter(t => t.z > pZ - 35);
      hazards = hazards.filter(h => h.z > pZ - 35);
      coins = coins.filter(c => c.z > pZ - 20);
      powerups = powerups.filter(p => p.z > pZ - 20);

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
      if (renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [theme, selectedChar, vsComputer]);

  // Headstart Boost button handler
  const handleHeadstart = () => {
    const st = stateRef.current;
    if (st.isGameOver || st.distance > 20) return;
    sound.playHeadstart();
    st.distance += 250;
    st.jetpackTime = 6;
    setActiveJetpack(6);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
  };

  const distLead = distance - Math.floor(rivalDistance);

  return (
    <div className="relative w-full h-[620px] md:h-[740px] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl select-none">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Glass HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Distance & Score Multiplier */}
          <div className="bg-neutral-950/85 backdrop-blur-md border border-neutral-800 px-3.5 py-2 rounded-xl flex items-center gap-3 text-white shadow-lg pointer-events-auto">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Distance</div>
              <div className="text-lg md:text-2xl font-bold font-mono tracking-tight text-white flex items-baseline">
                {distance}<span className="text-xs text-neutral-400 ml-0.5">m</span>
              </div>
            </div>

            <div className="h-7 w-px bg-neutral-800" />

            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-amber-400">Coins</div>
              <div className="text-lg md:text-2xl font-bold font-mono tracking-tight text-amber-400 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 fill-amber-400/20" />
                {coinsCollected}
              </div>
            </div>

            <div className="h-7 w-px bg-neutral-800" />

            <div className="hidden sm:block">
              <div className="text-[10px] uppercase font-mono tracking-wider text-purple-400">Score Mult</div>
              <div className="text-sm md:text-base font-bold font-mono text-purple-400 flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-purple-400" />
                {multiplier}x
              </div>
            </div>
          </div>

          {/* Theme Switcher */}
          <div className="bg-neutral-950/85 backdrop-blur-md border border-neutral-800 p-1 rounded-xl flex items-center gap-1 pointer-events-auto shadow-lg">
            <button
              onClick={() => {
                sound.playClick();
                setTheme('subway');
                setSelectedChar(CHARACTERS[0]);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                theme === 'subway' ? 'bg-cyan-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Train className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Subway 3D</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setTheme('temple');
                setSelectedChar(CHARACTERS[4]);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                theme === 'temple' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Temple 3D</span>
            </button>
          </div>

          {/* VS Computer Rival Toggle Button! */}
          <div className="pointer-events-auto">
            <button
              onClick={() => {
                sound.playClick();
                setVsComputer(v => !v);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-arcade font-bold flex items-center gap-1.5 transition-all shadow-lg ${
                vsComputer
                  ? 'bg-rose-500 text-white shadow-rose-500/25 border border-rose-400'
                  : 'bg-neutral-950/85 backdrop-blur-md border border-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{vsComputer ? '1v1 VS BOT [ON]' : 'VS COMPUTER'}</span>
            </button>
          </div>
        </div>

        {/* Right HUD: Powerup Badges, Character Picker, Tasks & Sound */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Character Selector Dropdown */}
          <button
            onClick={() => setShowCharSelect(!showCharSelect)}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-900/85 border border-neutral-700 text-neutral-200 text-xs font-arcade flex items-center gap-1.5 hover:border-neutral-500 transition-all shadow-md"
            title="Choose Character"
          >
            <Users className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">{selectedChar.name}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {/* Active Tasks Button */}
          {onOpenTasksModal && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenTasksModal();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-arcade flex items-center gap-1 hover:bg-cyan-900/80 transition-all"
              title="View Tasks & Missions"
            >
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Tasks</span>
            </button>
          )}

          {/* In-Game Item Shop Button */}
          {onOpenShopModal && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenShopModal();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-arcade flex items-center gap-1.5 hover:bg-amber-900/80 transition-all shadow-md shadow-amber-500/10"
              title="Open Item Shop to Buy Items & Boosters"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">SHOP ({playerCredits} CR)</span>
            </button>
          )}

          {/* Active Status Badges */}
          {activeJetpack > 0 && (
            <div className="bg-rose-500/20 border border-rose-400/40 text-rose-300 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 font-mono animate-bounce">
              <Rocket className="w-3.5 h-3.5 text-rose-400" />
              {activeJetpack}s
            </div>
          )}
          {activeHoverboard && (
            <div className="bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              Active
            </div>
          )}
          {activeMagnet > 0 && (
            <div className="bg-blue-500/20 border border-blue-400/40 text-blue-300 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 font-mono">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              {activeMagnet}s
            </div>
          )}
          {hasResurrectWings && (
            <div className="bg-amber-500/20 border border-amber-400/40 text-amber-300 px-2 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1" title="Wings of Resurrection Ready!">
              <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400/40" />
              1UP
            </div>
          )}

          <button
            onClick={() => setSoundEnabled(!sound.toggleMute())}
            className="p-2 rounded-xl bg-neutral-900/85 text-neutral-300 border border-neutral-800 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* VS Computer Rival Live Race HUD Widget */}
      {vsComputer && !isGameOver && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-neutral-950/90 border border-rose-500/40 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-4 text-xs font-arcade backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-white">
            <span className="text-cyan-400 font-bold">YOU:</span> {distance}m
          </div>
          <div className="h-4 w-px bg-neutral-700" />
          <div className="flex items-center gap-1.5 text-white">
            <span className="text-purple-400 font-bold">RIVAL BOT:</span> {Math.floor(rivalDistance)}m
          </div>
          <div className="h-4 w-px bg-neutral-700" />
          <div className={`font-bold flex items-center gap-1 ${
            rivalStatus === 'crashed' ? 'text-amber-400 animate-pulse' :
            distLead >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {rivalStatus === 'crashed' ? (
              <span>BOT CRASHED! 🏆</span>
            ) : distLead >= 0 ? (
              <>
                <Crown className="w-3.5 h-3.5 fill-emerald-400" />
                <span>+{distLead}m LEAD</span>
              </>
            ) : (
              <span>{Math.abs(distLead)}m BEHIND</span>
            )}
          </div>
        </div>
      )}

      {/* Active In-Run Task Banner */}
      {activeTask && !isGameOver && (
        <div
          onClick={onOpenTasksModal}
          className="absolute top-20 left-4 z-20 bg-neutral-950/85 backdrop-blur-md border border-cyan-500/40 hover:border-cyan-400 px-3 py-1.5 rounded-xl cursor-pointer shadow-lg flex items-center gap-2 text-xs font-arcade text-neutral-200 transition-all"
        >
          <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
          <span>{activeTask.title}</span>
          <span className="font-mono text-cyan-400 font-bold">
            [{Math.min(activeTask.target, activeTask.current)}/{activeTask.target}]
          </span>
        </div>
      )}

      {/* Floating Mystery Box / Reward Notification */}
      {recentReward && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-arcade text-xs md:text-sm font-bold px-4 py-2 rounded-xl shadow-2xl border border-yellow-200 animate-bounce flex items-center gap-2">
          <Gift className="w-4 h-4 text-neutral-950" />
          <span>{recentReward}</span>
        </div>
      )}

      {/* Character Selection Popover */}
      {showCharSelect && (
        <div className="absolute top-16 right-4 z-20 w-72 bg-neutral-950/95 border border-neutral-800 rounded-2xl p-3 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-xs font-arcade font-bold text-neutral-300">SELECT RUNNER</span>
            <span className="text-[10px] text-neutral-500 uppercase">{theme}</span>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {CHARACTERS.filter(c => c.theme === theme).map(char => (
              <div
                key={char.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedChar(char);
                  setShowCharSelect(false);
                }}
                className={`p-2 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  selectedChar.id === char.id
                    ? 'bg-rose-500/15 border-rose-500/60 text-white'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: `#${char.hoodie.toString(16).padStart(6, '0')}` }}
                >
                  {char.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                    {char.name}
                    {char.accessory && <span className="text-[9px] text-neutral-400 font-normal">({char.accessory})</span>}
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate">{char.tagline}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Headstart Booster at start of run */}
      {distance < 20 && !isGameOver && (
        <div className="absolute top-32 left-4 z-20">
          <button
            onClick={handleHeadstart}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-arcade font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-500/25 animate-pulse"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>HEADSTART +250m</span>
          </button>
        </div>
      )}

      {/* Bottom Floating Gameplay Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              const st = stateRef.current;
              const n = Math.max(-1, Math.min(1, st.currentLane - 1));
              st.currentLane = n;
              st.targetLaneX = [-3.3, 0, 3.3][n + 1];
              sound.playSwoosh();
            }}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-neutral-900/85 active:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white shadow-xl backdrop-blur-md"
            aria-label="Move Left"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => {
              const st = stateRef.current;
              const n = Math.max(-1, Math.min(1, st.currentLane + 1));
              st.currentLane = n;
              st.targetLaneX = [-3.3, 0, 3.3][n + 1];
              sound.playSwoosh();
            }}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-neutral-900/85 active:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white shadow-xl backdrop-blur-md"
            aria-label="Move Right"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* Hoverboard Action Button */}
        <div className="pointer-events-auto">
          <button
            onClick={() => {
              const st = stateRef.current;
              if (!st.hoverboard && st.hoverboardStock > 0) {
                st.hoverboard = true;
                st.hoverboardStock -= 1;
                st.hoverboardsCount += 1;
                onTaskProgress?.('hoverboard', 1);
                setActiveHoverboard(true);
                setHoverboardCount(st.hoverboardStock);
                sound.playPowerup();
              }
            }}
            className={`px-4 py-3 rounded-2xl text-xs font-arcade font-bold uppercase flex items-center gap-2 shadow-xl backdrop-blur-md border transition-all ${
              activeHoverboard
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300'
                : 'bg-neutral-900/85 border-neutral-700 hover:border-neutral-500 text-white'
            }`}
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>HOVERBOARD [{hoverboardCount}]</span>
          </button>
        </div>

        {/* Jump & Slide Roll Action Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              const st = stateRef.current;
              if (!st.isJumping) {
                st.vy = st.sneakersTime > 0 ? 22.0 : 15.0;
                st.isJumping = true;
                st.isSliding = false;
                st.jumpsCount += 1;
                onTaskProgress?.('jump', 1);
                sound.playJump();
              }
            }}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-neutral-900/85 active:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400 shadow-xl backdrop-blur-md"
            aria-label="Jump"
          >
            <ArrowUp className="w-6 h-6" />
          </button>
          <button
            onClick={() => {
              const st = stateRef.current;
              if (!st.isSliding) {
                st.isSliding = true;
                st.slideTimer = 0.75;
                st.slidesCount += 1;
                onTaskProgress?.('slide', 1);
                if (st.isJumping) st.vy = -20;
                sound.playSlide();
              }
            }}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-neutral-900/85 active:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400 shadow-xl backdrop-blur-md"
            aria-label="Slide Roll"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Game Over Modal Screen */}
      {isGameOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full rounded-2xl p-6 text-center shadow-2xl">
            <h2 className="text-3xl font-arcade font-bold text-rose-500 uppercase tracking-tight mb-2">RUN OVER</h2>
            <p className="text-sm text-neutral-400 mb-4">
              {theme === 'subway'
                ? 'The inspector and dog caught up with you on the tracks!'
                : 'The ancient demon ape lunged from the temple shadows!'}
            </p>

            {/* VS Computer Race Summary */}
            {vsComputer && (
              <div className="mb-4 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between text-xs font-arcade">
                <div className="text-left">
                  <div className="text-[10px] text-neutral-400 uppercase">Race Result vs Bot</div>
                  <div className={`font-bold mt-0.5 ${distLead >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {distLead >= 0 ? '🏆 VICTORY! YOU OUTRAN THE BOT' : 'BOT FINISHED AHEAD'}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-white">You: {distance}m</div>
                  <div className="text-neutral-400">Bot: {Math.floor(rivalDistance)}m</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-neutral-950/60 border border-neutral-800 p-3.5 rounded-xl text-center">
                <div className="text-[11px] font-mono text-neutral-400 uppercase">Distance</div>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">{distance}m</div>
              </div>
              <div className="bg-neutral-950/60 border border-neutral-800 p-3.5 rounded-xl text-center">
                <div className="text-[11px] font-mono text-neutral-400 uppercase">Coins Collected</div>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                  <Coins className="w-4 h-4 fill-amber-400/20" />
                  {coinsCollected}
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Revive button using points/credits or 1UP wings */}
              {((playerCredits || 0) >= 300 || (inventory?.resurrectWings || 0) > 0) && (
                <button
                  onClick={() => {
                    sound.playReward();
                    const success = onReviveWithCredits ? onReviveWithCredits() : true;
                    if (success) {
                      const st = stateRef.current;
                      st.isGameOver = false;
                      setIsGameOver(false);
                      st.playerY = 4.0;
                      st.vy = 8.0;
                      st.isJumping = true;
                      st.hoverboard = true;
                      setActiveHoverboard(true);
                      setRecentReward('RESURRECTED! +SHIELD ACTIVE');
                      confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
                    }
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-arcade font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 animate-pulse transition-all"
                >
                  <Heart className="w-4 h-4 fill-neutral-950" />
                  <span>REVIVE & CONTINUE (USE 1UP / 300 CR)</span>
                </button>
              )}

              {/* Open In-Game Shop */}
              {onOpenShopModal && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenShopModal();
                  }}
                  className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-600/40 font-arcade font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                  <span>BUY ITEMS & BOOSTERS ({playerCredits} CR)</span>
                </button>
              )}

              <button
                onClick={() => {
                  sound.playClick();
                  resetGameRef.current();
                }}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-arcade font-bold rounded-xl text-sm uppercase flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition-all transform hover:scale-[1.02]"
              >
                <RotateCcw className="w-4 h-4" /> RUN AGAIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
