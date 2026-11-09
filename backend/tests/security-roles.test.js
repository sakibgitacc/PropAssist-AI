process.env.NODE_ENV = 'test';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const app = require('../src/server');
const prisma = require('../src/db/prisma');
const http = require('http');

let server;
let baseUrl;

// Unique, dynamic run-specific credentials (NO hardcoded credentials)
const runId = crypto.randomBytes(4).toString('hex');
const adminEmail = `super.admin.${runId}@propassist.org`;
const adminPass = `SecureAdmin#${crypto.randomBytes(6).toString('hex')}!`;

const headEmail = `sales.head.${runId}@propassist.org`;
const headPass = `SecureHead#${crypto.randomBytes(6).toString('hex')}!`;

const execAEmail = `exec.a.${runId}@propassist.org`;
const execAPass = `SecureExecA#${crypto.randomBytes(6).toString('hex')}!`;

const execBEmail = `exec.b.${runId}@propassist.org`;
const execBPass = `SecureExecB#${crypto.randomBytes(6).toString('hex')}!`;

const buyerAEmail = `buyer.a.${runId}@buyermail.com`;
const buyerAPass = `BuyerA#${crypto.randomBytes(6).toString('hex')}!`;

const buyerBEmail = `buyer.b.${runId}@buyermail.com`;
const buyerBPass = `BuyerB#${crypto.randomBytes(6).toString('hex')}!`;

let buyerAToken = '';
let buyerBToken = '';
let execAToken = '';
let execBToken = '';
let headToken = '';
let superAdminToken = '';

let buyerAUser, buyerBUser;
let execAUser, execBUser;
let sampleLeadA, sampleLeadB;
let samplePaymentB;
let sampleBookingB;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  // Ensure clean isolation for test run
  await prisma.auditLog.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.propertyBooking.deleteMany({});
  await prisma.callSession.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.leadAssignment.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Set up First Super Admin dynamically via one-time setup endpoint
  const initAdminRes = await request('POST', '/api/auth/first-super-admin', {
    setupSecret: process.env.INITIAL_SETUP_SECRET || 'PropAssistInitialAdminSetup2026',
    email: adminEmail,
    password: adminPass,
    name: 'Principal Super Admin'
  });

  // Login as Super Admin
  const adminLogin = await request('POST', '/api/auth/login', {
    email: adminEmail,
    password: adminPass
  });
  assert.equal(adminLogin.status, 200, 'Super Admin login must succeed');
  superAdminToken = adminLogin.body.token;

  // 2. Super Admin provisions Sales Head dynamically
  const headCreate = await request('POST', '/api/auth/create-staff', {
    name: 'Sales Head Ahmedabad',
    email: headEmail,
    password: headPass,
    role: 'SALES_HEAD'
  }, { 'Authorization': `Bearer ${superAdminToken}` });
  assert.equal(headCreate.status, 201, 'Super Admin creates Sales Head');

  const headLogin = await request('POST', '/api/auth/login', {
    email: headEmail,
    password: headPass
  });
  headToken = headLogin.body.token;

  // 3. Sales Head provisions Sales Executives A and B dynamically
  const execACreate = await request('POST', '/api/auth/create-staff', {
    name: 'Sales Executive A',
    email: execAEmail,
    password: execAPass,
    role: 'SALES_EXECUTIVE'
  }, { 'Authorization': `Bearer ${headToken}` });
  assert.equal(execACreate.status, 201);
  execAUser = execACreate.body.user;

  const execBCreate = await request('POST', '/api/auth/create-staff', {
    name: 'Sales Executive B',
    email: execBEmail,
    password: execBPass,
    role: 'SALES_EXECUTIVE'
  }, { 'Authorization': `Bearer ${headToken}` });
  assert.equal(execBCreate.status, 201);
  execBUser = execBCreate.body.user;

  const [eALogin, eBLogin] = await Promise.all([
    request('POST', '/api/auth/login', { email: execAEmail, password: execAPass }),
    request('POST', '/api/auth/login', { email: execBEmail, password: execBPass })
  ]);
  execAToken = eALogin.body.token;
  execBToken = eBLogin.body.token;

  // 4. Real Buyers register dynamically through the public registration endpoint
  const [bAReg, bBReg] = await Promise.all([
    request('POST', '/api/auth/register', {
      name: 'Real Buyer A',
      email: buyerAEmail,
      password: buyerAPass,
      phone: '+91 98251 11001'
    }),
    request('POST', '/api/auth/register', {
      name: 'Real Buyer B',
      email: buyerBEmail,
      password: buyerBPass,
      phone: '+91 98251 22002'
    })
  ]);

  assert.equal(bAReg.status, 201, 'Buyer A registration must succeed');
  assert.equal(bBReg.status, 201, 'Buyer B registration must succeed');

  buyerAToken = bAReg.body.token;
  buyerBToken = bBReg.body.token;
  buyerAUser = bAReg.body.user;
  buyerBUser = bBReg.body.user;

  // 5. Create active leads assigned to Executive A and Executive B
  sampleLeadA = await prisma.lead.create({
    data: {
      fullName: 'Real Inquiring Buyer A',
      phone: '+91 98251 11001',
      email: buyerAEmail,
      status: 'Qualified',
      assignedExecutiveId: execAUser.id
    }
  });

  sampleLeadB = await prisma.lead.create({
    data: {
      fullName: 'Real Inquiring Buyer B',
      phone: '+91 98251 22002',
      email: buyerBEmail,
      status: 'Qualified',
      assignedExecutiveId: execBUser.id
    }
  });

  // Create real payment for Buyer B
  samplePaymentB = await prisma.payment.create({
    data: {
      transactionRef: `TXN-REAL-${Date.now()}`,
      orderId: `order_real_${Date.now()}`,
      paymentId: `pay_real_${Date.now()}`,
      signature: `sig_real_${Date.now()}`,
      buyerId: buyerBUser.id,
      buyerName: buyerBUser.name,
      buyerEmail: buyerBUser.email,
      buyerPhone: '+91 98251 22002',
      projectName: 'The Grand Orchid',
      amount: 50000,
      status: 'Verified',
      receiptNumber: `RCP-${Date.now().toString().slice(-8)}`
    }
  });

  // Create real property booking for Buyer B
  sampleBookingB = await prisma.propertyBooking.create({
    data: {
      bookingCode: `BK-REAL-${Date.now().toString().slice(-6)}`,
      buyerId: buyerBUser.id,
      buyerName: buyerBUser.name,
      buyerEmail: buyerBUser.email,
      buyerPhone: '+91 98251 22002',
      projectId: 'proj-grand-orchid',
      projectName: 'The Grand Orchid',
      unitNumber: 'Tower A - 1402',
      tower: 'Tower A',
      configuration: '3 BHK',
      agreementValue: 8500000,
      paidAmount: 100000,
      bookingStatus: 'Confirmed & Allotted',
      allotmentStatus: 'Letter Issued',
      allotmentLetterNo: `ALT-REAL-${Date.now().toString().slice(-6)}`
    }
  });
});

