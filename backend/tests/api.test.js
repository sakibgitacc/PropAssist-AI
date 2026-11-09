process.env.NODE_ENV = 'test';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/server');
const prisma = require('../src/db/prisma');
const http = require('http');

let server;
let baseUrl;
let adminToken = '';
let execToken = '';
let buyerToken = '';

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
  // Start server on an ephemeral port
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

  // Dynamically set up real admin and executive accounts for test run
  const testAdminEmail = `api.test.admin.${Date.now()}@propassist.org`;
  const testAdminPass = 'SecureAdmin#2026Test!';
  const testExecEmail = `api.test.exec.${Date.now()}@propassist.org`;
  const testExecPass = 'SecureExec#2026Test!';

  // Provision Admin
  await request('POST', '/api/auth/first-super-admin', {
    setupSecret: process.env.INITIAL_SETUP_SECRET || 'PropAssistInitialAdminSetup2026',
    email: testAdminEmail,
    password: testAdminPass,
    name: 'API Test Super Admin'
  });

  const aLogin = await request('POST', '/api/auth/login', {
    email: testAdminEmail,
    password: testAdminPass
  });
  adminToken = aLogin.body.token;

  // Admin provisions Executive
  await request('POST', '/api/auth/create-staff', {
    name: 'API Test Executive',
    email: testExecEmail,
    password: testExecPass,
    role: 'SALES_EXECUTIVE'
  }, { 'Authorization': `Bearer ${adminToken}` });

  const eLogin = await request('POST', '/api/auth/login', {
    email: testExecEmail,
    password: testExecPass
  });
  execToken = eLogin.body.token;
});

test.after(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
  await prisma.$disconnect();
});

