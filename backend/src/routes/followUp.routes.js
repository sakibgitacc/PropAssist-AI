const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../db/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const createFollowUpSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional().nullable(),
  type: z.enum([
    'First Contact',
    'Callback',
    'Buyer Requirement Discussion',
    'Budget Discussion',
    'Site Visit Confirmation',
    'Post Site Visit Follow-up',
    'Document Discussion',
    'Payment Follow-up',
    'Final Decision Follow-up'
  ]).default('Callback'),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  scheduledTime: z.string().optional().default('11:00 AM'),
  executiveId: z.string().optional(),
  projectId: z.string().optional().nullable()
});

const updateFollowUpSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  type: z.string().optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  status: z.enum(['TODAY', 'UPCOMING', 'OVERDUE', 'COMPLETED', 'CANCELLED', 'PENDING']).optional(),
  completionNotes: z.string().optional().nullable(),
  executiveId: z.string().optional()
});

/**
 * Helper to compute category based on scheduledDate & status
 */
function computeCategory(status, scheduledDate) {
  if (status === 'COMPLETED' || status === 'CANCELLED') return status;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const schedStr = new Date(scheduledDate).toISOString().split('T')[0];

  if (schedStr === todayStr) return 'TODAY';
  if (schedStr < todayStr) return 'OVERDUE';
  return 'UPCOMING';
}

// GET /api/follow-ups/stats - Counts by category
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'SALES_EXECUTIVE') {
      where.executiveId = req.user.id;
    }

    const allRecords = await prisma.followUp.findMany({ where });

    let today = 0;
    let upcoming = 0;
    let overdue = 0;
    let completed = 0;
    let cancelled = 0;

    for (const f of allRecords) {
      const cat = computeCategory(f.status, f.scheduledDate);
      if (cat === 'TODAY') today++;
      else if (cat === 'UPCOMING') upcoming++;
      else if (cat === 'OVERDUE') overdue++;
      else if (cat === 'COMPLETED') completed++;
      else if (cat === 'CANCELLED') cancelled++;
    }

    return res.json({
      success: true,
      stats: {
        total: allRecords.length,
        today,
        upcoming,
        overdue,
        completed,
        cancelled
      }
    });
  } catch (error) {
    console.error('Error fetching follow-up stats:', error);
    return res.status(500).json({ success: false, error: 'Failed to compute follow-up stats' });
  }
});

// GET /api/follow-ups - List follow-ups with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, priority, executiveId, projectId, search, date } = req.query;
    const where = {};

    // Role-based scoping
    if (req.user.role === 'SALES_EXECUTIVE') {
      where.executiveId = req.user.id;
    } else if (executiveId && executiveId !== 'All') {
      where.executiveId = executiveId;
    }

    if (priority && priority !== 'All') {
      where.priority = priority;
    }

    if (projectId && projectId !== 'All') {
      where.projectId = projectId;
    }

    if (search) {
      const clean = search.trim();
      where.OR = [
        { buyerName: { contains: clean, mode: 'insensitive' } },
        { title: { contains: clean, mode: 'insensitive' } },
        { description: { contains: clean, mode: 'insensitive' } },
        { lead: { phone: { contains: clean } } }
      ];
    }

    const rawFollowUps = await prisma.followUp.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            status: true,
            preferredBhk: true,
            budgetMin: true,
            budgetMax: true,
            project: { select: { id: true, name: true, location: true } }
          }
        },
        executive: {
          select: { id: true, name: true, email: true, phone: true }
        },
        project: {
          select: { id: true, name: true, location: true }
        }
      },
      orderBy: { scheduledDate: 'asc' }
    });

    // Dynamically update category attribute
    const followUps = rawFollowUps.map(f => {
      const computedCat = computeCategory(f.status, f.scheduledDate);
      return {
        ...f,
        computedCategory: computedCat,
        displayStatus: f.status === 'COMPLETED' ? 'COMPLETED' : (f.status === 'CANCELLED' ? 'CANCELLED' : computedCat)
      };
    });

    // Status filter matching
    let filtered = followUps;
    if (status && status !== 'All') {
      filtered = followUps.filter(f => f.displayStatus === status || f.status === status);
    }

    if (date) {
      filtered = filtered.filter(f => {
        const d = new Date(f.scheduledDate).toISOString().split('T')[0];
        return d === date;
      });
    }

    return res.json({
      success: true,
      followUps: filtered,
      count: filtered.length
    });
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch follow-up records' });
  }
});

