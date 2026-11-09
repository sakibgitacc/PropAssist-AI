/**
 * PropAssist AI — Seed Role Accounts
 * Provisions real accounts in Supabase Auth & PostgreSQL Prisma database:
 * - Super Admin: superadmin@propassist.ai / Admin@123
 * - Sales Head: saleshead@propassist.ai / Sales@123
 * - Sales Executive: executive1@propassist.ai / Exec@123
 * - Verified Buyer: buyer@example.com / Buyer@123
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const supabaseService = require('../services/supabase.service');

const prisma = new PrismaClient();

const DEMO_ACCOUNTS = [
  {
    email: 'superadmin@propassist.ai',
    password: 'Admin@123',
    name: 'Principal Super Admin',
    role: 'SUPER_ADMIN',
    phone: '+919876543210'
  },
  {
    email: 'saleshead@propassist.ai',
    password: 'Sales@123',
    name: 'Vikramaditya Mehta (Sales Head)',
    role: 'SALES_HEAD',
    phone: '+919825012345'
  },
  {
    email: 'executive1@propassist.ai',
    password: 'Exec@123',
    name: 'Pooja Sharma (Senior Executive)',
    role: 'SALES_EXECUTIVE',
    phone: '+919825054321'
  },
  {
    email: 'buyer@example.com',
    password: 'Buyer@123',
    name: 'Rahul Shah (Homebuyer)',
    role: 'BUYER',
    phone: '+919825099887'
  }
];

async function seedRoleAccounts() {
  console.log('================================================================');
  console.log('👥 PROPASSIST AI — ROLE-BASED DEMO ACCOUNTS SEEDER');
  console.log('================================================================\n');

  for (const acc of DEMO_ACCOUNTS) {
    try {
      console.log(`Processing ${acc.role}: ${acc.email}...`);

      let supabaseId = null;

      // 1. Check or create in Supabase Auth
      if (supabaseService.isSupabaseConfigured()) {
        try {
          const admin = supabaseService.getSupabaseAdmin();
          // Find existing user in Supabase auth
          const { data: usersData } = await admin.auth.admin.listUsers();
          const existingSupaUser = usersData?.users?.find(u => u.email === acc.email);

          if (existingSupaUser) {
            supabaseId = existingSupaUser.id;
            console.log(`   ℹ️ Supabase Auth user already exists (UID: ${supabaseId})`);
            // Update password to ensure it matches
            await admin.auth.admin.updateUserById(supabaseId, {
              password: acc.password,
              email_confirm: true,
              user_metadata: { name: acc.name, role: acc.role, phone: acc.phone }
            });
          } else {
            const regResult = await supabaseService.registerInSupabase({
              email: acc.email,
              password: acc.password,
              name: acc.name,
              role: acc.role,
              phone: acc.phone
            });
            if (regResult.user) {
              supabaseId = regResult.user.id;
              console.log(`   ✅ Created in Supabase Auth (UID: ${supabaseId})`);
            }
          }
        } catch (supaErr) {
          console.warn(`   ⚠️ Supabase Auth step:`, supaErr.message);
        }
      }

      // 2. Hash password for local fallback
      const passwordHash = await bcrypt.hash(acc.password, 10);

      // 3. Upsert user in Prisma Database
      const existingUser = await prisma.user.findUnique({ where: { email: acc.email } });
      if (existingUser) {
        await prisma.user.update({
          where: { email: acc.email },
          data: {
            name: acc.name,
            role: acc.role,
            phone: acc.phone,
            passwordHash,
            supabaseId: supabaseId || existingUser.supabaseId
          }
        });
        console.log(`   ✅ Updated profile in PostgreSQL database.`);
      } else {
        await prisma.user.create({
          data: {
            email: acc.email,
            name: acc.name,
            role: acc.role,
            phone: acc.phone,
            passwordHash,
            supabaseId
          }
        });
        console.log(`   ✅ Created profile in PostgreSQL database.`);
      }

    } catch (err) {
      console.error(`   ❌ Failed for ${acc.email}:`, err.message);
    }
  }

  console.log('\n================================================================');
  console.log('🎉 ALL ROLE DEMO ACCOUNTS READY FOR 1-CLICK UI LOGIN!');
  console.log('================================================================');
}

seedRoleAccounts().then(() => prisma.$disconnect());