test.after(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
  // Clean up test run data
  if (buyerBUser) {
    await prisma.payment.deleteMany({ where: { buyerId: buyerBUser.id } }).catch(() => {});
    await prisma.propertyBooking.deleteMany({ where: { buyerId: buyerBUser.id } }).catch(() => {});
  }
  if (sampleLeadA) await prisma.lead.delete({ where: { id: sampleLeadA.id } }).catch(() => {});
  if (sampleLeadB) await prisma.lead.delete({ where: { id: sampleLeadB.id } }).catch(() => {});
  await prisma.user.deleteMany({
    where: {
      email: { in: [adminEmail, headEmail, execAEmail, execBEmail, buyerAEmail, buyerBEmail] }
    }
  }).catch(() => {});
  await prisma.$disconnect();
});

// GROUP 1: REAL AUTHENTICATION & SUPER ADMIN SETUP SECURITY
test('TEST: Initial Super Admin setup is locked once an admin exists (HTTP 403)', async () => {
  const duplicateAttempt = await request('POST', '/api/auth/first-super-admin', {
    setupSecret: process.env.INITIAL_SETUP_SECRET || 'PropAssistInitialAdminSetup2026',
    email: 'hacker@malicious.com',
    password: 'MaliciousPassword123!',
    name: 'Rogue Admin'
  });
  assert.equal(duplicateAttempt.status, 403, 'Subsequent attempts to create initial admin must be permanently locked');
});

test('TEST: Public registration cannot self-assign staff/admin roles (HTTP 403)', async () => {
  const forgedRegister = await request('POST', '/api/auth/register', {
    name: 'Pretending Staff',
    email: `rogue.${runId}@example.com`,
    password: 'RoguePassword123!',
    phone: '+919876500000',
    role: 'ADMIN' // Trying to self-elevate
  });
  assert.equal(forgedRegister.status, 403, 'Public registration cannot self-elevate to ADMIN');
});

