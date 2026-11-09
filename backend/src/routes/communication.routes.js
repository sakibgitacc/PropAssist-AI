const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');
const whatsappService = require('../services/whatsapp.service');
const smsService = require('../services/sms.service');

/**
 * GET /api/whatsapp/templates
 * Returns official Click-to-Chat message templates for EN, HI, and GU
 */
router.get('/whatsapp/templates', (req, res) => {
  res.json({
    success: true,
    languages: [
      { code: 'en', label: 'English' },
      { code: 'hi', label: 'हिन्दी (Hindi)' },
      { code: 'gu', label: 'ગુજરાતી (Gujarati)' }
    ],
    templates: [
      {
        key: 'buyer_enquiry',
        name: 'Buyer Enquiry',
        descriptions: {
          en: 'Inquiry regarding 2/3 BHK residential properties',
          hi: '2/3 BHK आवासीय संपत्ति पूछताछ',
          gu: '2/3 BHK રહેણાંક પ્રોપર્ટી અંગે પૂછપરછ'
        },
        translations: whatsappService.MESSAGE_TEMPLATES.buyer_enquiry
      },
      {
        key: 'site_visit',
        name: 'Site Visit Scheduled',
        descriptions: {
          en: 'Notification regarding scheduled site visit',
          hi: 'निर्धारित साइट विज़िट संबंधी सूचना',
          gu: 'નિયત સાઇટ મુલાકાત સંબંધિત માહિતી'
        },
        translations: whatsappService.MESSAGE_TEMPLATES.site_visit
      },
      {
        key: 'executive_followup',
        name: 'Executive Follow-up',
        descriptions: {
          en: 'Sales executive follow-up discussion request',
          hi: 'सेल्स एक्ज़ीक्यूटिव फॉलो-अप चर्चा अनुरोध',
          gu: 'સેલ્સ એક્ઝિક્યુટિવ ફોલો-અપ ચર્ચા વિનંતી'
        },
        translations: whatsappService.MESSAGE_TEMPLATES.executive_followup
      }
    ]
  });
});

/**
 * POST /api/whatsapp/link
 * Prepare official WhatsApp Click-to-Chat deep link & record WHATSAPP_LINK_OPENED activity
 * STRICTLY NO API: No automated sending, no fake delivery statuses.
 */
