import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Compass,
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Play,
  Pause,
  Layers,
  MapPin,
  CalendarCheck
} from 'lucide-react';

/* ═════════════════════════════════════════════════════════════════════════
   PROPASSIST AI — LUXURY ARCHITECTURAL NARRATIVE (8 CONNECTED CHAPTERS)
   Creative High-End Editorial Exhibition:
   - Interactive Chapter Ribbon & Scrubbing
   - Cinematic Dual-Pane Masterpiece Canvas with Hotspots
   - Deep Architectural Materiality & RERA Engineering Specifications
   - Continuous Edge-to-Edge Filmstrip
   - Fullscreen Architectural Inspection Lightbox
   - Strictly 2D Canvas & CSS (Zero 3D/WebGL)
═════════════════════════════════════════════════════════════════════════ */

const CHAPTERS = [
  {
    id: 1,
    num: '01',
    category: 'The Landmark',
    title: 'The Soaring Landmark Over Ahmedabad',
    tagline: 'Western Corridor Horizon · 420 Master Residences',
    narrative:
      'Towering gracefully above SG Highway and South Bopal, the twin sculptural residential towers redefine the skyline of Ahmedabad. Conceived with aerodynamic curved corners to mitigate wind resistance and maximize western sunset vistas across lush agricultural greens.',
    image: '/assets/story/story-01-discover.jpg',
    specs: [
      { label: 'Altitude', val: '212 Meters Height' },
      { label: 'Floors', val: '38 Residential Levels' },
      { label: 'Structure', val: 'Seismic Zone III Compliant' },
      { label: 'Corridor', val: 'SG Highway Prime Axis' }
    ],
    hotspots: [
      { x: '45%', y: '28%', title: 'Level 38 Sky Pavilion', desc: 'Private residents-only telescope deck & observation lounge.' },
      { x: '68%', y: '62%', title: 'Sunken Shading Verandas', desc: 'Deep recessed balconies shield interiors from intense midday heat.' }
    ],
    materials: ['Belgian Acoustic Double Glazing', 'Anodized Champagne Bronze Finish', 'Anti-Reflective Solar Control Glass']
  },
  {
    id: 2,
    num: '02',
    category: 'Architecture',
    title: 'Precision Copper, Glass & Travertine',
    tagline: 'Artisanal Craftsmanship Meets Environmental Engineering',
    narrative:
      'The double-height grand arrival atrium is anchored by an organic hand-beaten copper sculpture that mimics the flow of the Sabarmati. Fluted Italian travertine surfaces and automated louvered solar fins harmonize contemporary luxury with Ahmedabad’s regional heritage.',
    image: '/assets/story/story-02-architecture.jpg',
    specs: [
      { label: 'Atrium Height', val: '9.2 Meters Clear Ceiling' },
      { label: 'Façade', val: 'Thermal-Break Curtain Wall' },
      { label: 'Stone', val: 'Navona Honed Travertine' },
      { label: 'Rating', val: 'IGBC Platinum Pre-Certified' }
    ],
    hotspots: [
      { x: '52%', y: '40%', title: 'Artisanal Copper Core', desc: 'Sculpted by master Indian coppersmiths with natural patina sealant.' },
      { x: '25%', y: '75%', title: 'Double-Height Dropoff', desc: 'Porphyry cobblestone porte-cochère with silent acoustic ceiling.' }
    ],
    materials: ['Hand-Beaten Copper Cladding', 'Italian Navona Travertine', 'Integrated Cove Ambient LEDs']
  },
  {
    id: 3,
    num: '03',
    category: 'Residences',
    title: 'Expansive 2, 3 & 4 BHK Floor Plans',
    tagline: '100% Usable Carpet Area · Zero Circulation Loss',
    narrative:
      'Engineered around the modern joint family lifestyle. Every home features column-free living rooms that flow into expansive outdoor verandas, private family foyers, separated service elevators, and domestic staff quarters with private entries.',
    image: '/assets/story/story-03-residences.jpg',
    specs: [
      { label: 'Ceiling Height', val: '3.35 Meters Slab-to-Slab' },
      { label: 'Configurations', val: '2, 3 & 4 BHK + Penthouse' },
      { label: 'Living Room Span', val: 'Up to 28 Feet Clear' },
      { label: 'RERA Compliance', val: '100% Approved Carpet Area' }
    ],
    hotspots: [
      { x: '35%', y: '50%', title: 'Column-Free Living Span', desc: 'Post-tensioned concrete slabs eliminate awkward interior pillar intrusions.' },
      { x: '75%', y: '35%', title: 'Sky Deck Window Walls', desc: 'Floor-to-ceiling sliding glass panels open completely to fresh air.' }
    ],
    materials: ['Large-Format Glazed Vitrified Tiles', 'Daikin VRV Inverter Air Conditioning', 'Engineered Teak Main Door']
  },
  {
    id: 4,
    num: '04',
    category: 'Interior Living',
    title: 'Presidential Master Suites & Sky Decks',
    tagline: 'Private Sanctuaries of Light, Calm, and Detail',
    narrative:
      'Master bedrooms are designed as quiet retreats with soundproofed sub-flooring, walk-in his-and-her dressing spaces, and spa bathrooms fitted with Hansgrohe fixtures and free-standing soaking tubs bathed in morning dawn.',
    image: '/assets/story/story-04-living.jpg',
    specs: [
      { label: 'Suite Size', val: 'Up to 480 Sq.Ft Private Area' },
      { label: 'Walk-In Closet', val: 'Custom German Wardrobes' },
      { label: 'Glazing', val: 'Acoustic Sound Insulation 42dB' },
      { label: 'Orientation', val: 'Sunrise East Facing' }
    ],
    hotspots: [
      { x: '60%', y: '45%', title: 'Sunrise Panorama Glass', desc: 'Full-height solar low-E glass captures sunrise without thermal heat build-up.' },
      { x: '30%', y: '70%', title: 'Floating Oak Finishes', desc: 'Warm natural European white oak hardwood underfoot.' }
    ],
    materials: ['European White Oak Engineered Wood', 'Hansgrohe Raindance Showers', 'Dornbracht Concealed Thermostats']
  },
  {
    id: 5,
    num: '05',
    category: 'Lifestyle & Wellness',
    title: 'Level 24 Rooftop Infinity Pool & Club',
    tagline: '212m Altitude Oasis Over the Western Greens',
    narrative:
      'Immerse in a heated 50-meter cantilevered infinity pool that appears to merge seamlessly with the clouds. Accompanied by thermal saunas, private cabanas, an Olympic Technogym suite, and a rooftop astronomical stargazing lawn.',
    image: '/assets/story/story-05-lifestyle.jpg',
    specs: [
      { label: 'Pool Length', val: '50 Meters Heated Lap Pool' },
      { label: 'Sky Club', val: '22,000 Sq.Ft Over 2 Levels' },
      { label: 'Fitness', val: 'Technogym Artis Equipment' },
      { label: 'Gardens', val: '2-Acre Ground Botanical Oasis' }
    ],
    hotspots: [
      { x: '50%', y: '35%', title: 'Edge-to-Edge Glass Lip', desc: 'Laminated structural glass weir creates a true edge-free swimming experience.' },
      { x: '80%', y: '65%', title: 'Private Sunken Cabanas', desc: 'Teak shade pergolas with personalized dining service.' }
    ],
    materials: ['Bali Sukabumi Natural Slate Tile', 'Weathered Teak Decking', 'Titanium Heat Exchange Filtration']
  },
  {
    id: 6,
    num: '06',
    category: 'Connectivity',
    title: 'The Prime Ahmedabad Location Axis',
    tagline: '1 Min to SG Highway · 20 Min to GIFT City',
    narrative:
      'Positioned at the golden intersection of SG Highway, SP Ring Road, and South Bopal. Effortless transit connecting you to SG Highway corporate hubs, Vaishno Devi Circle, top international schools, KD Hospital, and the Ahmedabad International Airport.',
    image: '/assets/story/story-06-location.jpg',
    specs: [
      { label: 'SG Highway', val: '1 Minute Drive' },
      { label: 'Vaishno Devi Circle', val: '3 Minutes Drive' },
      { label: 'GIFT City', val: '20 Minutes Fast Corridor' },
      { label: 'Intl Airport', val: '25 Minutes via SP Ring Road' }
    ],
    hotspots: [
      { x: '45%', y: '48%', title: 'Direct Arterial Access', desc: 'Signal-free slip lane directly onto the 6-lane SG Highway corridor.' },
      { x: '70%', y: '70%', title: 'Future Metro Station', desc: 'Approved Phase-2 Metro station planned within 800m walking radius.' }
    ],
    materials: ['Underground Dedicated Utility Tunnel', 'EV Supercharging Infrastructure', 'Private Smart Access Gates']
  },
  {
    id: 7,
    num: '07',
    category: 'AI Intelligence',
    title: 'PropAssist Verified Conversational AI',
    tagline: 'Instant Answers in English, Hindi & Gujarati',
    narrative:
      'No more waiting 14 hours for a sales executive call. Our AI advisor is trained strictly on verified RERA fact sheets, providing immediate carpet pricing, floor plans, and construction stage telemetry in under 2 minutes with human executive handoff.',
    image: '/assets/story/story-ai-advisor.jpg',
    specs: [
      { label: 'Response Velocity', val: '1.8 Minutes Average' },
      { label: 'Languages', val: 'English, Hindi, Gujarati' },
      { label: 'Accuracy', val: '100% Fact-Sheet Grounded' },
      { label: 'Privacy', val: 'DPDP Act 2023 Compliant' }
    ],
    hotspots: [
      { x: '40%', y: '45%', title: 'Direct RERA Verification', desc: 'Cross-verifies carpet area and statutory RERA registration numbers live.' },
      { x: '70%', y: '60%', title: 'Human Handoff Bridge', desc: 'Seamlessly transfers complex queries to an assigned sales host in real-time.' }
    ],
    materials: ['Secure 256-bit Tokenization', 'Low-Latency NLP Architecture', 'Prisma Audit Log Tracking']
  },
  {
    id: 8,
    num: '08',
    category: 'VIP Experience',
    title: 'Private On-Site Pavilion Viewing',
    tagline: 'Personalized 1-on-1 Walkthrough & Model Homes',
    narrative:
      'Experience the weight of the bronze doors, the acoustics of the triple glazing, and the natural light of the show residences in person. Schedule your private VIP appointment with atomic slot reservation to ensure no overlapping crowds.',
    image: '/assets/story/story-family-visit.jpg',
    specs: [
      { label: 'Preview Pavilion', val: 'On-Site Experience Center' },
      { label: 'Model Homes', val: 'Furnished 2 & 3 BHK Available' },
      { label: 'Executive Host', val: 'Dedicated 1-on-1 Walkthrough' },
      { label: 'Reservation', val: 'Login Required for VIP Slots' }
    ],
    hotspots: [
      { x: '48%', y: '52%', title: 'Sensory Material Gallery', desc: 'Touch and compare physical samples of stone, wood, glass, and hardware.' },
      { x: '75%', y: '40%', title: 'Full-Scale Model Unit', desc: '1:1 scale furnished show apartment showcasing live natural illumination.' }
    ],
    materials: ['Curated Architectural Model Center', 'Private Client Negotiation Salons', 'Valet VIP Parking']
  }
];

