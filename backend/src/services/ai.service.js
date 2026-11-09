const prisma = require('../db/prisma');

/**
 * Knowledge retrieval: Load active projects and their fact sheets for AI context
 */
async function getProjectFactSheetContext() {
  const projects = await prisma.project.findMany({
    where: { status: 'Active' },
    include: {
      factSheet: true,
      visitSlots: {
        where: { isActive: true },
        take: 4,
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
      }
    }
  });

  return projects.map(p => {
    return `=== PROJECT: ${p.name} ===
Location: ${p.location}, ${p.city}
Coordinates: Latitude ${p.latitude}, Longitude ${p.longitude}
BHK Configurations: ${p.bhkOptions}
Price Range: ₹${(p.minPrice / 10000000).toFixed(2)} Cr to ₹${(p.maxPrice / 10000000).toFixed(2)} Cr
Super Built-up Area: ${p.minArea} - ${p.maxArea} sq.ft
Possession Timeline: ${p.possession}
Demo RERA Registration: ${p.reraNumber}
Key Amenities: ${p.amenities}
Fact Sheet Details:
${p.factSheet ? p.factSheet.rawContent : 'Specifications available on demand.'}
Upcoming Available Site Visit Slots:
${p.visitSlots.map(s => `- ID: ${s.id} | Date: ${s.date} | Time: ${s.startTime} - ${s.endTime} | Capacity Left: ${s.capacity - s.bookedCount}`).join('\n')}
`;
  }).join('\n\n');
}

/**
 * Intelligent Multilingual Fallback Engine (when GROQ_API_KEY is not configured)
 * Supports English, Hindi, and Gujarati
 */
