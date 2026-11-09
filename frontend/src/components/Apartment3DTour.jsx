import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Eye, RotateCcw, Maximize2, Compass, Layers, Sparkles, Check, Home } from 'lucide-react';

/* ═════════════════════════════════════════════════════════════════════════
   LUMARA RISE — INTERACTIVE 3D APARTMENT EXPLORER (Three.js + OrbitControls)
   Level 30 • Home 3001 (1,640 sq ft • Sea & Sea Link View)
═════════════════════════════════════════════════════════════════════════ */

const ROOMS = [
  { id: 'living', name: 'Living & Sea Deck', pos: [0, 2.2, 5.5], target: [0, 1.8, 0], desc: 'Double-height panoramic glass deck overlooking the Arabian Sea and Sea Link.' },
  { id: 'master', name: 'Master Suite', pos: [-3.8, 2.2, -1.2], target: [-3.8, 1.8, -4], desc: 'Spacious sanctuary with bespoke headboard, private dressing room, and en-suite bath.' },
  { id: 'kitchen', name: 'Gourmet Kitchen', pos: [3.8, 2.0, -1.5], target: [3.8, 1.6, -4], desc: 'Italian quartz island, integrated Miele appliances, and closed wet-kitchen pantry.' },
  { id: 'foyer', name: 'Private Lift Lobby', pos: [0, 2.2, -5.5], target: [0, 1.8, -2], desc: 'Exclusive access portal directly from dual high-speed elevators.' }
];

