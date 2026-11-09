import React, { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Sparkles, ChevronDown,
  ArrowRight, CalendarCheck, ShieldCheck, Sun, CloudRain, Wind, Snowflake,
  Building2, Layers, CheckCircle, Compass, Eye, Image as ImageIcon
} from 'lucide-react';

/* ═════════════════════════════════════════════════════════════════════════
   PROPASSIST AI — CINEMATIC ARCHITECTURAL SCROLL EXPERIENCE
   1. Immediate Pinned Full-Screen Building Descent Scrub (212m to 0m)
   2. Synchronized Storytelling Narrative ("Experience Living Beyond the Ordinary")
   3. Real-Time Altitude HUD & 4 Seasonal Weather Overlays
   4. Autoplaying 4K Architectural Building Video Tour with Custom Timeline
   5. Architectural Gallery & Verified Landmark Highlights
═════════════════════════════════════════════════════════════════════════ */

const SEASONS = {
  monsoon: { name: 'Monsoon', temp: '27°C', wind: 'Sea breeze 16 kt', note: 'Petrichor & cool twilight mist', icon: CloudRain, tint: 'rgba(21, 35, 58, 0.45)' },
  summer: { name: 'Summer', temp: '34°C', wind: 'South-west 12 kt', note: 'Golden sunlight & shimmering sky', icon: Sun, tint: 'rgba(200, 129, 79, 0.22)' },
  autumn: { name: 'Autumn', temp: '29°C', wind: 'North-west 10 kt', note: 'Amber sunset & tranquil breeze', icon: Wind, tint: 'rgba(180, 100, 50, 0.20)' },
  winter: { name: 'Winter', temp: '23°C', wind: 'North-east 14 kt', note: 'Crystalline blue evening sky', icon: Snowflake, tint: 'rgba(13, 23, 38, 0.35)' }
};

const GALLERY_ITEMS = [
  {
    title: 'Double-Height Grand Foyer',
    category: 'Entrance & Arrival',
    src: '/assets/lobby.jpg',
    desc: 'Staffed 24/7 concierge, imported Italian marble finishing and climate-controlled covered drop-off.'
  },
  {
    title: 'Rooftop Horizon Infinity Pool',
    category: 'Sky Clubhouse',
    src: '/assets/pool.jpg',
    desc: 'Heated Olympic-dimension lap pool suspended 96m above SG Highway with panoramic sunset loungers.'
  },
  {
    title: 'The Sky Observatory Lounge',
    category: 'Private Social Club',
    src: '/assets/lounge.jpg',
    desc: 'Double-height private entertainment deck to host family and peers against the Ahmedabad twilight.'
  },
  {
    title: 'Zenith Sunset Horizon Deck',
    category: 'Panoramic Outlook',
    src: '/assets/view-30.jpg',
    desc: 'Unobstructed 270-degree view spanning Vaishno Devi, SG Highway and green arterial belts.'
  },
  {
    title: 'Acre-Wide Themed Botanical Park',
    category: 'Landscape Greens',
    src: '/assets/garden-dusk.jpg',
    desc: 'Native foliage, jogging tracks, reflexology footpaths, and zero-vehicle surface pedestrian zones.'
  },
  {
    title: 'Contemporary Architectural Facade',
    category: 'Exterior Geometry',
    src: '/assets/hero-ending.jpg',
    desc: 'Aerodynamic copper-accented balconies, thermal acoustic glazing, and energy-efficient lighting.'
  }
];

