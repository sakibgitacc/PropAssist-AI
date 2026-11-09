process.env.NODE_ENV = 'test';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/server');
const prisma = require('../src/db/prisma');
const http = require('http');
const whatsappService = require('../src/services/whatsapp.service');

let server;
let baseUrl;
let adminToken = '';
let execToken = '';
let otherExecToken = '';
let buyerToken = '';
let otherBuyerToken = '';

let testLeadId = '';
let testExecId = '';
let otherExecId = '';
let testBuyerId = '';

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
      res.on('data', (chunk) => (data += chunk));
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
  baseUrl = `http://127.0.0.1:${port}`;

  const timestamp = Date.now();

  // Create Users
  const adminRes = await request('POST', '/api/auth/register', {
    name: 'WA Test Admin',
    email: `wa.admin.${timestamp}@propassist.org`,
    password: 'Password@123!',
    phone: '9876543210'
  });
  // Promote to ADMIN
  const adminUser = await prisma.user.findUnique({ where: { email: `wa.admin.${timestamp}@propassist.org` } });
  await prisma.user.update({ where: { id: adminUser.id }, data: { role: 'ADMIN' } });
  const adminLogin = await request('POST', '/api/auth/login', {
    email: `wa.admin.${timestamp}@propassist.org`,
    password: 'Password@123!'
  });
  adminToken = adminLogin.body.token;

  // Create Sales Executive A
  const execUser = await prisma.user.create({
    data: {
      name: 'Executive Alpha',
      email: `exec.alpha.${timestamp}@propassist.org`,
      role: 'SALES_EXECUTIVE',
      phone: '+919876543211'
    }
  });
  testExecId = execUser.id;
  const execLogin = await request('POST', '/api/auth/login', {
    email: execUser.email,
    password: 'Password@123!' // user created directly without password will use jwt sign directly:
  });
  // generate token via jwt
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'propassist_jwt_super_secure_secret_token_2026_xyz';
  execToken = jwt.sign({ userId: execUser.id, id: execUser.id, email: execUser.email, role: execUser.role, name: execUser.name, phone: execUser.phone }, secret);

  // Create Sales Executive B
  const otherExecUser = await prisma.user.create({
    data: {
      name: 'Executive Beta',
      email: `exec.beta.${timestamp}@propassist.org`,
      role: 'SALES_EXECUTIVE',
      phone: '+919876543212'
    }
  });
  otherExecId = otherExecUser.id;
  otherExecToken = jwt.sign({ userId: otherExecUser.id, id: otherExecUser.id, email: otherExecUser.email, role: otherExecUser.role, name: otherExecUser.name, phone: otherExecUser.phone }, secret);

  // Create Buyer A
  const buyerUser = await prisma.user.create({
    data: {
      name: 'Buyer Alpha',
      email: `buyer.alpha.${timestamp}@test.com`,
      role: 'BUYER',
      phone: '9876543213'
    }
  });
  testBuyerId = buyerUser.id;
  buyerToken = jwt.sign({ userId: buyerUser.id, id: buyerUser.id, email: buyerUser.email, role: buyerUser.role, name: buyerUser.name, phone: buyerUser.phone }, secret);

  // Create Buyer B
  const otherBuyerUser = await prisma.user.create({
    data: {
      name: 'Buyer Beta',
      email: `buyer.beta.${timestamp}@test.com`,
      role: 'BUYER',
      phone: '9876543214'
    }
  });
  otherBuyerToken = jwt.sign({ userId: otherBuyerUser.id, id: otherBuyerUser.id, email: otherBuyerUser.email, role: otherBuyerUser.role, name: otherBuyerUser.name, phone: otherBuyerUser.phone }, secret);

  // Create a Project
  const project = await prisma.project.create({
    data: {
      name: 'Shivalik Skyview',
      description: 'Luxury 3 BHK & 4 BHK in Bodakdev',
      location: 'Bodakdev, SG Highway',
      city: 'Ahmedabad',
      latitude: 23.03,
      longitude: 72.51,
      bhkOptions: '3, 4 BHK',
      minPrice: 15000000,
      maxPrice: 28000000,
      minArea: 1950,
      maxArea: 3200,
      possession: 'Dec 2026',
      reraNumber: 'PR/GJ/AHMEDABAD/12345/DEMO',
      amenities: 'Clubhouse, Swimming Pool, Gym'
    }
  });

  // Create a Lead assigned to Executive Alpha and linked to Buyer Alpha
  const lead = await prisma.lead.create({
    data: {
      fullName: 'Buyer Alpha',
      email: buyerUser.email,
      phone: '9876543213',
      projectId: project.id,
      assignedExecutiveId: testExecId,
      status: 'Qualified',
      source: 'Website'
    }
  });
  testLeadId = lead.id;
});

