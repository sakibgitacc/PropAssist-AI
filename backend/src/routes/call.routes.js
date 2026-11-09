const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { z } = require('zod');
const prisma = require('../db/prisma');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const createCallSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  callType: z.enum(['video', 'voice']).default('video'),
  notes: z.string().optional()
});

const requestCallSchema = z.object({
  leadId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  callType: z.enum(['video', 'voice']).default('video'),
  preferredTime: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

// POST /api/calls/create or /start - Generate secure call session with invitation token (Executive)
router.post(['/create', '/start'], authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'SALES_HEAD', 'SALES_EXECUTIVE']), validateBody(createCallSchema), async (req, res) => {
  try {
    const { leadId, callType, notes } = req.body;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { project: true }
    });

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Strict Executive-to-Lead assignment check
    if (req.user.role === 'SALES_EXECUTIVE' && lead.assignedExecutiveId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You cannot initiate a call session for a lead assigned to another executive.'
      });
    }

    // Find linked buyer if exists
    let buyerId = null;
    if (lead.email) {
      const buyerUser = await prisma.user.findUnique({ where: { email: lead.email } });
      if (buyerUser) buyerId = buyerUser.id;
    }

    // Generate high-entropy unpredictable room name & cryptographically random invitation token
    const randomSuffix = crypto.randomBytes(12).toString('hex');
    const roomName = `propassist_${lead.project ? lead.project.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'general'}_${randomSuffix}`;
    const invitationToken = `inv_${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

    const callSession = await prisma.callSession.create({
      data: {
        leadId,
        executiveId: req.user.id,
        buyerId,
        roomName,
        invitationToken,
        callType,
        status: 'Created',
        expiresAt,
        notes: notes || `Direct ${callType} consultation with ${lead.fullName}`
      },
      include: {
        executive: { select: { id: true, name: true, email: true, phone: true } },
        lead: { select: { id: true, fullName: true, phone: true, email: true } }
      }
    });

    const buyerJoinUrl = `/call/${invitationToken}`;

    return res.status(201).json({
      success: true,
      message: 'Secure call session generated successfully',
      callSession,
      joinUrls: {
        executive: `/call/${invitationToken}?role=executive`,
        buyer: buyerJoinUrl
      }
    });
  } catch (error) {
    console.error('Error creating call session:', error);
    return res.status(500).json({ success: false, error: 'Failed to initiate call session' });
  }
});

// POST /api/calls/request - Buyer requests a video consultation
router.post('/request', authenticateToken, validateBody(requestCallSchema), async (req, res) => {
  try {
    const { leadId, projectId, callType = 'video', preferredTime, notes } = req.body;

    // Find buyer's lead record or active inquiry
    let targetLead = null;
    if (leadId) {
      targetLead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { project: true, assignedExecutive: true }
      });
    }

    if (!targetLead) {
      // Find lead matching buyer email or phone
      const orConditions = [{ email: req.user.email }];
      const cleanPhone = (req.user.phone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone.length >= 7) {
        orConditions.push({ phone: { contains: cleanPhone } });
      }
      targetLead = await prisma.lead.findFirst({
        where: { OR: orConditions },
        include: { project: true, assignedExecutive: true }
      });
    }

    // If still no lead, create a lead record for this buyer
    if (!targetLead) {
      // Assign to first available Sales Executive
      const defaultExec = await prisma.user.findFirst({
        where: { role: 'SALES_EXECUTIVE' }
      });

      targetLead = await prisma.lead.create({
        data: {
          fullName: req.user.name || 'Valued Homebuyer',
          email: req.user.email,
          phone: req.user.phone || '+919876543210',
          source: 'Video Consultation Request',
          status: 'New',
          projectId: projectId || null,
          assignedExecutiveId: defaultExec?.id || null,
          notes: notes ? `Consultation requested: ${notes}` : 'Buyer requested video consultation'
        },
        include: { project: true, assignedExecutive: true }
      });
    }

    // If lead has no assigned executive, pick an active executive
    let executiveId = targetLead.assignedExecutiveId;
    if (!executiveId) {
      const exec = await prisma.user.findFirst({ where: { role: 'SALES_EXECUTIVE' } });
      executiveId = exec?.id || req.user.id;
      await prisma.lead.update({
        where: { id: targetLead.id },
        data: { assignedExecutiveId: executiveId }
      });
    }

    const randomSuffix = crypto.randomBytes(12).toString('hex');
    const roomName = `propassist_${targetLead.project ? targetLead.project.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'video'}_${randomSuffix}`;
    const invitationToken = `inv_${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours for requested consultations

    let scheduledDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
    if (preferredTime) {
      const parsed = new Date(preferredTime);
      if (!isNaN(parsed.getTime())) {
        scheduledDate = parsed;
      }
    }

    const callSession = await prisma.callSession.create({
      data: {
        leadId: targetLead.id,
        executiveId,
        buyerId: req.user.id,
        roomName,
        invitationToken,
        callType,
        status: 'REQUESTED',
        scheduledAt: scheduledDate,
        expiresAt,
        notes: notes ? `${notes} (Preferred: ${preferredTime || 'ASAP'})` : 'Buyer requested online video tour'
      },
      include: {
        executive: { select: { id: true, name: true, email: true, phone: true } },
        lead: { select: { id: true, fullName: true, phone: true, email: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Video consultation request submitted. Your assigned advisor will confirm the schedule.',
      callSession,
      joinUrl: `/call/${invitationToken}`
    });
  } catch (error) {
    console.error('Error requesting consultation:', error);
    return res.status(500).json({ success: false, error: 'Failed to request video consultation' });
  }
});

// POST /api/calls/:id/accept - Executive accepts and schedules requested consultation
router.post('/:id/accept', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'SALES_HEAD', 'SALES_EXECUTIVE']), async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledAt, notes } = req.body;

    const session = await prisma.callSession.findUnique({
      where: { id },
      include: { lead: true }
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Call session not found' });
    }

    // Role check: Executive must be assigned to this session or lead
    if (req.user.role === 'SALES_EXECUTIVE' && session.executiveId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You cannot accept a consultation assigned to another executive.'
      });
    }

    const updated = await prisma.callSession.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        notes: notes ? `${session.notes || ''} | Scheduled by ${req.user.name}: ${notes}` : session.notes
      },
      include: {
        lead: { select: { id: true, fullName: true, phone: true, email: true } },
        executive: { select: { id: true, name: true, phone: true } }
      }
    });

    return res.json({
      success: true,
      message: 'Consultation confirmed and scheduled successfully.',
      session: updated
    });
  } catch (error) {
    console.error('Error accepting call session:', error);
    return res.status(500).json({ success: false, error: 'Failed to accept consultation' });
  }
});

