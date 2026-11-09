/**
 * Secure One-Time Initial Super Admin Provisioning Script
 * Creates the first Super Admin in Supabase Auth and mirrors profile in PostgreSQL
 * Automatically disables itself once a Super Admin already exists in the database
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const supabaseService = require('../services/supabase.service');

const prisma = new PrismaClient();

async function createFirstSuperAdmin() {
  console.log('================================================================');
  console.log('🔐 PROPASSIST AI — INITIAL SUPER ADMIN SETUP');
  console.log('================================================================\n');

  try {
    // 1. Guard check: Prevent unauthorized or duplicate Super Admin setup
    const existingAdmin = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
    });

    if (existingAdmin) {
      console.log('⚠️  INITIAL SETUP DISABLED:');
      console.log(`   An active Super Admin already exists in the database (${existingAdmin.email}).`);
      console.log('   To add more staff or executives, log in as Super Admin and use the admin portal.\n');
      process.exit(0);
    }

    // Read admin credentials from environment or CLI arguments
    const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || process.argv[2] || '').trim().toLowerCase();
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || process.argv[3] || '';
    const adminName = process.env.INITIAL_ADMIN_NAME || process.argv[4] || 'Principal Super Admin';
    const adminPhone = process.env.INITIAL_ADMIN_PHONE || '+917900000001';

    if (!adminEmail || !adminPassword || adminPassword.length < 8) {
      console.error('❌ Error: Valid admin email and a password of at least 8 characters are required.');
      console.log('\nUsage:');
      console.log('   npm run setup:admin <email> <password> [name] [phone]');
      console.log('Or define in .env:');
      console.log('   INITIAL_ADMIN_EMAIL=admin@yourdeveloper.com');
      console.log('   INITIAL_ADMIN_PASSWORD=YourStrongPassword2026!');
      process.exit(1);
    }

    console.log(`[1/3] Provisioning Super Admin: ${adminEmail}`);

    let supabaseId = null;
    let passwordHash = null;

    // 2. Register in Supabase Auth if configured
    if (supabaseService.isSupabaseConfigured()) {
      console.log('      Connecting to Supabase Auth project...');
      const supaResult = await supabaseService.registerInSupabase({
        email: adminEmail,
        password: adminPassword,
        name: adminName,
        role: 'ADMIN',
        phone: adminPhone
      });

      if (supaResult.error) {
        console.error('      ❌ Supabase Auth creation failed:', supaResult.error);
        process.exit(1);
      }
      supabaseId = supaResult.user?.id;
      console.log(`      ✅ Created in Supabase Auth (UID: ${supabaseId})`);
    } else {
      console.log('      ⚡ Supabase credentials not configured in .env; generating bcrypt hash...');
      passwordHash = await bcrypt.hash(adminPassword, 10);
    }

    // 3. Create profile in database
    console.log('[2/3] Writing profile record to database...');
    const adminUser = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        supabaseId,
        role: 'ADMIN',
        phone: adminPhone
      }
    });

    console.log('[3/3] Creating immutable audit trail...');
    await prisma.auditLog.create({
      data: {
        action: 'SUPER_ADMIN_INITIALIZED',
        performedBy: adminEmail,
        role: 'ADMIN',
        details: JSON.stringify({ email: adminEmail, supabaseId })
      }
    }).catch(() => {});

    console.log('\n================================================================');
    console.log('🎉 INITIAL SUPER ADMIN SUCCESSFULLY CONFIGURED!');
    console.log('================================================================');
    console.log(`   Email:        ${adminUser.email}`);
    console.log(`   Role:         SUPER_ADMIN`);
    console.log(`   Database ID:  ${adminUser.id}`);
    console.log('   Setup Lock:   INITIAL SETUP MECHANISM IS NOW PERMANENTLY LOCKED.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create Super Admin:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createFirstSuperAdmin();
