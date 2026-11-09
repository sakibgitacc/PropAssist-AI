const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../db/prisma');
const { generateAiChatResponse } = require('../services/ai.service');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  conversationId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  language: z.enum(['en', 'hi', 'gu']).default('en'),
  buyerName: z.string().optional().nullable(),
  buyerPhone: z.string().optional().nullable()
});

// POST /api/ai/chat - Main multilingual chat endpoint
router.post('/chat', optionalAuth, validateBody(chatSchema), async (req, res) => {
  try {
    const { message, conversationId, leadId, language, buyerName, buyerPhone } = req.body;

    let targetConversationId = conversationId;
    let targetLeadId = leadId;

    // 1. If user is authenticated or buyer info provided and no lead exists, find or create Lead
    if (!targetLeadId && req.user) {
      const orConditions = [{ email: req.user.email }];
      const cleanUserPhone = (req.user.phone || '').replace(/\D/g, '').slice(-10);
      if (cleanUserPhone.length >= 7) {
        orConditions.push({ phone: { contains: cleanUserPhone } });
      }
      let existingLead = await prisma.lead.findFirst({
        where: { OR: orConditions }
      });

      if (!existingLead) {
        const defaultExec = await prisma.user.findFirst({
          where: { role: 'SALES_EXECUTIVE', name: { contains: 'Pooja' } }
        }) || await prisma.user.findFirst({ where: { role: 'SALES_EXECUTIVE' } });
        existingLead = await prisma.lead.create({
          data: {
            fullName: req.user.name || buyerName || 'Valued Homebuyer',
            email: req.user.email,
            phone: req.user.phone || buyerPhone || '+918530493687',
            source: 'AI Chatbot',
            status: 'New',
            isQualified: false,
            assignedExecutiveId: defaultExec?.id || null
          }
        });
      }
      targetLeadId = existingLead.id;
    } else if (!targetLeadId && buyerPhone) {
      const cleanPhone = buyerPhone.replace(/[\s\-\(\)]/g, '');
      let existingLead = await prisma.lead.findFirst({
        where: { phone: { contains: cleanPhone.slice(-10) } }
      });

      if (!existingLead) {
        const defaultExec = await prisma.user.findFirst({
          where: { role: 'SALES_EXECUTIVE', name: { contains: 'Pooja' } }
        }) || await prisma.user.findFirst({ where: { role: 'SALES_EXECUTIVE' } });
        existingLead = await prisma.lead.create({
          data: {
            fullName: buyerName || 'Website Visitor',
            phone: buyerPhone,
            source: 'AI Chatbot',
            status: 'New',
            isQualified: false,
            assignedExecutiveId: defaultExec?.id || null
          }
        });
      }
      targetLeadId = existingLead.id;
    }

    // 2. Ensure conversation exists
    let conversation;
    if (targetConversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: targetConversationId },
        include: {
          messages: { orderBy: { createdAt: 'asc' }, take: 20 }
        }
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          leadId: targetLeadId || null,
          language: language || 'en',
          channel: 'Web Chat'
        },
        include: { messages: true }
      });
      targetConversationId = conversation.id;
    }

    // 3. Save incoming buyer/user message to database
    await prisma.message.create({
      data: {
        conversationId: targetConversationId,
        senderType: req.user && req.user.role !== 'BUYER' ? 'executive' : 'buyer',
        senderName: req.user ? req.user.name : (buyerName || 'Buyer'),
        content: message,
        language
      }
    });

    // 4. Generate AI response (grounded in project fact sheets)
    const aiResult = await generateAiChatResponse({
      message,
      conversationHistory: conversation.messages,
      conversationId: targetConversationId,
      leadId: targetLeadId,
      language
    });

    let handoffInfo = null;

    // 5. Check if Human Handoff is triggered
    if (aiResult.toolCall && aiResult.toolCall.action === 'request_human_handoff') {
      // Pick active executive
      const executive = await prisma.user.findFirst({
        where: { role: { in: ['SALES_EXECUTIVE', 'SALES_HEAD'] } },
        orderBy: { createdAt: 'asc' }
      });

      if (executive) {
        // Mark conversation as handed off
        await prisma.conversation.update({
          where: { id: targetConversationId },
          data: {
            handedOff: true,
            handedOffToId: executive.id,
            handedOffAt: new Date(),
            summary: `Automated handoff requested. Conversation summary: Buyer expressed high interest and asked for human executive assistance.`
          }
        });

        // Update lead assignment if lead exists
        if (targetLeadId) {
          await prisma.lead.update({
            where: { id: targetLeadId },
            data: {
              assignedExecutiveId: executive.id,
              status: 'Contacted',
              isQualified: true
            }
          });

          await prisma.leadAssignment.create({
            data: {
              leadId: targetLeadId,
              executiveId: executive.id,
              reason: 'AI Chatbot intelligent handoff'
            }
          });

          // Post internal note for executive
          await prisma.internalNote.create({
            data: {
              leadId: targetLeadId,
              authorId: executive.id,
              content: `[AI System Alert]: Buyer conversation handed off from AI chatbot. Key inquiry: "${message}". Please review conversation history and contact buyer.`
            }
          });
        }

        handoffInfo = {
          executiveName: executive.name,
          executivePhone: executive.phone,
          status: 'Executive Assigned'
        };
      }
    }

    // 6. Save AI response message to database
    const savedAiMsg = await prisma.message.create({
      data: {
        conversationId: targetConversationId,
        senderType: 'ai',
        senderName: 'PropAssist AI',
        content: aiResult.reply,
        toolCalls: aiResult.toolCall ? JSON.stringify(aiResult.toolCall) : null,
        language
      }
    });

    return res.json({
      success: true,
      conversationId: targetConversationId,
      leadId: targetLeadId,
      reply: savedAiMsg.content,
      language: language || 'en',
      message: {
        id: savedAiMsg.id,
        content: savedAiMsg.content,
        senderType: 'ai',
        createdAt: savedAiMsg.createdAt,
        toolCalls: aiResult.toolCall
      },
      toolCalls: aiResult.toolCall,
      handoff: handoffInfo
    });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ success: false, error: 'Internal chat processing error' });
  }
});

