#!/usr/bin/env node
require('dotenv').config();
const { isSupabaseConfigured, testSupabaseConnection, getSupabaseAdmin } = require('../src/services/supabase.service');
const prisma = require('../src/db/prisma');

async function verifySupabase() {
  console.log('================================================================');
  console.log('   PROPASSIST AI — SUPABASE POSTGRESQL & AUTH VERIFICATION      ');
  console.log('================================================================\n');

  const dbUrl = process.env.DATABASE_URL || '';
  const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
  const isSupabaseDb = dbUrl.includes('supabase.com');

  console.log('1. Database Connection String Check:');
  console.log(`   - Configured: ${dbUrl ? 'YES' : 'NO'}`);
  console.log(`   - Driver Mode: ${isPostgres ? 'PostgreSQL' : 'SQLite (Local Dev Mode)'}`);
  console.log(`   - Supabase Host: ${isSupabaseDb ? 'Supabase Cloud Pooler' : 'Local / Custom'}`);

  console.log('\n2. Prisma Database Query Ping:');
  try {
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    const leadCount = await prisma.lead.count();
    console.log(`   ✅ Database is responsive!`);
    console.log(`   - Registered Users: ${userCount}`);
    console.log(`   - Active Residential Projects: ${projectCount}`);
    console.log(`   - Leads Tracked: ${leadCount}`);
  } catch (err) {
    console.log(`   ❌ Database ping error: ${err.message}`);
  }

  console.log('\n3. Supabase Auth & REST Service:');
  if (isSupabaseConfigured()) {
    const authTest = await testSupabaseConnection();
    if (authTest.status === 'CONNECTED') {
      console.log(`   ✅ Supabase Auth Connected! (Latency: ${authTest.latencyMs}ms)`);
      console.log(`   - Endpoint: ${process.env.SUPABASE_URL}`);
    } else {
      console.log(`   ⚠️ Supabase Auth Configured but returned: ${authTest.error || authTest.status}`);
    }

    console.log('\n4. Supabase Storage Buckets:');
    try {
      const admin = getSupabaseAdmin();
      const { data: buckets, error } = await admin.storage.listBuckets();
      if (error) {
        console.log(`   ⚠️ Storage check returned: ${error.message}`);
      } else {
        const bucketNames = buckets.map(b => b.name);
        console.log(`   ✅ Storage is operational. Existing buckets: [${bucketNames.join(', ')}]`);
      }
    } catch (storageErr) {
      console.log(`   ⚠️ Storage check skipped: ${storageErr.message}`);
    }
  } else {
    console.log('   ℹ️ Supabase Cloud keys (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) not set in backend/.env.');
    console.log('   ℹ️ Platform is currently operating with zero-config local engine.');
  }

  console.log('\n================================================================');
  console.log('HOW TO CONNECT YOUR SUPABASE PROJECT:');
  console.log('1. Create project at https://supabase.com/dashboard');
  console.log('2. In Supabase SQL Editor, run database/supabase_schema.sql');
  console.log('3. In Supabase SQL Editor, run database/rls_policies.sql');
  console.log('4. In backend/.env, set DATABASE_URL, DIRECT_URL, SUPABASE_URL, and keys:');
  console.log('   DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"');
  console.log('   DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres"');
  console.log('   SUPABASE_URL="https://[REF].supabase.co"');
  console.log('   SUPABASE_ANON_KEY="your-anon-key"');
  console.log('   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  console.log('5. Push Prisma schema: npm run db:supabase:push');
  console.log('================================================================\n');

  await prisma.$disconnect();
}

verifySupabase().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});

