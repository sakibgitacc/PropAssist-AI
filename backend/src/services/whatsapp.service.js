/**
 * WhatsApp Click-to-Chat Service (Official wa.me Deep Links)
 * STRICTLY NO API: No Meta Cloud API, No Webhooks, No Tokens, No Automated Dispatch.
 * Purely generates dynamic, validated wa.me deep links and records WHATSAPP_LINK_OPENED activity.
 */

/**
 * Validates and formats a phone number for official WhatsApp Click-to-Chat deep links.
 * WhatsApp requires numbers in international format without leading zeros, '+', or dashes.
 * Defaults to Indian country code (91) for 10-digit mobile numbers.
 */
function validateAndFormatPhoneNumber(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return {
      isValid: false,
      error: 'Phone number is missing or invalid.',
      formattedNumber: null
    };
  }

  // Strip all non-digit characters
  const digits = rawPhone.replace(/\D/g, '');

  if (digits.length < 10) {
    return {
      isValid: false,
      error: `Phone number '${rawPhone}' has fewer than 10 digits.`,
      formattedNumber: null
    };
  }

  // If 10 digits (standard Indian mobile), prepend 91
  if (digits.length === 10) {
    return {
      isValid: true,
      error: null,
      formattedNumber: `91${digits}`
    };
  }

  // If 11 digits starting with 0 (e.g. 09876543210), strip 0 and prepend 91
  if (digits.length === 11 && digits.startsWith('0')) {
    return {
      isValid: true,
      error: null,
      formattedNumber: `91${digits.slice(1)}`
    };
  }

  // If 12 digits starting with 91 (India)
  if (digits.length === 12 && digits.startsWith('91')) {
    return {
      isValid: true,
      error: null,
      formattedNumber: digits
    };
  }

  // Generic international number (11-15 digits)
  if (digits.length >= 10 && digits.length <= 15) {
    return {
      isValid: true,
      error: null,
      formattedNumber: digits
    };
  }

  return {
    isValid: false,
    error: `Invalid phone number length (${digits.length} digits).`,
    formattedNumber: null
  };
}

/**
 * Standard prefilled message templates in English, Hindi, and Gujarati
 */
const MESSAGE_TEMPLATES = {
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

/**
 * Generates official WhatsApp Click-to-Chat link
 * URL format: https://wa.me/<number>?text=<url-encoded-text>
 */
function generateWhatsAppLink({ phone, messageText, templateKey, language = 'en', customVariables = {} }) {
  const phoneValidation = validateAndFormatPhoneNumber(phone);
  if (!phoneValidation.isValid) {
    return {
      success: false,
      error: phoneValidation.error,
      url: null
    };
  }

  let finalMessage = messageText;

  // Resolve template if requested
  if (templateKey && MESSAGE_TEMPLATES[templateKey]) {
    const lang = ['en', 'hi', 'gu'].includes(language) ? language : 'en';
    finalMessage = MESSAGE_TEMPLATES[templateKey][lang] || MESSAGE_TEMPLATES[templateKey].en;
  }

  if (!finalMessage) {
    finalMessage = MESSAGE_TEMPLATES.executive_followup.en;
  }

  // Replace any custom dynamic variables if provided
  if (customVariables && typeof customVariables === 'object') {
    Object.keys(customVariables).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      finalMessage = finalMessage.replace(regex, customVariables[key]);
    });
  }

  const encodedText = encodeURIComponent(finalMessage);
  const waUrl = `https://wa.me/${phoneValidation.formattedNumber}?text=${encodedText}`;

  return {
    success: true,
    url: waUrl,
    phone: phoneValidation.formattedNumber,
    rawPhone: phone,
    message: finalMessage,
    action: 'WHATSAPP_LINK_OPENED'
  };
}

module.exports = {
  validateAndFormatPhoneNumber,
  generateWhatsAppLink,
  MESSAGE_TEMPLATES,
  getPrefilledTemplates: () => MESSAGE_TEMPLATES
};
