const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../db/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const createSlotSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().min(2, 'Start time is required'),
  endTime: z.string().min(2, 'End time is required'),
  capacity: z.number().int().min(1).default(3),
  assignedExecutiveId: z.string().optional().nullable()
});

const bookVisitSchema = z.object({
  slotId: z.string().min(1, 'Slot ID is required'),
  leadId: z.string().optional().nullable(),
  buyerName: z.string().min(2, 'Buyer name is required'),
  buyerPhone: z.string().min(7, 'Phone number is required'),
  buyerEmail: z.string().email().optional().nullable(),
  specialRequests: z.string().optional().nullable(),
  projectId: z.string().optional().nullable()
});

// GET /api/slots - Fetch visit slots with filters
router.get('/', async (req, res) => {
  try {
    const { projectId, date, startDate, endDate, availableOnly } = req.query;

    const where = { isActive: true };

    if (projectId) where.projectId = projectId;
    if (date) where.date = date;
    if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    }

    const slots = await prisma.visitSlot.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: {
        project: { select: { id: true, name: true, location: true } },
        assignedExecutive: { select: { id: true, name: true, phone: true } },
        _count: { select: { bookings: true } }
      }
    });

    const filtered = availableOnly === 'true'
      ? slots.filter(s => s.bookedCount < s.capacity)
      : slots;

    return res.json({
      success: true,
      slots: filtered
    });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve visit slots' });
  }
});