export default function ConnectedStorySection({ onNavigateToBooking }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const filmstripRef = useRef(null);

  const activeChapter = CHAPTERS[activeIdx];

  // Optional Autoplay
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % CHAPTERS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Center active thumbnail in filmstrip
  useEffect(() => {
    if (!filmstripRef.current) return;
    const activeEl = filmstripRef.current.children[activeIdx];
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeIdx]);

  const handlePrev = () => {
    setActiveIdx((prev) => (prev === 0 ? CHAPTERS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev === CHAPTERS.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="story" className="py-24 bg-[#080E18] text-[#F3EFE8] border-b border-[#1F3354] relative overflow-hidden select-none">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[500px] bg-[#C8814F]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-[#1F3354]/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1F3354_1px,transparent_1px)] [background-size:40px_40px] opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">

        {/* ─── SECTION TOP HEADER ─── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 pb-8 border-b border-[#1F3354]/70">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#15233A] border border-[#C8814F]/40 text-[#C8814F] text-[11px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Architectural Narrative • 8 Connected Chapters</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-light text-white leading-tight">
              Every Home Has a Story.{' '}
              <span className="font-semibold italic text-transparent bg-clip-text bg-gradient-to-r from-[#C8814F] via-[#E5A872] to-[#ECE5DA]">
                Start Yours Here.
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
              Explore 420 residences across SG Highway & South Bopal through an immersive architectural lens. Tap any chapter below to explore engineering details and design materiality.
            </p>
          </div>

          {/* Autoplay & Arrows Control */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                isPlaying
                  ? 'bg-[#C8814F]/20 text-[#C8814F] border-[#C8814F]/40'
                  : 'bg-[#15233A] hover:bg-[#1A2C4C] text-[#94A3B8] border-[#1F3354]'
              }`}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? 'Pause Story' : 'Auto Play'}</span>
            </button>

            <div className="h-6 w-px bg-[#1F3354]" />

            <div className="text-xs font-mono font-bold text-[#CBD5E1] px-2">
              <span className="text-[#C8814F] text-base">{activeChapter.num}</span>
              <span className="text-[#64748B]"> / 08</span>
            </div>

            <button
              onClick={handlePrev}
              className="w-10 h-10 rounded-xl bg-[#15233A] hover:bg-[#1A2C4C] text-white border border-[#1F3354] flex items-center justify-center transition-all shadow-md active:scale-95"
              title="Previous Chapter"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              className="w-10 h-10 rounded-xl bg-[#C8814F] hover:bg-[#b67040] text-white flex items-center justify-center transition-all shadow-lg shadow-[#C8814F]/25 active:scale-95"
              title="Next Chapter"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* ─── CHAPTER QUICK-NAV TABS RIBBON ─── */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-6 mb-8">
          {CHAPTERS.map((chap, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={chap.id}
                onClick={() => setActiveIdx(idx)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2.5 border shrink-0 ${
                  isActive
                    ? 'bg-[#C8814F] text-white border-[#C8814F] shadow-lg shadow-[#C8814F]/25 scale-105'
                    : 'bg-[#15233A]/80 hover:bg-[#15233A] text-[#94A3B8] hover:text-[#F3EFE8] border-[#1F3354]'
                }`}
              >
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-black/30 text-white' : 'bg-[#0D1726] text-[#C8814F]'
                }`}>
                  {chap.num}
                </span>
                <span>{chap.category}</span>
              </button>
            );
          })}
        </div>

        {/* ─── THE MASTERPIECE STAGE: DUAL PANE EXHIBITION ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-10">

          {/* LEFT 7 COLS: High-Definition Canvas with Parallax & Interactive Hotspots */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#15233A] rounded-3xl border border-[#1F3354] overflow-hidden shadow-2xl relative min-h-[460px] lg:min-h-[580px] flex flex-col justify-between group">
            
            {/* Background Image with Cinematic Grading */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src={activeChapter.image}
                alt={activeChapter.title}
                className="w-full h-full object-cover transition-all duration-1000 transform group-hover:scale-105 filter contrast-[1.08] brightness-[0.95]"
              />
              {/* Luxury Cinematic Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080E18] via-[#080E18]/30 to-black/40" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#080E18]/60 via-transparent to-transparent" />
            </div>

            {/* Top Bar on Image: RERA Status & Lightbox Expand Button */}
            <div className="relative z-10 p-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-[#0D1726]/80 backdrop-blur-md border border-[#C8814F]/40 text-[#C8814F] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={13} />
                  <span>Verified Architectural Asset</span>
                </span>
                <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-mono border border-white/10">
                  Ahmedabad Portfolio
                </span>
              </div>

              <button
                onClick={() => setLightboxOpen(true)}
                className="w-9 h-9 rounded-xl bg-black/60 hover:bg-[#C8814F] text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-md group/btn"
                title="Inspect High-Res Visual"
              >
                <Maximize2 size={16} className="group-hover/btn:scale-110 transition-transform" />
              </button>
            </div>

            {/* Interactive Hotspots Layer */}
            <div className="relative z-10 flex-1">
              {activeChapter.hotspots?.map((hs, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{ top: hs.y, left: hs.x }}
                >
                  <button
                    onClick={() => setActiveHotspot(activeHotspot === i ? null : i)}
                    className="relative group/hs flex items-center justify-center"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#C8814F] text-white flex items-center justify-center text-[10px] font-bold shadow-lg shadow-[#C8814F]/50 ring-4 ring-[#C8814F]/30 animate-pulse">
                      +
                    </span>

                    {/* Popover Card */}
                    <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-56 p-3 bg-[#0D1726]/95 backdrop-blur-md border border-[#C8814F] rounded-2xl shadow-2xl text-left pointer-events-auto transition-all duration-300 z-30 ${
                      activeHotspot === i ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none group-hover/hs:opacity-100 group-hover/hs:scale-100 group-hover/hs:pointer-events-auto'
                    }`}>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles size={12} className="text-[#C8814F]" />
                        <span>{hs.title}</span>
                      </p>
                      <p className="text-[10px] text-[#CBD5E1] mt-1 leading-snug">
                        {hs.desc}
                      </p>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {/* Bottom Title & Specs Ticker Bar */}
            <div className="relative z-10 p-6 sm:p-8 space-y-4">
              <div>
                <span className="text-[#C8814F] text-xs font-bold uppercase tracking-widest">
                  Chapter {activeChapter.num} · {activeChapter.category}
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
                  {activeChapter.title}
                </h3>
                <p className="text-xs text-[#CBD5E1] mt-1 max-w-xl">
                  {activeChapter.tagline}
                </p>
              </div>

              {/* 4 Architectural Spec Badges Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {activeChapter.specs.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#0D1726]/85 backdrop-blur-md border border-[#1F3354] rounded-2xl text-left"
                  >
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">
                      {s.label}
                    </span>
                    <span className="text-xs font-semibold text-white mt-0.5 block truncate">
                      {s.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT 5 COLS: Editorial Narrative Dossier */}
          <div className="lg:col-span-5 xl:col-span-4 bg-[#15233A] rounded-3xl border border-[#1F3354] p-7 sm:p-8 flex flex-col justify-between shadow-2xl relative">
            
            <div className="space-y-6">
              {/* Top Chapter Identity */}
              <div className="flex items-center justify-between pb-4 border-b border-[#1F3354]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">
                    Architectural Dossier
                  </span>
                  <div className="text-xs font-semibold text-[#CBD5E1] mt-0.5">
                    PropAssist Master Specifications
                  </div>
                </div>
                <div className="font-display text-4xl sm:text-5xl font-extralight text-transparent bg-clip-text bg-gradient-to-br from-[#C8814F] via-[#E5A872] to-[#ECE5DA]">
                  {activeChapter.num}
                </div>
              </div>

              {/* Editorial Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Design Narrative & Intent
                </h4>
                <p className="text-xs text-[#CBD5E1] leading-relaxed">
                  {activeChapter.narrative}
                </p>
              </div>

              {/* Verified Materials & Craftsmanship Palette */}
              <div className="space-y-2.5 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] block">
                  Material Palette & Finishes:
                </span>
                <div className="space-y-2">
                  {activeChapter.materials.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#0D1726] rounded-xl border border-[#1F3354] flex items-center gap-2.5 text-xs text-[#F3EFE8]"
                    >
                      <CheckCircle2 size={14} className="text-[#C8814F] shrink-0" />
                      <span className="truncate">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons: Schedule Visit & Explore */}
            <div className="space-y-3 pt-6 mt-6 border-t border-[#1F3354]">
              <button
                onClick={() => {
                  if (onNavigateToBooking) {
                    onNavigateToBooking();
                  } else {
                    const el = document.getElementById('booking');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="w-full py-3.5 px-5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow-xl shadow-[#C8814F]/20 transition-all flex items-center justify-center gap-2 group/cta"
              >
                <CalendarCheck size={15} />
                <span>Schedule Private VIP Visit</span>
                <ArrowRight size={14} className="group-hover/cta:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setLightboxOpen(true)}
                className="w-full py-2.5 px-4 bg-[#0D1726] hover:bg-[#1A2C4C] text-[#CBD5E1] border border-[#1F3354] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Maximize2 size={14} className="text-[#C8814F]" />
                <span>Full-Screen High-Res Gallery</span>
              </button>

              <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-1">
                <span>RERA: PR/GJ/AHMEDABAD</span>
                <span>•</span>
                <span>Atomic VIP Slot Protected</span>
              </div>
            </div>

          </div>

        </div>

        {/* ─── CONTINUOUS PANORAMIC FILMSTRIP REEL (8 CONNECTED PANELS) ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span className="font-bold uppercase tracking-wider text-[11px] text-white">
              Continuous 8-Chapter Filmstrip
            </span>
            <span className="text-[11px]">Click any frame to switch focus</span>
          </div>

          <div
            ref={filmstripRef}
            className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 snap-x"
          >
            {CHAPTERS.map((chap, idx) => {
              const isActive = idx === activeIdx;
              return (
                <div
                  key={chap.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`relative shrink-0 w-44 sm:w-56 h-32 sm:h-36 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 snap-start border ${
                    isActive
                      ? 'border-[#C8814F] ring-2 ring-[#C8814F]/40 scale-105 shadow-xl shadow-[#C8814F]/20'
                      : 'border-[#1F3354] opacity-60 hover:opacity-100 hover:border-[#38517A]'
                  }`}
                >
                  <img
                    src={chap.image}
                    alt={chap.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080E18] via-transparent to-black/30" />
                  
                  {/* Badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-md">
                      {chap.num}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-left">
                    <p className="text-[11px] font-bold text-white truncate leading-tight">
                      {chap.title}
                    </p>
                    <span className="text-[9px] text-[#C8814F] font-semibold uppercase">
                      {chap.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Micro Progress Bar */}
          <div className="flex items-center gap-1.5 pt-2">
            {CHAPTERS.map((c, idx) => (
              <div
                key={c.id}
                onClick={() => setActiveIdx(idx)}
                className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all duration-300 ${
                  idx === activeIdx ? 'bg-[#C8814F]' : 'bg-[#1F3354] hover:bg-[#38517A]'
                }`}
                title={`Jump to Chapter ${c.num}`}
              />
            ))}
          </div>
        </div>

      </div>

      {/* ─── FULL-SCREEN ARCHITECTURAL LIGHTBOX MODAL ─── */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 sm:p-8 animate-fadeIn">
          <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1F3354] flex items-center justify-between bg-[#0D1726]/80">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#C8814F]/20 text-[#C8814F] border border-[#C8814F]/40">
                  {activeChapter.num}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">{activeChapter.title}</h3>
                  <p className="text-[10px] text-[#94A3B8]">{activeChapter.tagline}</p>
                </div>
              </div>
              <button
                onClick={() => setLightboxOpen(false)}
                className="w-8 h-8 rounded-full bg-[#0D1726] border border-[#1F3354] text-[#94A3B8] hover:text-white flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Image */}
            <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[350px]">
              <img
                src={activeChapter.image}
                alt={activeChapter.title}
                className="w-full h-full max-h-[550px] object-contain"
              />
            </div>

            {/* Modal Footer Specs */}
            <div className="p-5 border-t border-[#1F3354] bg-[#0D1726]/90 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2 text-xs">
                {activeChapter.specs.map((s, i) => (
                  <span key={i} className="px-3 py-1 rounded-xl bg-[#15233A] border border-[#1F3354] text-[#CBD5E1] text-[11px]">
                    <strong className="text-white">{s.label}:</strong> {s.val}
                  </span>
                ))}
              </div>

              <button
                onClick={() => {
                  setLightboxOpen(false);
                  if (onNavigateToBooking) {
                    onNavigateToBooking();
                  } else {
                    const el = document.getElementById('booking');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-5 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Book Visit for This Residence</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}
