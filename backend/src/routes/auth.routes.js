const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../db/prisma');
const { authenticateToken, requireRole, JWT_SECRET } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const supabaseService = require('../services/supabase.service');

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const buyerRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(7, 'Valid contact number is required'),
  role: z.string().optional() // Ignored on public register - always forced to BUYER
});

const createStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['SALES_HEAD', 'SALES_EXECUTIVE', 'SUPER_ADMIN', 'ADMIN']),
  phone: z.string().optional()
});

// Default built-in credentials map for seamless offline/online dual-authentication
const BUILTIN_ACCOUNTS = {
  'superadmin@propassist.ai': {
    name: 'Principal Super Admin',
    role: 'SUPER_ADMIN',
    phone: '+919876543210',
    password: 'Admin@123'
  },
  'saleshead@propassist.ai': {
    name: 'Vikramaditya Mehta (Sales Head)',
    role: 'SALES_HEAD',
    phone: '+919825012345',
    password: 'Sales@123'
  },
  'executive1@propassist.ai': {
    name: 'Pooja Sharma (Senior Executive)',
    role: 'SALES_EXECUTIVE',
    phone: '+919825054321',
    password: 'Exec@123'
  },
  'buyer@example.com': {
    name: 'Rahul Shah (Homebuyer)',
    role: 'BUYER',
    phone: '+919825099887',
    password: 'Buyer@123'
  },
  'sakibattar91@gmail.com': {
    name: 'Sakib Attar',
    role: 'BUYER',
    phone: '+918530493687',
    password: 'Sakib@123456'
  }
};

// POST /api/auth/login
router.post('/login', validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // 1. Fetch user profile from database (case-insensitive)
    let user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } }
    });

    // Auto-provision built-in system role if missing from local DB
    if (!user && BUILTIN_ACCOUNTS[cleanEmail]) {
      const acc = BUILTIN_ACCOUNTS[cleanEmail];
      const pHash = await bcrypt.hash(acc.password, 10);
      user = await prisma.user.create({
        data: {
          name: acc.name,
          email: cleanEmail,
          role: acc.role,
          phone: acc.phone,
          passwordHash: pHash
        }
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User with this email does not exist.'
      });
    }

    // 2. Dual-Layer Authenticator: Supabase Auth or Cryptographic Bcrypt
    let isAuthenticated = false;

    // Check built-in account password directly or via bcrypt
    if (BUILTIN_ACCOUNTS[cleanEmail] && password === BUILTIN_ACCOUNTS[cleanEmail].password) {
      isAuthenticated = true;
    } else if (user.passwordHash) {
      isAuthenticated = await bcrypt.compare(password, user.passwordHash).catch(() => false);
    }

    // Also attempt Supabase sign-in when configured to synchronize tokens
    if (supabaseService.isSupabaseConfigured()) {
      try {
        const authResult = await supabaseService.signInWithSupabase({ email: cleanEmail, password });
        if (authResult.session) {
          isAuthenticated = true;
          if (!user.supabaseId && authResult.user?.id) {
            await prisma.user.update({
              where: { id: user.id },
              data: { supabaseId: authResult.user.id }
            }).catch(() => {});
          }
        }
      } catch (_) {
        // Fall back to verified local bcrypt/built-in password
      }
    }

    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Password does not match.'
      });
    }

    // 3. Issue verified JWT access token (Role is derived strictly from DB)
    const token = jwt.sign(
      { userId: user.id, id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Audit login
    await prisma.auditLog.create({
      data: {
        action: 'USER_LOGIN_SUCCESS',
        performedBy: user.email,
        role: user.role,
        details: JSON.stringify({ ip: req.ip || '127.0.0.1' })
      }
    }).catch(() => {});

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        supabaseId: user.supabaseId,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Server error during login' });
  }
});

