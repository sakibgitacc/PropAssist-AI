import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  Sparkles, ChevronDown, ArrowRight, CalendarCheck, Eye,
  Compass, Layers, Building2, Sun, Moon, Maximize2, RotateCcw
} from 'lucide-react';

/* ═════════════════════════════════════════════════════════════════════════
   PROPASSIST AI — REAL-TIME 3D ARCHITECTURAL SCROLL EXPERIENCE
   (NO PRE-RENDERED VIDEO · 100% REAL-TIME WEBGL RENDERING)
   
   12-Stage Scroll Camera Sequence:
   1. HERO — Iconic 28-Storey Residential Tower establishing shot
   2. BUILDING REVEAL — 3D orbital camera sweep revealing architectural copper fins
   3. SKY VIEW — Downward swoop along cantilevered balconies from the crown
   4. BUILDING ENTRANCE — Glide to street-level porte-cochère & drop-off
   5. LOBBY — Interior walkthrough of the double-height grand arrival foyer
   6. APARTMENT — Transition into 3D architectural cutaway on Level 18
   7. LIVING ROOM — Close-up into 3.4m living room & Italian marble deck
   8. BEDROOM — Pan into master suite with warm oak headboard & ambient lighting
   9. KITCHEN — Focus on designer quartz island & barstools
   10. BALCONY — Step onto outdoor teak deck with skyline views
   11. AMENITIES — Level 24 Rooftop Infinity Pool, Cabanas & Sky Lounge
   12. FINAL CTA — Cinematic pull-back & "Book Your Site Visit" trigger
═════════════════════════════════════════════════════════════════════════ */

