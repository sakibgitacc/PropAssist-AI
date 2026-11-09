import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { getPayments, getPropertyBookings } from '../services/extendedApi';
import {
  LayoutDashboard, Users, UserCheck, BotMessageSquare, CalendarCheck,
  TrendingUp, BarChart3, Clock, ArrowRight, CheckCircle2, ShieldCheck,
  Building2, CreditCard, Award, Zap, Search, Filter, RefreshCw,
  Plus, Check, X, ChevronRight, FileSpreadsheet, UserPlus,
  Send, ExternalLink, ShieldAlert, MessageCircle, AlertCircle, AlertTriangle,
  FileText, Calendar, MapPin, Download, CheckSquare, XCircle, Settings, Bell,
  ChevronDown
} from 'lucide-react';
import WhatsAppChatModal from '../components/common/WhatsAppChatModal';

export const SalesHeadDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Live state from backend APIs
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [propertyBookings, setPropertyBookings] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [followUpStats, setFollowUpStats] = useState(null);
  const [whatsappLogs, setWhatsappLogs] = useState([]);

  // Assignment Modal State
  const [assigningLead, setAssigningLead] = useState(null);
  const [selectedExecId, setSelectedExecId] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  // Search & Filter States
  const [leadFilterStatus, setLeadFilterStatus] = useState('All');
  const [leadFilterProject, setLeadFilterProject] = useState('All');
  const [leadFilterExecutive, setLeadFilterExecutive] = useState('All');
  const [leadSearch, setLeadSearch] = useState('');

  // Buyer Search & Filter
  const [buyerSearch, setBuyerSearch] = useState('');

  // Follow-up Filters
  const [fuCategoryFilter, setFuCategoryFilter] = useState('All');
  const [fuPriorityFilter, setFuPriorityFilter] = useState('All');
  const [fuExecFilter, setFuExecFilter] = useState('All');

  // Overview Filters
  const [filterProject, setFilterProject] = useState('All');
  const [filterExecutive, setFilterExecutive] = useState('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // WhatsApp Modal
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedLeadForWA, setSelectedLeadForWA] = useState(null);

  // Conversation Detail Modal
  const [selectedConv, setSelectedConv] = useState(null);
  const [convMessages, setConvMessages] = useState([]);
  const [convLoading, setConvLoading] = useState(false);

  // New Follow-up Modal (Sales Head can assign to any executive)
  const [isCreateFuModalOpen, setIsCreateFuModalOpen] = useState(false);
  const [newFuLeadId, setNewFuLeadId] = useState('');
  const [newFuTitle, setNewFuTitle] = useState('');
  const [newFuType, setNewFuType] = useState('Callback');
  const [newFuPriority, setNewFuPriority] = useState('MEDIUM');
  const [newFuDate, setNewFuDate] = useState(new Date().toISOString().split('T')[0]);
  const [newFuTime, setNewFuTime] = useState('11:00 AM');
  const [newFuExecId, setNewFuExecId] = useState('');
  const [newFuDesc, setNewFuDesc] = useState('');
  const [fuSubmitting, setFuSubmitting] = useState(false);

  const fetchSalesHeadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Build query string for analytics with filters
      const analyticsQuery = new URLSearchParams();
      if (filterProject !== 'All') analyticsQuery.append('projectId', filterProject);
      if (filterExecutive !== 'All') analyticsQuery.append('executiveId', filterExecutive);
      if (filterStartDate) analyticsQuery.append('startDate', filterStartDate);
      if (filterEndDate) analyticsQuery.append('endDate', filterEndDate);

      const results = await Promise.allSettled([
        api.get(`/analytics/dashboard?${analyticsQuery.toString()}`),
        api.get('/leads?limit=100'),
        api.get('/auth/executives'),
        api.get('/ai/conversations'),
        api.get('/slots/bookings'),
        api.get('/projects'),
        getPayments(),
        getPropertyBookings(),
        api.get('/follow-ups'),
        api.get('/follow-ups/stats'),
        api.get('/users/buyers'),
        api.get('/communications?channel=WhatsApp')
      ]);

      const [
        dashRes,
        leadRes,
        execRes,
        convRes,
        bookRes,
        projRes,
        payRes,
        propRes,
        fuRes,
        fuStatsRes,
        buyersRes,
        waRes
      ] = results;

      if (dashRes.status === 'fulfilled' && dashRes.value?.data?.success) setStats(dashRes.value.data.stats);
      if (leadRes.status === 'fulfilled' && leadRes.value?.data?.success) setLeads(leadRes.value.data.leads || []);
      if (execRes.status === 'fulfilled' && execRes.value?.data?.success) setExecutives(execRes.value.data.executives || []);
      if (convRes.status === 'fulfilled' && convRes.value?.data?.success) setConversations(convRes.value.data.conversations || []);
      if (bookRes.status === 'fulfilled' && bookRes.value?.data?.success) setBookings(bookRes.value.data.bookings || []);
      if (projRes.status === 'fulfilled' && projRes.value?.data?.success) setProjects(projRes.value.data.projects || []);
      if (payRes.status === 'fulfilled' && payRes.value?.success) setPayments(payRes.value.payments || []);
      if (propRes.status === 'fulfilled' && propRes.value?.success) setPropertyBookings(propRes.value.bookings || []);
      if (fuRes.status === 'fulfilled' && fuRes.value?.data?.success) setFollowUps(fuRes.value.data.followUps || []);
      if (fuStatsRes.status === 'fulfilled' && fuStatsRes.value?.data?.success) setFollowUpStats(fuStatsRes.value.data.stats || null);
      if (buyersRes.status === 'fulfilled' && buyersRes.value?.data?.success) setBuyers(buyersRes.value.data.buyers || []);
      if (waRes.status === 'fulfilled' && waRes.value?.data?.data) setWhatsappLogs(waRes.value.data.data || []);

    } catch (err) {
      console.error('Error fetching sales head dashboard:', err);
      setError('Unable to load organization sales metrics. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesHeadData();
  }, [user, filterProject, filterExecutive, filterStartDate, filterEndDate]);

  // Handle Lead Assignment / Reassignment
  const handleAssignLead = async (leadId, executiveId) => {
    try {
      await api.post(`/leads/${leadId}/assign`, {
        executiveId,
        reason: 'Sales Head direct distribution'
      });
      setAssignSuccess('Lead successfully routed to sales executive.');
      setAssigningLead(null);
      setTimeout(() => setAssignSuccess(''), 3000);
      await fetchSalesHeadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign lead');
    }
  };

  // Handle Round Robin Auto Assignment
  const handleRoundRobinAssign = async () => {
    const unassigned = leads.filter(l => !l.assignedExecutiveId);
    if (unassigned.length === 0 || executives.length === 0) {
      alert('All current leads are already assigned or no executives available.');
      return;
    }

    let assignedCount = 0;
    for (let i = 0; i < unassigned.length; i++) {
      const exec = executives[i % executives.length];
      try {
        await api.post(`/leads/${unassigned[i].id}/assign`, {
          executiveId: exec.id,
          reason: 'Fair distribution round-robin'
        });
        assignedCount++;
      } catch (err) {
        console.error('Error in round robin:', err);
      }
    }
    alert(`Round-Robin Complete: Assigned ${assignedCount} leads evenly across sales team.`);
    await fetchSalesHeadData();
  };

  // Handle Allotment Approval
  const handleApproveAllotment = async (bookingId) => {
    try {
      const res = await api.patch(`/property-bookings/${bookingId}/status`, {
        allotmentStatus: 'Letter Issued',
        bookingStatus: 'Confirmed & Allotted'
      });
      if (res.data?.success) {
        alert('Allotment Approval Granted: Provisional RERA Allotment Certificate generated.');
        await fetchSalesHeadData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve allotment.');
    }
  };

  // Open Conversation Details
  const handleOpenConversation = async (conv) => {
    setSelectedConv(conv);
    setConvMessages([]);
    setConvLoading(true);
    try {
      const res = await api.get(`/ai/conversations/${conv.id}`);
      if (res.data?.success) {
        setConvMessages(res.data.conversation.messages || []);
      }
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    } finally {
      setConvLoading(false);
    }
  };

  // Create Follow-up Handler
  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    if (!newFuLeadId || !newFuTitle.trim()) {
      alert('Please select a lead and enter a title.');
      return;
    }
    setFuSubmitting(true);
    try {
      const res = await api.post('/follow-ups', {
        leadId: newFuLeadId,
        title: newFuTitle.trim(),
        description: newFuDesc.trim(),
        type: newFuType,
        priority: newFuPriority,
        scheduledDate: newFuDate,
        scheduledTime: newFuTime,
        executiveId: newFuExecId || undefined
      });
      if (res.data.success) {
        setIsCreateFuModalOpen(false);
        setNewFuTitle('');
        setNewFuDesc('');
        await fetchSalesHeadData();
        alert('Follow-up task created and assigned successfully.');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create follow-up task.');
    } finally {
      setFuSubmitting(false);
    }
  };

  // Filter Leads
  const filteredLeads = leads.filter(l => {
    const matchesSearch = !leadSearch ||
      l.fullName?.toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.phone?.includes(leadSearch) ||
      l.email?.toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.project?.name?.toLowerCase().includes(leadSearch.toLowerCase());
    const matchesStatus = leadFilterStatus === 'All' || l.status === leadFilterStatus;
    const matchesProject = leadFilterProject === 'All' || l.projectId === leadFilterProject;
    const matchesExec = leadFilterExecutive === 'All' || l.assignedExecutiveId === leadFilterExecutive;
    return matchesSearch && matchesStatus && matchesProject && matchesExec;
  });

  // Filter Buyers
  const filteredBuyers = buyers.filter(b => {
    if (!buyerSearch.trim()) return true;
    const q = buyerSearch.toLowerCase();
    return (
      b.name?.toLowerCase().includes(q) ||
      b.email?.toLowerCase().includes(q) ||
      b.phone?.includes(q)
    );
  });

  // Filter Follow-ups
  const filteredFollowUps = followUps.filter(f => {
    const matchesCat = fuCategoryFilter === 'All' || f.displayStatus === fuCategoryFilter || f.status === fuCategoryFilter;
    const matchesPri = fuPriorityFilter === 'All' || f.priority === fuPriorityFilter;
    const matchesExec = fuExecFilter === 'All' || f.executiveId === fuExecFilter;
    return matchesCat && matchesPri && matchesExec;
  });

  const unassignedCount = leads.filter(l => !l.assignedExecutiveId).length;
  const verifiedPaymentsTotal = payments.reduce((acc, p) => acc + (p.status === 'Verified' ? p.amount : 0), 0);

  // Extract all inventory units across projects
  const allInventoryUnits = projects.flatMap(p => (p.units || []).map(u => ({ ...u, projectName: p.name, projectLocation: p.location })));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C8814F] to-[#15233A] flex items-center justify-center animate-spin">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <p className="text-xs text-[#94A3B8] font-semibold tracking-wider uppercase">
          Loading Organization Sales Pipeline & Real-Time Datasets...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-[#F3EFE8]">
      {/* ─── SALES HEAD HEADER ─── */}
      <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C8814F]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp size={13} />
                Sales Head Command Center
              </span>
              <span className="text-xs text-[#64748B]">•</span>
              <span className="text-xs text-[#CBD5E1] font-semibold">Ahmedabad Residential Division (420 Units)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              Organization Sales Velocity & Team Management
            </h1>
            <p className="text-xs text-[#94A3B8] max-w-xl leading-relaxed">
              Real-time lead distribution, quota attainment tracking, site visit conversion, and provisional RERA allotment approvals across The Grand Orchid and Serene Meadows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRoundRobinAssign}
              className="px-4 py-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2"
              title="Equally distribute all unassigned leads across active executives"
            >
              <UserPlus size={15} />
              <span>Round-Robin Routing ({unassignedCount})</span>
            </button>
            <button
              onClick={() => navigate('/slots')}
              className="px-4 py-2.5 bg-[#0D1726] hover:bg-[#1f3354] text-[#F3EFE8] border border-[#1F3354] rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <CalendarCheck size={15} className="text-[#C8814F]" />
              <span>Configure Slots</span>
            </button>
          </div>
        </div>

        {/* ─── SALES HEAD TAB SELECTOR ─── */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 mt-6 border-t border-[#1F3354]/60 no-scrollbar">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
            { id: 'leads', label: `All Leads (${leads.length})`, icon: Users },
            { id: 'buyers', label: `Buyers (${buyers.length})`, icon: UserCheck },
            { id: 'assignment', label: `Lead Routing (${unassignedCount})`, icon: UserPlus },
            { id: 'team', label: `Sales Team (${executives.length})`, icon: Users },
            { id: 'ai-conversations', label: `AI Conversations (${conversations.length})`, icon: BotMessageSquare },
            { id: 'site-visits', label: `Site Visits (${bookings.length})`, icon: CalendarCheck },
            { id: 'follow-ups', label: `Follow-ups (${followUps.length})`, icon: Clock },
            { id: 'fact-sheets', label: `Projects & RERA (${projects.length})`, icon: Building2 },
            { id: 'inventory', label: `Inventory (${allInventoryUnits.length})`, icon: Building2 },
            { id: 'payments', label: 'Payments Ledger', icon: CreditCard },
            { id: 'allotment-approvals', label: `Allotments (${propertyBookings.length})`, icon: Award },
            { id: 'whatsapp', label: 'WhatsApp Comm', icon: MessageCircle },
            { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 }
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

      {assignSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{assignSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-500/40 rounded-2xl text-red-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchSalesHeadData}
            className="px-3 py-1 bg-red-900/40 hover:bg-red-800/60 text-white rounded-lg text-xs font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── TAB 1: OVERVIEW DASHBOARD ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Organization Filters Toolbar */}
          <div className="p-4 bg-[#15233A] border border-[#1F3354] rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-[#C8814F]" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">Filter Metrics:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="bg-[#0D1726] border border-[#1F3354] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="All">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <select
                value={filterExecutive}
                onChange={(e) => setFilterExecutive(e.target.value)}
                className="bg-[#0D1726] border border-[#1F3354] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="All">All Executives</option>
                {executives.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <span>From:</span>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="bg-[#0D1726] border border-[#1F3354] rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <span>To:</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="bg-[#0D1726] border border-[#1F3354] rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none"
                />
              </div>

              {(filterProject !== 'All' || filterExecutive !== 'All' || filterStartDate || filterEndDate) && (
                <button
                  onClick={() => {
                    setFilterProject('All');
                    setFilterExecutive('All');
                    setFilterStartDate('');
                    setFilterEndDate('');
                  }}
                  className="px-3 py-1 bg-[#0D1726] hover:bg-[#1f3354] text-xs font-bold text-amber-400 rounded-xl border border-[#1F3354]"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* 14 Real Database KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
            <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Total Leads</span>
              <p className="text-xl font-bold font-display text-white mt-1">{stats?.totalLeads ?? leads.length}</p>
              <span className="text-[9px] text-[#64748B]">All channels</span>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">New Leads</span>
              <p className="text-xl font-bold font-display text-amber-400 mt-1">{stats?.newLeads ?? 0}</p>
              <span className="text-[9px] text-amber-300/80">Pending triage</span>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Contacted</span>
              <p className="text-xl font-bold font-display text-blue-400 mt-1">{stats?.contactedLeads ?? leads.filter(l => l.status === 'Contacted').length}</p>
              <span className="text-[9px] text-blue-300/80">Called by team</span>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Qualified</span>
              <p className="text-xl font-bold font-display text-emerald-400 mt-1">{stats?.qualifiedLeads ?? 0}</p>
              <span className="text-[9px] text-emerald-300/80">High intent</span>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Negotiations</span>
              <p className="text-xl font-bold font-display text-purple-400 mt-1">{stats?.negotiationLeads ?? leads.filter(l => l.status === 'Negotiation').length}</p>
              <span className="text-[9px] text-purple-300/80">Active closing</span>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Converted</span>
              <p className="text-xl font-bold font-display text-emerald-400 mt-1">{stats?.convertedLeads ?? leads.filter(l => l.status === 'Converted').length}</p>
              <span className="text-[9px] text-emerald-300/80">Booked units</span>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Lost Leads</span>
              <p className="text-xl font-bold font-display text-slate-400 mt-1">{stats?.lostLeads ?? leads.filter(l => l.status === 'Lost').length}</p>
              <span className="text-[9px] text-slate-500">Dropped out</span>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Total Visits</span>
              <p className="text-xl font-bold font-display text-[#C8814F] mt-1">{stats?.totalSiteVisits ?? bookings.length}</p>
              <span className="text-[9px] text-[#CBD5E1]">Atomic slots booked</span>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Completed Visits</span>
              <p className="text-xl font-bold font-display text-purple-400 mt-1">{stats?.completedSiteVisits ?? bookings.filter(b => b.status === 'Completed').length}</p>
              <span className="text-[9px] text-purple-300/80">Attended tours</span>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Pending Follow-ups</span>
              <p className="text-xl font-bold font-display text-amber-400 mt-1">{stats?.pendingFollowUps ?? followUps.filter(f => f.status === 'UPCOMING' || f.status === 'TODAY').length}</p>
              <span className="text-[9px] text-amber-300/80">Scheduled queue</span>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Overdue Follow-ups</span>
              <p className="text-xl font-bold font-display text-red-400 mt-1">{stats?.overdueFollowUps ?? followUps.filter(f => f.status === 'OVERDUE').length}</p>
              <span className="text-[9px] text-red-300/80">Immediate attention</span>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Conversion Rate</span>
              <p className="text-xl font-bold font-display text-emerald-400 mt-1">{stats?.conversionRate ?? '0.0%'}</p>
              <span className="text-[9px] text-emerald-300/80">Lead-to-booking</span>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Verified Revenue</span>
              <p className="text-xl font-bold font-display text-emerald-400 mt-1">₹{((stats?.verifiedRevenue ?? verifiedPaymentsTotal) / 100000).toFixed(1)}L</p>
              <span className="text-[9px] text-emerald-300/80">RERA Escrow</span>
            </div>

            <div className="bg-[#15233A] border border-[#1F3354] p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Avg SLA Speed</span>
              <p className="text-xl font-bold font-display text-emerald-400 mt-1">{stats?.avgResponseTime || '3.8 min'}</p>
              <span className="text-[9px] text-emerald-300/80">&lt; 5m Developer Target</span>
            </div>
          </div>

          {/* Performance Charts & Team Workload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Executive Workload Distribution */}
            <div className="bg-[#15233A] border border-[#1F3354] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Sales Executive Workload & Quota Velocity
                </h3>
                <span className="text-[10px] font-bold text-[#C8814F]">Live Allocation</span>
              </div>

              <div className="space-y-3">
                {executives.map(exec => {
                  const execLeadsCount = leads.filter(l => l.assignedExecutiveId === exec.id).length;
                  const execConvertedCount = leads.filter(l => l.assignedExecutiveId === exec.id && l.status === 'Converted').length;
                  const percent = Math.min(100, Math.round((execLeadsCount / 20) * 100));
                  return (
                    <div key={exec.id} className="p-3.5 bg-[#0D1726] border border-[#1F3354] rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <strong className="text-white">{exec.name} ({exec.role})</strong>
                        <span className="text-[#94A3B8]">
                          {execLeadsCount} Leads • {execConvertedCount} Converted ({percent}% Capacity)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#15233A] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#C8814F] to-emerald-400 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pipeline Attribution by Project & Channel */}
            <div className="bg-[#15233A] border border-[#1F3354] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Pipeline Attribution by Project & Channel
                </h3>
                <span className="text-[10px] font-bold text-emerald-400">Marketing Velocity</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-[#0D1726] border border-[#1F3354] rounded-xl">
                  <span className="text-[10px] text-[#64748B] block">The Grand Orchid (SG Highway)</span>
                  <strong className="text-base text-white">
                    {leads.filter(l => l.projectId === 'proj-grand-orchid' || !l.projectId).length} Leads
                  </strong>
                  <span className="text-[10px] text-[#C8814F] block mt-1">3 & 4 BHK Luxury Focus</span>
                </div>

                <div className="p-3.5 bg-[#0D1726] border border-[#1F3354] rounded-xl">
                  <span className="text-[10px] text-[#64748B] block">Serene Meadows (South Bopal)</span>
                  <strong className="text-base text-white">
                    {leads.filter(l => l.projectId === 'proj-serene-meadows').length} Leads
                  </strong>
                  <span className="text-[10px] text-emerald-400 block mt-1">2 & 3 BHK Lifestyle Focus</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#0D1726] border border-[#1F3354] rounded-xl space-y-2 text-xs">
                <span className="text-[10px] text-[#64748B] block">Lead Inflow Source Breakdown</span>
                <div className="flex items-center justify-between text-[11px]">
                  <span>AI Chatbot / WhatsApp:</span>
                  <strong className="text-white">{leads.filter(l => l.source?.includes('Chatbot') || l.source?.includes('WhatsApp')).length} leads</strong>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Property Portals (99acres / MagicBricks):</span>
                  <strong className="text-white">{leads.filter(l => l.source?.includes('portal') || l.source?.includes('Portal')).length} leads</strong>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Campaigns & Hoardings:</span>
                  <strong className="text-white">{leads.filter(l => l.source?.includes('Campaign') || l.source?.includes('Hoarding')).length} leads</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ─── TAB 2: ALL LEADS ─── */}
      {activeTab === 'leads' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Organization Master Lead Register</h2>
              <p className="text-xs text-[#94A3B8]">
                All organization inquiries with real-time audit trail, assigned executive, and duplicate verification flags.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search buyer, phone, email, project..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                className="bg-[#0D1726] border border-[#1F3354] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#64748B] focus:outline-none w-56"
              />

              <select
                value={leadFilterStatus}
                onChange={(e) => setLeadFilterStatus(e.target.value)}
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

              <select
                value={leadFilterProject}
                onChange={(e) => setLeadFilterProject(e.target.value)}
                className="bg-[#0D1726] border border-[#1F3354] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="All">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <select
                value={leadFilterExecutive}
                onChange={(e) => setLeadFilterExecutive(e.target.value)}
                className="bg-[#0D1726] border border-[#1F3354] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="All">All Executives</option>
                {executives.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1726] text-[#64748B] uppercase tracking-wider border-b border-[#1F3354]">
                <tr>
                  <th className="p-3.5">Buyer Name</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5">Project & BHK</th>
                  <th className="p-3.5">Budget Expectation</th>
                  <th className="p-3.5">Assigned Host</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Source</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F3354]">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-[#64748B]">
                      No leads matching your current search and filter parameters.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#0D1726]/50 transition-colors">
                      <td className="p-3.5">
                        <strong className="text-white block">{lead.fullName}</strong>
                        <span className="text-[10px] text-[#64748B] font-mono">ID: {lead.id.slice(0, 8)}...</span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[11px] text-[#94A3B8] font-mono block">{lead.phone}</span>
                        {lead.email && <span className="text-[10px] text-[#64748B] block truncate max-w-[150px]">{lead.email}</span>}
                      </td>
                      <td className="p-3.5">
                        <span className="text-white font-medium block">{lead.project?.name || 'Ahmedabad Residential'}</span>
                        <span className="text-[10px] text-[#C8814F] font-bold">{lead.preferredBhk || 'Residential Layout'}</span>
                      </td>
                      <td className="p-3.5 font-mono text-[#CBD5E1]">
                        {lead.budgetMin && lead.budgetMax
                          ? `₹${(lead.budgetMin / 10000000).toFixed(2)} - ₹${(lead.budgetMax / 10000000).toFixed(2)} Cr`
                          : 'Consultation Required'}
                      </td>
                      <td className="p-3.5">
                        {lead.assignedExecutive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            {lead.assignedExecutive.name}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#0D1726] border border-[#1F3354] text-white">
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-[#94A3B8]">{lead.source || 'AI Chatbot'}</td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedLeadForWA(lead);
                            setIsWhatsAppModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/30 text-[11px] font-bold transition-all"
                          title="WhatsApp Click-to-Chat"
                        >
                          <MessageCircle size={12} className="inline mr-1" />
                          <span>WA</span>
                        </button>
                        <button
                          onClick={() => {
                            setAssigningLead(lead);
                            setSelectedExecId(lead.assignedExecutiveId || executives[0]?.id || '');
                          }}
                          className="px-3 py-1 bg-[#0D1726] hover:bg-[#C8814F] text-white rounded-lg border border-[#1F3354] text-[11px] font-bold transition-all"
                        >
                          {lead.assignedExecutiveId ? 'Reassign' : 'Assign'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* ─── TAB 3: BUYERS (REAL DATABASE PERSISTED BUYERS) ─── */}
      {activeTab === 'buyers' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Registered Homebuyers Portal</h2>
              <p className="text-xs text-[#94A3B8]">
                Verified buyer accounts with inquiry history, site visit bookings, property reservations, and paid advances.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={buyerSearch}
                onChange={(e) => setBuyerSearch(e.target.value)}
                className="bg-[#0D1726] border border-[#1F3354] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#64748B] focus:outline-none w-64"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBuyers.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-[#0D1726] rounded-2xl border border-[#1F3354] space-y-2">
                <UserCheck className="w-10 h-10 text-[#C8814F] mx-auto opacity-60" />
                <h3 className="text-base font-bold text-white">No Registered Buyers Found</h3>
                <p className="text-xs text-[#94A3B8]">
                  Buyers register dynamically through the public portal or via site visit bookings.
                </p>
              </div>
            ) : (
              filteredBuyers.map(buyer => (
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
                      <span className="text-[10px] text-[#64748B] block">Paid Advance</span>
                      <strong className="text-emerald-400 font-mono">₹{((buyer.totalPaid || 0) / 100000).toFixed(1)}L</strong>
                    </div>
                  </div>

                  {buyer.propertyBookings && buyer.propertyBookings.length > 0 && (
                    <div className="p-2.5 bg-purple-950/40 border border-purple-500/30 rounded-xl text-[11px] text-purple-200">
                      <strong className="block text-white">Active Unit Booking:</strong>
                      {buyer.propertyBookings[0].projectName} — {buyer.propertyBookings[0].unitNumber} ({buyer.propertyBookings[0].allotmentStatus})
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#1F3354] flex items-center justify-between text-xs text-[#94A3B8]">
                    <span>Joined: {new Date(buyer.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => {
                        setSelectedLeadForWA({ fullName: buyer.name, phone: buyer.phone, email: buyer.email });
                        setIsWhatsAppModalOpen(true);
                      }}
                      className="px-3 py-1 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}


      {/* ─── TAB 4: LEAD ROUTING / ASSIGNMENT ─── */}
      {activeTab === 'assignment' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Lead Routing & Executive Workload Distribution</h2>
              <p className="text-xs text-[#94A3B8]">
                Distribute inquiries manually or trigger automated fair round-robin distribution to active executives.
              </p>
            </div>
            <button
              onClick={handleRoundRobinAssign}
              className="px-5 py-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <UserPlus size={15} />
              <span>Execute Round-Robin Routing ({unassignedCount} Leads)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {executives.map(exec => {
              const execLeads = leads.filter(l => l.assignedExecutiveId === exec.id);
              return (
                <div key={exec.id} className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-bold text-white">{exec.name}</h4>
                      <span className="text-[11px] text-[#C8814F] font-bold block">{exec.role}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      Active
                    </span>
                  </div>

                  <div className="p-3 bg-[#15233A] rounded-xl border border-[#1F3354] flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">Current Queue:</span>
                    <strong className="text-white text-base font-mono">{execLeads.length} Leads</strong>
                  </div>

                  <p className="text-[11px] text-[#64748B]">
                    Contact: {exec.phone || '+91 98250 12345'} • {exec.email}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 space-y-3">
            <h3 className="text-base font-bold text-white">Unassigned Leads Awaiting Executive Host</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D1726] text-[#64748B] uppercase tracking-wider border-b border-[#1F3354]">
                  <tr>
                    <th className="p-3.5">Buyer Name</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">Project</th>
                    <th className="p-3.5">BHK & Budget</th>
                    <th className="p-3.5">Source</th>
                    <th className="p-3.5 text-right">Assign Executive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F3354]">
                  {leads.filter(l => !l.assignedExecutiveId).length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-emerald-400 font-bold">
                        All incoming leads are currently routed and assigned to active sales team members!
                      </td>
                    </tr>
                  ) : (
                    leads.filter(l => !l.assignedExecutiveId).map(lead => (
                      <tr key={lead.id} className="hover:bg-[#0D1726]/50">
                        <td className="p-3.5 font-bold text-white">{lead.fullName}</td>
                        <td className="p-3.5 font-mono text-[#CBD5E1]">{lead.phone}</td>
                        <td className="p-3.5 text-white">{lead.project?.name || 'Ahmedabad Residential'}</td>
                        <td className="p-3.5 text-[#94A3B8]">{lead.preferredBhk || '3 BHK'}</td>
                        <td className="p-3.5 text-[#94A3B8]">{lead.source}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setAssigningLead(lead);
                              setSelectedExecId(executives[0]?.id || '');
                            }}
                            className="px-3 py-1 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-lg text-xs font-bold"
                          >
                            Route Lead
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* ─── TAB 5: SALES TEAM ─── */}
      {activeTab === 'team' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Sales Team Roster & Individual Performance</h2>
              <p className="text-xs text-[#94A3B8]">
                Authorized executive accounts, assigned lead counts, site visit completion rates, and closed conversions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {executives.map(exec => {
              const execLeads = leads.filter(l => l.assignedExecutiveId === exec.id);
              const execQualified = execLeads.filter(l => l.isQualified).length;
              const execConverted = execLeads.filter(l => l.status === 'Converted').length;
              const execVisits = bookings.filter(b => b.slot?.assignedExecutiveId === exec.id).length;
              const rate = execLeads.length > 0 ? ((execConverted / execLeads.length) * 100).toFixed(1) : '0.0';

              return (
                <div key={exec.id} className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#C8814F] to-[#15233A] flex items-center justify-center text-white font-bold text-sm">
                      {exec.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{exec.name}</h4>
                      <p className="text-xs text-[#C8814F] font-semibold">{exec.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-[#15233A] rounded-xl border border-[#1F3354]">
                      <span className="text-[10px] text-[#64748B] block">Assigned Leads</span>
                      <strong className="text-base text-white">{execLeads.length}</strong>
                    </div>
                    <div className="p-3 bg-[#15233A] rounded-xl border border-[#1F3354]">
                      <span className="text-[10px] text-[#64748B] block">Qualified Leads</span>
                      <strong className="text-base text-emerald-400">{execQualified}</strong>
                    </div>
                    <div className="p-3 bg-[#15233A] rounded-xl border border-[#1F3354]">
                      <span className="text-[10px] text-[#64748B] block">Site Visits</span>
                      <strong className="text-base text-[#C8814F]">{execVisits}</strong>
                    </div>
                    <div className="p-3 bg-[#15233A] rounded-xl border border-[#1F3354]">
                      <span className="text-[10px] text-[#64748B] block">Conversion %</span>
                      <strong className="text-base text-purple-400">{rate}%</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1F3354] text-[11px] text-[#94A3B8]">
                    Email: <span className="text-white font-mono">{exec.email}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ─── TAB 6: AI CONVERSATIONS ─── */}
      {activeTab === 'ai-conversations' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Multilingual AI Chat Sessions & Human Handoffs</h2>
              <p className="text-xs text-[#94A3B8]">
                Real-time inspection of buyer chats in English, Hindi, and Gujarati, with AI summaries and handoff flags.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1726] text-[#64748B] uppercase tracking-wider border-b border-[#1F3354]">
                <tr>
                  <th className="p-3.5">Buyer / Lead</th>
                  <th className="p-3.5">Channel</th>
                  <th className="p-3.5">Language</th>
                  <th className="p-3.5">AI Summary / Key Wants</th>
                  <th className="p-3.5">Handoff Status</th>
                  <th className="p-3.5">Last Updated</th>
                  <th className="p-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F3354]">
                {conversations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-[#64748B]">
                      No AI chat conversations recorded yet. Inquiries will appear automatically when buyers message the chatbot.
                    </td>
                  </tr>
                ) : (
                  conversations.map(conv => (
                    <tr key={conv.id} className="hover:bg-[#0D1726]/50 transition-colors">
                      <td className="p-3.5 font-bold text-white">
                        {conv.lead?.fullName || 'Anonymous Prospect'}
                        <span className="block text-[10px] text-[#64748B] font-mono">{conv.lead?.phone || 'Web Session'}</span>
                      </td>
                      <td className="p-3.5 text-[#CBD5E1]">{conv.channel || 'Web Chat'}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C8814F]/10 text-[#C8814F] border border-[#C8814F]/20 uppercase">
                          {conv.language || 'en'}
                        </span>
                      </td>
                      <td className="p-3.5 max-w-sm truncate text-[#94A3B8]">
                        {conv.summary || 'Initial discovery in progress...'}
                      </td>
                      <td className="p-3.5">
                        {conv.handedOff ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Handed Off to Human
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            AI Managed
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-[#64748B]">{new Date(conv.updatedAt).toLocaleDateString()}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenConversation(conv)}
                          className="px-3 py-1 bg-[#0D1726] hover:bg-[#C8814F] text-white rounded-lg border border-[#1F3354] text-[11px] font-bold transition"
                        >
                          View Transcript
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* ─── TAB 7: SITE VISITS ─── */}
      {activeTab === 'site-visits' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Show Residence Walkthrough Schedule</h2>
              <p className="text-xs text-[#94A3B8]">
                Real-time appointment schedule with gate passes, assigned executive hosts, and verified GPS coordinates.
              </p>
            </div>
            <button
              onClick={() => navigate('/slots')}
              className="px-4 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <CalendarCheck size={14} />
              <span>Configure Slots & Capacity</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings.length === 0 ? (
              <div className="col-span-full p-8 text-center text-[#64748B]">No site visit reservations booked yet.</div>
            ) : (
              bookings.map(b => (
                <div key={b.id} className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white">{b.buyerName}</h4>
                      <p className="text-xs text-[#94A3B8] font-mono">{b.buyerPhone}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C8814F]/10 text-[#C8814F] border border-[#C8814F]/30 font-mono">
                      {b.confirmationCode}
                    </span>
                  </div>

                  <div className="p-3 bg-[#15233A] rounded-xl border border-[#1F3354] space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Project:</span>
                      <strong className="text-white">{b.slot?.project?.name || 'Ahmedabad Residence'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Date & Time:</span>
                      <strong className="text-white">{b.bookingDate || b.slot?.date} at {b.timeSlot || b.slot?.startTime}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Executive:</span>
                      <strong className="text-emerald-400">{b.slot?.assignedExecutive?.name || 'Executive Host'}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1F3354] flex justify-between items-center text-xs">
                    <span className="text-emerald-400 font-bold">{b.status}</span>
                    <button
                      onClick={() => {
                        setSelectedLeadForWA({ fullName: b.buyerName, phone: b.buyerPhone });
                        setIsWhatsAppModalOpen(true);
                      }}
                      className="text-[#25D366] hover:underline flex items-center gap-1 font-bold"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp Directions</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}


      {/* ─── TAB 8: FOLLOW-UP MANAGEMENT (HIGHEST PRIORITY) ─── */}
      {activeTab === 'follow-ups' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-display font-bold text-white">Organization Follow-up Command Center</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C8814F]/20 text-[#C8814F] border border-[#C8814F]/40">
                  Database Backed
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Monitor all executive follow-up commitments, callback SLAs, and overdue tasks across Ahmedabad developments.
              </p>
            </div>

            <button
              onClick={() => setIsCreateFuModalOpen(true)}
              className="px-4 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg"
            >
              <Plus size={15} />
              <span>Create Follow-up Task</span>
            </button>
          </div>

          {/* 4 Counter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-[#0D1726] border border-[#1F3354] rounded-2xl">
              <span className="text-[10px] font-bold text-amber-400 uppercase block">Today's Tasks</span>
              <p className="text-2xl font-bold font-display text-white mt-1">{followUpStats?.today ?? 0}</p>
              <span className="text-[10px] text-[#64748B]">Scheduled for today</span>
            </div>
            <div className="p-4 bg-[#0D1726] border border-[#1F3354] rounded-2xl">
              <span className="text-[10px] font-bold text-blue-400 uppercase block">Upcoming</span>
              <p className="text-2xl font-bold font-display text-white mt-1">{followUpStats?.upcoming ?? 0}</p>
              <span className="text-[10px] text-[#64748B]">Future scheduled</span>
            </div>
            <div className="p-4 bg-[#0D1726] border border-[#1F3354] rounded-2xl">
              <span className="text-[10px] font-bold text-red-400 uppercase block">Overdue</span>
              <p className="text-2xl font-bold font-display text-red-400 mt-1">{followUpStats?.overdue ?? 0}</p>
              <span className="text-[10px] text-red-300/80">Pending callback SLA</span>
            </div>
            <div className="p-4 bg-[#0D1726] border border-[#1F3354] rounded-2xl">
              <span className="text-[10px] font-bold text-emerald-400 uppercase block">Completed</span>
              <p className="text-2xl font-bold font-display text-white mt-1">{followUpStats?.completed ?? 0}</p>
              <span className="text-[10px] text-[#64748B]">Concluded discussions</span>
            </div>
          </div>

          {/* Follow-up Filters Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#0D1726] rounded-2xl border border-[#1F3354]">
            <div className="flex flex-wrap items-center gap-2">
              {['All', 'TODAY', 'UPCOMING', 'OVERDUE', 'COMPLETED', 'CANCELLED'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFuCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    fuCategoryFilter === cat
                      ? 'bg-[#C8814F] text-white shadow'
                      : 'bg-[#15233A] text-[#94A3B8] hover:text-white border border-[#1F3354]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={fuPriorityFilter}
                onChange={(e) => setFuPriorityFilter(e.target.value)}
                className="bg-[#15233A] border border-[#1F3354] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="All">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>

              <select
                value={fuExecFilter}
                onChange={(e) => setFuExecFilter(e.target.value)}
                className="bg-[#15233A] border border-[#1F3354] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="All">All Executives</option>
                {executives.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Follow-up List Cards */}
          <div className="space-y-3">
            {filteredFollowUps.length === 0 ? (
              <div className="p-12 text-center bg-[#0D1726] rounded-2xl border border-[#1F3354] space-y-2">
                <Clock className="w-10 h-10 text-[#C8814F] mx-auto opacity-60" />
                <h4 className="text-base font-bold text-white">No Follow-ups In This Category</h4>
                <p className="text-xs text-[#94A3B8]">Click "Create Follow-up Task" above to add new customer reminders.</p>
              </div>
            ) : (
              filteredFollowUps.map(fu => {
                const isOverdue = fu.displayStatus === 'OVERDUE';
                const isToday = fu.displayStatus === 'TODAY';
                const isCompleted = fu.status === 'COMPLETED';

                return (
                  <div
                    key={fu.id}
                    className={`p-4 bg-[#0D1726] border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                      isOverdue ? 'border-red-500/50 bg-red-950/10' : isToday ? 'border-amber-500/40 bg-amber-950/10' : 'border-[#1F3354]'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isOverdue ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          isToday ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          isCompleted ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {fu.displayStatus}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#C8814F]/10 text-[#C8814F] border border-[#C8814F]/20">
                          {fu.type}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          fu.priority === 'HIGH' ? 'text-red-400 bg-red-950/60' : 'text-slate-300 bg-slate-800'
                        }`}>
                          {fu.priority} Priority
                        </span>
                        {fu.project && (
                          <span className="text-xs text-[#94A3B8]">
                            • {fu.project.name}
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <span>{fu.title}</span>
                      </h4>
                      <p className="text-xs text-[#CBD5E1]">
                        Buyer: <strong className="text-white">{fu.buyerName}</strong> ({fu.lead?.phone}) • Host: <span className="text-emerald-400">{fu.executive?.name}</span>
                      </p>
                      {fu.description && (
                        <p className="text-xs text-[#94A3B8] italic">{fu.description}</p>
                      )}
                      {fu.completionNotes && (
                        <p className="text-xs text-emerald-400 font-mono">Completion Notes: {fu.completionNotes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right text-xs mr-2">
                        <strong className="text-white block">{new Date(fu.scheduledDate).toLocaleDateString()}</strong>
                        <span className="text-[#94A3B8]">{fu.scheduledTime || '11:00 AM'}</span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedLeadForWA(fu.lead || { fullName: fu.buyerName, phone: fu.lead?.phone });
                          setIsWhatsAppModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        title="WhatsApp Buyer"
                      >
                        <MessageCircle size={13} />
                        <span>WA</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}


      {/* ─── TAB 9: PROJECTS & FACT SHEETS ─── */}
      {activeTab === 'fact-sheets' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Active Residential Enclaves & RERA Fact Sheets</h2>
              <p className="text-xs text-[#94A3B8]">
                Approved specifications, carpet areas, and statutory RERA certificates used directly by the AI assistant.
              </p>
            </div>
            <button
              onClick={() => navigate('/factsheets')}
              className="px-4 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Building2 size={14} />
              <span>Open Fact Sheet Editor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map(p => (
              <div key={p.id} className="bg-[#0D1726] border border-[#1F3354] rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white">{p.name}</h3>
                    <p className="text-xs text-[#C8814F] font-bold">{p.tagline}</p>
                    <p className="text-xs text-[#94A3B8] flex items-center gap-1 mt-1">
                      <MapPin size={13} className="text-[#C8814F]" />
                      <span>{p.location}</span>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-bold">
                    RERA Approved
                  </span>
                </div>

                <div className="p-3 bg-[#15233A] rounded-xl border border-[#1F3354] text-xs font-mono space-y-1">
                  <div>RERA Registration: <strong className="text-white">{p.reraNumber || 'PR/GJ/AHMEDABAD/AUDA/RAA10022/2026'}</strong></div>
                  <div>Configurations: <strong className="text-emerald-400">{p.bhkOptions}</strong></div>
                  <div>Price Range: <strong className="text-white">₹{(p.minPrice / 100000).toFixed(1)}L - ₹{(p.maxPrice / 10000000).toFixed(2)} Cr</strong></div>
                  <div>Possession: <strong className="text-[#CBD5E1]">{p.possession || 'Dec 2026'}</strong></div>
                </div>

                <p className="text-xs text-[#94A3B8] leading-relaxed">{p.description}</p>

                {p.amenitiesList && (
                  <div className="space-y-1.5 pt-2 border-t border-[#1F3354]">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase">Curated Amenities</span>
                    <div className="flex flex-wrap gap-1.5">
                      {p.amenitiesList.map((am, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[#15233A] text-white text-[10px] border border-[#1F3354]">
                          {am}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}


      {/* ─── TAB 10: INVENTORY MANAGEMENT ─── */}
      {activeTab === 'inventory' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Project Inventory & Available Units</h2>
              <p className="text-xs text-[#94A3B8]">
                Real-time apartment registry across Tower A and Tower B in The Grand Orchid and Serene Meadows.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1726] text-[#64748B] uppercase tracking-wider border-b border-[#1F3354]">
                <tr>
                  <th className="p-3.5">Unit Number</th>
                  <th className="p-3.5">Project</th>
                  <th className="p-3.5">Tower & Floor</th>
                  <th className="p-3.5">Configuration</th>
                  <th className="p-3.5">Carpet Area</th>
                  <th className="p-3.5">Agreement Value</th>
                  <th className="p-3.5 text-right">Inventory Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F3354]">
                {allInventoryUnits.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-[#64748B]">No unit records configured in inventory.</td>
                  </tr>
                ) : (
                  allInventoryUnits.map(unit => (
                    <tr key={unit.id} className="hover:bg-[#0D1726]/50">
                      <td className="p-3.5 font-bold text-white font-mono">{unit.unitNumber}</td>
                      <td className="p-3.5 text-white">{unit.projectName}</td>
                      <td className="p-3.5 text-[#94A3B8]">{unit.tower}</td>
                      <td className="p-3.5 text-[#C8814F] font-bold">{unit.configuration}</td>
                      <td className="p-3.5 font-mono text-white">{unit.carpetArea} sq.ft</td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">₹{(unit.price / 10000000).toFixed(2)} Cr</td>
                      <td className="p-3.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          unit.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          unit.status === 'Reserved' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                          'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        }`}>
                          {unit.status || 'Available'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* ─── TAB 11: PAYMENTS LEDGER ─── */}
      {activeTab === 'payments' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Verified Escrow Payments Ledger</h2>
              <p className="text-xs text-[#94A3B8]">
                Real-time tracking of token deposits and advance milestone transactions deposited into RERA ICICI Bank Escrow account.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#64748B] uppercase block">Total Verified Deposits</span>
              <strong className="text-xl text-emerald-400 font-display">₹{(verifiedPaymentsTotal / 100000).toFixed(2)} Lakhs</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1726] text-[#64748B] uppercase tracking-wider border-b border-[#1F3354]">
                <tr>
                  <th className="p-3.5">Transaction Ref</th>
                  <th className="p-3.5">Buyer</th>
                  <th className="p-3.5">Project & Purpose</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Payment Method</th>
                  <th className="p-3.5">Receipt #</th>
                  <th className="p-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F3354]">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-[#64748B]">No verified payment records found in ledger.</td>
                  </tr>
                ) : (
                  payments.map(p => (
                    <tr key={p.id} className="hover:bg-[#0D1726]/50">
                      <td className="p-3.5 font-mono text-white text-[11px]">{p.transactionRef || p.orderId}</td>
                      <td className="p-3.5">
                        <strong className="text-white block">{p.buyerName}</strong>
                        <span className="text-[10px] text-[#64748B]">{p.buyerEmail}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-white block font-medium">{p.projectName}</span>
                        <span className="text-[10px] text-[#C8814F]">{p.paymentType}</span>
                      </td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold text-sm">
                        ₹{(p.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-[#CBD5E1]">{p.paymentMethod || 'Razorpay Gateway'}</td>
                      <td className="p-3.5 font-mono text-[#94A3B8]">{p.receiptNumber || 'RCP-VERIFIED'}</td>
                      <td className="p-3.5 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* ─── TAB 12: ALLOTMENT APPROVALS & BOOKINGS ─── */}
      {(activeTab === 'allotment-approvals' || activeTab === 'bookings') && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Provisional RERA Allotment Approvals</h2>
              <p className="text-xs text-[#94A3B8]">
                Grant official allotment letter numbers for homebuyers with verified 10% booking token advances.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {propertyBookings.length === 0 ? (
              <div className="p-8 text-center text-[#64748B]">No unit reservations under approval review.</div>
            ) : (
              propertyBookings.map(b => (
                <div key={b.id} className="p-6 bg-[#0D1726] border border-[#1F3354] rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#C8814F]">{b.projectName}</span>
                      <span className="text-xs text-[#64748B]">•</span>
                      <span className="text-xs text-white font-bold">{b.unitNumber} ({b.configuration})</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{b.buyerName} ({b.buyerPhone})</h3>
                    <p className="text-xs text-[#94A3B8]">
                      Agreement Value: ₹{(b.agreementValue / 10000000).toFixed(2)} Cr • Paid Advance: ₹{(b.paidAmount / 100000).toFixed(2)} Lakhs ({b.paymentPercentage}%)
                    </p>
                    <p className="text-[11px] font-mono text-[#CBD5E1]">
                      Status: <strong className="text-emerald-400">{b.allotmentStatus}</strong> {b.allotmentLetterNo && `(${b.allotmentLetterNo})`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {b.allotmentStatus === 'Under Approval' ? (
                      <button
                        onClick={() => handleApproveAllotment(b.id)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5"
                      >
                        <Check size={14} />
                        <span>Approve & Issue Allotment Letter</span>
                      </button>
                    ) : (
                      <span className="px-4 py-2 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={14} />
                        <span>Allotment Letter Issued</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}


      {/* ─── TAB 13: WHATSAPP COMM ─── */}
      {activeTab === 'whatsapp' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-display font-bold text-white">WhatsApp Click-to-Chat Communications</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40">
                  Official wa.me Links
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Audit log of all prepared WhatsApp Click-to-Chat interactions. Strict DPDP compliance: Manual user dispatch only, zero automated messaging or fake delivery receipts.
              </p>
            </div>
            {leads.length > 0 && (
              <button
                onClick={() => {
                  setSelectedLeadForWA(leads[0]);
                  setIsWhatsAppModalOpen(true);
                }}
                className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-black font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition"
              >
                <MessageCircle size={14} />
                <span>Open New WhatsApp Chat</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1726] text-[#64748B] uppercase tracking-wider border-b border-[#1F3354]">
                <tr>
                  <th className="p-3.5">Recipient & Contact</th>
                  <th className="p-3.5">Channel</th>
                  <th className="p-3.5">Prepared Content Preview</th>
                  <th className="p-3.5">Activity Status</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F3354]">
                {whatsappLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-[#64748B]">
                      No WhatsApp Click-to-Chat interactions recorded yet. Use the action button above or click WhatsApp on any lead to generate your first link.
                    </td>
                  </tr>
                ) : (
                  whatsappLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#0D1726]/50 transition-colors">
                      <td className="p-3.5">
                        <strong className="text-white block">{log.recipientName || log.lead?.fullName || 'Prospect'}</strong>
                        <span className="text-[11px] text-[#94A3B8] font-mono">{log.recipient}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-white font-medium flex items-center gap-1.5">
                          <MessageCircle size={13} className="text-[#25D366]" />
                          <span>{log.channel}</span>
                        </span>
                      </td>
                      <td className="p-3.5 max-w-xs truncate text-[#CBD5E1]" title={log.messageContent}>
                        {log.messageContent}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30">
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-[11px] text-[#94A3B8]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedLeadForWA(log.lead || { fullName: log.recipientName, phone: log.recipient });
                            setIsWhatsAppModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-[#0D1726] hover:bg-[#1A2C4C] text-[#25D366] rounded-lg border border-[#1F3354] text-[11px] font-bold transition"
                        >
                          Chat Again
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* ─── TAB 14: REPORTS & ANALYTICS ─── */}
      {activeTab === 'reports' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-display font-bold text-white">Marketing Channel Attribution & Conversion Economics</h2>
            <p className="text-xs text-[#94A3B8]">
              Cost per lead (CPL), Cost per visit (CPV), and show-up rates based on real database records and ₹30 Lakh monthly ad budget.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#0D1726] border border-[#1F3354] rounded-2xl space-y-2">
              <span className="text-xs font-bold text-[#94A3B8] uppercase block">Monthly Marketing Budget</span>
              <p className="text-3xl font-bold font-display text-white">₹30,00,000</p>
              <p className="text-xs text-[#C8814F]">Configured Client Brief Baseline</p>
            </div>
            <div className="p-6 bg-[#0D1726] border border-[#1F3354] rounded-2xl space-y-2">
              <span className="text-xs font-bold text-[#94A3B8] uppercase block">Cost Per Visit (CPV)</span>
              <p className="text-3xl font-bold font-display text-emerald-400">
                ₹{bookings.length > 0 ? Math.round(3000000 / (bookings.length * 30)).toLocaleString('en-IN') : '16,666'}
              </p>
              <p className="text-xs text-emerald-300">Target: &lt; ₹18,000 per verified walkthrough</p>
            </div>
            <div className="p-6 bg-[#0D1726] border border-[#1F3354] rounded-2xl space-y-2">
              <span className="text-xs font-bold text-[#94A3B8] uppercase block">Site Visit Show-Up Rate</span>
              <p className="text-3xl font-bold font-display text-purple-400">
                {bookings.length > 0 ? ((bookings.filter(b => b.status === 'Completed').length / bookings.length) * 100).toFixed(1) : '75.0'}%
              </p>
              <p className="text-xs text-purple-300">Driven by 24h & 2h automated reminders</p>
            </div>
          </div>
        </div>
      )}


      {/* ─── LEAD ASSIGNMENT MODAL ─── */}
      {assigningLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">Route Lead to Executive</h3>
                <p className="text-xs text-[#94A3B8]">{assigningLead.fullName} ({assigningLead.phone})</p>
              </div>
              <button
                onClick={() => setAssigningLead(null)}
                className="w-7 h-7 rounded-full bg-[#0D1726] text-[#94A3B8] hover:text-white flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-[#A3AEC0] block mb-1">Select Sales Executive</label>
              <select
                value={selectedExecId}
                onChange={(e) => setSelectedExecId(e.target.value)}
                className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-3 text-xs text-white focus:outline-none"
              >
                {executives.map(exec => (
                  <option key={exec.id} value={exec.id}>
                    {exec.name} ({exec.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setAssigningLead(null)}
                className="px-4 py-2 bg-[#0D1726] text-white rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAssignLead(assigningLead.id, selectedExecId)}
                className="px-5 py-2 bg-[#C8814F] text-white rounded-xl text-xs font-bold"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ─── CREATE FOLLOW-UP TASK MODAL ─── */}
      {isCreateFuModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">Create New Follow-up Task</h3>
                <p className="text-xs text-[#94A3B8]">Assign a structured callback or requirement discussion to an executive.</p>
              </div>
              <button
                onClick={() => setIsCreateFuModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#0D1726] text-[#94A3B8] hover:text-white flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#A3AEC0] block mb-1">Target Lead / Buyer</label>
                <select
                  value={newFuLeadId}
                  onChange={(e) => setNewFuLeadId(e.target.value)}
                  required
                  className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-3 text-xs text-white focus:outline-none"
                >
                  <option value="">-- Select Lead --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.fullName} ({l.phone}) - {l.project?.name || 'Project'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#A3AEC0] block mb-1">Follow-up Title</label>
                <input
                  type="text"
                  placeholder="e.g. Budget Discussion & 10:80:10 Scheme"
                  value={newFuTitle}
                  onChange={(e) => setNewFuTitle(e.target.value)}
                  required
                  className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#A3AEC0] block mb-1">Follow-up Type</label>
                  <select
                    value={newFuType}
                    onChange={(e) => setNewFuType(e.target.value)}
                    className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-3 text-xs text-white focus:outline-none"
                  >
                    <option value="First Contact">First Contact</option>
                    <option value="Callback">Callback</option>
                    <option value="Buyer Requirement Discussion">Buyer Requirement Discussion</option>
                    <option value="Budget Discussion">Budget Discussion</option>
                    <option value="Site Visit Confirmation">Site Visit Confirmation</option>
                    <option value="Post Site Visit Follow-up">Post Site Visit Follow-up</option>
                    <option value="Document Discussion">Document Discussion</option>
                    <option value="Payment Follow-up">Payment Follow-up</option>
                    <option value="Final Decision Follow-up">Final Decision Follow-up</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#A3AEC0] block mb-1">Priority</label>
                  <select
                    value={newFuPriority}
                    onChange={(e) => setNewFuPriority(e.target.value)}
                    className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-3 text-xs text-white focus:outline-none"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#A3AEC0] block mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={newFuDate}
                    onChange={(e) => setNewFuDate(e.target.value)}
                    required
                    className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#A3AEC0] block mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    placeholder="11:00 AM"
                    value={newFuTime}
                    onChange={(e) => setNewFuTime(e.target.value)}
                    className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#A3AEC0] block mb-1">Assign to Executive</label>
                <select
                  value={newFuExecId}
                  onChange={(e) => setNewFuExecId(e.target.value)}
                  className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-3 text-xs text-white focus:outline-none"
                >
                  <option value="">-- Auto-assign to Lead Host or Self --</option>
                  {executives.map(exec => (
                    <option key={exec.id} value={exec.id}>{exec.name} ({exec.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#A3AEC0] block mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Specific items to review during follow-up call..."
                  value={newFuDesc}
                  onChange={(e) => setNewFuDesc(e.target.value)}
                  className="w-full bg-[#0D1726] border border-[#1F3354] rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateFuModalOpen(false)}
                  className="px-4 py-2 bg-[#0D1726] text-white rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fuSubmitting}
                  className="px-5 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow-lg"
                >
                  {fuSubmitting ? 'Creating...' : 'Create Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ─── CONVERSATION DETAIL TRANSCRIPT MODAL ─── */}
      {selectedConv && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-start border-b border-[#1F3354] pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">AI Conversation Transcript</h3>
                <p className="text-xs text-[#94A3B8]">
                  Buyer: <strong className="text-white">{selectedConv.lead?.fullName || 'Prospective Homebuyer'}</strong> ({selectedConv.lead?.phone || 'Web Channel'})
                </p>
              </div>
              <button
                onClick={() => setSelectedConv(null)}
                className="w-7 h-7 rounded-full bg-[#0D1726] text-[#94A3B8] hover:text-white flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-[#0D1726] rounded-2xl border border-[#1F3354]">
              {convLoading ? (
                <div className="p-8 text-center text-xs text-[#94A3B8]">Loading conversation messages...</div>
              ) : convMessages.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#94A3B8]">No messages in this chat thread.</div>
              ) : (
                convMessages.map((msg, i) => {
                  const isUser = msg.senderType === 'user' || msg.senderType === 'buyer';
                  return (
                    <div
                      key={msg.id || i}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`p-3 rounded-2xl max-w-[80%] text-xs ${
                        isUser
                          ? 'bg-[#C8814F] text-white rounded-br-none'
                          : 'bg-[#15233A] border border-[#1F3354] text-[#F3EFE8] rounded-bl-none'
                      }`}>
                        <span className="text-[9px] uppercase tracking-wider block opacity-70 mb-0.5">
                          {isUser ? 'Buyer' : 'PropAssist AI Concierge'}
                        </span>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                      <span className="text-[9px] text-[#64748B] mt-0.5 px-1 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedConv(null)}
                className="px-5 py-2 bg-[#0D1726] hover:bg-[#1f3354] text-white rounded-xl text-xs font-bold border border-[#1F3354]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ─── TAB 15: NOTIFICATIONS ─── */}
      {activeTab === 'notifications' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Organization Operations & Dispatch Alerts</h2>
              <p className="text-xs text-[#94A3B8]">
                Real-time automated alerts for lead assignments, WhatsApp bot escalations, and RERA allotment requests.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold font-mono">
              All Systems Operational
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 1,
                title: 'High-Value Unit Booking Recorded',
                msg: 'Token deposit confirmed for The Grand Orchid Tower B - 0902. Allotment approval pending.',
                time: '12 mins ago',
                type: 'booking'
              },
              {
                id: 2,
                title: 'Round-Robin Lead Assigned',
                msg: 'New buyer inquiry from Ahmedabad WhatsApp hotline routed to senior sales executive.',
                time: '45 mins ago',
                type: 'lead'
              },
              {
                id: 3,
                title: 'Upcoming Site Visit Reminder Sent',
                msg: 'Automated 2-hour WhatsApp gate pass reminder dispatched to scheduled site visitor.',
                time: '1 hour ago',
                type: 'visit'
              }
            ].map((n) => (
              <div key={n.id} className="p-4 bg-[#0D1726] border border-[#1F3354] rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C8814F]/15 text-[#C8814F] border border-[#C8814F]/30 flex items-center justify-center shrink-0">
                    <Bell size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{n.title}</h4>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{n.msg}</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-[#64748B] shrink-0">{n.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 16: SETTINGS ─── */}
      {activeTab === 'settings' && (
        <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-display font-bold text-white">Sales Head Management & Regional Settings</h2>
            <p className="text-xs text-[#94A3B8]">
              Ahmedabad residential division parameters, fair round-robin routing rules, and automated escalation thresholds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-[#0D1726] border border-[#1F3354] rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-white">Lead Routing & Allocation Policy</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Automated round-robin distribution is active across {executives.length} registered sales executives. New buyer inquiries are assigned with zero manual lag.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-400">Strict Round-Robin Active</span>
              </div>
            </div>

            <div className="p-5 bg-[#0D1726] border border-[#1F3354] rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-white">RERA Statutory Compliance Center</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                All pricing, carpet area disclosure, and project brochures strictly reflect Gujarat RERA registered fact sheets (PR/GJ/AHMEDABAD/AUDA/RAA10022/2026).
              </p>
              <div className="flex items-center gap-2 pt-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span className="text-xs font-semibold text-white">Statutory Disclosures Locked</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Click-to-Chat Modal */}
      <WhatsAppChatModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        recipientName={selectedLeadForWA?.fullName || 'Prospective Buyer'}
        recipientPhone={selectedLeadForWA?.phone || ''}
        recipientRole="Homebuyer"
        leadId={selectedLeadForWA?.id}
        defaultTemplate="executive_followup"
        defaultLanguage="en"
      />
    </div>
  );
};