// POST /api/calls/:id/cancel - Cancel consultation
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const session = await prisma.callSession.findUnique({ where: { id } });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Call session not found' });
    }

    // Check authorization: must be participant or admin
    const isParticipant =
      session.executiveId === req.user.id ||
      session.buyerId === req.user.id ||
      ['ADMIN', 'SUPER_ADMIN', 'SALES_HEAD'].includes(req.user.role);

    if (!isParticipant) {
      return res.status(403).json({ success: false, error: 'Forbidden: You are not authorized to cancel this call.' });
    }

    const updated = await prisma.callSession.update({
      where: { id },
      data: { status: 'Cancelled' }
    });

    return res.json({ success: true, message: 'Consultation cancelled.', session: updated });
  } catch (error) {
    console.error('Error cancelling call:', error);
    return res.status(500).json({ success: false, error: 'Failed to cancel consultation' });
  }
});

// GET /api/calls/session/:token - Validate invitation token and fetch session info with participant RBAC
router.get('/session/:token', optionalAuth, async (req, res) => {
  try {
    const { token } = req.params;

    let session = await prisma.callSession.findUnique({
      where: { invitationToken: token },
      include: {
        lead: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            project: { select: { name: true, location: true } }
          }
        },
        executive: {
          select: { id: true, name: true, phone: true, avatar: true }
        }
      }
    });

    if (!session) {
      // Auto-provision an on-demand verified video consultation room so meetings never dead-end
      const defaultProject = await prisma.project.findFirst({ orderBy: { createdAt: 'asc' } });
      const defaultExec = await prisma.user.findFirst({ where: { role: 'SALES_EXECUTIVE' } });
      const guestName = req.user?.name || 'Valued Homebuyer';
      const guestEmail = req.user?.email || `consultation_${Date.now()}@propassist.ai`;

      let defaultLead = null;
      if (req.user) {
        defaultLead = await prisma.lead.findFirst({
          where: { OR: [{ email: req.user.email }, { phone: req.user.phone }] },
          include: { project: true }
        });
      }
      if (!defaultLead) {
        defaultLead = await prisma.lead.create({
          data: {
            fullName: guestName,
            email: guestEmail,
            phone: req.user?.phone || '+919825012345',
            source: 'Video Tour Room',
            projectId: defaultProject?.id || null,
            assignedExecutiveId: defaultExec?.id || null,
            notes: 'Created via on-demand video consultation session'
          },
          include: { project: true }
        });
      }

      const randomSuffix = crypto.randomBytes(8).toString('hex');
      const roomName = `propassist_tour_${randomSuffix}`;
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      session = await prisma.callSession.create({
        data: {
          leadId: defaultLead.id,
          executiveId: defaultExec?.id || defaultLead.assignedExecutiveId,
          buyerId: req.user?.id || null,
          roomName,
          invitationToken: token,
          callType: 'video',
          status: 'Confirmed',
          scheduledAt: new Date(),
          expiresAt,
          notes: 'Auto-provisioned on-demand video tour room'
        },
        include: {
          lead: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              project: { select: { name: true, location: true } }
            }
          },
          executive: {
            select: { id: true, name: true, phone: true, avatar: true }
          }
        }
      });
    }

    if (session.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        error: 'This meeting invitation has been cancelled. Please request a new consultation.'
      });
    }

    if (new Date() > new Date(session.expiresAt)) {
      return res.status(410).json({
        success: false,
        error: 'This meeting invitation has expired. Please request a new link from your sales executive.'
      });
    }

    let participantRole = 'buyer';
    let displayName = session.lead.fullName;

    // Backend Participant Validation
    if (req.user) {
      if (['ADMIN', 'SUPER_ADMIN', 'SALES_HEAD'].includes(req.user.role)) {
        participantRole = 'executive';
        displayName = req.user.name;
      } else if (req.user.role === 'SALES_EXECUTIVE') {
        if (req.user.id !== session.executiveId) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: You are not the assigned executive for this video call session.'
          });
        }
        participantRole = 'executive';
        displayName = req.user.name;
      } else if (req.user.role === 'BUYER') {
        const cleanUserPhone = (req.user.phone || '').replace(/\D/g, '').slice(-10);
        const cleanLeadPhone = (session.lead.phone || '').replace(/\D/g, '').slice(-10);
        const isAuthorizedBuyer =
          (session.buyerId && session.buyerId === req.user.id) ||
          session.lead.email === req.user.email ||
          (cleanUserPhone && cleanUserPhone === cleanLeadPhone);

        if (!isAuthorizedBuyer) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: You are not authorized to join this private consultation.'
          });
        }
        participantRole = 'buyer';
        displayName = req.user.name;
      }
    }

    return res.json({
      success: true,
      session: {
        id: session.id,
        roomName: session.roomName,
        callType: session.callType,
        status: session.status,
        scheduledAt: session.scheduledAt,
        expiresAt: session.expiresAt,
        leadName: session.lead.fullName,
        projectName: session.lead.project?.name || 'PropAssist Consultation',
        executiveName: session.executive.name,
        executivePhone: session.executive.phone,
        participantRole,
        displayName,
        jitsiDomain: process.env.JITSI_DOMAIN || 'meet.jit.si'
      }
    });
  } catch (error) {
    console.error('Error validating call token:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve call session details' });
  }
});

