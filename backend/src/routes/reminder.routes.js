const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken } = require('../middleware/auth');

// GET /api/reminders - List upcoming and simulated reminders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: { scheduledFor: 'asc' },
      take: 50,
      include: {
        lead: {
          select: { id: true, fullName: true, phone: true }
        },
        booking: {
          include: {
            slot: {
              include: {
                project: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    return res.json({ success: true, reminders });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve reminders' });
  }
});

// POST /api/reminders/process - Simulate dispatcher run for pending reminders
router.post('/process', authenticateToken, async (req, res) => {
  try {
    const now = new Date();

    // Find pending reminders due for dispatch
    const pendingReminders = await prisma.reminder.findMany({
      where: {
        status: 'Pending',
        scheduledFor: { lte: new Date(now.getTime() + 10 * 60 * 1000) } // due now or within next 10m
      },
      include: { lead: true }
    });

    const updated = [];
    for (const rem of pendingReminders) {
      const dispatched = await prisma.reminder.update({
        where: { id: rem.id },
        data: {
          status: 'Simulated',
          sentAt: new Date()
        }
      });
      updated.push(dispatched);
    }

    return res.json({
      success: true,
      message: `Processed ${updated.length} reminders (Simulated SMS/WhatsApp delivery without third-party vendor charges)`,
      processedCount: updated.length,
      reminders: updated
    });
  } catch (error) {
    console.error('Error processing reminders:', error);
    return res.status(500).json({ success: false, error: 'Failed to dispatch reminders' });
  }
});

module.exports = router;
