const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/audit-logs
 * Super Admin access to immutable system audit trails
 */
router.get('/', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs.' });
  }
});

module.exports = router;