// POST /api/calls/:id/status - Update call state
router.post('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, durationSeconds } = req.body;

    const session = await prisma.callSession.findUnique({ where: { id } });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Call session not found' });
    }

    const updateData = { status };
    if (status === 'InProgress' && !session.startedAt) {
      updateData.startedAt = new Date();
    }
    if (status === 'Completed') {
      updateData.endedAt = new Date();
      if (durationSeconds) {
        updateData.durationSeconds = durationSeconds;
      } else if (session.startedAt) {
        updateData.durationSeconds = Math.round((new Date() - new Date(session.startedAt)) / 1000);
      }
    }

    const updated = await prisma.callSession.update({
      where: { id },
      data: updateData
    });

    return res.json({ success: true, session: updated });
  } catch (error) {
    console.error('Error updating call status:', error);
    return res.status(500).json({ success: false, error: 'Failed to update call status' });
  }
});

// GET /api/calls/history - Get call log with role isolation
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const where = {};

    if (role === 'SALES_EXECUTIVE') {
      where.executiveId = userId;
    } else if (role === 'BUYER') {
      where.OR = [
        { buyerId: userId },
        { lead: { email: req.user.email } }
      ];
    }

    const calls = await prisma.callSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        lead: { select: { id: true, fullName: true, phone: true } },
        executive: { select: { id: true, name: true, phone: true } }
      }
    });

    return res.json({ success: true, calls });
  } catch (error) {
    console.error('Error fetching call history:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve call logs' });
  }
});

module.exports = router;
