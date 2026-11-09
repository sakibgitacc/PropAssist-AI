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
let buyerToken = '';
let buyerUser = null;

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
  baseUrl = `http://localhost:${port}`;

  // Create a buyer user and token for testing
  const buyerRes = await request('POST', '/api/auth/register', {
    name: 'Integration Test Buyer',
    email: `int_buyer_${Date.now()}@example.com`,
    password: 'Password@123',
    phone: '+919988776655',
    role: 'BUYER'
  });

  buyerToken = buyerRes.body.token;
  buyerUser = buyerRes.body.user;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await prisma.$disconnect();
});

test('GET /api/integrations/status - Returns exactly the 7 supported integrations', async () => {
  const res = await request('GET', '/api/integrations/status');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.integrations));
  assert.equal(res.body.integrations.length, 7);

  const ids = res.body.integrations.map((i) => i.id);
  assert.deepEqual(ids.sort(), ['groq', 'jitsi', 'razorpay', 'socketio', 'supabase', 'webrtc', 'whatsapp'].sort());

  // Verify no Exotel or Twilio exists in the list
  const lowerNames = res.body.integrations.map((i) => i.name.toLowerCase());
  assert.ok(!lowerNames.some((n) => n.includes('exotel')));
  assert.ok(!lowerNames.some((n) => n.includes('twilio')));
});

test('GET /api/integrations/status - Never exposes raw secrets in keys', async () => {
  const res = await request('GET', '/api/integrations/status');
  const str = JSON.stringify(res.body);

  // Ensure plain secrets are never exposed
  assert.ok(!str.includes('prop_assist_jwt_super_secure'));
});

test('POST /api/integrations/test/supabase - Handshake ping succeeds and reports database statistics', async () => {
  const res = await request('POST', '/api/integrations/test/supabase');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.integration, 'Supabase');
  assert.ok(typeof res.body.totalUsersInDb === 'number');
  assert.ok(res.body.latencyMs >= 0);
});

test('POST /api/integrations/test/whatsapp - Validates dynamic phone formatter and prefilled templates', async () => {
  const res = await request('POST', '/api/integrations/test/whatsapp');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.integration, 'WhatsApp Click-to-Chat');
  assert.equal(res.body.sampleFormattedPhone, '919876543210');
  assert.ok(res.body.sampleLink.includes('https://wa.me/919876543210'));
  assert.ok(res.body.templatesSupported >= 3);
});

test('POST /api/integrations/test/jitsi - Confirms Jitsi Meet domain bridge', async () => {
  const res = await request('POST', '/api/integrations/test/jitsi');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.integration, 'Jitsi Meet');
  assert.ok(res.body.domain.length > 0);
});

test('POST /api/integrations/test/webrtc - Confirms public Google STUN server readiness', async () => {
  const res = await request('POST', '/api/integrations/test/webrtc');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.integration, 'WebRTC P2P Audio');
  assert.ok(res.body.stunServer.includes('stun.l.google.com'));
});

test('POST /api/integrations/test/socketio - Confirms Socket.IO real-time engine status', async () => {
  const res = await request('POST', '/api/integrations/test/socketio');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.integration, 'Socket.IO');
});

test('POST /api/integrations/test/groq - Confirms Groq status or local NLP fallback', async () => {
  const res = await request('POST', '/api/integrations/test/groq');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.integration, 'Groq Cloud AI');
  assert.ok(['CONNECTED', 'FALLBACK_LOCAL_NLP'].includes(res.body.status));
});

test('POST /api/integrations/test/razorpay - Confirms Razorpay test simulator or merchant gateway', async () => {
  const res = await request('POST', '/api/integrations/test/razorpay');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.integration, 'Razorpay');
  assert.ok(['CONFIGURED', 'TEST_SIMULATOR_ACTIVE'].includes(res.body.status));
});

test('GET /api/ai/active - Authenticated buyer retrieves their active dialogue history', async () => {
  // First send a chat message
  await request('POST', '/api/ai/chat', {
    message: 'What is the price of a 3 BHK at The Grand Orchid Residences?',
    buyerName: buyerUser.name,
    buyerPhone: buyerUser.phone
  }, { Authorization: `Bearer ${buyerToken}` });

  // Now retrieve active conversation
  const res = await request('GET', '/api/ai/active', null, {
    Authorization: `Bearer ${buyerToken}`
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.conversation !== null);
  assert.ok(Array.isArray(res.body.conversation.messages));
  assert.ok(res.body.conversation.messages.length >= 2);
});

