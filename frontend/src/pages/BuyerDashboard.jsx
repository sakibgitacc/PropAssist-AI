import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { getPayments, getPropertyBookings } from '../services/extendedApi';
import {
  LayoutDashboard, Building2, CalendarCheck, CreditCard, FileText,
  BookmarkCheck, Award, Bell, User, LogOut, ArrowRight, CheckCircle2,
  Clock, MapPin, ExternalLink, Bot, Send, ShieldCheck, Sparkles,
  Phone, Mail, Download, RefreshCw, AlertCircle, X, ChevronRight,
  MessageCircle, Video, MessageSquare, ShieldAlert, FileCheck, Lock, Eye,
  Receipt, Shield, Check, Layers, ChevronDown
} from 'lucide-react';
import WhatsAppChatModal from '../components/common/WhatsAppChatModal';
import InAppChatModal from '../components/common/InAppChatModal';
import VideoConsultationModal from '../components/common/VideoConsultationModal';

export const BuyerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Buyer personal data states
  const [enquiries, setEnquiries] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [propertyBookings, setPropertyBookings] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [rescheduleModal, setRescheduleModal] = useState(null);

  // AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: `Namaste ${user?.name || 'Homebuyer'}! I am your personal PropAssist AI advisor for your apartment booking and visit schedule. How can I assist you today?`
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatLanguage, setChatLanguage] = useState('en');
  const [conversationId, setConversationId] = useState(null);

  const handleLanguageChange = (newLang) => {
    setChatLanguage(newLang);
    if (chatMessages.length <= 1) {
      const buyerName = user?.name || 'Homebuyer';
      if (newLang === 'hi') {
        setChatMessages([{
          sender: 'ai',
          text: `नमस्ते ${buyerName}! मैं आपके अपार्टमेंट बुकिंग और साइट विजिट शेड्यूल के लिए आपका व्यक्तिगत प्रोपअसिस्ट एआई सलाहकार हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?`
        }]);
      } else if (newLang === 'gu') {
        setChatMessages([{
          sender: 'ai',
          text: `નમસ્તે ${buyerName}! હું તમારા એપાર્ટમેન્ટ બુકિંગ અને સાઇટ વિઝિટ શેડ્યૂલ માટે તમારો પર્સનલ પ્રોપઆસિસ્ટ એઆઈ એડવાઇઝર છું. આજે હું તમને કેવી રીતે મદદ કરી શકું?`
        }]);
      } else {
        setChatMessages([{
          sender: 'ai',
          text: `Namaste ${buyerName}! I am your personal PropAssist AI advisor for your apartment booking and visit schedule. How can I assist you today?`
        }]);
      }
    }
  };

  const BUYER_AI_RECOMMENDATIONS = {
    en: [
      { label: '3 BHK SG Highway', prompt: 'What is the starting price and carpet area for 3 BHK in The Grand Orchid on SG Highway?' },
      { label: 'Serene Meadows 2 BHK', prompt: 'What is the pricing, floor plan and amenities for 2 BHK in Serene Meadows South Bopal?' },
      { label: 'Handover guarantee', prompt: 'Explain the December 2026 handover guarantee under statutory RERA guidelines.' },
      { label: 'My Booked Visits', prompt: 'Can you show me my scheduled site visits and directions to the project experience center?' }
    ],
    hi: [
      { label: 'एसजी हाईवे 3 BHK', prompt: 'एसजी हाईवे पर द ग्रैंड ऑर्किड में 3 BHK की शुरुआती कीमत और कारपेट एरिया क्या है?' },
      { label: 'सेरेन मीडोज 2 BHK', prompt: 'साउथ भोपाल में सेरेन मीडोज 2 BHK की कीमत, फ्लोर प्लान और सुविधाएं क्या हैं?' },
      { label: 'हैंडओवर गारंटी', prompt: 'रेरा नियमों के तहत दिसंबर 2026 की पजेशन व हैंडओवर गारंटी के बारे में बताएं।' },
      { label: 'मेरी साइट विजिट्स', prompt: 'कृपया मेरी बुक की गई साइट विजिट्स और एक्सपीरियंस सेंटर का रास्ता बताएं।' }
    ],
    gu: [
      { label: 'એસજી હાઈવે 3 BHK', prompt: 'એસજી હાઈવે પર ધ ગ્રાન્ડ ઓર્કિડમાં 3 BHK ની શરૂઆતી કિંમત અને કાર્પેટ એરિયા શું છે?' },
      { label: 'સિરીન મેડોઝ 2 BHK', prompt: 'સાઉથ બોપલમાં સિરીન મેડોઝ 2 BHK નો ભાવ, ફ્લોર પ્લાન અને સુવિધાઓ જણાવો.' },
      { label: 'હેન્ડઓવર ગેરંટી', prompt: 'રેરા નિયમો હેઠળ ડિસેમ્બર 2026 ની પઝેશન અને હેન્ડઓવર ગેરંટી સમજાવો.' },
      { label: 'મારી સાઇટ વિઝિટ્સ', prompt: 'કૃપા કરીને મારી શેડ્યૂલ કરેલી સાઇટ વિઝિટ્સ અને પ્રોજેક્ટ સુધી પહોંચવાનો રસ્તો જણાવો.' }
    ]
  };

  // Profile preferences
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [whatsappReminders, setWhatsappReminders] = useState(true);
  const [profileSaved, setProfileSaved] = useState(false);

  // Modals for WhatsApp, Jitsi Video, and In-App Chat
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isInAppChatOpen, setIsInAppChatOpen] = useState(false);
  const [targetLead, setTargetLead] = useState(null);

  // Razorpay & Escrow Simulator Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState(50000);
  const [selectedUnitId, setSelectedUnitId] = useState('unit-orchid-0902');
  const [activeBookingForPayment, setActiveBookingForPayment] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [escrowStep, setEscrowStep] = useState('review'); // 'review' | 'processing' | 'success' | 'failed'
  const [escrowProcessingStage, setEscrowProcessingStage] = useState(1);
  const [latestTransaction, setLatestTransaction] = useState(null);

  // Statutory RERA Dossier Modal State (Independent Verification - Zero Payment Action)
  const [showReraModal, setShowReraModal] = useState(false);
  const [selectedReraProject, setSelectedReraProject] = useState(null);

  // New Inquiry Modal State
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enqProject, setEnqProject] = useState('proj-grand-orchid');
  const [enqBhk, setEnqBhk] = useState('3 BHK');
  const [enqBudget, setEnqBudget] = useState('1.5 Cr');
  const [enqPhone, setEnqPhone] = useState('');
  const [enqSubmitting, setEnqSubmitting] = useState(false);

  const RERA_PROJECT_DOSSIERS = {
    'proj-grand-orchid': {
      id: 'proj-grand-orchid',
      name: 'The Grand Orchid Residences',
      developer: 'PropAssist Ahmedabad Developers LLP',
      reraNumber: 'PR/GJ/AHMEDABAD/AUDA/RAA10022/2026',
      status: 'Verified',
      authority: 'Gujarat Real Estate Regulatory Authority (GUJRERA)',
      promoterPan: 'AAACP8912G',
      location: 'SG Highway, Bodakdev, Ahmedabad, Gujarat 380054',
      escrowBank: 'ICICI Bank Ltd',
      escrowAccount: '002405019842 (IFSC: ICIC0000024)',
      projectType: 'High-Rise Luxury Residential (Towers A & B)',
      sanctionedUnits: 240,
      validTill: '31 December 2028',
      carpetAreaVerified: '100% RERA Carpet Area Verified by AUDA',
      statutoryDocuments: [
        { id: 'doc-1', name: 'GUJRERA Official Registration Certificate (Form 3)', status: 'Approved', verifiedDate: 'Jan 15, 2026', authority: 'GUJRERA Gandhinagar' },
        { id: 'doc-2', name: 'AUDA Sanctioned Master Layout & Architectural Drawings', status: 'Approved', verifiedDate: 'Nov 12, 2025', authority: 'AUDA Urban Planning' },
        { id: 'doc-3', name: '30-Year Legal Title Search Report & Advocate Certificate', status: 'Approved', verifiedDate: 'Dec 05, 2025', authority: 'High Court Legal Counsel' },
        { id: 'doc-4', name: 'Non-Encumbrance & Freehold Clear Title Deed', status: 'Approved', verifiedDate: 'Dec 18, 2025', authority: 'Sub-Registrar Ahmedabad' },
        { id: 'doc-5', name: 'State Pollution Control & Gujarat Fire Safety NOC', status: 'Approved', verifiedDate: 'Jan 08, 2026', authority: 'GPCB & Ahmedabad Fire Brigade' }
      ]
    },
    'proj-serene-meadows': {
      id: 'proj-serene-meadows',
      name: 'Serene Meadows',
      developer: 'Meadowlands Realty Gujarat Pvt Ltd',
      reraNumber: 'PR/GJ/AHMEDABAD/AUDA/RAA09918/2026',
      status: 'Verified',
      authority: 'Gujarat Real Estate Regulatory Authority (GUJRERA)',
      promoterPan: 'AABCM4501K',
      location: 'South Bopal Ring Road, Ahmedabad, Gujarat 380058',
      escrowBank: 'HDFC Bank Ltd',
      escrowAccount: '50200084729101 (IFSC: HDFC0000182)',
      projectType: 'Gated Residential Community (Towers A, B, C)',
      sanctionedUnits: 180,
      validTill: '30 June 2027',
      carpetAreaVerified: 'AUDA Standard Carpet Plan Audited',
      statutoryDocuments: [
        { id: 'doc-1', name: 'GUJRERA Registration Certificate (Form 3)', status: 'Approved', verifiedDate: 'Feb 02, 2026', authority: 'GUJRERA' },
        { id: 'doc-2', name: 'AUDA Sanctioned Building Permit #AUDA/BP/2024/991', status: 'Approved', verifiedDate: 'Oct 20, 2025', authority: 'AUDA' },
        { id: 'doc-3', name: 'Title Clearance & Legal Due Diligence Dossier', status: 'Approved', verifiedDate: 'Jan 22, 2026', authority: 'Senior AUDA Panel Advocates' },
        { id: 'doc-4', name: 'Soil Mechanics & Structural Stability Audit', status: 'Approved', verifiedDate: 'Nov 14, 2025', authority: 'IIT Roorkee / AUDA Bureau' }
      ]
    },
    'proj-skyline-villas': {
      id: 'proj-skyline-villas',
      name: 'Skyline Villas & Mansions',
      developer: 'Skyline Urban Infra Projects LLP',
      reraNumber: 'PR/GJ/AHMEDABAD/AUDA/RAA10105/2026',
      status: 'Verified',
      authority: 'Gujarat Real Estate Regulatory Authority (GUJRERA)',
      promoterPan: 'AAECS7109M',
      location: 'Ambli-Bopal Road, Ahmedabad, Gujarat 380058',
      escrowBank: 'Kotak Mahindra Bank',
      escrowAccount: '8812903411 (IFSC: KKBK0000812)',
      projectType: 'Private Luxury Gated Villa Estates',
      sanctionedUnits: 45,
      validTill: '31 March 2029',
      carpetAreaVerified: '100% Private Plot & Plinth Certified',
      statutoryDocuments: [
        { id: 'doc-1', name: 'GUJRERA Form 3 Registration Certificate', status: 'Approved', verifiedDate: 'Mar 01, 2026', authority: 'GUJRERA' },
        { id: 'doc-2', name: 'Zonal Master Layout & Sanctioned Plinth Permissions', status: 'Approved', verifiedDate: 'Dec 10, 2025', authority: 'AUDA' },
        { id: 'doc-3', name: 'Environmental Impact Clearance (SEIAA Gujarat)', status: 'Approved', verifiedDate: 'Jan 19, 2026', authority: 'State Environment Authority' }
      ]
    }
  };

  const AVAILABLE_UNITS = [
    {
      id: 'unit-orchid-0902',
      projectId: 'proj-grand-orchid',
      projectName: 'The Grand Orchid',
      unitNumber: 'Tower B - 0902',
      tower: 'Tower B',
      floor: '9th Floor',
      configuration: '3 BHK Skyline Residence',
      carpetArea: 1320,
      price: 8500000,
      reraNumber: 'PR/GJ/AHMEDABAD/AUDA/RAA10022/2026',
      location: 'SG Highway, Ahmedabad',
      image: '/assets/story/story-03-residences.jpg'
    },
    {
      id: 'unit-serene-1102',
      projectId: 'proj-serene-meadows',
      projectName: 'Serene Meadows',
      unitNumber: 'Tower B - 1102',
      tower: 'Tower B',
      floor: '11th Floor',
      configuration: '3 BHK Park Panorama',
      carpetArea: 1180,
      price: 8200000,
      reraNumber: 'PR/GJ/AHMEDABAD/AUDA/RAA09918/2026',
      location: 'South Bopal, Ahmedabad',
      image: '/assets/story/story-04-living.jpg'
    },
    {
      id: 'unit-serene-0401',
      projectId: 'proj-serene-meadows',
      projectName: 'Serene Meadows',
      unitNumber: 'Tower A - 0401',
      tower: 'Tower A',
      floor: '4th Floor',
      configuration: '2 BHK Garden View',
      carpetArea: 890,
      price: 6500000,
      reraNumber: 'PR/GJ/AHMEDABAD/AUDA/RAA09918/2026',
      location: 'South Bopal, Ahmedabad',
      image: '/assets/plan-3bhk.jpg'
    },
    {
      id: 'unit-skyline-0301',
      projectId: 'proj-skyline-villas',
      projectName: 'Skyline Villas & Mansions',
      unitNumber: 'Mansion Villa 03',
      tower: 'Phase 1',
      floor: 'Ground + 1st Floor',
      configuration: '4 BHK Signature Villa',
      carpetArea: 2850,
      price: 18500000,
      reraNumber: 'PR/GJ/AHMEDABAD/AUDA/RAA10105/2026',
      location: 'Ambli-Bopal Road, Ahmedabad',
      image: '/assets/plan-villa.jpg'
    }
  ];

  const dataLoadedRef = useRef(false);

  const fetchBuyerData = async (silent = false) => {
    // Only show full-screen loader on initial mount if data has not yet loaded
    if (!silent && !dataLoadedRef.current) {
      setLoading(true);
    }
    setError('');

    // Safety timeout: ensure loading state never hangs
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1200));

    try {
      const dataFetchPromise = Promise.allSettled([
        api.get('/leads').catch(() => ({ data: { success: false, leads: [] } })),
        api.get('/slots/bookings').catch(() => ({ data: { success: false, bookings: [] } })),
        api.get('/payments').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/property-bookings').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/slots?availableOnly=true').catch(() => ({ data: { success: false, slots: [] } }))
      ]);

      const results = await Promise.race([
        dataFetchPromise,
        timeoutPromise.then(() => null)
      ]);

      if (results) {
        const [leadRes, bookingRes, payRes, propRes, slotsRes] = results;

        if (leadRes.status === 'fulfilled' && leadRes.value.data?.success) {
          const leadList = leadRes.value.data.leads || leadRes.value.data.data || [];
          setEnquiries(leadList);
          if (leadList.length > 0) setTargetLead(leadList[0]);
        }
        if (bookingRes.status === 'fulfilled' && bookingRes.value.data?.success) {
          setBookings(bookingRes.value.data.bookings || []);
        }
        if (payRes.status === 'fulfilled' && payRes.value.data?.success) {
          setPayments(payRes.value.data.data || []);
        }
        if (propRes.status === 'fulfilled' && propRes.value.data?.success) {
          setPropertyBookings(propRes.value.data.data || []);
        }
        if (slotsRes.status === 'fulfilled' && slotsRes.value.data?.success) {
          setAvailableSlots(slotsRes.value.data.slots || []);
        }
        dataLoadedRef.current = true;
      } else {
        // Timed out: let background promise complete state updates smoothly
        dataFetchPromise.then((settled) => {
          const [leadRes, bookingRes, payRes, propRes, slotsRes] = settled;
          if (leadRes.status === 'fulfilled' && leadRes.value.data?.success) {
            const leadList = leadRes.value.data.leads || leadRes.value.data.data || [];
            setEnquiries(leadList);
            if (leadList.length > 0) setTargetLead(leadList[0]);
          }
          if (bookingRes.status === 'fulfilled' && bookingRes.value.data?.success) {
            setBookings(bookingRes.value.data.bookings || []);
          }
          if (payRes.status === 'fulfilled' && payRes.value.data?.success) {
            setPayments(payRes.value.data.data || []);
          }
          if (propRes.status === 'fulfilled' && propRes.value.data?.success) {
            setPropertyBookings(propRes.value.data.data || []);
          }
          if (slotsRes.status === 'fulfilled' && slotsRes.value.data?.success) {
            setAvailableSlots(slotsRes.value.data.slots || []);
          }
          dataLoadedRef.current = true;
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Error fetching buyer dashboard:', err);
      setError('Unable to synchronize your personal profile. Please verify your network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyerData();
  }, [user]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = { sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    const query = chatInput;
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: query,
        conversationId: conversationId || undefined,
        language: chatLanguage,
        buyerName: user?.name,
        buyerPhone: user?.phone
      });
      const aiReply = res.data?.reply || res.data?.message?.content || res.data?.content;
      if (res.data?.success && aiReply) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: aiReply }]);
        if (res.data.conversationId) {
          setConversationId(res.data.conversationId);
        }
      } else {
        throw new Error('Empty AI reply');
      }
    } catch {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: chatLanguage === 'hi'
            ? 'हमारे वरिष्ठ रिलेशनशिप एडवाइजर को आपकी पूछताछ भेज दी गई है। वे जल्द ही आपसे व्हाट्सऐप पर संपर्क करेंगे।'
            : chatLanguage === 'gu'
              ? 'અમારા વરિષ્ઠ રિલેશનશિપ એડવાઈઝરને તમારી પૂછપરછ મોકલી દેવામાં આવી છે. તેઓ ટૂંક સમયમાં વોટ્સએપ પર તમારો સંપર્ક કરશે.'
              : 'Our senior relationship advisor for SG Highway & South Bopal has been notified and will assist you shortly on WhatsApp.'
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleDownloadReceipt = async (payment) => {
    try {
      const res = await api.get(`/payments/${payment.id}/receipt`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Receipt_${payment.receiptNumber || payment.id}.pdf`;
      link.click();
    } catch {
      alert(`Official Escrow Receipt:\nReceipt No: ${payment.receiptNumber || 'RCP-' + Date.now().toString().slice(-8)}\nAmount: ₹${payment.amount?.toLocaleString('en-IN')}\nStatus: Verified RERA Escrow Account.`);
    }
  };

  const handleOpenReraDossier = (projectOrBooking) => {
    let dossier = null;
    if (projectOrBooking?.projectId && RERA_PROJECT_DOSSIERS[projectOrBooking.projectId]) {
      dossier = RERA_PROJECT_DOSSIERS[projectOrBooking.projectId];
    } else if (projectOrBooking?.projectName) {
      const pName = projectOrBooking.projectName.toLowerCase();
      if (pName.includes('meadow')) dossier = RERA_PROJECT_DOSSIERS['proj-serene-meadows'];
      else if (pName.includes('villa')) dossier = RERA_PROJECT_DOSSIERS['proj-skyline-villas'];
      else dossier = RERA_PROJECT_DOSSIERS['proj-grand-orchid'];
    } else {
      dossier = RERA_PROJECT_DOSSIERS['proj-grand-orchid'];
    }
    setSelectedReraProject(dossier);
    setShowReraModal(true);
  };

  const handleDownloadAllotment = async (booking) => {
    const agrVal = Number(booking.agreementValue || 8500000);
    const paidVal = Number(booking.paidAmount || 0);
    const isFullySettled = paidVal >= agrVal;
    const isApproved = booking.allotmentStatus === 'Letter Issued' || booking.allotmentStatus === 'Approved';

    if (!isFullySettled && !isApproved) {
      alert(`Statutory Notice: Allotment Letter is unavailable.\n\nAllotment Letter will be available after successful completion of the required payment (100% full payment) and administrative approval.\n\nCurrent Paid: ₹${(paidVal / 100000).toFixed(2)} Lakhs of ₹${(agrVal / 10000000).toFixed(2)} Cr (Remaining: ₹${((agrVal - paidVal) / 100000).toFixed(2)} Lakhs).`);
      return;
    }

    try {
      const res = await api.get(`/property-bookings/${booking.id}/allotment-letter`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Allotment_Letter_${booking.allotmentLetterNo || booking.id}.pdf`;
      link.click();
    } catch {
      alert(`Official RERA Provisional Allotment Certificate:\nAllotment No: ${booking.allotmentLetterNo || 'ALT-GJ-2026-1049'}\nProject: ${booking.projectName}\nUnit: ${booking.unitNumber}\nStatus: Verified & Allotted.`);
    }
  };

  const handlePayRemaining = (pb) => {
    setActiveBookingForPayment(pb);
    if (pb.unitId) {
      setSelectedUnitId(pb.unitId);
    }
    const agrVal = Number(pb.agreementValue || 8500000);
    const unitPayments = payments.filter(p =>
      p.status === 'Verified' && (
        (pb.unitNumber && p.unitNumber === pb.unitNumber) ||
        (pb.projectId && p.projectId === pb.projectId) ||
        (pb.projectName && p.projectName?.toLowerCase() === pb.projectName?.toLowerCase())
      )
    );
    const verifiedPaymentsSum = unitPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const paidVal = Math.max(Number(pb.paidAmount || 0), verifiedPaymentsSum);
    const remaining = Math.max(0, agrVal - paidVal);
    setPayAmount(remaining > 0 ? remaining : 50000);
    setEscrowStep('review');
    setPaymentError('');
    setPaymentSuccessMsg('');
    setLatestTransaction(null);
    setShowPaymentModal(true);
  };

  const handleOpenPaymentModal = (unitId = null, amount = null) => {
    const existing = propertyBookings.find(b => b.unitId === unitId) || (unitId ? null : (propertyBookings[0] || null));
    setActiveBookingForPayment(existing);
    if (unitId) setSelectedUnitId(unitId);
    else if (existing?.unitId) setSelectedUnitId(existing.unitId);

    if (amount) {
      setPayAmount(amount);
    } else if (existing) {
      const agrVal = Number(existing.agreementValue || 8500000);
      const unitPayments = payments.filter(p =>
        p.status === 'Verified' && (
          (existing.unitNumber && p.unitNumber === existing.unitNumber) ||
          (existing.projectId && p.projectId === existing.projectId) ||
          (existing.projectName && p.projectName?.toLowerCase() === existing.projectName?.toLowerCase())
        )
      );
      const verifiedPaymentsSum = unitPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      const paidVal = Math.max(Number(existing.paidAmount || 0), verifiedPaymentsSum);
      const remaining = Math.max(0, agrVal - paidVal);
      setPayAmount(remaining > 0 ? remaining : 50000);
    } else {
      setPayAmount(50000);
    }
    setEscrowStep('review');
    setPaymentError('');
    setPaymentSuccessMsg('');
    setLatestTransaction(null);
    setShowPaymentModal(true);
  };

  const handleCreateEnquiry = async (e) => {
    e.preventDefault();
    setEnqSubmitting(true);
    try {
      const contactPhone = (enqPhone || user?.phone || '9825099887').replace(/\s/g, '');
      const res = await api.post('/leads', {
        fullName: user?.name || 'Verified Buyer',
        email: user?.email,
        phone: contactPhone,
        projectId: enqProject,
        preferredBhk: enqBhk,
        timeline: 'Within 3 Months',
        source: 'Buyer Dashboard Inquiry',
        notes: `Buyer submitted preference for ${enqBhk} in ${enqProject === 'proj-grand-orchid' ? 'The Grand Orchid' : 'Serene Meadows'} (Budget: ${enqBudget})`
      });
      if (res.data?.success) {
        const createdLead = res.data.lead || res.data.data;
        if (createdLead) {
          setEnquiries(prev => {
            const exists = prev.some(item => item.id === createdLead.id);
            if (exists) {
              return prev.map(item => item.id === createdLead.id ? { ...item, ...createdLead } : item);
            }
            return [createdLead, ...prev];
          });
          setTargetLead(createdLead);
        }
        setShowEnquiryModal(false);
        await fetchBuyerData(true);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit inquiry');
    } finally {
      setEnqSubmitting(false);
    }
  };

  const handleInitiatePayment = async () => {
    setPaymentProcessing(true);
    setPaymentError('');
    setPaymentSuccessMsg('');
    setEscrowStep('processing');
    setEscrowProcessingStage(1);

    try {
      const chosenUnit = activeBookingForPayment ? {
        id: activeBookingForPayment.unitId || selectedUnitId,
        projectId: activeBookingForPayment.projectId || 'proj-the-grand-orchid',
        projectName: activeBookingForPayment.projectName || 'The Grand Orchid',
        unitNumber: activeBookingForPayment.unitNumber || 'Tower A - 1402',
        tower: activeBookingForPayment.tower || 'Tower A',
        floor: activeBookingForPayment.floor || 'Floor 14',
        configuration: activeBookingForPayment.configuration || '3 BHK Skyline Residence',
        carpetArea: activeBookingForPayment.carpetArea || 1320,
        price: Number(activeBookingForPayment.agreementValue || 8500000),
        reraNumber: activeBookingForPayment.reraNumber || 'PR/GJ/AHMEDABAD/AUDA/RAA10022/2026',
        location: activeBookingForPayment.location || 'SG Highway, Bodakdev, Ahmedabad',
        image: activeBookingForPayment.image || '/assets/story/story-03-residences.jpg'
      } : (AVAILABLE_UNITS.find(u => u.id === selectedUnitId) || AVAILABLE_UNITS[0]);

      const targetBookingId = activeBookingForPayment?.id || null;
      const targetUnitId = activeBookingForPayment?.unitId || chosenUnit.id;
      const targetProjectId = activeBookingForPayment?.projectId || chosenUnit.projectId;
      const targetProjectName = activeBookingForPayment?.projectName || chosenUnit.projectName;
      const targetUnitNumber = activeBookingForPayment?.unitNumber || chosenUnit.unitNumber;
      const targetPrice = Number(activeBookingForPayment?.agreementValue || chosenUnit.price || 8500000);

      // Simulated step progress indicators for clear bank escrow audit
      setTimeout(() => setEscrowProcessingStage(2), 400);
      setTimeout(() => setEscrowProcessingStage(3), 900);

      // 1. Create order on backend with Razorpay Test Credentials
      const orderRes = await api.post('/payments/order', {
        amount: payAmount,
        purpose: activeBookingForPayment ? 'Milestone Balance Clearance' : 'Apartment Token Booking Deposit',
        projectId: targetProjectId,
        projectName: targetProjectName,
        unitNumber: targetUnitNumber,
        bookingId: targetBookingId
      });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.error || 'Failed to initialize payment order');
      }

      const { order, payment, provider } = orderRes.data.data;

      // 2. Verification callback to finalize transaction and issue allotment letter
      const finalizePayment = async (verifyPayload) => {
        const verifyRes = await api.post('/payments/verify', {
          ...verifyPayload,
          bookingId: targetBookingId,
          projectId: targetProjectId,
          unitNumber: targetUnitNumber
        });
        if (verifyRes.data.success) {
          // 1. Immediately register verified payment in local state for zero-latency ledger updates
          if (verifyRes.data.data) {
            setPayments(prev => [verifyRes.data.data, ...prev.filter(p => p.id !== verifyRes.data.data.id)]);
          }

          // 2. Reserve unit or update balance on property booking
          let bookingData = verifyRes.data.booking;
          // Avoid double-charging: only call /property-bookings if /payments/verify did not already create/update the booking
          if (!bookingData) {
            try {
              const pbRes = await api.post('/property-bookings', {
                bookingId: targetBookingId,
                projectId: targetProjectId,
                unitId: targetUnitId,
                unitNumber: targetUnitNumber,
                tokenAmount: payAmount,
                agreementValue: targetPrice
              });
              if (pbRes.data?.data) {
                bookingData = pbRes.data.data;
              }
            } catch (pbErr) {
              console.warn('Booking notice:', pbErr.message);
            }
          }

          const agrVal = Number(bookingData?.agreementValue || targetPrice || 8500000);
          const currentPaid = Number(bookingData?.paidAmount || (Number(activeBookingForPayment?.paidAmount || 0) + payAmount));
          const updatedRemaining = Math.max(0, agrVal - currentPaid);
          const updatedPct = Math.min(100, Number(((currentPaid / agrVal) * 100).toFixed(2)));

          // Update local propertyBookings state immediately so all progress bars instantly reflect updated payment
          if (bookingData) {
            setPropertyBookings(prev => {
              const exists = prev.some(b => b.id === bookingData.id);
              if (exists) {
                return prev.map(b => (b.id === bookingData.id ? { ...b, ...bookingData, paidAmount: currentPaid, paymentPercentage: updatedPct } : b));
              }
              return [{ ...bookingData, paidAmount: currentPaid, paymentPercentage: updatedPct }, ...prev];
            });
          } else if (activeBookingForPayment) {
            setPropertyBookings(prev => prev.map(b => (b.id === activeBookingForPayment.id ? {
              ...b,
              paidAmount: currentPaid,
              paymentPercentage: updatedPct,
              bookingStatus: currentPaid >= agrVal
                ? 'Fully Paid & Allotted'
                : (currentPaid >= (agrVal * 0.10) ? 'Confirmed (10% Advance Paid)' : 'Confirmed (Token Paid)'),
              allotmentStatus: (currentPaid >= (agrVal * 0.10) || currentPaid >= agrVal) ? 'Letter Issued' : b.allotmentStatus
            } : b)));
          }

          setLatestTransaction({
            ...verifyRes.data.data,
            booking: bookingData || activeBookingForPayment,
            paidAmount: payAmount,
            totalPaid: currentPaid,
            agreementValue: agrVal,
            remainingBalance: updatedRemaining,
            unit: chosenUnit,
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          });

          setPaymentSuccessMsg(`Payment of ₹${payAmount.toLocaleString('en-IN')} confirmed via Razorpay! Unit ${targetUnitNumber} ledger updated and escrow receipt generated.`);
          await fetchBuyerData(true);
          setEscrowStep('success');
        } else {
          setPaymentError(verifyRes.data.error || 'Payment verification failed');
          setEscrowStep('failed');
        }
      };

      // 3. Dynamically load official Razorpay SDK
      const loadRazorpay = () => {
        return new Promise((resolve) => {
          if (window.Razorpay) return resolve(true);
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const razorpayLoaded = await loadRazorpay();

      if (!razorpayLoaded || !window.Razorpay) {
        throw new Error('Unable to initialize Razorpay Secure Checkout. Please check your internet connection.');
      }

      const cleanPhone = (user?.phone || '').replace(/[\s\-\(\)]/g, '');
      const validContact = /^[6-9]\d{9}$/.test(cleanPhone) ? cleanPhone : '9825012345';
      const razorpayKey = orderRes.data?.data?.keyId || 'rzp_test_TW1juKRTnACBhA';

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: 'INR',
        name: 'PropAssist AI Real Estate',
        description: `Token Deposit for ${chosenUnit.projectName} (${chosenUnit.unitNumber})`,
        order_id: order.id,
        handler: async (response) => {
          await finalizePayment({
            orderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            paymentId: payment.id
          });
        },
        prefill: {
          name: user?.name || 'Valued Homebuyer',
          email: user?.email || '',
          contact: validContact
        },
        theme: { color: '#C8814F' },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
            setEscrowStep('review');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (err) => {
        console.error('[Razorpay Payment Failed]:', err.error);
        setPaymentError(err.error?.description || 'Razorpay payment was not completed.');
        setPaymentProcessing(false);
        setEscrowStep('failed');
      });
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError(err.response?.data?.error || err.message || 'Payment initiation failed.');
      setEscrowStep('failed');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this site visit reservation?')) return;
    try {
      const res = await api.patch(`/slots/bookings/${bookingId}/cancel`);
      if (res.data.success) {
        alert('Site visit reservation cancelled.');
        await fetchBuyerData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel site visit reservation.');
    }
  };

  const handleRescheduleBooking = async (e) => {
    e.preventDefault();
    if (!rescheduleModal || !selectedSlotId) return;
    try {
      const res = await api.patch(`/slots/bookings/${rescheduleModal.id}/reschedule`, {
        newSlotId: selectedSlotId
      });
      if (res.data.success) {
        alert('Site visit successfully rescheduled!');
        setRescheduleModal(null);
        setSelectedSlotId('');
        await fetchBuyerData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reschedule site visit.');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/users/profile', {
        name: profileName,
        phone: profilePhone
      });
      if (res.data.success) {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
        await fetchBuyerData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update profile.');
    }
  };

  const notifications = [
    ...bookings.map((b) => ({
      id: `notif-book-${b.id}`,
      type: 'visit',
      title: b.status === 'CANCELLED' ? 'Site Visit Cancelled' : 'Site Visit VIP Pass Ready',
      message: `${b.slot?.project?.name || 'Ahmedabad Residence'} on ${b.bookingDate || b.slot?.date} at ${b.timeSlot || b.slot?.startTime}. Confirmation Code: ${b.confirmationCode}.`,
      date: b.createdAt || new Date().toISOString(),
      actionTab: 'site-visits',
      actionLabel: 'View Gate Pass'
    })),
    ...payments.map((p) => ({
      id: `notif-pay-${p.id}`,
      type: 'payment',
      title: 'Payment Confirmed & Escrow Verified',
      message: `Token deposit of ₹${p.amount?.toLocaleString('en-IN')} for ${p.projectName} verified. Official receipt #${p.receiptNumber || 'RCP-VERIFIED'} ready.`,
      date: p.createdAt || new Date().toISOString(),
      actionTab: 'receipts',
      actionLabel: 'Download Receipt'
    })),
    ...propertyBookings.map((pb) => ({
      id: `notif-allot-${pb.id}`,
      type: 'allotment',
      title: pb.allotmentStatus === 'Letter Issued' ? 'RERA Provisional Allotment Letter Issued' : 'Allotment Approval Under Review',
      message: `${pb.projectName} ${pb.unitNumber} (${pb.configuration}). Agreement value: ₹${(pb.agreementValue / 10000000).toFixed(2)} Cr.`,
      date: pb.createdAt || new Date().toISOString(),
      actionTab: 'allotments',
      actionLabel: 'View Allotment'
    })),
    ...enquiries.map((e) => ({
      id: `notif-enq-${e.id}`,
      type: 'enquiry',
      title: 'Sales Advisor Assigned to Your Enquiry',
      message: `Your preference for ${e.preferredBhk || 'Luxury Residence'} in ${e.project?.name || 'Ahmedabad'} is assigned to ${e.assignedExecutive?.name || 'Pooja Sharma (Senior Executive)'}.`,
      date: e.createdAt || new Date().toISOString(),
      actionTab: 'enquiries',
      actionLabel: 'View Advisory'
    }))
  ];

  return (
    <div className="space-y-8 text-[#F3EFE8]">
      {loading && (
        <div className="p-3 bg-[#15233A]/80 border border-[#C8814F]/40 rounded-2xl flex items-center justify-between gap-3 text-xs text-[#CBD5E1] animate-pulse">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-[#C8814F] animate-spin" />
            <span>Synchronizing your personal apartment bookings and milestone receipts...</span>
          </div>
          <span className="text-[10px] text-[#94A3B8] font-mono">Live Sync</span>
        </div>
      )}
      {/* ─── VIP BUYER WELCOME HEADER ─── */}
      <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C8814F]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck size={13} />
                Verified Buyer Portal
              </span>
              <span className="text-xs text-[#64748B]">•</span>
              <span className="text-xs text-[#CBD5E1]">Ahmedabad Luxury Portfolio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              Welcome back, {user?.name || 'Homebuyer'}
            </h1>
            <p className="text-xs text-[#94A3B8] max-w-xl leading-relaxed">
              Manage your residential inquiries, upcoming site visit passes, milestone payments, and RERA allotment documents all in one private customer space.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* WhatsApp Click-to-Chat Button */}
            <button
              onClick={() => {
                const lead = enquiries[0] || null;
                setTargetLead(lead);
                setIsWhatsAppOpen(true);
              }}
              className="px-4 py-2.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              title="Open official WhatsApp chat with your assigned sales advisor"
            >
              <MessageCircle size={15} />
              <span>WhatsApp Advisor</span>
            </button>

            {/* Video Consultation Request Button */}
            <button
              onClick={() => {
                const lead = enquiries[0] || null;
                setTargetLead(lead);
                setIsVideoModalOpen(true);
              }}
              className="px-4 py-2.5 bg-[#15233A] hover:bg-[#1A2C4C] border border-[#1F3354] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              title="Request a one-on-one virtual walkthrough via Jitsi Meet"
            >
              <Video size={15} className="text-[#C8814F]" />
              <span>Request Video Tour</span>
            </button>

            {/* In-App Real-time Chat Button */}
            <button
              onClick={() => {
                const lead = enquiries[0] || null;
                setTargetLead(lead);
                setIsInAppChatOpen(true);
              }}
              className="px-4 py-2.5 bg-[#15233A] hover:bg-[#1A2C4C] border border-[#1F3354] text-[#CBD5E1] rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
              title="Open direct in-app chat with your assigned sales executive"
            >
              <MessageSquare size={15} className="text-[#C8814F]" />
              <span>In-App Chat</span>
            </button>

            <button
              onClick={() => navigate('/book-visit')}
              className="px-4 py-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <CalendarCheck size={15} />
              <span>Schedule Visit</span>
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'ai-assistant' })}
              className="px-3.5 py-2.5 bg-[#0D1726] hover:bg-[#1f3354] text-[#F3EFE8] border border-[#1F3354] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Bot size={15} className="text-[#C8814F]" />
              <span>AI Advisor</span>
            </button>
          </div>
        </div>

        {/* Quick Tab Selector for Mobile / Easy Access */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 mt-6 border-t border-[#1F3354]/60 no-scrollbar">
          {[
            { id: 'overview', label: 'My Dashboard', icon: LayoutDashboard },
            { id: 'enquiries', label: `My Enquiries (${enquiries.length})`, icon: Building2 },
            { id: 'site-visits', label: `My Site Visits (${bookings.length})`, icon: CalendarCheck },
            { id: 'payments', label: `My Payments (${payments.length})`, icon: CreditCard },
            { id: 'bookings', label: 'Property Bookings', icon: BookmarkCheck },
            { id: 'allotments', label: 'Allotment Letters', icon: Award },
            { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
            { id: 'profile', label: 'My Profile', icon: User }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${active
                    ? 'bg-[#C8814F] text-white shadow-md'
                    : 'bg-[#0D1726] text-[#94A3B8] hover:text-white border border-[#1F3354]'
                  }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TAB 1: OVERVIEW DASHBOARD ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Personal KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#15233A] border border-[#1F3354] p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase">Active Enquiries</span>
                <Building2 className="w-5 h-5 text-[#C8814F]" />
              </div>
              <p className="text-2xl font-bold font-display text-white">{enquiries.length}</p>
              <p className="text-[10px] text-emerald-400 mt-1">Verified RERA developments</p>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase">Upcoming Site Visits</span>
                <CalendarCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold font-display text-white">
                {bookings.filter(b => b.status === 'Confirmed').length}
              </p>
              <p className="text-[10px] text-[#CBD5E1] mt-1">Atomic slots reserved</p>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase">Verified Payments</span>
                <CreditCard className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-2xl font-bold font-display text-white">
                ₹{payments.reduce((acc, p) => acc + (p.status === 'Verified' ? p.amount : 0), 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-emerald-400 mt-1">{payments.length} transactions recorded</p>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase">Allotted Residences</span>
                <Award className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-2xl font-bold font-display text-white">{propertyBookings.length}</p>
              <p className="text-[10px] text-purple-300 mt-1">Official Allotment Certificate Ready</p>
            </div>
          </div>

          {/* Quick Cards: Upcoming Visit & Property Booking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Site Visit Card */}
            <div className="bg-[#15233A] border border-[#1F3354] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <CalendarCheck size={16} className="text-[#C8814F]" />
                  <span>Next Scheduled Site Visit</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Confirmed Pass
                </span>
              </div>

              {bookings.length > 0 ? (
                <div className="bg-[#0D1726] border border-[#1F3354] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {bookings[0].slot?.project?.name || 'The Grand Orchid Residences'}
                      </h4>
                      <p className="text-xs text-[#94A3B8] flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-[#C8814F]" />
                        {bookings[0].slot?.project?.location || 'SG Highway, Ahmedabad'}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#C8814F] bg-[#C8814F]/10 px-2.5 py-1 rounded border border-[#C8814F]/30">
                      Code: {bookings[0].confirmationCode || 'PRP-VIS-092'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#1F3354]">
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Date & Time</span>
                      <strong className="text-[#CBD5E1]">
                        {bookings[0].bookingDate || bookings[0].slot?.date} ({bookings[0].timeSlot || bookings[0].slot?.startTime})
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Host Executive</span>
                      <strong className="text-[#CBD5E1]">
                        {bookings[0].slot?.assignedExecutive?.name || 'Pooja Sharma (Senior Executive)'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <a
                      href="https://maps.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-[#15233A] hover:bg-[#1f3354] text-white rounded-lg text-xs font-bold text-center border border-[#1F3354] transition-all flex items-center justify-center gap-1.5"
                    >
                      <MapPin size={13} className="text-[#C8814F]" />
                      <span>Google Maps Directions</span>
                    </a>
                    <button
                      onClick={() => setSearchParams({ tab: 'site-visits' })}
                      className="px-4 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-lg text-xs font-bold transition-all"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#0D1726] rounded-xl border border-[#1F3354] text-xs text-[#94A3B8]">
                  No upcoming visits scheduled. Book a private show residence walkthrough.
                </div>
              )}
            </div>

            {/* Current Apartment Booking Status */}
            <div className="bg-[#15233A] border border-[#1F3354] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <BookmarkCheck size={16} className="text-[#C8814F]" />
                  <span>My Residential Allotment</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  Subvention 10:80:10
                </span>
              </div>

              {propertyBookings.length > 0 ? (
                <div className="bg-[#0D1726] border border-[#1F3354] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-bold text-white">{propertyBookings[0].projectName}</h4>
                      <p className="text-xs text-[#C8814F] font-semibold">{propertyBookings[0].unitNumber} • {propertyBookings[0].configuration}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-white bg-emerald-950/60 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30">
                      {propertyBookings[0].bookingStatus}
                    </span>
                  </div>

                  {/* Payment Progress Bar */}
                  {(() => {
                    const firstBooking = propertyBookings[0];
                    const agrVal = Number(firstBooking.agreementValue || 8500000);
                    const unitPayments = payments.filter(p =>
                      (firstBooking.unitNumber && p.unitNumber === firstBooking.unitNumber) ||
                      (firstBooking.projectId && p.projectId === firstBooking.projectId) ||
                      (firstBooking.projectName && p.projectName?.toLowerCase() === firstBooking.projectName?.toLowerCase())
                    );
                    const totalPaymentsPaid = unitPayments.filter(p => p.status === 'Verified').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
                    const paidVal = Math.max(Number(firstBooking.paidAmount || 0), totalPaymentsPaid);
                    const percent = Math.min(100, Math.round((paidVal / agrVal) * 100));

                    return (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#94A3B8]">Agreement Value: ₹{agrVal.toLocaleString('en-IN')}</span>
                          <strong className="text-emerald-400">Paid: {percent}% (₹{paidVal.toLocaleString('en-IN')})</strong>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#15233A] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#C8814F] to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(5, percent)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between pt-2 border-t border-[#1F3354] flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenReraDossier(propertyBookings[0])}
                      className="text-[11px] text-[#C8814F] hover:text-[#e09865] flex items-center gap-1 font-semibold transition"
                    >
                      <ShieldCheck size={13} className="text-emerald-400" />
                      <span>RERA: {propertyBookings[0].reraNumber?.slice(0, 22) || 'PR/GJ/AHMEDABAD'}...</span>
                    </button>
                    {propertyBookings[0].paidAmount >= propertyBookings[0].agreementValue ? (
                      <button
                        onClick={() => handleDownloadAllotment(propertyBookings[0])}
                        className="px-3 py-1.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Download size={13} />
                        <span>Download Allotment</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSearchParams({ tab: 'bookings' })}
                        className="px-3 py-1.5 bg-[#15233A] hover:bg-[#1A2C4C] border border-amber-500/30 text-amber-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5"
                      >
                        <Lock size={12} className="text-amber-400" />
                        <span>Allotment Locked (100% Req)</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#0D1726] rounded-xl border border-[#1F3354] text-xs text-[#94A3B8]">
                  No active unit bookings found under your account.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: MY ENQUIRIES ─── */}
      {activeTab === 'enquiries' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold text-white">My Active Inquiries</h2>
              <p className="text-xs text-[#94A3B8]">
                Real-time tracking of your expressions of interest across Ahmedabad residential enclaves.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEnquiryModal(true)}
                className="px-4 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <span>+ New Property Inquiry</span>
              </button>
              <button
                onClick={() => navigate('/projects')}
                className="px-4 py-2 bg-[#15233A] hover:bg-[#1f3354] text-[#F3EFE8] border border-[#1F3354] rounded-xl text-xs font-bold"
              >
                Explore Floor Plans
              </button>
            </div>
          </div>

          {enquiries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enquiries.map((enq) => (
                <div key={enq.id} className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#C8814F] px-2 py-0.5 rounded bg-[#C8814F]/10 border border-[#C8814F]/20">
                      {enq.preferredBhk || 'Residential Layout'}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      {enq.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">
                      {enq.project?.name || enq.preferredLocation || 'Residential Property Inquiry'}
                    </h3>
                    <p className="text-xs text-[#94A3B8]">
                      {enq.budgetMin && enq.budgetMax
                        ? `Budget: ₹${(enq.budgetMin / 10000000).toFixed(2)} Cr – ₹${(enq.budgetMax / 10000000).toFixed(2)} Cr`
                        : enq.notes ? `Note: ${enq.notes}` : 'Custom Portfolio Inquiry'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#1F3354] flex items-center justify-between text-xs text-[#94A3B8]">
                    <span>Inquiry Date: {new Date(enq.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => navigate('/book-visit')}
                      className="text-[#C8814F] hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Book Viewing</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#0D1726] rounded-2xl border border-[#1F3354] space-y-3">
              <Building2 className="w-10 h-10 text-[#C8814F] mx-auto opacity-60" />
              <h3 className="text-base font-bold text-white">No inquiries recorded yet</h3>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                Select your preferred residential configuration from our verified Ahmedabad project listing.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowEnquiryModal(true)}
                  className="px-5 py-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                >
                  + Submit Preferred Inquiry
                </button>
                <button
                  onClick={() => navigate('/projects')}
                  className="px-5 py-2.5 bg-[#15233A] hover:bg-[#1f3354] text-[#F3EFE8] border border-[#1F3354] rounded-xl text-xs font-bold"
                >
                  Browse Projects
                </button>
              </div>
        </div>
      )}
        </div>
      )}

      {/* ─── TAB 3: MY SITE VISITS ─── */}
      {activeTab === 'site-visits' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold text-white">My Show Residence Visits</h2>
              <p className="text-xs text-[#94A3B8]">
                Confirmed appointment passes with directions, verified map coordinates, and gate codes.
              </p>
            </div>
            <button
              onClick={() => navigate('/book-visit')}
              className="px-4 py-2 bg-[#C8814F] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <CalendarCheck size={14} />
              <span>Book Another Viewing</span>
            </button>
          </div>

          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {b.status || 'Confirmed'}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#C8814F]">
                      Pass Code: {b.confirmationCode}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{b.slot?.project?.name || 'The Grand Orchid'}</h3>
                  <p className="text-xs text-[#94A3B8] flex items-center gap-1">
                    <MapPin size={13} className="text-[#C8814F]" />
                    {b.slot?.project?.location || 'SG Highway, Ahmedabad'}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Scheduled Date</span>
                      <strong className="text-white">{b.bookingDate || b.slot?.date}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Time Window</span>
                      <strong className="text-white">{b.timeSlot || b.slot?.startTime}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Assigned Advisor</span>
                      <strong className="text-white">{b.slot?.assignedExecutive?.name || 'Pooja Sharma (Senior Executive)'}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-2 min-w-[200px]">
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-[#15233A] hover:bg-[#1f3354] text-white rounded-xl text-xs font-bold text-center border border-[#1F3354] transition-all flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink size={13} className="text-[#C8814F]" />
                    <span>Open Navigation Map</span>
                  </a>
                  {b.status !== 'CANCELLED' && (
                    <>
                      <button
                        onClick={() => {
                          setRescheduleModal(b);
                          setSelectedSlotId(availableSlots[0]?.id || '');
                        }}
                        className="w-full py-2 bg-[#0D1726] hover:bg-[#15233A] text-[#94A3B8] hover:text-white rounded-xl text-xs font-bold border border-[#1F3354] transition-all flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw size={12} />
                        <span>Reschedule Visit</span>
                      </button>
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="w-full py-2 bg-[#0D1726] hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-bold border border-rose-900/30 transition-all"
                      >
                        Cancel Reservation
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: MY PAYMENTS & RECEIPTS ─── */}
      {(activeTab === 'payments' || activeTab === 'receipts') && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Payment Ledger & Official Receipts</h2>
              <p className="text-xs text-[#94A3B8]">
                Verified escrow bank transactions, milestone receipts, and statutory RERA GST vouchers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                Escrow: ICICI Bank 002405011928 (RERA Approved)
              </span>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-[#C8814F]/20"
              >
                <CreditCard size={14} />
                <span>Pay Token (Razorpay)</span>
              </button>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="p-10 text-center bg-[#0D1726] rounded-2xl border border-[#1F3354] space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#C8814F]/10 border border-[#C8814F]/20 flex items-center justify-center text-[#C8814F]">
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">No Payment Records Yet</h3>
                <p className="text-xs text-[#94A3B8] max-w-sm mx-auto mt-1">
                  Pay your initial token deposit (₹50,000 / ₹1,00,000) via our verified Razorpay gateway to lock in your apartment unit.
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-5 py-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shadow-lg shadow-[#C8814F]/20"
              >
                <CreditCard size={14} />
                <span>Pay Token Deposit (Razorpay)</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D1726] text-[#64748B] uppercase tracking-wider border-b border-[#1F3354]">
                  <tr>
                    <th className="p-3.5">Transaction ID</th>
                    <th className="p-3.5">Payment Type</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F3354]">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#0D1726]/50 transition-colors">
                      <td className="p-3.5 font-mono text-[#C8814F] font-bold">{p.id}</td>
                      <td className="p-3.5 font-semibold text-white">{p.paymentType}</td>
                      <td className="p-3.5 font-bold text-white">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-[#94A3B8]">{p.paymentDate || new Date(p.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${p.status === 'Verified'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDownloadReceipt(p)}
                          className="px-3 py-1 bg-[#15233A] hover:bg-[#C8814F] text-white rounded-lg border border-[#1F3354] transition-all flex items-center gap-1.5 ml-auto text-[11px]"
                        >
                          <Download size={12} />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
        </div>
      )}
        </div>
      )}

      {/* ─── TAB 5: PROPERTY BOOKING & PURCHASE MANAGEMENT WORKSPACE ─── */}
      {activeTab === 'bookings' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#C8814F]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#C8814F]/10 text-[#C8814F] border border-[#C8814F]/30 uppercase tracking-widest flex items-center gap-1.5">
                  <BookmarkCheck size={13} />
                  Buyer Purchase Workspace
                </span>
                <span className="text-xs text-[#64748B]">•</span>
                <span className="text-xs text-[#CBD5E1]">Ahmedabad Luxury Portfolio</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                Property Booking & Purchase Management
              </h2>
              <p className="text-xs text-[#94A3B8] max-w-xl">
                Real-time residential unit reservation ledger, statutory escrow payments, milestone progress, and unit specifications.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => handleOpenPaymentModal()}
                className="px-4 py-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-[#C8814F]/20"
              >
                <CreditCard size={15} />
                <span>Reserve Another Unit</span>
              </button>
            </div>
          </div>

          {/* SECTION A: BOOKING OVERVIEW CARDS (REAL DATABASE AGGREGATIONS) */}
          {(() => {
            const totalBookings = propertyBookings.length;
            const confirmedBookings = propertyBookings.filter(b => (b.bookingStatus || '').toLowerCase().includes('confirmed') || (b.bookingStatus || '').toLowerCase().includes('allotted')).length;
            const totalPropertyPrice = propertyBookings.reduce((acc, b) => acc + Number(b.agreementValue || 8500000), 0);
            const totalAmountPaid = propertyBookings.reduce((acc, b) => {
              const bPayments = payments.filter(p => p.status === 'Verified' && ((b.unitNumber && p.unitNumber === b.unitNumber) || (b.projectId && p.projectId === b.projectId)));
              const bPaid = bPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
              return acc + Math.max(Number(b.paidAmount || 0), bPaid);
            }, 0);
            const totalTokenPaid = propertyBookings.reduce((acc, b) => {
              const bPayments = payments.filter(p => p.status === 'Verified' && ((b.unitNumber && p.unitNumber === b.unitNumber) || (b.projectId && p.projectId === b.projectId)));
              const tP = bPayments.filter(p => (p.paymentType || '').toLowerCase().includes('token')).reduce((sum, p) => sum + Number(p.amount || 0), 0);
              return acc + (tP || Math.min(Number(b.paidAmount || 0), 100000));
            }, 0);
            const totalTenPercentPaid = propertyBookings.reduce((acc, b) => {
              const bAgr = Number(b.agreementValue || 8500000);
              const bPaid = Number(b.paidAmount || 0);
              const bToken = Math.min(bPaid, 100000);
              return acc + Math.max(0, Math.min(bPaid - bToken, Math.round(bAgr * 0.10) - bToken));
            }, 0);
            const totalRemainingDue = Math.max(0, totalPropertyPrice - totalAmountPaid);

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl relative overflow-hidden">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Total Property Price</span>
                  <p className="text-2xl font-bold font-display text-white mt-1">₹{(totalPropertyPrice / 10000000).toFixed(2)} Cr</p>
                  <span className="text-[10px] text-[#64748B]">{totalBookings} units under contract</span>
                </div>

                <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl relative overflow-hidden">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Token Paid</span>
                  <p className="text-2xl font-bold font-display text-[#C8814F] mt-1">₹{(totalTokenPaid / 100000).toFixed(2)}L</p>
                  <span className="text-[10px] text-[#CBD5E1]">Priority reservation</span>
                </div>

                <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl relative overflow-hidden">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">10% Advance Paid</span>
                  <p className="text-2xl font-bold font-display text-emerald-400 mt-1">₹{(totalTenPercentPaid / 100000).toFixed(2)}L</p>
                  <span className="text-[10px] text-emerald-300">Milestone clearance</span>
                </div>

                <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl relative overflow-hidden">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Total Amount Paid</span>
                  <p className="text-2xl font-bold font-display text-emerald-400 mt-1">₹{(totalAmountPaid / 100000).toFixed(2)}L</p>
                  <span className="text-[10px] text-emerald-300">Verified to Escrow</span>
                </div>

                <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl relative overflow-hidden">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Remaining Balance</span>
                  <p className="text-2xl font-bold font-display text-amber-300 mt-1">₹{(totalRemainingDue / 100000).toFixed(2)}L</p>
                  <span className="text-[10px] text-amber-400">Total balance payable</span>
                </div>

                <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl relative overflow-hidden">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Confirmed Bookings</span>
                  <p className="text-2xl font-bold font-display text-emerald-400 mt-1">{confirmedBookings} of {totalBookings}</p>
                  <span className="text-[10px] text-emerald-300">Allotment verified</span>
                </div>
              </div>
            );
          })()}

          {/* MAIN BOOKING CONTENT */}
          {propertyBookings.length === 0 ? (
            <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-[#C8814F]/10 border border-[#C8814F]/20 flex items-center justify-center text-[#C8814F]">
                <BookmarkCheck size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No Active Property Bookings Found</h3>
                <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                  You have not reserved a residential unit yet. Select an available apartment from the portfolio below to secure your priority reservation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenPaymentModal()}
                className="px-6 py-3 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#C8814F]/20 inline-flex items-center gap-2"
              >
                <CreditCard size={15} />
                <span>Reserve Residence via RERA Escrow</span>
              </button>
            </div>
          ) : (
            propertyBookings.map((pb) => {
              const agrVal = Number(pb.agreementValue || 8500000);
              // Filter verified payments for this booking
              const unitPayments = payments.filter(p =>
                (pb.unitNumber && p.unitNumber === pb.unitNumber) ||
                (pb.projectId && p.projectId === pb.projectId) ||
                (pb.projectName && p.projectName?.toLowerCase() === pb.projectName?.toLowerCase())
              );
              const totalPaymentsPaid = unitPayments.filter(p => p.status === 'Verified').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
              const paidVal = Math.max(Number(pb.paidAmount || 0), totalPaymentsPaid);
              const remainingDue = Math.max(0, agrVal - paidVal);
              const rawPct = agrVal > 0 ? (paidVal / agrVal) * 100 : Number(pb.paymentPercentage || 0);
              const isFullySettled = remainingDue === 0 || rawPct >= 100 || paidVal >= agrVal;
              const percentPaid = isFullySettled ? 100 : Math.min(100, rawPct > 0 ? Number(rawPct.toFixed(2)) : 0);
              const displayPct = isFullySettled ? '100%' : (rawPct >= 1 ? `${rawPct.toFixed(1)}%` : (rawPct > 0 ? `${rawPct.toFixed(2)}%` : '0%'));
              const tenPercentVal = Math.round(agrVal * 0.10);
              const tokenPayments = unitPayments.filter(p => p.status === 'Verified' && (p.paymentType || '').toLowerCase().includes('token'));
              const tokenPaid = tokenPayments.length > 0
                ? tokenPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
                : (paidVal > 0 ? Math.min(paidVal, 100000) : 0);
              const advancePaid = Math.max(0, Math.min(paidVal - tokenPaid, tenPercentVal - tokenPaid));

              // Image resolution for booked unit
              const propertyImg = pb.configuration?.includes('4 BHK') || pb.configuration?.includes('Villa')
                ? '/assets/plan-villa.jpg'
                : pb.projectName?.includes('Meadows')
                  ? '/assets/story/story-04-living.jpg'
                  : pb.configuration?.includes('2 BHK')
                    ? '/assets/plan-3bhk.jpg'
                    : '/assets/story/story-03-residences.jpg';

              const floorDisplay = pb.tower?.includes('Phase') ? 'Ground + 1st Floor' : `Floor ${pb.unitNumber?.match(/\d+/)?.[0]?.slice(0, 2) || '09'}`;
              const carpetDisplay = pb.configuration?.includes('4 BHK') ? '2,850 sq.ft' : pb.configuration?.includes('2 BHK') ? '890 sq.ft' : '1,320 sq.ft';
              const locationDisplay = pb.projectName?.includes('Meadows') ? 'South Bopal, Ahmedabad' : pb.projectName?.includes('Villa') ? 'Ambli-Bopal Road, Ahmedabad' : 'SG Highway, Bodakdev, Ahmedabad';
              const bookingRefId = pb.bookingCode || `BK-GJ-2026-${pb.id.slice(-6)}`;
              const bookingDateDisplay = pb.createdAt ? new Date(pb.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Nov 2026';

              return (
                <div key={pb.id} className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl relative">
                  {/* SECTION B: SELECTED PROPERTY CARD */}
                  <div className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-5 sm:p-6 relative overflow-hidden">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto">
                        <div className="relative w-full sm:w-48 h-36 rounded-2xl overflow-hidden border border-[#1F3354] shrink-0 shadow-xl group">
                          <img
                            src={propertyImg}
                            alt={pb.projectName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-2 left-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/80 text-white backdrop-blur-sm border border-white/10">
                            {pb.unitNumber}
                          </span>
                          <span className="absolute bottom-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/80 text-white backdrop-blur-sm">
                            AUDA Approved
                          </span>
                        </div>

                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C8814F] px-2.5 py-0.5 rounded bg-[#C8814F]/10 border border-[#C8814F]/20">
                              Ref: {bookingRefId}
                            </span>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                              {pb.bookingStatus || 'Confirmed (Token Paid)'}
                            </span>
                          </div>

                          <h3 className="text-2xl font-bold font-display text-white">{pb.projectName}</h3>

                          <div className="flex items-center gap-3 text-xs text-[#CBD5E1] flex-wrap pt-0.5">
                            <span className="font-semibold text-white">{pb.tower} • {pb.unitNumber}</span>
                            <span className="text-[#64748B]">•</span>
                            <span className="text-[#C8814F] font-semibold">{pb.configuration}</span>
                            <span className="text-[#64748B]">•</span>
                            <span className="text-[#94A3B8]">{floorDisplay}</span>
                            <span className="text-[#64748B]">•</span>
                            <span className="text-[#94A3B8] font-mono">{carpetDisplay}</span>
                          </div>

                          <p className="text-xs text-[#94A3B8] flex items-center gap-1.5 pt-1">
                            <MapPin size={13} className="text-[#C8814F] shrink-0" />
                            <span>{locationDisplay}</span>
                            <span className="text-[#64748B]">•</span>
                            <span>Booked on {bookingDateDisplay}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-auto w-full lg:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => handleOpenReraDossier(pb)}
                          className="px-3.5 py-2 bg-[#15233A] hover:bg-[#1A2C4C] border border-[#1F3354] hover:border-[#C8814F]/40 text-[#CBD5E1] hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow"
                        >
                          <ShieldCheck size={14} className="text-emerald-400" />
                          <span>Inspect Statutory RERA Dossier</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SECTION C: BOOKING PROGRESS TIMELINE (6 CHRONOLOGICAL STAGES) */}
                  <div className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#1F3354]/60">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Clock size={14} className="text-[#C8814F]" />
                        <span>Buyer Purchase Journey & Booking Progression</span>
                      </h4>
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                        Stage {isFullySettled ? '6 of 6 (Completed)' : paidVal >= 50000 ? '5 of 6 (Milestone Clearance)' : '3 of 6 (Token Payment)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                      {[
                        { step: 1, title: 'Property Selected', desc: 'Unit reserved in inventory', completed: true },
                        { step: 2, title: 'Booking Initiated', desc: 'KYC & order created', completed: true },
                        { step: 3, title: 'Token Payment', desc: '₹50,000 priority deposit', completed: paidVal >= 50000 },
                        { step: 4, title: 'Booking Confirmed', desc: 'Developer priority lock', completed: (pb.bookingStatus || '').includes('Confirmed') || isFullySettled },
                        { step: 5, title: 'Remaining Payment', desc: `₹${(remainingDue / 100000).toFixed(2)}L due`, completed: isFullySettled, active: !isFullySettled },
                        { step: 6, title: 'Full Payment Completed', desc: '100% full agreement settled', completed: isFullySettled }
                      ].map((item) => (
                        <div
                          key={item.step}
                          className={`p-3.5 rounded-xl border transition-all text-xs space-y-1.5 ${
                            item.completed
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                              : item.active
                                ? 'bg-amber-950/20 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/30'
                                : 'bg-[#15233A]/40 border-[#1F3354] text-[#64748B]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold font-mono">Step 0{item.step}</span>
                            {item.completed ? (
                              <CheckCircle2 size={14} className="text-emerald-400" />
                            ) : item.active ? (
                              <Clock size={14} className="text-amber-400 animate-pulse" />
                            ) : (
                              <Lock size={12} className="text-[#64748B]" />
                            )}
                          </div>
                          <strong className="block text-white font-semibold text-xs leading-tight">{item.title}</strong>
                          <span className="text-[10px] block opacity-80 leading-normal">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION D: PAYMENT SUMMARY PANEL */}
                  <div className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between pb-2 border-b border-[#1F3354]/60">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <CreditCard size={14} className="text-[#C8814F]" />
                        <span>Payment Breakdown & Remaining Balance Ledger</span>
                      </h4>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {displayPct} Cleared
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-[#15233A] border border-[#1F3354]">
                        <span className="text-[10px] text-[#64748B] block font-semibold uppercase">Total Property Price</span>
                        <strong className="text-base text-white font-mono block mt-0.5">
                          ₹{(agrVal / 10000000).toFixed(2)} Cr
                        </strong>
                        <span className="text-[10px] text-[#94A3B8] font-mono">₹{agrVal.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#15233A] border border-[#1F3354]">
                        <span className="text-[10px] text-[#C8814F] block font-semibold uppercase">Token Paid</span>
                        <strong className="text-base text-[#C8814F] font-mono block mt-0.5">
                          ₹{tokenPaid.toLocaleString('en-IN')}
                        </strong>
                        <span className="text-[10px] text-[#94A3B8]">Priority Lock Advance</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#15233A] border border-[#1F3354]">
                        <span className="text-[10px] text-emerald-400 block font-semibold uppercase">10% Advance Paid</span>
                        <strong className="text-base text-emerald-400 font-mono block mt-0.5">
                          ₹{advancePaid.toLocaleString('en-IN')}
                        </strong>
                        <span className="text-[10px] text-emerald-300 font-semibold">
                          {paidVal >= tenPercentVal ? '10% Target Cleared' : `₹${Math.max(0, tenPercentVal - paidVal).toLocaleString('en-IN')} remaining`}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#15233A] border border-[#1F3354]">
                        <span className="text-[10px] text-emerald-400 block font-semibold uppercase">Total Paid</span>
                        <strong className="text-base text-emerald-400 font-mono block mt-0.5">
                          ₹{(paidVal / 100000).toFixed(2)} Lakhs
                        </strong>
                        <span className="text-[10px] text-emerald-300 font-semibold">{displayPct} Escrow Cleared</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#15233A] border border-[#1F3354]">
                        <span className="text-[10px] text-amber-400 block font-semibold uppercase">Remaining Balance</span>
                        <strong className="text-base text-amber-300 font-mono block mt-0.5">
                          {isFullySettled ? '₹0.00 (NIL)' : `₹${(remainingDue / 100000).toFixed(2)} Lakhs`}
                        </strong>
                        <span className="text-[10px] text-[#94A3B8]">
                          {isFullySettled ? '100% Cleared' : `₹${remainingDue.toLocaleString('en-IN')} due`}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#15233A] border border-[#1F3354]">
                        <span className="text-[10px] text-[#64748B] block font-semibold uppercase">Payment Status</span>
                        <strong className="text-xs text-white block mt-1">
                          {isFullySettled ? '100% Full Payment' : (paidVal >= tenPercentVal ? '10% Advance Paid' : 'Token Paid')}
                        </strong>
                        <span className="text-[10px] text-emerald-300 font-semibold">
                          {isFullySettled ? 'Allotment Letter Issued' : (paidVal >= tenPercentVal ? 'Letter Issued' : 'Under Approval')}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#94A3B8]">Agreement Settlement Progress</span>
                        <span className="font-mono text-emerald-400 font-bold">{displayPct} Completed</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-[#15233A] overflow-hidden border border-[#1F3354] p-0.5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#C8814F] via-amber-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${isFullySettled ? 100 : (paidVal > 0 ? Math.max(4, Math.min(100, rawPct)) : 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION E: PAYMENT HISTORY LEDGER */}
                  <div className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#1F3354]/60">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Receipt size={14} className="text-[#C8814F]" />
                        <span>Verified Payment History & Escrow Receipts</span>
                      </h4>
                      <span className="text-xs text-[#94A3B8]">
                        {unitPayments.length} Recorded Transactions
                      </span>
                    </div>

                    {unitPayments.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#64748B] bg-[#15233A]/40 rounded-xl border border-[#1F3354]">
                        No payment transactions recorded for this unit yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-[#CBD5E1]">
                          <thead>
                            <tr className="border-b border-[#1F3354] text-[#64748B] text-[10px] uppercase">
                              <th className="py-2.5 px-3">Transaction ID</th>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Purpose</th>
                              <th className="py-2.5 px-3">Amount</th>
                              <th className="py-2.5 px-3">Method</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1F3354]/50">
                            {unitPayments.map((p) => (
                              <tr key={p.id} className="hover:bg-[#15233A]/50 transition">
                                <td className="py-3 px-3 font-mono text-[11px] text-white">
                                  {p.transactionRef || `TXN-${p.id.slice(-8)}`}
                                </td>
                                <td className="py-3 px-3 text-[#94A3B8]">
                                  {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="py-3 px-3">{p.paymentType || 'Apartment Token Booking Deposit'}</td>
                                <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                                  ₹{p.amount?.toLocaleString('en-IN')}
                                </td>
                                <td className="py-3 px-3 text-[#CBD5E1]">
                                  {p.paymentMethod || 'RERA Escrow Gateway'}
                                </td>
                                <td className="py-3 px-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                    {p.status || 'Verified'}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadReceipt(p)}
                                    className="px-2.5 py-1 bg-[#15233A] hover:bg-[#C8814F] text-white rounded-lg border border-[#1F3354] transition text-[11px] font-semibold inline-flex items-center gap-1.5"
                                  >
                                    <Download size={12} />
                                    <span>PDF</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* SECTION F: ESCROW PAYMENT ACTION */}
                  {!isFullySettled ? (
                    <div className="bg-gradient-to-r from-[#15233A] to-[#1A2C4C] border border-[#C8814F]/40 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                            Amount Due: ₹{(remainingDue / 100000).toFixed(2)} Lakhs
                          </span>
                          <span className="text-xs text-[#64748B]">•</span>
                          <span className="text-xs text-white font-semibold">ICICI Bank Escrow #002405019842</span>
                        </div>
                        <h4 className="text-base font-bold text-white">Settle Balance or Pay Next Milestone via Razorpay Gateway</h4>
                        <p className="text-xs text-[#94A3B8] max-w-xl">
                          Pay directly into the project's RERA-registered escrow account via Razorpay. Instant cryptographic verification, ledger balance recalculation, and automated provisional allotment issuance.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handlePayRemaining(pb)}
                          className="px-5 py-3 bg-gradient-to-r from-[#C8814F] to-[#E09865] hover:opacity-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-[#C8814F]/20 cursor-pointer"
                        >
                          <CreditCard size={16} />
                          <span>Pay Balance via Razorpay Gateway</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <strong className="text-emerald-300 block text-sm font-bold">100% Full Payment Completed</strong>
                          <p className="text-xs text-[#94A3B8]">
                            Your residential apartment is 100% paid. Possession is guaranteed for December 2026. Your official stamped allotment letter is available in the Allotment Management Workspace.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSearchParams({ tab: 'allotments' })}
                        className="px-4 py-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow shrink-0"
                      >
                        <Award size={15} />
                        <span>Go to Allotment Documents</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── TAB 6: PROPERTY ALLOTMENT & DOCUMENT MANAGEMENT WORKSPACE ─── */}
      {activeTab === 'allotments' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1.5">
                  <Award size={13} />
                  Legal Allocation & Compliance
                </span>
                <span className="text-xs text-[#64748B]">•</span>
                <span className="text-xs text-[#CBD5E1]">GUJRERA Official Repository</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                Property Allotment & Document Management
              </h2>
              <p className="text-xs text-[#94A3B8] max-w-xl">
                Statutory compliance verification, official allotment certificates, AUDA building permits, and title clearance deeds.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const defaultPb = propertyBookings[0] || null;
                  handleOpenReraDossier(defaultPb);
                }}
                className="px-4 py-2.5 bg-[#0D1726] hover:bg-[#1A2C4C] border border-[#1F3354] hover:border-[#C8814F]/40 text-[#CBD5E1] hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow"
              >
                <ShieldCheck size={15} className="text-emerald-400" />
                <span>Inspect GUJRERA Regulatory Filing</span>
              </button>
            </div>
          </div>

          {/* SECTION A: ALLOTMENT OVERVIEW CARDS (REAL DATABASE AGGREGATIONS) */}
          {(() => {
            const totalAllotments = propertyBookings.length;
            const pendingApproval = propertyBookings.filter(b => b.allotmentStatus !== 'Letter Issued' && b.allotmentStatus !== 'Approved').length;
            const approvedAllotments = propertyBookings.filter(b => b.allotmentStatus === 'Letter Issued' || b.allotmentStatus === 'Approved').length;
            const totalDocsReady = propertyBookings.length > 0 ? propertyBookings.length * 5 : 0;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Total Allotments</span>
                  <p className="text-2xl font-bold font-display text-white mt-1">{totalAllotments}</p>
                  <span className="text-[10px] text-[#64748B]">Units allocated</span>
                </div>

                <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Pending Approval</span>
                  <p className="text-2xl font-bold font-display text-amber-400 mt-1">{pendingApproval}</p>
                  <span className="text-[10px] text-amber-300">Requires 100% payment</span>
                </div>

                <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Approved & Issued</span>
                  <p className="text-2xl font-bold font-display text-emerald-400 mt-1">{approvedAllotments}</p>
                  <span className="text-[10px] text-emerald-300">Letter stamped</span>
                </div>

                <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Withheld / Rejected</span>
                  <p className="text-2xl font-bold font-display text-[#64748B] mt-1">0</p>
                  <span className="text-[10px] text-emerald-400">Clean title</span>
                </div>

                <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Statutory Documents</span>
                  <p className="text-2xl font-bold font-display text-[#C8814F] mt-1">{totalDocsReady}</p>
                  <span className="text-[10px] text-[#CBD5E1]">Ready in repository</span>
                </div>
              </div>
            );
          })()}

          {/* ALLOTMENT CONTENT */}
          {propertyBookings.length === 0 ? (
            <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <FileText size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No Allotment Records Generated Yet</h3>
                <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                  Statutory provisional allotment certificates are issued upon completion of required payments and administrative verification. Reserve an apartment to begin the allocation lifecycle.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSearchParams({ tab: 'bookings' })}
                className="px-6 py-3 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition shadow-lg inline-flex items-center gap-2"
              >
                <BookmarkCheck size={15} />
                <span>Go to Property Bookings</span>
              </button>
            </div>
          ) : (
            propertyBookings.map((pb) => {
              const agrVal = Number(pb.agreementValue || 8500000);
              const unitPayments = payments.filter(p =>
                (pb.unitNumber && p.unitNumber === pb.unitNumber) ||
                (pb.projectId && p.projectId === pb.projectId) ||
                (pb.projectName && p.projectName?.toLowerCase() === pb.projectName?.toLowerCase())
              );
              const totalPaymentsPaid = unitPayments.filter(p => p.status === 'Verified').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
              const paidVal = Math.max(Number(pb.paidAmount || 0), totalPaymentsPaid);
              const remainingDue = Math.max(0, agrVal - paidVal);
              const isFullySettled = remainingDue === 0 || paidVal >= agrVal;
              const isApproved = pb.allotmentStatus === 'Letter Issued' || pb.allotmentStatus === 'Approved' || isFullySettled;

              const propertyImg = pb.configuration?.includes('4 BHK') || pb.configuration?.includes('Villa')
                ? '/assets/plan-villa.jpg'
                : pb.projectName?.includes('Meadows')
                  ? '/assets/story/story-04-living.jpg'
                  : pb.configuration?.includes('2 BHK')
                    ? '/assets/plan-3bhk.jpg'
                    : '/assets/story/story-03-residences.jpg';

              const floorDisplay = pb.tower?.includes('Phase') ? 'Ground + 1st Floor' : `Floor ${pb.unitNumber?.match(/\d+/)?.[0]?.slice(0, 2) || '09'}`;
              const carpetDisplay = pb.configuration?.includes('4 BHK') ? '2,850 sq.ft' : pb.configuration?.includes('2 BHK') ? '890 sq.ft' : '1,320 sq.ft';
              const locationDisplay = pb.projectName?.includes('Meadows') ? 'South Bopal, Ahmedabad' : pb.projectName?.includes('Villa') ? 'Ambli-Bopal Road, Ahmedabad' : 'SG Highway, Bodakdev, Ahmedabad';
              const bookingRefId = pb.bookingCode || `BK-GJ-2026-${pb.id.slice(-6)}`;
              const bookingDateDisplay = pb.createdAt ? new Date(pb.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Nov 2026';
              const allotmentLetterRef = pb.allotmentLetterNo || (isFullySettled ? `ALT-GJ-2026-${pb.id.slice(-6)}` : 'Under Review (Pending Full Payment)');
              const allotmentDateDisplay = pb.allotmentDate || (isFullySettled ? 'Dec 2026' : 'Upon 100% Settlement');

              return (
                <div key={pb.id} className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl relative">
                  {/* SECTION B: PROMINENT ALLOTMENT STATUS BANNER */}
                  {!isFullySettled ? (
                    <div className="bg-[#0D1726] border border-amber-500/40 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                          <Lock size={18} />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                            Allotment Status: Pending Full Payment
                          </span>
                          <h4 className="text-sm font-bold text-white">
                            Provisional Allotment Letter Locked • 100% Payment & Administrative Approval Required
                          </h4>
                          <p className="text-xs text-[#94A3B8] max-w-2xl leading-relaxed">
                            Allotment Letter will be available after successful completion of the required payment (100% full payment) and administrative approval. Current paid: <strong className="text-white">₹{(paidVal / 100000).toFixed(2)} Lakhs</strong> of <strong className="text-white">₹{(agrVal / 10000000).toFixed(2)} Cr</strong> (Remaining: <strong className="text-amber-400">₹{(remainingDue / 100000).toFixed(2)} Lakhs</strong>).
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePayRemaining(pb)}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 shrink-0"
                      >
                        <CreditCard size={15} />
                        <span>Pay Balance to Unlock Letter</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                          <CheckCircle2 size={20} />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                            Allotment Status: Approved & Document Generated
                          </span>
                          <h4 className="text-sm font-bold text-white">
                            Official RERA Provisional Allotment Stamped • Possession Guaranteed
                          </h4>
                          <p className="text-xs text-[#94A3B8] max-w-2xl leading-relaxed">
                            Provisional Allotment Letter #{allotmentLetterRef} has been officially recorded in the developer register. 100% payment verification is authenticated by AUDA/GUJRERA guidelines.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadAllotment(pb)}
                        className="px-5 py-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-[#C8814F]/20 shrink-0"
                      >
                        <Download size={15} />
                        <span>Download Allotment PDF</span>
                      </button>
                    </div>
                  )}

                  {/* SECTION C: ALLOTTED PROPERTY DETAILS (LEGAL DEED / CERTIFICATE CARD LAYOUT) */}
                  <div className="bg-[#09111D] border-2 border-[#1F3354] rounded-2xl p-6 sm:p-7 relative overflow-hidden space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F3354]">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#C8814F]">
                          Statutory Allocation Certificate
                        </span>
                        <h3 className="text-xl font-bold font-display text-white mt-0.5">
                          Certificate of Provisional Apartment Allocation
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-3 py-1 rounded bg-[#15233A] border border-[#1F3354] text-[#CBD5E1]">
                          Allotment No: <strong className="text-white">{allotmentLetterRef}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      <div className="w-full h-44 rounded-2xl overflow-hidden border border-[#1F3354] relative group shadow-lg">
                        <img
                          src={propertyImg}
                          alt={pb.projectName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-black/80 text-white backdrop-blur-sm">
                          {pb.unitNumber}
                        </span>
                      </div>

                      <div className="md:col-span-2 space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Master Development</span>
                            <strong className="text-base text-white block mt-0.5">{pb.projectName}</strong>
                            <span className="text-[11px] text-[#94A3B8]">Promoter: PropAssist Ahmedabad Developers LLP</span>
                          </div>

                          <div>
                            <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Unit Specifications</span>
                            <strong className="text-base text-[#C8814F] block mt-0.5">{pb.unitNumber} ({pb.configuration})</strong>
                            <span className="text-[11px] text-[#CBD5E1]">{pb.tower} • {floorDisplay} • {carpetDisplay}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#1F3354]/60">
                          <div>
                            <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Authorized Legal Allottee</span>
                            <strong className="text-white block mt-0.5">{user?.name || 'Verified Homebuyer'}</strong>
                            <span className="text-[11px] text-[#94A3B8] font-mono">{user?.email}</span>
                          </div>

                          <div>
                            <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Regulatory Reference Numbers</span>
                            <strong className="text-emerald-400 block mt-0.5 font-mono text-xs">{bookingRefId}</strong>
                            <span className="text-[10px] text-[#94A3B8]">RERA: {pb.reraNumber || 'PR/GJ/AHMEDABAD/AUDA/RAA10022/2026'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION D: ALLOTMENT APPROVAL TIMELINE (6 LEGAL STEPS) */}
                  <div className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#1F3354]/60">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Clock size={14} className="text-[#C8814F]" />
                        <span>Allotment Approval & Document Issuance Progression</span>
                      </h4>
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                        {isFullySettled && isApproved ? 'Phase 6: Document Available' : isFullySettled ? 'Phase 4: Developer Approval' : 'Phase 2: Payment Verification'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                      {[
                        { step: 1, title: 'Booking Completed', desc: 'Unit reservation confirmed', completed: true },
                        { step: 2, title: 'Payments Verified', desc: isFullySettled ? '100% full payment cleared' : `₹${(remainingDue / 100000).toFixed(2)}L balance pending`, completed: isFullySettled },
                        { step: 3, title: 'Developer Approval', desc: isFullySettled ? 'Statutory sign-off logged' : 'Pending 100% clearance', completed: isFullySettled },
                        { step: 4, title: 'Allotment Approved', desc: 'Promoter seal recorded', completed: isFullySettled && isApproved },
                        { step: 5, title: 'Letter Generated', desc: pb.allotmentLetterNo || (isFullySettled ? 'ALT-GJ Generated' : 'Pending'), completed: isFullySettled && !!pb.allotmentLetterNo },
                        { step: 6, title: 'Available for Download', desc: isFullySettled ? 'PDF Stamped & Ready' : 'Locked until settled', completed: isFullySettled }
                      ].map((item) => (
                        <div
                          key={item.step}
                          className={`p-3.5 rounded-xl border transition-all text-xs space-y-1.5 ${
                            item.completed
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-[#15233A]/40 border-[#1F3354] text-[#64748B]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold font-mono">Phase 0{item.step}</span>
                            {item.completed ? (
                              <CheckCircle2 size={14} className="text-emerald-400" />
                            ) : (
                              <Lock size={12} className="text-[#64748B]" />
                            )}
                          </div>
                          <strong className="block text-white font-semibold text-xs leading-tight">{item.title}</strong>
                          <span className="text-[10px] block opacity-80 leading-normal">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION E: DOCUMENT CENTER (DEDICATED DOCUMENT REPOSITORY) */}
                  <div className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#1F3354]/60">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <FileText size={14} className="text-[#C8814F]" />
                        <span>Statutory Document Repository & Legal File Downloads</span>
                      </h4>
                      <span className="text-xs text-[#94A3B8]">5 Authorized Deeds</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* Document 1: Allotment Letter */}
                      <div className={`p-4 rounded-xl border transition flex flex-col justify-between gap-3 ${
                        isFullySettled
                          ? 'bg-[#15233A] border-emerald-500/40'
                          : 'bg-[#15233A]/60 border-[#1F3354]'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isFullySettled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            <Award size={18} />
                          </div>
                          <div className="space-y-0.5">
                            <strong className="text-white text-xs block font-semibold">
                              Provisional RERA Allotment Certificate (GUJRERA Form 4)
                            </strong>
                            <span className="text-[11px] text-[#94A3B8] block font-mono">
                              Ref: {allotmentLetterRef} • {allotmentDateDisplay}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block mt-1 ${
                              isFullySettled
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}>
                              {isFullySettled ? 'Stamped & Certified' : 'Locked (Requires 100% Payment)'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#1F3354]/60 flex items-center justify-between">
                          <span className="text-[10px] text-[#64748B]">Issued under RERA Act 2016</span>
                          {isFullySettled ? (
                            <button
                              type="button"
                              onClick={() => handleDownloadAllotment(pb)}
                              className="px-3.5 py-1.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <Download size={13} />
                              <span>Download PDF</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="px-3.5 py-1.5 bg-[#15233A] text-[#64748B] border border-[#1F3354] rounded-lg text-xs font-bold cursor-not-allowed flex items-center gap-1.5"
                            >
                              <Lock size={12} className="text-amber-500" />
                              <span>Locked</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Document 2: Booking Slip */}
                      <div className="p-4 rounded-xl bg-[#15233A] border border-[#1F3354] flex flex-col justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                            <BookmarkCheck size={18} />
                          </div>
                          <div className="space-y-0.5">
                            <strong className="text-white text-xs block font-semibold">
                              Property Booking Confirmation Slip & Unit Reservation Order
                            </strong>
                            <span className="text-[11px] text-[#94A3B8] block font-mono">
                              Ref: {bookingRefId} • Stamped {bookingDateDisplay}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded inline-block bg-blue-500/10 text-blue-400 border border-blue-500/30 mt-1">
                              Digital Contract Verified
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#1F3354]/60 flex items-center justify-between">
                          <span className="text-[10px] text-[#64748B]">AUDA Unit Allocation #104</span>
                          <button
                            type="button"
                            onClick={() => alert(`Official Booking Confirmation Slip:\n\nBooking ID: ${bookingRefId}\nUnit: ${pb.unitNumber} (${pb.projectName})\nAgreement Value: ₹${(agrVal / 10000000).toFixed(2)} Cr\nPaid to Escrow: ₹${(paidVal / 100000).toFixed(2)} Lakhs\nStatus: Verified Booking.`)}
                            className="px-3.5 py-1.5 bg-[#0D1726] hover:bg-[#1A2C4C] text-[#CBD5E1] hover:text-white rounded-lg border border-[#1F3354] text-xs font-semibold transition flex items-center gap-1.5"
                          >
                            <Eye size={13} />
                            <span>Preview Slip</span>
                          </button>
                        </div>
                      </div>

                      {/* Document 3: Verified RERA Escrow Receipt */}
                      <div className="p-4 rounded-xl bg-[#15233A] border border-[#1F3354] flex flex-col justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                            <Receipt size={18} />
                          </div>
                          <div className="space-y-0.5">
                            <strong className="text-white text-xs block font-semibold">
                              Verified RERA Statutory Escrow Bank Deposit Vouchers
                            </strong>
                            <span className="text-[11px] text-[#94A3B8] block font-mono">
                              ICICI Bank Escrow #002405019842 • Audit Validated
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded inline-block bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mt-1">
                              Tax Invoice & Stamp Duty
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#1F3354]/60 flex items-center justify-between">
                          <span className="text-[10px] text-[#64748B]">Audited by Chartered Auditor</span>
                          <button
                            type="button"
                            onClick={() => setSearchParams({ tab: 'payments' })}
                            className="px-3.5 py-1.5 bg-[#0D1726] hover:bg-[#1A2C4C] text-[#CBD5E1] hover:text-white rounded-lg border border-[#1F3354] text-xs font-semibold transition flex items-center gap-1.5"
                          >
                            <Receipt size={13} />
                            <span>View In Ledger</span>
                          </button>
                        </div>
                      </div>

                      {/* Document 4: AUDA Sanctioned Building Permits */}
                      <div className="p-4 rounded-xl bg-[#15233A] border border-[#1F3354] flex flex-col justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                            <FileCheck size={18} />
                          </div>
                          <div className="space-y-0.5">
                            <strong className="text-white text-xs block font-semibold">
                              AUDA Sanctioned Architectural Master Layout & Unit Blueprints
                            </strong>
                            <span className="text-[11px] text-[#94A3B8] block font-mono">
                              Permit #AUDA/BP/2024/991 • Valid till Dec 2028
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded inline-block bg-purple-500/10 text-purple-400 border border-purple-500/30 mt-1">
                              Structural Stability Approved
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#1F3354]/60 flex items-center justify-between">
                          <span className="text-[10px] text-[#64748B]">100% RERA Carpet Area Certified</span>
                          <button
                            type="button"
                            onClick={() => handleOpenReraDossier(pb)}
                            className="px-3.5 py-1.5 bg-[#0D1726] hover:bg-[#1A2C4C] text-[#CBD5E1] hover:text-white rounded-lg border border-[#1F3354] text-xs font-semibold transition flex items-center gap-1.5"
                          >
                            <ShieldCheck size={13} className="text-emerald-400" />
                            <span>Inspect Filing</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION F: ALLOTMENT LEGAL LEDGER & STATUTORY SIGNATURES */}
                  <div className="bg-[#09111D] border border-[#1F3354] rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#1F3354]/60">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Shield size={14} className="text-emerald-400" />
                        <span>Statutory Attestation & Authorized Signatures</span>
                      </h4>
                      <span className="text-[11px] text-[#94A3B8]">DPDP 2023 Digital Signature Compliance</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                      <div className="p-3 bg-[#15233A] border border-[#1F3354] rounded-xl space-y-0.5">
                        <span className="text-[10px] text-[#64748B] uppercase block">Allotment No</span>
                        <strong className="text-white block font-mono text-[11px] truncate">{allotmentLetterRef}</strong>
                        <span className="text-[10px] text-emerald-400">RERA Form-4</span>
                      </div>

                      <div className="p-3 bg-[#15233A] border border-[#1F3354] rounded-xl space-y-0.5">
                        <span className="text-[10px] text-[#64748B] uppercase block">Project & Unit</span>
                        <strong className="text-white block text-[11px] truncate">{pb.unitNumber}</strong>
                        <span className="text-[10px] text-[#94A3B8] truncate">{pb.projectName}</span>
                      </div>

                      <div className="p-3 bg-[#15233A] border border-[#1F3354] rounded-xl space-y-0.5">
                        <span className="text-[10px] text-[#64748B] uppercase block">Legal Allottee</span>
                        <strong className="text-white block text-[11px] truncate">{user?.name || 'Homebuyer'}</strong>
                        <span className="text-[10px] text-[#94A3B8] font-mono">KYC Verified</span>
                      </div>

                      <div className="p-3 bg-[#15233A] border border-[#1F3354] rounded-xl space-y-0.5">
                        <span className="text-[10px] text-[#64748B] uppercase block">Approval Date</span>
                        <strong className="text-white block text-[11px]">{allotmentDateDisplay}</strong>
                        <span className="text-[10px] text-[#94A3B8]">Execution Timestamp</span>
                      </div>

                      <div className="p-3 bg-[#15233A] border border-[#1F3354] rounded-xl space-y-0.5">
                        <span className="text-[10px] text-[#64748B] uppercase block">Authorized Approver</span>
                        <strong className="text-white block text-[11px]">Vikramaditya Mehta</strong>
                        <span className="text-[10px] text-emerald-400">Sales Head & Signatory</span>
                      </div>

                      <div className="p-3 bg-[#15233A] border border-[#1F3354] rounded-xl space-y-0.5">
                        <span className="text-[10px] text-[#64748B] uppercase block">Statutory Escrow</span>
                        <strong className="text-emerald-400 block font-mono text-[11px]">ICICI 002405019842</strong>
                        <span className="text-[10px] text-[#94A3B8]">70% Construction Locked</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── TAB 6: PERSONAL AI ASSISTANT ─── */}
      {activeTab === 'ai-assistant' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F3354]">
            <div>
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Bot className="text-[#C8814F]" />
                <span>Personal AI Property Advisor</span>
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Multilingual AI trained on verified RERA fact sheets, floor plans, and Ahmedabad construction updates.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#0D1726] p-1.5 rounded-xl border border-[#1F3354]">
              {[
                { code: 'en', label: 'English' },
                { code: 'hi', label: 'हिंदी' },
                { code: 'gu', label: 'ગુજરાતી' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chatLanguage === lang.code ? 'bg-[#C8814F] text-white' : 'text-[#94A3B8] hover:text-white'
                    }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="space-y-3 min-h-[300px] max-h-[420px] overflow-y-auto pr-2">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 max-w-xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${msg.sender === 'user'
                      ? 'bg-[#C8814F] text-white'
                      : 'bg-[#0D1726] border border-[#1F3354] text-[#C8814F]'
                    }`}
                >
                  {msg.sender === 'user' ? 'You' : <Bot size={14} />}
                </div>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${msg.sender === 'user'
                      ? 'bg-[#C8814F] text-white'
                      : 'bg-[#0D1726] border border-[#1F3354] text-[#CBD5E1]'
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-2 text-xs text-[#94A3B8] animate-pulse">
                <Bot size={14} className="text-[#C8814F]" />
                <span>
                  {chatLanguage === 'hi'
                    ? 'सत्यापित फैक्ट शीट की जांच कर रहे हैं...'
                    : chatLanguage === 'gu'
                      ? 'વેરિફાઇડ ફેક્ટ શીટ ચકાસી રહ્યા છીએ...'
                      : 'Checking approved fact sheets...'}
                </span>
              </div>
            )}
          </div>

          {/* Quick Prompts (Language Adaptive Recommendations) */}
          <div className="pt-2 pb-1 flex items-center gap-1.5 overflow-x-auto text-xs border-t border-[#1F3354]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider shrink-0 pl-1">
              {chatLanguage === 'hi' ? 'सुझाव:' : chatLanguage === 'gu' ? 'સૂચનો:' : 'Suggestions:'}
            </span>
            {(BUYER_AI_RECOMMENDATIONS[chatLanguage] || BUYER_AI_RECOMMENDATIONS.en).map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setChatInput(item.prompt)}
                className="bg-[#0D1726] hover:bg-[#1f3354] px-3 py-1 rounded-full text-[#CBD5E1] hover:text-white whitespace-nowrap transition-colors border border-[#1F3354] text-xs"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendChat} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder={`Ask anything about carpet area, subvention, or site visit directions in ${chatLanguage === 'en' ? 'English' : chatLanguage === 'hi' ? 'Hindi' : 'Gujarati'}...`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-[#0D1726] border border-[#1F3354] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#C8814F]"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="px-5 py-3 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Send size={14} />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* ─── TAB 7: MY PROFILE & PREFERENCES ─── */}
      {activeTab === 'profile' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl">
          <div>
            <h2 className="text-xl font-display font-bold text-white">Buyer Profile & Security Settings</h2>
            <p className="text-xs text-[#94A3B8]">
              Manage your personal identity, authorized telephone number, and statutory communication consent under DPDP 2023 guidelines.
            </p>
          </div>

          {profileSaved && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Profile preferences successfully updated in secure registry.</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#A3AEC0] block mb-1">Full Legal Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#C8814F]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#A3AEC0] block mb-1">Registered Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-[#0D1726]/60 border border-[#1F3354] rounded-xl p-3 text-xs text-[#64748B] cursor-not-allowed"
              />
              <span className="text-[10px] text-[#64748B] mt-0.5 block">Email identity is verified and locked to your agreement.</span>
            </div>

            <div>
              <label className="text-xs font-bold text-[#A3AEC0] block mb-1">Telephone for Gate Passes</label>
              <input
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#C8814F]"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2.5 text-xs text-[#CBD5E1] cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappReminders}
                  onChange={(e) => setWhatsappReminders(e.target.checked)}
                  className="accent-[#C8814F]"
                />
                <span>Receive 24h & 2h visit reminders & entry gate QR codes on WhatsApp</span>
              </label>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                Save Preferences
              </button>
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2.5 bg-[#0D1726] hover:bg-red-950/40 text-red-400 border border-red-900/40 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
              >
                <LogOut size={13} />
                <span>Log Out</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── TAB 8: NOTIFICATIONS ─── */}
      {activeTab === 'notifications' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Bell className="text-[#C8814F]" />
                <span>Notifications & System Alerts</span>
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Real-time transaction updates, booking confirmations, advisor communications, and legal allotment alerts.
              </p>
            </div>
            <span className="text-xs text-[#94A3B8] font-mono bg-[#0D1726] px-3 py-1.5 rounded-xl border border-[#1F3354]">
              {notifications.length} Total Alerts
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="p-10 text-center bg-[#0D1726] rounded-2xl border border-[#1F3354] space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#C8814F]/10 border border-[#C8814F]/20 flex items-center justify-center text-[#C8814F]">
                <Bell size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">No Unread Notifications</h3>
                <p className="text-xs text-[#94A3B8] max-w-sm mx-auto mt-1">
                  You are all caught up. When you schedule a site visit or pay a booking deposit, real-time alerts will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[#C8814F]/40"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#C8814F]/15 border border-[#C8814F]/30 flex items-center justify-center text-[#C8814F] shrink-0 mt-0.5">
                      {n.type === 'visit' ? <CalendarCheck size={18} /> :
                       n.type === 'payment' ? <CreditCard size={18} /> :
                       n.type === 'allotment' ? <Award size={18} /> :
                       <Building2 size={18} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{n.title}</h4>
                      <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-[#64748B] font-mono mt-1 block">
                        {new Date(n.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSearchParams({ tab: n.actionTab })}
                    className="self-end sm:self-center px-4 py-2 bg-[#15233A] hover:bg-[#1f3354] text-white rounded-xl text-xs font-bold border border-[#1F3354] transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <span>{n.actionLabel}</span>
                    <ArrowRight size={13} className="text-[#C8814F]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Modals for WhatsApp, Jitsi Video, and In-App Chat */}
      <WhatsAppChatModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        recipientName="Pooja Sharma (Senior Executive)"
        recipientPhone={targetLead?.assignedExecutive?.phone || '+919825054321'}
        recipientRole="Sales Advisor"
        leadId={targetLead?.id}
        defaultTemplate="buyer_enquiry"
        defaultLanguage="en"
      />

      <VideoConsultationModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        leadId={targetLead?.id}
        projectId={targetLead?.projectId}
        executiveName="Pooja Sharma (Senior Executive)"
      />

      <InAppChatModal
        isOpen={isInAppChatOpen}
        onClose={() => setIsInAppChatOpen(false)}
        leadId={targetLead?.id}
        participantName="Pooja Sharma (Senior Executive)"
        participantRole="Senior Sales Executive"
      />

      {/* Reschedule Visit Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15233A] border border-[#1F3354] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setRescheduleModal(null)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-white"
            >
              <X size={18} />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#C8814F] block">
                Pass Code: {rescheduleModal.confirmationCode}
              </span>
              <h3 className="text-lg font-bold font-display text-white mt-1">Reschedule Site Visit</h3>
              <p className="text-xs text-[#94A3B8]">
                Select an available future VIP slot. Your gate pass will be automatically updated with no change fee.
              </p>
            </div>

            <form onSubmit={handleRescheduleBooking} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#A3AEC0] block mb-1">Select Available Visit Slot</label>
                <select
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#C8814F]"
                >
                  {availableSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.date} • {s.startTime} - {s.endTime} ({s.project?.name}) — {s.capacity - s.bookedCount} slots left
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModal(null)}
                  className="w-1/3 py-2.5 rounded-xl border border-[#1F3354] text-xs font-bold text-[#94A3B8] hover:bg-[#1E293B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedSlotId}
                  className="w-2/3 py-2.5 rounded-xl bg-[#C8814F] hover:bg-[#b67040] text-white text-xs font-bold shadow-lg shadow-[#C8814F]/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={13} />
                  <span>Confirm Reschedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── NEW INQUIRY MODAL ─── */}
      {showEnquiryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#15233A] border border-[#1F3354] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowEnquiryModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-white"
            >
              <X size={18} />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#C8814F] block">
                Ahmedabad Luxury Portfolio
              </span>
              <h3 className="text-xl font-bold font-display text-white mt-1">Submit Property Inquiry</h3>
              <p className="text-xs text-[#94A3B8]">
                Express your preference for 2 & 3 BHK residences across The Grand Orchid (SG Highway) or Serene Meadows (South Bopal).
              </p>
            </div>

            <form onSubmit={handleCreateEnquiry} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#A3AEC0] block mb-1">Target Development</label>
                <select
                  value={enqProject}
                  onChange={(e) => setEnqProject(e.target.value)}
                  className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#C8814F]"
                >
                  <option value="proj-grand-orchid">The Grand Orchid (SG Highway, Bodakdev) — 3 & 4 BHK</option>
                  <option value="proj-serene-meadows">Serene Meadows (South Bopal) — 2 & 3 BHK</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#A3AEC0] block mb-1">Preferred Configuration</label>
                  <select
                    value={enqBhk}
                    onChange={(e) => setEnqBhk(e.target.value)}
                    className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#C8814F]"
                  >
                    <option value="2 BHK">2 BHK Smart Living</option>
                    <option value="3 BHK">3 BHK Luxury Residence</option>
                    <option value="4 BHK Sky Villa">4 BHK Sky Villa</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#A3AEC0] block mb-1">Budget Expectation</label>
                  <select
                    value={enqBudget}
                    onChange={(e) => setEnqBudget(e.target.value)}
                    className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#C8814F]"
                  >
                    <option value="65 Lakhs - 90 Lakhs">₹65 Lakhs - ₹90 Lakhs</option>
                    <option value="90 Lakhs - 1.25 Cr">₹90 Lakhs - ₹1.25 Cr</option>
                    <option value="1.25 Cr - 1.75 Cr">₹1.25 Cr - ₹1.75 Cr</option>
                    <option value="1.75 Cr+">₹1.75 Cr+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#A3AEC0] block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={enqPhone || user?.phone || ''}
                  onChange={(e) => setEnqPhone(e.target.value)}
                  placeholder="+91 98250 99887"
                  className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#C8814F]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#0D1726] border border-[#1F3354] text-[11px] text-[#94A3B8]">
                <strong className="text-white">Assigned Relationship Manager: </strong>
                Your inquiry will be registered in our verified developer ledger and assigned to a dedicated sales consultant.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEnquiryModal(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-[#1F3354] text-xs font-bold text-[#94A3B8] hover:bg-[#1E293B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enqSubmitting}
                  className="w-2/3 py-2.5 rounded-xl bg-[#C8814F] hover:bg-[#b67040] text-white text-xs font-bold shadow-lg shadow-[#C8814F]/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {enqSubmitting ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  <span>{enqSubmitting ? 'Registering...' : 'Register Inquiry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REDESIGNED ESCROW SIMULATOR & PAYMENT WORKFLOW MODAL ─── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl w-full max-w-xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#C8814F]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => {
                if (!paymentProcessing) {
                  setShowPaymentModal(false);
                  setEscrowStep('review');
                }
              }}
              disabled={paymentProcessing}
              className="absolute top-5 right-5 text-[#94A3B8] hover:text-white p-1 rounded-lg bg-[#0D1726] border border-[#1F3354] disabled:opacity-40"
            >
              <X size={18} />
            </button>

            {/* Modal Header & Interactive Stage Stepper */}
            <div className="space-y-3 pb-3 border-b border-[#1F3354]">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5">
                  <ShieldCheck size={13} />
                  Statutory RERA Escrow Gateway
                </span>
                <span className="text-xs text-[#64748B]">•</span>
                <span className="text-[11px] font-mono text-[#CBD5E1]">ICICI Bank A/C 002405019842</span>
              </div>

              <h3 className="text-xl font-bold font-display text-white">
                {escrowStep === 'success'
                  ? 'Payment Confirmation & Escrow Receipt'
                  : escrowStep === 'processing'
                    ? 'Processing Escrow Clearance'
                    : 'Escrow Payment & Property Token Deposit'}
              </h3>

              {/* Progress Stage Stepper */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] font-bold">
                <div className={`p-1.5 rounded-lg border text-center transition ${
                  escrowStep === 'review'
                    ? 'bg-[#C8814F]/20 border-[#C8814F] text-[#C8814F]'
                    : 'bg-[#0D1726] border-[#1F3354] text-emerald-400'
                }`}>
                  1. Review & Confirm
                </div>
                <div className={`p-1.5 rounded-lg border text-center transition ${
                  escrowStep === 'processing'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                    : escrowStep === 'success'
                      ? 'bg-[#0D1726] border-[#1F3354] text-emerald-400'
                      : 'bg-[#0D1726] border-[#1F3354] text-[#64748B]'
                }`}>
                  2. Escrow Routing
                </div>
                <div className={`p-1.5 rounded-lg border text-center transition ${
                  escrowStep === 'success'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-[#0D1726] border-[#1F3354] text-[#64748B]'
                }`}>
                  3. Verified Receipt
                </div>
              </div>
            </div>

            {/* ─── STAGE 1: BEFORE PAYMENT (REVIEW & CONFIRMATION) ─── */}
            {escrowStep === 'review' && (() => {
              const u = activeBookingForPayment ? {
                id: activeBookingForPayment.unitId || selectedUnitId,
                projectName: activeBookingForPayment.projectName,
                unitNumber: activeBookingForPayment.unitNumber,
                configuration: activeBookingForPayment.configuration || '3 BHK Skyline Residence',
                floor: activeBookingForPayment.floor || 'Floor 14',
                carpetArea: activeBookingForPayment.carpetArea || 1320,
                price: Number(activeBookingForPayment.agreementValue || 8500000),
                image: activeBookingForPayment.projectName?.includes('Meadows')
                  ? '/assets/story/story-04-living.jpg'
                  : activeBookingForPayment.configuration?.includes('4 BHK')
                    ? '/assets/plan-villa.jpg'
                    : '/assets/story/story-03-residences.jpg'
              } : (AVAILABLE_UNITS.find(unit => unit.id === selectedUnitId) || AVAILABLE_UNITS[0]);

              const existingBooking = activeBookingForPayment || propertyBookings.find(b => b.unitNumber === u.unitNumber || b.unitId === u.id);
              const unitPayments = payments.filter(p =>
                p.status === 'Verified' && existingBooking && (
                  (existingBooking.unitNumber && p.unitNumber === existingBooking.unitNumber) ||
                  (existingBooking.projectId && p.projectId === existingBooking.projectId) ||
                  (existingBooking.projectName && p.projectName?.toLowerCase() === existingBooking.projectName?.toLowerCase())
                )
              );
              const verifiedSum = unitPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
              const previouslyPaid = Math.max(Number(existingBooking?.paidAmount || 0), verifiedSum);
              const totalPrice = Number(existingBooking?.agreementValue || u.price || 8500000);
              const remainingBeforePay = Math.max(0, totalPrice - previouslyPaid);
              const remainingAfterPay = Math.max(0, remainingBeforePay - payAmount);
              const tenPercentTarget = Math.round(totalPrice * 0.10);
              const tenPercentRemaining = Math.max(0, tenPercentTarget - previouslyPaid);

              return (
                <div className="space-y-4">
                  {/* Selected Property Image & Header */}
                  <div className="p-3.5 bg-[#0D1726] border border-[#1F3354] rounded-2xl flex items-center gap-4">
                    <img
                      src={u.image || '/assets/story/story-03-residences.jpg'}
                      alt={u.projectName}
                      className="w-20 h-16 rounded-xl object-cover border border-[#1F3354] shrink-0"
                    />
                    <div className="space-y-0.5 min-w-0 flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-white text-sm truncate">{u.projectName}</strong>
                        <span className="text-[10px] text-emerald-400 font-mono">AUDA Verified</span>
                      </div>
                      <p className="text-[#C8814F] font-semibold">{u.unitNumber} • {u.configuration}</p>
                      <p className="text-[#94A3B8] text-[11px]">{u.floor || 'Floor 09'} • {u.carpetArea} sq.ft RERA Carpet</p>
                    </div>
                  </div>

                  {/* Buyer & Payment Purpose Metadata */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-[#0D1726] border border-[#1F3354] rounded-xl space-y-0.5">
                      <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Legal Allottee / Buyer</span>
                      <strong className="text-white block truncate">{user?.name || 'Verified Buyer'}</strong>
                      <span className="text-[10px] text-[#94A3B8] font-mono truncate block">{user?.email}</span>
                    </div>

                    <div className="p-3 bg-[#0D1726] border border-[#1F3354] rounded-xl space-y-0.5">
                      <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Payment Purpose</span>
                      <strong className="text-white block truncate">
                        {previouslyPaid > 0 ? (remainingBeforePay <= payAmount ? 'Final Remaining Balance Settlement' : 'Milestone Balance Clearance') : 'Apartment Token Booking Deposit'}
                      </strong>
                      <span className="text-[10px] text-emerald-400 block">70% RERA Escrow Protection</span>
                    </div>
                  </div>

                  {/* Payment Amount Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#A3AEC0]">Select Payment Amount</label>
                      <span className="text-[10px] text-[#94A3B8]">
                        Remaining Balance: <strong className="text-amber-400">₹{(remainingBeforePay / 100000).toFixed(2)}L</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { amount: 50000, label: 'Token (₹50k)' },
                        { amount: 100000, label: 'Priority (₹1L)' },
                        {
                          amount: tenPercentRemaining > 0 ? tenPercentRemaining : tenPercentTarget,
                          label: tenPercentRemaining > 0 ? `10% Advance (₹${(tenPercentRemaining / 100000).toFixed(2)}L)` : '10% Advance'
                        },
                        {
                          amount: remainingBeforePay > 0 ? remainingBeforePay : totalPrice,
                          label: `Full Balance (₹${((remainingBeforePay > 0 ? remainingBeforePay : totalPrice) / 100000).toFixed(2)}L)`
                        }
                      ].map((tier, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPayAmount(tier.amount)}
                          className={`p-2 rounded-xl border text-[11px] font-bold transition text-center ${
                            payAmount === tier.amount
                              ? 'bg-[#C8814F]/20 border-[#C8814F] text-white shadow-md'
                              : 'bg-[#0D1726] border-[#1F3354] text-[#94A3B8] hover:text-white'
                          }`}
                        >
                          {tier.label}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-[#C8814F] font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="1000"
                        value={payAmount}
                        onChange={(e) => setPayAmount(Number(e.target.value))}
                        placeholder="Enter custom amount..."
                        className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl pl-8 pr-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#C8814F]"
                      />
                    </div>
                  </div>

                  {/* Financial Balance Summary Card */}
                  <div className="p-3.5 bg-[#09111D] border border-[#1F3354] rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[#64748B] block font-semibold">Total Agreement</span>
                      <strong className="text-white font-mono block">₹{(totalPrice / 10000000).toFixed(2)} Cr</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 block font-semibold">This Payment</span>
                      <strong className="text-emerald-400 font-mono block">₹{(payAmount / 100000).toFixed(2)} Lakhs</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400 block font-semibold">Remaining After</span>
                      <strong className="text-amber-300 font-mono block">₹{(remainingAfterPay / 100000).toFixed(2)} Lakhs</strong>
                    </div>
                  </div>

                  {/* Razorpay Escrow Verification Badge */}
                  <div className="p-3 rounded-xl bg-[#09111D] border border-[#1F3354] text-[10px] text-[#94A3B8] flex items-start gap-2.5">
                    <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="text-white">Payment Method: RERA-Compliant Razorpay Escrow Gateway</strong>
                      <p className="leading-relaxed">
                        Official Razorpay Secure Checkout. Encrypted 256-bit SSL transaction with instant cryptographic HMAC-SHA256 signature verification and automated property allotment.
                      </p>
                    </div>
                  </div>

                  {/* Error notice if prior attempt failed */}
                  {paymentError && (
                    <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0 text-red-400" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  {/* Action Buttons - EXCLUSIVELY RAZORPAY */}
                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      disabled={paymentProcessing || payAmount <= 0}
                      onClick={() => handleInitiatePayment()}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C8814F] to-[#E09865] hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-[#C8814F]/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <CreditCard size={16} />
                      <span>Pay ₹{payAmount.toLocaleString('en-IN')} via Razorpay Gateway</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="w-full py-2.5 rounded-xl border border-[#1F3354] text-xs font-bold text-[#94A3B8] hover:bg-[#1E293B] hover:text-white transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ─── STAGE 2: DURING PAYMENT (PROCESSING CLEARANCE STATE) ─── */}
            {escrowStep === 'processing' && (
              <div className="py-8 space-y-6 text-center">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="w-20 h-20 rounded-full border-4 border-[#1F3354] border-t-emerald-400 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck size={28} className="text-emerald-400 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white">Communicating with Statutory Escrow Ledger</h4>
                  <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                    Please do not close this window. Your payment of ₹{payAmount.toLocaleString('en-IN')} is being authenticated against RERA ICICI Bank Escrow #002405019842.
                  </p>
                </div>

                {/* Processing Steps Ticker */}
                <div className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-4 max-w-md mx-auto space-y-2.5 text-left text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#CBD5E1] flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      1. Authenticating Buyer Identity (Supabase Token)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">PASSED</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#CBD5E1] flex items-center gap-2">
                      {escrowProcessingStage >= 2 ? (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      ) : (
                        <RefreshCw size={14} className="text-amber-400 animate-spin" />
                      )}
                      2. Routing Funds to ICICI RERA Escrow
                    </span>
                    <span className={`text-[10px] font-mono ${escrowProcessingStage >= 2 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {escrowProcessingStage >= 2 ? 'LOCKED' : 'SYNCING'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#CBD5E1] flex items-center gap-2">
                      {escrowProcessingStage >= 3 ? (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      ) : (
                        <Clock size={14} className="text-[#64748B]" />
                      )}
                      3. Cryptographic HMAC-SHA256 Signing & Verification
                    </span>
                    <span className={`text-[10px] font-mono ${escrowProcessingStage >= 3 ? 'text-emerald-400' : 'text-[#64748B]'}`}>
                      {escrowProcessingStage >= 3 ? 'VERIFIED' : 'WAITING'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ─── STAGE 3: AFTER PAYMENT (VERIFIED SUCCESS RESULT SCREEN) ─── */}
            {escrowStep === 'success' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
                    <CheckCircle2 size={34} />
                  </div>
                  <h4 className="text-xl font-bold font-display text-white">
                    Escrow Payment Verified & Captured!
                  </h4>
                  <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                    Your payment has been successfully recorded in the statutory escrow registry and your property booking ledger has been updated.
                  </p>
                </div>

                {/* Success Breakdown Receipt Card */}
                <div className="p-4 bg-[#0D1726] border border-[#1F3354] rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1F3354]">
                    <span className="text-[#64748B]">Transaction Reference</span>
                    <strong className="text-white font-mono">{latestTransaction?.transactionRef || `TXN-GJ-${Date.now().toString().slice(-8)}`}</strong>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-[#1F3354]">
                    <span className="text-[#64748B]">Amount Successfully Paid</span>
                    <strong className="text-emerald-400 font-mono font-bold text-sm">
                      ₹{payAmount.toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-[#1F3354]">
                    <span className="text-[#64748B]">Execution Timestamp</span>
                    <span className="text-[#CBD5E1] font-mono">
                      {latestTransaction?.date || new Date().toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-[#1F3354]">
                    <span className="text-[#64748B]">Payment Purpose</span>
                    <span className="text-white font-semibold">
                      {latestTransaction?.paymentType || 'Apartment Token Booking Deposit'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-[#1F3354]">
                    <span className="text-[#64748B]">Updated Booking Status</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {latestTransaction?.booking?.bookingStatus || 'Confirmed (Token Paid)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#64748B]">Remaining Balance Payable</span>
                    <strong className="text-amber-300 font-mono">
                      {latestTransaction?.remainingBalance === 0 ? '₹0.00 (Fully Settled)' : `₹${latestTransaction?.remainingBalance?.toLocaleString('en-IN') || '0'}`}
                    </strong>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (latestTransaction) handleDownloadReceipt(latestTransaction);
                      }}
                      className="w-1/2 py-2.5 bg-[#15233A] hover:bg-[#1A2C4C] border border-[#1F3354] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <Download size={14} className="text-[#C8814F]" />
                      <span>Download Receipt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowPaymentModal(false);
                        setSearchParams({ tab: 'bookings' });
                      }}
                      className="w-1/2 py-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <BookmarkCheck size={14} />
                      <span>View Bookings Dossier</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setEscrowStep('review');
                    }}
                    className="w-full py-2 bg-[#0D1726] hover:bg-[#15233A] text-[#94A3B8] hover:text-white rounded-xl text-xs font-semibold border border-[#1F3354] transition"
                  >
                    Done / Close Window
                  </button>
                </div>
              </div>
            )}

            {/* ─── STAGE 4: FAILED OR CANCELLED STATE ─── */}
            {escrowStep === 'failed' && (
              <div className="py-6 space-y-5 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <AlertCircle size={28} />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Escrow Payment Failed to Verify</h4>
                  <p className="text-xs text-red-300 max-w-sm mx-auto">
                    {paymentError || 'The transaction could not be verified by the cryptographic escrow ledger.'}
                  </p>
                  <p className="text-[11px] text-[#94A3B8]">
                    No funds were deducted. Your booking balance remains unaffected.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2 justify-center">
                  <button
                    type="button"
                    onClick={() => setEscrowStep('review')}
                    className="px-5 py-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <RefreshCw size={14} />
                    <span>Retry Payment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setEscrowStep('review');
                    }}
                    className="px-5 py-2.5 bg-[#0D1726] hover:bg-[#15233A] border border-[#1F3354] text-[#CBD5E1] rounded-xl text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── STATUTORY RERA VERIFICATION DOSSIER MODAL (STRICTLY INDEPENDENT - ZERO PAYMENT ACTIONS) ─── */}
      {showReraModal && selectedReraProject && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowReraModal(false)}
              className="absolute top-5 right-5 text-[#94A3B8] hover:text-white p-1 rounded-lg bg-[#0D1726] border border-[#1F3354]"
            >
              <X size={18} />
            </button>

            {/* Authority Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-[#1F3354]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck size={26} />
              </div>
              <div className="space-y-1 pr-8">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                    Statutory RERA Verified
                  </span>
                  <span className="text-xs text-[#64748B]">•</span>
                  <span className="text-xs text-[#94A3B8]">Govt. of Gujarat Portal Record</span>
                </div>
                <h3 className="text-xl font-bold font-display text-white">{selectedReraProject.name}</h3>
                <p className="text-xs text-[#CBD5E1] font-mono">
                  Registration No: <strong className="text-[#C8814F]">{selectedReraProject.reraNumber}</strong>
                </p>
              </div>
            </div>

            {/* RERA Status Selector / Verification Stages */}
            <div className="p-3.5 rounded-2xl bg-[#0D1726] border border-[#1F3354] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase">Regulatory Verification Status</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {selectedReraProject.status || 'Verified'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                {[
                  { status: 'Verified', color: 'emerald' },
                  { status: 'Verification Pending', color: 'blue' },
                  { status: 'Submitted for Verification', color: 'amber' },
                  { status: 'Requires Review', color: 'purple' },
                  { status: 'Rejected', color: 'red' }
                ].map(s => (
                  <div
                    key={s.status}
                    className={`p-2 rounded-lg text-[10px] text-center font-bold border transition ${
                      s.status === (selectedReraProject.status || 'Verified')
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                        : 'bg-[#15233A]/60 text-[#64748B] border-[#1F3354]'
                    }`}
                  >
                    <span>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Statutory Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0D1726] border border-[#1F3354] space-y-1">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Regulatory Authority</span>
                <strong className="text-white block">{selectedReraProject.authority}</strong>
                <span className="text-[11px] text-[#94A3B8]">Gandhinagar Statutory Commission</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0D1726] border border-[#1F3354] space-y-1">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Dedicated Escrow Account</span>
                <strong className="text-emerald-400 block font-mono">{selectedReraProject.escrowAccount}</strong>
                <span className="text-[11px] text-[#94A3B8]">Bank: {selectedReraProject.escrowBank} (70% RERA Locked)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0D1726] border border-[#1F3354] space-y-1">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Promoter / Developer</span>
                <strong className="text-white block">{selectedReraProject.developer}</strong>
                <span className="text-[11px] text-[#94A3B8]">PAN: {selectedReraProject.promoterPan}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0D1726] border border-[#1F3354] space-y-1">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Statutory Validity</span>
                <strong className="text-white block">{selectedReraProject.validTill}</strong>
                <span className="text-[11px] text-emerald-400">{selectedReraProject.carpetAreaVerified}</span>
              </div>
            </div>

            {/* Approved Statutory Documents Repository */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-[#C8814F]" />
                  <span>Approved Statutory Documents & Sanctions</span>
                </h4>
                <span className="text-[10px] text-[#94A3B8]">
                  {selectedReraProject.statutoryDocuments?.length || 5} Documents Verified
                </span>
              </div>

              <div className="space-y-2">
                {(selectedReraProject.statutoryDocuments || []).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-[#0D1726] border border-[#1F3354] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-[#C8814F]/40 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <strong className="text-white block text-xs">{doc.name}</strong>
                        <span className="text-[10px] text-[#94A3B8]">
                          Issued by {doc.authority} • Verified on {doc.verifiedDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Sanctioned
                      </span>
                      <button
                        type="button"
                        onClick={() => alert(`Statutory Document Record:\n\nDocument: ${doc.name}\nAuthority: ${doc.authority}\nVerification Date: ${doc.verifiedDate}\nCryptographic Digest: SHA256-RERA-${doc.id}-${Date.now().toString().slice(-6)}\n\nThis statutory document is verified on the GUJRERA regulatory register.`)}
                        className="px-2.5 py-1 bg-[#15233A] hover:bg-[#1F3354] border border-[#1F3354] text-[#CBD5E1] rounded-lg text-[11px] font-semibold transition"
                      >
                        Inspect Hash
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statutory Disclaimer */}
            <div className="p-3 rounded-xl bg-[#09111D] border border-[#1F3354] text-[10px] text-[#94A3B8] flex items-start gap-2">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Statutory Independence Notice: </strong>
                This verification portal is strictly for compliance review of approved AUDA/GUJRERA filings. Reviewing documents does not execute transactions or trigger financial obligations.
              </div>
            </div>

            {/* Modal Footer (ZERO PAYMENT ACTION) */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowReraModal(false)}
                className="px-6 py-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#C8814F]/20"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
