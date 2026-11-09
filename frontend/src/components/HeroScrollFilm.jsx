import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Sparkles, Sun, CloudRain, Wind, Snowflake, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';

/* ═════════════════════════════════════════════════════════════════════════
   LUMARA RISE — HERO SCROLL FILM ENGINE
   Pinned full-screen video scrubbing from 212m altitude down to street,
   synchronized narrative titles, dynamic altitude HUD, and seasonal weather
═════════════════════════════════════════════════════════════════════════ */

const SEASONS = {
  monsoon: { name: 'Monsoon', temp: '27°C', wind: 'Sea breeze 16 kt', note: 'Petrichor & cool twilight mist', icon: CloudRain, tint: 'rgba(21, 35, 58, 0.45)' },
  summer: { name: 'Summer', temp: '34°C', wind: 'South-west 12 kt', note: 'Golden sunlight & shimmering sea', icon: Sun, tint: 'rgba(200, 129, 79, 0.25)' },
  autumn: { name: 'Autumn', temp: '29°C', wind: 'North-west 10 kt', note: 'Amber sunset & tranquil breeze', icon: Wind, tint: 'rgba(180, 100, 50, 0.20)' },
  winter: { name: 'Winter', temp: '23°C', wind: 'North-east 14 kt', note: 'Crystalline blue evening sky', icon: Snowflake, tint: 'rgba(13, 23, 38, 0.35)' }
};