router.post('/whatsapp/link', authenticateToken, async (req, res) => {
  try {
    const {
      leadId,
      executiveId,
      phone,
      recipientName,
      messageText,
      templateKey,
      language = 'en',
      customVariables = {}
    } = req.body;

    let targetPhone = phone;
    let targetName = recipientName;
    let linkedLead = null;

    // RBAC and Ownership Validation
    if (leadId) {
      linkedLead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          assignedExecutive: { select: { id: true, name: true, phone: true } },
          project: { select: { name: true } }
        }
      });

      if (!linkedLead) {
        return res.status(404).json({ success: false, error: 'Target lead not found.' });
      }

      // Sales Executive can only chat with leads assigned to them
      if (req.user.role === 'SALES_EXECUTIVE' && linkedLead.assignedExecutiveId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You are not assigned to this lead and cannot open WhatsApp communication.'
        });
      }

      // Buyer can only chat with their assigned executive for their own lead
      if (req.user.role === 'BUYER') {
        const cleanUserPhone = (req.user.phone || '').replace(/\D/g, '').slice(-10);
        const cleanLeadPhone = (linkedLead.phone || '').replace(/\D/g, '').slice(-10);
        const isOwner = linkedLead.email === req.user.email || (cleanUserPhone && cleanUserPhone === cleanLeadPhone);

        if (!isOwner) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: You cannot access communication for another buyer.'
          });
        }

        // If Buyer is initiating, target the assigned executive's phone
        if (!targetPhone) {
          targetPhone = linkedLead.assignedExecutive?.phone || '+917900000000';
          targetName = linkedLead.assignedExecutive?.name || 'Sales Advisor';
        }
      }

      if (!targetPhone) {
        targetPhone = linkedLead.phone;
        targetName = linkedLead.fullName;
      }
    } else if (executiveId) {
      const exec = await prisma.user.findUnique({ where: { id: executiveId } });
      if (!exec) {
        return res.status(404).json({ success: false, error: 'Executive not found.' });
      }
      targetPhone = exec.phone || '+917900000000';
      targetName = exec.name;
    } else if (req.user.role === 'BUYER') {
      // Find buyer's assigned executive from lead or first available executive
      const cleanUserPhone = (req.user.phone || '').replace(/\D/g, '').slice(-10);
      const orConditions = [{ email: req.user.email }];
      if (cleanUserPhone.length >= 7) {
        orConditions.push({ phone: { contains: cleanUserPhone } });
      }
      const buyerLead = await prisma.lead.findFirst({
        where: { OR: orConditions },
        include: { assignedExecutive: true }
      });
      if (buyerLead?.assignedExecutive?.phone) {
        targetPhone = buyerLead.assignedExecutive.phone;
        targetName = buyerLead.assignedExecutive.name;
      } else {
        const defaultExec = await prisma.user.findFirst({ where: { role: 'SALES_EXECUTIVE' } });
        targetPhone = defaultExec?.phone || phone || '+919825054321';
        targetName = defaultExec?.name || recipientName || 'Sales Advisor';
      }
    }

    if (!targetPhone) {
      return res.status(400).json({ success: false, error: 'Recipient phone number is required.' });
    }

    // Generate WhatsApp deep link
    const linkResult = whatsappService.generateWhatsAppLink({
      phone: targetPhone,
      messageText,
      templateKey,
      language,
      customVariables
    });

    if (!linkResult.success) {
      return res.status(400).json({ success: false, error: linkResult.error });
    }

    // Record the activity in CommunicationLog with WHATSAPP_LINK_OPENED status
    // Safe create to prevent failure if optional schema columns differ
    const communication = await prisma.communicationLog.create({
      data: {
        channel: 'WhatsApp (Click-to-Chat)',
        direction: 'OUTBOUND',
        recipient: linkResult.phone,
        recipientName: targetName || 'Prospective Buyer',
        messageContent: linkResult.message,
        status: 'WHATSAPP_LINK_OPENED',
        providerMessageId: `wa_click_${Date.now()}`,
        leadId: leadId || null,
        userId: req.user?.id || null
      }
    }).catch((err) => {
      console.warn('CommunicationLog create notice:', err.message);
      return { id: `comm_${Date.now()}` };
    });

    // Record audit log for regulatory compliance
    await prisma.auditLog.create({
      data: {
        action: 'WHATSAPP_LINK_OPENED',
        performedBy: req.user.name || req.user.email,
        role: req.user.role,
        details: `WhatsApp Click-to-Chat prepared for recipient ${linkResult.phone} (${targetName || 'User'}). Link opened manually by ${req.user.role}.`
      }
    }).catch(() => {});

    res.json({
      success: true,
      message: 'WhatsApp Click-to-Chat link generated. Please edit or send manually in WhatsApp.',
      data: {
        url: linkResult.url,
        formattedPhone: linkResult.phone,
        recipientName: targetName,
        message: linkResult.message,
        status: 'WHATSAPP_LINK_OPENED',
        communicationId: communication.id,
        instructions: 'Clicking the link will launch WhatsApp Web on desktop or the WhatsApp application on mobile devices. You can review, edit, and send the message manually.'
      }
    });
  } catch (err) {
    console.error('Error generating WhatsApp Click-to-Chat link:', err);
    res.status(500).json({ success: false, error: 'Failed to generate WhatsApp link.' });
  }
});

/**
 * POST /api/sms/send
 * Send Transactional SMS via MSG91 adapter (Staff only)
 */
router.post('/sms/send', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'SALES_HEAD', 'SALES_EXECUTIVE']), async (req, res) => {
  try {
    const { to, message, leadId } = req.body;

    if (!to || !message) {
      return res.status(400).json({ success: false, error: 'Recipient phone number and message are required.' });
    }

    const result = await smsService.sendSMS({ to, message });

    const log = await prisma.communicationLog.create({
      data: {
        channel: 'SMS',
        direction: 'OUTBOUND',
        recipient: to,
        recipientName: 'Recipient',
        messageContent: message,
        status: result.status,
        providerMessageId: result.requestId,
        leadId: leadId || null,
        userId: req.user.id
      }
    });

    res.json({
      success: true,
      message: 'Transactional SMS sent.',
      data: { log, result }
    });
  } catch (err) {
    console.error('Error sending SMS:', err);
    res.status(500).json({ success: false, error: 'Failed to send SMS.' });
  }
});

/**
 * GET /api/communications
 * View communication logs (Role-isolated)
 */
router.get(['/communications', '/'], authenticateToken, async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { channel, leadId } = req.query;

    const where = {};
    if (channel) {
      if (channel === 'WhatsApp') {
        where.channel = { contains: 'WhatsApp' };
      } else {
        where.channel = channel;
      }
    }
    if (leadId) where.leadId = leadId;

    if (role === 'SALES_EXECUTIVE') {
      where.OR = [
        { userId },
        { lead: { assignedExecutiveId: userId } }
      ];
    } else if (role === 'BUYER') {
      where.userId = userId;
    }

    const logs = await prisma.communicationLog.findMany({
      where,
      include: {
        lead: { select: { id: true, fullName: true, phone: true } },
        user: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    console.error('Error fetching communications:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch communication logs.' });
  }
});

module.exports = router;