// POST /api/follow-ups - Create a new follow-up
router.post('/', authenticateToken, validateBody(createFollowUpSchema), async (req, res) => {
  try {
    const { leadId, title, description, type, priority, scheduledDate, scheduledTime, executiveId, projectId } = req.body;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { project: true }
    });

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Role check: Executives can only create for their assigned leads unless Sales Head / Admin
    let assignedExec = req.user.id;
    if (req.user.role === 'SALES_HEAD' || req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
      assignedExec = executiveId || lead.assignedExecutiveId || req.user.id;
    } else {
      if (lead.assignedExecutiveId && lead.assignedExecutiveId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Cannot create follow-up for a lead assigned to another executive' });
      }
    }

    const schedDateObj = new Date(scheduledDate);
    const initialStatus = computeCategory('UPCOMING', schedDateObj);

    const followUp = await prisma.followUp.create({
      data: {
        leadId,
        buyerName: lead.fullName,
        projectId: projectId || lead.projectId,
        executiveId: assignedExec,
        title,
        description,
        type,
        priority,
        scheduledDate: schedDateObj,
        scheduledTime: scheduledTime || '11:00 AM',
        status: initialStatus
      },
      include: {
        lead: true,
        executive: { select: { id: true, name: true, email: true } },
        project: true
      }
    });

    // Also update lead's followUpDate
    await prisma.lead.update({
      where: { id: leadId },
      data: { followUpDate: schedDateObj }
    }).catch(() => {});

    // Create internal activity note
    await prisma.internalNote.create({
      data: {
        leadId,
        authorId: req.user.id,
        content: `Follow-up scheduled: "${title}" (${type}) for ${schedDateObj.toLocaleDateString()} at ${scheduledTime || '11:00 AM'} [Priority: ${priority}]`
      }
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Follow-up created successfully',
      followUp
    });
  } catch (error) {
    console.error('Error creating follow-up:', error);
    return res.status(500).json({ success: false, error: 'Failed to create follow-up' });
  }
});

// PATCH /api/follow-ups/:id - Update / Reschedule / Complete / Cancel
router.patch('/:id', authenticateToken, validateBody(updateFollowUpSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, priority, scheduledDate, scheduledTime, status, completionNotes, executiveId } = req.body;

    const existing = await prisma.followUp.findUnique({
      where: { id },
      include: { lead: true }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Follow-up not found' });
    }

    // Role check
    if (req.user.role === 'SALES_EXECUTIVE' && existing.executiveId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized to modify this follow-up' });
    }

    const dataToUpdate = {};
    if (title) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (type) dataToUpdate.type = type;
    if (priority) dataToUpdate.priority = priority;
    if (scheduledTime) dataToUpdate.scheduledTime = scheduledTime;
    if (executiveId && (req.user.role === 'SALES_HEAD' || req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN')) {
      dataToUpdate.executiveId = executiveId;
    }

    if (scheduledDate) {
      dataToUpdate.scheduledDate = new Date(scheduledDate);
      dataToUpdate.status = computeCategory('UPCOMING', dataToUpdate.scheduledDate);
    }

    if (status) {
      dataToUpdate.status = status;
      if (status === 'COMPLETED') {
        dataToUpdate.completedDate = new Date();
        if (completionNotes) dataToUpdate.completionNotes = completionNotes;
      }
    }

    const updated = await prisma.followUp.update({
      where: { id },
      data: dataToUpdate,
      include: {
        lead: true,
        executive: { select: { id: true, name: true, email: true } },
        project: true
      }
    });

    // If marked completed, add internal note
    if (status === 'COMPLETED') {
      await prisma.internalNote.create({
        data: {
          leadId: existing.leadId,
          authorId: req.user.id,
          content: `Follow-up completed: "${updated.title}". Notes: ${completionNotes || 'Follow-up call/discussion concluded successfully.'}`
        }
      }).catch(() => {});
    }

    return res.json({
      success: true,
      message: 'Follow-up updated successfully',
      followUp: updated
    });
  } catch (error) {
    console.error('Error updating follow-up:', error);
    return res.status(500).json({ success: false, error: 'Failed to update follow-up' });
  }
});

// DELETE /api/follow-ups/:id - Delete follow-up
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.followUp.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Follow-up not found' });
    }

    if (req.user.role === 'SALES_EXECUTIVE' && existing.executiveId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    await prisma.followUp.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Follow-up deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting follow-up:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete follow-up' });
  }
});

module.exports = router;

