import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, ChevronDown, Sparkles, Building2, ShieldCheck,
  MapPin, Sun, CloudRain, Cloud, Sunset
} from 'lucide-react';

/* ═════════════════════════════════════════════════════════════════════════
   PROPASSIST AI — EXPANDED 2D CINEMATIC TOWER SCROLL EXPERIENCE (Reference 1)
   • 500vh Extended Smooth Scroll View Track
   • Weather Switcher: Sunny, Wet (Monsoon), Cloudy, Golden Hour
   • Live HTML5 Canvas Weather Particles (Active Rain Physics)
   • Dynamic Altitude HUD (212m down to 0m)
   • Reverses naturally on scroll up
   • Strictly NO 3D / WebGL / Three.js
═════════════════════════════════════════════════════════════════════════ */

const WEATHER_MODES = {
  sunny: {
    id: 'sunny',
    name: 'Sunny',
    temp: '32°C',
    note: 'Crisp sunlight & shimmering skyline',
    icon: Sun,
    tint: 'rgba(200, 129, 79, 0.18)',
    skyGrade: 'from-amber-500/10 via-transparent to-[#0D1726]/70'
  },
  wet: {
    id: 'wet',
    name: 'Wet / Rain',
    temp: '26°C',
    note: 'Monsoon showers & coastal petrichor mist',
    icon: CloudRain,
    tint: 'rgba(13, 23, 38, 0.45)',
    skyGrade: 'from-slate-700/25 via-slate-900/40 to-[#0D1726]'
  },
  cloudy: {
    id: 'cloudy',
    name: 'Cloudy',
    temp: '28°C',
    note: 'Soft diffused cloud cover & calm breeze',
    icon: Cloud,
    tint: 'rgba(21, 35, 58, 0.35)',
    skyGrade: 'from-slate-600/15 via-transparent to-[#0D1726]/80'
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    temp: '29°C',
    note: 'Golden hour amber glow & twilight calm',
    icon: Sunset,
    tint: 'rgba(180, 95, 45, 0.25)',
    skyGrade: 'from-rose-500/15 via-amber-600/15 to-[#0D1726]/80'
  }
};

const NARRATIVE_STAGES = [
  {
    range: [0.0, 0.22],
    tag: 'Stage 01 • The Pinnacle',
    title: 'Rising 28 Storeys Over Ahmedabad.',
    subtitle: 'A landmark architectural silhouette defined by clean geometric lines and panoramic western skies.',
    detail: '212 Metres • Iconic SG Highway Skyline'
  },
  {
    range: [0.23, 0.48],
    tag: 'Stage 02 • Façade Architecture',
    title: 'Copper Louvres & Deep Cantilevered Decks.',
    subtitle: 'Double-glazed high-efficiency glass shields interiors from summer heat while inviting natural daylight.',
    detail: '100% Usable Carpet Area Layouts'
  },
  {
    range: [0.49, 0.74],
    tag: 'Stage 03 • The Sky Deck',
    title: 'Level 24 Rooftop Infinity Pool & Sky Lounge.',
    subtitle: '45,000 sq.ft experiential amenities suspended high above the city, complete day one before handover.',
    detail: 'Heated Lap Pool • Cabana Gardens'
  },
  {
    range: [0.75, 1.0],
    tag: 'Stage 04 • Grand Entrance',
    title: 'Where Architectural Living Begins.',
    subtitle: 'Double-height drop-off lobby, lush water cascades, and 3-tier access control at street level.',
    detail: 'Vaishno Devi Circle • SG Highway & South Bopal'
  }
];

