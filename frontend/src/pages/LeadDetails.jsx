import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Badge } from '../components/ui/Badge';
import {
  Phone,
  Mail,
  Building,
  Calendar,
  Clock,
  Video,
  UserCheck,
  Send,
  MessageSquare,
  MessageCircle,
  FileText,
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  Sparkles
} from 'lucide-react';
import WhatsAppChatModal from '../components/common/WhatsAppChatModal';
import InAppChatModal from '../components/common/InAppChatModal';

export const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [callStarting, setCallStarting] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isInAppChatOpen, setIsInAppChatOpen] = useState(false);

  const fetchLeadDetails = async () => {
    try {
      const [leadRes, execRes] = await Promise.all([
        api.get(`/leads/${id}`),
        api.get('/auth/executives')
      ]);
      if (leadRes.data.success) setLead(leadRes.data.lead);
      if (execRes.data.success) setExecutives(execRes.data.executives);
    } catch (err) {
      setError('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await api.put(`/leads/${id}`, { status: newStatus });
      if (res.data.success) {
        setLead({ ...lead, status: newStatus });
      }
    } catch {
      alert('Failed to update status');
    }
  };

  const handleAssignExecutive = async (execId) => {
    try {
      const res = await api.post(`/leads/${id}/assign`, { executiveId: execId });
      if (res.data.success) {
        fetchLeadDetails();
      }
    } catch {
      alert('Failed to assign executive');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim() || submittingNote) return;

    setSubmittingNote(true);
    try {
      const res = await api.post(`/leads/${id}/notes`, { content: noteContent });
      if (res.data.success) {
        setNoteContent('');
        fetchLeadDetails();
      }
    } catch {
      alert('Failed to add internal note');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleStartCall = async (callType) => {
    setCallStarting(true);
    try {
      const res = await api.post('/calls/start', {
        leadId: lead.id,
        callType
      });

      if (res.data.success) {
        // Navigate directly to the in-app Jitsi call page
        navigate(res.data.joinUrls.executive);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start meeting session');
    } finally {
      setCallStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8814F]"></div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-rose-400 font-semibold text-sm">{error || 'Lead not found'}</p>
        <button
          onClick={() => navigate('/leads')}
          className="text-[#C8814F] hover:underline text-xs font-medium"
        >
          &larr; Back to Leads Pipeline
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#F3EFE8]">
      {/* Back button & top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/leads')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] hover:text-[#C8814F]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Leads</span>
        </button>

        {/* Communication & Call Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp Click-to-Chat Button */}
          <button
            onClick={() => setIsWhatsAppOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] rounded-xl text-xs font-bold transition-all shadow-sm"
            title="Open official WhatsApp Click-to-Chat (wa.me)"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          {/* In-App Real-time Chat Button */}
          <button
            onClick={() => setIsInAppChatOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#15233A] hover:bg-[#1A2C4C] border border-[#1F3354] text-[#CBD5E1] rounded-xl text-xs font-semibold transition-all"
            title="Open in-app real-time chat with buyer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#C8814F]" />
            <span>In-App Chat</span>
          </button>

          <button
            onClick={() => handleStartCall('video')}
            disabled={callStarting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video Call</span>
          </button>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1F3354]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0D1726] border border-[#C8814F]/40 flex items-center justify-center font-bold text-lg text-[#C8814F]">
              {lead.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white">{lead.fullName}</h1>
                <Badge variant={lead.status}>{lead.status}</Badge>
                {lead.isQualified && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    AI Qualified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#94A3B8] mt-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#C8814F]" /> {lead.phone}
                </span>
                {lead.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-[#94A3B8]" /> {lead.email}
                  </span>
                )}
                <span className="text-[#64748B]">Source: <span className="font-semibold text-[#CBD5E1]">{lead.source}</span></span>
              </div>
            </div>
          </div>

          {/* Quick status selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#94A3B8]">Pipeline Status:</label>
            <select
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs bg-[#0D1726] border border-[#1F3354] rounded-xl px-3 py-1.5 font-semibold text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
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
          </div>
        </div>

        {/* Requirements & Host Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 text-xs">
          <div className="p-4 bg-[#0D1726] rounded-2xl border border-[#1F3354]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Project Interest</span>
            <p className="font-bold text-white mt-0.5 text-sm">{lead.project?.name || 'General Inquiries'}</p>
            <p className="text-[11px] text-[#94A3B8]">{lead.project?.location || 'Ahmedabad, Gujarat'}</p>
          </div>

          <div className="p-4 bg-[#0D1726] rounded-2xl border border-[#1F3354]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Configuration & Budget</span>
            <p className="font-bold text-white mt-0.5 text-sm">{lead.preferredBhk || 'Any BHK'}</p>
            <p className="text-[11px] text-[#94A3B8]">
              {lead.budgetMin ? `₹${(lead.budgetMin / 100000).toFixed(0)}L` : 'Flexible'}
              {lead.budgetMax ? ` - ₹${(lead.budgetMax / 100000).toFixed(0)}L` : ''}
            </p>
          </div>

          <div className="p-4 bg-[#0D1726] rounded-2xl border border-[#1F3354]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Assigned Executive</span>
            <div className="mt-1">
              <select
                value={lead.assignedExecutiveId || ''}
                onChange={(e) => handleAssignExecutive(e.target.value)}
                className="w-full text-xs bg-[#15233A] border border-[#1F3354] rounded-lg px-2 py-1 font-semibold text-[#CBD5E1] focus:outline-none focus:border-[#C8814F]"
              >
                <option value="">Select Executive</option>
                {executives.map(exec => (
                  <option key={exec.id} value={exec.id}>{exec.name}</option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">Host for site visits & calls</p>
          </div>

          <div className="p-4 bg-[#0D1726] rounded-2xl border border-[#1F3354]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Purchase Timeline</span>
            <p className="font-bold text-white mt-0.5 text-sm">{lead.timeline || 'Exploring'}</p>
            <p className="text-[11px] text-[#94A3B8]">Registered: {new Date(lead.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Conversation History & Internal Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: AI & Buyer Chat History */}
        <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] shadow-xl overflow-hidden flex flex-col h-[520px]">
          <div className="p-4 border-b border-[#1F3354] flex items-center justify-between bg-[#0D1726]/60">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C8814F]" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Live Chat History</h2>
            </div>
            <span className="text-[10px] text-[#94A3B8]">
              {lead.conversations?.length || 0} conversation thread(s)
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0D1726]/40">
            {lead.conversations?.length === 0 || lead.conversations[0]?.messages?.length === 0 ? (
              <p className="text-center text-xs text-[#64748B] py-12">No chat messages recorded yet.</p>
            ) : (
              lead.conversations[0]?.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.senderType === 'buyer' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-[#64748B] mb-0.5 px-1 font-medium">
                    {msg.senderName || msg.senderType}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                      msg.senderType === 'buyer'
                        ? 'bg-[#C8814F] text-white rounded-br-none'
                        : 'bg-[#15233A] border border-[#1F3354] text-[#F3EFE8] rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <span className="text-[9px] text-[#64748B] mt-0.5 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Internal Notes & Scheduled Site Visits */}
        <div className="space-y-6">
          {/* Site Visit Bookings */}
          <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F3354]">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-[#C8814F]" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Confirmed Site Visits</h2>
              </div>
              <button
                onClick={() => navigate('/book-visit')}
                className="text-xs font-bold text-[#C8814F] hover:underline"
              >
                + Schedule
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {lead.bookings?.length === 0 ? (
                <p className="text-xs text-[#64748B] py-3 text-center">No site visit booked yet.</p>
              ) : (
                lead.bookings.map((b) => (
                  <div key={b.id} className="p-3 bg-[#0D1726] border border-[#1F3354] rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{b.bookingDate} ({b.timeSlot})</p>
                      <p className="text-[11px] text-[#C8814F] font-mono mt-0.5">Code: {b.confirmationCode}</p>
                    </div>
                    <Badge variant={b.status}>{b.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Internal Notes & Timeline */}
          <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] p-5 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1F3354]">
              <FileText className="w-4 h-4 text-[#C8814F]" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Executive Internal Notes</h2>
            </div>

            <form onSubmit={handleAddNote} className="mt-3 space-y-2">
              <textarea
                rows="2"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Log call updates, buyer objections, or next steps..."
                className="w-full p-2.5 text-xs bg-[#0D1726] border border-[#1F3354] rounded-xl focus:outline-none focus:border-[#C8814F] text-[#F3EFE8]"
              ></textarea>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingNote || !noteContent.trim()}
                  className="px-3.5 py-1.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                >
                  {submittingNote ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </form>

            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {lead.internalNotes?.length === 0 ? (
                <p className="text-xs text-[#64748B] text-center py-2">No internal notes logged.</p>
              ) : (
                lead.internalNotes.map((note) => (
                  <div key={note.id} className="p-3 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs">
                    <p className="text-[#CBD5E1]">{note.content}</p>
                    <div className="flex items-center justify-between text-[10px] text-[#64748B] mt-1.5">
                      <span>By: {note.author?.name || 'Executive'}</span>
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* WhatsApp Click-to-Chat Modal */}
      <WhatsAppChatModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        recipientName={lead?.fullName || 'Prospective Homebuyer'}
        recipientPhone={lead?.phone || ''}
        recipientRole="Prospective Buyer"
        leadId={lead?.id}
        defaultTemplate="executive_followup"
        defaultLanguage="en"
      />

      {/* In-App Real-Time Chat Modal */}
      <InAppChatModal
        isOpen={isInAppChatOpen}
        onClose={() => setIsInAppChatOpen(false)}
        leadId={lead?.id}
        participantName={lead?.fullName || 'Prospective Buyer'}
        participantRole="Homebuyer"
      />
    </div>
  );
};