export default function HeroScrollFilm({ onBookViewing, onSeeResidences }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSeason, setActiveSeason] = useState('monsoon');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);

  // Sync scroll of pinned 400vh container
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
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

  // Smooth lerp loop for video time scrubbing
  useEffect(() => {
    let animId;
    const tick = () => {
      animId = requestAnimationFrame(tick);
      const target = targetProgressRef.current;
      const current = currentProgressRef.current;

      // Smooth damping (k = 0.12)
      const next = current + (target - current) * 0.12;
      currentProgressRef.current = next;
      setScrollProgress(next);

      // Seek video
      const video = videoRef.current;
      if (video && video.duration) {
        const targetTime = next * (video.duration - 0.04);
        if (Math.abs(video.currentTime - targetTime) > 0.03) {
          video.currentTime = targetTime;
        }
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Seasonal Rain / Particle Canvas Effect
  useEffect(() => {
    const canvas = canvasRef.current;
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

    // Weather particles
    const particles = Array.from({ length: 65 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      speed: 3 + Math.random() * 5,
      len: 12 + Math.random() * 16,
      opacity: 0.2 + Math.random() * 0.4
    }));

    let animId;
    const draw = () => {
      animId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);

      // Only draw heavy rain during Monsoon outdoors (progress < 0.38 or > 0.82)
      const isOutdoors = scrollProgress < 0.38 || scrollProgress > 0.82;
      if (activeSeason === 'monsoon' && isOutdoors) {
        ctx.strokeStyle = 'rgba(210, 230, 255, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        particles.forEach((p) => {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2, p.y + p.len);
          p.y += p.speed;
          p.x -= 0.6;
          if (p.y > h) {
            p.y = -10;
            p.x = Math.random() * w;
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

  // Current altitude calculation: 212m down to 0m
  const altitude = Math.max(0, Math.round(212 * (1 - scrollProgress)));
  const seasonInfo = SEASONS[activeSeason];
  const SeasonIcon = seasonInfo.icon;

  return (
    <div ref={containerRef} className="relative h-[380vh] bg-[#0D1726]">
      
      {/* Sticky Fullscreen Viewport */}
      <div className="sticky top-0 w-full h-screen overflow-hidden">
        
        {/* Scrubbable Video Element */}
        <video
          ref={videoRef}
          src="/assets/hero-scrub.mp4"
          poster="/assets/hero-poster.jpg"
          muted
          playsInline
          preload="auto"
          onLoadedData={() => setVideoLoaded(true)}
          className="w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Atmospheric Seasonal Color Grade Overlay */}
        <div
          className="absolute inset-0 pointer-events-none transition-colors duration-1000"
          style={{ backgroundColor: seasonInfo.tint }}
        />

        {/* Dynamic Weather Particles Canvas (Monsoon rain, ambient dust) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10"
        />

        {/* Vignette & Contrast Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1726] via-transparent to-[#0D1726]/60 pointer-events-none z-10" />

        {/* ── TOP HUD BAR ── */}
        <div className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between text-[#F3EFE8]">
          
          {/* Left: Altitude & Tower Elevation */}
          <div className="bg-[#15233A]/85 backdrop-blur-md px-4 py-2 rounded-full border border-[#1F3354] shadow-xl flex items-center gap-3 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#C8814F] animate-ping" />
            <span className="font-display font-bold tracking-wider text-sm">{altitude} m</span>
            <span className="text-[#A3AEC0]">• {scrollProgress < 0.2 ? 'Sky Pinnacle' : scrollProgress < 0.5 ? 'Level 24 (The Ribbon)' : scrollProgress < 0.8 ? 'Sky Lounge' : 'Grand Lobby & Street'}</span>
          </div>

          {/* Right: Seasonal Environment Selector */}
          <div className="bg-[#15233A]/85 backdrop-blur-md p-1 rounded-full border border-[#1F3354] shadow-xl flex items-center gap-1 text-xs">
            {Object.keys(SEASONS).map((sKey) => {
              const s = SEASONS[sKey];
              const Icon = s.icon;
              const isActive = activeSeason === sKey;
              return (
                <button
                  key={sKey}
                  onClick={() => setActiveSeason(sKey)}
                  className={`px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#C8814F] text-white shadow-md'
                      : 'text-[#A3AEC0] hover:text-white'
                  }`}
                >
                  <Icon size={13} />
                  <span className="capitalize hidden sm:inline">{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CINEMATIC NARRATIVE SLIDES (Fade in/out based on scroll) ── */}
        <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-12 z-20 pointer-events-none">
          
          {/* Slide 1: Altitude 212m - The Noise Stays Down There */}
          <div
            className={`max-w-2xl text-center space-y-4 transition-all duration-700 transform ${
              scrollProgress < 0.18
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 -translate-y-8 pointer-events-none'
            }`}
          >
            <div className="text-xs uppercase font-extrabold tracking-[0.3em] text-[#C8814F]">
              Worli, Mumbai • 212 Metres High
            </div>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-display font-bold text-[#F3EFE8] leading-[1.08] tracking-tight">
              The noise stays down there.
            </h2>
            <p className="text-base sm:text-xl text-[#ECE5DA] font-body font-normal leading-relaxed max-w-lg mx-auto">
              Up here, the evening sounds like the sea.
            </p>
          </div>

          {/* Slide 2: Altitude 160m - Four Homes Per Floor */}
          <div
            className={`max-w-2xl text-center space-y-4 transition-all duration-700 transform ${
              scrollProgress >= 0.18 && scrollProgress < 0.38
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8 pointer-events-none'
            }`}
          >
            <div className="text-xs uppercase font-extrabold tracking-[0.3em] text-[#C8814F]">
              Levels 8 to 50
            </div>
            <h2 className="text-4xl sm:text-6xl font-display font-bold text-[#F3EFE8] leading-[1.1]">
              Four homes per floor. Never more.
            </h2>
            <p className="text-base sm:text-xl text-[#ECE5DA] font-body font-normal leading-relaxed max-w-lg mx-auto">
              Your own lift lobby. Neighbours you actually know.
            </p>
          </div>

          {/* Slide 3: Altitude 96m - The Ribbon */}
          <div
            className={`max-w-2xl text-center space-y-4 transition-all duration-700 transform ${
              scrollProgress >= 0.38 && scrollProgress < 0.58
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8 pointer-events-none'
            }`}
          >
            <div className="text-xs uppercase font-extrabold tracking-[0.3em] text-[#C8814F]">
              Level 24 • Copper Sky Garden
            </div>
            <h2 className="text-4xl sm:text-6xl font-display font-bold text-[#F3EFE8] leading-[1.1]">
              The Ribbon.
            </h2>
            <p className="text-base sm:text-xl text-[#ECE5DA] font-body font-normal leading-relaxed max-w-lg mx-auto">
              On level 24, a copper sky garden with an infinity pool, palms, and cabanas. Finished before you move in.
            </p>
          </div>

          {/* Slide 4: Altitude 60m - A Lounge in the Sky */}
          <div
            className={`max-w-2xl text-center space-y-4 transition-all duration-700 transform ${
              scrollProgress >= 0.58 && scrollProgress < 0.78
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8 pointer-events-none'
            }`}
          >
            <div className="text-xs uppercase font-extrabold tracking-[0.3em] text-[#C8814F]">
              Double-Height Panoramic Lounge
            </div>
            <h2 className="text-4xl sm:text-6xl font-display font-bold text-[#F3EFE8] leading-[1.1]">
              A lounge in the sky.
            </h2>
            <p className="text-base sm:text-xl text-[#ECE5DA] font-body font-normal leading-relaxed max-w-lg mx-auto">
              Read, work, or host friends in a double-height room above the city. It comes with your home.
            </p>
          </div>

          {/* Slide 5: Altitude 20m - Come Home to Calm */}
          <div
            className={`max-w-2xl text-center space-y-4 transition-all duration-700 transform ${
              scrollProgress >= 0.78 && scrollProgress < 0.92
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8 pointer-events-none'
            }`}
          >
            <div className="text-xs uppercase font-extrabold tracking-[0.3em] text-[#C8814F]">
              Ground & Porte-Cochère
            </div>
            <h2 className="text-4xl sm:text-6xl font-display font-bold text-[#F3EFE8] leading-[1.1]">
              Come home to calm.
            </h2>
            <p className="text-base sm:text-xl text-[#ECE5DA] font-body font-normal leading-relaxed max-w-lg mx-auto">
              A double-height lobby, staffed day and night, with a covered drop-off for monsoon evenings.
            </p>
          </div>

          {/* Slide 6: Final Destination - LUMARA RISE */}
          <div
            className={`max-w-2xl text-center space-y-6 transition-all duration-700 transform pointer-events-auto ${
              scrollProgress >= 0.92
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8 pointer-events-none'
            }`}
          >
            <div className="text-xs uppercase font-extrabold tracking-[0.35em] text-[#C8814F]">
              Worli, Mumbai
            </div>
            <h1 className="text-5xl sm:text-7xl font-display font-bold text-[#F3EFE8] leading-[1.05] tracking-tight">
              Lumara Rise
            </h1>
            <p className="text-base sm:text-lg text-[#ECE5DA] font-body font-normal leading-relaxed max-w-md mx-auto">
              58 floors of light, air, and quiet, high over the sea. 3 and 4 bedroom residences from ₹10.4 Cr. Handover December 2028, in writing.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={onBookViewing}
                className="bg-[#C8814F] hover:bg-[#b67040] text-white text-sm font-bold px-8 py-3.5 rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
              >
                <span>Book a viewing</span>
                <ArrowRight size={15} />
              </button>
              <button
                onClick={onSeeResidences}
                className="bg-[#15233A]/90 hover:bg-[#15233A] text-[#F3EFE8] border border-[#1F3354] text-sm font-bold px-8 py-3.5 rounded-full shadow-lg transition-all"
              >
                See the residences
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Scroll Cue */}
        <div
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 transition-opacity duration-500 flex items-center gap-2 text-xs font-medium text-[#A3AEC0] ${
            scrollProgress > 0.90 ? 'opacity-0 pointer-events-none' : 'opacity-90'
          }`}
        >
          <ChevronDown size={16} className="animate-bounce text-[#C8814F]" />
          <span>Scroll to descend the tower</span>
        </div>

      </div>
    </div>
  );
}