export default function HeroScrollFilm2D({ onExploreProjects, onBookVisit }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [activeWeather, setActiveWeather] = useState('sunny');

  const targetProgress = useRef(0);
  const currentProgress = useRef(0);

  // Sync scroll of expanded 500vh container
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

  // Smooth lerp loop for 2D video time scrubbing
  useEffect(() => {
    let animId;
    const tick = () => {
      animId = requestAnimationFrame(tick);
      const target = targetProgress.current;
      const current = currentProgress.current;

      // Smooth damping (k = 0.12)
      const next = current + (target - current) * 0.12;
      currentProgress.current = next;
      setProgress(next);

      // Seek 2D video element smoothly
      const video = videoRef.current;
      if (video && video.duration) {
        const targetTime = next * (video.duration - 0.05);
        if (Math.abs(video.currentTime - targetTime) > 0.03) {
          video.currentTime = targetTime;
        }
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Live Canvas Weather Particles (Active Rain Physics for 'wet' mode, Ambient dust for 'sunny/sunset')
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

    // Weather Particles
    const particles = Array.from({ length: activeWeather === 'wet' ? 85 : 30 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      speed: activeWeather === 'wet' ? 6 + Math.random() * 8 : 0.4 + Math.random() * 0.8,
      len: activeWeather === 'wet' ? 14 + Math.random() * 22 : 2 + Math.random() * 3,
      opacity: activeWeather === 'wet' ? 0.25 + Math.random() * 0.5 : 0.15 + Math.random() * 0.3
    }));

    let animId;
    const draw = () => {
      animId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);

      if (activeWeather === 'wet') {
        // Falling Rain with Wind Angle
        ctx.strokeStyle = 'rgba(215, 235, 255, 0.45)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        particles.forEach((p) => {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 3, p.y + p.len);
          p.y += p.speed;
          p.x -= 1.2;
          if (p.y > h) {
            p.y = -15;
            p.x = Math.random() * w;
          }
        });
        ctx.stroke();
      } else if (activeWeather === 'sunny' || activeWeather === 'sunset') {
        // Ambient Golden Shimmer Particles
        ctx.fillStyle = activeWeather === 'sunset' ? 'rgba(255, 180, 120, 0.25)' : 'rgba(255, 230, 160, 0.25)';
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.len / 2, 0, Math.PI * 2);
          ctx.fill();
          p.y -= p.speed;
          p.x += Math.sin(p.y * 0.01) * 0.4;
          if (p.y < -10) {
            p.y = h + 10;
            p.x = Math.random() * w;
          }
        });
      }
    };
    draw();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, [activeWeather]);

  // Current active narrative stage
  const activeStage = NARRATIVE_STAGES.find(
    (s) => progress >= s.range[0] && progress <= s.range[1]
  ) || NARRATIVE_STAGES[NARRATIVE_STAGES.length - 1];

  // Dynamic Altitude: 212m down to ground level
  const altitude = Math.max(0, Math.round(212 * (1 - progress)));
  const currentWeather = WEATHER_MODES[activeWeather];

  return (
    <section id="discover" ref={containerRef} className="relative h-[500vh] bg-[#0D1726]">
      
      {/* Sticky Fullscreen Viewport */}
      <div className="sticky top-0 w-full h-screen overflow-hidden">
        
        {/* Scrubbable 2D High-Resolution Video Element */}
        <video
          ref={videoRef}
          src="/assets/hero-scrub.mp4"
          poster="/assets/hero-poster.jpg"
          muted
          playsInline
          preload="auto"
          onLoadedData={() => setVideoReady(true)}
          className="w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Fallback Static Frame if Video Loading */}
        {!videoReady && (
          <img
            src="/assets/hero-poster.jpg"
            alt="Residential Tower Elevation"
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          />
        )}

        {/* Dynamic Atmospheric Tint Overlay (Changes on weather mode) */}
        <div
          className="absolute inset-0 pointer-events-none transition-colors duration-1000"
          style={{ backgroundColor: currentWeather.tint }}
        />

        {/* Atmospheric Sky Gradient */}
        <div
          className={`absolute inset-0 bg-gradient-to-t ${currentWeather.skyGrade} pointer-events-none transition-all duration-1000`}
        />

        {/* Canvas Weather Particles (Active Rain / Sunbeams) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10"
        />

        {/* Contrast Gradient for Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D1726]/85 via-transparent to-[#0D1726]/40 pointer-events-none" />

        {/* ═════════════════════════════════════════════════════════════════
            TOP HUD: Altitude & Interactive Weather Environment Switcher
        ═════════════════════════════════════════════════════════════════ */}
        <div className="absolute top-20 left-6 md:left-12 right-6 md:right-12 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pointer-events-none">
          
          {/* Left HUD: Altitude & Stage */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="bg-[#15233A]/90 backdrop-blur-md px-4 py-2 rounded-full border border-[#1F3354] flex items-center gap-2.5 shadow-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C8814F] animate-pulse" />
              <span className="font-mono text-xs font-bold text-[#F3EFE8]">{altitude}m Altitude</span>
              <span className="text-[#A3AEC0]">•</span>
              <span className="text-xs text-[#A3AEC0] font-medium">{activeStage.detail}</span>
            </div>
          </div>

          {/* Right HUD: Weather Options (Sunny, Wet/Rain, Cloudy, Sunset) */}
          <div className="pointer-events-auto flex items-center gap-2 bg-[#15233A]/90 backdrop-blur-md p-1 rounded-full border border-[#1F3354] shadow-xl">
            {Object.values(WEATHER_MODES).map((wm) => {
              const isSelected = activeWeather === wm.id;
              const Icon = wm.icon;

              return (
                <button
                  key={wm.id}
                  onClick={() => setActiveWeather(wm.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#C8814F] text-white shadow-md scale-105'
                      : 'text-[#A3AEC0] hover:text-white hover:bg-[#1f3354]'
                  }`}
                  title={`${wm.name} (${wm.temp}) - ${wm.note}`}
                >
                  <Icon size={13} className={isSelected ? 'text-white' : 'text-[#C8814F]'} />
                  <span>{wm.name}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Synchronized Narrative Overlays (Animated along scroll progress) */}
        <div className="absolute bottom-28 left-6 md:left-12 max-w-xl z-20 pointer-events-none">
          <div className="space-y-3 animate-fadeIn">
            <span className="text-xs uppercase font-extrabold tracking-[0.28em] text-[#C8814F] block">
              {activeStage.tag}
            </span>
            <h1 className="text-3xl sm:text-5xl font-display font-bold text-[#F3EFE8] leading-[1.15] drop-shadow-lg">
              {activeStage.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#A3AEC0] font-normal leading-relaxed max-w-lg">
              {activeStage.subtitle}
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-[#E5A872]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E5A872]" />
              <span>Atmosphere: {currentWeather.name} ({currentWeather.temp}) • {currentWeather.note}</span>
            </div>
          </div>
        </div>

        {/* Bottom CTA Bar on Final Frames (progress > 0.65) */}
        <div className="absolute bottom-28 right-6 md:right-12 z-20 flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <button
            onClick={onExploreProjects}
            className="bg-[#C8814F] hover:bg-[#b67040] text-white text-xs font-bold px-6 py-3.5 rounded-full shadow-2xl transition-all flex items-center gap-2 group hover:scale-105"
          >
            <span>Explore 420 Residences</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onBookVisit}
            className="bg-[#15233A]/90 hover:bg-[#1f3354] text-[#F3EFE8] text-xs font-bold px-5 py-3.5 rounded-full border border-[#1F3354] shadow-lg backdrop-blur-md transition-all"
          >
            Schedule Site Visit
          </button>
        </div>

        {/* Scroll Progress Bar at very bottom of sticky viewport */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#15233A]/60 z-30">
          <div
            className="h-full bg-gradient-to-r from-[#C8814F] to-[#E5A872] transition-all duration-75"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

      </div>

    </section>
  );
}