export default function Apartment3DTour({ onBookViewing, className = '' }) {
  const mountRef = useRef(null);
  const [activeRoom, setActiveRoom] = useState('living');
  const [viewMode, setViewMode] = useState('3d'); // '3d' | 'plan'
  const [activePlan, setActivePlan] = useState('3bhk'); // '3bhk' | '4bhk' | 'villa'
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);

  const handleRoomSelect = (room) => {
    setActiveRoom(room.id);
    if (cameraRef.current && controlsRef.current) {
      // Smoothly animate camera to target room
      const cam = cameraRef.current;
      const targetPos = new THREE.Vector3(...room.pos);
      const targetLook = new THREE.Vector3(...room.target);

      let t = 0;
      const startPos = cam.position.clone();
      const startTarget = controlsRef.current.target.clone();

      const anim = () => {
        t += 0.04;
        if (t <= 1) {
          cam.position.lerpVectors(startPos, targetPos, t);
          controlsRef.current.target.lerpVectors(startTarget, targetLook, t);
          controlsRef.current.update();
          requestAnimationFrame(anim);
        }
      };
      anim();
    }
  };

  useEffect(() => {
    if (viewMode !== '3d') return;
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0D1726);
    scene.fog = new THREE.FogExp2(0x0D1726, 0.025);

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 6.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 1.5;
    controls.maxDistance = 14;
    controls.target.set(0, 1.8, 0);
    controlsRef.current = controls;

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0x233554, 1.2);
    scene.add(ambientLight);

    const warmLight = new THREE.PointLight(0xF4D06F, 1.5, 12);
    warmLight.position.set(0, 3.2, 0);
    warmLight.castShadow = true;
    scene.add(warmLight);

    const seaSunlight = new THREE.DirectionalLight(0xFFE5B4, 1.6);
    seaSunlight.position.set(10, 8, 12);
    seaSunlight.castShadow = true;
    scene.add(seaSunlight);

    const accentLight1 = new THREE.PointLight(0xC8814F, 1.2, 8);
    accentLight1.position.set(-3.5, 2.5, -2);
    scene.add(accentLight1);

    // 4. Materials
    const marbleFloorMat = new THREE.MeshStandardMaterial({
      color: 0xECE5DA,
      roughness: 0.15,
      metalness: 0.1
    });

    const warmWoodMat = new THREE.MeshStandardMaterial({
      color: 0x8A5A36,
      roughness: 0.5,
      metalness: 0.1
    });

    const darkWallMat = new THREE.MeshStandardMaterial({
      color: 0x15233A,
      roughness: 0.6,
      metalness: 0.1
    });

    const copperTrimMat = new THREE.MeshStandardMaterial({
      color: 0xC8814F,
      roughness: 0.25,
      metalness: 0.8
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xCCE5FF,
      transparent: true,
      opacity: 0.35,
      transmission: 0.9,
      roughness: 0.05,
      metalness: 0.1,
      ior: 1.5
    });

    const seaWaterMat = new THREE.MeshStandardMaterial({
      color: 0x1A4D68,
      roughness: 0.1,
      metalness: 0.4
    });

    // 5. Build Apartment Interior Geometry
    const aptGroup = new THREE.Group();

    // Main Floor Slab (12m x 12m)
    const floorGeo = new THREE.BoxGeometry(13, 0.3, 13);
    const floorMesh = new THREE.Mesh(floorGeo, marbleFloorMat);
    floorMesh.position.y = -0.15;
    floorMesh.receiveShadow = true;
    aptGroup.add(floorMesh);

    // Ceiling with recessed cove lighting
    const ceilGeo = new THREE.BoxGeometry(13, 0.3, 13);
    const ceilMesh = new THREE.Mesh(ceilGeo, darkWallMat);
    ceilMesh.position.y = 3.6;
    ceilMesh.receiveShadow = true;
    aptGroup.add(ceilMesh);

    // Back Solid Wall
    const backWallGeo = new THREE.BoxGeometry(13, 3.5, 0.3);
    const backWall = new THREE.Mesh(backWallGeo, darkWallMat);
    backWall.position.set(0, 1.75, -6.4);
    backWall.receiveShadow = true;
    aptGroup.add(backWall);

    // Left Solid Wall (Master Suite boundary)
    const leftWallGeo = new THREE.BoxGeometry(0.3, 3.5, 13);
    const leftWall = new THREE.Mesh(leftWallGeo, darkWallMat);
    leftWall.position.set(-6.4, 1.75, 0);
    leftWall.receiveShadow = true;
    aptGroup.add(leftWall);

    // Right Wall (Kitchen boundary)
    const rightWallGeo = new THREE.BoxGeometry(0.3, 3.5, 13);
    const rightWall = new THREE.Mesh(rightWallGeo, darkWallMat);
    rightWall.position.set(6.4, 1.75, 0);
    rightWall.receiveShadow = true;
    aptGroup.add(rightWall);

    // Front Panoramic Floor-to-Ceiling Glass Wall (Sea View)
    const glassWallGeo = new THREE.BoxGeometry(12.8, 3.3, 0.06);
    const glassWall = new THREE.Mesh(glassWallGeo, glassMat);
    glassWall.position.set(0, 1.75, 6.35);
    aptGroup.add(glassWall);

    // Outdoor Cantilevered Sky Balcony
    const balconyGeo = new THREE.BoxGeometry(10, 0.25, 3.2);
    const balconyMesh = new THREE.Mesh(balconyGeo, warmWoodMat);
    balconyMesh.position.set(0, -0.12, 7.9);
    balconyMesh.receiveShadow = true;
    aptGroup.add(balconyMesh);

    // Balcony Glass Railing
    const railingGeo = new THREE.BoxGeometry(9.8, 1.1, 0.05);
    const railingMesh = new THREE.Mesh(railingGeo, glassMat);
    railingMesh.position.set(0, 0.55, 9.45);
    aptGroup.add(railingMesh);

    // Copper Handrail Top
    const handrailGeo = new THREE.BoxGeometry(9.9, 0.08, 0.12);
    const handrailMesh = new THREE.Mesh(handrailGeo, copperTrimMat);
    handrailMesh.position.set(0, 1.1, 9.45);
    aptGroup.add(handrailMesh);

    // Living Room: Designer Sectional Sofa
    const sofaGeo = new THREE.BoxGeometry(3.8, 0.65, 2.0);
    const sofaMesh = new THREE.Mesh(sofaGeo, new THREE.MeshStandardMaterial({ color: 0x2A3B53, roughness: 0.8 }));
    sofaMesh.position.set(0, 0.35, 1.5);
    sofaMesh.castShadow = true;
    aptGroup.add(sofaMesh);

    const sofaBackGeo = new THREE.BoxGeometry(3.8, 0.6, 0.45);
    const sofaBack = new THREE.Mesh(sofaBackGeo, new THREE.MeshStandardMaterial({ color: 0x1E2B3E, roughness: 0.8 }));
    sofaBack.position.set(0, 0.85, 0.65);
    sofaBack.castShadow = true;
    aptGroup.add(sofaBack);

    // Marble Coffee Table with Copper Legs
    const tableGeo = new THREE.BoxGeometry(2.0, 0.4, 1.0);
    const tableMesh = new THREE.Mesh(tableGeo, marbleFloorMat);
    tableMesh.position.set(0, 0.25, 3.2);
    tableMesh.castShadow = true;
    aptGroup.add(tableMesh);

    // Master Bedroom: Bed & Copper Headboard (Left zone)
    const bedGeo = new THREE.BoxGeometry(2.6, 0.6, 2.8);
    const bedMesh = new THREE.Mesh(bedGeo, new THREE.MeshStandardMaterial({ color: 0xECE5DA, roughness: 0.7 }));
    bedMesh.position.set(-4.2, 0.35, -3.2);
    bedMesh.castShadow = true;
    aptGroup.add(bedMesh);

    const headboardGeo = new THREE.BoxGeometry(2.8, 1.6, 0.25);
    const headboardMesh = new THREE.Mesh(headboardGeo, copperTrimMat);
    headboardMesh.position.set(-4.2, 1.0, -4.6);
    headboardMesh.castShadow = true;
    aptGroup.add(headboardMesh);

    // Kitchen: Island Counter (Right zone)
    const islandGeo = new THREE.BoxGeometry(1.6, 0.95, 3.6);
    const islandMesh = new THREE.Mesh(islandGeo, marbleFloorMat);
    islandMesh.position.set(4.2, 0.5, -2.5);
    islandMesh.castShadow = true;
    aptGroup.add(islandMesh);

    // Distant Arabian Sea plane below horizon
    const seaGeo = new THREE.PlaneGeometry(160, 160);
    const seaMesh = new THREE.Mesh(seaGeo, seaWaterMat);
    seaMesh.rotation.x = -Math.PI / 2;
    seaMesh.position.y = -6.0;
    aptGroup.add(seaMesh);

    scene.add(aptGroup);

    // 6. Animation Render Loop
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [viewMode]);

  const currentRoom = ROOMS.find(r => r.id === activeRoom) || ROOMS[0];

  return (
    <div className={`relative rounded-3xl overflow-hidden bg-[#0D1726] border border-[#1F3354] shadow-2xl ${className}`}>
      
      {/* Top Header HUD */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="bg-[#15233A]/90 backdrop-blur-md px-4 py-2 rounded-full border border-[#1F3354] shadow-lg pointer-events-auto flex items-center gap-2.5 text-xs text-[#F3EFE8]">
          <span className="w-2 h-2 rounded-full bg-[#C8814F] animate-pulse"></span>
          <span className="font-display tracking-wider font-bold">Level 30 • Home 3001</span>
          <span className="text-[#A3AEC0]">• 3 BHK (1,640 sq ft)</span>
        </div>

        {/* View Mode Switcher */}
        <div className="bg-[#15233A]/90 backdrop-blur-md p-1 rounded-full border border-[#1F3354] shadow-lg pointer-events-auto flex items-center gap-1 text-xs font-semibold">
          <button
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
              viewMode === '3d' ? 'bg-[#C8814F] text-white shadow-sm' : 'text-[#A3AEC0] hover:text-white'
            }`}
          >
            <Eye size={13} />
            <span>3D Walkthrough</span>
          </button>
          <button
            onClick={() => setViewMode('plan')}
            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
              viewMode === 'plan' ? 'bg-[#C8814F] text-white shadow-sm' : 'text-[#A3AEC0] hover:text-white'
            }`}
          >
            <Layers size={13} />
            <span>2D Floor Plan</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: 3D Canvas or 2D Plan */}
      {viewMode === '3d' ? (
        <div className="relative w-full h-[520px]">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
          
          {/* Subtle 3D Instructions */}
          <div className="absolute top-16 left-4 text-[11px] font-medium text-[#A3AEC0]/80 pointer-events-none bg-[#0D1726]/60 backdrop-blur-xs px-3 py-1 rounded-lg">
            Drag to turn • Scroll to zoom • Click room below to inspect
          </div>

          {/* Bottom Room Selector HUD */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="bg-[#15233A]/95 backdrop-blur-md rounded-2xl p-3 border border-[#1F3354] shadow-xl">
              <div className="flex items-center justify-between mb-2 px-1">
                <div>
                  <h4 className="text-sm font-display font-bold text-[#F3EFE8]">{currentRoom.name}</h4>
                  <p className="text-[11px] text-[#A3AEC0] line-clamp-1">{currentRoom.desc}</p>
                </div>
                {onBookViewing && (
                  <button
                    onClick={onBookViewing}
                    className="bg-[#C8814F] hover:bg-[#b67040] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span>Enquire About 3001</span>
                  </button>
                )}
              </div>

              {/* Room Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-[#1F3354]/60">
                {ROOMS.map((r) => {
                  const isActive = activeRoom === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleRoomSelect(r)}
                      className={`py-1.5 px-2 rounded-xl text-center text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#C8814F] text-white shadow'
                          : 'bg-[#0D1726]/60 text-[#A3AEC0] hover:text-white hover:bg-[#0D1726]'
                      }`}
                    >
                      {r.name.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 2D Architectural Floor Plan Fallback */
        <div className="w-full h-[520px] bg-[#15233A] p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#C8814F]">MahaRERA Approved Plan</span>
              <h3 className="text-xl font-display font-bold text-[#F3EFE8]">
                {activePlan === '3bhk' ? '3 BHK Residence • 1,640 sq ft' : activePlan === '4bhk' ? '4 BHK Residence • 2,380 sq ft' : 'Sky Villa Duplex • 4,150 sq ft'}
              </h3>
            </div>

            {/* Plan switcher */}
            <div className="flex gap-2">
              <button
                onClick={() => setActivePlan('3bhk')}
                className={`text-xs px-3 py-1 rounded-lg border font-bold ${activePlan === '3bhk' ? 'bg-[#C8814F] text-white border-[#C8814F]' : 'text-[#A3AEC0] border-[#1F3354]'}`}
              >
                3 BHK
              </button>
              <button
                onClick={() => setActivePlan('4bhk')}
                className={`text-xs px-3 py-1 rounded-lg border font-bold ${activePlan === '4bhk' ? 'bg-[#C8814F] text-white border-[#C8814F]' : 'text-[#A3AEC0] border-[#1F3354]'}`}
              >
                4 BHK
              </button>
              <button
                onClick={() => setActivePlan('villa')}
                className={`text-xs px-3 py-1 rounded-lg border font-bold ${activePlan === 'villa' ? 'bg-[#C8814F] text-white border-[#C8814F]' : 'text-[#A3AEC0] border-[#1F3354]'}`}
              >
                Sky Villa
              </button>
            </div>
          </div>

          <div className="flex-1 rounded-2xl overflow-hidden bg-white p-2 flex items-center justify-center">
            <img
              src={`/assets/plan-${activePlan}.jpg`}
              alt="Floor Plan"
              className="max-h-[380px] w-auto object-contain"
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-[#A3AEC0]">
            <span>All measurements are carpet area as per MahaRERA registered sanction.</span>
            {onBookViewing && (
              <button onClick={onBookViewing} className="text-[#C8814F] hover:underline font-bold">
                Download High-Res CAD Plan →
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