// POST /api/slots - Create new visit slot (Admin/Sales Head)
router.post('/', authenticateToken, requireRole(['ADMIN', 'SALES_HEAD']), validateBody(createSlotSchema), async (req, res) => {
  try {
    const { projectId, date, startTime, endTime, capacity, assignedExecutiveId } = req.body;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const slot = await prisma.visitSlot.create({
      data: {
        projectId,
        date,
        startTime,
        endTime,
        capacity,
        bookedCount: 0,
        assignedExecutiveId: assignedExecutiveId || null,
        isActive: true
      },
      include: {
        project: { select: { id: true, name: true } },
        assignedExecutive: { select: { id: true, name: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Visit slot created successfully',
      slot
    });
  } catch (error) {
    console.error('Error creating slot:', error);
    return res.status(500).json({ success: false, error: 'Failed to create visit slot' });
  }
});

// PATCH /api/slots/:id/toggle - Enable/disable slot (Admin/Sales Head)
router.patch('/:id/toggle', authenticateToken, requireRole(['ADMIN', 'SALES_HEAD']), async (req, res) => {
  try {
    const { id } = req.params;
    const slot = await prisma.visitSlot.findUnique({ where: { id } });
    if (!slot) {
      return res.status(404).json({ success: false, error: 'Slot not found' });
    }

    const updated = await prisma.visitSlot.update({
      where: { id },
      data: { isActive: !slot.isActive }
    });

    return res.json({
      success: true,
      message: `Slot has been ${updated.isActive ? 'activated' : 'disabled'}`,
      slot: updated
    });
  } catch (error) {
    console.error('Error toggling slot:', error);
    return res.status(500).json({ success: false, error: 'Failed to update slot' });
  }
});

// POST /api/slots/book - Atomic transactional booking preventing concurrent overbooking
const bookVisitHandler = async (req, res) => {
  try {
    const { slotId, leadId, buyerName, buyerPhone, buyerEmail, specialRequests, projectId } = req.body;

    // Use Prisma interactive transaction for atomic concurrency safety
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current slot inside transaction
      const slot = await tx.visitSlot.findUnique({
        where: { id: slotId },
        include: { project: true, assignedExecutive: true }
      });

      if (!slot) {
        throw { statusCode: 404, message: 'Selected visit slot does not exist.' };
      }

      if (!slot.isActive) {
        throw { statusCode: 400, message: 'This visit slot is currently disabled.' };
      }

      // 2. Strict capacity check: Prevent concurrent overbooking
      if (slot.bookedCount >= slot.capacity) {
        throw {
          statusCode: 409,
          message: 'Conflict: This visit slot has just reached full capacity. Please select another slot.'
        };
      }

      // 3. Find or link lead
      let targetLeadId = leadId;
      if (!targetLeadId) {
        const cleanPhone = buyerPhone.replace(/[\s\-\(\)]/g, '');
        let lead = await tx.lead.findFirst({
          where: {
            OR: [
              { phone: { contains: cleanPhone.slice(-10) } },
              ...(buyerEmail ? [{ email: buyerEmail.toLowerCase() }] : [])
            ]
          }
        });

        if (!lead) {
          lead = await tx.lead.create({
            data: {
              fullName: buyerName,
              phone: buyerPhone,
              email: buyerEmail ? buyerEmail.toLowerCase() : null,
              projectId: projectId || slot.projectId,
              source: 'Site Visit Booking',
              status: 'Visit Scheduled',
              assignedExecutiveId: slot.assignedExecutiveId || null,
              isQualified: true
            }
          });
        } else {
          lead = await tx.lead.update({
            where: { id: lead.id },
            data: {
              status: 'Visit Scheduled',
              isQualified: true,
              assignedExecutiveId: lead.assignedExecutiveId || slot.assignedExecutiveId
            }
          });
        }
        targetLeadId = lead.id;
      } else {
        await tx.lead.update({
          where: { id: targetLeadId },
          data: { status: 'Visit Scheduled', isQualified: true }
        });
      }

      // 4. Increment bookedCount atomically
      const updatedSlot = await tx.visitSlot.update({
        where: { id: slotId },
        data: {
          bookedCount: { increment: 1 }
        }
      });

      // Extra safeguard against negative or impossible values
      if (updatedSlot.bookedCount > updatedSlot.capacity) {
        throw {
          statusCode: 409,
          message: 'Concurrent booking conflict: Capacity exceeded. Transaction aborted.'
        };
      }

      // 5. Generate unique human-readable confirmation code
      const confirmationCode = `PA-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      // 6. Create Booking Record
      const booking = await tx.booking.create({
        data: {
          leadId: targetLeadId,
          slotId: slot.id,
          buyerName,
          buyerPhone,
          buyerEmail: buyerEmail || null,
          bookingDate: slot.date,
          timeSlot: `${slot.startTime} - ${slot.endTime}`,
          status: 'Confirmed',
          specialRequests: specialRequests || null,
          confirmationCode
        }
      });

      // 7. Schedule 24-hour and 2-hour reminders
      const slotDateTimeStr = `${slot.date}T${slot.startTime.includes('PM') && !slot.startTime.startsWith('12') ? (parseInt(slot.startTime) + 12) : slot.startTime.slice(0, 2)}:00:00`;
      let visitDateTime = new Date(slotDateTimeStr);
      if (isNaN(visitDateTime.getTime())) {
        visitDateTime = new Date(`${slot.date}T10:00:00Z`);
      }

      const reminder24hTime = new Date(visitDateTime.getTime() - 24 * 60 * 60 * 1000);
      const reminder2hTime = new Date(visitDateTime.getTime() - 2 * 60 * 60 * 1000);

      await tx.reminder.createMany({
        data: [
          {
            leadId: targetLeadId,
            bookingId: booking.id,
            reminderType: '24h_before',
            scheduledFor: reminder24hTime > new Date() ? reminder24hTime : new Date(Date.now() + 60000),
            status: 'Pending',
            channel: 'WhatsApp Simulation',
            messageContent: `Namaste ${buyerName}, your PropAssist site visit for ${slot.project.name} is confirmed for ${slot.date} at ${slot.startTime}. Confirmation Code: ${confirmationCode}.`
          },
          {
            leadId: targetLeadId,
            bookingId: booking.id,
            reminderType: '2h_before',
            scheduledFor: reminder2hTime > new Date() ? reminder2hTime : new Date(Date.now() + 120000),
            status: 'Pending',
            channel: 'SMS Simulation',
            messageContent: `PropAssist Alert: Your site visit starts in 2 hours at ${slot.project.name} (${slot.startTime}). Executive: ${slot.assignedExecutive?.name || 'Assigned Host'}.`
          }
        ]
      });

      // 8. Capture Consent Record
      await tx.consent.create({
        data: {
          leadPhone: buyerPhone,
          leadEmail: buyerEmail || null,
          purpose: 'Site Visit Notification & Reminders',
          granted: true,
          ipAddress: req.ip || '127.0.0.1'
        }
      });

      return { booking, slot, confirmationCode };
    });

    const slotInfo = {
      date: result.slot.date,
      time: `${result.slot.startTime} - ${result.slot.endTime}`,
      project: result.slot.project?.name || 'Ahmedabad Development',
      location: result.slot.project?.location || 'Ahmedabad, Gujarat',
      executive: result.slot.assignedExecutive?.name || 'On-site Executive'
    };

    return res.status(201).json({
      success: true,
      message: 'Site visit booked successfully',
      booking: {
        ...result.booking,
        slot: slotInfo
      },
      confirmationCode: result.confirmationCode,
      slot: slotInfo
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('Booking transaction failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to complete visit booking' });
  }
};

router.post(['/book', '/bookings'], validateBody(bookVisitSchema), bookVisitHandler);

// GET /api/slots/bookings - List bookings (role-filtered for security)
const getBookingsHandler = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'BUYER') {
      const userEmail = (req.user.email || '').toLowerCase().trim();
      const cleanPhone = (req.user.phone || '').replace(/[\s\-\(\)]/g, '');
      const dummyPhones = ['1234567890', '0000000000', '9999999999', '1111111111', '9825012345', '9876543210'];
      
      const orConditions = [
        { buyerEmail: { equals: userEmail, mode: 'insensitive' } },
        { lead: { email: { equals: userEmail, mode: 'insensitive' } } }
      ];

      // Only match by phone if non-dummy and either buyerEmail matches or is unset
      if (cleanPhone.length >= 10 && !dummyPhones.includes(cleanPhone.slice(-10))) {
        orConditions.push({
          AND: [
            { buyerPhone: { contains: cleanPhone.slice(-10) } },
            {
              OR: [
                { buyerEmail: null },
                { buyerEmail: '' },
                { buyerEmail: { equals: userEmail, mode: 'insensitive' } }
              ]
            }
          ]
        });
      }
      where.OR = orConditions;
    } else if (req.user.role === 'SALES_EXECUTIVE') {
      where.OR = [
        { slot: { assignedExecutiveId: req.user.id } },
        { lead: { assignedExecutiveId: req.user.id } }
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        slot: {
          include: {
            project: { select: { id: true, name: true, location: true } },
            assignedExecutive: { select: { id: true, name: true } }
          }
        },
        lead: { select: { id: true, fullName: true, phone: true, email: true, status: true } },
        reminders: true
      }
    });

    return res.json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve bookings' });
  }
};

router.get('/bookings', authenticateToken, getBookingsHandler);

// GET /api/slots/bookings/:id - Single booking details (Strict role isolation)
router.get('/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, email, id: userId, phone } = req.user;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        slot: {
          include: {
            project: { select: { id: true, name: true, location: true } },
            assignedExecutive: { select: { id: true, name: true, email: true, phone: true } }
          }
        },
        lead: { select: { id: true, fullName: true, phone: true, email: true, status: true, assignedExecutiveId: true } },
        reminders: true
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Site visit booking not found.' });
    }

    // Role-based data isolation
    if (role === 'BUYER') {
      const cleanPhone = (phone || '').replace(/[\s\-\(\)]/g, '').slice(-10);
      const isOwner = booking.buyerEmail === email ||
                      (booking.lead && booking.lead.email === email) ||
                      (cleanPhone.length >= 7 && (booking.buyerPhone.includes(cleanPhone) || (booking.lead && booking.lead.phone.includes(cleanPhone))));
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You do not own this site visit booking and cannot view its details.'
        });
      }
    } else if (role === 'SALES_EXECUTIVE') {
      const isAssigned = (booking.slot && booking.slot.assignedExecutiveId === userId) ||
                         (booking.lead && booking.lead.assignedExecutiveId === userId);
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You are not assigned to this site visit.'
        });
      }
    }

    return res.json({ success: true, booking });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve booking details' });
  }
});

// PATCH /api/slots/bookings/:id/cancel - Cancel a visit booking
router.patch('/bookings/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, email, id: userId } = req.user;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { slot: true, lead: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found.' });
    }

    if (role === 'BUYER' && booking.buyerEmail !== email && (!booking.lead || booking.lead.email !== email)) {
      return res.status(403).json({ success: false, error: 'Forbidden: You can only cancel your own bookings.' });
    }

    // Atomic cancellation: decrement bookedCount on slot
    await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status: 'CANCELLED' }
      }),
      prisma.visitSlot.update({
        where: { id: booking.slotId },
        data: { bookedCount: { decrement: 1 } }
      })
    ]);

    return res.json({ success: true, message: 'Site visit cancelled successfully.' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
});

// PATCH /api/slots/bookings/:id/reschedule - Reschedule visit booking to a new available slot
router.patch('/bookings/:id/reschedule', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { newSlotId } = req.body;
    const { role, email } = req.user;

    if (!newSlotId) {
      return res.status(400).json({ success: false, error: 'newSlotId is required to reschedule.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { slot: true, lead: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found.' });
    }

    if (role === 'BUYER' && booking.buyerEmail !== email && (!booking.lead || booking.lead.email !== email)) {
      return res.status(403).json({ success: false, error: 'Forbidden: You can only reschedule your own bookings.' });
    }

    // Atomic rescheduling transaction
    const result = await prisma.$transaction(async (tx) => {
      const targetSlot = await tx.visitSlot.findUnique({
        where: { id: newSlotId },
        include: { project: true, assignedExecutive: true }
      });

      if (!targetSlot) {
        throw { statusCode: 404, message: 'Selected target slot does not exist.' };
      }

      if (!targetSlot.isActive) {
        throw { statusCode: 400, message: 'Target slot is currently disabled.' };
      }

      if (targetSlot.bookedCount >= targetSlot.capacity) {
        throw { statusCode: 409, message: 'Target slot is already at full capacity. Please select another slot.' };
      }

      // 1. Decrement old slot count (if previously active)
      if (booking.status !== 'CANCELLED') {
        await tx.visitSlot.update({
          where: { id: booking.slotId },
          data: { bookedCount: { decrement: 1 } }
        });
      }

      // 2. Increment new slot count
      await tx.visitSlot.update({
        where: { id: newSlotId },
        data: { bookedCount: { increment: 1 } }
      });

      // 3. Update booking record
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          slotId: newSlotId,
          bookingDate: targetSlot.date,
          timeSlot: `${targetSlot.startTime} - ${targetSlot.endTime}`,
          status: 'Confirmed'
        },
        include: {
          slot: {
            include: {
              project: { select: { id: true, name: true, location: true } },
              assignedExecutive: { select: { id: true, name: true } }
            }
          }
        }
      });

      return updatedBooking;
    });

    return res.json({
      success: true,
      message: 'Site visit successfully rescheduled.',
      booking: result
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('Error rescheduling booking:', error);
    return res.status(500).json({ success: false, error: 'Failed to reschedule site visit.' });
  }
});

module.exports = router;
module.exports.bookVisitHandler = bookVisitHandler;
module.exports.getBookingsHandler = getBookingsHandler;
module.exports.bookVisitSchema = bookVisitSchema;
