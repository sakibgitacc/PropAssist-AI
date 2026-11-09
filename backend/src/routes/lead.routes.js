const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../db/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const createLeadSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(7, 'Phone number is required'),
  email: z.string().email('Invalid email address').optional().nullable(),
  budgetMin: z.number().optional().nullable(),
  budgetMax: z.number().optional().nullable(),
  preferredBhk: z.string().optional().nullable(),
  preferredLocation: z.string().optional().nullable(),
  timeline: z.string().optional().nullable(),
  source: z.string().default('AI Chatbot'),
  projectId: z.string().optional().nullable(),
  assignedExecutiveId: z.string().optional().nullable(),
  status: z.enum([
    'New',
    'Contacted',
    'Qualified',
    'Visit Scheduled',
    'Visited',
    'Negotiation',
    'Converted',
    'Lost'
  ]).default('New'),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isQualified: z.boolean().default(false)
});

const updateLeadSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(7).optional(),
  email: z.string().email().optional().nullable(),
  budgetMin: z.number().optional().nullable(),
  budgetMax: z.number().optional().nullable(),
  preferredBhk: z.string().optional().nullable(),
  preferredLocation: z.string().optional().nullable(),
  timeline: z.string().optional().nullable(),
  source: z.string().optional(),
  projectId: z.string().optional().nullable(),
  assignedExecutiveId: z.string().optional().nullable(),
  status: z.enum([
    'New',
    'Contacted',
    'Qualified',
    'Visit Scheduled',
    'Visited',
    'Negotiation',
    'Converted',
    'Lost'
  ]).optional(),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isQualified: z.boolean().optional()
});

// GET /api/leads - List leads with filters, search, and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      search,
      status,
      projectId,
      assignedExecutiveId,
      source,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    // Strict Role-Based Lead Access Control
    if (req.user.role === 'BUYER') {
      const userEmail = (req.user.email || '').toLowerCase().trim();
      const cleanPhone = (req.user.phone || '').replace(/[\s\-\(\)]/g, '');
      const orConditions = [{ email: { equals: userEmail, mode: 'insensitive' } }];

      const dummyPhones = ['1234567890', '0000000000', '9999999999', '1111111111', '123456789'];
      if (cleanPhone.length >= 10 && !dummyPhones.includes(cleanPhone)) {
        orConditions.push({
          AND: [
            { phone: { contains: cleanPhone.slice(-10) } },
            {
              OR: [
                { email: null },
                { email: '' },
                { email: { equals: userEmail, mode: 'insensitive' } }
              ]
            }
          ]
        });
      }
      where.OR = orConditions;
      // Filter out empty self-registered user artifacts without any actual inquiry details
      where.NOT = {
        source: 'Self-Registered Buyer',
        projectId: null,
        preferredBhk: null
      };
    } else if (req.user.role === 'SALES_EXECUTIVE') {
      // Sales executive can ONLY view leads currently assigned to them
      where.assignedExecutiveId = req.user.id;
    } else if (assignedExecutiveId) {
      where.assignedExecutiveId = assignedExecutiveId;
    }

    if (status && status !== 'All') {
      where.status = status;
    }

    if (projectId && projectId !== 'All') {
      where.projectId = projectId;
    }

    if (source && source !== 'All') {
      where.source = source;
    }

    if (search) {
      const searchClean = search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { fullName: { contains: searchClean } },
            { phone: { contains: searchClean } },
            { email: { contains: searchClean } },
            { notes: { contains: searchClean } }
          ]
        }
      ];
    }

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc' },
        include: {
          project: { select: { id: true, name: true, location: true } },
          assignedExecutive: { select: { id: true, name: true, email: true, phone: true } },
          bookings: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { id: true, bookingDate: true, timeSlot: true, status: true, confirmationCode: true }
          },
          _count: {
            select: { conversations: true, internalNotes: true, callSessions: true }
          }
        }
      })
    ]);

    return res.json({
      success: true,
      leads,
      data: leads,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve leads' });
  }
});

// GET /api/leads/:id - Single lead detail with relations
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        project: true,
        assignedExecutive: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        conversations: {
          include: {
            messages: { orderBy: { createdAt: 'asc' } }
          },
          orderBy: { createdAt: 'desc' }
        },
        bookings: {
          include: { slot: true },
          orderBy: { createdAt: 'desc' }
        },
        internalNotes: {
          include: {
            author: { select: { id: true, name: true, role: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        assignments: {
          include: {
            executive: { select: { id: true, name: true } },
            assignedBy: { select: { id: true, name: true } }
          },
          orderBy: { assignedAt: 'desc' }
        },
        callSessions: {
          include: {
            executive: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        reminders: {
          orderBy: { scheduledFor: 'asc' }
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Role-based authorization for single lead detail
    if (req.user.role === 'SALES_EXECUTIVE' && lead.assignedExecutiveId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied: You are not assigned to this lead.' });
    }

    if (req.user.role === 'BUYER') {
      const cleanPhone = (req.user.phone || '').replace(/[\s\-\(\)]/g, '').slice(-10);
      const isOwner = lead.email === req.user.email || (cleanPhone.length >= 7 && lead.phone.includes(cleanPhone));
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Access denied: You cannot view another buyer\'s details.' });
      }
    }

    return res.json({ success: true, lead });
  } catch (error) {
    console.error('Error fetching lead details:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve lead details' });
  }
});