const STAGES = [
  {
    id: 'hero',
    stageNumber: '01 / 12',
    tag: 'Architectural Landmark',
    title: 'The Grand Orchid Residences',
    subtitle: 'An iconic 28-storey architectural high-rise standing tall on SG Highway, Ahmedabad.',
    metric: '212 m Height • 28 Storeys',
    camera: { x: 32, y: 38, z: 42 },
    lookAt: { x: 0, y: 18, z: 0 }
  },
  {
    id: 'reveal',
    stageNumber: '02 / 12',
    tag: 'Facade & Geometry',
    title: 'Sculptural Copper Fins',
    subtitle: 'Rhythmic vertical copper mullions engineered for solar shading, acoustic deflection, and timeless distinction.',
    metric: 'Acoustic Thermal Glass',
    camera: { x: -28, y: 28, z: 34 },
    lookAt: { x: 0, y: 20, z: 0 }
  },
  {
    id: 'sky-view',
    stageNumber: '03 / 12',
    tag: 'Skyline Perspective',
    title: 'Crown to Cantilevered Decks',
    subtitle: 'Gliding down from the architectural crown through sky suites and double-height private terraces.',
    metric: 'Level 28 to Level 16',
    camera: { x: 12, y: 32, z: 18 },
    lookAt: { x: 0, y: 16, z: 0 }
  },
  {
    id: 'entrance',
    stageNumber: '04 / 12',
    tag: 'Arrival Experience',
    title: 'Grand Porte-Cochère',
    subtitle: 'Covered climate-controlled arrival canopy with ambient warm LED uplighting and reflective granite pavers.',
    metric: 'Covered Vehicle Drop-Off',
    camera: { x: 0, y: 4, z: 26 },
    lookAt: { x: 0, y: 2.5, z: 4 }
  },
  {
    id: 'lobby',
    stageNumber: '05 / 12',
    tag: 'Double-Height Foyer',
    title: 'Grand Entrance Lobby',
    subtitle: 'Staffed 24/7 concierge reception, imported Italian Statuario marble, and minimalist pendant chandeliers.',
    metric: '7.2 m Ceiling Height',
    camera: { x: 2, y: 2.2, z: 10 },
    lookAt: { x: 0, y: 2, z: 0 }
  },
  {
    id: 'apartment',
    stageNumber: '06 / 12',
    tag: 'Spatial Cutaway',
    title: 'Level 18 Luxury Suite Cutaway',
    subtitle: 'Architectural cross-section revealing cross-ventilated flow, 3.4m clear height, and zoning privacy.',
    metric: '1,850 sq.ft Carpet Area',
    camera: { x: 18, y: 22, z: 16 },
    lookAt: { x: 6, y: 18, z: -2 }
  },
  {
    id: 'living',
    stageNumber: '07 / 12',
    tag: 'Curated Living Room',
    title: 'Expansive Drawing Volume',
    subtitle: 'Seamless connection to sunset balcony, designer Italian marble flooring, and concealed VRV climate ducting.',
    metric: '3.4 m Clear Span Height',
    camera: { x: 10, y: 19.5, z: 6 },
    lookAt: { x: 6, y: 18.5, z: -1 }
  },
  {
    id: 'bedroom',
    stageNumber: '08 / 12',
    tag: 'Private Master Suite',
    title: 'Quiet Master Sanctuary',
    subtitle: 'Fluted oak acoustic paneling, integrated floating headboard, walk-in dressing wardrobe, and en-suite bath.',
    metric: 'En-Suite Bathroom & Wardrobe',
    camera: { x: 3, y: 19.5, z: -2 },
    lookAt: { x: 1.5, y: 18.5, z: -6 }
  },
  {
    id: 'kitchen',
    stageNumber: '09 / 12',
    tag: 'Culinary Architecture',
    title: 'Designer Island Kitchen',
    subtitle: 'Calacatta quartz waterfall island, seamless modular cabinetry, and separate utility service balcony.',
    metric: 'Pipeline Gas & Utility Bay',
    camera: { x: 12, y: 19.5, z: -6 },
    lookAt: { x: 8, y: 18.5, z: -5 }
  },
  {
    id: 'balcony',
    stageNumber: '10 / 12',
    tag: 'Outdoor Living',
    title: 'Cantilevered Sunset Deck',
    subtitle: 'Frameless safety glass balustrade, outdoor teak decking, and unobstructed views over the green corridor.',
    metric: '270° Panoramic Horizon',
    camera: { x: 12, y: 19.2, z: 3 },
    lookAt: { x: 18, y: 18.5, z: 6 }
  },
  {
    id: 'amenities',
    stageNumber: '11 / 12',
    tag: 'Sky Clubhouse',
    title: 'Rooftop Infinity Pool & Lounge',
    subtitle: 'Level 24 heated infinity lap pool suspended over the skyline with private cabanas and lush planters.',
    metric: '45,000 sq.ft Club Volume',
    camera: { x: -16, y: 28, z: 12 },
    lookAt: { x: -6, y: 24, z: 2 }
  },
  {
    id: 'cta',
    stageNumber: '12 / 12',
    tag: 'Reserve Your Residence',
    title: 'Experience Living Beyond the Ordinary',
    subtitle: 'RERA-registered 2 & 3 BHK luxury residences from ₹68 Lakhs to ₹2.45 Cr. Transparent carpet area pricing.',
    metric: '100% RERA Registered',
    camera: { x: 26, y: 32, z: 36 },
    lookAt: { x: 0, y: 16, z: 0 }
  }
];

