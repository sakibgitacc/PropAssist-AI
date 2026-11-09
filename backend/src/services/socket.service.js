const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../db/prisma');

let io = null;

/**
 * Initialize Socket.IO with HTTP Server
 */
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!authHeader) {
        return next(new Error('Authentication error: Token missing'));
      }

      const token = authHeader.replace(/^Bearer\s+/i, '');
      const secret = process.env.JWT_SECRET || 'propassist_jwt_super_secure_secret_token_2026_xyz';

      const decoded = jwt.verify(token, secret);
      socket.user = decoded;
      next();
    } catch (err) {
      console.warn('[Socket Auth Failed]:', err.message);
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    // Join personal user notification room
    socket.join(`user:${user.id}`);

    // Event: Join a specific lead/consultation conversation room
    socket.on('join_conversation', async ({ conversationId }) => {
      try {
        if (!conversationId) return;

        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            lead: {
              include: { assignedExecutive: true }
            }
          }
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Strict RBAC Verification
        let isAuthorized = false;
        if (['ADMIN', 'SUPER_ADMIN', 'SALES_HEAD'].includes(user.role)) {
          isAuthorized = true;
        } else if (user.role === 'SALES_EXECUTIVE') {
          isAuthorized = conversation.lead?.assignedExecutiveId === user.id;
        } else if (user.role === 'BUYER') {
          const cleanUserPhone = (user.phone || '').replace(/\D/g, '').slice(-10);
          const cleanLeadPhone = (conversation.lead?.phone || '').replace(/\D/g, '').slice(-10);
          isAuthorized =
            conversation.lead?.email === user.email ||
            (cleanUserPhone && cleanUserPhone === cleanLeadPhone);
        }

        if (!isAuthorized) {
          socket.emit('error', { message: 'Forbidden: You are not authorized to join this conversation' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        socket.emit('joined_conversation', { conversationId });
      } catch (err) {
        console.error('[Socket Join Error]:', err.message);
      }
    });

    // Event: Leave conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // Event: In-App Message Dispatch
    socket.on('send_message', async ({ conversationId, content, language = 'en' }) => {
      try {
        if (!conversationId || !content || !content.trim()) return;

        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { lead: true }
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // RBAC check
        let isAuthorized = false;
        if (['ADMIN', 'SUPER_ADMIN', 'SALES_HEAD'].includes(user.role)) {
          isAuthorized = true;
        } else if (user.role === 'SALES_EXECUTIVE') {
          isAuthorized = conversation.lead?.assignedExecutiveId === user.id;
        } else if (user.role === 'BUYER') {
          const cleanUserPhone = (user.phone || '').replace(/\D/g, '').slice(-10);
          const cleanLeadPhone = (conversation.lead?.phone || '').replace(/\D/g, '').slice(-10);
          isAuthorized =
            conversation.lead?.email === user.email ||
            (cleanUserPhone && cleanUserPhone === cleanLeadPhone);
        }

        if (!isAuthorized) {
          socket.emit('error', { message: 'Forbidden: You cannot send messages in this conversation' });
          return;
        }

        const senderType = user.role === 'BUYER' ? 'buyer' : 'executive';

        // Persist message to database
        const savedMessage = await prisma.message.create({
          data: {
            conversationId,
            senderType,
            senderName: user.name || (senderType === 'buyer' ? 'Homebuyer' : 'Sales Advisor'),
            content: content.trim(),
            language,
            isRead: false
          }
        });

        // Touch conversation updated timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() }
        });

        // Broadcast to everyone in conversation room (including sender)
        io.to(`conversation:${conversationId}`).emit('new_message', savedMessage);

        // Notify other participant's personal room for unread badges
        if (senderType === 'buyer' && conversation.lead?.assignedExecutiveId) {
          io.to(`user:${conversation.lead.assignedExecutiveId}`).emit('unread_notification', {
            conversationId,
            senderName: savedMessage.senderName,
            content: savedMessage.content
          });
        }
      } catch (err) {
        console.error('[Socket Send Error]:', err.message);
        socket.emit('error', { message: 'Failed to deliver message' });
      }
    });

    // Event: Typing Indicators
    socket.on('typing', ({ conversationId, isTyping }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: user.id,
        userName: user.name,
        role: user.role,
        isTyping: !!isTyping,
        conversationId
      });
    });

    // Event: Mark Messages Read
    socket.on('mark_read', async ({ conversationId }) => {
      try {
        if (!conversationId) return;
        const senderTypeToMark = user.role === 'BUYER' ? 'executive' : 'buyer';

        await prisma.message.updateMany({
          where: {
            conversationId,
            senderType: senderTypeToMark,
            isRead: false
          },
          data: {
            isRead: true,
            readAt: new Date()
          }
        });

        io.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          readByUserId: user.id
        });
      } catch (err) {
        console.error('[Socket Mark Read Error]:', err.message);
      }
    });

    // ─────────────────────────────────────────────────────────────
    // WebRTC Peer-to-Peer In-App Voice Calling Signaling
    // ─────────────────────────────────────────────────────────────

    // Event: WebRTC Call Initiate (Offer)
    socket.on('webrtc_call_user', async ({ targetUserId, conversationId, offer, callerName }) => {
      try {
        if (!targetUserId) return;
        io.to(`user:${targetUserId}`).emit('webrtc_incoming_call', {
          fromUserId: user.id,
          callerName: callerName || user.name || 'Sales Advisor',
          conversationId,
          offer
        });
      } catch (err) {
        console.error('[WebRTC Call Error]:', err.message);
      }
    });

    // Event: WebRTC Call Answer (Answer SDP)
    socket.on('webrtc_answer_call', ({ targetUserId, answer }) => {
      try {
        if (!targetUserId) return;
        io.to(`user:${targetUserId}`).emit('webrtc_call_answered', {
          fromUserId: user.id,
          answer
        });
      } catch (err) {
        console.error('[WebRTC Answer Error]:', err.message);
      }
    });

    // Event: WebRTC ICE Candidate Exchange
    socket.on('webrtc_ice_candidate', ({ targetUserId, candidate }) => {
      try {
        if (!targetUserId || !candidate) return;
        io.to(`user:${targetUserId}`).emit('webrtc_ice_candidate', {
          fromUserId: user.id,
          candidate
        });
      } catch (err) {
        console.error('[WebRTC ICE Error]:', err.message);
      }
    });

    // Event: WebRTC Call Ended / Rejected
    socket.on('webrtc_end_call', ({ targetUserId, conversationId, duration }) => {
      try {
        if (targetUserId) {
          io.to(`user:${targetUserId}`).emit('webrtc_call_ended', {
            fromUserId: user.id,
            duration: duration || 0
          });
        }
      } catch (err) {
        console.error('[WebRTC End Error]:', err.message);
      }
    });

    socket.on('disconnect', () => {
      // Disconnected cleanly
    });
  });

  return io;
}

function getIo() {
  return io;
}

module.exports = {
  initSocket,
  getIo
};