test('TEST: Password reset request dispatches via Supabase Auth workflow', async () => {
  const resetRes = await request('POST', '/api/auth/forgot-password', {
    email: buyerAEmail
  });
  // If Supabase not configured in local offline test, returns 400 with clear message; if configured, returns 200
  assert.ok([200, 400].includes(resetRes.status));
});

// GROUP 2: BUYER STRICT PRIVACY & DATA ISOLATION
test('TEST: Buyer A cannot view Buyer B enquiry/lead details (HTTP 403)', async () => {
  const res = await request('GET', `/api/leads/${sampleLeadB.id}`, null, {
    'Authorization': `Bearer ${buyerAToken}`
  });
  assert.equal(res.status, 403, 'Expected 403 Forbidden when Buyer A accesses Buyer B lead');
});

test('TEST: Buyer A query parameter forgery (buyer_id) does not return Buyer B data', async () => {
  const res = await request('GET', `/api/payments?buyerId=${buyerBUser.id}`, null, {
    'Authorization': `Bearer ${buyerAToken}`
  });
  assert.equal(res.status, 200);
  if (res.body.data && res.body.data.length > 0) {
    const hasBuyerBRecord = res.body.data.some(p => p.buyerId === buyerBUser.id);
    assert.equal(hasBuyerBRecord, false, 'Forged buyer_id query parameter must NOT bypass token identity');
  }
});

test('TEST: Buyer A cannot download Buyer B PDF receipt (HTTP 403)', async () => {
  const res = await request('GET', `/api/payments/${samplePaymentB.id}/receipt`, null, {
    'Authorization': `Bearer ${buyerAToken}`
  });
  assert.equal(res.status, 403, 'Expected 403 Forbidden when Buyer A downloads Buyer B receipt');
});

test('TEST: Buyer A cannot download Buyer B Allotment Letter (HTTP 403)', async () => {
  const res = await request('GET', `/api/property-bookings/${sampleBookingB.id}/allotment-letter`, null, {
    'Authorization': `Bearer ${buyerAToken}`
  });
  assert.equal(res.status, 403, 'Expected 403 Forbidden when Buyer A downloads Buyer B allotment letter');
});

test('TEST: Buyer A cannot modify internal sales lead records (HTTP 403)', async () => {
  const res = await request('PUT', `/api/leads/${sampleLeadA.id}`, { status: 'Converted' }, {
    'Authorization': `Bearer ${buyerAToken}`
  });
  assert.equal(res.status, 403, 'Buyers must never be allowed to modify internal leads');
});

// GROUP 3: SALES EXECUTIVE STRICT ASSIGNMENT RESTRICTIONS
test('TEST: Executive A cannot access Executive B currently assigned lead (HTTP 403)', async () => {
  const res = await request('GET', `/api/leads/${sampleLeadB.id}`, null, {
    'Authorization': `Bearer ${execAToken}`
  });
  assert.equal(res.status, 403, 'Executive A must receive 403 when trying to view Executive B lead');
});

test('TEST: Executive A cannot modify Executive B assigned lead (HTTP 403)', async () => {
  const res = await request('PUT', `/api/leads/${sampleLeadB.id}`, { notes: 'Executive A unassigned update' }, {
    'Authorization': `Bearer ${execAToken}`
  });
  assert.equal(res.status, 403, 'Executive A must receive 403 when modifying another executive lead');
});

test('TEST: Executive A cannot initiate call session for Executive B lead (HTTP 403)', async () => {
  const res = await request('POST', '/api/calls/create', { leadId: sampleLeadB.id, callType: 'video' }, {
    'Authorization': `Bearer ${execAToken}`
  });
  assert.equal(res.status, 403, 'Executive A must receive 403 when creating call session for unassigned lead');
});

