import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  Sparkles,
  Send,
  User,
  Bot,
  Globe,
  Calendar,
  CheckCircle,
  PhoneForwarded,
  ArrowRight,
  ShieldCheck,
  Building2
} from 'lucide-react';

export const AiChatbotPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      senderType: 'ai',
      senderName: 'PropAssist AI Advisor',
      content:
        'Namaste! Welcome to PropAssist AI. I am your verified residential property advisor for The Grand Orchid (SG Highway) and Serene Meadows (South Bopal) in Ahmedabad.\n\nI can assist you with approved carpet area pricing, 2 & 3 BHK configurations, RERA registrations, or schedule your private site visit.',
      createdAt: new Date().toISOString()
    }
  ]);

  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [language, setLanguage] = useState('en'); // 'en' | 'hi' | 'gu'
  const [loading, setLoading] = useState(false);
  const [handoffNotice, setHandoffNotice] = useState(null);

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      senderType: 'buyer',
      senderName: 'You (Buyer)',
      content: text,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        conversationId,
        message: text,
        language
      });

      if (res.data.success) {
        if (!conversationId) {
          setConversationId(res.data.conversationId);
        }

        const aiMsg = {
          id: `ai-${Date.now()}`,
          senderType: 'ai',
          senderName: 'PropAssist AI Advisor',
          content: res.data.reply,
          language: res.data.language,
          toolCalls: res.data.toolCalls,
          createdAt: new Date().toISOString()
        };

        setMessages((prev) => [...prev, aiMsg]);

        if (res.data.handoff) {
          setHandoffNotice(res.data.handoff);
        }
      }
    } catch (err) {
      const errorMsg = {
        id: `err-${Date.now()}`,
        senderType: 'ai',
        senderName: 'System',
        content:
          'Our AI property advisor is temporarily recalibrating. Please try again or book a private site visit directly.',
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPromptsByLang = {
    en: [
      { label: "The Grand Orchid 3 BHK?", query: "What is the price and carpet area of 3 BHK in The Grand Orchid Residences on SG Highway?" },
      { label: "Serene Meadows in Bopal?", query: "Tell me about Serene Meadows in South Bopal, amenities and 2 BHK pricing." },
      { label: "Book a Site Visit", query: "Can I check available site visit slots for this weekend in Ahmedabad?" },
      { label: "Handover Guarantee", query: "Explain the December 2026 possession and RERA handover guarantee." },
      { label: "Talk to Human Executive", query: "I would like to speak with a human sales executive." }
    ],
    hi: [
      { label: "एसजी हाईवे 3 BHK", query: "एसजी हाईवे पर द ग्रैंड ऑर्किड में 3 BHK की शुरुआती कीमत और कारपेट एरिया क्या है?" },
      { label: "सेरेन मीडोज 2 BHK", query: "साउथ भोपाल में सेरेन मीडोज 2 BHK की कीमत, फ्लोर प्लान और सुविधाएं क्या हैं?" },
      { label: "साइट विजिट स्लॉट्स", query: "क्या मैं इस वीकेंड के लिए अहमदाबाद प्रोजेक्ट्स की साइट विजिट बुक कर सकता हूँ?" },
      { label: "हैंडओवर गारंटी", query: "रेरा नियमों के तहत दिसंबर 2026 की पजेशन व हैंडओवर गारंटी के बारे में बताएं।" },
      { label: "ह्यूमन एग्जीक्यूटिव से बात", query: "मैं किसी सीनियर सेल्स एग्जीक्यूटिव से सीधे बात करना चाहता हूँ।" }
    ],
    gu: [
      { label: "એસજી હાઈવે 3 BHK", query: "એસજી હાઈવે પર ધ ગ્રાન્ડ ઓર્કિડમાં 3 BHK ની શરૂઆતી કિંમત અને કાર્પેટ એરિયા શું છે?" },
      { label: "સિરીન મેડોઝ 2 BHK", query: "સાઉથ બોપલમાં સિરીન મેડોઝ 2 BHK નો ભાવ, ફ્લોર પ્લાન અને સુવિધાઓ જણાવો." },
      { label: "સાઇટ વિઝિટ સ્લોટ્સ", query: "શું હું આ સપ્તાહના અંતે અમદાવાદ પ્રોજેક્ટ્સ માટે સાઇટ વિઝિટ બુક કરાવી શકું?" },
      { label: "હેન્ડઓવર ગેરંટી", query: "રેરા નિયમો હેઠળ ડિસેમ્બર 2026 ની પઝેશન અને હેન્ડઓવર ગેરંટી સમજાવો." },
      { label: "સેલ્સ એક્ઝિક્યુટિવ સાથે વાત", query: "હું સીનિયર સેલ્સ એક્ઝિક્યુટિવ સાથે સીધી વાતચીત કરવા માંગુ છું." }
    ]
  };

  const activePrompts = quickPromptsByLang[language] || quickPromptsByLang.en;

  return (
    <div className="max-w-4xl mx-auto space-y-4 text-[#F3EFE8]">
      {/* Header with Language Selector */}
      <div className="bg-[#15233A] p-4 rounded-3xl border border-[#1F3354] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C8814F] to-[#8C5229] flex items-center justify-center text-white shadow-lg shadow-[#C8814F]/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              PropAssist AI Multilingual Assistant
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Online
              </span>
            </h1>
            <p className="text-xs text-[#94A3B8]">Grounded in verified Ahmedabad project fact sheets</p>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 bg-[#0D1726] p-1 rounded-2xl border border-[#1F3354] text-xs font-semibold">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              language === 'en' ? 'bg-[#C8814F] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              language === 'hi' ? 'bg-[#C8814F] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            हिन्दी (Hindi)
          </button>
          <button
            onClick={() => setLanguage('gu')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              language === 'gu' ? 'bg-[#C8814F] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            ગુજરાતી (Gujarati)
          </button>
        </div>
      </div>

      {/* Human Handoff Banner */}
      {handoffNotice && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs text-emerald-200 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <PhoneForwarded className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white">Human Executive Handoff Activated</p>
              <p className="text-[11px] text-[#CBD5E1]">
                Assigned Host: <span className="font-semibold text-[#C8814F]">{handoffNotice.executiveName}</span> ({handoffNotice.executivePhone}). Your chat history has been securely shared.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/workspace')}
            className="px-3.5 py-1.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl font-bold text-xs shadow-md transition-all"
          >
            View in Workspace
          </button>
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] shadow-xl flex flex-col h-[520px] overflow-hidden">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#0D1726]/50">
          {messages.map((m) => {
            const isUser = m.senderType === 'buyer';
            return (
              <div key={m.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-[#C8814F] text-white'
                      : 'bg-[#15233A] border border-[#1F3354] text-[#C8814F]'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-[#C8814F]" />}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[80%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 px-1 text-[10px] text-[#64748B]">
                    <span className="font-semibold text-[#CBD5E1]">{m.senderName}</span>
                    <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-md ${
                      isUser
                        ? 'bg-[#C8814F] text-white rounded-tr-none'
                        : 'bg-[#15233A] border border-[#1F3354] text-[#F3EFE8] rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>

                    {/* Tool Call / Action Card */}
                    {m.toolCalls && (
                      <div className="mt-3 pt-2.5 border-t border-[#1F3354] flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[#C8814F] flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Action: {m.toolCalls.action.replace('_', ' ')}
                        </span>
                        {m.toolCalls.action === 'check_slots' && (
                          <button
                            onClick={() => navigate('/book-visit')}
                            className="text-xs font-bold text-[#C8814F] hover:underline"
                          >
                            Book Slot &rarr;
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-[#15233A] border border-[#1F3354] flex items-center justify-center text-[#C8814F] text-xs">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-[#15233A] border border-[#1F3354] rounded-2xl rounded-tl-none px-4 py-2.5 text-xs text-[#CBD5E1] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C8814F] animate-pulse"></span>
                <span>PropAssist AI is formulating fact-grounded response...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 border-t border-[#1F3354] bg-[#15233A] flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider shrink-0 pl-1">
            {language === 'hi' ? 'सुझाव:' : language === 'gu' ? 'સૂચનો:' : 'Suggestions:'}
          </span>
          {activePrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q.query)}
              className="px-3 py-1 rounded-full bg-[#0D1726] hover:bg-[#1A2C4C] border border-[#1F3354] hover:border-[#C8814F] text-[#CBD5E1] whitespace-nowrap transition-all text-xs"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[#1F3354] bg-[#15233A]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                language === 'gu'
                  ? 'અહીં પ્રશ્ન લખો (દા.ત. The Grand Orchid ની કિંમત અને સ્લોટ્સ)...'
                  : language === 'hi'
                  ? 'यहाँ प्रश्न लिखें (उदा. The Grand Orchid की कीमत और स्लॉट्स)...'
                  : 'Ask about pricing, BHK configurations, amenities, or site visit slots...'
              }
              className="flex-1 px-4 py-3 text-xs bg-[#0D1726] border border-[#1F3354] rounded-xl focus:outline-none focus:border-[#C8814F] text-[#F3EFE8] placeholder-[#64748B]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl shadow-md transition-all disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
