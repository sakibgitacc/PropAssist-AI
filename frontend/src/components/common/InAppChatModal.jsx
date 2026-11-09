import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  X,
  Send,
  MessageSquare,
  Clock,
  Check,
  CheckCheck,
  User,
  Shield,
  CircleDot
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getInAppMessages,
  sendInAppMessage,
  markInAppMessagesRead,
  initiateInAppConversation
} from '../../services/extendedApi';

export const InAppChatModal = ({
  isOpen,
  onClose,
  conversationId: initialConvId = null,
  leadId = null,
  participantName = 'Dedicated Advisor',
  participantRole = 'Sales Executive'
}) => {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState(initialConvId);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTypingUser, setRemoteTypingUser] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, remoteTypingUser]);

  // Ensure conversation exists
  useEffect(() => {
    if (!isOpen) return;

    const setupConversation = async () => {
      setLoading(true);
      try {
        let activeId = initialConvId;
        if (!activeId && leadId) {
          const initRes = await initiateInAppConversation({ leadId });
          if (initRes.success && initRes.conversation) {
            activeId = initRes.conversation.id;
            setConversationId(activeId);
          }
        }

        if (activeId) {
          const msgRes = await getInAppMessages(activeId);
          if (msgRes.success) {
            setMessages(msgRes.messages || []);
          }
          await markInAppMessagesRead(activeId);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setLoading(false);
      }
    };

    setupConversation();
  }, [isOpen, initialConvId, leadId]);

  // Socket.IO Setup
  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const token = localStorage.getItem('propassist_token');
    const rawApiUrl = import.meta.env.VITE_API_URL;
    const socketOrigin = rawApiUrl ? rawApiUrl.replace(/\/api\/?$/, '') : window.location.origin;

    const socket = io(socketOrigin, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join_conversation', { conversationId });
      socket.emit('mark_read', { conversationId });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('new_message', (newMsg) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // If user receives a message while viewing, mark as read
      if (newMsg.senderType !== (user?.role === 'BUYER' ? 'buyer' : 'executive')) {
        socket.emit('mark_read', { conversationId });
      }
    });

    socket.on('user_typing', ({ userName, isTyping: remoteIsTyping }) => {
      if (remoteIsTyping) {
        setRemoteTypingUser(userName || 'Advisor');
      } else {
        setRemoteTypingUser('');
      }
    });

    socket.on('messages_read', () => {
      setMessages((prev) =>
        prev.map((m) => ({ ...m, isRead: true, readAt: m.readAt || new Date().toISOString() }))
      );
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_conversation', { conversationId });
        socketRef.current.disconnect();
      }
    };
  }, [isOpen, conversationId, user]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    // Emit typing event with debounce
    if (socketRef.current && socketConnected && conversationId) {
      if (!isTyping) {
        setIsTyping(true);
        socketRef.current.emit('typing', { conversationId, isTyping: true });
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        if (socketRef.current) {
          socketRef.current.emit('typing', { conversationId, isTyping: false });
        }
      }, 1500);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !conversationId) return;

    const content = inputText.trim();
    setInputText('');

    // Clear typing immediately
    if (socketRef.current && isTyping) {
      setIsTyping(false);
      socketRef.current.emit('typing', { conversationId, isTyping: false });
    }

    // Prefer Socket.IO
    if (socketRef.current && socketConnected) {
      socketRef.current.emit('send_message', {
        conversationId,
        content
      });
    } else {
      // REST API fallback
      try {
        const res = await sendInAppMessage(conversationId, { content });
        if (res.success && res.message) {
          setMessages((prev) => [...prev, res.message]);
        }
      } catch (err) {
        console.error('Failed to send in-app message:', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0F1927] border border-[#1F3354] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1F3354] flex items-center justify-between bg-[#15233A]/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-[#C8814F]/20 border border-[#C8814F]/40 flex items-center justify-center text-[#C8814F] font-bold text-sm">
                <User className="w-5 h-5" />
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0F1927] ${
                  socketConnected ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
                title={socketConnected ? 'Real-time WebSocket Connected' : 'Polling Sync Mode'}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">{participantName}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1F3354] text-[#CBD5E1]">
                  {participantRole}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <CircleDot className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                <span>Private Consultation Thread</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#1F3354] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#09111D]/60">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8814F]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#64748B]">
              <MessageSquare className="w-10 h-10 mb-2 opacity-40 text-[#C8814F]" />
              <p className="text-xs font-semibold text-[#CBD5E1]">Direct Consultation Thread</p>
              <p className="text-[11px] mt-1 max-w-xs">
                Start exchanging real-time messages regarding pricing, unit availability, and floor plan details.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine =
                (user?.role === 'BUYER' && msg.senderType === 'buyer') ||
                (user?.role !== 'BUYER' && msg.senderType !== 'buyer');

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} text-xs`}
                >
                  <span className="text-[10px] text-[#64748B] mb-0.5 px-1 font-medium">
                    {isMine ? 'You' : msg.senderName || participantName}
                  </span>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl leading-relaxed ${
                      isMine
                        ? 'bg-[#C8814F] text-white rounded-tr-xs shadow-md'
                        : 'bg-[#15233A] text-[#F3EFE8] border border-[#1F3354] rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <div
                      className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                        isMine ? 'text-white/80' : 'text-[#94A3B8]'
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {isMine && (
                        <span>
                          {msg.isRead ? (
                            <CheckCheck className="w-3 h-3 text-cyan-200" title="Read" />
                          ) : (
                            <Check className="w-3 h-3 opacity-80" title="Sent" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {remoteTypingUser && (
            <div className="flex items-center gap-2 text-[11px] text-[#C8814F] italic py-1 px-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#C8814F]" />
              <span>{remoteTypingUser} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-[#1F3354] bg-[#15233A]/60 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type your message to advisor..."
            className="flex-1 px-4 py-2.5 bg-[#09111D] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F] placeholder-[#64748B]"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default InAppChatModal;

