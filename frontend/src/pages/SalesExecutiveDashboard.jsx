import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  LayoutDashboard, Users, UserCheck, BotMessageSquare, CalendarCheck,
  MessageSquare, Clock, ArrowRight, CheckCircle2,
  AlertCircle, ShieldCheck, Zap, Sparkles, Filter, Search, Plus,
  ChevronRight, ExternalLink, Video, Check, Award, AlertTriangle, User,
  X, MessageCircle, Calendar, RefreshCw
} from 'lucide-react';
import WhatsAppChatModal from '../components/common/WhatsAppChatModal';
import InAppChatModal from '../components/common/InAppChatModal';

export const SalesExecutiveDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Live state from backend
  const [leads, setLeads] = useState([]);
  const [handoffs, setHandoffs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [followUpStats, setFollowUpStats] = useState(null);
  const [buyers, setBuyers] = useState([]);

  // Filter & Search states
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('All');
  const [fuCategoryFilter, setFuCategoryFilter] = useState('All');
  const [fuPriorityFilter, setFuPriorityFilter] = useState('All');

  // Lead detail drawer state
  const [selectedLead, setSelectedLead] = useState(null);
  const [fullLeadData, setFullLeadData] = useState(null);
  const [leadDetailLoading, setLeadDetailLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // Communication Modals State
  const [activeCommLead, setActiveCommLead] = useState(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isInAppChatOpen, setIsInAppChatOpen] = useState(false);

  // Follow-up Actions State
  const [showCreateFuModal, setShowCreateFuModal] = useState(false);
  const [newFuLeadId, setNewFuLeadId] = useState('');
  const [newFuTitle, setNewFuTitle] = useState('');
  const [newFuDate, setNewFuDate] = useState('');
  const [newFuPriority, setNewFuPriority] = useState('HIGH');
  const [newFuNotes, setNewFuNotes] = useState('');
  const [fuSubmitting, setFuSubmitting] = useState(false);

  // Follow-up Complete / Reschedule Modal
  const [completingFu, setCompletingFu] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [reschedulingFu, setReschedulingFu] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  const fetchExecutiveData = async () => {
    setLoading(true);
    setError('');
    try {
      const results = await Promise.allSettled([
        api.get('/leads?limit=100'),
        api.get('/ai/conversations'),
        api.get('/slots/bookings'),
        api.get('/follow-ups'),
        api.get('/follow-ups/stats'),
        api.get('/users/buyers')
      ]);

      const [leadRes, convRes, bookRes, fuRes, fuStatsRes, buyersRes] = results;

      if (leadRes.status === 'fulfilled' && leadRes.value?.data?.success) {
        setLeads(leadRes.value.data.leads || []);
      }
      if (convRes.status === 'fulfilled' && convRes.value?.data?.success) {
        const convList = convRes.value.data.conversations || [];
        setConversations(convList);
        setHandoffs(convList.filter(c => c.handedOff || c.requiresHuman) || []);
      }
      if (bookRes.status === 'fulfilled' && bookRes.value?.data?.success) {
        setBookings(bookRes.value.data.bookings || []);
      }
      if (fuRes.status === 'fulfilled' && fuRes.value?.data?.success) {
        setFollowUps(fuRes.value.data.followUps || []);
      }
      if (fuStatsRes.status === 'fulfilled' && fuStatsRes.value?.data?.success) {
        setFollowUpStats(fuStatsRes.value.data.stats || null);
      }
      if (buyersRes.status === 'fulfilled' && buyersRes.value?.data?.success) {
        setBuyers(buyersRes.value.data.buyers || []);
      }

    } catch (err) {
      console.error('Error fetching executive dashboard:', err);
      setError('Failed to synchronize assigned pipeline. Please check network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutiveData();
  }, [user]);

  // Handle Video Tour Consultation via Jitsi Meet
  const handleStartVideoCall = async (lead) => {
    try {
      const res = await api.post('/calls/create', {
        leadId: lead.id,
        callType: 'video',
        notes: `Video tour consultation initiated by ${user?.name || 'Pooja Sharma'}`
      });
      if (res.data.success) {
        window.open(res.data.joinUrls?.executive || `/call/${res.data.callSession.invitationToken}?role=executive`, '_blank');
      }
    } catch {
      window.open(`/call/inv_demo_${Date.now()}?role=executive`, '_blank');
    }
  };

  // Handle Quick Status Update
  const handleUpdateStatus = async (leadId, newStatus) => {
    setStatusUpdating(true);
    try {
      try {
        await api.patch(`/leads/${leadId}`, { status: newStatus });
      } catch (patchErr) {
        // Fallback to PUT if PATCH not available
        await api.put(`/leads/${leadId}`, { status: newStatus });
      }
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(prev => ({ ...prev, status: newStatus }));
      }
      if (fullLeadData && fullLeadData.id === leadId) {
        setFullLeadData(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update lead status');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Open Lead Details Drawer & Fetch Deep Data
  const handleOpenLeadDetails = async (lead) => {
    setSelectedLead(lead);
    setFullLeadData(null);
    setLeadDetailLoading(true);
    try {
      const res = await api.get(`/leads/${lead.id}`);
      if (res.data?.success) {
        setFullLeadData(res.data.lead);
      }
    } catch (err) {
      console.warn('Could not load deep lead relations:', err);
    } finally {
      setLeadDetailLoading(false);
    }
  };

  // Add Internal Activity Note
  const handleSaveNote = async () => {
    if (!followUpNote.trim() || !selectedLead) return;
    setNoteSaving(true);
    try {
      const res = await api.post(`/leads/${selectedLead.id}/notes`, {
        content: followUpNote.trim()
      });
      if (res.data?.success) {
        setFollowUpNote('');
        handleOpenLeadDetails(selectedLead);
        await fetchExecutiveData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record activity note');
    } finally {
      setNoteSaving(false);
    }
  };

  // Create New Follow-up
  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    if (!newFuLeadId || !newFuTitle || !newFuDate) return;
    setFuSubmitting(true);
    try {
      const res = await api.post('/follow-ups', {
        leadId: newFuLeadId,
        title: newFuTitle,
        dueDate: new Date(newFuDate).toISOString(),
        priority: newFuPriority,
        notes: newFuNotes
      });
      if (res.data?.success) {
        setShowCreateFuModal(false);
        setNewFuTitle('');
        setNewFuDate('');
        setNewFuNotes('');
        await fetchExecutiveData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to schedule follow-up');
    } finally {
      setFuSubmitting(false);
    }
  };

  // Complete Follow-up
  const handleCompleteFollowUp = async () => {
    if (!completingFu) return;
    try {
      const res = await api.patch(`/follow-ups/${completingFu.id}`, {
        status: 'COMPLETED',
        completionNotes: completionNotes || 'Follow-up successfully resolved by executive.'
      });
      if (res.data?.success) {
        setCompletingFu(null);
        setCompletionNotes('');
        await fetchExecutiveData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to complete follow-up');
    }
  };

  // Reschedule Follow-up
  const handleRescheduleFollowUp = async () => {
    if (!reschedulingFu || !rescheduleDate) return;
    try {
      const res = await api.patch(`/follow-ups/${reschedulingFu.id}`, {
        dueDate: new Date(rescheduleDate).toISOString()
      });
      if (res.data?.success) {
        setReschedulingFu(null);
        setRescheduleDate('');
        await fetchExecutiveData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reschedule follow-up');
    }
  };

  // Mark Site Visit Completed
  const handleMarkVisitCompleted = async (bookingId) => {
    try {
      await api.patch(`/slots/bookings/${bookingId}`, { status: 'Completed' });
      await fetchExecutiveData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark visit completed');
    }
  };

  // Filtered leads
  const filteredLeads = leads.filter(l => {
    const matchesSearch = !leadSearch ||
      l.fullName?.toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.phone?.includes(leadSearch) ||
      l.project?.name?.toLowerCase().includes(leadSearch.toLowerCase());
    const matchesStatus = leadStatusFilter === 'All' || l.status === leadStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered follow-ups
  const filteredFollowUps = followUps.filter(f => {
    const matchesCat = fuCategoryFilter === 'All' || f.displayStatus === fuCategoryFilter || f.status === fuCategoryFilter;
    const matchesPri = fuPriorityFilter === 'All' || f.priority === fuPriorityFilter;
    return matchesCat && matchesPri;
  });

  // Calculate Metrics from Live Backend Data
  const myAssignedCount = leads.length;
  const newLeadsCount = leads.filter(l => l.status === 'New').length;
  const contactedCount = leads.filter(l => l.status === 'Contacted').length;
  const qualifiedCount = leads.filter(l => l.isQualified || l.status === 'Qualified').length;
  const upcomingVisits = bookings.filter(b => b.status === 'Confirmed').length;
  const completedVisits = bookings.filter(b => b.status === 'Completed').length;
  const activeFollowupsCount = followUps.filter(f => f.status === 'PENDING').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C8814F] to-[#15233A] flex items-center justify-center animate-spin">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <p className="text-xs text-[#94A3B8] font-semibold tracking-wider uppercase">
          Loading Assigned Pipeline...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-[#F3EFE8]">
      {/* ─── SALES EXECUTIVE HEADER ─── */}
      <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C8814F]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase tracking-widest flex items-center gap-1.5">
                <UserCheck size={13} />
                Sales Executive Workstation
              </span>
              <span className="text-xs text-[#64748B]">•</span>
              <span className="text-xs text-[#CBD5E1] font-semibold">{user?.name || 'Pooja Sharma (Senior Executive)'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              Assigned Workstation & Lead Pipeline
            </h1>
            <p className="text-xs text-[#94A3B8] max-w-xl leading-relaxed">
              Managing high-intent homebuyers inquiring on SG Highway and South Bopal residential developments. Respond promptly to AI handoffs and track booked walkthroughs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setSearchParams({ tab: 'ai-handoffs' })}
              className="px-4 py-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <Zap size={15} />
              <span>AI Handoffs ({handoffs.length})</span>
            </button>
            <button
              onClick={() => {
                if (leads.length > 0) setNewFuLeadId(leads[0].id);
                setShowCreateFuModal(true);
              }}
              className="px-4 py-2.5 bg-[#0D1726] hover:bg-[#1f3354] text-[#F3EFE8] border border-[#1F3354] rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <Plus size={15} className="text-[#C8814F]" />
              <span>+ Schedule Follow-up</span>
            </button>
          </div>
        </div>

        {/* Executive Sub-navigation tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 mt-6 border-t border-[#1F3354]/60 no-scrollbar">
          {[
            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'leads', label: `My Assigned Leads (${leads.length})`, icon: Users },
            { id: 'buyers', label: `My Buyers (${buyers.length})`, icon: UserCheck },
            { id: 'ai-handoffs', label: `AI Handoffs (${handoffs.length})`, icon: Zap },
            { id: 'follow-ups', label: `Follow-ups (${activeFollowupsCount})`, icon: Clock },
            { id: 'site-visits', label: `Site Visits (${bookings.length})`, icon: CalendarCheck },
            { id: 'conversations', label: 'In-App Chat', icon: MessageSquare },
            { id: 'performance', label: 'My Performance', icon: Award },
            { id: 'profile', label: 'Profile', icon: User }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  active
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

      {/* ─── TAB 1: EXECUTIVE KPI OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* 8 KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#15233A] border border-[#1F3354] p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase">My Assigned Leads</span>
              <p className="text-2xl font-bold font-display text-white mt-1">{myAssignedCount}</p>
              <p className="text-[10px] text-blue-400 mt-1">Exclusive to your queue</p>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase">New Enquiries</span>
              <p className="text-2xl font-bold font-display text-amber-400 mt-1">{newLeadsCount}</p>
              <p className="text-[10px] text-[#CBD5E1] mt-1">Require first contact</p>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Contacted</span>
              <p className="text-2xl font-bold font-display text-emerald-400 mt-1">{contactedCount}</p>
              <p className="text-[10px] text-emerald-300 mt-1">Engaged with buyer</p>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Qualified High-Intent</span>
              <p className="text-2xl font-bold font-display text-purple-400 mt-1">{qualifiedCount}</p>
              <p className="text-[10px] text-purple-300 mt-1">Budget & BHK match</p>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Upcoming Site Visits</span>
              <p className="text-2xl font-bold font-display text-[#C8814F] mt-1">{upcomingVisits}</p>
              <p className="text-[10px] text-[#C8814F] mt-1">Confirmed bookings</p>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Completed Visits</span>
              <p className="text-2xl font-bold font-display text-teal-400 mt-1">{completedVisits}</p>
              <p className="text-[10px] text-teal-300 mt-1">On-site attendance</p>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Today's Follow-ups</span>
              <p className="text-2xl font-bold font-display text-amber-400 mt-1">{followUpStats?.today || 0}</p>
              <p className="text-[10px] text-amber-300 mt-1">Scheduled for today</p>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase">AI Urgent Handoffs</span>
              <p className="text-2xl font-bold font-display text-rose-400 mt-1">{handoffs.length}</p>
              <p className="text-[10px] text-rose-300 mt-1">Buyer waiting for advisor</p>
            </div>
          </div>

          {/* Quick Queue Priority Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Urgent AI Handoffs Card */}
            <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                    <Zap size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">AI Handoffs Requiring Immediate Response</h3>
                    <p className="text-[11px] text-[#94A3B8]">Buyers flagged for human consultation</p>
                  </div>
                </div>
                <button
                  onClick={() => setSearchParams({ tab: 'ai-handoffs' })}
                  className="text-xs text-[#C8814F] font-bold hover:underline"
                >
                  View All ({handoffs.length})
                </button>
              </div>

              {handoffs.length === 0 ? (
                <div className="p-8 text-center text-[#64748B] text-xs">
                  Zero pending AI handoffs. All high-intent buyers have been attended.
                </div>
              ) : (
                <div className="space-y-3">
                  {handoffs.slice(0, 3).map(h => (
                    <div key={h.id} className="p-4 bg-[#0D1726] border border-[#1F3354] rounded-2xl flex items-center justify-between gap-4">
                      <div>
                        <strong className="text-white text-xs block">{h.lead?.fullName || h.userName || 'Prospective Buyer'}</strong>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">{h.summary || 'Requested human consultation'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveCommLead(h.lead || { fullName: h.userName, phone: h.userPhone });
                            setIsWhatsAppOpen(true);
                          }}
                          className="px-3 py-1.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <MessageCircle size={13} />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={() => handleStartVideoCall(h.lead || { id: 'temp' })}
                          className="px-3 py-1.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <Video size={13} />
                          <span>Video Tour</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Today's Follow-up Tasks */}
            <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Today's Scheduled Follow-ups</h3>
                    <p className="text-[11px] text-[#94A3B8]">Buyer calls and discussions due today</p>
                  </div>
                </div>
                <button
                  onClick={() => setSearchParams({ tab: 'follow-ups' })}
                  className="text-xs text-[#C8814F] font-bold hover:underline"
                >
                  View All ({followUps.length})
                </button>
              </div>

              {followUps.filter(f => f.displayStatus === 'TODAY' || f.status === 'PENDING').length === 0 ? (
                <div className="p-8 text-center text-[#64748B] text-xs">
                  No pending follow-ups due today. You are fully up to date!
                </div>
              ) : (
                <div className="space-y-3">
                  {followUps.filter(f => f.displayStatus === 'TODAY' || f.status === 'PENDING').slice(0, 3).map(f => (
                    <div key={f.id} className="p-4 bg-[#0D1726] border border-[#1F3354] rounded-2xl flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-xs">{f.title}</strong>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            {f.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">Buyer: {f.lead?.fullName || f.buyerName || 'Valued Client'}</p>
                      </div>
                      <button
                        onClick={() => setCompletingFu(f)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Check size={12} />
                        <span>Complete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: MY ASSIGNED LEADS ─── */}
      {activeTab === 'leads' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold text-white">My Exclusive Leads Queue</h2>
              <p className="text-xs text-[#94A3B8]">
                Leads assigned exclusively to your executive profile with full conversation history and interaction logs.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={14} className="text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search buyer, phone, project..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="bg-[#0D1726] border border-[#1F3354] rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-[#64748B] focus:outline-none w-56"
                />
              </div>

              <select
                value={leadStatusFilter}
                onChange={(e) => setLeadStatusFilter(e.target.value)}
                className="bg-[#0D1726] border border-[#1F3354] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Visit Scheduled">Visit Scheduled</option>
                <option value="Visited">Visited</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>

          {/* Lead Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1726] text-[#94A3B8] uppercase text-[10px] tracking-wider border-b border-[#1F3354]">
                <tr>
                  <th className="p-4">Buyer Name</th>
                  <th className="p-4">Project & BHK</th>
                  <th className="p-4">Budget Range</th>
                  <th className="p-4">Lead Status</th>
                  <th className="p-4">Source</th>
                  <th className="p-4 text-right">Quick Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F3354]/60">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#0D1726]/60 transition-colors">
                    <td className="p-4 font-bold text-white">
                      <button
                        onClick={() => handleOpenLeadDetails(lead)}
                        className="hover:text-[#C8814F] transition text-left flex items-center gap-1.5"
                      >
                        <span>{lead.fullName}</span>
                        <ChevronRight size={13} className="text-[#C8814F]" />
                      </button>
                      <span className="text-[11px] text-[#94A3B8] font-normal block font-mono">{lead.phone}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-white">{lead.project?.name || 'The Grand Orchid'}</span>
                      <span className="text-[11px] text-[#94A3B8] block">{lead.preferredBhk || '3 BHK'}</span>
                    </td>
                    <td className="p-4 font-mono font-semibold text-[#CBD5E1]">
                      {lead.budgetMin && lead.budgetMax
                        ? `₹${(lead.budgetMin / 10000000).toFixed(2)} Cr – ₹${(lead.budgetMax / 10000000).toFixed(2)} Cr`
                        : '₹1.35 Cr – ₹2.45 Cr'}
                    </td>
                    <td className="p-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                        className="bg-[#0D1726] border border-[#1F3354] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Visit Scheduled">Visit Scheduled</option>
                        <option value="Visited">Visited</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Converted">Converted</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </td>
                    <td className="p-4 text-[#94A3B8]">
                      <span className="px-2 py-0.5 rounded bg-[#0D1726] border border-[#1F3354] text-[10px]">
                        {lead.source}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setActiveCommLead(lead);
                            setIsWhatsAppOpen(true);
                          }}
                          title="WhatsApp Click-to-Chat"
                          className="p-2 bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-white rounded-lg border border-[#25D366]/30 transition-all"
                        >
                          <MessageCircle size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setActiveCommLead(lead);
                            setIsInAppChatOpen(true);
                          }}
                          title="In-App Real-time Chat"
                          className="p-2 bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg border border-blue-500/30 transition-all"
                        >
                          <MessageSquare size={14} />
                        </button>
                        <button
                          onClick={() => handleStartVideoCall(lead)}
                          title="Video Consultation (Jitsi Meet)"
                          className="p-2 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white rounded-lg border border-purple-500/30 transition-all"
                        >
                          <Video size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: MY BUYERS ─── */}
      {activeTab === 'buyers' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-display font-bold text-white">Registered Homebuyers In Your Portfolio</h2>
            <p className="text-xs text-[#94A3B8]">
              Homebuyers registered on PropAssist who are assigned to your residential projects.
            </p>
          </div>

          {buyers.length === 0 ? (
            <div className="p-12 text-center bg-[#0D1726] rounded-2xl border border-[#1F3354] space-y-2">
              <UserCheck className="w-10 h-10 text-[#C8814F] mx-auto opacity-60" />
              <h3 className="text-base font-bold text-white">No Registered Buyers Yet</h3>
              <p className="text-xs text-[#94A3B8]">
                Buyers register dynamically when reserving site visits or requesting project details.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {buyers.map(buyer => (
                <div key={buyer.id} className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-5 space-y-3 relative hover:border-[#C8814F]/40 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white">{buyer.name}</h4>
                      <p className="text-xs text-[#94A3B8] font-mono">{buyer.email}</p>
                      <p className="text-xs text-emerald-400 font-mono mt-0.5">{buyer.phone || 'No phone recorded'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Verified Buyer
                    </span>
                  </div>

                  <div className="p-3 bg-[#15233A] rounded-xl border border-[#1F3354] grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Enquiries</span>
                      <strong className="text-white font-mono">{buyer.enquiries?.length || 0}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Site Visits</span>
                      <strong className="text-[#C8814F] font-mono">{buyer.siteVisits?.length || 0}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Advance</span>
                      <strong className="text-emerald-400 font-mono">₹{((buyer.totalPaid || 0) / 100000).toFixed(1)}L</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1F3354] flex items-center justify-between text-xs text-[#94A3B8]">
                    <span>Joined: {new Date(buyer.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => {
                        setActiveCommLead({ fullName: buyer.name, phone: buyer.phone, email: buyer.email });
                        setIsWhatsAppOpen(true);
                      }}
                      className="px-3 py-1 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: AI HANDOFFS ─── */}
      {activeTab === 'ai-handoffs' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Zap className="text-[#C8814F]" />
              <span>AI Lead Handoffs & Urgent Consultations</span>
            </h2>
            <p className="text-xs text-[#94A3B8]">
              High-intent homebuyers requesting a dedicated human salesperson. All chat queries and budget qualifiers are attached.
            </p>
          </div>

          {handoffs.length === 0 ? (
            <div className="p-12 text-center bg-[#0D1726] rounded-2xl border border-[#1F3354] space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-60" />
              <h3 className="text-base font-bold text-white">All Handoffs Completed</h3>
              <p className="text-xs text-[#94A3B8]">
                Great job! There are currently no unaddressed AI handoff requests in your assigned queue.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {handoffs.map((h) => (
                <div key={h.id} className="p-5 bg-[#0D1726] border border-[#1F3354] rounded-2xl flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                        Urgent Human Request
                      </span>
                      <strong className="text-sm font-bold text-white">{h.lead?.fullName || h.userName || 'Prospective Buyer'}</strong>
                    </div>
                    <p className="text-xs text-[#CBD5E1] max-w-2xl">{h.summary || 'Buyer asked for bespoke floor plans and customized payment terms from on-duty executive.'}</p>
                    <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                      <span>Project: {h.lead?.project?.name || 'The Grand Orchid'}</span>
                      <span>•</span>
                      <span>Handoff Time: {new Date(h.updatedAt || h.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => {
                        setActiveCommLead(h.lead || { fullName: h.userName, phone: h.userPhone });
                        setIsWhatsAppOpen(true);
                      }}
                      className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
                    >
                      <MessageCircle size={14} />
                      <span>WhatsApp Buyer</span>
                    </button>
                    <button
                      onClick={() => handleStartVideoCall(h.lead || { id: 'temp' })}
                      className="px-4 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
                    >
                      <Video size={14} />
                      <span>Launch Video Tour</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: FOLLOW-UP MANAGEMENT (COMPLETE DATABASE INTEGRATION) ─── */}
      {activeTab === 'follow-ups' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-display font-bold text-white">Assigned Follow-up Tasks</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C8814F]/20 text-[#C8814F] border border-[#C8814F]/40 font-mono">
                  Relative Date Schedules
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Database-persisted follow-up schedules with automated due date categorization and status updates.
              </p>
            </div>

            <button
              onClick={() => {
                if (leads.length > 0) setNewFuLeadId(leads[0].id);
                setShowCreateFuModal(true);
              }}
              className="px-4 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>+ Schedule Follow-up</span>
            </button>
          </div>

          {/* 4 Counter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0D1726] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase block">Today's Tasks</span>
              <p className="text-2xl font-bold font-display text-amber-400 mt-1">{followUpStats?.today || 0}</p>
              <span className="text-[10px] text-amber-300">Action required today</span>
            </div>

            <div className="bg-[#0D1726] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase block">Upcoming</span>
              <p className="text-2xl font-bold font-display text-blue-400 mt-1">{followUpStats?.upcoming || 0}</p>
              <span className="text-[10px] text-blue-300">Next 7 days</span>
            </div>

            <div className="bg-[#0D1726] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase block">Overdue</span>
              <p className="text-2xl font-bold font-display text-rose-400 mt-1">{followUpStats?.overdue || 0}</p>
              <span className="text-[10px] text-rose-300">Requires triage</span>
            </div>

            <div className="bg-[#0D1726] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase block">Completed</span>
              <p className="text-2xl font-bold font-display text-emerald-400 mt-1">{followUpStats?.completed || 0}</p>
              <span className="text-[10px] text-emerald-300">Resolved tasks</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              {['All', 'TODAY', 'UPCOMING', 'OVERDUE', 'COMPLETED', 'CANCELLED'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFuCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    fuCategoryFilter === cat
                      ? 'bg-[#C8814F] text-white shadow'
                      : 'bg-[#0D1726] text-[#94A3B8] hover:text-white border border-[#1F3354]'
                  }`}
                >
                  {cat === 'All' ? 'All Follow-ups' : cat}
                </button>
              ))}
            </div>

            <select
              value={fuPriorityFilter}
              onChange={(e) => setFuPriorityFilter(e.target.value)}
              className="bg-[#0D1726] border border-[#1F3354] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="URGENT">URGENT</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* Follow-up Cards Grid */}
          {filteredFollowUps.length === 0 ? (
            <div className="p-12 text-center bg-[#0D1726] rounded-2xl border border-[#1F3354] space-y-2">
              <Clock className="w-10 h-10 text-[#C8814F] mx-auto opacity-60" />
              <h3 className="text-base font-bold text-white">No Follow-ups Found</h3>
              <p className="text-xs text-[#94A3B8]">
                Click "+ Schedule Follow-up" above to create an actionable reminder for any assigned buyer.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFollowUps.map(fu => {
                const isOverdue = fu.displayStatus === 'OVERDUE' || (fu.status === 'PENDING' && new Date(fu.dueDate) < new Date());
                const isToday = fu.displayStatus === 'TODAY';
                const isCompleted = fu.status === 'COMPLETED';

                return (
                  <div
                    key={fu.id}
                    className={`bg-[#0D1726] border rounded-2xl p-5 space-y-3 transition-all ${
                      isOverdue
                        ? 'border-rose-500/40'
                        : isToday
                        ? 'border-amber-500/40'
                        : isCompleted
                        ? 'border-emerald-500/30 opacity-75'
                        : 'border-[#1F3354]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isCompleted
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isOverdue
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : isToday
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {fu.displayStatus || fu.status}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              fu.priority === 'URGENT'
                                ? 'bg-rose-950/60 text-rose-300 border border-rose-800'
                                : fu.priority === 'HIGH'
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                                : 'bg-[#15233A] text-[#94A3B8]'
                            }`}
                          >
                            {fu.priority}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1.5">{fu.title}</h4>
                      </div>

                      <span className="text-[11px] font-mono text-[#94A3B8] shrink-0">
                        {new Date(fu.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="p-3 bg-[#15233A] rounded-xl border border-[#1F3354] space-y-1 text-xs">
                      <div className="flex justify-between text-[#CBD5E1]">
                        <span className="text-[#64748B]">Buyer:</span>
                        <strong className="text-white">{fu.lead?.fullName || fu.buyerName || 'Prospective Client'}</strong>
                      </div>
                      <div className="flex justify-between text-[#CBD5E1]">
                        <span className="text-[#64748B]">Project:</span>
                        <span>{fu.lead?.project?.name || fu.project?.name || 'The Grand Orchid'}</span>
                      </div>
                      {fu.notes && (
                        <p className="text-[11px] text-[#94A3B8] pt-1 border-t border-[#1F3354]/60 italic">
                          "{fu.notes}"
                        </p>
                      )}
                      {fu.completionNotes && (
                        <p className="text-[11px] text-emerald-400 pt-1 border-t border-[#1F3354]/60">
                          <strong>Outcome:</strong> {fu.completionNotes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-[#1F3354] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setActiveCommLead(fu.lead || { fullName: fu.buyerName, phone: fu.lead?.phone });
                            setIsWhatsAppOpen(true);
                          }}
                          title="WhatsApp Click-to-Chat"
                          className="p-1.5 bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-white rounded-lg transition"
                        >
                          <MessageCircle size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setActiveCommLead(fu.lead || { fullName: fu.buyerName, phone: fu.lead?.phone });
                            setIsInAppChatOpen(true);
                          }}
                          title="In-App Real-time Chat"
                          className="p-1.5 bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition"
                        >
                          <MessageSquare size={14} />
                        </button>
                        <button
                          onClick={() => handleStartVideoCall(fu.lead || { id: 'temp' })}
                          title="Video Consultation (Jitsi Meet)"
                          className="p-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white rounded-lg transition"
                        >
                          <Video size={14} />
                        </button>
                      </div>

                      {!isCompleted && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setReschedulingFu(fu);
                              setRescheduleDate(new Date(fu.dueDate).toISOString().slice(0, 16));
                            }}
                            className="px-2.5 py-1 bg-[#15233A] hover:bg-[#1f3354] text-[#CBD5E1] rounded-lg text-xs font-semibold"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => {
                              setCompletingFu(fu);
                              setCompletionNotes('');
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1"
                          >
                            <Check size={12} />
                            <span>Complete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 6: SITE VISITS ─── */}
      {activeTab === 'site-visits' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-display font-bold text-white">Confirmed Show Residence Walkthroughs</h2>
            <p className="text-xs text-[#94A3B8]">
              Scheduled in-person visits to The Grand Orchid and Serene Meadows sales experience centers.
            </p>
          </div>

          {bookings.length === 0 ? (
            <div className="p-12 text-center bg-[#0D1726] rounded-2xl border border-[#1F3354] space-y-2">
              <CalendarCheck className="w-10 h-10 text-[#C8814F] mx-auto opacity-60" />
              <h3 className="text-base font-bold text-white">No Assigned Site Visits</h3>
              <p className="text-xs text-[#94A3B8]">
                Site visits booked by buyers will appear in your schedule with VIP pass codes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <div key={b.id} className="p-5 bg-[#0D1726] border border-[#1F3354] rounded-2xl flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        b.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {b.status}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#C8814F]">
                        Pass: {b.confirmationCode}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{b.slot?.project?.name || 'The Grand Orchid'}</h3>
                    <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                      <span>Buyer: <strong className="text-white">{b.buyerName}</strong></span>
                      <span>•</span>
                      <span>Phone: <strong className="text-white font-mono">{b.buyerPhone}</strong></span>
                      <span>•</span>
                      <span>Slot: <strong className="text-[#C8814F]">{b.slot?.date} ({b.slot?.startTime} - {b.slot?.endTime})</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => {
                        setActiveCommLead({ fullName: b.buyerName, phone: b.buyerPhone });
                        setIsWhatsAppOpen(true);
                      }}
                      className="px-3.5 py-2 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <MessageCircle size={14} />
                      <span>WhatsApp Directions</span>
                    </button>
                    {b.status !== 'Completed' && (
                      <button
                        onClick={() => handleMarkVisitCompleted(b.id)}
                        className="px-4 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                      >
                        <Check size={14} />
                        <span>Mark Visited</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 7: IN-APP CHAT CONVERSATIONS ─── */}
      {activeTab === 'conversations' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-display font-bold text-white">Direct Buyer Conversations & Advisory</h2>
            <p className="text-xs text-[#94A3B8]">
              Private in-app messaging sessions with assigned homebuyers.
            </p>
          </div>

          {leads.length === 0 ? (
            <div className="p-12 text-center bg-[#0D1726] rounded-2xl border border-[#1F3354]">
              <p className="text-xs text-[#94A3B8]">No active buyer conversations assigned.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leads.map(lead => (
                <div key={lead.id} className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{lead.fullName}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                      {lead.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8]">{lead.project?.name || 'The Grand Orchid'} • {lead.preferredBhk || '3 BHK'}</p>
                  <div className="pt-2 border-t border-[#1F3354] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#64748B]">{lead.phone}</span>
                    <button
                      onClick={() => {
                        setActiveCommLead(lead);
                        setIsInAppChatOpen(true);
                      }}
                      className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <MessageSquare size={13} />
                      <span>Open In-App Chat</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 8: MY PERFORMANCE ─── */}
      {activeTab === 'performance' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
                  Live Quota Tracker
                </span>
                <span className="text-xs text-[#64748B]">•</span>
                <span className="text-xs text-[#CBD5E1] font-semibold">{user?.name || 'Pooja Sharma'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
                Executive Conversion & Quota Performance
              </h2>
              <p className="text-xs text-[#94A3B8] max-w-xl">
                Personalized operational velocity metrics, pipeline progression, and closed transaction tracking.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-[#0D1726] border border-[#1F3354] text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>Quarter Target: On Track</span>
              </span>
            </div>
          </div>

          {/* Top KPI Metrics */}
          {(() => {
            const totalLeads = leads.length;
            const convertedLeads = leads.filter(l => l.status === 'Converted');
            const inPipelineLeads = leads.filter(l => !['Converted', 'Lost'].includes(l.status));
            const completedVisits = bookings.filter(b => b.status === 'Completed');
            const confirmedVisits = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed');
            const conversionRate = totalLeads > 0 
              ? ((convertedLeads.length / totalLeads) * 100).toFixed(1)
              : '15.0';
            const showUpRate = bookings.length > 0
              ? (((completedVisits.length || confirmedVisits.length) / bookings.length) * 100).toFixed(0)
              : '85';

            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#0D1726] border border-[#1F3354] p-5 rounded-2xl space-y-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Conversion Velocity</span>
                    <p className="text-2xl sm:text-3xl font-bold font-display text-emerald-400">{conversionRate}%</p>
                    <p className="text-[11px] text-[#CBD5E1]">
                      {convertedLeads.length} of {totalLeads} assigned leads converted
                    </p>
                  </div>

                  <div className="bg-[#0D1726] border border-[#1F3354] p-5 rounded-2xl space-y-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#C8814F]/5 rounded-full blur-xl pointer-events-none" />
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Active Pipeline</span>
                    <p className="text-2xl sm:text-3xl font-bold font-display text-[#C8814F]">{inPipelineLeads.length}</p>
                    <p className="text-[11px] text-[#CBD5E1]">Leads in active triage & negotiation</p>
                  </div>

                  <div className="bg-[#0D1726] border border-[#1F3354] p-5 rounded-2xl space-y-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Site Visit Show-Up</span>
                    <p className="text-2xl sm:text-3xl font-bold font-display text-blue-400">{showUpRate}%</p>
                    <p className="text-[11px] text-[#CBD5E1]">
                      {confirmedVisits.length} of {bookings.length} walkthroughs confirmed
                    </p>
                  </div>

                  <div className="bg-[#0D1726] border border-[#1F3354] p-5 rounded-2xl space-y-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Response SLA</span>
                    <p className="text-2xl sm:text-3xl font-bold font-display text-purple-400">&lt; 2 mins</p>
                    <p className="text-[11px] text-[#CBD5E1]">Multilingual AI assisted triage</p>
                  </div>
                </div>

                {/* Quota Progress Bars */}
                <div className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Award size={16} className="text-[#C8814F]" />
                      <span>Monthly Quota Attainment Goals</span>
                    </h3>
                    <span className="text-xs text-[#94A3B8] font-mono">Current Month: Active</span>
                  </div>

                  <div className="space-y-4">
                    {/* Booking Conversions Goal */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#CBD5E1] font-semibold">Lead Conversions (Target: 4 Deals)</span>
                        <span className="text-emerald-400 font-bold font-mono">
                          {convertedLeads.length} / 4 ({Math.min(100, Math.round((convertedLeads.length / 4) * 100))}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#15233A] h-2.5 rounded-full overflow-hidden border border-[#1F3354]">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(10, Math.round((convertedLeads.length / 4) * 100)))}%` }}
                        />
                      </div>
                    </div>

                    {/* Site Walkthroughs Goal */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#CBD5E1] font-semibold">Site Walkthroughs (Target: 8 Visits)</span>
                        <span className="text-[#C8814F] font-bold font-mono">
                          {bookings.length} / 8 ({Math.min(100, Math.round((bookings.length / 8) * 100))}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#15233A] h-2.5 rounded-full overflow-hidden border border-[#1F3354]">
                        <div
                          className="bg-gradient-to-r from-[#C8814F] to-amber-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(10, Math.round((bookings.length / 8) * 100)))}%` }}
                        />
                      </div>
                    </div>

                    {/* Customer Follow-up SLA */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#CBD5E1] font-semibold">Follow-Up SLA Adherence (Target: 95%)</span>
                        <span className="text-blue-400 font-bold font-mono">98% On-Time</span>
                      </div>
                      <div className="w-full bg-[#15233A] h-2.5 rounded-full overflow-hidden border border-[#1F3354]">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                          style={{ width: '98%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pipeline Breakdown Grid */}
                <div className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      My Lead Pipeline Distribution ({totalLeads} Total)
                    </h3>
                    <span className="text-xs text-[#94A3B8]">Ahmedabad Luxury Portfolio</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'New', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
                      { label: 'Contacted', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
                      { label: 'Qualified', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
                      { label: 'Visit Scheduled', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
                      { label: 'Visited', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
                      { label: 'Negotiation', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/30' },
                      { label: 'Converted', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
                      { label: 'Lost', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
                    ].map(({ label, color, bg }) => {
                      const count = leads.filter(l => l.status === label).length;
                      return (
                        <div key={label} className={`p-3.5 rounded-xl border ${bg} text-center`}>
                          <p className={`text-2xl font-bold font-display ${color}`}>{count}</p>
                          <p className="text-[10px] text-[#94A3B8] font-bold uppercase mt-1">{label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Closed Deals & High-Value Negotiations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Converted Buyers */}
                  <div className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <span>Closed Deals & Allotments ({convertedLeads.length})</span>
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Commission Earned
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {convertedLeads.length > 0 ? (
                        convertedLeads.map(l => (
                          <div key={l.id} className="p-3.5 bg-[#15233A] border border-[#1F3354] rounded-xl flex items-center justify-between">
                            <div>
                              <strong className="text-white text-xs block">{l.fullName}</strong>
                              <span className="text-[11px] text-[#94A3B8]">{l.project?.name || 'The Grand Orchid'} • {l.preferredBhk || '3 BHK'}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-emerald-400 block">₹1.35 Cr - ₹2.45 Cr</span>
                              <span className="text-[10px] text-emerald-300">Allotment Issued</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#94A3B8] p-4 text-center">No converted deals in current cycle.</p>
                      )}
                    </div>
                  </div>

                  {/* Active High-Intent In-Flight */}
                  <div className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Clock size={16} className="text-[#C8814F]" />
                        <span>High-Intent Negotiations ({leads.filter(l => ['Negotiation', 'Qualified'].includes(l.status)).length})</span>
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        Priority Triage
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {leads.filter(l => ['Negotiation', 'Qualified'].includes(l.status)).slice(0, 4).map(l => (
                        <div key={l.id} className="p-3.5 bg-[#15233A] border border-[#1F3354] rounded-xl flex items-center justify-between">
                          <div>
                            <strong className="text-white text-xs block">{l.fullName}</strong>
                            <span className="text-[11px] text-[#94A3B8]">{l.project?.name || 'Serene Meadows'} • Status: {l.status}</span>
                          </div>
                          <button
                            onClick={() => handleOpenLeadDetails(l)}
                            className="px-2.5 py-1 rounded bg-[#0D1726] hover:bg-[#1E293B] border border-[#1F3354] text-[10px] font-bold text-[#C8814F] transition-all"
                          >
                            Open Dossier →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ─── TAB 9: PROFILE ─── */}
      {activeTab === 'profile' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-display font-bold text-white">Sales Executive Profile</h2>
            <p className="text-xs text-[#94A3B8]">Authenticated identity and organization credentials.</p>
          </div>

          <div className="max-w-xl bg-[#0D1726] border border-[#1F3354] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#C8814F]/20 text-[#C8814F] border border-[#C8814F]/30 flex items-center justify-center font-bold text-xl">
                {user?.name ? user.name[0] : 'P'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{user?.name || 'Pooja Sharma'}</h3>
                <span className="text-xs text-[#C8814F] font-semibold">Senior Executive • Ahmedabad Division</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1F3354] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Email:</span>
                <span className="font-mono text-white">{user?.email || 'executive1@propassist.ai'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Phone:</span>
                <span className="font-mono text-white">{user?.phone || '+91 98250 54321'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Role:</span>
                <span className="font-mono text-emerald-400">SALES_EXECUTIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Active Queue Capacity:</span>
                <span className="text-white font-semibold">25 Leads / Week</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── LEAD DETAIL SLIDE-OVER DRAWER ─── */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-[#15233A] h-full shadow-2xl p-6 sm:p-8 space-y-6 overflow-y-auto border-l border-[#1F3354]">
            <div className="flex items-center justify-between pb-4 border-b border-[#1F3354]">
              <div>
                <span className="text-[10px] font-bold text-[#C8814F] uppercase tracking-wider">
                  Lead Intelligence Dossier
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">{selectedLead.fullName}</h2>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-2 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#0D1726]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Core Details Grid */}
            <div className="p-4 bg-[#0D1726] border border-[#1F3354] rounded-2xl grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#64748B] block">Contact Phone</span>
                <strong className="text-white font-mono">{selectedLead.phone}</strong>
              </div>
              <div>
                <span className="text-[#64748B] block">Email Address</span>
                <strong className="text-white font-mono">{selectedLead.email || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-[#64748B] block">Preferred Project</span>
                <strong className="text-white">{selectedLead.project?.name || 'The Grand Orchid'}</strong>
              </div>
              <div>
                <span className="text-[#64748B] block">Preferred BHK</span>
                <strong className="text-[#C8814F]">{selectedLead.preferredBhk || '3 BHK'}</strong>
              </div>
            </div>

            {/* Direct Communication Channels (Voice Removed) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#A3AEC0] block">Engagement Actions</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCommLead(selectedLead);
                    setIsWhatsAppOpen(true);
                  }}
                  className="px-3.5 py-2 bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-white rounded-xl text-xs font-bold border border-[#25D366]/30 transition-all flex items-center gap-1.5"
                >
                  <MessageCircle size={14} />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCommLead(selectedLead);
                    setIsInAppChatOpen(true);
                  }}
                  className="px-3.5 py-2 bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl text-xs font-bold border border-blue-500/30 transition-all flex items-center gap-1.5"
                >
                  <MessageSquare size={14} />
                  <span>In-App Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartVideoCall(selectedLead)}
                  className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white rounded-xl text-xs font-bold border border-purple-500/30 transition-all flex items-center gap-1.5"
                >
                  <Video size={14} />
                  <span>Jitsi Video Tour</span>
                </button>
              </div>
            </div>

            {/* Internal Notes History */}
            {fullLeadData?.internalNotes && fullLeadData.internalNotes.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#A3AEC0] block">Activity & Notes Timeline</label>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {fullLeadData.internalNotes.map((n) => (
                    <div key={n.id} className="p-3 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                        <span className="font-bold text-[#CBD5E1]">{n.author?.name || 'Executive'}</span>
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-[#CBD5E1] whitespace-pre-wrap">{n.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Follow-up Note */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#A3AEC0] block">Add Activity Note</label>
              <textarea
                rows={3}
                placeholder="Spoke with buyer regarding 1,850 sq ft corner layout. Requested subvention schedule for next Sunday viewing..."
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#C8814F]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1F3354]">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 bg-[#0D1726] hover:bg-[#15233A] text-white border border-[#1F3354] rounded-xl text-xs font-bold"
              >
                Close
              </button>
              <button
                disabled={noteSaving || !followUpNote.trim()}
                onClick={handleSaveNote}
                className="px-5 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {noteSaving && <RefreshCw size={12} className="animate-spin" />}
                <span>{noteSaving ? 'Saving...' : 'Save Activity Note'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SCHEDULE NEW FOLLOW-UP MODAL ─── */}
      {showCreateFuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#15233A] border border-[#1F3354] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F3354]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="text-[#C8814F]" size={16} />
                <span>Schedule Lead Follow-up</span>
              </h3>
              <button
                onClick={() => setShowCreateFuModal(false)}
                className="text-[#94A3B8] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Select Lead *</label>
                <select
                  required
                  value={newFuLeadId}
                  onChange={(e) => setNewFuLeadId(e.target.value)}
                  className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-2.5 text-white focus:outline-none"
                >
                  <option value="">Select a buyer...</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.fullName} ({l.phone}) - {l.project?.name || 'Orchid'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Follow-up Title / Purpose *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Budget & Subvention Discussion"
                  value={newFuTitle}
                  onChange={(e) => setNewFuTitle(e.target.value)}
                  className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Due Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newFuDate}
                    onChange={(e) => setNewFuDate(e.target.value)}
                    className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Priority</label>
                  <select
                    value={newFuPriority}
                    onChange={(e) => setNewFuPriority(e.target.value)}
                    className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    <option value="URGENT">URGENT</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Discuss floor plan options for 14th floor 3 BHK..."
                  value={newFuNotes}
                  onChange={(e) => setNewFuNotes(e.target.value)}
                  className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-2 text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateFuModal(false)}
                  className="px-4 py-2 bg-[#0D1726] text-[#CBD5E1] rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fuSubmitting}
                  className="px-5 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl font-bold shadow"
                >
                  {fuSubmitting ? 'Saving...' : 'Save Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── COMPLETE FOLLOW-UP MODAL ─── */}
      {completingFu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#15233A] border border-[#1F3354] rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="text-emerald-400" size={16} />
              <span>Mark Follow-up Completed</span>
            </h3>
            <p className="text-xs text-[#94A3B8]">
              "{completingFu.title}" for {completingFu.lead?.fullName || completingFu.buyerName}
            </p>

            <div className="space-y-2 text-xs">
              <label className="block text-[#CBD5E1] font-semibold">Outcome / Call Notes *</label>
              <textarea
                rows={3}
                placeholder="Spoke with buyer. Confirmed site visit for Saturday at 11 AM. Sent RERA fact sheet via WhatsApp."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-3 text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setCompletingFu(null)}
                className="px-4 py-2 bg-[#0D1726] text-[#CBD5E1] rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteFollowUp}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow"
              >
                Confirm Completion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RESCHEDULE FOLLOW-UP MODAL ─── */}
      {reschedulingFu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#15233A] border border-[#1F3354] rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="text-amber-400" size={16} />
              <span>Reschedule Follow-up</span>
            </h3>
            <p className="text-xs text-[#94A3B8]">
              "{reschedulingFu.title}" for {reschedulingFu.lead?.fullName || reschedulingFu.buyerName}
            </p>

            <div className="space-y-2 text-xs">
              <label className="block text-[#CBD5E1] font-semibold">New Due Date & Time *</label>
              <input
                type="datetime-local"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-2.5 text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setReschedulingFu(null)}
                className="px-4 py-2 bg-[#0D1726] text-[#CBD5E1] rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleFollowUp}
                className="px-5 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── OFFICIAL WHATSAPP & IN-APP CHAT MODALS ─── */}
      {activeCommLead && (
        <>
          <WhatsAppChatModal
            isOpen={isWhatsAppOpen}
            onClose={() => setIsWhatsAppOpen(false)}
            recipientName={activeCommLead.fullName}
            recipientPhone={activeCommLead.phone}
            recipientRole="Prospective Buyer"
            leadId={activeCommLead.id}
            defaultTemplate="executive_followup"
            defaultLanguage="en"
          />

          <InAppChatModal
            isOpen={isInAppChatOpen}
            onClose={() => setIsInAppChatOpen(false)}
            leadId={activeCommLead.id}
            participantName={activeCommLead.fullName}
            participantRole="Prospective Buyer"
          />
        </>
      )}
    </div>
  );
};

export default SalesExecutiveDashboard;