test.after(async () => {
  if (server) server.close();
});

// ==========================================
// 1. WHATSAPP CLICK-TO-CHAT TESTS (NO API)
// ==========================================

test('WhatsApp Unit: validateAndFormatPhoneNumber formats Indian mobile numbers to 91XXXXXXXXXX', () => {
  // 10 digits
  const res1 = whatsappService.validateAndFormatPhoneNumber('9876543210');
  assert.equal(res1.isValid, true);
  assert.equal(res1.formattedNumber, '919876543210');

  // Formatted with spaces and dashes
  const res2 = whatsappService.validateAndFormatPhoneNumber('+91 98765-43210');
  assert.equal(res2.isValid, true);
  assert.equal(res2.formattedNumber, '919876543210');

  // 11 digits starting with 0
  const res3 = whatsappService.validateAndFormatPhoneNumber('09876543210');
  assert.equal(res3.isValid, true);
  assert.equal(res3.formattedNumber, '919876543210');

  // Short/Invalid number
  const res4 = whatsappService.validateAndFormatPhoneNumber('12345');
  assert.equal(res4.isValid, false);
});

test('WhatsApp Unit: generateWhatsAppLink generates valid wa.me link with URL encoded prefilled text', () => {
  const result = whatsappService.generateWhatsAppLink({
    phone: '9876543210',
    templateKey: 'buyer_enquiry',
    language: 'en'
  });

  assert.equal(result.success, true);
  assert.ok(result.url.startsWith('https://wa.me/919876543210?text='));
  assert.ok(result.url.includes(encodeURIComponent('Hello, I am interested in your 2 BHK / 3 BHK property')));
});

test('WhatsApp Unit: Supports English, Hindi, and Gujarati prefilled messages', () => {
  const enRes = whatsappService.generateWhatsAppLink({ phone: '9876543210', templateKey: 'site_visit', language: 'en' });
  const hiRes = whatsappService.generateWhatsAppLink({ phone: '9876543210', templateKey: 'site_visit', language: 'hi' });
  const guRes = whatsappService.generateWhatsAppLink({ phone: '9876543210', templateKey: 'site_visit', language: 'gu' });

  assert.ok(enRes.message.includes('site visit has been scheduled'));
  assert.ok(hiRes.message.includes('साइट विज़िट निर्धारित'));
  assert.ok(guRes.message.includes('સાઇટ મુલાકાત શેડ્યૂલ'));
});

test('GET /api/whatsapp/templates - Returns multilingual templates (en, hi, gu)', async () => {
  const res = await request('GET', '/api/whatsapp/templates');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.languages.length, 3);
  assert.ok(res.body.templates.some((t) => t.key === 'buyer_enquiry'));
  assert.ok(res.body.templates.some((t) => t.key === 'site_visit'));
  assert.ok(res.body.templates.some((t) => t.key === 'executive_followup'));
});

test('POST /api/whatsapp/link - Executive Alpha generates WhatsApp link for assigned lead & records WHATSAPP_LINK_OPENED in DB', async () => {
  const res = await request(
    'POST',
    '/api/whatsapp/link',
    {
      leadId: testLeadId,
      templateKey: 'executive_followup',
      language: 'en'
    },
    { Authorization: `Bearer ${execToken}` }
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.status, 'WHATSAPP_LINK_OPENED');
  assert.ok(res.body.data.url.startsWith('https://wa.me/919876543213?text='));

  // Verify stored in CommunicationLog
  const log = await prisma.communicationLog.findUnique({
    where: { id: res.body.data.communicationId }
  });
  assert.ok(log);
  assert.equal(log.status, 'WHATSAPP_LINK_OPENED');
  assert.equal(log.channel, 'WhatsApp (Click-to-Chat)');
});

test('POST /api/whatsapp/link - Executive Beta FORBIDDEN (403) from generating link for Executive Alpha lead', async () => {
  const res = await request(
    'POST',
    '/api/whatsapp/link',
    {
      leadId: testLeadId,
      templateKey: 'executive_followup'
    },
    { Authorization: `Bearer ${otherExecToken}` }
  );

  assert.equal(res.status, 403);
  assert.equal(res.body.success, false);
});

