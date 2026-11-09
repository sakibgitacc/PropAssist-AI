import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Eye, Compass, Layers, Maximize2, Sparkles, ChevronRight, Home, Bed, Sofa, Sun } from 'lucide-react';

/* ═════════════════════════════════════════════════════════════════════════
   CINEMATIC 3D ARCHITECTURAL WALKTHROUGH
   Three.js procedural luxury villa with scroll-driven camera choreography
   and interactive room navigation (Exterior -> Foyer -> Living -> Master -> Balcony)
═════════════════════════════════════════════════════════════════════════ */

const SCENES = [
  { id: 'exterior', name: 'Exterior & Pool', tag: 'Scene 1', camera: { pos: [14, 8, 16], target: [0, 2.5, 0] }, desc: 'Modern multi-tiered luxury villa with infinity pool and outdoor terrace' },
  { id: 'entrance', name: 'Grand Entrance', tag: 'Scene 2', camera: { pos: [5, 3.2, 9], target: [0, 2.2, 0] }, desc: 'Floating stone walkway, water features and illuminated portal' },
  { id: 'living', name: 'Living Lounge', tag: 'Scene 3', camera: { pos: [-0.5, 2.1, 2.5], target: [2.5, 1.8, -1] }, desc: 'Double-height glass pavilion with designer seating and warm lighting' },
  { id: 'master', name: 'Master Suite', tag: 'Scene 4', camera: { pos: [1.2, 5.2, 3.2], target: [0, 4.8, -2] }, desc: 'Upper-level sanctuary with panoramic glass walls and private balcony' },
  { id: 'terrace', name: 'Sky Terrace', tag: 'Scene 5', camera: { pos: [6, 7.5, 7], target: [0, 5, 0] }, desc: 'Rooftop solarium overlooking landscaped gardens and sunset horizon' }
];