// GET /api/ai/active - Get latest active conversation for returning authenticated buyer
router.get('/active', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ success: true, conversation: null });
    }

    const cleanPhone = (req.user.phone || '').replace(/[\s\-\(\)]/g, '');
    const orConditions = [{ lead: { email: req.user.email } }];
    if (cleanPhone.length >= 7) {
      orConditions.push({ lead: { phone: { contains: cleanPhone.slice(-10) } } });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { OR: orConditions },
      orderBy: { updatedAt: 'desc' },
      include: {
        lead: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            status: true
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return res.json({
      success: true,
      conversation: conversation || null
    });
  } catch (err) {
    console.error('Error fetching active conversation:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve active conversation' });
  }
});

// GET /api/ai/conversations - List conversations (role-filtered for security)
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { handedOffOnly } = req.query;
    const where = {};
    if (handedOffOnly === 'true') {
      where.handedOff = true;
    }

    if (req.user.role === 'BUYER') {
      const cleanPhone = (req.user.phone || '').replace(/[\s\-\(\)]/g, '');
      const orConditions = [{ lead: { email: req.user.email } }];
      if (cleanPhone.length >= 7) {
        orConditions.push({ lead: { phone: { contains: cleanPhone.slice(-10) } } });
      }
      where.OR = orConditions;
    } else if (req.user.role === 'SALES_EXECUTIVE') {
      where.OR = [
        { handedOffToId: req.user.id },
        { lead: { assignedExecutiveId: req.user.id } }
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        lead: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            status: true,
            project: { select: { name: true } }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return res.json({ success: true, conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve conversations' });
  }
});

// GET /api/ai/conversations/:id - Single conversation history (Strict role isolation)
router.get('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        lead: {
          include: {
            project: true,
            assignedExecutive: { select: { id: true, name: true, phone: true } }
          }
        },
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    // Strict role isolation check
    if (req.user.role === 'BUYER') {
      const cleanPhone = (req.user.phone || '').replace(/[\s\-\(\)]/g, '').slice(-10);
      const isOwner = (conversation.lead && conversation.lead.email === req.user.email) ||
                      (conversation.lead && cleanPhone.length >= 7 && conversation.lead.phone.includes(cleanPhone));
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You cannot access another buyer\'s AI conversation.'
        });
      }
    } else if (req.user.role === 'SALES_EXECUTIVE') {
      const isAssigned = conversation.handedOffToId === req.user.id ||
                         (conversation.lead && conversation.lead.assignedExecutiveId === req.user.id);
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Conversation is not assigned to you.'
        });
      }
    }

    return res.json({ success: true, conversation });
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve conversation messages' });
  }
});

// POST /api/ai/handoff - Manual trigger for human handoff
router.post('/handoff', async (req, res) => {
  try {
    const { conversationId, executiveId } = req.body;
    if (!conversationId) {
      return res.status(400).json({ success: false, error: 'Conversation ID is required' });
    }

    const executive = executiveId
      ? await prisma.user.findUnique({ where: { id: executiveId } })
      : await prisma.user.findFirst({ where: { role: { in: ['SALES_EXECUTIVE', 'SALES_HEAD'] } } });

    if (!executive) {
      return res.status(404).json({ success: false, error: 'Executive not found' });
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        handedOff: true,
        handedOffToId: executive.id,
        handedOffAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: `Conversation transferred to ${executive.name}`,
      conversation: updated
    });
  } catch (error) {
    console.error('Error initiating handoff:', error);
    return res.status(500).json({ success: false, error: 'Failed to initiate handoff' });
  }
});

module.exports = router;
