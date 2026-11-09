/**
 * Swagger / OpenAPI 3.0 Specification for PropAssist AI
 */
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'PropAssist AI Enterprise Backend API',
    version: '1.0.0',
    description: 'Comprehensive REST API documentation for PropAssist AI real estate automation platform in Ahmedabad, Gujarat. Supports Super Admin, Sales Head, Sales Executive, and Buyer roles.',
    contact: {
      name: 'PropAssist AI Engineering Team',
      email: 'tech@propassist.local'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide authenticated JWT access token obtained from /api/auth/login'
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ],
  tags: [
    { name: 'Health & System', description: 'Platform health and database connectivity' },
    { name: 'Authentication', description: 'User login, token refresh, and identity' },
    { name: 'Leads & CRM', description: 'Lead capture, duplicate detection, and assignment' },
    { name: 'Site Visits', description: 'Calendar slots, booking, rescheduling' },
    { name: 'AI Property Consultant', description: 'Groq AI multilingual chat and lead scoring' },
    { name: 'Video & Collaboration', description: 'Jitsi Meet video consultations and Socket.IO in-app chat' },
    { name: 'Payments & Razorpay', description: 'Order creation, HMAC verification, and PDF receipts' },
    { name: 'Property Bookings & Allotment', description: 'Apartment reservation, approval, and allotment letters' },
    { name: 'WhatsApp & SMS', description: 'WhatsApp Click-to-Chat dynamic link generation, prefilled templates, and transactional delivery' },
    { name: 'Analytics & Dashboards', description: 'Real database metrics and executive velocity' }
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health & System'],
        summary: 'Database and Integration Health Check',
        responses: {
          200: {
            description: 'Backend and database operational'
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate user with email and password',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'user@example.com' },
                  password: { type: 'string', example: 'YourSecurePassword#123' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          200: { description: 'Authenticated successfully with JWT token and role routing' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/api/leads': {
      get: {
        tags: ['Leads & CRM'],
        summary: 'List leads (Role-isolated: Execs see assigned, Buyers see own)',
        responses: {
          200: { description: 'List of authorized leads' }
        }
      },
      post: {
        tags: ['Leads & CRM'],
        summary: 'Capture new lead with duplicate detection',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fullName: { type: 'string', example: 'Hardik Patel' },
                  phone: { type: 'string', example: '+91 98765 43210' },
                  email: { type: 'string', example: 'hardik.patel@example.com' },
                  projectId: { type: 'string' },
                  configuration: { type: 'string', example: '3 BHK' }
                },
                required: ['fullName', 'phone']
              }
            }
          }
        },
        responses: {
          201: { description: 'Lead captured or deduplicated' }
        }
      }
    },
    '/api/payments/order': {
      post: {
        tags: ['Payments & Razorpay'],
        summary: 'Create Razorpay order or verified simulation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  amount: { type: 'number', example: 50000 },
                  purpose: { type: 'string', example: 'Apartment Token Booking' }
                },
                required: ['amount']
              }
            }
          }
        },
        responses: {
          201: { description: 'Order generated' }
        }
      }
    },
    '/api/payments/verify': {
      post: {
        tags: ['Payments & Razorpay'],
        summary: 'Verify Razorpay HMAC-SHA256 signature',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  orderId: { type: 'string' },
                  razorpayPaymentId: { type: 'string' },
                  razorpaySignature: { type: 'string' }
                },
                required: ['orderId', 'razorpayPaymentId', 'razorpaySignature']
              }
            }
          }
        },
        responses: {
          200: { description: 'Payment signature verified' },
          400: { description: 'Signature mismatch' }
        }
      }
    },
    '/api/payments/{id}/receipt': {
      get: {
        tags: ['Payments & Razorpay'],
        summary: 'Download genuine PDF payment receipt (Ownership checked)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Binary PDF receipt stream' },
          403: { description: 'Forbidden: Access to another buyer receipt denied' }
        }
      }
    },
    '/api/property-bookings': {
      get: {
        tags: ['Property Bookings & Allotment'],
        summary: 'List bookings (Buyer sees own, Staff sees org)',
        responses: {
          200: { description: 'Authorized bookings' }
        }
      },
      post: {
        tags: ['Property Bookings & Allotment'],
        summary: 'Reserve apartment unit with double-booking prevention',
        responses: {
          201: { description: 'Unit reserved' },
          400: { description: 'Unit already reserved' }
        }
      }
    },
    '/api/property-bookings/{id}/allotment-letter': {
      get: {
        tags: ['Property Bookings & Allotment'],
        summary: 'Download verified PDF Allotment Letter (Strict ownership checked)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Binary PDF Allotment Letter stream' },
          403: { description: 'Forbidden: Cross-buyer access denied' }
        }
      }
    },
    '/api/calls/create': {
      post: {
        tags: ['Video & Collaboration'],
        summary: 'Authorized Sales Executive creates Jitsi video consultation session',
        responses: {
          201: { description: 'Video session created with secure token' },
          403: { description: 'Executive not assigned to this lead' }
        }
      }
    }
  }
};

module.exports = swaggerDocument;