export default function CinematicWalkthrough3D({ scrollProgress = 0, onExploreProject, className = '' }) {
  const containerRef = useRef(null);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isInteractive, setIsInteractive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const sceneStateRef = useRef({ activeIndex: 0, targetCam: SCENES[0].camera, currentCam: { pos: [...SCENES[0].camera.pos], target: [...SCENES[0].camera.target] } });

  // Update target camera when active scene changes
  const switchScene = (index) => {
    setActiveSceneIndex(index);
    sceneStateRef.current.activeIndex = index;
    sceneStateRef.current.targetCam = SCENES[index].camera;
  };

  // Sync scroll progress to scenes when not manually locked
  useEffect(() => {
    if (isInteractive) return;
    const clampedProgress = Math.max(0, Math.min(1, scrollProgress));
    const targetIdx = Math.min(SCENES.length - 1, Math.floor(clampedProgress * SCENES.length));
    if (targetIdx !== sceneStateRef.current.activeIndex) {
      setActiveSceneIndex(targetIdx);
      sceneStateRef.current.activeIndex = targetIdx;
      sceneStateRef.current.targetCam = SCENES[targetIdx].camera;
    }
  }, [scrollProgress, isInteractive]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL support
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLSupported(false);
        return;
      }
    } catch (e) {
      setWebGLSupported(false);
      return;
    }

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFDF8F3);
    scene.fog = new THREE.FogExp2(0xFDF8F3, 0.015);

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(...SCENES[0].camera.pos);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xFFF9F2, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFFF5E6, 1.4);
    sunLight.position.set(18, 22, 14);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 60;
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 15;
    sunLight.shadow.camera.bottom = -15;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xD8C2B0, 0.5);
    fillLight.position.set(-12, 14, -8);
    scene.add(fillLight);

    // Warm interior glow lights
    const interiorLight1 = new THREE.PointLight(0xFFB066, 1.2, 12);
    interiorLight1.position.set(0, 2.2, 0);
    scene.add(interiorLight1);

    const interiorLight2 = new THREE.PointLight(0xFFCA88, 1.0, 10);
    interiorLight2.position.set(0, 5.0, -1);
    scene.add(interiorLight2);

    // 3. Materials
    const whiteWallMat = new THREE.MeshStandardMaterial({
      color: 0xFAFAFA,
      roughness: 0.25,
      metalness: 0.05
    });

    const warmWoodMat = new THREE.MeshStandardMaterial({
      color: 0x966F4A,
      roughness: 0.45,
      metalness: 0.1
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x241C18,
      roughness: 0.3,
      metalness: 0.4
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xE8F4F8,
      transparent: true,
      opacity: 0.38,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.5,
      reflectivity: 0.9
    });

    const poolWaterMat = new THREE.MeshStandardMaterial({
      color: 0x22A6B3,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85
    });

    const lawnMat = new THREE.MeshStandardMaterial({
      color: 0x587E4B,
      roughness: 0.8,
      metalness: 0.0
    });

    const stoneFloorMat = new THREE.MeshStandardMaterial({
      color: 0xDDD3C7,
      roughness: 0.6,
      metalness: 0.05
    });

    // 4. Procedural Architectural Villa Group
    const villaGroup = new THREE.Group();

    // Ground Platform
    const groundGeo = new THREE.BoxGeometry(28, 0.6, 24);
    const groundMesh = new THREE.Mesh(groundGeo, stoneFloorMat);
    groundMesh.position.y = -0.3;
    groundMesh.receiveShadow = true;
    villaGroup.add(groundMesh);

    // Surrounding Lawn
    const lawnGeo = new THREE.PlaneGeometry(50, 45);
    const lawnMesh = new THREE.Mesh(lawnGeo, lawnMat);
    lawnMesh.rotation.x = -Math.PI / 2;
    lawnMesh.position.y = -0.31;
    lawnMesh.receiveShadow = true;
    villaGroup.add(lawnMesh);

    // Swimming Pool
    const poolGeo = new THREE.BoxGeometry(9, 0.4, 6);
    const poolMesh = new THREE.Mesh(poolGeo, poolWaterMat);
    poolMesh.position.set(4.5, 0.05, 4.5);
    poolMesh.receiveShadow = true;
    villaGroup.add(poolMesh);

    // Pool Deck (Wood)
    const deckGeo = new THREE.BoxGeometry(11, 0.15, 8);
    const deckMesh = new THREE.Mesh(deckGeo, warmWoodMat);
    deckMesh.position.set(4.5, -0.05, 4.5);
    deckMesh.receiveShadow = true;
    villaGroup.add(deckMesh);

    // Stepping stones over pool edge
    for (let i = 0; i < 4; i++) {
      const stoneGeo = new THREE.BoxGeometry(1.2, 0.18, 0.8);
      const stoneMesh = new THREE.Mesh(stoneGeo, stoneFloorMat);
      stoneMesh.position.set(0.5 + i * 1.5, 0.12, 1.8);
      stoneMesh.castShadow = true;
      stoneMesh.receiveShadow = true;
      villaGroup.add(stoneMesh);
    }

    // --- LEVEL 1 (Ground Floor Living Pavilion) ---
    // Concrete slabs & ceilings
    const l1FloorGeo = new THREE.BoxGeometry(11, 0.4, 9);
    const l1Floor = new THREE.Mesh(l1FloorGeo, whiteWallMat);
    l1Floor.position.set(-1.5, 0.2, -0.5);
    l1Floor.receiveShadow = true;
    villaGroup.add(l1Floor);

    const l1CeilGeo = new THREE.BoxGeometry(13, 0.4, 10.5);
    const l1Ceil = new THREE.Mesh(l1CeilGeo, whiteWallMat);
    l1Ceil.position.set(-1, 3.2, 0);
    l1Ceil.castShadow = true;
    l1Ceil.receiveShadow = true;
    villaGroup.add(l1Ceil);

    // Back & Side Solid Walls
    const backWallGeo = new THREE.BoxGeometry(11, 3.0, 0.3);
    const backWall = new THREE.Mesh(backWallGeo, whiteWallMat);
    backWall.position.set(-1.5, 1.7, -4.8);
    backWall.castShadow = true;
    villaGroup.add(backWall);

    const leftWallGeo = new THREE.BoxGeometry(0.3, 3.0, 9);
    const leftWall = new THREE.Mesh(leftWallGeo, whiteWallMat);
    leftWall.position.set(-6.8, 1.7, -0.5);
    leftWall.castShadow = true;
    villaGroup.add(leftWall);

    // Glass Front & Patio Openings
    const l1GlassGeo = new THREE.BoxGeometry(8, 2.7, 0.08);
    const l1Glass = new THREE.Mesh(l1GlassGeo, glassMat);
    l1Glass.position.set(0.5, 1.7, 3.9);
    villaGroup.add(l1Glass);

    // Interior Furniture: Sofa & Coffee Table
    const sofaBaseGeo = new THREE.BoxGeometry(3.6, 0.6, 1.6);
    const sofaBase = new THREE.Mesh(sofaBaseGeo, warmWoodMat);
    sofaBase.position.set(-2, 0.6, 0.5);
    sofaBase.castShadow = true;
    villaGroup.add(sofaBase);

    const sofaBackGeo = new THREE.BoxGeometry(3.6, 0.8, 0.4);
    const sofaBack = new THREE.Mesh(sofaBackGeo, darkTrimMat);
    sofaBack.position.set(-2, 1.1, -0.1);
    sofaBack.castShadow = true;
    villaGroup.add(sofaBack);

    const tableGeo = new THREE.BoxGeometry(1.8, 0.4, 0.9);
    const tableMesh = new THREE.Mesh(tableGeo, whiteWallMat);
    tableMesh.position.set(-2, 0.45, 2.0);
    tableMesh.castShadow = true;
    villaGroup.add(tableMesh);

    // --- LEVEL 2 (Upper Cantilevered Master Suite) ---
    const l2FloorGeo = new THREE.BoxGeometry(11.5, 0.4, 9.5);
    const l2Floor = new THREE.Mesh(l2FloorGeo, whiteWallMat);
    l2Floor.position.set(0.5, 3.6, -1);
    l2Floor.castShadow = true;
    l2Floor.receiveShadow = true;
    villaGroup.add(l2Floor);

    const l2CeilGeo = new THREE.BoxGeometry(12.5, 0.4, 10.5);
    const l2Ceil = new THREE.Mesh(l2CeilGeo, whiteWallMat);
    l2Ceil.position.set(1.0, 6.4, -0.8);
    l2Ceil.castShadow = true;
    villaGroup.add(l2Ceil);

    // Upper Master Glass Balcony Railing
    const balustradeGeo = new THREE.BoxGeometry(8.5, 1.0, 0.06);
    const balustrade = new THREE.Mesh(balustradeGeo, glassMat);
    balustrade.position.set(2.0, 4.3, 3.6);
    villaGroup.add(balustrade);

    const handrailGeo = new THREE.BoxGeometry(8.6, 0.08, 0.12);
    const handrail = new THREE.Mesh(handrailGeo, darkTrimMat);
    handrail.position.set(2.0, 4.8, 3.6);
    villaGroup.add(handrail);

    // Master Bedroom Glass Wall
    const l2GlassGeo = new THREE.BoxGeometry(7.5, 2.4, 0.08);
    const l2Glass = new THREE.Mesh(l2GlassGeo, glassMat);
    l2Glass.position.set(1.5, 5.0, 1.0);
    villaGroup.add(l2Glass);

    // Bed in Master Suite
    const bedGeo = new THREE.BoxGeometry(2.4, 0.6, 2.8);
    const bedMesh = new THREE.Mesh(bedGeo, whiteWallMat);
    bedMesh.position.set(0.8, 4.0, -1.8);
    bedMesh.castShadow = true;
    villaGroup.add(bedMesh);

    const headboardGeo = new THREE.BoxGeometry(2.6, 1.4, 0.3);
    const headboardMesh = new THREE.Mesh(headboardGeo, warmWoodMat);
    headboardMesh.position.set(0.8, 4.4, -3.1);
    headboardMesh.castShadow = true;
    villaGroup.add(headboardMesh);

    // --- LEVEL 3 (Penthouse Pergola & Roof Garden) ---
    const pergolaLouverCount = 7;
    for (let i = 0; i < pergolaLouverCount; i++) {
      const louverGeo = new THREE.BoxGeometry(0.12, 0.35, 6);
      const louverMesh = new THREE.Mesh(louverGeo, darkTrimMat);
      louverMesh.position.set(-1.5 + i * 0.8, 6.7, -1);
      louverMesh.castShadow = true;
      villaGroup.add(louverMesh);
    }

    // Modern Landscaping: Green shrubs around perimeter
    const shrubGeo = new THREE.DodecahedronGeometry(0.55, 1);
    const shrubMat = new THREE.MeshStandardMaterial({ color: 0x3E6B34, roughness: 0.85 });
    const shrubPositions = [
      [-6.5, 0.4, 4.5], [-5.2, 0.4, 4.8], [9.2, 0.4, 1.2],
      [9.5, 0.4, 5.5], [6.0, 0.4, 8.5], [2.0, 0.4, 7.8],
      [-6.0, 0.4, -5.5], [8.0, 0.4, -4.5]
    ];
    shrubPositions.forEach(([x, y, z]) => {
      const shrub = new THREE.Mesh(shrubGeo, shrubMat);
      shrub.position.set(x, y, z);
      shrub.scale.set(1 + Math.random() * 0.4, 0.9 + Math.random() * 0.5, 1 + Math.random() * 0.4);
      shrub.castShadow = true;
      villaGroup.add(shrub);
    });

    scene.add(villaGroup);

    // 5. Smooth Camera Lerp Loop
    let animationFrameId;
    let clock = new THREE.Clock();
    const currentLookAt = new THREE.Vector3(...SCENES[0].camera.target);
    const targetLookAt = new THREE.Vector3(...SCENES[0].camera.target);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Gentle water ripple simulation
      poolMesh.position.y = 0.05 + Math.sin(elapsedTime * 2.5) * 0.02;

      // Camera interpolation (lerp) toward target waypoint
      const targetPos = sceneStateRef.current.targetCam.pos;
      targetLookAt.set(...sceneStateRef.current.targetCam.target);

      // Subtle float breathing motion
      const floatX = Math.sin(elapsedTime * 0.5) * 0.15;
      const floatY = Math.cos(elapsedTime * 0.7) * 0.1;

      camera.position.x += (targetPos[0] + floatX - camera.position.x) * 0.045;
      camera.position.y += (targetPos[1] + floatY - camera.position.y) * 0.045;
      camera.position.z += (targetPos[2] - camera.position.z) * 0.045;

      currentLookAt.lerp(targetLookAt, 0.05);
      camera.lookAt(currentLookAt);

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const currentScene = SCENES[activeSceneIndex];

  return (
    <div className={`relative rounded-3xl overflow-hidden bg-[#FDF8F3] border border-[#EADBCE] shadow-2xl ${className}`} style={{ minHeight: 460 }}>
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ minHeight: 460 }}
      />

      {/* Top Floating Badge: Architectural HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-[#291C16]/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Cinematic 3D Walkthrough</span>
          <span className="text-[#DAC4B3]">• {currentScene.tag}</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsInteractive(!isInteractive)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 ${
              isInteractive ? 'bg-[#291C16] text-white' : 'bg-white/90 text-[#291C16] hover:bg-white'
            }`}
          >
            <Compass size={13} />
            {isInteractive ? 'Manual Mode' : 'Scroll Synced'}
          </button>
        </div>
      </div>

      {/* Bottom Scene Navigation Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-[#EADBCE] shadow-xl">
          <div className="flex items-center justify-between mb-2 px-1">
            <div>
              <h4 className="text-sm font-bold text-[#291C16]">{currentScene.name}</h4>
              <p className="text-[11px] text-[#7C6D63] line-clamp-1">{currentScene.desc}</p>
            </div>
            {onExploreProject && (
              <button
                onClick={onExploreProject}
                className="bg-[#291C16] hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
              >
                <span>View Specs</span>
                <ChevronRight size={13} />
              </button>
            )}
          </div>

          {/* Quick Scene Buttons */}
          <div className="grid grid-cols-5 gap-1.5 pt-1 border-t border-[#F2E8DF]">
            {SCENES.map((s, idx) => {
              const isActive = idx === activeSceneIndex;
              return (
                <button
                  key={s.id}
                  onClick={() => switchScene(idx)}
                  className={`py-1.5 px-2 rounded-xl text-center text-[11px] font-semibold transition-all ${
                    isActive
                      ? 'bg-[#291C16] text-white shadow-sm'
                      : 'bg-[#F7F1EB] text-[#635348] hover:bg-[#EADBCE]'
                  }`}
                >
                  {s.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
