/**
 * Database Connection & Health Verification Script
 * Supports both local SQLite and remote Supabase PostgreSQL
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('==============================================');
  console.log('🔍 PropAssist AI Database Connectivity Check');
  console.log('==============================================');
  
  const startTime = Date.now();
  try {
    // 1. Verify connection
    await prisma.$connect();
    const latency = Date.now() - startTime;
    console.log(`✅ Database connection established in ${latency}ms`);

    // 2. Query basic metrics to verify tables
    const [userCount, projectCount, unitCount, leadCount, bookingCount, paymentCount] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.unit.count(),
      prisma.lead.count(),
      prisma.propertyBooking.count(),
      prisma.payment.count()
    ]);

    console.log('📊 Current Database Records:');
    console.log(`   - Users:              ${userCount}`);
    console.log(`   - Projects:           ${projectCount}`);
    console.log(`   - Units/Inventory:    ${unitCount}`);
    console.log(`   - Leads:              ${leadCount}`);
    console.log(`   - Property Bookings:  ${bookingCount}`);
    console.log(`   - Payments:           ${paymentCount}`);

    console.log('\n🔒 Role Distribution:');
    const roles = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    });
    roles.forEach(r => {
      console.log(`   - ${r.role.padEnd(16)}: ${r._count.id}`);
    });

    console.log('\n🎉 Database is healthy, schema verified, and fully operational!');
    console.log('==============================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database connection check failed:');
    console.error(err.message);
    console.log('\n💡 Troubleshooting Tips:');
    console.log('   1. For Supabase PostgreSQL, check DATABASE_URL and DIRECT_URL in .env');
    console.log('   2. Ensure the database password is valid and connection pooling mode is set');
    console.log('   3. Run `npm run db:migrate` or `prisma db push` to generate tables');
    console.log('   4. Run `npm run db:seed` to insert initial demo data');
    console.log('==============================================');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
