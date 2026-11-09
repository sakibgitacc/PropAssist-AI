import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import {
  Briefcase, Users, MessageSquare, Video, Send,
  CalendarCheck, Phone, Sparkles, ArrowRight, Clock, CheckCircle2,
  AlertCircle, ShieldCheck, Zap, ExternalLink, MessageCircle
} from 'lucide-react';
import WhatsAppChatModal from '../components/common/WhatsAppChatModal';

export const SalesExecutiveWorkspace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [startingCall, setStartingCall] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const fetchWorkspaceData = async () => {
    try {
      const res = await api.get('/ai/conversations');
      if (res.data.success) {
        setConversations(res.data.conversations);
        if (res.data.conversations.length > 0 && !selectedConv) {
          selectConversation(res.data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (convId) => {
    setSelectedConv(convId);
    try {
      const res = await api.get(`/ai/conversations/${convId}`);
      if (res.data.success) {
        setActiveThread(res.data.conversation);
      }
    } catch (err) {
      console.error('Error loading thread:', err);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || sending || !selectedConv) return;

    setSending(true);
    try {
      const res = await api.post('/ai/chat', {
        conversationId: selectedConv,
        message: replyText,
        language: activeThread?.language || 'en'
      });

      if (res.data.success) {
        setReplyText('');
        selectConversation(selectedConv);
      }
    } catch {
      alert('Failed to send reply message');
    } finally {
      setSending(false);
    }
  };

  const handleStartCall = async (callType) => {
    if (!activeThread?.leadId) {
      alert('No lead record associated with this inquiry to start meeting');
      return;
    }

    setStartingCall(true);
    try {
      const res = await api.post('/calls/start', {
        leadId: activeThread.leadId,
        callType
      });

      if (res.data.success) {
        navigate(res.data.joinUrls.executive);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start meeting');
    } finally {
      setStartingCall(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!activeThread?.leadId) return;
    try {
      await api.patch(`/leads/${activeThread.leadId}`, { status: newStatus });
      selectConversation(selectedConv);
    } catch {
      alert('Failed to update lead status');
    }
  };

  const handleOpenWhatsApp = () => {
    if (!activeThread?.lead?.phone) return;
    setIsWhatsAppOpen(true);
  };

  return (
    <div className="space-y-6 text-[#F3EFE8]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Sales Executive Workspace</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#C8814F]/20 text-[#C8814F] text-[10px] font-bold border border-[#C8814F]/30 uppercase tracking-wider">
              11-Executive Dedicated Team
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Real-time lead response console, AI handoffs, DPDP WhatsApp templates, and instant video consultations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-semibold border border-emerald-500/30">
            <Zap className="w-3.5 h-3.5" />
            <span>SLA Target: &lt; 2 Minutes</span>
          </div>
          <Badge variant={user?.role}>{user?.name || 'Rahul Sharma'}</Badge>
        </div>
      </div>

      {/* Main Grid: Inbox + Live Conversation & Buyer Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[660px]">
        
        {/* Left Column: Handed-Off Conversations Inbox */}
        <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] shadow-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#1F3354] flex items-center justify-between bg-[#0D1726]/60">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Assigned Inquiries ({conversations.length})
              </h2>
            </div>
            <span className="text-[10px] text-[#C8814F] font-bold">Priority Queue</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#1F3354]">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#64748B]">Loading inbox threads...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">No active conversations.</div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConv === conv.id;
                const lastMsg = conv.messages?.[0];

                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full p-4 text-left transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-[#1F3354] border-l-4 border-[#C8814F]'
                        : 'hover:bg-[#1A2C4C]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white truncate">
                        {conv.lead?.fullName || 'Website Guest Inquirer'}
                      </span>
                      {conv.handedOff && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold animate-pulse">
                          Human Handoff
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#94A3B8] truncate">
                      {lastMsg?.content || 'Buyer inquired on project details'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-1">
                      <span className="font-semibold text-[#CBD5E1]">{conv.lead?.project?.name || 'Ahmedabad Residence'}</span>
                      <span className="font-mono text-emerald-400 font-bold">SLA &lt; 2m</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Live Chat Thread & Video Call Action */}
        <div className="lg:col-span-2 bg-[#15233A] rounded-3xl border border-[#1F3354] shadow-xl flex flex-col overflow-hidden">
          {activeThread ? (
            <>
              {/* Top Thread Header */}
              <div className="p-4 border-b border-[#1F3354] flex flex-wrap items-center justify-between bg-[#0D1726]/60 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white">
                      {activeThread.lead?.fullName || 'Anonymous Buyer'}
                    </h2>
                    <select
                      value={activeThread.lead?.status || 'New'}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#0D1726] border border-[#1F3354] text-[#CBD5E1] focus:outline-none focus:border-[#C8814F]"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Visit Scheduled">Visit Scheduled</option>
                      <option value="Visit Completed">Visit Completed</option>
                      <option value="Converted">Converted</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] flex items-center gap-2 mt-0.5">
                    {activeThread.lead?.phone && <span>Tel: {activeThread.lead.phone}</span>}
                    {activeThread.lead?.project && <span>• {activeThread.lead.project.name}</span>}
                    {activeThread.lead?.source && (
                      <span className="px-1.5 py-0.2 rounded bg-[#0D1726] text-[#CBD5E1] font-mono text-[9px] border border-[#1F3354]">
                        via {activeThread.lead.source}
                      </span>
                    )}
                  </p>
                </div>

                {/* Instant Communication CTAs */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenWhatsApp}
                    disabled={!activeThread.lead?.phone}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    title="Send DPDP Compliant WhatsApp Message"
                  >
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleStartCall('video')}
                    disabled={startingCall || !activeThread.leadId}
                    className="px-3 py-1.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40"
                    title="Start Live Jitsi Video Tour"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Video Tour</span>
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0D1726]/40">
                {activeThread.summary && (
                  <div className="p-3 bg-[#C8814F]/10 border border-[#C8814F]/30 rounded-2xl text-xs text-[#F3EFE8]">
                    <p className="font-bold flex items-center gap-1 text-[#C8814F]">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Conversation Brief & Buyer Requirements:
                    </p>
                    <p className="mt-0.5 text-[#CBD5E1] text-[11px] leading-relaxed">
                      {activeThread.summary}
                    </p>
                  </div>
                )}

                {activeThread.messages?.map((msg) => {
                  const isBuyer = msg.senderType === 'buyer';
                  const isAi = msg.senderType === 'ai';

                  return (
                    <div key={msg.id} className={`flex flex-col ${isBuyer ? 'items-start' : 'items-end'}`}>
                      <span className="text-[10px] text-[#64748B] mb-0.5 px-1 font-medium">
                        {msg.senderName || msg.senderType}
                      </span>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                          isBuyer
                            ? 'bg-[#15233A] border border-[#1F3354] text-[#F3EFE8] rounded-bl-none'
                            : isAi
                            ? 'bg-[#0D1726] text-[#CBD5E1] border border-[#1F3354] rounded-br-none'
                            : 'bg-[#C8814F] text-white rounded-br-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <span className="text-[9px] text-[#64748B] mt-0.5 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Executive Reply Form */}
              <div className="p-4 border-t border-[#1F3354] bg-[#15233A]">
                <form onSubmit={handleSendReply} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type executive message to continue consultation with buyer..."
                    className="flex-1 px-4 py-2.5 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] placeholder-[#64748B] focus:outline-none focus:border-[#C8814F]"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="p-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl shadow-sm transition-all disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[#64748B]">
              Select an inquiry thread from the left to view buyer history and take over conversation.
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Click-to-Chat Modal */}
      <WhatsAppChatModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        recipientName={activeThread?.lead?.fullName || 'Prospective Homebuyer'}
        recipientPhone={activeThread?.lead?.phone || ''}
        recipientRole="Assigned Lead"
        leadId={activeThread?.leadId}
        defaultTemplate="executive_followup"
        defaultLanguage="en"
      />
    </div>
  );
};