// POST /api/leads - Create lead with duplicate detection
router.post('/', validateBody(createLeadSchema), async (req, res) => {
  try {
    const data = req.body;

    // Optional authentication detection for buyer inquiries
    let authenticatedUser = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        authenticatedUser = jwt.verify(token, process.env.JWT_SECRET || 'propassist_jwt_super_secure_secret_token_2026_xyz');
      } catch (tokenErr) {}
    }

    const effectiveEmail = authenticatedUser?.email || (data.email ? data.email.toLowerCase().trim() : null);
    const effectiveName = authenticatedUser?.name || data.fullName;

    // Ensure assigned executive is Pooja Sharma (Senior Executive)
    let assignedExecutiveId = data.assignedExecutiveId;
    if (!assignedExecutiveId) {
      const pooja = await prisma.user.findFirst({
        where: { role: 'SALES_EXECUTIVE', name: { contains: 'Pooja' } }
      });
      if (pooja) {
        assignedExecutiveId = pooja.id;
      }
    }

    // Duplicate detection
    const trimmedPhone = data.phone.trim();
    const cleanDigits = data.phone.replace(/\D/g, '').slice(-10);

    let existingDuplicate = null;
    if (authenticatedUser && effectiveEmail) {
      // For authenticated buyers: check if this buyer already has an identical inquiry for the same project & BHK
      existingDuplicate = await prisma.lead.findFirst({
        where: {
          email: effectiveEmail,
          ...(data.projectId ? { projectId: data.projectId } : {}),
          ...(data.preferredBhk ? { preferredBhk: data.preferredBhk } : {})
        },
        include: {
          assignedExecutive: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } }
        }
      });
    } else {
      existingDuplicate = await prisma.lead.findFirst({
        where: {
          OR: [
            { phone: trimmedPhone },
            { phone: { contains: cleanDigits.length >= 7 ? cleanDigits : trimmedPhone } },
            ...(effectiveEmail ? [{ email: effectiveEmail }] : [])
          ]
        },
        include: {
          assignedExecutive: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } }
        }
      });
    }

    if (existingDuplicate) {
      // Update gracefully if same buyer is refreshing preferences
      if (authenticatedUser || authHeader) {
        const updatedLead = await prisma.lead.update({
          where: { id: existingDuplicate.id },
          data: {
            projectId: data.projectId || existingDuplicate.projectId,
            preferredBhk: data.preferredBhk || existingDuplicate.preferredBhk,
            budgetMin: data.budgetMin || existingDuplicate.budgetMin,
            budgetMax: data.budgetMax || existingDuplicate.budgetMax,
            assignedExecutiveId: assignedExecutiveId || existingDuplicate.assignedExecutiveId,
            notes: data.notes ? `${existingDuplicate.notes ? existingDuplicate.notes + ' | ' : ''}${data.notes}` : existingDuplicate.notes
          },
          include: { project: true, assignedExecutive: true }
        });
        return res.status(200).json({
          success: true,
          message: 'Inquiry preferences updated successfully',
          lead: updatedLead,
          data: updatedLead
        });
      }

      return res.status(409).json({
        success: false,
        error: 'Duplicate lead detected',
        duplicateLead: {
          id: existingDuplicate.id,
          fullName: existingDuplicate.fullName,
          phone: existingDuplicate.phone,
          status: existingDuplicate.status,
          assignedExecutive: existingDuplicate.assignedExecutive?.name || 'Unassigned',
          project: existingDuplicate.project?.name || 'None'
        }
      });
    }

    const newLead = await prisma.lead.create({
      data: {
        fullName: effectiveName || data.fullName,
        phone: data.phone,
        email: effectiveEmail,
        budgetMin: data.budgetMin || null,
        budgetMax: data.budgetMax || null,
        preferredBhk: data.preferredBhk || null,
        preferredLocation: data.preferredLocation || null,
        timeline: data.timeline || 'Within 3 Months',
        source: data.source || 'Buyer Dashboard Inquiry',
        status: data.status || 'New',
        projectId: data.projectId || null,
        assignedExecutiveId: assignedExecutiveId || null,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        notes: data.notes || null,
        isQualified: data.isQualified || false
      },
      include: {
        project: true,
        assignedExecutive: true
      }
    });

    // If executive assigned during creation, record in LeadAssignment
    if (newLead.assignedExecutiveId) {
      await prisma.leadAssignment.create({
        data: {
          leadId: newLead.id,
          executiveId: newLead.assignedExecutiveId,
          assignedById: authenticatedUser ? authenticatedUser.userId || authenticatedUser.id : null,
          reason: 'Initial assignment upon lead creation'
        }
      }).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead: newLead,
      data: newLead
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    return res.status(500).json({ success: false, error: 'Failed to create lead' });
  }
});

