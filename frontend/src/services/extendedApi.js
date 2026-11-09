import api from '../api/client';

/**
 * Enterprise Extended Service Adapter
 * Real, live database-backed endpoints connecting to PostgreSQL / Prisma
 * All data is strictly fetched from the authenticated backend APIs with role-based access control.
 */

// ─── 1. ORGANIZATIONS (Super Admin) ───
export const getOrganizations = async () => {
  try {
    const res = await api.get('/organizations');
    return {
      success: true,
      organizations: res.data.data || []
    };
  } catch (err) {
    console.error('Error fetching organizations from API:', err);
    return {
      success: false,
      error: err.response?.data?.error || 'Failed to retrieve organizations',
      organizations: []
    };
  }
};

// ─── 2. PAYMENTS & TRANSACTIONS ───
export const getPayments = async () => {
  try {
    const res = await api.get('/payments');
    return {
      success: true,
      payments: res.data.data || []
    };
  } catch (err) {
    console.error('Error fetching payments from API:', err);
    return {
      success: false,
      error: err.response?.data?.error || 'Failed to retrieve payments',
      payments: []
    };
  }
};

// ─── 3. PROPERTY BOOKINGS & ALLOTMENTS ───
export const getPropertyBookings = async () => {
  try {
    const res = await api.get('/property-bookings');
    return {
      success: true,
      bookings: res.data.data || []
    };
  } catch (err) {
    console.error('Error fetching property bookings from API:', err);
    return {
      success: false,
      error: err.response?.data?.error || 'Failed to retrieve property bookings',
      bookings: []
    };
  }
};

// ─── 4. AUDIT LOGS (Super Admin) ───
export const getAuditLogs = async () => {
  try {
    const res = await api.get('/audit-logs');
    return {
      success: true,
      logs: res.data.data || []
    };
  } catch (err) {
    console.error('Error fetching audit logs from API:', err);
    return {
      success: false,
      error: err.response?.data?.error || 'Failed to retrieve audit logs',
      logs: []
    };
  }
};

// ─── 5. WHATSAPP CLICK-TO-CHAT (Official wa.me - Zero API Keys) ───
export const getWhatsAppTemplates = async () => {
  try {
    const res = await api.get('/whatsapp/templates');
    return res.data;
  } catch (err) {
    console.error('Error fetching WhatsApp templates:', err);
    return { success: false, templates: [], languages: [] };
  }
};

export const prepareWhatsAppLink = async (payload) => {
  try {
    const res = await api.post('/whatsapp/link', payload);
    return res.data;
  } catch (err) {
    console.error('Error generating WhatsApp link:', err);
    return {
      success: false,
      error: err.response?.data?.error || 'Failed to generate WhatsApp link'
    };
  }
};

// ─── 6. VIDEO CONSULTATIONS (Jitsi Integration) ───
export const requestVideoConsultation = async (payload) => {
  try {
    const res = await api.post('/calls/request', payload);
    return res.data;
  } catch (err) {
    console.error('Error requesting consultation:', err);
    return {
      success: false,
      error: err.response?.data?.error || 'Failed to request video consultation'
    };
  }
};

export const acceptVideoConsultation = async (callId, payload) => {
  try {
    const res = await api.post(`/calls/${callId}/accept`, payload);
    return res.data;
  } catch (err) {
    console.error('Error accepting consultation:', err);
    return {
      success: false,
      error: err.response?.data?.error || 'Failed to accept video consultation'
    };
  }
};

export const getCallHistory = async () => {
  try {
    const res = await api.get('/calls/history');
    return res.data;
  } catch (err) {
    console.error('Error fetching call history:', err);
    return { success: false, calls: [] };
  }
};

// ─── 7. IN-APP REAL-TIME CHAT ───
export const getInAppConversations = async () => {
  try {
    const res = await api.get('/chat/conversations');
    return res.data;
  } catch (err) {
    console.error('Error fetching in-app conversations:', err);
    return { success: false, conversations: [] };
  }
};

export const initiateInAppConversation = async (payload) => {
  try {
    const res = await api.post('/chat/conversations/initiate', payload);
    return res.data;
  } catch (err) {
    console.error('Error initiating conversation:', err);
    return {
      success: false,
      error: err.response?.data?.error || 'Failed to initiate conversation'
    };
  }
};

export const getInAppMessages = async (conversationId) => {
  try {
    const res = await api.get(`/chat/conversations/${conversationId}/messages`);
    return res.data;
  } catch (err) {
    console.error('Error fetching messages:', err);
    return { success: false, messages: [] };
  }
};

export const sendInAppMessage = async (conversationId, payload) => {
  try {
    const res = await api.post(`/chat/conversations/${conversationId}/messages`, payload);
    return res.data;
  } catch (err) {
    console.error('Error sending message:', err);
    return {
      success: false,
      error: err.response?.data?.error || 'Failed to send message'
    };
  }
};

export const markInAppMessagesRead = async (conversationId) => {
  try {
    const res = await api.post(`/chat/conversations/${conversationId}/read`, {});
    return res.data;
  } catch (err) {
    console.error('Error marking messages as read:', err);
    return { success: false };
  }
};
