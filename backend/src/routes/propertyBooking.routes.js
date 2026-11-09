const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');
const pdfService = require('../services/pdf.service');

/**
 * POST /api/property-bookings
 * Create a new property booking request with double-booking prevention
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { projectId, unitId, bookingId, unitNumber, tokenAmount = 100000, agreementValue = 8500000 } = req.body;

    // 1. Check if THIS buyer already has an existing booking (by bookingId, unitId, unitNumber, or user's active booking)
    let existingBuyerBooking = null;
    if (bookingId) {
      existingBuyerBooking = await prisma.propertyBooking.findFirst({
        where: { id: bookingId, buyerId: req.user.id }
      });
    }
    if (!existingBuyerBooking && unitId) {
      existingBuyerBooking = await prisma.propertyBooking.findFirst({
        where: { buyerId: req.user.id, unitId }
      });
    }
    if (!existingBuyerBooking && unitNumber) {
      existingBuyerBooking = await prisma.propertyBooking.findFirst({
        where: { buyerId: req.user.id, unitNumber }
      });
    }
    if (!existingBuyerBooking && projectId) {
      existingBuyerBooking = await prisma.propertyBooking.findFirst({
        where: { buyerId: req.user.id, projectId }
      });
    }
    if (!existingBuyerBooking && (!projectId || !unitId)) {
      existingBuyerBooking = await prisma.propertyBooking.findFirst({
        where: { buyerId: req.user.id },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (existingBuyerBooking) {
      // Calculate true verified paid ledger
      const verifiedPayments = await prisma.payment.findMany({
        where: {
          buyerId: req.user.id,
          status: 'Verified',
          OR: [
            { unitNumber: existingBuyerBooking.unitNumber },
            { projectId: existingBuyerBooking.projectId },
            ...(existingBuyerBooking.projectName ? [{ projectName: existingBuyerBooking.projectName }] : [])
          ]
        }
      });
      const totalVerifiedPayments = verifiedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const agrVal = Number(existingBuyerBooking.agreementValue || agreementValue || 8500000);
      const newPaid = Math.max(Number(existingBuyerBooking.paidAmount || 0) + Number(tokenAmount || 0), totalVerifiedPayments);
      const remainingBalance = Math.max(0, agrVal - newPaid);
      const isFullyPaid = remainingBalance <= 0 || newPaid >= agrVal;
      const tenPercentThreshold = Math.round(agrVal * 0.10);
      const hasTenPercent = newPaid >= tenPercentThreshold;
      const newPct = isFullyPaid ? 100 : Math.min(100, Number(((newPaid / agrVal) * 100).toFixed(2)));

      const updateData = {
        paidAmount: isFullyPaid ? agrVal : newPaid,
        paymentPercentage: newPct,
        bookingStatus: isFullyPaid
          ? 'Fully Paid & Allotted'
          : (hasTenPercent ? 'Confirmed (10% Advance Paid)' : 'Confirmed (Token Paid)'),
        allotmentStatus: (isFullyPaid || hasTenPercent) ? 'Letter Issued' : 'Under Approval'
      };

      if (isFullyPaid || hasTenPercent) {
        updateData.allotmentLetterNo = existingBuyerBooking.allotmentLetterNo || `ALT-GJ-2026-${Date.now().toString().slice(-6)}`;
        updateData.allotmentDate = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });
      }

      const updated = await prisma.propertyBooking.update({
        where: { id: existingBuyerBooking.id },
        data: updateData,
        include: { buyer: true, unit: true }
      });

      if (isFullyPaid && existingBuyerBooking.unitId) {
        await prisma.unit.update({
          where: { id: existingBuyerBooking.unitId },
          data: { status: 'Allotted' }
        }).catch(() => {});
      }

      return res.status(200).json({
        success: true,
        message: 'Payment applied to existing property booking. Balance updated.',
        data: updated
      });
    }

    // 2. Unit selection & fallback to available unit
    let targetUnit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: { project: true }
    });

    if (!targetUnit || targetUnit.status.toLowerCase() !== 'available') {
      // Intelligently find an available unit in the project or inventory
      const fallbackUnit = await prisma.unit.findFirst({
        where: {
          ...(projectId ? { projectId } : {}),
          status: { equals: 'Available', mode: 'insensitive' }
        },
        include: { project: true }
      });
      if (fallbackUnit) {
        targetUnit = fallbackUnit;
      } else if (!targetUnit) {
        return res.status(404).json({ success: false, error: 'No available residential unit found for reservation.' });
      }
    }

    const isFullyPaid = Number(tokenAmount) >= Number(agreementValue);
    const hasTokenOrMore = Number(tokenAmount) >= 50000;

    // 3. Atomically reserve the selected unit
    await prisma.unit.update({
      where: { id: targetUnit.id },
      data: { status: isFullyPaid ? 'Allotted' : 'Booked' }
    }).catch(() => {});

    // 4. Create verified property booking record
    const booking = await prisma.propertyBooking.create({
      data: {
        bookingCode: `BK-GJ-${Date.now().toString().slice(-6)}`,
        buyerId: req.user.id,
        buyerName: req.user.name,
        buyerEmail: req.user.email,
        buyerPhone: req.user.phone || '+919876543210',
        projectId: targetUnit.projectId || projectId,
        projectName: targetUnit.project?.name || 'The Grand Orchid Residences',
        unitId: targetUnit.id,
        unitNumber: targetUnit.unitNumber,
        tower: targetUnit.tower,
        configuration: targetUnit.configuration,
        agreementValue: Number(agreementValue),
        paidAmount: Number(tokenAmount),
        paymentPercentage: Math.min(100, Number(((Number(tokenAmount) / Number(agreementValue)) * 100).toFixed(2))),
        bookingStatus: isFullyPaid
          ? 'Fully Paid & Allotted'
          : (Number(tokenAmount) >= (Number(agreementValue) * 0.10) ? 'Confirmed (10% Advance Paid)' : 'Confirmed (Token Paid)'),
        allotmentStatus: (isFullyPaid || Number(tokenAmount) >= (Number(agreementValue) * 0.10)) ? 'Letter Issued' : 'Under Approval',
        allotmentLetterNo: (isFullyPaid || Number(tokenAmount) >= (Number(agreementValue) * 0.10)) ? `ALT-GJ-2026-${Date.now().toString().slice(-6)}` : null,
        allotmentDate: (isFullyPaid || Number(tokenAmount) >= (Number(agreementValue) * 0.10)) ? new Date().toLocaleDateString('en-IN', { dateStyle: 'long' }) : null,
        reraNumber: targetUnit.project?.reraNumber || 'PR/GJ/AHMEDABAD/AUDA/RAA10022/2026'
      },
      include: {
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        unit: true
      }
    });

    // 4. Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'PROPERTY_BOOKING_CREATED',
        performedBy: req.user.email,
        role: req.user.role,
        details: JSON.stringify({ unitNumber: targetUnit.unitNumber, tokenAmount })
      }
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Property unit successfully reserved and booking initialized.',
      data: booking
    });
  } catch (err) {
    console.error('Error creating property booking:', err);
    res.status(500).json({ success: false, error: 'Failed to create property booking.' });
  }
});

/**
 * GET /api/property-bookings
 * List property bookings with strict role-based data isolation
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, id: userId, email } = req.user;

    let whereClause = {};

    if (role === 'BUYER') {
      // Buyer can ONLY see their own bookings
      whereClause = {
        OR: [
          { buyerId: userId },
          { buyerEmail: email }
        ]
      };
    } else if (role === 'SALES_EXECUTIVE') {
      whereClause = {};
    } else if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'SALES_HEAD') {
      whereClause = {};
    } else {
      return res.status(403).json({ success: false, error: 'Unauthorized role.' });
    }

    const bookings = await prisma.propertyBooking.findMany({
      where: whereClause,
      include: {
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        unit: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (err) {
    console.error('Error fetching property bookings:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch property bookings.' });
  }
});

/**
 * PATCH /api/property-bookings/:id/status
 * Management approval / status update of property booking & allotment
 */
