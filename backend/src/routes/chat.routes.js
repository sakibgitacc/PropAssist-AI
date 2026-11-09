const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken } = require('../middleware/auth');
const { getIo } = require('../services/socket.service');

/**
 * GET /api/chat/conversations
 * Fetch user's active in-app chat conversations with unread counts & latest messages
 */
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { role, id: userId, email, phone } = req.user;
    let conversations = [];

    if (role === 'SALES_EXECUTIVE') {
      // Find leads assigned to this executive
      conversations = await prisma.conversation.findMany({
        where: {
          lead: { assignedExecutiveId: userId }
        },
        include: {
          lead: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              status: true,
              project: { select: { id: true, name: true } }
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
    } else if (role === 'BUYER') {
      const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
      conversations = await prisma.conversation.findMany({
        where: {
          lead: {
            OR: [
              { email },
              cleanPhone ? { phone: { contains: cleanPhone } } : {}
            ]
          }
        },
        include: {
          lead: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              assignedExecutive: {
                select: { id: true, name: true, phone: true, avatar: true }
              },
              project: { select: { id: true, name: true } }
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
    } else {
      // Admin / Head: View all active conversations
      conversations = await prisma.conversation.findMany({
        include: {
          lead: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              assignedExecutive: { select: { id: true, name: true } },
              project: { select: { id: true, name: true } }
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 30
      });
    }

    // Compute unread counts for each conversation
    const mapped = await Promise.all(
      conversations.map(async (conv) => {
        const unreadFilter = {
          conversationId: conv.id,
          isRead: false
        };

        if (role === 'BUYER') {
          unreadFilter.senderType = { not: 'buyer' };
        } else if (role === 'SALES_EXECUTIVE') {
          unreadFilter.senderType = 'buyer';
        }

        const unreadCount = await prisma.message.count({ where: unreadFilter });

        return {
          id: conv.id,
          leadId: conv.leadId,
          lead: conv.lead,
          channel: conv.channel,
          lastMessage: conv.messages[0] || null,
          unreadCount,
          updatedAt: conv.updatedAt
        };
      })
    );

    res.json({ success: true, conversations: mapped });
  } catch (err) {
    console.error('Error fetching chat conversations:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
  }
});

/**
 * POST /api/chat/conversations/initiate
 * Ensure an in-app conversation exists for a lead/buyer with Sales Executive Pooja Sharma
 */
router.post('/conversations/initiate', authenticateToken, async (req, res) => {
  try {
    const { leadId, projectId } = req.body;
    let targetLeadId = leadId;

    // Find Sales Executive Pooja Sharma
    const pooja = await prisma.user.findFirst({
      where: { role: 'SALES_EXECUTIVE', name: { contains: 'Pooja' } }
    });
    const poojaId = pooja?.id || '7aa5f616-116b-43f6-a0a1-3fe0b90b9cb2';

    if (!targetLeadId && req.user.role === 'BUYER') {
      const cleanPhone = (req.user.phone || '').replace(/\D/g, '').slice(-10);
      let existingLead = await prisma.lead.findFirst({
        where: {
          OR: [
            { email: req.user.email },
            cleanPhone ? { phone: { contains: cleanPhone } } : {}
          ]
        }
      });

      if (!existingLead) {
        existingLead = await prisma.lead.create({
          data: {
            fullName: req.user.name || 'Valued Homebuyer',
            email: req.user.email,
            phone: req.user.phone || '+919876543210',
            source: 'In-App Direct Chat',
            projectId: projectId || null,
            assignedExecutiveId: poojaId
          }
        });
      } else if (!existingLead.assignedExecutiveId) {
        existingLead = await prisma.lead.update({
          where: { id: existingLead.id },
          data: { assignedExecutiveId: poojaId }
        });
      }
      targetLeadId = existingLead.id;
    }

    if (!targetLeadId) {
      return res.status(400).json({ success: false, error: 'Lead ID is required' });
    }

    // Ensure the targeted lead has an assigned executive (defaulting to Pooja Sharma)
    const currentLead = await prisma.lead.findUnique({ where: { id: targetLeadId } });
    if (currentLead && !currentLead.assignedExecutiveId) {
      await prisma.lead.update({
        where: { id: targetLeadId },
        data: { assignedExecutiveId: poojaId }
      }).catch(() => { });
    }

    // Find existing conversation for this lead
    let conversation = await prisma.conversation.findFirst({
      where: { leadId: targetLeadId },
      include: {
        lead: {
          include: {
            assignedExecutive: { select: { id: true, name: true, phone: true } },
            project: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          leadId: targetLeadId,
          channel: 'In-App Realtime Chat'
        },
        include: {
          lead: {
            include: {
              assignedExecutive: { select: { id: true, name: true, phone: true } },
              project: { select: { id: true, name: true } }
            }
          }
        }
      });
    }

    res.json({ success: true, conversation });
  } catch (err) {
    console.error('Error initiating chat conversation:', err);
    res.status(500).json({ success: false, error: 'Failed to initiate conversation' });
  }
});

/**
 * GET /api/chat/conversations/:id/messages
 * Retrieve message history with timestamps, sender details, and read statuses
 */
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        lead: {
          include: { assignedExecutive: true }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    // RBAC check
    const { role, id: userId, email, phone } = req.user;
    let isAuthorized = false;

    if (['ADMIN', 'SUPER_ADMIN', 'SALES_HEAD'].includes(role)) {
      isAuthorized = true;
    } else if (role === 'SALES_EXECUTIVE') {
      isAuthorized = conversation.lead?.assignedExecutiveId === userId;
    } else if (role === 'BUYER') {
      const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
      const cleanLeadPhone = (conversation.lead?.phone || '').replace(/\D/g, '').slice(-10);
      isAuthorized =
        conversation.lead?.email === email ||
        (cleanPhone && cleanPhone === cleanLeadPhone);
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, error: 'Forbidden: You cannot access this chat.' });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    res.json({
      success: true,
      conversation: {
        id: conversation.id,
        leadId: conversation.leadId,
        lead: conversation.lead
      },
      messages
    });
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

/**
 * POST /api/chat/conversations/:id/messages
 * Send a message via REST API (fallback & compatibility)
 */
router.post('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, language = 'en' } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Message content cannot be empty' });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { lead: true }
    });

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    // RBAC validation
    const { role, id: userId, email, phone, name } = req.user;
    let isAuthorized = false;

    if (['ADMIN', 'SUPER_ADMIN', 'SALES_HEAD'].includes(role)) {
      isAuthorized = true;
    } else if (role === 'SALES_EXECUTIVE') {
      isAuthorized = conversation.lead?.assignedExecutiveId === userId;
    } else if (role === 'BUYER') {
      const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
      const cleanLeadPhone = (conversation.lead?.phone || '').replace(/\D/g, '').slice(-10);
      isAuthorized =
        conversation.lead?.email === email ||
        (cleanPhone && cleanPhone === cleanLeadPhone);
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, error: 'Forbidden: You cannot send messages in this conversation' });
    }

    const senderType = role === 'BUYER' ? 'buyer' : 'executive';

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderType,
        senderName: name || (senderType === 'buyer' ? 'Homebuyer' : 'Sales Advisor'),
        content: content.trim(),
        language,
        isRead: false
      }
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    // Real-time broadcast if socket is active
    const io = getIo();
    if (io) {
      io.to(`conversation:${id}`).emit('new_message', message);
      if (senderType === 'buyer' && conversation.lead?.assignedExecutiveId) {
        io.to(`user:${conversation.lead.assignedExecutiveId}`).emit('unread_notification', {
          conversationId: id,
          senderName: message.senderName,
          content: message.content
        });
      }
    }

    res.status(201).json({ success: true, message });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

/**
 * POST /api/chat/conversations/:id/read
 * Mark messages in conversation as read
 */
router.post('/conversations/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;
    const senderTypeToMark = role === 'BUYER' ? 'executive' : 'buyer';

    const result = await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderType: senderTypeToMark,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    const io = getIo();
    if (io) {
      io.to(`conversation:${id}`).emit('messages_read', {
        conversationId: id,
        readByUserId: req.user.id
      });
    }

    res.json({ success: true, updatedCount: result.count });
  } catch (err) {
    console.error('Error marking messages read:', err);
    res.status(500).json({ success: false, error: 'Failed to mark messages as read' });
  }
});

module.exports = router;