export default function MiddleCinematicExperience({ onExploreProjects, onBookVisit }) {
  // Scroll-Film State
  const scrollContainerRef = useRef(null);
  const scrubVideoRef = useRef(null);
  const rainCanvasRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSeason, setActiveSeason] = useState('monsoon');
  const [videoReady, setVideoReady] = useState(false);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);

  // 4K Video Tour Player State (Autoplays automatically)
  const tourVideoRef = useRef(null);
  const tourPlayerContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Gallery Active Preview State
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState(0);

  // Initialize scrub video
  useEffect(() => {
    const vid = scrubVideoRef.current;
    if (vid) {
      vid.load();
      vid.currentTime = 0.01;
      vid.addEventListener('loadeddata', () => setVideoReady(true));
    }
  }, []);

  // Auto-play the 4K video tour when mounted or scrolled into view
  useEffect(() => {
    const vid = tourVideoRef.current;
    if (!vid) return;

    vid.muted = true;
    vid.play().then(() => setIsPlaying(true)).catch(() => {});

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            vid.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(vid);
    return () => observer.disconnect();
  }, []);

  // Sync scroll of the pinned building descent section
  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const totalScrollable = container.offsetHeight - window.innerHeight;
      if (totalScrollable > 0) {
        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));
        targetProgressRef.current = progress;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth lerp loop for scroll video time scrubbing
  useEffect(() => {
    let animId;
    const tick = () => {
      animId = requestAnimationFrame(tick);
      const target = targetProgressRef.current;
      const current = currentProgressRef.current;

      const next = current + (target - current) * 0.14;
      currentProgressRef.current = next;
      setScrollProgress(next);

      const video = scrubVideoRef.current;
      if (video && !isNaN(video.duration) && video.duration > 0) {
        const targetTime = next * (video.duration - 0.04);
        if (Math.abs(video.currentTime - targetTime) > 0.02) {
          if ('fastSeek' in video) {
            video.fastSeek(targetTime);
          } else {
            video.currentTime = targetTime;
          }
        }
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Seasonal Rain Canvas Effect
  useEffect(() => {
    const canvas = rainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const drops = Array.from({ length: 65 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      speed: 3 + Math.random() * 5,
      len: 12 + Math.random() * 16
    }));

    let animId;
    const draw = () => {
      animId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);

      const isOutdoors = scrollProgress < 0.38 || scrollProgress > 0.82;
      if (activeSeason === 'monsoon' && isOutdoors) {
        ctx.strokeStyle = 'rgba(210, 230, 255, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        drops.forEach((d) => {
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - 2, d.y + d.len);
          d.y += d.speed;
          d.x -= 0.6;
          if (d.y > h) {
            d.y = -10;
            d.x = Math.random() * w;
          }
        });
        ctx.stroke();
      }
    };
    draw();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, [activeSeason, scrollProgress]);

  // 4K Video Player Controls
  const togglePlay = () => {
    const vid = tourVideoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play();
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const vid = tourVideoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setIsMuted(vid.muted);
  };

  const handleTimeUpdate = () => {
    const vid = tourVideoRef.current;
    if (!vid) return;
    setVideoCurrentTime(vid.currentTime);
    if (!videoDuration && vid.duration) {
      setVideoDuration(vid.duration);
    }
  };

  const handleSeek = (e) => {
    const vid = tourVideoRef.current;
    if (!vid) return;
    const seekTime = parseFloat(e.target.value);
    vid.currentTime = seekTime;
    setVideoCurrentTime(seekTime);
  };

  const toggleFullscreen = () => {
    const container = tourPlayerContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60) || 0;
    const s = Math.floor(secs % 60) || 0;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const altitude = Math.max(0, Math.round(212 * (1 - scrollProgress)));
  const seasonInfo = SEASONS[activeSeason];

  return (
    <div id="middle-cinematic" className="relative bg-[#0D1726] text-[#F3EFE8] overflow-hidden">
      
      {/* ═════════════════════════════════════════════════════════════════════
          PART 1: FULLSCREEN SCROLL-DRIVEN ARCHITECTURAL BUILDING DESCENT
          Immediately visible upon scrolling down from Hero!
      ═════════════════════════════════════════════════════════════════════ */}
      <div ref={scrollContainerRef} className="relative h-[360vh] bg-[#0D1726]">
        <div className="sticky top-0 w-full h-screen overflow-hidden">
          
          {/* Scrubbable Video Element */}
          <video
            ref={scrubVideoRef}
            src="/assets/hero-scrub.mp4"
            poster="/assets/hero-poster.jpg"
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover select-none pointer-events-none filter brightness-[0.88] contrast-[1.05]"
          />

          {/* Atmospheric Seasonal Overlay */}
          <div
            className="absolute inset-0 pointer-events-none transition-colors duration-1000"
            style={{ backgroundColor: seasonInfo.tint }}
          />

          {/* Weather Particles (Rain canvas) */}
          <canvas ref={rainCanvasRef} className="absolute inset-0 pointer-events-none z-10" />

          {/* Contrast Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1726] via-transparent to-[#0D1726]/70 pointer-events-none z-10" />

          {/* Floating Elevation HUD */}
          <div className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between text-[#F3EFE8]">
            <div className="bg-[#15233A]/90 backdrop-blur-md px-4 py-2 rounded-full border border-[#1F3354] shadow-2xl flex items-center gap-3 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C8814F] animate-ping" />
              <span className="font-display font-bold tracking-wider text-base text-[#F3EFE8]">{altitude} m</span>
              <span className="text-[#A3AEC0] hidden sm:inline">
                • {scrollProgress < 0.25 ? 'Pinnacle Sky Suite' : scrollProgress < 0.6 ? 'Level 24 Rooftop Garden' : 'Grand Double-Height Foyer'}
              </span>
            </div>

            {/* Weather Switcher */}
            <div className="bg-[#15233A]/90 backdrop-blur-md p-1.5 rounded-full border border-[#1F3354] shadow-2xl flex items-center gap-1.5 text-xs">
              {Object.keys(SEASONS).map((sKey) => {
                const s = SEASONS[sKey];
                const Icon = s.icon;
                const isActive = activeSeason === sKey;
                return (
                  <button
                    key={sKey}
                    onClick={() => setActiveSeason(sKey)}
                    className={`px-3 py-1 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                      isActive ? 'bg-[#C8814F] text-white shadow-md' : 'text-[#A3AEC0] hover:text-white'
                    }`}
                  >
                    <Icon size={12} />
                    <span className="capitalize hidden sm:inline">{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Synchronized Titles Overlaid during Scroll */}
          <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-12 z-20 pointer-events-none">
            
            {/* Stage 1: Pinnacle View */}
            <div
              className={`max-w-3xl text-center space-y-4 transition-all duration-700 transform ${
                scrollProgress < 0.25 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'
              }`}
            >
              <div className="inline-flex items-center gap-2 bg-[#15233A]/80 backdrop-blur-md px-3.5 py-1 rounded-full border border-[#1F3354] text-xs uppercase font-extrabold tracking-[0.25em] text-[#C8814F]">
                <Sparkles size={12} />
                <span>212 Metres High • Skyline View</span>
              </div>
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-display font-bold text-[#F3EFE8] leading-tight drop-shadow-lg">
                Experience Living Beyond the Ordinary.
              </h2>
              <p className="text-base sm:text-xl text-[#ECE5DA] font-body max-w-xl mx-auto leading-relaxed drop-shadow-md">
                Explore thoughtfully designed residences, architectural elegance and a lifestyle built around you.
              </p>
            </div>

            {/* Stage 2: Level 24 The Ribbon */}
            <div
              className={`max-w-3xl text-center space-y-4 transition-all duration-700 transform ${
                scrollProgress >= 0.25 && scrollProgress < 0.55
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8 pointer-events-none'
              }`}
            >
              <div className="inline-flex items-center gap-2 bg-[#15233A]/80 backdrop-blur-md px-3.5 py-1 rounded-full border border-[#1F3354] text-xs uppercase font-extrabold tracking-[0.25em] text-[#C8814F]">
                <span>Level 24 • Copper Sky Deck</span>
              </div>
              <h3 className="text-4xl sm:text-6xl md:text-7xl font-display font-bold text-[#F3EFE8] leading-tight drop-shadow-lg">
                The Sky Promenade.
              </h3>
              <p className="text-base sm:text-xl text-[#ECE5DA] font-body max-w-xl mx-auto leading-relaxed drop-shadow-md">
                A heated cantilevered infinity pool, private cabanas, and botanic garden finished prior to key handover.
              </p>
            </div>

            {/* Stage 3: Double Height Grand Foyer */}
            <div
              className={`max-w-3xl text-center space-y-4 transition-all duration-700 transform ${
                scrollProgress >= 0.55 && scrollProgress < 0.85
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8 pointer-events-none'
              }`}
            >
              <div className="inline-flex items-center gap-2 bg-[#15233A]/80 backdrop-blur-md px-3.5 py-1 rounded-full border border-[#1F3354] text-xs uppercase font-extrabold tracking-[0.25em] text-[#C8814F]">
                <span>Double-Height Grand Foyer</span>
              </div>
              <h3 className="text-4xl sm:text-6xl md:text-7xl font-display font-bold text-[#F3EFE8] leading-tight drop-shadow-lg">
                Arrive to pure calm.
              </h3>
              <p className="text-base sm:text-xl text-[#ECE5DA] font-body max-w-xl mx-auto leading-relaxed drop-shadow-md">
                A grand arrival portico, 24/7 staffed reception, and protected covered drop-off for monsoon showers.
              </p>
            </div>

            {/* Stage 4: Ground Level / Action CTAs */}
            <div
              className={`max-w-3xl text-center space-y-5 transition-all duration-700 transform pointer-events-auto ${
                scrollProgress >= 0.85 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
              }`}
            >
              <div className="inline-flex items-center gap-2 bg-[#15233A]/80 backdrop-blur-md px-3.5 py-1 rounded-full border border-[#1F3354] text-xs uppercase font-extrabold tracking-[0.25em] text-[#C8814F]">
                <span>PropAssist AI • Ahmedabad Residential Landmark</span>
              </div>
              <h3 className="text-4xl sm:text-6xl font-display font-bold text-[#F3EFE8] drop-shadow-lg">
                Curated 2, 3 &amp; 4 BHK Residences
              </h3>
              <p className="text-sm sm:text-base text-[#ECE5DA] max-w-lg mx-auto leading-relaxed drop-shadow-md">
                Residences from ₹68 Lakhs to ₹2.45 Cr. Transparent carpet area pricing and RERA completion dates in writing.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <button
                  onClick={onExploreProjects}
                  className="bg-[#C8814F] hover:bg-[#b67040] text-white text-xs font-bold px-7 py-3.5 rounded-full shadow-xl transition-all flex items-center gap-2 transform hover:scale-105"
                >
                  <span>Explore Featured Projects</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={onBookVisit}
                  className="bg-[#15233A] hover:bg-[#1f3354] text-[#F3EFE8] border border-[#1F3354] text-xs font-bold px-7 py-3.5 rounded-full transition-all flex items-center gap-2 transform hover:scale-105"
                >
                  <CalendarCheck size={14} className="text-[#C8814F]" />
                  <span>Schedule Site Visit</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Scroll Cue */}
          <div
            className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 text-xs font-medium text-[#A3AEC0] flex items-center gap-2 transition-opacity duration-500 bg-[#0D1726]/70 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#1F3354] ${
              scrollProgress > 0.85 ? 'opacity-0' : 'opacity-90'
            }`}
          >
            <ChevronDown size={14} className="animate-bounce text-[#C8814F]" />
            <span>Scroll to descend through tower</span>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          PART 2: 4K ARCHITECTURAL BUILDING VIDEO TOUR (Autoplaying with Controls)
      ═════════════════════════════════════════════ */}
      <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-[#1F3354]/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-xs uppercase font-extrabold tracking-[0.3em] text-[#C8814F] mb-2">
              High-Definition Architectural Film
            </div>
            <h3 className="text-3xl sm:text-4xl font-display font-bold text-[#F3EFE8]">
              4K Building Tour &amp; Aerial Perspective
            </h3>
            <p className="text-xs sm:text-sm text-[#A3AEC0] mt-1">
              Drone-style aerial sweeps, cantilevered balconies, sunlit courtyards, and evening twilight illumination.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-800">
              ● 4K Architectural Cinema (Playing Automatically)
            </span>
          </div>
        </div>

        {/* 16:9 Video Player Container with Custom Controls */}
        <div
          ref={tourPlayerContainerRef}
          className="relative rounded-3xl overflow-hidden bg-black shadow-2xl border border-[#1F3354] aspect-video group"
        >
          <video
            ref={tourVideoRef}
            src="/assets/hero-scrub.mp4"
            poster="/assets/hero-poster.jpg"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
            className="w-full h-full object-cover cursor-pointer"
          />

          {/* Center Play Button Overlay when paused */}
          {!isPlaying && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center cursor-pointer transition-opacity"
            >
              <div className="w-20 h-20 rounded-full bg-[#C8814F] text-white flex items-center justify-center shadow-2xl transform hover:scale-110 active:scale-95 transition-all">
                <Play size={32} className="ml-1" fill="white" />
              </div>
            </div>
          )}

          {/* Bottom Refined Video Control Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 sm:p-6 transition-opacity opacity-90 group-hover:opacity-100 flex flex-col gap-2">
            
            {/* Interactive Timeline Scrubber */}
            <input
              type="range"
              min="0"
              max={videoDuration || 100}
              step="0.1"
              value={videoCurrentTime}
              onChange={handleSeek}
              className="w-full h-1.5 accent-[#C8814F] bg-white/20 rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between text-xs text-white pt-1">
              {/* Play / Mute / Timestamp */}
              <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="p-1 hover:text-[#C8814F] transition-colors" title={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                </button>

                <button onClick={toggleMute} className="p-1 hover:text-[#C8814F] transition-colors" title={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>

                <span className="text-[11px] font-mono text-gray-300">
                  {formatTime(videoCurrentTime)} / {formatTime(videoDuration)}
                </span>
              </div>

              {/* Right Side: Fullscreen & Tag */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-bold text-[#A3AEC0] hidden sm:inline">
                  PropAssist 4K Tour • Illustrative Project Footage
                </span>
                <button onClick={toggleFullscreen} className="p-1 hover:text-[#C8814F] transition-colors" title="Toggle Fullscreen">
                  <Maximize size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          PART 3: ARCHITECTURAL GALLERY (Interactive Previews & Storytelling)
      ═════════════════════════════════════════════ */}
      <div className="pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="mb-10">
          <div className="text-xs uppercase font-extrabold tracking-[0.3em] text-[#C8814F] mb-2">
            Curated Spaces
          </div>
          <h3 className="text-3xl sm:text-4xl font-display font-bold text-[#F3EFE8]">
            Architectural Gallery &amp; Design Finishes
          </h3>
          <p className="text-xs sm:text-sm text-[#A3AEC0] mt-1">
            Click any perspective to preview the interior volume, natural light ingress, and craftsmanship.
          </p>
        </div>

        {/* Featured Large Viewer */}
        <div className="relative rounded-3xl overflow-hidden border border-[#1F3354] shadow-2xl bg-[#15233A] mb-6 aspect-video max-h-[500px]">
          <img
            src={GALLERY_ITEMS[selectedGalleryIdx].src}
            alt={GALLERY_ITEMS[selectedGalleryIdx].title}
            className="w-full h-full object-cover transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-6 md:p-10">
            <div className="max-w-2xl space-y-2">
              <span className="inline-block bg-[#C8814F] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                {GALLERY_ITEMS[selectedGalleryIdx].category}
              </span>
              <h4 className="text-2xl sm:text-3xl font-display font-bold text-white">
                {GALLERY_ITEMS[selectedGalleryIdx].title}
              </h4>
              <p className="text-xs sm:text-sm text-[#ECE5DA] leading-relaxed">
                {GALLERY_ITEMS[selectedGalleryIdx].desc}
              </p>
            </div>
          </div>
        </div>

        {/* Thumbnail Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-16">
          {GALLERY_ITEMS.map((item, idx) => {
            const isSelected = selectedGalleryIdx === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedGalleryIdx(idx)}
                className={`relative rounded-xl overflow-hidden border transition-all text-left group p-1 ${
                  isSelected
                    ? 'border-[#C8814F] ring-2 ring-[#C8814F]/50 bg-[#15233A]'
                    : 'border-[#1F3354] hover:border-gray-500 bg-[#0D1726]'
                }`}
              >
                <div className="h-20 w-full overflow-hidden rounded-lg">
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-2">
                  <span className="text-[10px] font-bold text-[#F3EFE8] block truncate">
                    {item.title}
                  </span>
                  <span className="text-[9px] text-[#A3AEC0] block truncate">
                    {item.category}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 4 Verified Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="bg-[#15233A]/70 p-5 rounded-2xl border border-[#1F3354]">
            <span className="text-[10px] text-[#A3AEC0] uppercase font-bold block">Tower Structure</span>
            <span className="text-base font-bold text-[#F3EFE8] mt-0.5 block">28-Storey High-Rise</span>
            <span className="text-[11px] text-[#C8814F] block mt-1">SG Highway, Ahmedabad</span>
          </div>
          <div className="bg-[#15233A]/70 p-5 rounded-2xl border border-[#1F3354]">
            <span className="text-[10px] text-[#A3AEC0] uppercase font-bold block">Legal Assurance</span>
            <span className="text-base font-bold text-[#F3EFE8] mt-0.5 block">100% RERA Approved</span>
            <span className="text-[11px] text-emerald-400 block mt-1">PR/GJ/AHMEDABAD Verified</span>
          </div>
          <div className="bg-[#15233A]/70 p-5 rounded-2xl border border-[#1F3354]">
            <span className="text-[10px] text-[#A3AEC0] uppercase font-bold block">Ceiling Height</span>
            <span className="text-base font-bold text-[#F3EFE8] mt-0.5 block">3.4 m Clear Span</span>
            <span className="text-[11px] text-[#C8814F] block mt-1">Expansive Living Volume</span>
          </div>
          <div className="bg-[#15233A]/70 p-5 rounded-2xl border border-[#1F3354]">
            <span className="text-[10px] text-[#A3AEC0] uppercase font-bold block">Experiential Hub</span>
            <span className="text-base font-bold text-[#F3EFE8] mt-0.5 block">45,000 sq.ft Club</span>
            <span className="text-[11px] text-[#C8814F] block mt-1">Rooftop Pool &amp; Spa</span>
          </div>
        </div>

      </div>

    </div>
  );
}
