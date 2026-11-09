# PropAssist AI - Technical Architecture & Engineering Documentation

## 1. System Architecture Overview

```
                      +---------------------------------------+
                      |       PropAssist AI Frontend          |
                      |  (React 18, Vite, Tailwind, Recharts)  |
                      |    Linear/Stripe Deep Navy Theme      |
                      +-------------------+-------------------+
                                          |
                                HTTP / REST APIs
                               (Bearer JWT Auth)
                                          v
                      +-------------------+-------------------+
                      |        Express.js Backend             |
                      |   (Node.js v22, Zod, Controllers)     |
                      +---+-----------+-----------+-------+---+
                          |           |           |       |
            +-------------+     +-----+           |       +-------------+
            |                   |                 |                     |
            v                   v                 v                     v
   +-----------------+  +---------------+  +--------------+   +-------------------+
   |   Prisma ORM    |  |  Groq AI SDK  |  |  Jitsi Meet  |   | Automated Reminders|
   | (SQLite/Postgres|  |  (Llama 3.3)  |  | External API |   |  (24h & 2h Queue  |
   | 14 Data Models) |  | + Fact Sheet  |  | In-App Calls |   |    Simulation)    |
   +-----------------+  +---------------+  +--------------+   +-------------------+
```

---

## 2. Directory Structure

```
propassist-ai/
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios API client & endpoints
│   │   ├── context/        # AuthContext (JWT, session, roles)
│   │   ├── components/     # Reusable layout & UI components
│   │   │   ├── layout/     # Deep navy Sidebar, Navbar, MainLayout
│   │   │   └── ui/         # Badge, status pills
│   │   ├── pages/          # All 14 application pages
│   │   │   ├── Login.jsx
│   │   │   ├── ExecutiveDashboard.jsx
│   │   │   ├── LeadManagement.jsx
│   │   │   ├── LeadDetails.jsx
│   │   │   ├── AiChatbotPage.jsx
│   │   │   ├── ProjectListing.jsx
│   │   │   ├── ProjectDetails.jsx
│   │   │   ├── SiteVisitBooking.jsx
│   │   │   ├── SalesExecutiveWorkspace.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   ├── FactSheetEditor.jsx
│   │   │   ├── VisitSlotManagement.jsx
│   │   │   ├── JitsiCallPage.jsx
│   │   │   └── AdminPanel.jsx
│   │   ├── App.jsx         # Router & protected route guards
│   │   ├── main.jsx        # React root
│   │   └── index.css       # Tailwind directives & typography
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── db/             # Prisma client & idempotent seed.js
│   │   ├── middleware/     # JWT authentication & Zod request validation
│   │   ├── routes/         # Modular REST endpoints
│   │   │   ├── auth.routes.js
│   │   │   ├── project.routes.js
│   │   │   ├── lead.routes.js
│   │   │   ├── slot.routes.js
│   │   │   ├── ai.routes.js
│   │   │   ├── call.routes.js
│   │   │   ├── analytics.routes.js
│   │   │   └── reminder.routes.js
│   │   ├── services/       # Multilingual AI fact-sheet grounded service
│   │   └── server.js       # Express server initialization
│   ├── prisma/             # schema.prisma (14 models)
│   ├── tests/              # 15/15 automated API integration test suite
│   ├── .env.example
│   └── package.json
│
├── database/
│   ├── schema.postgresql.prisma # Supabase PostgreSQL Prisma schema
│   ├── migrations/              # Raw PostgreSQL DDL migration scripts
│   │   └── 01_initial_schema.sql
│   └── README.md
│
├── docs/                   # Architecture, API specs, run manuals
├── PROJECT_PROGRESS.md     # 6-Stage verification progress log
├── README.md               # Quickstart and setup guide
└── .gitignore
```

---

## 3. Database Schema Design (14 Relational Models)

1. `User`: Enterprise roles (`ADMIN`, `SALES_HEAD`, `SALES_EXECUTIVE`, `BUYER`). Hashed passwords via bcrypt.
2. `Project`: Residential master development record with pricing, area, coordinates, amenities, and demo RERA tags.
3. `ProjectImage`: High-resolution gallery images categorized into exterior, interior, amenities, and floor plans.
4. `FactSheet`: Single source of truth for technical specifications, approved pricing, and AI knowledge base.
5. `Lead`: Buyer pipeline tracking across 8 standardized stages (`New`, `Contacted`, `Qualified`, `Visit Scheduled`, `Visited`, `Negotiation`, `Converted`, `Lost`).
6. `Conversation`: Multilingual chat thread associated with buyer leads and channel attribution.
7. `Message`: Full message history with sender type (`buyer`, `ai`, `executive`, `system`) and structured tool calls.
8. `VisitSlot`: Calendar tour slots with capacity limits and assigned host relations.
9. `Booking`: Atomic transactional site visit reservation with unique alphanumeric confirmation codes.
10. `LeadAssignment`: Audit log tracking lead transfers and reassignments.
11. `InternalNote`: Sales team collaboration notes attached to leads.
12. `Reminder`: 24-hour and 2-hour automated notifications queue with simulated status tracking.
13. `Consent`: Digital consent logs with IP and user-agent capture for telecommunication compliance.
14. `CallSession`: High-entropy meeting tokens and rooms for in-app Jitsi conferencing with duration tracking.

---

## 4. Concurrency & Overbooking Prevention

Site visit booking uses Prisma interactive transactions (`prisma.$transaction(async (tx) => { ... })`).
- The slot capacity and current `bookedCount` are evaluated atomically inside the database transaction.
- If `bookedCount >= capacity`, the transaction is rolled back immediately and returns HTTP `409 Conflict`.
- No booking is confirmed until the database write succeeds.

---

## 5. Embedded Video Conferencing Architecture

Jitsi Meet External API (`https://meet.jit.si/external_api.js`) is embedded directly in `frontend/src/pages/JitsiCallPage.jsx` within the application DOM:
- **No redirects to meet.jit.si.**
- **No external Jitsi desktop or mobile app required.**
- Meeting rooms are named with 24-character cryptographic randomness (`propassist_<project>_<hex>`).
- Invitation tokens (`inv_<hex>`) carry 24-hour expiration dates validated by backend `/api/calls/session/:token`.
