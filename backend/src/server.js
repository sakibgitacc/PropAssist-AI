const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger');
const prisma = require('./db/prisma');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const leadRoutes = require('./routes/lead.routes');
const slotRoutes = require('./routes/slot.routes');
const aiRoutes = require('./routes/ai.routes');
const callRoutes = require('./routes/call.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const reminderRoutes = require('./routes/reminder.routes');
const followUpRoutes = require('./routes/followUp.routes');
const paymentRoutes = require('./routes/payment.routes');
const propertyBookingRoutes = require('./routes/propertyBooking.routes');
const organizationRoutes = require('./routes/organization.routes');
const communicationRoutes = require('./routes/communication.routes');
const auditRoutes = require('./routes/audit.routes');
const chatRoutes = require('./routes/chat.routes');
const integrationRoutes = require('./routes/integration.routes');
const http = require('http');
const { initSocket } = require('./services/socket.service');

const app = express();
const server = http.createServer(app);
initSocket(server);
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server (port 5173), port 4200, and production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger OpenAPI Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Comprehensive Health check endpoint
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let latency = 0;
  let userCount = 0;

  try {
    userCount = await prisma.user.count();
    latency = Date.now() - startTime;
  } catch (err) {
    dbStatus = `unreachable: ${err.message}`;
  }

  res.json({
    status: dbStatus === 'healthy' ? 'ok' : 'degraded',
    service: 'PropAssist AI Backend',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      status: dbStatus,
      latency: `${latency}ms`,
      totalUsers: userCount,
      provider: process.env.DATABASE_URL?.includes('supabase') ? 'Supabase PostgreSQL' : 'Local SQLite/Prisma'
    },
    integrations: {
      supabase: process.env.DATABASE_URL?.includes('supabase') ? 'CONFIGURED' : 'READY_TO_CONNECT',
      groqAI: !!process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your_groq') ? 'CONFIGURED' : 'LOCAL_NLP_FALLBACK',
      razorpay: !!process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('your_razorpay') ? 'CONFIGURED' : 'TEST_SIMULATOR',
      jitsiVideoCalling: 'ACTIVE (Free Hosted Jitsi Meet)',
      webRTCAudioCalling: 'ACTIVE (In-App P2P Voice via Socket.IO)',
      socketIOChat: 'ACTIVE (Real-Time In-App Messaging)',
      whatsApp: 'CLICK_TO_CHAT_ENABLED (Official wa.me - Zero API Keys Required)'
    },
    backgroundWorkers: {
      siteVisitReminders: 'ACTIVE (60s loop)',
      idempotencyGuard: 'ACTIVE'
    }
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/slots', slotRoutes);
// Direct bookings aliases for site visit reservations
const { bookVisitHandler, getBookingsHandler, bookVisitSchema } = require('./routes/slot.routes');
const { validateBody } = require('./middleware/validate');
const { authenticateToken } = require('./middleware/auth');
app.post('/api/bookings', validateBody(bookVisitSchema), bookVisitHandler);
app.get('/api/bookings', authenticateToken, getBookingsHandler);
app.use('/api/ai', aiRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/follow-ups', followUpRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/property-bookings', propertyBookingRoutes);
app.use('/api', communicationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/integrations', integrationRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 PropAssist AI Backend running on port ${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📖 Swagger API Docs: http://localhost:${PORT}/api/docs`);
    console.log(`💬 Socket.IO & Real-time Chat: ACTIVE`);
    console.log(`=========================================`);
  });
}

app.server = server;
app.initSocket = initSocket;

module.exports = app;
