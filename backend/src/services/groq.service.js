/**
 * Groq AI Client Integration Service
 * Multilingual Support: English, Hindi, Gujarati
 * Grounded in Approved Fact Sheets with strict guardrails against hallucinating project details
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Generate chat completion using Groq or fallback to contextual rule-engine
 */
async function generateGroqCompletion({ messages, factSheet, language = 'English', temperature = 0.2 }) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const systemPrompt = `You are PropAssist AI, the official multilingual AI Property Consultant for PropAssist Residential Developers in Ahmedabad, Gujarat.
Approved Project Fact Sheet Data:
${JSON.stringify(factSheet || {
  developer: "PropAssist Residential Developers",
  location: "Ahmedabad, Gujarat",
  projects: "2 Residential Projects (420 Apartments, 2 BHK & 3 BHK)",
  priceRange: "₹65 Lakh to ₹1.2 Crore",
  amenities: "Clubhouse, Gymnasium, Swimming Pool, Landscaped Gardens, 24/7 Security"
}, null, 2)}

Strict Guardrails:
1. Respond in ${language} (English, Hindi, or Gujarati as requested).
2. ONLY state facts present in the approved fact sheet above. NEVER invent RERA numbers, pricing, discounts, floor plans, or structural changes.
3. If an enquiry requires customized pricing or unlisted inventory, courteously offer to connect the buyer with an authorized Sales Executive.
4. Keep answers warm, professional, concise, and focused on scheduling a private site visit.`;

  if (apiKey && apiKey !== 'gsk_your_groq_api_key_here') {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature,
          max_tokens: 800
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return {
            provider: 'groq',
            model,
            content,
            isSimulated: false
          };
        }
      } else {
        const errText = await response.text();
        console.warn(`[Groq API warning] status ${response.status}:`, errText);
      }
    } catch (err) {
      console.warn('[Groq API network error, falling back to local engine]:', err.message);
    }
  }

  // Graceful Local NLP Engine for offline development / missing key
  const lastUserMsg = messages[messages.length - 1]?.content || '';
  let fallbackReply = '';

  if (language.toLowerCase().includes('gujarati') || /[\u0A80-\u0AFF]/.test(lastUserMsg)) {
    fallbackReply = `નમસ્તે! પ્રોપઆસિસ્ટ એઆઈમાં તમારું સ્વાગત છે. અમદાવાદમાં અમારા ૨ રહેણાંક પ્રોજેક્ટ્સમાં ૨ અને ૩ બીએચકે પ્રીમિયમ એપાર્ટમેન્ટ્સ (₹૬૫ લાખથી ₹૧.૨ કરોડ) ઉપલબ્ધ છે. શું તમે આ સપ્તાહના અંતે સાઈટ વિઝિટ બુક કરવા માંગો છો?`;
  } else if (language.toLowerCase().includes('hindi') || /[\u0900-\u097F]/.test(lastUserMsg)) {
    fallbackReply = `नमस्ते! प्रोपअसिस्ट एआई में आपका स्वागत है। अहमदाबाद में हमारे 2 आवासीय प्रोजेक्ट्स में 2 और 3 बीएचके लक्जरी अपार्टमेंट्स (₹65 लाख से ₹1.2 करोड़) उपलब्ध हैं। क्या आप इस वीकेंड साइट विजिट शेड्यूल करना चाहेंगे?`;
  } else {
    fallbackReply = `Hello! Welcome to PropAssist AI. Our residential developments in Ahmedabad feature premium 2 BHK and 3 BHK apartments ranging from ₹65 Lakh to ₹1.2 Crore. Would you like to check available configurations or schedule a private site visit?`;
  }

  return {
    provider: 'local-nlp-engine (Groq key not configured in .env)',
    model: 'prop-assist-grounded-rules-v1',
    content: fallbackReply,
    isSimulated: true
  };
}

/**
 * Classify Lead Temperature and extract intent
 */
function qualifyLeadFromChat(messages) {
  const text = messages.map(m => m.content).join(' ').toLowerCase();
  
  let score = 50;
  if (text.includes('visit') || text.includes('booking') || text.includes('price') || text.includes('ready to buy')) score += 30;
  if (text.includes('urgent') || text.includes('immediate') || text.includes('token')) score += 20;
  if (text.includes('just looking') || text.includes('curious') || text.includes('student')) score -= 30;

  let category = 'WARM';
  if (score >= 80) category = 'HOT';
  else if (score < 40) category = 'COLD';

  return {
    score,
    category,
    recommendedAction: category === 'HOT' ? 'Immediate Sales Executive Call & Slot Confirmation' : 'Send WhatsApp Brochure & Follow-up in 48h'
  };
}

module.exports = {
  generateGroqCompletion,
  qualifyLeadFromChat
};