export default function Realtime3DScrollExperience({ onExploreProjects, onBookVisit }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [fps, setFps] = useState(60);

  // References for Three.js engine
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const targetCamPos = useRef(new THREE.Vector3(32, 38, 42));
  const currentCamPos = useRef(new THREE.Vector3(32, 38, 42));
  const targetLookAt = useRef(new THREE.Vector3(0, 18, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 18, 0));
  const targetProgress = useRef(0);
  const currentProgress = useRef(0);
  const lightsRef = useRef([]);

  // Check WebGL availability
  useEffect(() => {
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) setWebGLSupported(false);
    } catch (e) {
      setWebGLSupported(false);
    }
  }, []);

  // Initialize Three.js Real-Time Scene
  useEffect(() => {
    if (!webGLSupported) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#0A1322');
    scene.fog = new THREE.FogExp2('#0A1322', 0.012);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 300);
    camera.position.set(32, 38, 42);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 3. Lighting System
    const ambientLight = new THREE.AmbientLight('#B0C8E8', 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#FFE8C2', 2.2);
    sunLight.position.set(40, 60, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Warm Accent Spotlight on entrance
    const entranceSpot = new THREE.SpotLight('#C8814F', 4.5, 30, Math.PI / 4, 0.4);
    entranceSpot.position.set(0, 10, 12);
    entranceSpot.target.position.set(0, 0, 4);
    scene.add(entranceSpot);
    scene.add(entranceSpot.target);

    // Cyan Sky Pool Glow Light
    const poolGlow = new THREE.PointLight('#00e5ff', 3.0, 22);
    poolGlow.position.set(-6, 25, 2);
    scene.add(poolGlow);

    // Warm Interior Apartment Lights
    const aptWarmLight = new THREE.PointLight('#FFA756', 2.8, 16);
    aptWarmLight.position.set(6, 20.5, 0);
    scene.add(aptWarmLight);

    lightsRef.current = [sunLight, poolGlow, aptWarmLight];

    // 4. Build Procedural 3D Architecture
    buildArchitecturalScene(scene);

    // 5. Handle Resize
    const handleResize = () => {
      if (!canvas || !camera || !renderer) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', handleResize);

    // 6. Animation Loop (Smooth Lerping)
    let animId;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const animate = (time) => {
      animId = requestAnimationFrame(animate);

      // FPS tracking
      frameCount++;
      if (time - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (time - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = time;
      }

      // Smooth progress lerp
      const t = targetProgress.current;
      const curr = currentProgress.current;
      const nextProgress = curr + (t - curr) * 0.08;
      currentProgress.current = nextProgress;
      setScrollProgress(nextProgress);

      // Compute camera and lookAt along piecewise waypoints
      updateCameraAlongWaypoints(nextProgress);

      // Camera lerp
      currentCamPos.current.lerp(targetCamPos.current, 0.08);
      camera.position.copy(currentCamPos.current);

      currentLookAt.current.lerp(targetLookAt.current, 0.08);
      camera.lookAt(currentLookAt.current);

      // Subtle water ripple or accent pulse
      poolGlow.intensity = 2.6 + Math.sin(time * 0.003) * 0.4;

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      // Dispose geometries & materials
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, [webGLSupported]);

  // Compute Waypoints based on progress
  const updateCameraAlongWaypoints = (progress) => {
    const numSegments = STAGES.length - 1;
    const scaled = Math.max(0, Math.min(progress, 0.9999)) * numSegments;
    const idx = Math.floor(scaled);
    const segT = scaled - idx;

    setCurrentStageIdx(idx);

    const s1 = STAGES[idx];
    const s2 = STAGES[Math.min(idx + 1, STAGES.length - 1)];

    // Smooth cubic ease for segment interpolation
    const easeT = segT * segT * (3 - 2 * segT);

    targetCamPos.current.set(
      s1.camera.x + (s2.camera.x - s1.camera.x) * easeT,
      s1.camera.y + (s2.camera.y - s1.camera.y) * easeT,
      s1.camera.z + (s2.camera.z - s1.camera.z) * easeT
    );

    targetLookAt.current.set(
      s1.lookAt.x + (s2.lookAt.x - s1.lookAt.x) * easeT,
      s1.lookAt.y + (s2.lookAt.y - s1.lookAt.y) * easeT,
      s1.lookAt.z + (s2.lookAt.z - s1.lookAt.z) * easeT
    );
  };

  // Synchronize Window Scroll to Progress
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const totalScrollable = container.offsetHeight - window.innerHeight;
      if (totalScrollable > 0) {
        const scrolled = -rect.top;
        const p = Math.max(0, Math.min(1, scrolled / totalScrollable));
        targetProgress.current = p;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Jump to Stage
  const jumpToStage = (idx) => {
    const container = containerRef.current;
    if (!container) return;
    const totalScrollable = container.offsetHeight - window.innerHeight;
    const p = idx / (STAGES.length - 1);
    const targetTop = container.offsetTop + p * totalScrollable;
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

  // Procedural 3D Architectural Scene Builder
  const buildArchitecturalScene = (scene) => {
    // ── MATERIALS ──
    const copperMat = new THREE.MeshStandardMaterial({
      color: '#C8814F',
      metalness: 0.85,
      roughness: 0.28,
      envMapIntensity: 1.2
    });

    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: '#152132',
      metalness: 0.7,
      roughness: 0.4
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#1B2C46',
      metalness: 0.1,
      roughness: 0.08,
      transmission: 0.65,
      thickness: 1.2,
      transparent: true,
      opacity: 0.85
    });

    const warmGlassMat = new THREE.MeshStandardMaterial({
      color: '#FFE2B8',
      emissive: '#FF8833',
      emissiveIntensity: 0.4,
      roughness: 0.2
    });

    const concreteMat = new THREE.MeshStandardMaterial({
      color: '#D8D0C5',
      roughness: 0.85,
      metalness: 0.05
    });

    const groundMat = new THREE.MeshStandardMaterial({
      color: '#0E1724',
      roughness: 0.45,
      metalness: 0.3
    });

    const poolWaterMat = new THREE.MeshStandardMaterial({
      color: '#00D4FF',
      emissive: '#006699',
      emissiveIntensity: 0.6,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88
    });

    const woodMat = new THREE.MeshStandardMaterial({
      color: '#8A5229',
      roughness: 0.7,
      metalness: 0.1
    });

    const fabricMat = new THREE.MeshStandardMaterial({
      color: '#ECE5DA',
      roughness: 0.95,
      metalness: 0.0
    });

    // ── GROUND & URBAN CONTEXT ──
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid Floor Accents
    const gridHelper = new THREE.GridHelper(120, 60, '#1F3354', '#111D2E');
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // Distant Low-Poly City Skyline
    for (let i = 0; i < 40; i++) {
      const bH = 10 + Math.random() * 28;
      const bW = 4 + Math.random() * 6;
      const bD = 4 + Math.random() * 6;
      const bGeo = new THREE.BoxGeometry(bW, bH, bD);
      const bMat = new THREE.MeshStandardMaterial({
        color: '#0B1522',
        roughness: 0.9,
        metalness: 0.1
      });
      const bMesh = new THREE.Mesh(bGeo, bMat);

      const angle = Math.random() * Math.PI * 2;
      const dist = 38 + Math.random() * 45;
      bMesh.position.set(Math.cos(angle) * dist, bH / 2, Math.sin(angle) * dist);
      scene.add(bMesh);

      // Random warm windows on background towers
      if (Math.random() > 0.4) {
        const winGeo = new THREE.BoxGeometry(bW * 0.9, 0.4, bD * 0.9);
        const winMesh = new THREE.Mesh(winGeo, warmGlassMat);
        winMesh.position.set(bMesh.position.x, bH * 0.7, bMesh.position.z);
        scene.add(winMesh);
      }
    }

    // ── MAIN LANDMARK TOWER ──
    const towerGroup = new THREE.Group();
    scene.add(towerGroup);

    // Tower Podium Base (Levels 1-3)
    const podiumGeo = new THREE.BoxGeometry(16, 4.5, 14);
    const podium = new THREE.Mesh(podiumGeo, concreteMat);
    podium.position.set(0, 2.25, 0);
    podium.castShadow = true;
    podium.receiveShadow = true;
    towerGroup.add(podium);

    // Double Height Grand Entrance Lobby Curtain Glass
    const lobbyGlassGeo = new THREE.BoxGeometry(16.2, 4.2, 7.5);
    const lobbyGlass = new THREE.Mesh(lobbyGlassGeo, glassMat);
    lobbyGlass.position.set(0, 2.1, 3.5);
    towerGroup.add(lobbyGlass);

    // Porte-Cochère Canopy
    const canopyGeo = new THREE.BoxGeometry(12, 0.5, 8);
    const canopy = new THREE.Mesh(canopyGeo, copperMat);
    canopy.position.set(0, 4.5, 8);
    canopy.castShadow = true;
    towerGroup.add(canopy);

    // Canopy Support Columns
    [-5, 5].forEach((x) => {
      const colGeo = new THREE.CylinderGeometry(0.25, 0.25, 4.5, 16);
      const col = new THREE.Mesh(colGeo, darkMetalMat);
      col.position.set(x, 2.25, 11.5);
      col.castShadow = true;
      towerGroup.add(col);
    });

    // Tower Main Core (Levels 4 to 28)
    const coreH = 34;
    const coreGeo = new THREE.BoxGeometry(13.5, coreH, 11.5);
    const core = new THREE.Mesh(coreGeo, glassMat);
    core.position.set(0, 4.5 + coreH / 2, 0);
    core.castShadow = true;
    towerGroup.add(core);

    // Vertical Architectural Copper Fins (Lumara Rise characteristic)
    const numFins = 14;
    for (let i = 0; i < numFins; i++) {
      const finX = -6.4 + (12.8 / (numFins - 1)) * i;
      const finGeo = new THREE.BoxGeometry(0.18, coreH, 0.6);
      const finFront = new THREE.Mesh(finGeo, copperMat);
      finFront.position.set(finX, 4.5 + coreH / 2, 5.9);
      finFront.castShadow = true;
      towerGroup.add(finFront);

      const finBack = new THREE.Mesh(finGeo, copperMat);
      finBack.position.set(finX, 4.5 + coreH / 2, -5.9);
      towerGroup.add(finBack);
    }

    // Horizontal Floor Slabs & Cantilevered Balconies
    for (let fl = 0; fl < 10; fl++) {
      const flY = 6.5 + fl * 3.2;
      const slabGeo = new THREE.BoxGeometry(14.2, 0.35, 12.2);
      const slab = new THREE.Mesh(slabGeo, concreteMat);
      slab.position.set(0, flY, 0);
      slab.castShadow = true;
      towerGroup.add(slab);

      // Cantilevered corner terrace on alternating floors
      if (fl % 2 === 0) {
        const balconyGeo = new THREE.BoxGeometry(5.5, 0.35, 3.5);
        const balcony = new THREE.Mesh(balconyGeo, copperMat);
        balcony.position.set(4.5, flY, 6.8);
        balcony.castShadow = true;
        towerGroup.add(balcony);

        // Glass railing
        const railGeo = new THREE.BoxGeometry(5.4, 1.1, 0.1);
        const rail = new THREE.Mesh(railGeo, glassMat);
        rail.position.set(4.5, flY + 0.65, 8.5);
        towerGroup.add(rail);
      }
    }

    // Tower Crown / Sky Lantern
    const crownGeo = new THREE.BoxGeometry(11, 3.5, 9);
    const crown = new THREE.Mesh(crownGeo, copperMat);
    crown.position.set(0, 4.5 + coreH + 1.75, 0);
    crown.castShadow = true;
    towerGroup.add(crown);

    // ── LEVEL 24 ROOFTOP INFINITY POOL & SKY DECK ──
    const poolDeckY = 24.2;
    const poolDeckGeo = new THREE.BoxGeometry(10, 0.6, 7);
    const poolDeck = new THREE.Mesh(poolDeckGeo, woodMat);
    poolDeck.position.set(-6, poolDeckY, 2);
    poolDeck.castShadow = true;
    towerGroup.add(poolDeck);

    // Glowing Infinity Pool Basin
    const poolGeo = new THREE.BoxGeometry(6.5, 0.5, 3.8);
    const pool = new THREE.Mesh(poolGeo, poolWaterMat);
    pool.position.set(-7, poolDeckY + 0.1, 2);
    towerGroup.add(pool);

    // Sun Loungers by the pool
    for (let l = 0; l < 3; l++) {
      const loungeGeo = new THREE.BoxGeometry(1.6, 0.25, 0.7);
      const lounge = new THREE.Mesh(loungeGeo, fabricMat);
      lounge.position.set(-3 + l * 0.9, poolDeckY + 0.4, 2);
      towerGroup.add(lounge);
    }

    // ── LEVEL 18 DETAILED 3D APARTMENT CUTAWAY ──
    const aptGroup = new THREE.Group();
    aptGroup.position.set(0, 18.5, 0);
    scene.add(aptGroup);

    // Apartment Floor Slab (Marble texture)
    const aptFloorGeo = new THREE.BoxGeometry(13.2, 0.35, 11.2);
    const aptFloor = new THREE.Mesh(aptFloorGeo, concreteMat);
    aptFloor.position.set(0, 0, 0);
    aptFloor.receiveShadow = true;
    aptGroup.add(aptFloor);

    // Interior Partition Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: '#E4DDD3', roughness: 0.9 });
    
    // Living / Bedroom divider wall
    const wall1Geo = new THREE.BoxGeometry(0.25, 3.4, 6);
    const wall1 = new THREE.Mesh(wall1Geo, wallMat);
    wall1.position.set(4, 1.7, -2);
    aptGroup.add(wall1);

    // Kitchen divider wall
    const wall2Geo = new THREE.BoxGeometry(5.5, 3.4, 0.25);
    const wall2 = new THREE.Mesh(wall2Geo, wallMat);
    wall2.position.set(7, 1.7, -4);
    aptGroup.add(wall2);

    // 1. Living Room Zone: Modern Sofa & Coffee Table
    const sofaGeo = new THREE.BoxGeometry(3.2, 0.8, 1.4);
    const sofa = new THREE.Mesh(sofaGeo, fabricMat);
    sofa.position.set(6.5, 0.55, 0.5);
    sofa.castShadow = true;
    aptGroup.add(sofa);

    const tableGeo = new THREE.BoxGeometry(1.8, 0.35, 1.0);
    const table = new THREE.Mesh(tableGeo, woodMat);
    table.position.set(6.5, 0.35, 2.3);
    table.castShadow = true;
    aptGroup.add(table);

    // 2. Master Bedroom Zone: Platform Bed & Oak Headboard
    const bedGeo = new THREE.BoxGeometry(2.4, 0.65, 2.6);
    const bed = new THREE.Mesh(bedGeo, fabricMat);
    bed.position.set(1.5, 0.5, -4.5);
    bed.castShadow = true;
    aptGroup.add(bed);

    const headboardGeo = new THREE.BoxGeometry(3.0, 1.8, 0.2);
    const headboard = new THREE.Mesh(headboardGeo, woodMat);
    headboard.position.set(1.5, 1.1, -5.8);
    aptGroup.add(headboard);

    // 3. Kitchen Zone: Island Counter & Barstools
    const islandGeo = new THREE.BoxGeometry(2.8, 1.0, 1.2);
    const island = new THREE.Mesh(islandGeo, new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.2 }));
    island.position.set(9.2, 0.65, -3.2);
    island.castShadow = true;
    aptGroup.add(island);

    // 4. Balcony Deck
    const balcDeckGeo = new THREE.BoxGeometry(5.5, 0.25, 3.2);
    const balcDeck = new THREE.Mesh(balcDeckGeo, woodMat);
    balcDeck.position.set(7.5, 0.15, 6.5);
    aptGroup.add(balcDeck);

    const balcRailGeo = new THREE.BoxGeometry(5.4, 1.1, 0.1);
    const balcRail = new THREE.Mesh(balcRailGeo, glassMat);
    balcRail.position.set(7.5, 0.8, 8.0);
    aptGroup.add(balcRail);

    // Trees & Landscaped Greens at Ground Level
    for (let tr = 0; tr < 8; tr++) {
      const treeGroup = new THREE.Group();
      const trunkGeo = new THREE.CylinderGeometry(0.2, 0.25, 2.5, 8);
      const trunk = new THREE.Mesh(trunkGeo, woodMat);
      trunk.position.y = 1.25;
      treeGroup.add(trunk);

      const foliageGeo = new THREE.SphereGeometry(1.4, 8, 8);
      const foliageMat = new THREE.MeshStandardMaterial({ color: '#274732', roughness: 0.85 });
      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.y = 3.0;
      foliage.scale.set(1, 1.3, 1);
      treeGroup.add(foliage);

      const trX = -18 + tr * 5.2;
      const trZ = 14 + (tr % 2) * 4;
      treeGroup.position.set(trX, 0, trZ);
      scene.add(treeGroup);
    }
  };

  const currentStage = STAGES[currentStageIdx] || STAGES[0];

  return (
    <div id="middle-cinematic" ref={containerRef} className="relative h-[800vh] bg-[#0A1322] select-none">
      
      {/* ═════════════════════════════════════════════════════════════════════
          STICKY FULL-SCREEN REAL-TIME 3D VIEWPORT
      ═════════════════════════════════════════════ */}
      <div className="sticky top-0 w-full h-screen overflow-hidden">
        
        {/* Real-Time Three.js Canvas */}
        {webGLSupported ? (
          <canvas
            ref={canvasRef}
            className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
          />
        ) : (
          /* WebGL Fallback */
          <div className="w-full h-full flex items-center justify-center bg-[#0D1726] p-8 text-center">
            <div className="max-w-md space-y-4">
              <Building2 size={48} className="mx-auto text-[#C8814F]" />
              <h3 className="text-2xl font-display font-bold text-white">3D Visualization Mode</h3>
              <p className="text-xs text-[#A3AEC0]">
                WebGL hardware acceleration is disabled on your browser. Enjoy our 3D interactive model using any modern GPU-enabled browser.
              </p>
            </div>
          </div>
        )}

        {/* Cinematic Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1322] via-transparent to-[#0A1322]/80 pointer-events-none" />

        {/* ── TOP HUD BAR (Real-Time 3D Telemetry) ── */}
        <div className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between text-[#F3EFE8] pointer-events-none">
          
          {/* Left HUD: Stage & Metric Indicator */}
          <div className="flex items-center gap-3">
            <div className="bg-[#15233A]/90 backdrop-blur-md px-4 py-2 rounded-full border border-[#1F3354] shadow-2xl flex items-center gap-2.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C8814F] animate-ping" />
              <span className="font-display font-bold tracking-wider text-sm text-[#F3EFE8]">
                {currentStage.stageNumber}
              </span>
              <span className="text-[#C8814F] font-bold">•</span>
              <span className="text-[#A3AEC0] font-medium">{currentStage.tag}</span>
            </div>

            <div className="hidden sm:inline-flex bg-[#15233A]/85 backdrop-blur-md px-3.5 py-2 rounded-full border border-[#1F3354] text-[11px] font-mono text-emerald-400">
              ● Real-Time WebGL {fps} FPS
            </div>
          </div>

          {/* Right HUD: Demo Architectural Model Badge */}
          <div className="flex items-center gap-2.5 pointer-events-auto">
            <div className="bg-[#15233A]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#1F3354] text-[10px] uppercase font-bold text-[#A3AEC0] tracking-wider hidden md:block">
              Procedural Architectural 3D • Replaceable with GLB
            </div>

            <button
              onClick={() => jumpToStage(0)}
              className="p-2 rounded-full bg-[#15233A]/90 hover:bg-[#1f3354] border border-[#1F3354] text-[#A3AEC0] hover:text-white transition-colors"
              title="Reset 3D Camera"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* ── SYNCHRONIZED ARCHITECTURAL NARRATIVE SLIDES ── */}
        <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-12 z-20 pointer-events-none">
          <div className="max-w-2xl text-center space-y-4">
            
            {/* Tag Pill */}
            <div className="inline-flex items-center gap-2 bg-[#15233A]/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#1F3354] text-xs uppercase font-extrabold tracking-[0.25em] text-[#C8814F] shadow-xl">
              <Sparkles size={12} />
              <span>{currentStage.tag}</span>
            </div>

            {/* Stage Title */}
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-display font-bold text-[#F3EFE8] leading-[1.08] tracking-tight drop-shadow-2xl">
              {currentStage.title}
            </h2>

            {/* Stage Subtitle */}
            <p className="text-base sm:text-xl text-[#ECE5DA] font-body max-w-xl mx-auto leading-relaxed drop-shadow-lg">
              {currentStage.subtitle}
            </p>

            {/* Verified Highlight Badge */}
            <div className="inline-block bg-[#0D1726]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#1F3354] text-xs font-mono text-[#C8814F] shadow-lg">
              {currentStage.metric}
            </div>

            {/* Final CTA Buttons (Stage 12) */}
            {currentStageIdx >= 10 && (
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4 pointer-events-auto">
                <button
                  onClick={onExploreProjects}
                  className="bg-[#C8814F] hover:bg-[#b67040] text-white text-xs font-bold px-8 py-4 rounded-full shadow-2xl transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
                >
                  <span>Explore Residences</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={onBookVisit}
                  className="bg-[#15233A] hover:bg-[#1f3354] text-[#F3EFE8] border border-[#1F3354] text-xs font-bold px-8 py-4 rounded-full transition-all flex items-center gap-2 shadow-2xl transform hover:scale-105 active:scale-95"
                >
                  <CalendarCheck size={14} className="text-[#C8814F]" />
                  <span>Book a Site Visit</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM HUD: INTERACTIVE TIMELINE SCRUBBER ── */}
        <div className="absolute bottom-6 left-6 right-6 z-30 flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto">
          
          {/* Stage Waypoint Pills */}
          <div className="bg-[#15233A]/90 backdrop-blur-md p-1.5 rounded-full border border-[#1F3354] shadow-2xl flex items-center gap-1 overflow-x-auto max-w-full">
            {STAGES.map((s, idx) => {
              const isActive = currentStageIdx === idx;
              return (
                <button
                  key={s.id}
                  onClick={() => jumpToStage(idx)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#C8814F] text-white shadow-md scale-105'
                      : 'text-[#A3AEC0] hover:text-white'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Scroll Down Cue */}
          <div className="bg-[#15233A]/90 backdrop-blur-md px-4 py-2 rounded-full border border-[#1F3354] shadow-2xl flex items-center gap-2 text-xs text-[#A3AEC0]">
            <ChevronDown size={14} className="animate-bounce text-[#C8814F]" />
            <span className="text-[11px] font-semibold text-[#ECE5DA]">
              Scroll down to explore 3D architecture
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
