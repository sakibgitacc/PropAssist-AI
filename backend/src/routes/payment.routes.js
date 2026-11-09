const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');
const razorpayService = require('../services/razorpay.service');
const pdfService = require('../services/pdf.service');

/**
 * POST /api/payments/order
 * Create a new payment order (Razorpay or verified simulator)
 */
router.post('/order', authenticateToken, async (req, res) => {
  try {
    const { amount, purpose = 'Apartment Token Booking Deposit', projectId, projectName, unitNumber } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid payment amount is required.' });
    }

    const receipt = `rcpt_${Date.now()}`;
    const orderResult = await razorpayService.createOrder({
      amount: Number(amount),
      currency: 'INR',
      receipt,
      notes: {
        buyerId: req.user.id,
        buyerEmail: req.user.email,
        purpose
      }
    });

    const paymentRecord = await prisma.payment.create({
      data: {
        transactionRef: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        orderId: orderResult.order.id,
        buyerId: req.user.id,
        buyerName: req.user.name,
        buyerEmail: req.user.email,
        buyerPhone: req.user.phone || '+919876543210',
        projectId: projectId || null,
        projectName: projectName || 'PropAssist Luxury Residences',
        unitNumber: unitNumber || 'T1-1402',
        paymentType: purpose,
        amount: Number(amount),
        currency: 'INR',
        status: 'Pending',
        paymentMethod: 'Razorpay Gateway',
        receiptNumber: `RCP-${Date.now().toString().slice(-8)}`
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'PAYMENT_ORDER_CREATED',
        performedBy: req.user.email,
        role: req.user.role,
        details: JSON.stringify({ amount, orderId: orderResult.order.id, provider: orderResult.provider })
      }
    }).catch(() => {});

    res.status(201).json({
      success: true,
      data: {
        payment: paymentRecord,
        order: orderResult.order,
        provider: orderResult.provider
      }
    });
  } catch (err) {
    console.error('Error creating payment order:', err);
    res.status(500).json({ success: false, error: 'Failed to create payment order.' });
  }
});

/**
 * POST /api/payments/verify
 * Cryptographic signature verification of Razorpay payment
 */
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { paymentId, orderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        error: 'Missing orderId, razorpayPaymentId, or razorpaySignature for verification.'
      });
    }

    // Verify signature
    const sigCheck = razorpayService.verifyPaymentSignature({
      orderId,
      razorpayPaymentId,
      razorpaySignature
    });

    if (!sigCheck.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature. Verification failed.',
        details: 'Cryptographic signature mismatch.'
      });
    }

    // Find the payment record
    let payment = null;
    if (paymentId) {
      payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    }
    if (!payment && orderId) {
      payment = await prisma.payment.findFirst({ where: { orderId } });
    }

    if (!payment) {
      // Create verified payment if not already tracked
      payment = await prisma.payment.create({
        data: {
          transactionRef: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          orderId,
          paymentId: razorpayPaymentId,
          signature: razorpaySignature,
          buyerId: req.user.id,
          buyerName: req.user.name,
          buyerEmail: req.user.email,
          buyerPhone: req.user.phone || '+919876543210',
          projectName: 'PropAssist Luxury Residences',
          amount: 50000,
          currency: 'INR',
          status: 'Verified',
          receiptNumber: `RCP-${Date.now().toString().slice(-8)}`
        }
      });
    } else {
      payment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'Verified',
          paymentId: razorpayPaymentId,
          signature: razorpaySignature
        }
      });
    }

    // ─── AUTOMATIC PROPERTY BOOKING & ALLOTMENT SYNCHRONIZATION ───
    let linkedBooking = null;
    try {
      const payAmount = Number(payment.amount || 0);

      // Find if this buyer already has a booking for this unit or project
      let existingBooking = null;
      if (payment.unitNumber) {
        existingBooking = await prisma.propertyBooking.findFirst({
          where: {
            buyerId: req.user.id,
            unitNumber: payment.unitNumber
          }
        });
      }
      if (!existingBooking && payment.projectId) {
        existingBooking = await prisma.propertyBooking.findFirst({
          where: {
            buyerId: req.user.id,
            projectId: payment.projectId
          }
        });
      }

      if (existingBooking) {
        // Increment paidAmount on existing booking
        const newPaid = Number(existingBooking.paidAmount || 0) + payAmount;
        const agrValue = Number(existingBooking.agreementValue || 8500000);
        const newPct = (newPaid / agrValue) * 100;
        const isFullyPaid = newPaid >= agrValue;
        const hasTokenOrMore = newPaid >= (agrValue * 0.10);

        const updateData = {
          paidAmount: newPaid,
          paymentPercentage: Math.min(100, Number(newPct.toFixed(2)))
        };

        if (isFullyPaid) {
          updateData.bookingStatus = 'Fully Paid & Allotted';
          updateData.allotmentStatus = 'Letter Issued';
          if (!existingBooking.allotmentLetterNo) {
            updateData.allotmentLetterNo = `ALT-GJ-2026-${Date.now().toString().slice(-6)}`;
            updateData.allotmentDate = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });
          }
        } else {
          updateData.bookingStatus = 'Confirmed (Token Paid)';
          updateData.allotmentStatus = 'Under Approval';
        }

        linkedBooking = await prisma.propertyBooking.update({
          where: { id: existingBooking.id },
          data: updateData
        });

        if (existingBooking.unitId) {
          await prisma.unit.update({
            where: { id: existingBooking.unitId },
            data: { status: isFullyPaid ? 'Allotted' : 'Booked' }
          }).catch(() => {});
        }
      } else {
        // Find suitable unit
        let targetUnit = null;
        if (payment.unitNumber) {
          targetUnit = await prisma.unit.findFirst({
            where: { unitNumber: payment.unitNumber },
            include: { project: true }
          });
        }
        if (!targetUnit && payment.projectId) {
          targetUnit = await prisma.unit.findFirst({
            where: { projectId: payment.projectId },
            include: { project: true }
          });
        }

        const agrVal = targetUnit?.basePrice || 8500000;
        const isFullyPaid = payAmount >= agrVal;
        const allotmentLetterNo = isFullyPaid ? `ALT-GJ-2026-${Date.now().toString().slice(-6)}` : null;

        linkedBooking = await prisma.propertyBooking.create({
          data: {
            bookingCode: `BK-GJ-${Date.now().toString().slice(-6)}`,
            buyerId: req.user.id,
            buyerName: req.user.name,
            buyerEmail: req.user.email,
            buyerPhone: req.user.phone || '+918530493687',
            projectId: targetUnit?.projectId || payment.projectId,
            projectName: targetUnit?.project?.name || payment.projectName || 'The Grand Orchid',
            unitId: targetUnit?.id || null,
            unitNumber: targetUnit?.unitNumber || payment.unitNumber || 'Tower A - 1402',
            tower: targetUnit?.tower || 'Tower A',
            configuration: targetUnit?.configuration || '3 BHK Skyline Residence',
            agreementValue: Number(agrVal),
            paidAmount: payAmount,
            paymentPercentage: Math.min(100, Number(((payAmount / agrVal) * 100).toFixed(2))),
            bookingStatus: isFullyPaid ? 'Fully Paid & Allotted' : 'Confirmed (Token Paid)',
            allotmentStatus: isFullyPaid ? 'Letter Issued' : 'Under Approval',
            allotmentLetterNo,
            allotmentDate: isFullyPaid ? new Date().toLocaleDateString('en-IN', { dateStyle: 'long' }) : null,
            reraNumber: targetUnit?.project?.reraNumber || 'PR/GJ/AHMEDABAD/AUDA/RAA10022/2026'
          }
        });

        if (targetUnit) {
          await prisma.unit.update({
            where: { id: targetUnit.id },
            data: { status: isFullyPaid ? 'Allotted' : 'Booked' }
          }).catch(() => {});
        }
      }
    } catch (bookingSyncErr) {
      console.warn('Auto booking sync notice:', bookingSyncErr.message);
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'PAYMENT_VERIFIED',
        performedBy: req.user.email,
        role: req.user.role,
        details: JSON.stringify({ paymentId: payment.paymentId, amount: payment.amount, bookingId: linkedBooking?.id })
      }
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Payment signature verified and transaction marked SUCCESS.',
      data: payment,
      booking: linkedBooking
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ success: false, error: 'Payment verification failed.' });
  }
});

