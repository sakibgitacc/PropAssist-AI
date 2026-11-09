const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../db/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');
const supabaseService = require('../services/supabase.service');

/**
 * GET /api/users/profile
 * Get authenticated user's profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/users/profile
 * Update authenticated user's permitted profile details (name, phone)
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updateData = {};
    if (name && typeof name === 'string') updateData.name = name.trim();
    if (phone && typeof phone === 'string') updateData.phone = phone.trim();

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    });

    // Also update any matching buyer lead records with the new contact details
    if (updatedUser.phone && req.user.role === 'BUYER') {
      await prisma.lead.updateMany({
        where: { email: updatedUser.email },
        data: {
          fullName: updatedUser.name,
          phone: updatedUser.phone
        }
      }).catch(() => {});
    }

    await prisma.auditLog.create({
      data: {
        action: 'USER_PROFILE_UPDATED',
        performedBy: req.user.email,
        role: req.user.role,
        details: JSON.stringify({ name: updatedUser.name, phone: updatedUser.phone })
      }
    }).catch(() => {});

    res.json({ success: true, message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

/**
 * GET /api/users/buyers
 * Get authorized buyers with enquiries, bookings, visits & payment metrics
 */
router.get('/buyers', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'SALES_HEAD', 'SALES_EXECUTIVE']), async (req, res) => {
  try {
    const isExecutive = req.user.role === 'SALES_EXECUTIVE';

    // If executive, find emails/phones of leads assigned to this executive
    let permittedBuyerEmails = null;
    if (isExecutive) {
      const assignedLeads = await prisma.lead.findMany({
        where: { assignedExecutiveId: req.user.id },
        select: { email: true, phone: true }
      });
      permittedBuyerEmails = assignedLeads.map(l => l.email?.toLowerCase()).filter(Boolean);
    }

    const where = { role: 'BUYER' };
    if (isExecutive) {
      where.email = { in: permittedBuyerEmails || [] };
    }

    const buyers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        createdAt: true,
        propertyBookings: {
          select: {
            id: true,
            unitNumber: true,
            configuration: true,
            projectName: true,
            agreementValue: true,
            paidAmount: true,
            allotmentStatus: true,
            bookingStatus: true,
            createdAt: true
          }
        },
        payments: {
          where: { status: 'Verified' },
          select: {
            id: true,
            amount: true,
            projectName: true,
            paymentType: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Batch fetch enquiries and site visits for all buyers in 2 clean queries to prevent connection pool exhaustion
    const buyerEmails = buyers.map(b => (b.email || '').toLowerCase().trim()).filter(Boolean);

    let allLeads = [];
    let allBookings = [];

    if (buyerEmails.length > 0) {
      const [fetchedLeads, fetchedBookings] = await Promise.all([
        prisma.lead.findMany({
          where: {
            email: { in: buyerEmails, mode: 'insensitive' },
            NOT: { source: 'Self-Registered Buyer', projectId: null, preferredBhk: null }
          },
          include: {
            project: { select: { id: true, name: true, location: true } },
            assignedExecutive: { select: { id: true, name: true } }
          }
        }),
        prisma.booking.findMany({
          where: {
            OR: [
              { buyerEmail: { in: buyerEmails, mode: 'insensitive' } },
              { lead: { email: { in: buyerEmails, mode: 'insensitive' } } }
            ]
          },
          include: {
            slot: { include: { project: { select: { id: true, name: true } } } }
          }
        })
      ]);
      allLeads = fetchedLeads || [];
      allBookings = fetchedBookings || [];
    }

    const enrichedBuyers = buyers.map(b => {
      const bEmail = (b.email || '').toLowerCase().trim();
      const leads = allLeads.filter(l => (l.email || '').toLowerCase().trim() === bEmail);
      const siteVisits = allBookings.filter(bk =>
        (bk.buyerEmail || '').toLowerCase().trim() === bEmail ||
        (bk.lead?.email || '').toLowerCase().trim() === bEmail
      );
      const totalPaid = (b.payments || []).reduce((acc, p) => acc + (p.amount || 0), 0);
      const activeBookings = (b.propertyBookings || []).length;

      return {
        ...b,
        enquiries: leads,
        siteVisits,
        totalPaid,
        activeBookings
      };
    });

    return res.json({
      success: true,
      count: enrichedBuyers.length,
      buyers: enrichedBuyers
    });
  } catch (err) {
    console.error('Error fetching buyers:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch buyers.' });
  }
});

/**
 * GET /api/users
 * List users (Super Admin & Sales Head)
 */
router.get('/', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'SALES_HEAD']), async (req, res) => {
  try {
    const { role } = req.query;

    const where = {};
    if (role) where.role = role;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        supabaseId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedLeads: true,
            propertyBookings: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: users.length,
      data: users,
      users
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch users.' });
  }
});

/**
 * POST /api/users
 * Provision a new user (Super Admin or Sales Head)
 */
router.post('/', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'SALES_HEAD']), async (req, res) => {
  try {
    const { name, email, password, phone, role = 'SALES_EXECUTIVE' } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    if (!name || !cleanEmail || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    // Role restriction: Sales Head can only create Sales Executives or Buyers
    if (req.user.role === 'SALES_HEAD' && (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'SALES_HEAD')) {
      return res.status(403).json({
        success: false,
        error: 'Sales Heads can only create Sales Executives and Buyer profiles.'
      });
    }

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'User with this email already exists.' });
    }

    let supabaseId = null;
    let passwordHash = null;

    if (supabaseService.isSupabaseConfigured()) {
      const supaResult = await supabaseService.registerInSupabase({
        email: cleanEmail,
        password,
        name,
        role,
        phone
      });
      if (supaResult.error) {
        return res.status(400).json({ success: false, error: supaResult.error });
      }
      supabaseId = supaResult.user?.id;
    } else {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        passwordHash,
        supabaseId,
        phone: phone || null,
        role
      },
      select: {
        id: true,
        supabaseId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_PROVISIONED',
        performedBy: req.user.email,
        role: req.user.role,
        details: JSON.stringify({ email: newUser.email, role: newUser.role, supabaseId })
      }
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'User provisioned successfully.',
      data: newUser
    });
  } catch (err) {
    console.error('Error provisioning user:', err);
    res.status(500).json({ success: false, error: 'Failed to provision user.' });
  }
});

module.exports = router;