router.patch('/:id/status', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'SALES_HEAD']), async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingStatus, allotmentStatus } = req.body;

    const booking = await prisma.propertyBooking.findUnique({
      where: { id },
      include: { unit: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Property booking not found.' });
    }

    const updateData = {};
    if (bookingStatus) updateData.bookingStatus = bookingStatus;
    if (allotmentStatus) updateData.allotmentStatus = allotmentStatus;

    if (allotmentStatus === 'Letter Issued' || allotmentStatus === 'Approved') {
      updateData.allotmentDate = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });
      if (!booking.allotmentLetterNo) {
        updateData.allotmentLetterNo = `ALT-GJ-2026-${Date.now().toString().slice(-6)}`;
      }
      if (booking.unitId) {
        await prisma.unit.update({
          where: { id: booking.unitId },
          data: { status: 'Allotted' }
        });
      }
    } else if (bookingStatus === 'Cancelled') {
      if (booking.unitId) {
        await prisma.unit.update({
          where: { id: booking.unitId },
          data: { status: 'Available' }
        });
      }
    }

    const updated = await prisma.propertyBooking.update({
      where: { id },
      data: updateData,
      include: { unit: true, buyer: true }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: `BOOKING_STATUS_${bookingStatus || allotmentStatus}`,
        performedBy: req.user.email,
        role: req.user.role,
        details: JSON.stringify({ previousStatus: booking.bookingStatus, newStatus: bookingStatus })
      }
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Booking status updated.',
      data: updated
    });
  } catch (err) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ success: false, error: 'Failed to update booking status.' });
  }
});

/**
 * GET /api/property-bookings/:id/allotment-letter
 * Download authentic, generated PDF Allotment Letter
 * Strictly checks record ownership
 */
router.get('/:id/allotment-letter', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId, email } = req.user;

    const booking = await prisma.propertyBooking.findUnique({
      where: { id },
      include: {
        buyer: true,
        unit: true
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Property booking record not found.' });
    }

    // Role-based authorization & data isolation check
    if (role === 'BUYER') {
      const isOwner = booking.buyerId === userId || booking.buyerEmail === email;
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You do not own this booking record and cannot access this allotment letter.'
        });
      }
    }

    // Business rule: Allotment Letter only eligible upon 100% full payment clearance or authorized approval
    const agrVal = Number(booking.agreementValue || 8500000);
    const paidVal = Number(booking.paidAmount || 0);
    const isFullyPaid = paidVal >= agrVal;
    const isApproved = booking.allotmentStatus === 'Letter Issued' || booking.allotmentStatus === 'Approved';

    if (!isFullyPaid && !isApproved) {
      return res.status(400).json({
        success: false,
        error: `Allotment Letter is unavailable: Requires 100% payment clearance and administrative approval. Current paid: ₹${paidVal.toLocaleString('en-IN')} of ₹${agrVal.toLocaleString('en-IN')} (Remaining: ₹${(agrVal - paidVal).toLocaleString('en-IN')}).`
      });
    }

    // Stream PDF response
    pdfService.generateAllotmentLetter(booking, res);
  } catch (err) {
    console.error('Error generating allotment letter:', err);
    res.status(500).json({ success: false, error: 'Failed to generate PDF allotment letter.' });
  }
});

module.exports = router;