/**
 * GET /api/payments
 * List payments with strict role-based data isolation
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, id: userId, email } = req.user;

    let whereClause = {};

    if (role === 'BUYER') {
      // Buyer can ONLY see their own payments. Never trust query parameters!
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

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        buyer: { select: { id: true, name: true, email: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch payments.' });
  }
});

/**
 * GET /api/payments/:id/receipt
 * Download authentic, generated PDF payment receipt
 * Strictly validates record ownership
 */
router.get('/:id/receipt', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId, email } = req.user;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { buyer: true }
    });

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment record not found.' });
    }

    // Role-based authorization & data isolation check
    if (role === 'BUYER') {
      const isOwner = payment.buyerId === userId || payment.buyerEmail === email;
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You do not own this payment record and cannot download this receipt.'
        });
      }
    }

    // Only allow receipt for verified payments
    if (payment.status.toLowerCase() !== 'verified') {
      return res.status(400).json({
        success: false,
        error: `Cannot generate receipt for unverified payment (current status: ${payment.status}).`
      });
    }

    // Stream PDF response
    pdfService.generatePaymentReceipt(payment, res);
  } catch (err) {
    console.error('Error generating payment receipt:', err);
    res.status(500).json({ success: false, error: 'Failed to generate PDF receipt.' });
  }
});

/**
 * POST /api/payments/webhook
 * Razorpay Webhook listener with HMAC signature verification & idempotency
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const payloadString = req.body.toString ? req.body.toString('utf8') : JSON.stringify(req.body);

    const isValid = razorpayService.verifyWebhookSignature(payloadString, webhookSignature);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid webhook signature' });
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload?.payment?.entity;
      if (paymentEntity) {
        const orderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;

        const existingPayment = await prisma.payment.findFirst({
          where: { orderId }
        });

        if (existingPayment && existingPayment.status.toLowerCase() !== 'verified') {
          await prisma.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: 'Verified',
              paymentId: razorpayPaymentId
            }
          });
        }
      }
    }

    res.json({ status: 'ok', received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ success: false, error: 'Webhook processing error' });
  }
});

module.exports = router;