// PATCH /api/leads/:id - Partial update (alias for PUT, used by Sales Executive frontend)
router.patch('/:id', authenticateToken, validateBody(updateLeadSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingLead = await prisma.lead.findUnique({ where: { id } });
    if (!existingLead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    if (req.user.role === 'BUYER') {
      return res.status(403).json({ success: false, error: 'Forbidden: Buyers cannot modify lead records.' });
    }

    if (req.user.role === 'SALES_EXECUTIVE' && existingLead.assignedExecutiveId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden: You cannot modify leads assigned to another executive.' });
    }

    // Executives cannot reassign leads
    if (data.assignedExecutiveId && data.assignedExecutiveId !== existingLead.assignedExecutiveId) {
      if (req.user.role === 'SALES_EXECUTIVE') {
        delete data.assignedExecutiveId;
      } else {
        await prisma.leadAssignment.create({
          data: {
            leadId: id,
            executiveId: data.assignedExecutiveId,
            assignedById: req.user.id,
            reason: 'Lead reassignment by management'
          }
        });
      }
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        ...data,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        updatedAt: new Date()
      },
      include: {
        project: true,
        assignedExecutive: true
      }
    });

    return res.json({
      success: true,
      message: 'Lead updated successfully',
      lead: updatedLead
    });
  } catch (error) {
    console.error('Error updating lead (PATCH):', error);
    return res.status(500).json({ success: false, error: 'Failed to update lead' });
  }
});

// PUT /api/leads/:id - Update lead details
router.put('/:id', authenticateToken, validateBody(updateLeadSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingLead = await prisma.lead.findUnique({ where: { id } });
    if (!existingLead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Role-based authorization for updating lead
    if (req.user.role === 'BUYER') {
      return res.status(403).json({ success: false, error: 'Forbidden: Buyers cannot modify internal sales lead records.' });
    }

    if (req.user.role === 'SALES_EXECUTIVE' && existingLead.assignedExecutiveId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden: You cannot modify leads assigned to another executive.' });
    }

    // Check if executive assignment changed (Only Management can change executive assignment)
    if (data.assignedExecutiveId && data.assignedExecutiveId !== existingLead.assignedExecutiveId) {
      if (req.user.role === 'SALES_EXECUTIVE') {
        delete data.assignedExecutiveId; // Executives cannot reassign leads themselves
      } else {
        await prisma.leadAssignment.create({
          data: {
            leadId: id,
            executiveId: data.assignedExecutiveId,
            assignedById: req.user.id,
            reason: 'Lead reassignment by management'
          }
        });
      }
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        ...data,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        updatedAt: new Date()
      },
      include: {
        project: true,
        assignedExecutive: true
      }
    });

    return res.json({
      success: true,
      message: 'Lead updated successfully',
      lead: updatedLead
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    return res.status(500).json({ success: false, error: 'Failed to update lead' });
  }
});

// POST /api/leads/:id/assign - Assign lead to an executive (Management only)
router.post('/:id/assign', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'SALES_HEAD']), async (req, res) => {
  try {
    const { id } = req.params;
    const { executiveId, reason } = req.body;

    if (!executiveId) {
      return res.status(400).json({ success: false, error: 'Executive ID is required' });
    }

    const executive = await prisma.user.findUnique({ where: { id: executiveId } });
    if (!executive) {
      return res.status(404).json({ success: false, error: 'Target executive not found' });
    }

    const [updatedLead] = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: {
          assignedExecutiveId: executiveId,
          status: 'Contacted'
        },
        include: { assignedExecutive: true }
      }),
      prisma.leadAssignment.create({
        data: {
          leadId: id,
          executiveId: executiveId,
          assignedById: req.user.id,
          reason: reason || 'Direct manual assignment'
        }
      })
    ]);

    return res.json({
      success: true,
      message: `Lead assigned to ${executive.name}`,
      lead: updatedLead
    });
  } catch (error) {
    console.error('Error assigning lead:', error);
    return res.status(500).json({ success: false, error: 'Failed to assign lead' });
  }
});

// POST /api/leads/:id/notes - Add internal note
router.post('/:id/notes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Note content cannot be empty' });
    }

    const note = await prisma.internalNote.create({
      data: {
        leadId: id,
        authorId: req.user.id,
        content: content.trim()
      },
      include: {
        author: { select: { id: true, name: true, role: true } }
      }
    });

    return res.status(201).json({
      success: true,
      note
    });
  } catch (error) {
    console.error('Error adding internal note:', error);
    return res.status(500).json({ success: false, error: 'Failed to add note' });
  }
});

// DELETE /api/leads/:id (Admin/Sales Head only)
router.delete('/:id', authenticateToken, requireRole(['ADMIN', 'SALES_HEAD']), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.lead.delete({ where: { id } });
    return res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete lead' });
  }
});

module.exports = router;
