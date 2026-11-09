import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  MessageCircle,
  Globe,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Shield,
  Smartphone,
  Copy
} from 'lucide-react';
import { prepareWhatsAppLink, getWhatsAppTemplates } from '../../services/extendedApi';

export const WhatsAppChatModal = ({
  isOpen,
  onClose,
  recipientName = 'Homebuyer',
  recipientPhone = '',
  recipientRole = 'Customer',
  leadId = null,
  defaultTemplate = 'buyer_enquiry',
  defaultLanguage = 'en'
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [templatesData, setTemplatesData] = useState(null);

  // Fallback templates in case API is offline
  const fallbackTemplates = {
    buyer_enquiry: {
      en: 'Hello, I am interested in your 2 BHK / 3 BHK property. Please share more details.',
      hi: 'नमस्ते, मुझे आपकी 2 BHK / 3 BHK प्रॉपर्टी में रुचि है। कृपया अधिक विवरण साझा करें।',
      gu: 'નમસ્તે, મને તમારી 2 BHK / 3 BHK પ્રોપર્ટીમાં રસ છે. કૃપા કરીને વધુ વિગતો શેર કરો।'
    },
    site_visit: {
      en: 'Hello, your site visit has been scheduled. Please check your PropAssist AI dashboard for details.',
      hi: 'नमस्ते, आपकी साइट विज़िट निर्धारित कर दी गई है। कृपया विवरण के लिए अपना PropAssist AI डैशबोर्ड देखें।',
      gu: 'નમસ્તે, તમારી સાઇટ મુલાકાત શેડ્યૂલ કરવામાં આવી છે. કૃપા કરીને વિગતો માટે તમારું PropAssist AI ડેશબોર્ડ તપાસો।'
    },
    executive_followup: {
      en: 'Hello, I am contacting you regarding your property enquiry. Please let me know a convenient time to discuss.',
      hi: 'नमस्ते, मैं आपकी प्रॉपर्टी पूछताछ के संबंध में आपसे संपर्क कर रहा हूं। कृपया चर्चा के लिए सुविधाजनक समय बताएं।',
      gu: 'નમસ્તે, હું તમારી પ્રોપર્ટી પૂછપરછ અંગે તમારો સંપર્ક કરી રહ્યો છું. કૃપા કરીને ચર્ચા માટે અનુકૂળ સમય જણાવો।'
    }
  };

  // Clean and format phone number for display
  const cleanDigits = (recipientPhone || '').replace(/\D/g, '');
  const isPhoneValid = cleanDigits.length >= 10;
  const formattedPreview = isPhoneValid
    ? cleanDigits.length === 10
      ? `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`
      : `+${cleanDigits}`
    : recipientPhone || 'No phone number provided';

  // Fetch available templates on mount
  useEffect(() => {
    if (isOpen) {
      getWhatsAppTemplates().then((res) => {
        if (res?.success) {
          setTemplatesData(res);
        }
      });
    }
  }, [isOpen]);

  // Sync message when language or template changes
  useEffect(() => {
    if (selectedTemplate === 'custom') return;

    let text = '';
    if (templatesData?.templates) {
      const found = templatesData.templates.find((t) => t.key === selectedTemplate);
      if (found?.translations) {
        text = found.translations[selectedLanguage] || found.translations.en;
      }
    }

    if (!text && fallbackTemplates[selectedTemplate]) {
      text = fallbackTemplates[selectedTemplate][selectedLanguage] || fallbackTemplates[selectedTemplate].en;
    }

    setMessageText(text);
  }, [selectedTemplate, selectedLanguage, templatesData]);

  if (!isOpen) return null;

  const handleOpenWhatsApp = async () => {
    if (!isPhoneValid) {
      setError('Please provide a valid 10-digit mobile number before launching WhatsApp.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await prepareWhatsAppLink({
        leadId,
        phone: recipientPhone,
        recipientName,
        messageText,
        templateKey: selectedTemplate !== 'custom' ? selectedTemplate : undefined,
        language: selectedLanguage
      });

      if (res.success && res.data?.url) {
        // Open WhatsApp application or WhatsApp Web in a new tab
        window.open(res.data.url, '_blank', 'noopener,noreferrer');
        onClose();
      } else {
        // Immediate seamless client fallback
        const encoded = encodeURIComponent(messageText);
        const internationalNumber = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
        const directUrl = `https://wa.me/${internationalNumber}?text=${encoded}`;
        window.open(directUrl, '_blank', 'noopener,noreferrer');
        onClose();
      }
    } catch (err) {
      // Direct client fallback
      const encoded = encodeURIComponent(messageText);
      const internationalNumber = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
      const directUrl = `https://wa.me/${internationalNumber}?text=${encoded}`;
      window.open(directUrl, '_blank', 'noopener,noreferrer');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const internationalNumber = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const directUrl = `https://wa.me/${internationalNumber}?text=${encodeURIComponent(messageText)}`;
    navigator.clipboard.writeText(directUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0F1927] border border-[#1F3354] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1F3354] flex items-center justify-between bg-[#15233A]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366]">
              <MessageCircle className="w-5 h-5 fill-[#25D366]/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">WhatsApp Click-to-Chat</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30">
                  Official wa.me
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Open chat directly in WhatsApp Mobile or Web — zero third-party API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#1F3354] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Recipient Snapshot Card */}
          <div className="p-3.5 rounded-xl bg-[#09111D] border border-[#1A2C49] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#64748B]">Target Recipient</span>
              <p className="text-xs font-bold text-white">{recipientName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono text-[#CBD5E1]">{formattedPreview}</span>
                {isPhoneValid ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#25D366]">
                    <CheckCircle className="w-3 h-3" /> Validated
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                    <AlertCircle className="w-3 h-3" /> Invalid Number
                  </span>
                )}
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#1F3354] text-[#94A3B8]">
              {recipientRole}
            </span>
          </div>

          {/* Language Selector */}
          <div>
            <label className="text-[11px] font-semibold text-[#CBD5E1] flex items-center gap-1.5 mb-2">
              <Globe className="w-3.5 h-3.5 text-[#C8814F]" />
              Prefilled Language (English, Hindi, Gujarati)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'en', label: 'English' },
                { code: 'hi', label: 'हिन्दी (Hindi)' },
                { code: 'gu', label: 'ગુજરાતી (Gujarati)' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                    selectedLanguage === lang.code
                      ? 'bg-[#C8814F]/20 border-[#C8814F] text-white shadow-sm'
                      : 'bg-[#09111D] border-[#1F3354] text-[#94A3B8] hover:text-[#CBD5E1]'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Template Selector */}
          <div>
            <label className="text-[11px] font-semibold text-[#CBD5E1] block mb-2">
              Message Template
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { key: 'buyer_enquiry', label: 'Buyer Enquiry' },
                { key: 'site_visit', label: 'Site Visit Scheduled' },
                { key: 'executive_followup', label: 'Executive Follow-up' },
                { key: 'custom', label: 'Custom Message' }
              ].map((tpl) => (
                <button
                  key={tpl.key}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl.key)}
                  className={`p-2.5 rounded-xl border text-left font-medium transition ${
                    selectedTemplate === tpl.key
                      ? 'bg-[#15233A] border-[#25D366] text-white'
                      : 'bg-[#09111D] border-[#1F3354] text-[#94A3B8] hover:text-[#CBD5E1]'
                  }`}
                >
                  <span className="block text-xs font-semibold">{tpl.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editable Message Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-[#CBD5E1]">
                Message Preview (Editable)
              </label>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 text-[10px] text-[#C8814F] hover:underline"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Copied Link!' : 'Copy wa.me link'}
              </button>
            </div>
            <textarea
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                if (selectedTemplate !== 'custom') setSelectedTemplate('custom');
              }}
              rows={4}
              placeholder="Type your message here..."
              className="w-full p-3 text-xs bg-[#09111D] border border-[#1F3354] rounded-xl text-[#F3EFE8] focus:outline-none focus:border-[#25D366] transition resize-none leading-relaxed"
            />
          </div>

          {/* Security & Regulatory Notice */}
          <div className="p-3 rounded-xl bg-[#09111D]/80 border border-[#1F3354] flex items-start gap-2 text-[10px] text-[#94A3B8] leading-relaxed">
            <Shield className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#CBD5E1]">Manual Dispatch Guardrail: </strong>
              PropAssist AI does not send automated messages. Clicking below will open WhatsApp with your prepared text so you can review and manually tap send.
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#1F3354] bg-[#15233A]/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Opens WhatsApp Mobile / Web</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#94A3B8] hover:text-white rounded-xl hover:bg-[#1F3354] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || !isPhoneValid || !messageText.trim()}
              onClick={handleOpenWhatsApp}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-black font-bold rounded-xl text-xs shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Opening...' : 'Open in WhatsApp'}</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppChatModal;