test('POST /api/whatsapp/link - Buyer Alpha can open WhatsApp chat with their assigned executive', async () => {
  const res = await request(
    'POST',
    '/api/whatsapp/link',
    {
      leadId: testLeadId,
      templateKey: 'buyer_enquiry',
      language: 'gu'
    },
    { Authorization: `Bearer ${buyerToken}` }
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.status, 'WHATSAPP_LINK_OPENED');
  assert.ok(res.body.data.url.includes('wa.me'));
});

// ==========================================
// 2. VIDEO CALLING (JITSI MEET) TESTS
// ==========================================

let requestedCallId = '';
let requestedCallToken = '';

test('POST /api/calls/request - Buyer requests a video consultation (Status: REQUESTED)', async () => {
  const res = await request(
    'POST',
    '/api/calls/request',
    {
      leadId: testLeadId,
      callType: 'video',
      notes: 'Need virtual 3D tour walkthrough'
    },
    { Authorization: `Bearer ${buyerToken}` }
  );

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.callSession.status, 'REQUESTED');
  assert.ok(res.body.callSession.invitationToken);
  requestedCallId = res.body.callSession.id;
  requestedCallToken = res.body.callSession.invitationToken;
});

test('POST /api/calls/:id/accept - Executive Alpha accepts and schedules consultation (Status: SCHEDULED)', async () => {
  const res = await request(
    'POST',
    `/api/calls/${requestedCallId}/accept`,
    {
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      notes: 'Confirmed for 4 PM'
    },
    { Authorization: `Bearer ${execToken}` }
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.session.status, 'SCHEDULED');
});

test('GET /api/calls/session/:token - Authorized Buyer and Executive can access session', async () => {
  // Buyer A
  const resBuyer = await request('GET', `/api/calls/session/${requestedCallToken}`, null, {
    Authorization: `Bearer ${buyerToken}`
  });
  assert.equal(resBuyer.status, 200);
  assert.equal(resBuyer.body.session.participantRole, 'buyer');

  // Executive Alpha
  const resExec = await request('GET', `/api/calls/session/${requestedCallToken}`, null, {
    Authorization: `Bearer ${execToken}`
  });
  assert.equal(resExec.status, 200);
  assert.equal(resExec.body.session.participantRole, 'executive');
});

test('GET /api/calls/session/:token - Unauthorized Buyer Beta FORBIDDEN (403)', async () => {
  const res = await request('GET', `/api/calls/session/${requestedCallToken}`, null, {
    Authorization: `Bearer ${otherBuyerToken}`
  });
  assert.equal(res.status, 403);
});

// ==========================================
// 3. IN-APP REAL-TIME CHAT TESTS
// ==========================================

let activeConversationId = '';

test('POST /api/chat/conversations/initiate - Initiates or fetches in-app conversation for assigned lead', async () => {
  const res = await request(
    'POST',
    '/api/chat/conversations/initiate',
    { leadId: testLeadId },
    { Authorization: `Bearer ${buyerToken}` }
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.conversation.id);
  activeConversationId = res.body.conversation.id;
});

test('POST /api/chat/conversations/:id/messages - Buyer sends in-app message', async () => {
  const res = await request(
    'POST',
    `/api/chat/conversations/${activeConversationId}/messages`,
    {
      content: 'Hello Executive Alpha, can you share the payment schedule?'
    },
    { Authorization: `Bearer ${buyerToken}` }
  );

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.message.senderType, 'buyer');
  assert.equal(res.body.message.isRead, false);
});

test('GET /api/chat/conversations - Executive Alpha sees 1 unread message in conversations list', async () => {
  const res = await request('GET', '/api/chat/conversations', null, {
    Authorization: `Bearer ${execToken}`
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  const conv = res.body.conversations.find((c) => c.id === activeConversationId);
  assert.ok(conv);
  assert.equal(conv.unreadCount, 1);
});

test('POST /api/chat/conversations/:id/read - Executive Alpha marks conversation messages as read', async () => {
  const res = await request(
    'POST',
    `/api/chat/conversations/${activeConversationId}/read`,
    {},
    { Authorization: `Bearer ${execToken}` }
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.updatedCount, 1);
});

test('GET /api/chat/conversations/:id/messages - Unauthorized Buyer Beta FORBIDDEN (403)', async () => {
  const res = await request(
    'GET',
    `/api/chat/conversations/${activeConversationId}/messages`,
    null,
    { Authorization: `Bearer ${otherBuyerToken}` }
  );

  assert.equal(res.status, 403);
});