// 1. Health check test
test('GET /api/health should return ok', async () => {
  const res = await request('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

// 2. Authentication: Admin Verified Session
test('GET /api/auth/me - Verify Admin Session Profile', async () => {
  const res = await request('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.user.role, 'ADMIN');
});

// 3. Authentication: Sales Executive Verified Session
test('GET /api/auth/me - Verify Executive Session Profile', async () => {
  const res = await request('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${execToken}`
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.user.role, 'SALES_EXECUTIVE');
});

// 4. Role Permissions: Sales Executive cannot update Fact Sheet
test('PUT /api/projects/:id/factsheet - Executive Forbidden (403)', async () => {
  const res = await request('PUT', '/api/projects/proj-grand-orchid/factsheet', {
    overview: 'Updated overview test content',
    pricingDetails: '₹1.50 Cr',
    connectivity: 'Near Ring Road',
    specifications: 'Specs',
    rawContent: 'Fact sheet content'
  }, {
    'Authorization': `Bearer ${execToken}`
  });
  assert.equal(res.status, 403);
  assert.equal(res.body.success, false);
});

// 5. Projects Listing: Should return projects with demo markings and amenities
test('GET /api/projects - Returns seeded Ahmedabad residential projects', async () => {
  const res = await request('GET', '/api/projects');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.projects.length >= 2);
  const orchid = res.body.projects.find(p => p.id === 'proj-grand-orchid');
  assert.ok(orchid);
  assert.equal(orchid.city, 'Ahmedabad');
  assert.equal(orchid.isDemo, true);
});

// 6. Lead CRUD & Duplicate Detection
let createdLeadId = '';
let testPhone = '';

test('POST /api/leads - Create new lead', async () => {
  testPhone = `+91 99999 ${Date.now().toString().slice(-5)}${Math.floor(10 + Math.random() * 90)}`;
  const res = await request('POST', '/api/leads', {
    fullName: 'Ananya Verma',
    phone: testPhone,
    email: `ananya.${Date.now()}@example.com`,
    preferredBhk: '3 BHK',
    preferredLocation: 'SG Highway',
    budgetMin: 13000000,
    budgetMax: 18000000,
    status: 'New'
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.lead.id);
  createdLeadId = res.body.lead.id;
});

test('POST /api/leads - Duplicate detection returns 409', async () => {
  const res = await request('POST', '/api/leads', {
    fullName: 'Ananya Verma (Attempt 2)',
    phone: testPhone, // Same phone
    email: 'ananya.different@example.com'
  });
  assert.equal(res.status, 409);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'Duplicate lead detected');
});

// 7. Lead Pagination & Filters
test('GET /api/leads - Pagination & Search', async () => {
  const res = await request('GET', '/api/leads?search=Ananya', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.length >= 1);
  const found = res.body.data.find(l => l.id === createdLeadId);
  assert.ok(found, 'Created lead should be found in search results');
});

// 8. Lead Executive Assignment
test('POST /api/leads/:id/assign - Assign lead to Executive', async () => {
  const execs = await prisma.user.findFirst({ where: { role: 'SALES_EXECUTIVE' } });
  const res = await request('POST', `/api/leads/${createdLeadId}/assign`, {
    executiveId: execs.id,
    reason: 'Initial lead assignment'
  }, {
    'Authorization': `Bearer ${adminToken}`
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.lead.assignedExecutiveId, execs.id);
});

// 9. AI Chatbot Response & Fact Sheet Grounding
test('POST /api/ai/chat - AI responds with grounded price information', async () => {
  const res = await request('POST', '/api/ai/chat', {
    message: 'What is the price of The Grand Orchid Residences?',
    language: 'en'
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.message.content.includes('1.35') || res.body.message.content.includes('Orchid'));
});

// 10. AI Chatbot Human Handoff Trigger
test('POST /api/ai/chat - Triggers human handoff when buyer asks for human', async () => {
  const res = await request('POST', '/api/ai/chat', {
    message: 'I want to talk to a human sales executive right now',
    buyerName: 'Vikram Joshi',
    buyerPhone: '+91 98888 77777',
    language: 'en'
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.handoff !== null);
  assert.equal(res.body.handoff.status, 'Executive Assigned');
});

// 11. Visit Slot Booking & Concurrency Overbooking Prevention (409)
test('POST /api/slots/book - Books visit and prevents overbooking', async () => {
  // Create a limited capacity slot of 1
  const testSlot = await prisma.visitSlot.create({
    data: {
      projectId: 'proj-grand-orchid',
      date: '2026-12-31',
      startTime: '10:00 AM',
      endTime: '11:00 AM',
      capacity: 1,
      bookedCount: 0,
      isActive: true
    }
  });

  // First booking: should succeed
  const res1 = await request('POST', '/api/slots/book', {
    slotId: testSlot.id,
    buyerName: 'Buyer One',
    buyerPhone: '+91 98765 11111'
  });
  assert.equal(res1.status, 201);
  assert.equal(res1.body.success, true);
  assert.ok(res1.body.confirmationCode);

  // Second booking on full slot: should return 409 Conflict
  const res2 = await request('POST', '/api/slots/book', {
    slotId: testSlot.id,
    buyerName: 'Buyer Two',
    buyerPhone: '+91 98765 22222'
  });
  assert.equal(res2.status, 409);
  assert.equal(res2.body.success, false);
});

// 12. Call Session Creation & Token Verification
let callToken = '';
let callId = '';
test('POST /api/calls/create - Generates secure room and invitation token', async () => {
  const res = await request('POST', '/api/calls/create', {
    leadId: createdLeadId,
    callType: 'video',
    notes: 'Floor plan review'
  }, {
    'Authorization': `Bearer ${execToken}`
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.callSession.roomName);
  assert.ok(res.body.callSession.invitationToken);
  callToken = res.body.callSession.invitationToken;
  callId = res.body.callSession.id;
});

test('GET /api/calls/session/:token - Validates call token', async () => {
  const res = await request('GET', `/api/calls/session/${callToken}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.session.id, callId);
});

// 13. Analytics: Real database metrics
test('GET /api/analytics/dashboard - Returns real counts from DB', async () => {
  const res = await request('GET', '/api/analytics/dashboard', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.stats.totalLeads >= 1);
  assert.ok(res.body.stats.scheduledVisits >= 1);
});
