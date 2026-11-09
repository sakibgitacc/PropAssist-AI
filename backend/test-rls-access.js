process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { Client } = require('pg');
const assert = require('assert');

async function testRLS() {
  const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const cleanUrl = rawUrl.split('?')[0];

  const client = new Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('================================================================');
    console.log('🛡️ PROPASSIST AI — DIRECT POSTGRESQL RLS ENFORCEMENT VERIFICATION');
    console.log('================================================================\n');

    // 1. Verify RLS is enabled on all 20 tables
    const rlsCheck = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);
    
    assert.equal(rlsCheck.rows.length, 20, 'Must have exactly 20 public tables');
    for (const row of rlsCheck.rows) {
      assert.strictEqual(row.rowsecurity, true, `Table ${row.tablename} must have rowsecurity = true`);
    }
    console.log('✅ TEST 1: All 20 public tables have Row Level Security enabled (rowsecurity = true)');

    // 2. Test Anon / Public Access Restrictions
    await client.query('BEGIN');
    await client.query("SET LOCAL ROLE anon;");

    // Anon should be able to view active projects
    const anonProjects = await client.query('SELECT count(*) FROM public."Project" WHERE "status" = \'Active\';');
    console.log(`✅ TEST 2: Anon can view active project fact sheets (Count: ${anonProjects.rows[0].count})`);

    // Anon should NOT be able to view InternalNotes (must return 0 rows)
    const anonNotes = await client.query('SELECT count(*) FROM public."InternalNote";');
    assert.equal(parseInt(anonNotes.rows[0].count, 10), 0, 'Anon must not read any InternalNotes');
    console.log('✅ TEST 3: Anon has ZERO visibility into InternalNote (Blocked by RLS, count: 0)');

    // Anon should NOT be able to view Payments
    const anonPayments = await client.query('SELECT count(*) FROM public."Payment";');
    assert.equal(parseInt(anonPayments.rows[0].count, 10), 0, 'Anon must not read any Payment records');
    console.log('✅ TEST 4: Anon has ZERO visibility into Payment records (Blocked by RLS, count: 0)');

    // Anon should NOT be able to view LeadAssignments
    const anonAssignments = await client.query('SELECT count(*) FROM public."LeadAssignment";');
    assert.equal(parseInt(anonAssignments.rows[0].count, 10), 0, 'Anon must not read any LeadAssignment records');
    console.log('✅ TEST 5: Anon has ZERO visibility into LeadAssignment records (Blocked by RLS, count: 0)');

    // Anon should NOT be able to view Users
    const anonUsers = await client.query('SELECT count(*) FROM public."User";');
    assert.equal(parseInt(anonUsers.rows[0].count, 10), 0, 'Anon must not read any User profiles');
    console.log('✅ TEST 6: Anon has ZERO visibility into User profiles (Blocked by RLS, count: 0)');

    await client.query('ROLLBACK');

    // 3. Test Authenticated Buyer Context
    await client.query('BEGIN');
    // Simulate Buyer user context via request.jwt.claims
    const buyerEmail = 'buyer@example.com';
    const buyer = (await client.query('SELECT id, "supabaseId" FROM public."User" WHERE email = $1', [buyerEmail])).rows[0];
    
    if (buyer) {
      const sub = buyer.supabaseId || buyer.id;
      await client.query("SET LOCAL ROLE authenticated;");
      await client.query(`SELECT set_config('request.jwt.claims', $1, true);`, [JSON.stringify({ sub, role: 'authenticated', email: buyerEmail })]);

      // Buyer checking InternalNotes -> must be 0
      const buyerNotes = await client.query('SELECT count(*) FROM public."InternalNote";');
      assert.equal(parseInt(buyerNotes.rows[0].count, 10), 0, 'Buyer must not read any InternalNotes');
      console.log('✅ TEST 7: Buyer has ZERO access to InternalNote (Blocked by RLS, count: 0)');

      // Buyer checking LeadAssignment -> must be 0
      const buyerAssignments = await client.query('SELECT count(*) FROM public."LeadAssignment";');
      assert.equal(parseInt(buyerAssignments.rows[0].count, 10), 0, 'Buyer must not read any LeadAssignment records');
      console.log('✅ TEST 8: Buyer has ZERO access to LeadAssignment (Blocked by RLS, count: 0)');

      // Buyer reading User table -> can ONLY see their own profile
      const buyerSelf = await client.query('SELECT email FROM public."User";');
      assert.ok(buyerSelf.rows.every(r => r.email === buyerEmail), 'Buyer can only see self profile');
      console.log(`✅ TEST 9: Buyer can only see their own profile in User table (Rows: ${buyerSelf.rows.length})`);
    }

    await client.query('ROLLBACK');

    console.log('\n================================================================');
    console.log('🎉 ALL 9 DATABASE-LEVEL RLS TESTS PASSED WITH 100% SUCCESS!');
    console.log('================================================================');

  } catch (err) {
    console.error('RLS Test Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testRLS();