async function processLocalIntelligence({ message, conversationId, lead, language = 'en', context }) {
  const lowerMsg = message.toLowerCase();

  // 1. Language detection: Respect explicit language choice first
  let detectedLang = language || 'en';
  if (!language || language === 'en') {
    if (/[\u0A80-\u0AFF]/.test(message) || lowerMsg.includes('kem cho') || lowerMsg.includes('bhav')) {
      detectedLang = 'gu';
    } else if (/[\u0900-\u097F]/.test(message) || lowerMsg.includes('kya hai') || lowerMsg.includes('kimat')) {
      detectedLang = 'hi';
    }
  }

  // 2. Intent: Human Handoff Request
  if (
    lowerMsg.includes('human') ||
    lowerMsg.includes('executive') ||
    lowerMsg.includes('agent') ||
    lowerMsg.includes('call me') ||
    lowerMsg.includes('manus') ||
    lowerMsg.includes('baat karni') ||
    lowerMsg.includes('vat karvi') ||
    lowerMsg.includes('talk to someone')
  ) {
    return {
      reply: detectedLang === 'gu'
        ? "હું તમારા પ્રશ્નોના ઉત્તર માટે અમારા વરિષ્ઠ સેલ્સ એક્ઝિક્યુટિવ સાથે તમને જોડી રહ્યો છું. તેઓ ટૂંક સમયમાં તમારો સંપર્ક કરશે."
        : detectedLang === 'hi'
        ? "मैं आपकी पूछताछ के लिए हमारे वरिष्ठ सेल्स एग्जीक्यूटिव को आपको तुरंत असाइन कर रहा हूँ। वे जल्द ही आपसे संपर्क करेंगे।"
        : "I am connecting you with one of our senior Sales Executives right away. They will review our conversation and assist you with personalized consultation.",
      toolCall: {
        action: 'request_human_handoff',
        parameters: { reason: 'Buyer explicitly requested human executive assistance' }
      }
    };
  }

  // 3. Intent: Booking a Visit or Asking for Visit Slots
  if (
    lowerMsg.includes('visit') ||
    lowerMsg.includes('slot') ||
    lowerMsg.includes('book') ||
    lowerMsg.includes('joou') ||
    lowerMsg.includes('mulakat') ||
    lowerMsg.includes('dekhna') ||
    lowerMsg.includes('schedule')
  ) {
    // Find next available slots from the DB
    const availableSlots = await prisma.visitSlot.findMany({
      where: { isActive: true },
      take: 3,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: { project: { select: { name: true } } }
    });

    const slotsList = availableSlots
      .map((s, idx) => `${idx + 1}. ${s.project.name} on ${s.date} at ${s.startTime} [Slot ID: ${s.id}]`)
      .join('\n');

    const reply = detectedLang === 'gu'
      ? `અમારી પાસે ઉપલબ્ધ આગામી સાઇટ વિઝિટ સ્લોટ્સ:\n${slotsList}\n\nશું તમે આમાંથી કોઈ સ્લોટ બુક કરવા માંગો છો? કૃપા કરીને તમારું નામ અને ફોન નંબર જણાવો.`
      : detectedLang === 'hi'
      ? `हमारे पास निम्नलिखित आगामी साइट विजिट स्लॉट्स उपलब्ध हैं:\n${slotsList}\n\nक्या आप इनमें से कोई स्लॉट बुक करना चाहते हैं? कृपया अपना नाम और फोन नंबर साझा करें।`
      : `We have the following upcoming site visit slots available:\n\n${slotsList}\n\nWould you like me to reserve one of these slots for you? Simply provide your preferred date/time and contact details!`;

    return {
      reply,
      toolCall: {
        action: 'check_slots',
        parameters: { slotsFound: availableSlots.length }
      }
    };
  }

  // 4. Intent: Pricing & Configurations
  if (
    lowerMsg.includes('price') ||
    lowerMsg.includes('cost') ||
    lowerMsg.includes('budget') ||
    lowerMsg.includes('rate') ||
    lowerMsg.includes('kimat') ||
    lowerMsg.includes('bhav') ||
    lowerMsg.includes('crore') ||
    lowerMsg.includes('lakh')
  ) {
    const reply = detectedLang === 'gu'
      ? "અમારા પ્રોજેક્ટ્સની અધિકૃત કિંમતો:\n• The Grand Orchid Residences (SG Highway): 3 & 4 BHK, ₹1.35 Cr થી ₹2.45 Cr.\n• Serene Meadows (South Bopal): 2 & 3 BHK, ₹68 Lakhs થી ₹1.15 Cr.\nતમારું બજેટ અને પસંદગીનું BHK કયું છે?"
      : detectedLang === 'hi'
      ? "हमारे प्रोजेक्ट्स की अनुमोदित मूल्य सीमा:\n• The Grand Orchid Residences (SG Highway): 3 और 4 BHK, ₹1.35 Cr से ₹2.45 Cr.\n• Serene Meadows (South Bopal): 2 और 3 BHK, ₹68 Lakhs से ₹1.15 Cr.\nआपका अनुमानित बजट और पसंदीदा BHK क्या है?"
      : "Here are our approved project price ranges in Ahmedabad:\n\n1. **The Grand Orchid Residences** (SG Highway): 3 & 4 BHK luxury residences starting from ₹1.35 Cr up to ₹2.45 Cr.\n2. **Serene Meadows** (South Bopal): 2 & 3 BHK eco-friendly homes starting from ₹68 Lakhs up to ₹1.15 Cr.\n\nWhat is your preferred budget and BHK configuration?";

    return {
      reply,
      toolCall: {
        action: 'qualify_lead',
        parameters: { category: 'budget_inquiry' }
      }
    };
  }

  // 5. Intent: Amenities & Facilities
  if (
    lowerMsg.includes('amenit') ||
    lowerMsg.includes('pool') ||
    lowerMsg.includes('gym') ||
    lowerMsg.includes('park') ||
    lowerMsg.includes('clubhouse') ||
    lowerMsg.includes('ev') ||
    lowerMsg.includes('suvidha')
  ) {
    const reply = detectedLang === 'gu'
      ? "અમારા બંને પ્રોજેક્ટ્સમાં આધુનિક સુવિધાઓ છે:\n• The Grand Orchid: સ્કાય લાઉન્જ, રૂફટોપ ઇન્ફિનિટી પૂલ, EV ચાર્જિંગ, સ્ક્વોશ કોર્ટ, 3-લેયર સુરક્ષા.\n• Serene Meadows: 2-એકર સેન્ટ્રલ થીમ પાર્ક, સોલર ગ્રીડ લાઇટ્સ, ક્લબહાઉસ, ચિલ્ડ્રન પ્લે એરિયા.\nતમે કયા પ્રોજેક્ટની મુલાકાત લેવા માંગો છો?"
      : detectedLang === 'hi'
      ? "हमारे दोनों प्रोजेक्ट्स में विश्वस्तरीय सुविधाएं उपलब्ध हैं:\n• The Grand Orchid: रूफटॉप इन्फिनिटी पूल, स्काई लाउंज, EV फास्ट चार्जिंग, स्क्वैश कोर्ट, 3-स्तरीय सुरक्षा।\n• Serene Meadows: 2-एकड़ सेंट्रल पार्क, सोलर लाइटिंग, क्लबहाउस, जॉगिंग ट्रैक।\nआप किस प्रोजेक्ट के बारे में अधिक जानना चाहते हैं?"
      : "Both projects feature premium lifestyle amenities:\n\n• **The Grand Orchid Residences**: Rooftop infinity swimming pool, sky lounge & observatory, high-speed EV charging, squash court, Italian marble finishes, and 3-tier 24/7 smart security.\n• **Serene Meadows**: 2-acre landscaped central garden, solar-powered green grid, modern clubhouse & gym, jogging track, and children's safe play park.\n\nWould you like to schedule a site tour to experience these amenities in person?";

    return { reply };
  }

  // 6. Intent: Location & Connectivity
  if (
    lowerMsg.includes('location') ||
    lowerMsg.includes('where') ||
    lowerMsg.includes('bopal') ||
    lowerMsg.includes('sg highway') ||
    lowerMsg.includes('airport') ||
    lowerMsg.includes('kahan') ||
    lowerMsg.includes('kyan')
  ) {
    const reply = detectedLang === 'gu'
      ? "અમારા લોકેશન:\n• The Grand Orchid: વૈષ્ણોદેવી સર્કલ પાસે, SG હાઇવે, અમદાવાદ (એરપોર્ટ 25 મિનિટ, ગિફ્ટ સિટી 20 મિનિટ).\n• Serene Meadows: ગાલા જિમખાના પાછળ, સાઉથ બોપલ, અમદાવાદ (SP રિંગ રોડ 3 મિનિટ).\nતમને કયું લોકેશન અનુકૂળ રહે છે?"
      : detectedLang === 'hi'
      ? "स्थान और कनेक्टिविटी:\n• The Grand Orchid: वैष्णोदेवी सर्कल के पास, SG हाईवे, अहमदाबाद (एयरपोर्ट 25 मिनट, गिफ्ट सिटी 20 मिनट)।\n• Serene Meadows: गाला जिमखाना के पीछे, साउथ बोपल, अहमदाबाद (SP रिंग रोड 3 मिनट)।\nआप किस इलाके में प्रॉपर्टी तलाश रहे हैं?"
      : "Here are our project locations and key connectivity points in Ahmedabad:\n\n• **The Grand Orchid Residences**: Near Vaishno Devi Circle, SG Highway (25 mins to SVPI Airport, 20 mins to GIFT City, 5 mins to Nirma University).\n• **Serene Meadows**: Behind Gala Gymkhana Club, South Bopal (3 mins to SP Ring Road, 6 mins to TRP Mall Bopal).\n\nWhich location works best for your daily commute?";

    return { reply };
  }

  // 7. General Welcome / Default Guidance
  const defaultReply = detectedLang === 'gu'
    ? "નમસ્તે! હું PropAssist AI સહાયક છું. હું તમને અમદાવાદના અમારા પ્રીમિયમ રેસિડેન્શિયલ પ્રોજેક્ટ્સ (The Grand Orchid Residences & Serene Meadows), તેમની કિંમત, ફ્લોર પ્લાન, અથવા સાઇટ વિઝિટ બુકિંગમાં મદદ કરી શકું છું. હું તમારી શું સહાય કરી શકું?"
    : detectedLang === 'hi'
    ? "नमस्ते! मैं PropAssist AI हूँ। मैं अहमदाबाद के हमारे प्रीमियम आवासीय प्रोजेक्ट्स (The Grand Orchid Residences एवं Serene Meadows), उनकी कीमतों, सुविधाओं और साइट विजिट बुक करने में आपकी सहायता कर सकता हूँ। आप किस प्रोजेक्ट के बारे में जानना चाहते हैं?"
    : "Hello! I am PropAssist AI, your intelligent real estate assistant. I can help you explore our premier Ahmedabad residential developments (The Grand Orchid Residences on SG Highway and Serene Meadows in South Bopal), check verified prices and floor plans, or schedule a personalized site visit. How may I assist you today?";

  return { reply: defaultReply };
}

