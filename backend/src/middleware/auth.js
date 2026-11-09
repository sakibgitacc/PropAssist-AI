const jwt = require('jsonwebtoken');
const prisma = require('../db/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'propassist_jwt_super_secure_secret_token_2026_xyz';

/**
 * Middleware to authenticate requests via Bearer JWT token
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Invalid token payload: userId missing.' });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token: User no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired authentication token.'
    });
  }
}

/**
 * Optional authentication middleware: if token present, sets req.user
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Invalid token payload: userId missing.' });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, phone: true }
    });
    req.user = user || null;
  } catch {
    req.user = null;
  }
  next();
}

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    const userRole = req.user.role;
    const isAllowed = allowedRoles.includes(userRole) ||
      (userRole === 'SUPER_ADMIN' && allowedRoles.includes('ADMIN')) ||
      (userRole === 'ADMIN' && allowedRoles.includes('SUPER_ADMIN'));

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Requires one of roles: [${allowedRoles.join(', ')}]. Your role is '${userRole}'.`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  JWT_SECRET
};
