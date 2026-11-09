import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, Calendar, Building2, MapPin, Layers, Eye, Home } from 'lucide-react';

/* ═════════════════════════════════════════════════════════════════════════
   PROPASSIST AI — BOTTOM CHAPTER NAVIGATION (Reference 1)
   Docked bottom navigation with live scroll progress, chapter highlights,
   smooth scrolling, and responsive mobile collapse.
═════════════════════════════════════════════════════════════════════════ */

const CHAPTERS = [
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'projects', label: 'Our Projects', icon: Building2 },
  { id: 'story', label: 'Architecture', icon: Eye },
  { id: 'residences', label: 'Residences', icon: Home },
  { id: 'amenities', label: 'Amenities', icon: Layers },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'ai-advisor', label: 'AI Advisor', icon: Sparkles },
  { id: 'booking', label: 'Book a Visit', icon: Calendar }
];

export default function BottomChapterNav() {
  const [activeChapter, setActiveChapter] = useState('discover');
  const [scrollProgress, setScrollProgress] = useState(0);

  // Monitor scroll progress and active section intersection
  useEffect(() => {
    const handleScroll = () => {
      // Calculate total page scroll progress percentage
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, scrolled)));

      // Detect active chapter based on element bounding rect
      const offset = 220; // threshold
      for (let i = CHAPTERS.length - 1; i >= 0; i--) {
        const el = document.getElementById(CHAPTERS[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= offset) {
            setActiveChapter(CHAPTERS[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToChapter = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveChapter(id);
    }
  };

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none flex justify-center">
      
      {/* Frosted Glass Navigation Pill */}
      <div className="pointer-events-auto bg-[#0D1726]/90 backdrop-blur-xl border border-[#1F3354] rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.6)] px-2 py-1.5 flex items-center relative overflow-hidden max-w-4xl w-full sm:w-auto">
        
        {/* Top Scroll Progress Micro-bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#1F3354]/60">
          <div
            className="h-full bg-gradient-to-r from-[#C8814F] to-[#E5A872] transition-all duration-100"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Scrollable Chapters Strip */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar w-full justify-between sm:justify-start px-1 py-0.5">
          {CHAPTERS.map((chapter) => {
            const isActive = activeChapter === chapter.id;
            const Icon = chapter.icon;

            return (
              <button
                key={chapter.id}
                onClick={() => scrollToChapter(chapter.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 select-none ${
                  isActive
                    ? 'bg-[#C8814F] text-white shadow-md font-bold scale-[1.02]'
                    : 'text-[#A3AEC0] hover:text-[#F3EFE8] hover:bg-[#15233A]/70'
                }`}
                title={chapter.label}
              >
                <Icon size={13} className={isActive ? 'text-white' : 'text-[#C8814F]'} />
                <span className="text-[11px] sm:text-xs">{chapter.label}</span>
              </button>
            );
          })}
        </div>

        {/* Progress Numeric Badge */}
        <div className="hidden md:flex items-center pl-3 pr-2 border-l border-[#1F3354] text-[10px] font-mono text-[#A3AEC0] shrink-0">
          <span>{Math.round(scrollProgress)}%</span>
        </div>

      </div>

    </div>
  );
}