/**
 * Main AI Query Handler: Uses Groq SDK if GROQ_API_KEY is configured,
 * otherwise safely falls back to local intelligent grounding.
 */
async function generateAiChatResponse({ message, conversationHistory = [], conversationId, leadId, language = 'en' }) {
  const factSheetContext = await getProjectFactSheetContext();
  const apiKey = process.env.GROQ_API_KEY;

  let lead = null;
  if (leadId) {
    lead = await prisma.lead.findUnique({ where: { id: leadId } });
  }

  // If GROQ_API_KEY is present and starts with 'gsk_', call Groq
  if (apiKey && apiKey.startsWith('gsk_')) {
    try {
      const Groq = require('groq-sdk');
      const groq = new Groq({ apiKey });

      const targetLangInstructions = language === 'gu'
        ? 'CRITICAL MANDATORY INSTRUCTION: The user has selected GUJARATI (ગુજરાતી). You MUST formulate your entire response in Gujarati script and Gujarati language. Do not output Hindi or English paragraphs.'
        : language === 'hi'
        ? 'CRITICAL MANDATORY INSTRUCTION: The user has selected HINDI (हिन्दी). You MUST formulate your entire response in Devanagari script and Hindi language. Do not output Gujarati or English paragraphs.'
        : 'CRITICAL MANDATORY INSTRUCTION: Reply in professional English.';

      const systemPrompt = `You are PropAssist AI, a professional, trustworthy, and knowledgeable real estate sales advisor representing premium properties in Ahmedabad, Gujarat, India.
${targetLangInstructions}
You must adhere strictly to these safety and communication rules:
1. Ground all answers strictly on the approved Project Fact Sheets provided below. Never fabricate RERA numbers, pricing, or specifications.
2. If asked about prices or discounts not listed in the fact sheet, politely state that final negotiable rates require executive consultation and offer human assistance.
3. Language: Strictly maintain ${language === 'gu' ? 'GUJARATI (ગુજરાતી)' : language === 'hi' ? 'HINDI (हिन्दी)' : 'ENGLISH'} language.
4. Encourage qualifying the buyer (ask politely about budget range, preferred BHK, location preference, and purchase timeline).
5. If the buyer wants to visit the project, recommend the upcoming available visit slots from the fact sheet.
6. If the buyer requests human contact or asks complex non-standard legal questions, trigger a human handoff.

PROJECT FACT SHEETS KNOWLEDGE BASE:
${factSheetContext}

Current Lead State:
${lead ? `Name: ${lead.fullName}, Phone: ${lead.phone}, Budget: ₹${lead.budgetMin || '?'}-₹${lead.budgetMax || '?'}, BHK: ${lead.preferredBhk || '?'}` : 'Anonymous visitor'}
`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-8).map(m => ({
          role: m.senderType === 'buyer' ? 'user' : 'assistant',
          content: m.content
        })),
        { role: 'user', content: message }
      ];

      const completion = await groq.chat.completions.create({
        messages,
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 800
      });

      const reply = completion.choices[0]?.message?.content || 'Thank you for your inquiry. How else may I assist you with our projects?';

      // Check if user requested handoff in response
      let toolCall = null;
      if (message.toLowerCase().includes('human') || message.toLowerCase().includes('executive') || message.toLowerCase().includes('call me')) {
        toolCall = { action: 'request_human_handoff', parameters: { reason: 'User requested human agent' } };
      }

      return { reply, toolCall, source: 'groq' };
    } catch (err) {
      console.warn('Groq API invocation failed, falling back to local intelligence engine:', err.message);
      // Fall through to local intelligence
    }
  }

  // Built-in intelligent local fact-sheet grounded engine
  const localResult = await processLocalIntelligence({
    message,
    conversationId,
    lead,
    language,
    context: factSheetContext
  });

  return { ...localResult, source: 'local_grounded_engine' };
}

module.exports = {
  generateAiChatResponse,
  getProjectFactSheetContext
};