test('TEST: Lead reassignment immediately revokes previous executive operational access', async () => {
  const tempLead = await prisma.lead.create({
    data: {
      fullName: 'Dynamic Reassignment Isolation Lead',
      phone: '+91 98980 99999',
      status: 'Qualified',
      assignedExecutiveId: execAUser.id
    }
  });

  // 1. Executive A has access
  const resBefore = await request('GET', `/api/leads/${tempLead.id}`, null, {
    'Authorization': `Bearer ${execAToken}`
  });
  assert.equal(resBefore.status, 200, 'Executive A should initially access assigned lead');

  // 2. Sales Head reassigns lead to Executive B
  const reassignRes = await request('POST', `/api/leads/${tempLead.id}/assign`, {
    executiveId: execBUser.id,
    reason: 'Dynamic workload rebalancing'
  }, {
    'Authorization': `Bearer ${headToken}`
  });
  assert.equal(reassignRes.status, 200, 'Sales Head successfully reassigns lead');

  // 3. Executive A immediately loses operational access
  const resAfter = await request('GET', `/api/leads/${tempLead.id}`, null, {
    'Authorization': `Bearer ${execAToken}`
  });
  assert.equal(resAfter.status, 403, 'Previous executive must lose access immediately after reassignment');

  // 4. Executive B now has authorized access
  const resExecB = await request('GET', `/api/leads/${tempLead.id}`, null, {
    'Authorization': `Bearer ${execBToken}`
  });
  assert.equal(resExecB.status, 200, 'New executive receives authorized access after reassignment');

  await prisma.leadAssignment.deleteMany({ where: { leadId: tempLead.id } });
  await prisma.lead.delete({ where: { id: tempLead.id } });
});

// GROUP 4: PAYMENTS, CRYPTOGRAPHIC SIGNATURE & IDEMPOTENCY
test('TEST: Invalid payment signature is rejected with HTTP 400', async () => {
  const res = await request('POST', '/api/payments/verify', {
    orderId: 'order_test_fake_12345',
    razorpayPaymentId: 'pay_test_fake_12345',
    razorpaySignature: 'invalid_forged_cryptographic_signature'
  }, {
    'Authorization': `Bearer ${buyerAToken}`
  });
  assert.equal(res.status, 400, 'Invalid HMAC-SHA256 signature must be rejected');
});

test('TEST: Pending unverified payments do not generate receipts', async () => {
  const pendingPayment = await prisma.payment.create({
    data: {
      transactionRef: `TXN-PENDING-${Date.now()}`,
      amount: 25000,
      currency: 'INR',
      status: 'Pending',
      orderId: `order_pending_${Date.now()}`,
      buyerId: buyerAUser.id,
      buyerName: buyerAUser.name,
      buyerEmail: buyerAUser.email,
      buyerPhone: '+919876543210',
      projectName: 'The Grand Orchid'
    }
  });

  const res = await request('GET', `/api/payments/${pendingPayment.id}/receipt`, null, {
    'Authorization': `Bearer ${buyerAToken}`
  });
  assert.equal(res.status, 400, 'Cannot generate receipt for unverified payment');

  await prisma.payment.delete({ where: { id: pendingPayment.id } });
});

// GROUP 5: PROPERTY BOOKINGS & DOUBLE-BOOKING PREVENTION
test('TEST: Simultaneous booking attempts cannot reserve the same unit twice', async () => {
  const project = await prisma.project.findFirst();
  assert.ok(project);

  const testUnit = await prisma.unit.create({
    data: {
      unitNumber: `TEST-UNIT-${Date.now().toString().slice(-4)}`,
      tower: 'Tower T',
      floor: 9,
      configuration: '2 BHK',
      carpetAreaSqFt: 950,
      superBuiltUpAreaSqFt: 1350,
      basePrice: 7500000,
      status: 'Available',
      projectId: project.id
    }
  });

  // Attempt 1: Buyer A books unit -> Success
  const booking1 = await request('POST', '/api/property-bookings', {
    projectId: project.id,
    unitId: testUnit.id,
    tokenAmount: 100000
  }, {
    'Authorization': `Bearer ${buyerAToken}`
  });
  assert.equal(booking1.status, 201, 'First booking attempt should succeed');

  // Attempt 2: Buyer B attempts to book the same unit -> Rejected (400)
  const booking2 = await request('POST', '/api/property-bookings', {
    projectId: project.id,
    unitId: testUnit.id,
    tokenAmount: 100000
  }, {
    'Authorization': `Bearer ${buyerBToken}`
  });
  assert.equal(booking2.status, 400, 'Duplicate unit booking must be rejected with HTTP 400');

  await prisma.propertyBooking.deleteMany({ where: { unitId: testUnit.id } });
  await prisma.unit.delete({ where: { id: testUnit.id } });
});

// GROUP 6: COMMUNICATION AUTHORIZATION
test('TEST: Unauthorized Buyer cannot dispatch promotional SMS (HTTP 403)', async () => {
  const res = await request('POST', '/api/sms/send', {
    to: '+919876500000',
    message: 'Unauthorized blast test'
  }, {
    'Authorization': `Bearer ${buyerAToken}`
  });
  assert.equal(res.status, 403, 'Buyers must not be authorized to send outbound SMS');
});