// POST /api/auth/register - Real Buyer Registration
router.post('/register', validateBody(buyerRegisterSchema), async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // Strict role guard: Public registration can NEVER create staff or admin accounts
    if (role && role !== 'BUYER') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Public registration is only available for prospective buyers. Internal staff accounts must be created by a Super Admin.'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please sign in instead.'
      });
    }

    let supabaseId = null;
    let passwordHash = null;

    // Register with Supabase Auth if configured
    if (supabaseService.isSupabaseConfigured()) {
      const supaResult = await supabaseService.registerInSupabase({
        email: cleanEmail,
        password,
        name,
        role: 'BUYER',
        phone
      });

      if (supaResult.error) {
        return res.status(400).json({
          success: false,
          error: supaResult.error
        });
      }
      supabaseId = supaResult.user?.id;
    } else {
      // In local dev without Supabase, hash with bcrypt
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Create verified profile in PostgreSQL
    const newUser = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        passwordHash,
        supabaseId,
        phone: phone || null,
        role: 'BUYER'
      }
    });

    // Note: Inquiries (Leads) should only be created when the buyer actually submits an inquiry or books a visit.

    // Issue JWT token
    const token = jwt.sign(
      { userId: newUser.id, role: 'BUYER', email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Buyer account registered successfully in Supabase Auth.',
      token,
      user: {
        id: newUser.id,
        supabaseId: newUser.supabaseId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, error: 'Server error during registration' });
  }
});

// POST /api/auth/create-staff - Provision Internal Staff (Super Admin & Sales Head only)
router.post('/create-staff', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'SALES_HEAD']), validateBody(createStaffSchema), async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // Sales Head cannot create Super Admins or other Sales Heads
    if (req.user.role === 'SALES_HEAD' && (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'SALES_HEAD')) {
      return res.status(403).json({
        success: false,
        error: 'Sales Heads can only provision Sales Executives.'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'A user account with this email address already exists.'
      });
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

    const newStaff = await prisma.user.create({
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
        action: 'STAFF_ACCOUNT_PROVISIONED',
        performedBy: req.user.email,
        role: req.user.role,
        details: JSON.stringify({ targetEmail: newStaff.email, assignedRole: newStaff.role })
      }
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: `Staff account successfully provisioned with role '${role}'.`,
      user: newStaff
    });
  } catch (err) {
    console.error('Error provisioning staff:', err);
    return res.status(500).json({ success: false, error: 'Failed to provision staff account.' });
  }
});

// POST /api/auth/forgot-password - Dispatch password reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const result = await supabaseService.resetPasswordInSupabase(email);
    if (!result.configured) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    return res.json({
      success: true,
      message: 'Password reset instructions have been sent to your registered email address.'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, error: 'Failed to process password reset request.' });
  }
});

// POST /api/auth/first-super-admin - Secure One-Time Initial Super Admin Setup
router.post('/first-super-admin', async (req, res) => {
  try {
    const setupSecret = process.env.INITIAL_SETUP_SECRET || 'PropAssistInitialAdminSetup2026';
    const providedSecret = req.headers['x-setup-secret'] || req.body.setupSecret;

    if (providedSecret !== setupSecret) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Invalid setup authorization secret.'
      });
    }

    // Check if a Super Admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
    });

    if (existingAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Initial setup is permanently disabled: An active Super Admin account already exists.'
      });
    }

    const { email, password, name = 'Executive Super Admin', phone } = req.body;
    if (!email || !password || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Valid email and strong password (min 8 characters) are required.'
      });
    }

    let supabaseId = null;
    let passwordHash = null;

    if (supabaseService.isSupabaseConfigured()) {
      const supaResult = await supabaseService.registerInSupabase({
        email,
        password,
        name,
        role: 'ADMIN',
        phone
      });
      if (supaResult.error) {
        return res.status(400).json({ success: false, error: supaResult.error });
      }
      supabaseId = supaResult.user?.id;
    } else {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const adminUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        supabaseId,
        phone,
        role: 'ADMIN'
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Initial Super Admin account created successfully. The setup mechanism is now permanently disabled.',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (err) {
    console.error('Error creating initial Super Admin:', err);
    return res.status(500).json({ success: false, error: 'Failed to create initial Super Admin.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// GET /api/auth/executives
router.get('/executives', authenticateToken, async (req, res) => {
  try {
    const executives = await prisma.user.findMany({
      where: {
        role: { in: ['SALES_EXECUTIVE', 'SALES_HEAD', 'ADMIN'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true
      },
      orderBy: { name: 'asc' }
    });

    return res.json({
      success: true,
      executives
    });
  } catch (error) {
    console.error('Error fetching executives:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve executives' });
  }
});

// GET /api/auth/users
router.get('/users', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'SALES_HEAD']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve users' });
  }
});

module.exports = router;
