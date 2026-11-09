const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/organizations
 * Super Admin lists all organizations
 */
router.get('/', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: orgs.length,
      data: orgs
    });
  } catch (err) {
    console.error('Error fetching organizations:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch organizations.' });
  }
});

/**
 * POST /api/organizations
 * Super Admin creates an organization
 */
router.post('/', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { name, legalEntity, reraLicense, contactEmail, contactPhone, activeProjectsCount = 1, totalUnits = 420 } = req.body;

    if (!name || !legalEntity) {
      return res.status(400).json({ success: false, error: 'Organization name and legal entity are required.' });
    }

    const org = await prisma.organization.create({
      data: {
        name,
        legalEntity,
        reraLicense: reraLicense || 'RERA/AHM/DEV/2026/001',
        contactEmail: contactEmail || 'corporate@propassist.ai',
        contactPhone: contactPhone || '+91 79 4900 1200',
        activeProjectsCount: Number(activeProjectsCount) || 1,
        totalUnits: Number(totalUnits) || 420
      }
    });

    res.status(201).json({
      success: true,
      data: org
    });
  } catch (err) {
    console.error('Error creating organization:', err);
    res.status(500).json({ success: false, error: 'Failed to create organization.' });
  }
});

/**
 * PUT /api/organizations/:id
 * Super Admin updates an organization's details
 */
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, legalEntity, reraLicense, contactEmail, contactPhone, activeProjectsCount, totalUnits, status } = req.body;

    const existing = await prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Organization not found.' });
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(legalEntity && { legalEntity }),
        ...(reraLicense && { reraLicense }),
        ...(contactEmail && { contactEmail }),
        ...(contactPhone && { contactPhone }),
        ...(activeProjectsCount !== undefined && { activeProjectsCount: Number(activeProjectsCount) }),
        ...(totalUnits !== undefined && { totalUnits: Number(totalUnits) }),
        ...(status && { status }),
        updatedAt: new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'ORGANIZATION_UPDATED',
        performedBy: req.user.email,
        role: req.user.role,
        details: JSON.stringify({ organizationId: id, name: updated.name, status: updated.status })
      }
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Organization updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('Error updating organization:', err);
    res.status(500).json({ success: false, error: 'Failed to update organization.' });
  }
});

/**
 * PATCH /api/organizations/:id/status
 * Toggle or set organization status (Active / Inactive)
 */
router.patch('/:id/status', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Organization not found.' });
    }

    const nextStatus = status || (existing.status === 'Active' ? 'Inactive' : 'Active');

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        status: nextStatus,
        updatedAt: new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'ORGANIZATION_STATUS_CHANGED',
        performedBy: req.user.email,
        role: req.user.role,
        details: JSON.stringify({ organizationId: id, oldStatus: existing.status, newStatus: nextStatus })
      }
    }).catch(() => {});

    res.json({
      success: true,
      message: `Organization status set to ${nextStatus}.`,
      data: updated
    });
  } catch (err) {
    console.error('Error toggling organization status:', err);
    res.status(500).json({ success: false, error: 'Failed to update organization status.' });
  }
});

module.exports = router;
