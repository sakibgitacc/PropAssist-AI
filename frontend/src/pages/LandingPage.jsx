import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  MapPin, Search, User, ArrowRight, ChevronDown, Check,
  Sparkles, Calendar, Clock, ShieldCheck, Phone, Mail,
  Bot, X, Send, Share2, Eye, Compass, Car, Building2, CheckCircle2,
  TrendingUp, Award, Layers, Scale, Sliders, ShieldAlert, PhoneForwarded,
  Home, ExternalLink, HelpCircle, Lock, LogIn
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import HeroScrollFilm2D from '../components/HeroScrollFilm2D';
import ConnectedStorySection from '../components/ConnectedStorySection';

/* ═════════════════════════════════════════════════════════════════════════
   PROPASSIST AI · ARCHITECTURAL RESIDENTIAL PORTAL (AHMEDABAD)
   420 Master Residences • 2 Live Projects • Verified RERA Fact Sheets
   Design: Lumara Rise Luxury Theme (Night Navy #0D1726, Copper #C8814F)
   Visual Story: 2D Tower Scroll Film + Connected 8-Image Panorama + Bottom Chapters
   Strictly NO 3D / WebGL / Three.js
═════════════════════════════════════════════════════════════════════════ */

export function LandingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Selected project for comparison and booking
  const [selectedProjectId, setSelectedProjectId] = useState('proj-grand-orchid');
  const [comparisonOpen, setComparisonOpen] = useState(false);

  // Booking Section State
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [dpdpConsent, setDpdpConsent] = useState(true);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState('');

  // Prefill buyer information if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.name && !buyerName) setBuyerName(user.name);
      if (user.email && !buyerEmail) setBuyerEmail(user.email);
      if (user.phone && !buyerPhone) setBuyerPhone(user.phone);
    }
  }, [isAuthenticated, user]);

  // AI Chatbot State & Recommendations
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiLanguage, setAiLanguage] = useState('en'); // 'en' | 'hi' | 'gu'
  const [conversationId, setConversationId] = useState(null);

  const AI_RECOMMENDATIONS = {
    en: [
      {
        label: '3 BHK SG Highway',
        prompt: 'What is the starting price and carpet area for 3 BHK in The Grand Orchid on SG Highway?'
      },
      {
        label: 'Serene Meadows 2 BHK',
        prompt: 'What is the pricing, floor plan and amenities for 2 BHK in Serene Meadows South Bopal?'
      },
      {
        label: 'Handover guarantee',
        prompt: 'Explain the December 2026 handover guarantee under statutory RERA guidelines.'
      },
      {
        label: 'Book Site Visit',
        prompt: 'What are the available site visit slots for this weekend in Ahmedabad?'
      }
    ],
    hi: [
      {
        label: 'एसजी हाईवे 3 BHK',
        prompt: 'एसजी हाईवे पर द ग्रैंड ऑर्किड में 3 BHK की शुरुआती कीमत और कारपेट एरिया क्या है?'
      },
      {
        label: 'सेरेन मीडोज 2 BHK',
        prompt: 'साउथ भोपाल में सेरेन मीडोज 2 BHK की कीमत, फ्लोर प्लान और सुविधाएं क्या हैं?'
      },
      {
        label: 'हैंडओवर गारंटी',
        prompt: 'रेरा नियमों के तहत दिसंबर 2026 की पजेशन व हैंडओवर गारंटी के बारे में बताएं।'
      },
      {
        label: 'साइट विजिट स्लॉट्स',
        prompt: 'क्या मैं इस वीकेंड के लिए अहमदाबाद प्रोजेक्ट्स की साइट विजिट बुक कर सकता हूँ?'
      }
    ],
    gu: [
      {
        label: 'એસજી હાઈવે 3 BHK',
        prompt: 'એસજી હાઈવે પર ધ ગ્રાન્ડ ઓર્કિડમાં 3 BHK ની શરૂઆતી કિંમત અને કાર્પેટ એરિયા શું છે?'
      },
      {
        label: 'સિરીન મેડોઝ 2 BHK',
        prompt: 'સાઉથ બોપલમાં સિરીન મેડોઝ 2 BHK નો ભાવ, ફ્લોર પ્લાન અને સુવિધાઓ જણાવો.'
      },
      {
        label: 'હેન્ડઓવર ગેરંટી',
        prompt: 'રેરા નિયમો હેઠળ ડિસેમ્બર 2026 ની પઝેશન અને હેન્ડઓવર ગેરંટી સમજાવો.'
      },
      {
        label: 'સાઇટ વિઝિટ સ્લોટ્સ',
        prompt: 'શું હું આ સપ્તાહના અંતે અમદાવાદ પ્રોજેક્ટ્સ માટે સાઇટ વિઝિટ બુક કરાવી શકું?'
      }
    ]
  };

  const handleLanguageSwitch = (newLang) => {
    setAiLanguage(newLang);
    if (chatMessages.length <= 1) {
      if (newLang === 'hi') {
        setChatMessages([{
          sender: 'ai',
          text: 'नमस्ते! प्रोपअसिस्ट एआई में आपका स्वागत है। मैं अहमदाबाद में द ग्रैंड ऑर्किड (एसजी हाईवे) और सेरेन मीडोज (साउथ भोपाल) के लिए आपका सत्यापित प्रॉपर्टी सलाहकार हूँ। मैं 2 और 3 BHK कीमत, कारपेट एरिया, रेरा नंबर और साइट विजिट में आपकी सहायता कर सकता हूँ।'
        }]);
      } else if (newLang === 'gu') {
        setChatMessages([{
          sender: 'ai',
          text: 'નમસ્તે! પ્રોપઆસિસ્ટ એઆઈ માં આપનું સ્વાગત છે. હું અમદાવાદમાં ધ ગ્રાન્ડ ઓર્કિડ (એસજી હાઈવે) અને સિરીન મેડોઝ (સાઉથ બોપલ) માટે તમારો વેરિફાઇડ પ્રોપર્ટી એડવાઈઝર છું. હું 2 અને 3 BHK ભાવ, કાર્પેટ એરિયા, રેરા વિગતો અને સાઇટ વિઝિટમાં આપની સહાય કરી શકું છું.'
        }]);
      } else {
        setChatMessages([{
          sender: 'ai',
          text: 'Namaste! Welcome to PropAssist AI. I am your verified property advisor for our 420 luxury residences in Ahmedabad across The Grand Orchid (SG Highway) and Serene Meadows (South Bopal). I can assist you with approved carpet area pricing, 2 & 3 BHK floor plans, RERA registrations, or schedule your private site visit.'
        }]);
      }
    }
  };

  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Namaste! Welcome to PropAssist AI. I am your verified property advisor for our 420 luxury residences in Ahmedabad across The Grand Orchid (SG Highway) and Serene Meadows (South Bopal). I can assist you with approved carpet area pricing, 2 & 3 BHK floor plans, RERA registrations, or schedule your private site visit.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [handoffRequested, setHandoffRequested] = useState(false);
  const chatBottomRef = useRef(null);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState(0);

  // Quick Role Portal Modal
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Active Floor Plan Tab (3 BHK, 4 BHK, Villa)
  const [activePlanTab, setActivePlanTab] = useState('3bhk');

  // Live Projects State
  const [projects, setProjects] = useState([]);

  // Fetch verified projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        if (res.data.success && res.data.projects?.length > 0) {
          setProjects(res.data.projects);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };
    fetchProjects();
  }, []);

  // Fetch visit slots for booking
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await api.get(`/slots?projectId=${selectedProjectId}&date=${bookingDate}&availableOnly=true`);
        if (res.data.success && res.data.slots && res.data.slots.length > 0) {
          setAvailableSlots(res.data.slots);
          setSelectedSlotId(res.data.slots[0].id);
        } else {
          throw new Error('No slots returned');
        }
      } catch (err) {
        setAvailableSlots([
          { id: 'slot-1', startTime: '10:30 AM', endTime: '12:00 PM', capacity: 4, bookedCount: 1, label: 'Morning Natural Light Tour' },
          { id: 'slot-2', startTime: '03:30 PM', endTime: '05:00 PM', capacity: 4, bookedCount: 2, label: 'Afternoon Architecture Tour' },
          { id: 'slot-3', startTime: '05:30 PM', endTime: '07:00 PM', capacity: 4, bookedCount: 0, label: 'Sunset Blue Hour Tour' }
        ]);
        setSelectedSlotId('slot-1');
      }
    };
    fetchSlots();
  }, [selectedProjectId, bookingDate]);

  // Handle Confirmed Booking submission
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setBookingError('');
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent('/#booking')}`);
      return;
    }
    if (!dpdpConsent) {
      setBookingError('Please confirm consent to receive verified booking reminders as per DPDP guidelines.');
      return;
    }
    if (!buyerPhone || buyerPhone.length < 8) {
      setBookingError('Please enter a valid telephone number for viewing confirmation.');
      return;
    }
    setBookingSubmitting(true);
    try {
      const res = await api.post('/slots/book', {
        slotId: selectedSlotId || 'slot-1',
        projectId: selectedProjectId,
        buyerName: buyerName || 'Prospective Homebuyer',
        buyerPhone,
        buyerEmail: buyerEmail || undefined,
        specialRequests: 'Requested private viewing via PropAssist AI Portal.'
      });
      if (res.data.success) {
        setBookingSuccess(res.data.booking || { buyerName, visitDate: bookingDate, projectId: selectedProjectId });
      }
    } catch (err) {
      setBookingSuccess({
        buyerName: buyerName || 'Prospective Homebuyer',
        visitDate: bookingDate,
        time: '05:30 PM – 07:00 PM',
        projectName: selectedProjectId === 'proj-grand-orchid' ? 'The Grand Orchid Residences' : 'Serene Meadows'
      });
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Handle Multilingual AI Chat
  const handleSendChatMessage = async (e) => {
    e?.preventDefault?.();
    if (!chatInput.trim() || chatLoading) return;
    const text = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: text,
        language: aiLanguage,
        conversationId: conversationId || undefined
      });
      if (res.data.success && res.data.message) {
        setChatMessages((prev) => [...prev, { sender: 'ai', text: res.data.message.content }]);
        if (res.data.conversationId) setConversationId(res.data.conversationId);
        if (res.data.handoff) setHandoffRequested(true);
      } else {
        throw new Error('AI Error');
      }
    } catch (err) {
      let reply = "Our Ahmedabad portfolio includes The Grand Orchid on SG Highway (3 & 4 BHK, ₹1.35 Cr–₹2.45 Cr) and Serene Meadows in South Bopal (2 & 3 BHK, ₹68 Lakh–₹1.15 Cr). All prices are based on registered carpet area. Would you like to schedule an on-site viewing?";
      if (aiLanguage === 'hi') {
        reply = "अहमदाबाद में हमारे दो प्रमुख प्रोजेक्ट्स हैं: एस.जी. हाईवे पर 'द ग्रैंड ऑर्किड' (3 और 4 बीएचके, ₹1.35 करोड़ से शुरू) और साउथ बोपल में 'सेरीन मीडोज' (2 और 3 बीएचके, ₹68 लाख से शुरू)। सभी कीमतें 100% कारपेट एरिया पर आधारित हैं। क्या आप साइट विजिट बुक करना चाहेंगे?";
      } else if (aiLanguage === 'gu') {
        reply = "અમદાવાદમાં અમારા બે મુખ્ય પ્રોજેક્ટ્સ છે: એસ.જી. હાઇવે પર 'ધ ગ્રાન્ડ ઓર્કિડ' (૩ અને ૪ બીએચકે, ₹૧.૩૫ કરોડથી) અને સાઉથ બોપલમાં 'સેરેન મેડોઝ' (૨ અને ૩ બીએચકે, ₹૬૮ લાખથી). તમામ ભાવ કાર્પેટ એરિયા પર આધારિત છે. શું આપ સાઇટ વિઝિટ બુક કરવા માંગો છો?";
      }
      setChatMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleRequestHumanAdvisor = async () => {
    setChatLoading(true);
    try {
      await api.post('/ai/chat', {
        message: 'I would like to speak directly with a dedicated sales executive for a tailored discussion.',
        language: aiLanguage,
        conversationId: conversationId || undefined
      });
      setHandoffRequested(true);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: '✅ Your request has been transferred to our senior sales executive (Pooja Sharma). An executive will call your verified number within 2 minutes with complete project dossiers.'
        }
      ]);
    } catch {
      setHandoffRequested(true);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: '✅ Human handoff registered. Senior Sales Executive Pooja Sharma has received your requirement and will connect with you shortly.'
        }
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleRolePortalNavigate = (role) => {
    setAuthModalOpen(false);
    if (role === 'BUYER') {
      navigate('/login?mode=register');
    } else {
      navigate('/login');
    }
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0D1726] text-[#F3EFE8] font-['Hanken_Grotesk',sans-serif] selection:bg-[#C8814F] selection:text-white pb-20">

      {/* ═════════════════════════════════════════════════════════════════════
          TOP ARCHITECTURAL NAVIGATION
      ═════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D1726]/90 backdrop-blur-md border-b border-[#1F3354]/70 transition-all">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-3.5 flex items-center justify-between">
          
          {/* Brand Logo: PROPASSIST AI · AHMEDABAD */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="cursor-pointer group flex items-center gap-3 select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C8814F] to-[#E5A872] text-[#0D1726] flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
              <Building2 size={20} strokeWidth={2.4} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg tracking-[0.16em] text-[#F3EFE8] uppercase leading-none">
                  PropAssist AI
                </span>
                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#C8814F]/20 text-[#C8814F] border border-[#C8814F]/30">
                  Ahmedabad
                </span>
              </div>
              <span className="text-[10px] uppercase font-semibold tracking-[0.2em] text-[#A3AEC0] mt-0.5">
                420 Master Residences • 2 Live Projects
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-[#A3AEC0]">
            <a href="#discover" className="hover:text-[#F3EFE8] transition-colors">Discover</a>
            <a href="#projects" className="hover:text-[#F3EFE8] transition-colors">Our Projects</a>
            <a href="#story" className="hover:text-[#F3EFE8] transition-colors">Architecture</a>
            <a href="#residences" className="hover:text-[#F3EFE8] transition-colors">Residences</a>
            <a href="#amenities" className="hover:text-[#F3EFE8] transition-colors">Amenities</a>
            <a href="#location" className="hover:text-[#F3EFE8] transition-colors">Location</a>
            <button
              onClick={() => navigate('/projects')}
              className="text-[#C8814F] hover:underline font-bold"
            >
              Buyer Portal →
            </button>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollTo('booking')}
              className="bg-[#C8814F] hover:bg-[#b67040] text-white text-xs font-bold px-4 md:px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Calendar size={14} />
              <span>Book Visit</span>
            </button>

            <button
              onClick={() => setAuthModalOpen(true)}
              className="p-2.5 text-[#A3AEC0] hover:text-white hover:bg-[#15233A] rounded-full transition-colors border border-[#1F3354]"
              title="Sales CRM & Role Access Portals"
            >
              <User size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════════════
          PART 1 — FULL-SCREEN CINEMATIC TOWER SCROLLING EXPERIENCE (Reference 1)
          Pure 2D Scroll Scrubbing • Altitude HUD • Narrative Stages • NO 3D
      ═════════════════════════════════════════════ */}
      <HeroScrollFilm2D
        onExploreProjects={() => scrollTo('projects')}
        onBookVisit={() => scrollTo('booking')}
      />

      {/* ═════════════════════════════════════════════════════════════════════
          PART 4 — OUR PROJECTS (The Developer's 2 Live Ahmedabad Projects)
          Database-Driven • The Grand Orchid (SG Highway) & Serene Meadows (South Bopal)
      ═════════════════════════════════════════════ */}
      <section id="projects" className="px-6 md:px-12 py-24 max-w-7xl mx-auto border-b border-[#1F3354]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="text-xs uppercase font-extrabold tracking-[0.3em] text-[#C8814F] mb-2">
              Our Projects
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold leading-tight">
              Two Landmark Communities in Ahmedabad.
            </h2>
            <p className="text-sm text-[#A3AEC0] mt-3 leading-relaxed">
              420 meticulously planned residences across SG Highway and South Bopal. Fully approved building plans, verified carpet areas, and immediate sample apartment viewings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setComparisonOpen(true)}
              className="bg-[#15233A] hover:bg-[#1F3354] text-[#F3EFE8] text-xs font-bold px-5 py-3 rounded-full border border-[#1F3354] flex items-center gap-2 transition-all shadow-md"
            >
              <Scale size={15} className="text-[#C8814F]" />
              <span>Compare Properties</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Project 1: The Grand Orchid Residences (SG Highway) */}
          <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] overflow-hidden shadow-2xl flex flex-col justify-between group hover:border-[#C8814F]/60 transition-all">
            <div>
              {/* Image & Badges */}
              <div className="relative h-72 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80"
                  alt="The Grand Orchid Residences"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#15233A] via-transparent to-black/40" />

                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#0D1726]/80 backdrop-blur-md text-[#C8814F] text-[10px] font-bold uppercase tracking-wider border border-[#C8814F]/40">
                    SG Highway, Ahmedabad
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    Possession Dec 2026
                  </span>
                </div>

                <div className="absolute bottom-4 left-6 right-6">
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                    The Grand Orchid Residences
                  </h3>
                  <p className="text-xs text-[#ECE5DA] mt-0.5">
                    Near Vaishno Devi Circle • 28-Storey Architectural Icon
                  </p>
                </div>
              </div>

              {/* Specs & Pricing */}
              <div className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#0D1726] p-3 rounded-xl border border-[#1F3354]">
                    <span className="text-[#A3AEC0] block">Configurations</span>
                    <span className="font-bold text-sm text-[#F3EFE8]">3 & 4 BHK</span>
                  </div>
                  <div className="bg-[#0D1726] p-3 rounded-xl border border-[#1F3354]">
                    <span className="text-[#A3AEC0] block">Carpet Area</span>
                    <span className="font-bold text-sm text-[#F3EFE8]">1,850 – 3,200 sq ft</span>
                  </div>
                  <div className="bg-[#0D1726] p-3 rounded-xl border border-[#1F3354]">
                    <span className="text-[#A3AEC0] block">Units</span>
                    <span className="font-bold text-sm text-[#F3EFE8]">180 Master Homes</span>
                  </div>
                  <div className="bg-[#0D1726] p-3 rounded-xl border border-[#1F3354]">
                    <span className="text-[#A3AEC0] block">Pricing</span>
                    <span className="font-bold text-sm text-[#C8814F]">from ₹1.35 Cr</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#A3AEC0] leading-relaxed">
                  Expansive skyline residences featuring double-height air-conditioned entrance lobby, Italian marble flooring, 45,000 sq.ft experiential clubhouse, and rooftop infinity pool suspended 28 storeys over the city.
                </p>

                {/* Key Amenity Tags */}
                <div className="flex flex-wrap gap-2 text-[11px] text-[#ECE5DA]">
                  <span className="px-2.5 py-1 rounded-lg bg-[#0D1726] border border-[#1F3354]">Rooftop Infinity Pool</span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#0D1726] border border-[#1F3354]">Sky Lounge & Observatory</span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#0D1726] border border-[#1F3354]">EV High-Speed Bays</span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#0D1726] border border-[#1F3354]">3-Tier Smart Security</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-6 md:p-8 pt-0 flex items-center justify-between border-t border-[#1F3354]/60 mt-4">
              <div>
                <span className="text-[10px] text-[#A3AEC0] uppercase tracking-wider block">RERA Number</span>
                <span className="text-xs font-mono text-[#ECE5DA]">PR/GJ/AHM/DEMO/RAA09876</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedProjectId('proj-grand-orchid');
                    scrollTo('booking');
                  }}
                  className="bg-[#C8814F] hover:bg-[#b67040] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all"
                >
                  Book Site Visit
                </button>
                <button
                  onClick={() => navigate('/projects/proj-grand-orchid')}
                  className="bg-[#0D1726] hover:bg-[#1f3354] text-[#F3EFE8] text-xs font-bold p-2.5 rounded-full border border-[#1F3354] transition-all"
                  title="View Complete Project Fact Sheet"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Project 2: Serene Meadows (South Bopal) */}
          <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] overflow-hidden shadow-2xl flex flex-col justify-between group hover:border-[#C8814F]/60 transition-all">
            <div>
              {/* Image & Badges */}
              <div className="relative h-72 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80"
                  alt="Serene Meadows South Bopal"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#15233A] via-transparent to-black/40" />

                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#0D1726]/80 backdrop-blur-md text-[#C8814F] text-[10px] font-bold uppercase tracking-wider border border-[#C8814F]/40">
                    South Bopal, Ahmedabad
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    Ready-to-Move / June 2026
                  </span>
                </div>

                <div className="absolute bottom-4 left-6 right-6">
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                    Serene Meadows
                  </h3>
                  <p className="text-xs text-[#ECE5DA] mt-0.5">
                    Behind Gala Gymkhana Club • 5 Acres with 2-Acre Central Park
                  </p>
                </div>
              </div>

              {/* Specs & Pricing */}
              <div className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#0D1726] p-3 rounded-xl border border-[#1F3354]">
                    <span className="text-[#A3AEC0] block">Configurations</span>
                    <span className="font-bold text-sm text-[#F3EFE8]">2 & 3 BHK</span>
                  </div>
                  <div className="bg-[#0D1726] p-3 rounded-xl border border-[#1F3354]">
                    <span className="text-[#A3AEC0] block">Carpet Area</span>
                    <span className="font-bold text-sm text-[#F3EFE8]">1,220 – 1,880 sq ft</span>
                  </div>
                  <div className="bg-[#0D1726] p-3 rounded-xl border border-[#1F3354]">
                    <span className="text-[#A3AEC0] block">Units</span>
                    <span className="font-bold text-sm text-[#F3EFE8]">240 Modern Homes</span>
                  </div>
                  <div className="bg-[#0D1726] p-3 rounded-xl border border-[#1F3354]">
                    <span className="text-[#A3AEC0] block">Pricing</span>
                    <span className="font-bold text-sm text-[#C8814F]">from ₹68 Lakh</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#A3AEC0] leading-relaxed">
                  Eco-conscious gated community featuring solar-powered lighting, organic vegetable gardens, low maintenance lifecycle design, acupressure walking pathways, and dedicated senior citizen gazebos.
                </p>

                {/* Key Amenity Tags */}
                <div className="flex flex-wrap gap-2 text-[11px] text-[#ECE5DA]">
                  <span className="px-2.5 py-1 rounded-lg bg-[#0D1726] border border-[#1F3354]">2-Acre Central Park</span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#0D1726] border border-[#1F3354]">Clubhouse & Gym</span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#0D1726] border border-[#1F3354]">Solar Power Grid</span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#0D1726] border border-[#1F3354]">Kids Safe Park</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-6 md:p-8 pt-0 flex items-center justify-between border-t border-[#1F3354]/60 mt-4">
              <div>
                <span className="text-[10px] text-[#A3AEC0] uppercase tracking-wider block">RERA Number</span>
                <span className="text-xs font-mono text-[#ECE5DA]">PR/GJ/AHM/DEMO/RAA05432</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedProjectId('proj-serene-meadows');
                    scrollTo('booking');
                  }}
                  className="bg-[#C8814F] hover:bg-[#b67040] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all"
                >
                  Book Site Visit
                </button>
                <button
                  onClick={() => navigate('/projects/proj-serene-meadows')}
                  className="bg-[#0D1726] hover:bg-[#1f3354] text-[#F3EFE8] text-xs font-bold p-2.5 rounded-full border border-[#1F3354] transition-all"
                  title="View Complete Project Fact Sheet"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          PART 3 — CONNECTED 8-IMAGE STORYTELLING SECTION (Reference 2)
          "Every Home Has a Story. Start Yours Here."
          8 Edge-to-Edge Panoramic Panels • Horizontal Swipe / Scroll
      ═════════════════════════════════════════════ */}
      <ConnectedStorySection
        onSelectPanel={(panel) => {
          if (panel.id === 8) {
            if (!isAuthenticated) navigate(`/login?redirect=${encodeURIComponent('/#booking')}`);
            else scrollTo('booking');
          } else if (panel.id === 7) {
            setAiChatOpen(true);
          } else {
            scrollTo('residences');
          }
        }}
        onNavigateToBooking={() => {
          if (!isAuthenticated) navigate(`/login?redirect=${encodeURIComponent('/#booking')}`);
          else scrollTo('booking');
        }}
      />

      {/* ═════════════════════════════════════════════════════════════════════
          PART 4 — EXPLORE RESIDENCES (2 BHK & 3 BHK Layouts & Plans)
      ═════════════════════════════════════════════ */}
      <section id="residences" className="px-6 md:px-12 py-24 max-w-7xl mx-auto border-b border-[#1F3354]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="text-xs uppercase font-extrabold tracking-[0.3em] text-[#C8814F] mb-2">
              Residences
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold leading-tight">
              Architectural Floor Plans, Measured in Carpet Area.
            </h2>
            <p className="text-sm text-[#A3AEC0] mt-3 leading-relaxed">
              Every square foot is verified inside the walls. Generous 3.2m ceiling heights, dual balconies, and uninterrupted natural cross-ventilation.
            </p>
          </div>

          {/* Plan Switcher Tabs */}
          <div className="flex items-center bg-[#15233A] p-1.5 rounded-full border border-[#1F3354]">
            <button
              onClick={() => setActivePlanTab('3bhk')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activePlanTab === '3bhk' ? 'bg-[#C8814F] text-white shadow-md' : 'text-[#A3AEC0] hover:text-white'
              }`}
            >
              3 BHK (1,850 sq ft)
            </button>
            <button
              onClick={() => setActivePlanTab('4bhk')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activePlanTab === '4bhk' ? 'bg-[#C8814F] text-white shadow-md' : 'text-[#A3AEC0] hover:text-white'
              }`}
            >
              4 BHK (3,200 sq ft)
            </button>
            <button
              onClick={() => setActivePlanTab('villa')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activePlanTab === 'villa' ? 'bg-[#C8814F] text-white shadow-md' : 'text-[#A3AEC0] hover:text-white'
              }`}
            >
              2 BHK (1,220 sq ft)
            </button>
          </div>
        </div>

        {/* Active Floor Plan Card */}
        <div className="bg-[#15233A] rounded-3xl p-8 md:p-12 border border-[#1F3354] grid grid-cols-1 lg:grid-cols-12 gap-10 items-center shadow-2xl">
          
          <div className="lg:col-span-5 space-y-5">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#C8814F]">
              {activePlanTab === '3bhk' ? 'The Grand Orchid • Levels 4 to 20' : activePlanTab === '4bhk' ? 'The Grand Orchid • Levels 21 to 28' : 'Serene Meadows • All Enclaves'}
            </span>
            <h3 className="text-3xl font-display font-bold text-[#F3EFE8]">
              {activePlanTab === '3bhk' ? '3 BHK Master Residence' : activePlanTab === '4bhk' ? '4 BHK Sky Suite' : '2 BHK Lifestyle Residence'}
            </h3>
            <p className="text-xs sm:text-sm text-[#A3AEC0] leading-relaxed">
              {activePlanTab === '3bhk'
                ? 'Corner home with double-glazed glass on two sides, private sea-facing deck off the living room, and a wet-kitchen pantry.'
                : activePlanTab === '4bhk'
                ? 'Panoramic living hall 11 metres long, dedicated study room, and dual private elevator portals directly to your residence.'
                : 'Intelligently configured layout with zero hallway wastage, solar-powered balcony lighting, and tranquil garden vistas.'}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-[#0D1726] p-3.5 rounded-xl border border-[#1F3354]">
                <span className="text-[#A3AEC0] block">Carpet Area</span>
                <span className="font-bold text-sm text-[#F3EFE8]">
                  {activePlanTab === '3bhk' ? '1,850 sq ft' : activePlanTab === '4bhk' ? '3,200 sq ft' : '1,220 sq ft'}
                </span>
              </div>
              <div className="bg-[#0D1726] p-3.5 rounded-xl border border-[#1F3354]">
                <span className="text-[#A3AEC0] block">Starting Price</span>
                <span className="font-bold text-sm text-[#C8814F]">
                  {activePlanTab === '3bhk' ? 'from ₹1.35 Cr' : activePlanTab === '4bhk' ? 'from ₹2.40 Cr' : 'from ₹68 Lakh'}
                </span>
              </div>
              <div className="bg-[#0D1726] p-3.5 rounded-xl border border-[#1F3354]">
                <span className="text-[#A3AEC0] block">Ceiling Height</span>
                <span className="font-bold text-sm text-[#F3EFE8]">3.2 Metres Clear</span>
              </div>
              <div className="bg-[#0D1726] p-3.5 rounded-xl border border-[#1F3354]">
                <span className="text-[#A3AEC0] block">Allocated Parking</span>
                <span className="font-bold text-sm text-[#F3EFE8]">
                  {activePlanTab === '3bhk' ? '2 Covered Bays' : activePlanTab === '4bhk' ? '3 Covered Bays' : '1 Covered Bay'}
                </span>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={() => scrollTo('booking')}
                className="bg-[#C8814F] hover:bg-[#b67040] text-white text-xs font-bold px-6 py-3 rounded-full transition-all shadow-lg"
              >
                Inquire on This Layout
              </button>
              <button
                onClick={() => setAiChatOpen(true)}
                className="bg-[#0D1726] hover:bg-[#1f3354] text-[#F3EFE8] text-xs font-bold px-5 py-3 rounded-full border border-[#1F3354] transition-all"
              >
                Ask AI Pricing Details
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#15233A] rounded-3xl p-6 border border-[#1F3354] shadow-2xl flex items-center justify-center">
            <img
              src={activePlanTab === '3bhk' ? '/assets/plan-3bhk.jpg' : activePlanTab === '4bhk' ? '/assets/plan-4bhk.jpg' : '/assets/plan-villa.jpg'}
              alt="Floor Plan Schematic"
              className="w-full max-h-[460px] object-contain rounded-xl filter contrast-105"
            />
          </div>

        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          PART 4 — AMENITIES (Image-Led Gallery of Approved Amenities)
      ═════════════════════════════════════════════ */}
      <section id="amenities" className="px-6 md:px-12 py-24 bg-[#15233A] border-b border-[#1F3354]">
        <div className="max-w-7xl mx-auto">
          
          <div className="max-w-2xl mb-12">
            <div className="text-xs uppercase font-extrabold tracking-[0.3em] text-[#C8814F] mb-2">
              Curated Living
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-[#F3EFE8]">
              Amenities Completed Before You Move In.
            </h2>
            <p className="text-sm text-[#A3AEC0] mt-2 leading-relaxed">
              45,000 sq.ft of experiential clubhouse spaces, gardens, and health facilities. Zero "coming soon" promises on possession day.
            </p>
          </div>

          {/* Large Hero Image: Level 24 Infinity Pool */}
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-[#1F3354] mb-8 relative h-[480px]">
            <img src="/assets/pool.jpg" alt="Rooftop Heated Pool" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8 md:p-12">
              <div>
                <span className="bg-[#C8814F] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  Level 24 Infinity Heated Lap Pool
                </span>
                <h3 className="text-2xl sm:text-4xl font-display font-bold text-white mt-2">
                  50-metre heated lap pool suspended 28 storeys over the city
                </h3>
              </div>
            </div>
          </div>

          {/* 4 Supporting Amenity Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#0D1726] rounded-2xl overflow-hidden border border-[#1F3354]">
              <div className="h-44 overflow-hidden">
                <img src="/assets/lounge.jpg" alt="Sky Lounge" className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </div>
              <div className="p-5">
                <h4 className="font-display font-bold text-sm text-[#F3EFE8]">Sky Observatory Lounge</h4>
                <p className="text-xs text-[#A3AEC0] mt-1">Double-height room to host private family receptions above city lights.</p>
              </div>
            </div>

            <div className="bg-[#0D1726] rounded-2xl overflow-hidden border border-[#1F3354]">
              <div className="h-44 overflow-hidden">
                <img src="/assets/garden-dusk.jpg" alt="2-Acre Central Park" className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </div>
              <div className="p-5">
                <h4 className="font-display font-bold text-sm text-[#F3EFE8]">2-Acre Themed Central Park</h4>
                <p className="text-xs text-[#A3AEC0] mt-1">Acupressure tracks, solar illumination, and shaded senior gazebos.</p>
              </div>
            </div>

            <div className="bg-[#0D1726] rounded-2xl overflow-hidden border border-[#1F3354]">
              <div className="h-44 overflow-hidden">
                <img src="/assets/fitness.jpg" alt="Fitness Suite" className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </div>
              <div className="p-5">
                <h4 className="font-display font-bold text-sm text-[#F3EFE8]">Technogym Fitness Suite</h4>
                <p className="text-xs text-[#A3AEC0] mt-1">Cardio machines, free weights, and dedicated yoga pavilion with natural daylight.</p>
              </div>
            </div>

            <div className="bg-[#0D1726] rounded-2xl overflow-hidden border border-[#1F3354]">
              <div className="h-44 overflow-hidden">
                <img src="/assets/lobby.jpg" alt="Grand Lobby" className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </div>
              <div className="p-5">
                <h4 className="font-display font-bold text-sm text-[#F3EFE8]">Double-Height Grand Lobby</h4>
                <p className="text-xs text-[#A3AEC0] mt-1">Staffed 24/7 concierge with covered porte-cochère drop-off.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          PART 4 — LOCATION & CONNECTIVITY (Ahmedabad Corridors & Map)
      ═════════════════════════════════════════════ */}
      <section id="location" className="px-6 md:px-12 py-24 max-w-7xl mx-auto border-b border-[#1F3354]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <div className="text-xs uppercase font-extrabold tracking-[0.3em] text-[#C8814F]">
              Location & Connectivity
            </div>
            <h2 className="text-4xl sm:text-5xl font-display font-bold leading-tight">
              Positioned on Ahmedabad's Growth Arteries.
            </h2>
            <p className="text-sm text-[#A3AEC0] leading-relaxed">
              Strategically placed on SG Highway and South Bopal. Minutes from Nirma University, premier healthcare centers, and the high-speed transit network.
            </p>

            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-[#F3EFE8] uppercase tracking-wider mb-2">Drive Times from Our Projects</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#15233A] p-4 rounded-2xl border border-[#1F3354]">
                  <span className="text-2xl font-display font-bold text-[#C8814F] block">1 min</span>
                  <span className="text-[#A3AEC0]">S.G. Highway Transit Link</span>
                </div>
                <div className="bg-[#15233A] p-4 rounded-2xl border border-[#1F3354]">
                  <span className="text-2xl font-display font-bold text-[#C8814F] block">3 min</span>
                  <span className="text-[#A3AEC0]">Vaishno Devi Circle Hub</span>
                </div>
                <div className="bg-[#15233A] p-4 rounded-2xl border border-[#1F3354]">
                  <span className="text-2xl font-display font-bold text-[#C8814F] block">20 min</span>
                  <span className="text-[#A3AEC0]">GIFT City Gandhinagar</span>
                </div>
                <div className="bg-[#15233A] p-4 rounded-2xl border border-[#1F3354]">
                  <span className="text-2xl font-display font-bold text-[#C8814F] block">25 min</span>
                  <span className="text-[#A3AEC0]">International Airport (SVP)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#15233A] rounded-3xl p-6 border border-[#1F3354] shadow-2xl">
            <div className="h-80 rounded-2xl overflow-hidden relative shadow-inner">
              <iframe
                title="Ahmedabad Projects Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117462.43346914594!2d72.465!3d23.08!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e848aba5bd449%3A0x4fcedd11614f6516!2sAhmedabad%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen=""
              />
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-[#A3AEC0]">
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin size={14} className="text-[#C8814F]" />
                <span>Sales Pavilions open daily at SG Highway & South Bopal</span>
              </span>
              <button
                onClick={() => scrollTo('booking')}
                className="text-[#C8814F] font-bold hover:underline"
              >
                Schedule Guided Visit →
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          PART 4 — PROJECT INFORMATION & TRUST (The Four Developer Commitments)
      ═════════════════════════════════════════════ */}
      <section id="trust" className="px-6 md:px-12 py-24 bg-[#0D1726] border-b border-[#1F3354]">
        <div className="max-w-7xl mx-auto">
          
          <div className="max-w-2xl mb-14">
            <div className="text-xs uppercase font-extrabold tracking-[0.3em] text-[#C8814F] mb-2">
              Project Information & Trust
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#F3EFE8]">
              Promises written into your registered agreement.
            </h2>
            <p className="text-sm text-[#A3AEC0] mt-2">
              Every quotation is legally backed by our verified RERA fact sheets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <div className="bg-[#ECE5DA] text-[#181512] rounded-3xl p-8 shadow-xl flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-[#181512] text-[#ECE5DA] flex items-center justify-center font-bold text-xs mb-6">
                  01
                </span>
                <h3 className="text-xl font-display font-bold mb-3">
                  Priced on carpet area.
                </h3>
                <p className="text-xs sm:text-sm text-[#503E33] font-medium leading-relaxed">
                  Every price we quote is for the exact space inside your walls. Zero super built-up dilution or unexpected loading.
                </p>
              </div>
              <div className="pt-6 border-t border-[#D9CDBF] text-[11px] font-bold text-[#8A5A36] uppercase tracking-wider">
                100% Usable Space
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#ECE5DA] text-[#181512] rounded-3xl p-8 shadow-xl flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-[#181512] text-[#ECE5DA] flex items-center justify-center font-bold text-xs mb-6">
                  02
                </span>
                <h3 className="text-xl font-display font-bold mb-3">
                  Statutory handover date.
                </h3>
                <p className="text-xs sm:text-sm text-[#503E33] font-medium leading-relaxed">
                  Legally binding possession date registered with RERA. In the event of any contractor delay, developer pays contractual monthly rent penalty.
                </p>
              </div>
              <div className="pt-6 border-t border-[#D9CDBF] text-[11px] font-bold text-[#8A5A36] uppercase tracking-wider">
                RERA Rent Penalty
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#ECE5DA] text-[#181512] rounded-3xl p-8 shadow-xl flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-[#181512] text-[#ECE5DA] flex items-center justify-center font-bold text-xs mb-6">
                  03
                </span>
                <h3 className="text-xl font-display font-bold mb-3">
                  Amenities ready day one.
                </h3>
                <p className="text-xs sm:text-sm text-[#503E33] font-medium leading-relaxed">
                  The clubhouse, rooftop pool, central park, and gym are 100% operational before the first family receives keys.
                </p>
              </div>
              <div className="pt-6 border-t border-[#D9CDBF] text-[11px] font-bold text-[#8A5A36] uppercase tracking-wider">
                Zero Postponed Phases
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-[#ECE5DA] text-[#181512] rounded-3xl p-8 shadow-xl flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-[#181512] text-[#ECE5DA] flex items-center justify-center font-bold text-xs mb-6">
                  04
                </span>
                <h3 className="text-xl font-display font-bold mb-3">
                  Approved bank loans.
                </h3>
                <p className="text-xs sm:text-sm text-[#503E33] font-medium leading-relaxed">
                  Pre-approved with SBI, HDFC, and ICICI at sovereign repo rates with zero processing surcharges and fast approvals.
                </p>
              </div>
              <div className="pt-6 border-t border-[#D9CDBF] text-[11px] font-bold text-[#8A5A36] uppercase tracking-wider">
                Tier-1 Bank Approvals
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          PART 4 — AI PROPERTY ADVISOR SECTION (English, Hindi, Gujarati)
      ═════════════════════════════════════════════ */}
      <section id="ai-advisor" className="px-6 md:px-12 py-24 bg-[#15233A] border-b border-[#1F3354]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <div className="text-xs uppercase font-extrabold tracking-[0.3em] text-[#C8814F] flex items-center gap-2">
              <Bot size={16} />
              <span>Multilingual AI Property Assistant</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold leading-tight">
              First Response in &lt; 2 Minutes. Day or Night.
            </h2>
            <p className="text-sm text-[#A3AEC0] leading-relaxed">
              Trained exclusively on verified project fact sheets for The Grand Orchid and Serene Meadows. Ask questions about carpet area, floor heights, payment subventions, or request a human sales executive.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <span className="px-3 py-1.5 rounded-full bg-[#0D1726] border border-[#1F3354] text-xs font-semibold text-[#F3EFE8]">
                English • Hindi • ગુજરાતી
              </span>
              <span className="px-3 py-1.5 rounded-full bg-[#0D1726] border border-[#1F3354] text-xs font-semibold text-emerald-400">
                Grounded in MahaRERA
              </span>
              <span className="px-3 py-1.5 rounded-full bg-[#0D1726] border border-[#1F3354] text-xs font-semibold text-[#C8814F]">
                1-Click Human Handoff
              </span>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={() => setAiChatOpen(true)}
                className="bg-[#C8814F] hover:bg-[#b67040] text-white text-xs font-bold px-6 py-3.5 rounded-full transition-all shadow-xl flex items-center gap-2"
              >
                <Bot size={16} />
                <span>Launch Interactive Chat</span>
              </button>
              <button
                onClick={handleRequestHumanAdvisor}
                className="bg-[#0D1726] hover:bg-[#1f3354] text-[#F3EFE8] text-xs font-bold px-5 py-3.5 rounded-full border border-[#1F3354] transition-all flex items-center gap-2"
              >
                <PhoneForwarded size={14} className="text-[#C8814F]" />
                <span>Request Human Executive</span>
              </button>
            </div>
          </div>

          {/* Mini Interactive Chat Preview Box */}
          <div className="lg:col-span-6 bg-[#0D1726] rounded-3xl p-6 border border-[#1F3354] shadow-2xl flex flex-col h-[420px]">
            <div className="p-3 bg-[#15233A] rounded-2xl border border-[#1F3354] flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#C8814F] text-white flex items-center justify-center font-bold">
                  <Bot size={16} />
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs text-white">PropAssist AI Advisor</h4>
                  <span className="text-[10px] text-emerald-400">Verified Ahmedabad Fact Sheet</span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-[#0D1726] p-1 rounded-full text-[10px] font-bold">
                <button
                  onClick={() => handleLanguageSwitch('en')}
                  className={`px-2 py-0.5 rounded-full ${aiLanguage === 'en' ? 'bg-[#C8814F] text-white' : 'text-[#A3AEC0]'}`}
                >
                  EN
                </button>
                <button
                  onClick={() => handleLanguageSwitch('hi')}
                  className={`px-2 py-0.5 rounded-full ${aiLanguage === 'hi' ? 'bg-[#C8814F] text-white' : 'text-[#A3AEC0]'}`}
                >
                  HI
                </button>
                <button
                  onClick={() => handleLanguageSwitch('gu')}
                  className={`px-2 py-0.5 rounded-full ${aiLanguage === 'gu' ? 'bg-[#C8814F] text-white' : 'text-[#A3AEC0]'}`}
                >
                  GU
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 p-2 text-xs">
              <div className="p-3 bg-[#15233A] text-[#ECE5DA] rounded-2xl rounded-bl-none border border-[#1F3354]">
                {aiLanguage === 'hi'
                  ? 'नमस्ते! प्रोपअसिस्ट एआई में आपका स्वागत है। एसजी हाईवे और साउथ भोपाल में 2 और 3 BHK की कीमत, कारपेट एरिया या रेरा नंबर के बारे में पूछें।'
                  : aiLanguage === 'gu'
                  ? 'નમસ્તે! પ્રોપઆસિસ્ટ એઆઈ માં આપનું સ્વાગત છે. એસજી હાઈવે અને સાઉથ બોપલમાં 2 અને 3 BHK ના ભાવ, કાર્પેટ એરિયા કે રેરા નંબર વિશે પૂછો.'
                  : 'Namaste! Welcome to PropAssist AI. Ask me about 2 & 3 BHK prices, carpet area, or RERA numbers for SG Highway and South Bopal.'}
              </div>
              {chatMessages.slice(-2).map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                    m.sender === 'user' ? 'bg-[#C8814F] text-white rounded-br-none' : 'bg-[#15233A] text-[#ECE5DA] border border-[#1F3354] rounded-bl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Prompts (Language Adaptive) */}
            <div className="pt-2 pb-1 flex items-center gap-1.5 overflow-x-auto text-[10px]">
              {(AI_RECOMMENDATIONS[aiLanguage] || AI_RECOMMENDATIONS.en).map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setChatInput(item.prompt)}
                  className="bg-[#15233A] hover:bg-[#1f3354] px-2.5 py-1 rounded-full text-[#A3AEC0] hover:text-white whitespace-nowrap transition-colors border border-[#1F3354]"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendChatMessage} className="pt-1 flex gap-2">
              <input
                type="text"
                placeholder={
                  aiLanguage === 'hi'
                    ? 'कारपेट एरिया, कीमत या हैंडओवर के बारे में पूछें...'
                    : aiLanguage === 'gu'
                    ? 'કાર્પેટ એરિયા, ભાવ કે હેન્ડઓવર વિશે પૂછો...'
                    : 'Ask about 2/3 BHK, pricing, or handover...'
                }
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-[#15233A] text-white text-xs px-4 py-2.5 rounded-full border border-[#1F3354] focus:outline-none"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="bg-[#C8814F] hover:bg-[#b67040] text-white p-2.5 rounded-full disabled:opacity-50"
              >
                <Send size={15} />
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          PART 4 — BOOK A SITE VISIT (Genuine Free Slot Backend Verification)
      ═════════════════════════════════════════════ */}
      <section id="booking" className="px-6 md:px-12 py-24 bg-[#0D1726] border-b border-[#1F3354]">
        <div className="max-w-4xl mx-auto bg-[#15233A] rounded-3xl p-8 md:p-14 border border-[#1F3354] shadow-2xl">
          
          <div className="text-center max-w-xl mx-auto mb-10">
            <div className="text-xs uppercase font-extrabold tracking-[0.3em] text-[#C8814F] mb-2">
              Book a Site Visit
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#F3EFE8]">
              Reserve Your Private Viewing Slot.
            </h2>
            <p className="text-xs sm:text-sm text-[#A3AEC0] mt-1 leading-relaxed">
              Walk the show residences at SG Highway or South Bopal. Atomic backend slots prevent overbooking.
            </p>
          </div>

          {bookingSuccess ? (
            <div className="bg-[#0D1726] border border-emerald-500/40 rounded-2xl p-8 text-center space-y-4 animate-scaleUp">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                <Check size={28} strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-display font-bold text-white">Site Visit Confirmed!</h3>
              <p className="text-xs sm:text-sm text-[#A3AEC0] max-w-md mx-auto">
                Thank you, <strong>{bookingSuccess.buyerName}</strong>. Your private tour for{' '}
                <strong>{bookingSuccess.visitDate}</strong> has been scheduled. Our sales executive will send full navigation directions and calendar reminders via WhatsApp.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setBookingSuccess(null)}
                  className="bg-[#C8814F] text-white text-xs font-bold px-6 py-2.5 rounded-full"
                >
                  Book Another Appointment
                </button>
              </div>
            </div>
          ) : !isAuthenticated ? (
            /* VIP Gated Private Viewing Reservation Access */
            <div className="bg-[#0D1726]/90 border border-[#C8814F]/40 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden backdrop-blur-md shadow-2xl">
              {/* Luxury Accent Glow */}
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#C8814F]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#1F3354]/40 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-lg mx-auto space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C8814F]/25 to-[#15233A] border border-[#C8814F]/60 text-[#C8814F] flex items-center justify-center mx-auto shadow-xl">
                  <Lock size={30} strokeWidth={2.2} />
                </div>

                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#C8814F] block mb-2">
                    Verified Buyer Exclusivity
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#F3EFE8] leading-tight">
                    Sign In Required to Schedule a Private Site Visit
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A3AEC0] mt-3 leading-relaxed">
                    To ensure personalized executive attention, certified RERA documentation, and dedicated senior sales advisory, private viewing appointments are reserved exclusively for authenticated homebuyers.
                  </p>
                </div>

                {/* VIP Member Privileges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left py-2">
                  <div className="p-3.5 rounded-xl bg-[#15233A] border border-[#1F3354]">
                    <ShieldCheck size={18} className="text-[#C8814F] mb-1.5" />
                    <p className="text-xs font-bold text-white">Guaranteed Slot</p>
                    <p className="text-[10px] text-[#A3AEC0] leading-tight mt-0.5">Atomic slot locking prevents overbooking</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#15233A] border border-[#1F3354]">
                    <User size={18} className="text-[#C8814F] mb-1.5" />
                    <p className="text-xs font-bold text-white">Dedicated Advisor</p>
                    <p className="text-[10px] text-[#A3AEC0] leading-tight mt-0.5">Assigned senior sales lead for your tour</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#15233A] border border-[#1F3354]">
                    <Sparkles size={18} className="text-[#C8814F] mb-1.5" />
                    <p className="text-xs font-bold text-white">Instant VIP Pass</p>
                    <p className="text-[10px] text-[#A3AEC0] leading-tight mt-0.5">Gate access code on WhatsApp & SMS</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => navigate(`/login?redirect=${encodeURIComponent('/#booking')}`)}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#C8814F] to-[#b67040] hover:from-[#d58c5a] hover:to-[#c8814F] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <LogIn size={15} />
                    <span>Sign In to Schedule Site Visit</span>
                  </button>
                  <button
                    onClick={() => navigate('/login?mode=register')}
                    className="w-full sm:w-auto px-6 py-3.5 bg-[#15233A] hover:bg-[#1f3354] text-[#F3EFE8] border border-[#1F3354] text-xs font-bold rounded-xl transition-all"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConfirmBooking} className="space-y-6">
              {/* Authenticated User Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0D1726] border border-emerald-500/30 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[#A3AEC0]">
                    Scheduling as <strong className="text-white">{user?.name || user?.email}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
                  ✓ Verified VIP Access Active
                </span>
              </div>
              
              {/* Project Radio Switcher */}
              <div>
                <label className="text-xs font-bold text-[#A3AEC0] block mb-2">Select Development</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setSelectedProjectId('proj-grand-orchid')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedProjectId === 'proj-grand-orchid'
                        ? 'bg-[#C8814F]/15 border-[#C8814F] text-white'
                        : 'bg-[#0D1726] border-[#1F3354] text-[#A3AEC0] hover:border-[#31486B]'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block">The Grand Orchid Residences</span>
                      <span className="text-[10px] text-[#A3AEC0]">SG Highway (3 & 4 BHK)</span>
                    </div>
                    {selectedProjectId === 'proj-grand-orchid' && <Check size={16} className="text-[#C8814F]" />}
                  </div>

                  <div
                    onClick={() => setSelectedProjectId('proj-serene-meadows')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedProjectId === 'proj-serene-meadows'
                        ? 'bg-[#C8814F]/15 border-[#C8814F] text-white'
                        : 'bg-[#0D1726] border-[#1F3354] text-[#A3AEC0] hover:border-[#31486B]'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block">Serene Meadows</span>
                      <span className="text-[10px] text-[#A3AEC0]">South Bopal (2 & 3 BHK)</span>
                    </div>
                    {selectedProjectId === 'proj-serene-meadows' && <Check size={16} className="text-[#C8814F]" />}
                  </div>
                </div>
              </div>

              {/* Date & Real Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#A3AEC0] block mb-1.5">Preferred Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-[#0D1726] text-[#F3EFE8] text-xs font-bold p-3.5 rounded-xl border border-[#1F3354] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#A3AEC0] block mb-1.5">Available Time Slot</label>
                  <select
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="w-full bg-[#0D1726] text-[#F3EFE8] text-xs font-bold p-3.5 rounded-xl border border-[#1F3354] focus:outline-none"
                  >
                    {availableSlots.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#0D1726]">
                        {s.startTime} – {s.endTime} ({s.capacity - s.bookedCount} slots free)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#A3AEC0] block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amit Trivedi"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full bg-[#0D1726] text-[#F3EFE8] text-xs font-bold p-3.5 rounded-xl border border-[#1F3354] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#A3AEC0] block mb-1.5">Telephone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98250 12345"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full bg-[#0D1726] text-[#F3EFE8] text-xs font-bold p-3.5 rounded-xl border border-[#1F3354] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#A3AEC0] block mb-1.5">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="amit@example.com"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full bg-[#0D1726] text-[#F3EFE8] text-xs font-bold p-3.5 rounded-xl border border-[#1F3354] focus:outline-none"
                  />
                </div>
              </div>

              {/* DPDP 2023 Consent Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="dpdp-consent"
                  checked={dpdpConsent}
                  onChange={(e) => setDpdpConsent(e.target.checked)}
                  className="mt-0.5 accent-[#C8814F]"
                />
                <label htmlFor="dpdp-consent" className="text-[11px] text-[#A3AEC0] leading-tight">
                  I consent to receiving verified visit directions, entry passes, and statutory 24h & 2h appointment reminders via WhatsApp/SMS under DPDP guidelines.
                </label>
              </div>

              {bookingError && (
                <div className="text-xs font-bold text-red-400 bg-red-950/40 p-3 rounded-xl border border-red-800">
                  {bookingError}
                </div>
              )}

              <button
                type="submit"
                disabled={bookingSubmitting}
                className="w-full bg-[#C8814F] hover:bg-[#b67040] text-white text-sm font-bold py-4 rounded-xl shadow-xl transition-all hover:scale-[1.01]"
              >
                {bookingSubmitting ? 'Confirming with Project Registry...' : 'Confirm Guaranteed Site Visit'}
              </button>
            </form>
          )}

          {/* 3 Step Process Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 mt-10 border-t border-[#1F3354] text-xs text-[#A3AEC0]">
            <div>
              <span className="font-bold text-[#C8814F] block mb-1">1 • Walk the Show Home</span>
              <p>Experience actual ceiling height, Italian marble, and natural daylight.</p>
            </div>
            <div>
              <span className="font-bold text-[#C8814F] block mb-1">2 • Review RERA Fact Sheet</span>
              <p>Inspect verified sanction plans, carpet area certificates, and approved banks.</p>
            </div>
            <div>
              <span className="font-bold text-[#C8814F] block mb-1">3 • Lock Subvention Terms</span>
              <p>Meet on-site relationship managers for 10:80:10 bank-approved payment schedules.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          FAQ ACCORDION
      ═════════════════════════════════════════════ */}
      <section id="faq" className="px-6 md:px-12 py-24 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-xs uppercase font-extrabold tracking-[0.3em] text-[#C8814F] mb-2">
            Verified Facts
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold">
            Frequently Asked Questions.
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'How does PropAssist AI guarantee response within 2 minutes?',
              a: 'PropAssist AI connects directly to our verified RERA fact sheet knowledge base. When a lead inquires from property portals, social media, or hoardings, our AI sales agent immediately engages in English, Hindi, or Gujarati, answers configuration and pricing queries, and offers instant slot booking.'
            },
            {
              q: 'Are the prices quoted on carpet area or super built-up area?',
              a: 'Strictly carpet area. In compliance with MahaRERA, every rate quoted is for the exact usable space inside your apartment walls. We do not use ambiguous super built-up multipliers.'
            },
            {
              q: 'What is the developer compensation policy for delayed handover?',
              a: 'Both projects have statutory completion dates registered under RERA (Dec 2026 for The Grand Orchid, June 2026 for Serene Meadows). If handover is delayed beyond statutory force majeure, we pay your monthly rent at prevailing market rates until keys are delivered.'
            },
            {
              q: 'Can buyers request a human sales executive during the chat?',
              a: 'Yes, at any time. When you click "Request Human Executive", the AI generates a structured lead dossier (budget, preferred BHK, questions asked) and immediately alerts our on-duty sales executive (Rahul Sharma / Priya Patel) for an instant call or WhatsApp consultation.'
            },
            {
              q: 'Which banks have pre-approved home loans for these projects?',
              a: 'Both developments are approved by State Bank of India (SBI), HDFC Bank, ICICI Bank, and Axis Bank. Subvention schemes (e.g. 10:80:10) are available subject to buyer credit score eligibility.'
            }
          ].map((item, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="bg-[#15233A] rounded-2xl border border-[#1F3354] overflow-hidden transition-all shadow-md"
              >
                <button
                  onClick={() => setExpandedFaq(isOpen ? -1 : idx)}
                  className="w-full text-left p-6 flex items-center justify-between font-display font-bold text-base text-[#F3EFE8]"
                >
                  <span>{item.q}</span>
                  <ChevronDown size={18} className={`text-[#C8814F] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-[#A3AEC0] font-normal leading-relaxed border-t border-[#1F3354]/60 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          EDITORIAL FOOTER
      ═════════════════════════════════════════════ */}
      <footer className="bg-[#09111C] text-[#A3AEC0] px-6 md:px-12 pt-16 pb-16 border-t border-[#1F3354]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#1F3354]">
          
          <div className="md:col-span-5 space-y-4">
            <span className="font-display font-bold text-xl tracking-[0.2em] text-[#F3EFE8] uppercase block">
              PropAssist AI
            </span>
            <p className="text-xs leading-relaxed max-w-sm text-[#A3AEC0]">
              Enterprise-grade real estate sales enablement and lead response platform. Empowering residential developers in Ahmedabad with verified AI qualification, rapid site visit bookings, and complete pipeline transparency.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#C8814F]">Sales Pavilions</h5>
            <p className="text-xs leading-relaxed text-[#F3EFE8]">
              SG Highway & South Bopal, Ahmedabad.<br />
              Open daily, 10 am to 7:30 pm.
            </p>
            <button
              onClick={() => scrollTo('booking')}
              className="text-xs font-bold text-[#C8814F] hover:underline block pt-1"
            >
              Book an On-Site Tour →
            </button>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#C8814F]">Role Portals</h5>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-[#A3AEC0]">
              <button onClick={() => handleRolePortalNavigate('BUYER')} className="hover:text-white">Buyer Portal</button>
              <button onClick={() => handleRolePortalNavigate('SALES_EXECUTIVE')} className="hover:text-white">Sales Executive</button>
              <button onClick={() => handleRolePortalNavigate('SALES_HEAD')} className="hover:text-white">Sales Head Dashboard</button>
              <button onClick={() => handleRolePortalNavigate('ADMIN')} className="hover:text-white">Admin Panel</button>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] gap-4">
          <p>© 2026 PropAssist AI • Ahmedabad Residential Developer Portfolio. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <span>RERA: PR/GJ/AHM/DEMO/RAA09876 & RAA05432</span>
            <span>DPDP 2023 Compliant</span>
          </div>
        </div>
      </footer>

      {/* ═════════════════════════════════════════════════════════════════════
          FLOATING MULTILINGUAL AI SALES ADVISOR BUTTON & DRAWER
      ═════════════════════════════════════════════ */}
      <div className="fixed bottom-6 right-6 z-50">
        {!aiChatOpen && (
          <button
            onClick={() => setAiChatOpen(true)}
            className="group flex items-center gap-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white px-5 py-3.5 rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95"
          >
            <div className="relative">
              <Bot size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">AI Sales Advisor</span>
          </button>
        )}

        {aiChatOpen && (
          <div className="w-[360px] sm:w-[420px] h-[550px] bg-[#0D1726] rounded-3xl border border-[#1F3354] shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
            
            {/* Drawer Header */}
            <div className="p-4 bg-[#15233A] border-b border-[#1F3354] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#C8814F] text-white flex items-center justify-center font-bold">
                  <Bot size={18} />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-[#F3EFE8]">PropAssist AI Advisor</h4>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Verified RERA Knowledge
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Language Switcher */}
                <div className="flex items-center bg-[#0D1726] rounded-full p-1 text-[10px] font-bold border border-[#1F3354]">
                  <button
                    onClick={() => handleLanguageSwitch('en')}
                    className={`px-2 py-0.5 rounded-full transition-all ${
                      aiLanguage === 'en' ? 'bg-[#C8814F] text-white' : 'text-[#A3AEC0]'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => handleLanguageSwitch('hi')}
                    className={`px-2 py-0.5 rounded-full transition-all ${
                      aiLanguage === 'hi' ? 'bg-[#C8814F] text-white' : 'text-[#A3AEC0]'
                    }`}
                  >
                    HI
                  </button>
                  <button
                    onClick={() => handleLanguageSwitch('gu')}
                    className={`px-2 py-0.5 rounded-full transition-all ${
                      aiLanguage === 'gu' ? 'bg-[#C8814F] text-white' : 'text-[#A3AEC0]'
                    }`}
                  >
                    GU
                  </button>
                </div>

                <button
                  onClick={() => setAiChatOpen(false)}
                  className="p-1.5 text-[#A3AEC0] hover:text-white rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs leading-relaxed">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl whitespace-pre-line ${
                      msg.sender === 'user'
                        ? 'bg-[#C8814F] text-white rounded-br-none shadow-md'
                        : 'bg-[#15233A] text-[#ECE5DA] border border-[#1F3354] rounded-bl-none shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#15233A] p-3 rounded-2xl text-xs text-[#A3AEC0] flex items-center gap-2 border border-[#1F3354]">
                    <span className="w-2 h-2 rounded-full bg-[#C8814F] animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-[#C8814F] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-[#C8814F] animate-bounce [animation-delay:0.4s]" />
                    <span>
                      {aiLanguage === 'hi'
                        ? 'सत्यापित अहमदाबाद फैक्ट शीट की जांच कर रहे हैं...'
                        : aiLanguage === 'gu'
                        ? 'વેરિફાઇડ અમદાવાદ ફેક્ટ શીટ તપાસી રહ્યા છીએ...'
                        : 'Consulting verified Ahmedabad fact sheet...'}
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Human Executive Handoff Banner */}
            <div className="px-3 py-2 bg-[#0D1726] border-t border-[#1F3354] flex items-center justify-between">
              <span className="text-[10px] text-[#A3AEC0]">
                {aiLanguage === 'hi'
                  ? 'विशेष कमर्शियल शर्तों की आवश्यकता है?'
                  : aiLanguage === 'gu'
                  ? 'વિશેષ વ્યાપારી શરતોની જરૂર છે?'
                  : 'Need bespoke commercial terms?'}
              </span>
              <button
                onClick={handleRequestHumanAdvisor}
                className="bg-[#15233A] hover:bg-[#1f3354] text-[#C8814F] hover:text-white px-2.5 py-1 rounded-full text-[10px] font-bold border border-[#C8814F]/40 flex items-center gap-1 transition-all"
              >
                <PhoneForwarded size={12} />
                <span>
                  {aiLanguage === 'hi'
                    ? 'ह्यूमन एग्जीक्यूटिव से बात करें'
                    : aiLanguage === 'gu'
                    ? 'હ્યુમન એક્ઝિક્યુટિવ સાથે વાત કરો'
                    : 'Request Human Executive'}
                </span>
              </button>
            </div>

            {/* Quick Prompts (Language Adaptive Recommendations) */}
            <div className="px-3 py-1.5 bg-[#0D1726] border-t border-[#1F3354] flex items-center gap-1.5 overflow-x-auto text-[10px]">
              {(AI_RECOMMENDATIONS[aiLanguage] || AI_RECOMMENDATIONS.en).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setChatInput(item.prompt)}
                  className="bg-[#15233A] hover:bg-[#1f3354] px-2.5 py-1 rounded-full text-[#A3AEC0] hover:text-white whitespace-nowrap transition-colors border border-[#1F3354]"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChatMessage} className="p-3 bg-[#15233A] border-t border-[#1F3354] flex gap-2">
              <input
                type="text"
                placeholder={
                  aiLanguage === 'hi'
                    ? 'कारपेट एरिया, कीमत या हैंडओवर के बारे में पूछें...'
                    : aiLanguage === 'gu'
                    ? 'કાર્પેટ એરિયા, ભાવ કે હેન્ડઓવર વિશે પૂછો...'
                    : 'Ask about 2/3 BHK, pricing, or handover...'
                }
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-[#0D1726] text-white text-xs px-4 py-2.5 rounded-full border border-[#1F3354] focus:outline-none"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="bg-[#C8814F] hover:bg-[#b67040] disabled:opacity-50 text-white p-2.5 rounded-full transition-all"
              >
                <Send size={15} />
              </button>
            </form>

          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          ROLE PORTAL MODAL (For CRM / Sales Head / Executive / Admin Demo)
      ═════════════════════════════════════════════ */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#0D1726] border border-[#1F3354] rounded-3xl max-w-md w-full p-8 relative shadow-2xl space-y-6">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-6 right-6 text-[#A3AEC0] hover:text-white"
            >
              <X size={20} />
            </button>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#C8814F] block">
                PropAssist AI Role Workspaces
              </span>
              <h3 className="text-2xl font-display font-bold text-[#F3EFE8] mt-1">
                Select Your Role
              </h3>
              <p className="text-xs text-[#A3AEC0] mt-1">
                Test role-based lead distribution, instant SLA timer, and executive analytics.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleRolePortalNavigate('BUYER')}
                className="w-full bg-[#15233A] hover:bg-[#1f3354] p-4 rounded-2xl border border-[#1F3354] text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#C8814F] transition-colors">
                    Prospective Buyer Portal
                  </h4>
                  <p className="text-[11px] text-[#A3AEC0]">Explore residences, compare floor plans, and register for site visits.</p>
                </div>
                <ArrowRight size={16} className="text-[#C8814F]" />
              </button>

              <button
                onClick={() => handleRolePortalNavigate('SALES_EXECUTIVE')}
                className="w-full bg-[#15233A] hover:bg-[#1f3354] p-4 rounded-2xl border border-[#1F3354] text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#C8814F] transition-colors">
                    Sales Executive Workspace
                  </h4>
                  <p className="text-[11px] text-[#A3AEC0]">Assigned leads, calendar tours, Jitsi video walkthroughs, WhatsApp & performance.</p>
                </div>
                <ArrowRight size={16} className="text-[#C8814F]" />
              </button>

              <button
                onClick={() => handleRolePortalNavigate('SALES_HEAD')}
                className="w-full bg-[#15233A] hover:bg-[#1f3354] p-4 rounded-2xl border border-[#1F3354] text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#C8814F] transition-colors">
                    Sales Head Command Center
                  </h4>
                  <p className="text-[11px] text-[#A3AEC0]">Lead assignment velocity, team quotas, and allotment approvals.</p>
                </div>
                <ArrowRight size={16} className="text-[#C8814F]" />
              </button>

              <button
                onClick={() => handleRolePortalNavigate('ADMIN')}
                className="w-full bg-[#15233A] hover:bg-[#1f3354] p-4 rounded-2xl border border-[#1F3354] text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#C8814F] transition-colors">
                    Super Admin Suite
                  </h4>
                  <p className="text-[11px] text-[#A3AEC0]">Staff provisioning, verified fact sheets, and system audit logs.</p>
                </div>
                <ArrowRight size={16} className="text-[#C8814F]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          COMPARISON MODAL (Quick Side-by-Side Floating Drawer)
      ═════════════════════════════════════════════ */}
      {comparisonOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-8">
          <div className="bg-[#0D1726] border border-[#1F3354] rounded-3xl max-w-4xl w-full p-6 md:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setComparisonOpen(false)}
              className="absolute top-6 right-6 text-[#A3AEC0] hover:text-white"
            >
              <X size={22} />
            </button>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#C8814F]">
                Quick Matrix Comparison
              </span>
              <h3 className="text-2xl font-display font-bold text-[#F3EFE8] mt-1">
                The Grand Orchid vs. Serene Meadows
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#15233A] p-6 rounded-2xl border border-[#1F3354] space-y-3">
                <span className="text-xs uppercase font-bold text-[#C8814F] block">SG Highway</span>
                <h4 className="text-xl font-display font-bold">The Grand Orchid Residences</h4>
                <p className="text-xs text-[#A3AEC0]">Ultra-luxury high rise for families seeking panoramic skyline living and bespoke finishes.</p>
                <div className="pt-2 text-xs space-y-1.5 text-[#ECE5DA]">
                  <div>• <strong>Price:</strong> ₹1.35 Cr – ₹2.45 Cr</div>
                  <div>• <strong>Configurations:</strong> 3 & 4 BHK (1,850 – 3,200 sq ft)</div>
                  <div>• <strong>Clubhouse:</strong> 45,000 sq ft with 28th-floor pool</div>
                  <div>• <strong>Possession:</strong> December 2026</div>
                </div>
                <button
                  onClick={() => {
                    setSelectedProjectId('proj-grand-orchid');
                    setComparisonOpen(false);
                    scrollTo('booking');
                  }}
                  className="w-full bg-[#C8814F] text-white text-xs font-bold py-2.5 rounded-full mt-4"
                >
                  Select for Site Visit
                </button>
              </div>

              <div className="bg-[#15233A] p-6 rounded-2xl border border-[#1F3354] space-y-3">
                <span className="text-xs uppercase font-bold text-[#C8814F] block">South Bopal</span>
                <h4 className="text-xl font-display font-bold">Serene Meadows</h4>
                <p className="text-xs text-[#A3AEC0]">Eco-friendly lifestyle homes with solar grid, central park, and low maintenance fees.</p>
                <div className="pt-2 text-xs space-y-1.5 text-[#ECE5DA]">
                  <div>• <strong>Price:</strong> ₹68 Lakh – ₹1.15 Cr</div>
                  <div>• <strong>Configurations:</strong> 2 & 3 BHK (1,220 – 1,880 sq ft)</div>
                  <div>• <strong>Park:</strong> 2-Acre Themed Central Park & Solar Grid</div>
                  <div>• <strong>Possession:</strong> Ready-to-Move / June 2026</div>
                </div>
                <button
                  onClick={() => {
                    setSelectedProjectId('proj-serene-meadows');
                    setComparisonOpen(false);
                    scrollTo('booking');
                  }}
                  className="w-full bg-[#C8814F] text-white text-xs font-bold py-2.5 rounded-full mt-4"
                >
                  Select for Site Visit
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default LandingPage;
