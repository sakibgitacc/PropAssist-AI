# PropAssist AI — Enterprise Real Estate Automation Platform

> **AI-Powered Residential Lead Engagement, Qualification, Telephony & Settlement Operating System**  
> Tailored for Residential Property Developers in Ahmedabad, Gujarat (2 Live Projects, 420 Luxury Apartments, 2 & 3 BHK Configurations, ₹65 Lakh – ₹1.2 Crore).

---

## 1. Project Overview

**PropAssist AI** is an enterprise-grade AI real estate automation platform designed to solve the critical lead response and sales conversion challenge for large-scale residential developments. Residential developers in high-growth markets like Ahmedabad receive over 3,000 inquiries monthly from diverse acquisition channels (property portals, social ads, hoarding calls, website forms). Without sub-second automated engagement, over 70% of high-intent buyers go cold.

PropAssist AI provides an autonomous, multilingual conversational AI pipeline integrated with strict Role-Based Access Control (RBAC), atomic site-visit scheduling, outbound click-to-call telephony, Razorpay payment verification, instant PDF receipt and allotment issuance, and automated background reminder workers.

---

## 2. Completed Backend Features

| Business Module | Functional Implementation Status | Integration Mode |
| :--- | :--- | :--- |
| **Authentication & RBAC** | JWT verification, bcrypt password hashing, session validation, 4 strict roles. | **Fully Functional & Active** |
| **Lead Capture & Deduplication** | 10-digit normalized phone & email deduplication, activity timeline, assignment history. | **Fully Functional & Active** |
| **Role-Based Lead Assignment** | 1-Click round-robin & manual allocation to executives; immediate access revocation upon reassignment. | **Fully Functional & Active** |
| **Multilingual AI Consultant** | Groq LLaMA 3.3 70B integration with project fact sheets (English, Hindi, Gujarati). | **Active (Groq API + Safe Offline Fallback)** |
| **Site Visit Management** | Atomic double-booking prevention using transactional DB locks, capacity controls, rescheduling. | **Fully Functional & Active** |
| **Razorpay Payments** | Order creation, HMAC-SHA256 signature verification, webhook handler, idempotency locks. | **Active (Razorpay SDK + Safe Verified Simulator)** |
| **Verified PDF Receipts** | Binary PDF generation (`pdfkit`) with developer seal, transaction hash, and ownership validation. | **Fully Functional & Active** |
| **Property Booking & Allotment** | Unit status locking (`Available` → `Booked` → `Allotted`), management approvals, PDF Allotment Letters. | **Fully Functional & Active** |
| **WhatsApp Click-to-Chat** | Official `https://wa.me/` deep links, dynamic Indian phone validation, EN/HI/GU templates, activity logging. | **Fully Functional & Active (Zero API Keys)** |
| **Video Calling (Jitsi Meet)** | Free hosted Jitsi IFrame API, buyer consultation requests, executive scheduling, camera/mic controls. | **Fully Functional & Active** |
| **WebRTC Audio Calling** | In-app browser-to-browser P2P audio calling via Socket.IO signaling, public Google STUN, zero telecom fees. | **Fully Functional & Active** |
| **In-App Real-Time Chat** | Socket.IO messaging with DB persistence, typing indicators, read receipts, unread badges, RBAC isolation. | **Fully Functional & Active** |
| **Background Reminder Worker** | 24-hour and 2-hour automated site visit alerts, cron runner, retry handling. | **Fully Functional & Active** |
| **API Configuration Dashboard** | Super Admin live status cards for all 7 integrations with masked keys and live connection tests. | **Fully Functional & Active** |
| **Swagger/OpenAPI Docs** | Interactive API exploration documentation hosted at `/api/docs`. | **Fully Functional & Active** |
| **System Health Check** | DB latency measurement, user record audits, integration status inspection at `/api/health`. | **Fully Functional & Active** |

---

## Active Integrations Checklist

The platform uses only verified, direct, and zero-cost communication integrations. All paid telephony providers and paid WhatsApp Cloud APIs have been removed completely.

| Integration | Capability | Status | Required Credentials / URL |
| :--- | :--- | :--- | :--- |
| **1. Supabase** | PostgreSQL database with connection pooling, Auth, RLS & Storage | Active | `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` ([Portal](https://supabase.com/dashboard)) |
| **2. Groq** | LLaMA 3.3 70B multilingual property consultant (EN, HI, GU) | Active | `GROQ_API_KEY`, `GROQ_MODEL` ([Portal](https://console.groq.com/keys)) |
| **3. Razorpay** | Token advance booking payments & HMAC-SHA256 signature verification | Active | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` ([Portal](https://dashboard.razorpay.com)) |
| **4. Jitsi** | Free hosted (`meet.jit.si`) / self-hosted video consultations | Active | Zero keys required (`JITSI_DOMAIN=meet.jit.si`) |
| **5. WebRTC** | App-to-app P2P browser voice calling via Socket.IO signaling | Active | Zero keys required (Public Google STUN built-in) |
| **6. Socket.IO** | Real-time in-app chat, typing indicators, unread counters & signaling | Active | Zero external accounts (Built into HTTP server) |
| **7. WhatsApp Click-to-Chat** | Official `https://wa.me/` direct messaging with prefilled templates | Active | Zero keys, tokens, or Meta Developer accounts required |

---

## 3. System Architecture

```mermaid
flowchart TD
    subgraph Clients["Presentation Layer"]
        BuyerClient["Buyer Portal (Web / Mobile)"]
        ExecClient["Sales Executive CRM"]
        HeadClient["Sales Head Dashboard"]
        AdminClient["Super Admin Suite"]
    end

    subgraph Gateway["API & Security Boundary"]
        ReverseProxy["Express.js REST Engine :5000"]
        JWTAuth["JWT Guard & Strict RBAC Middleware"]
        DataIsolation["Ownership & Tenant Isolation Layer"]
    end

    subgraph CoreServices["Backend Micro-Services"]
        LeadService["Lead Capture & Deduplication"]
        SlotService["Atomic Slot Concurrency Engine"]
        AIService["Multilingual AI Consultant Engine"]
        PaymentService["Razorpay Payment & Webhook Service"]
        BookingService["Unit Reservation & Allotment Engine"]
        PDFService["PDFKit Document Generation Service"]
    end

    subgraph ExternalAdapters["Third-Party Gateways & Collaboration (7 Core Integrations)"]
        Groq["Groq Cloud LLM (LLaMA 3.3 70B)"]
        Razorpay["Razorpay Payments Gateway"]
        WhatsApp["WhatsApp Click-to-Chat (wa.me)"]
        Jitsi["Jitsi Meet (Free Hosted / Self-Hosted)"]
        WebRTC["WebRTC In-App P2P Audio Calling"]
        SocketIO["Socket.IO Real-Time Chat & Signaling Engine"]
        SupabaseIntegration["Supabase Auth & Storage Engine"]
    end

    subgraph StorageLayer["Data & Persistence"]
        DB[(Supabase PostgreSQL / SQLite Dev DB)]
        BackgroundWorker["Background Notification Worker (60s loop)"]
    end

    BuyerClient --> ReverseProxy
    ExecClient --> ReverseProxy
    HeadClient --> ReverseProxy
    AdminClient --> ReverseProxy

    ReverseProxy --> JWTAuth
    JWTAuth --> DataIsolation
    DataIsolation --> CoreServices

    AIService <--> Groq
    PaymentService <--> Razorpay
    LeadService --> WhatsApp
    LeadService --> Jitsi
    LeadService --> SocketIO
    LeadService --> MSG91
    BookingService --> PDFService
    PaymentService --> PDFService

    CoreServices <--> DB
    BackgroundWorker <--> DB
    BackgroundWorker --> WhatsApp
    BackgroundWorker --> MSG91
```

---

## 4. Prerequisites

Before installing the project, verify that your development machine has:
- **Node.js**: v18.0.0 or higher (`node -v` recommended: `v20.x` or `v22.x`)
- **npm**: v9.0.0 or higher (`npm -v`)
- **Git**: Installed and available in PATH
- **Supabase Account** (for cloud database deployment) or built-in zero-config SQLite for local offline development.

---

## 5. Clone and Installation

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd "PropAssist AI"
```

### Step 2: Install Dependencies
Install dependencies for both root, backend, and frontend:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root directory
cd ..
```

---

## 6. Supabase Setup (Step-by-Step)

PropAssist AI provides full native support for **Supabase PostgreSQL** in production.

### Step 1: Create Supabase Project
1. Navigate to [https://supabase.com/](https://supabase.com/) and sign in.
2. Click **New Project**.
3. Set **Project Name**: `PropAssist AI`.
4. Create a strong database password (e.g. `P@ssw0rdPropAssist2026!`). Note this password down securely.
5. Choose Region: `ap-south-1 (Mumbai)` for optimal latency across Gujarat/India.
6. Click **Create new project** and wait ~2 minutes for database provisioning.

### Step 2: Retrieve Database Connection Credentials
1. In the Supabase Dashboard, go to **Project Settings** (gear icon) → **Database**.
2. Scroll to the **Connection string** section:
   - Select **URI**.
   - Select mode: **Transaction (Connection Pooling)** on port `6543`.
   - Copy the URI string:
     ```
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   - For direct migration access (port `5432`), select **Session**:
     ```
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
     ```
3. Under **API Settings**, locate:
   - **Project URL**: `https://[YOUR-PROJECT-REF].supabase.co`
   - **anon / public key**: Safe for browser clients.
   - **service_role secret key**: Privileged server key. **Never expose this to frontend code.**

### Step 3: Configure Environment
Copy `backend/.env.example` to `backend/.env` and update the connection string:
```bash
cp backend/.env.example backend/.env
```
In `backend/.env`:
```env
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
```
*(Note: For immediate zero-config local evaluation, the default `DATABASE_URL="file:./dev.db"` runs out of the box with zero external dependencies).*

### Step 4: Verify Database Connectivity
Run the built-in latency and schema verification command:
```bash
npm run db:check
```
*Expected Output:*
```
==============================================
🔍 PropAssist AI Database Connectivity Check
==============================================
✅ Database connection established in 12ms
📊 Current Database Records:
   - Users:              11
   - Projects:           2
   - Units/Inventory:    2
   - Leads:              20
   - Property Bookings:  2
   - Payments:           3
🎉 Database is healthy, schema verified, and fully operational!
==============================================
```

### Step 5: Run Migrations and Seed
```bash
# Push schema definitions to database
npm run db:migrate

# Seed idempotent demo users, leads, and inventory
npm run db:seed
```

---

## 7. Environment Variables Reference

| Variable Name | Required | Default / Example Value | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | `development` | Runtime environment (`development`, `production`, `test`). |
| `PORT` | Yes | `5000` | Backend Express HTTP port. |
| `DATABASE_URL` | Yes | `file:./dev.db` | Prisma datasource URL (SQLite local or Supabase PostgreSQL pooler). |
| `DIRECT_URL` | Optional | `postgresql://...:5432/postgres` | Direct connection URL for PostgreSQL schema migrations. |
| `JWT_SECRET` | Yes | `prop_assist_jwt_secret_2026` | Cryptographic secret for signing access tokens. |
| `JWT_EXPIRES_IN` | Yes | `7d` | Access token lifespan. |
| `GROQ_API_KEY` | Optional | `gsk_...` | Groq Cloud API key for LLaMA 3.3 multilingual LLM. |
| `GROQ_MODEL` | Optional | `llama-3.3-70b-versatile` | Groq model identifier. |
| `RAZORPAY_KEY_ID` | Optional | `rzp_test_...` | Razorpay Merchant Test/Live Key ID. |
| `RAZORPAY_KEY_SECRET` | Optional | `...` | Razorpay Secret for HMAC-SHA256 signature verification. |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | `...` | Secret for validating incoming payment captured webhooks. |
| `JITSI_DOMAIN` | Optional | `meet.jit.si` | Jitsi Meet domain (free hosted or self-hosted). |
| `SMS_API_KEY` | Optional | `...` | MSG91 flow authentication key. |
| `SMS_SENDER_ID` | Optional | `PROPST` | 6-character approved DLT sender header. |

---

## 8. External API & Collaboration Setup Guide

### A. Groq AI (LLM)
- **Website**: [https://console.groq.com/](https://console.groq.com/)
- **Setup**: Sign in → **API Keys** → **Create API Key** → Copy `gsk_...`.
- Add to `.env`: `GROQ_API_KEY="gsk_..."`.
- **Offline Fallback**: If the key is omitted, PropAssist AI automatically engages its contextual rule engine to answer pricing, inventory, and site-visit inquiries in English, Hindi, and Gujarati.

### B. Razorpay Payment Gateway
- **Website**: [https://razorpay.com/](https://razorpay.com/)
- **Setup**: Sign up → Toggle **Test Mode** in top navigation → **Settings** → **API Keys** → **Generate Test Key**.
- Add to `.env`: `RAZORPAY_KEY_ID="rzp_test_..."`, `RAZORPAY_KEY_SECRET="..."`.
- **Webhook Configuration**: Settings → **Webhooks** → Add New: `https://your-domain.com/api/payments/webhook`, select event `payment.captured`.
- **Test Mode Fallback**: If omitted, PropAssist AI activates a cryptographically valid test order simulator so role tests and bookings succeed out of the box.

### C. WhatsApp Click-to-Chat (Official wa.me — Absolutely NO API)
- **Official wa.me URL**: `https://wa.me/<number>?text=<encoded_text>`
- **Zero API Requirements**:
  - **NO** Meta Developer Account or Meta App.
  - **NO** WhatsApp Business Cloud API or Access Tokens.
  - **NO** Phone Number IDs or App Secrets.
  - **NO** Webhook tokens or webhook URLs.
  - **NO** Third-party paid aggregators (MSG91 WhatsApp, Twilio, or unofficial libraries).
- **Dynamic Phone Number Validation**:
  - Automatically cleans phone strings by removing spaces, parentheses, hyphens, and symbols (`\D`).
  - Standard 10-digit Indian numbers (e.g. `9876543210`) are normalized to international country code `919876543210`.
  - Leading zeros (e.g. `09876543210`) are stripped and prefixed with `91`.
  - Validates minimum 10 digits and alerts user before opening if a phone number is invalid.
- **Multilingual Prefilled Message Generation**:
  - Supports one-click templates across **English**, **Hindi (हिन्दी)**, and **Gujarati (ગુજરાતી)**:
    1. **Buyer Enquiry**:
       - *EN*: "Hello, I am interested in your 2 BHK / 3 BHK property. Please share more details."
       - *HI*: "नमस्ते, मुझे आपकी 2 BHK / 3 BHK प्रॉपर्टी में रुचि है। कृपया अधिक विवरण साझा करें।"
       - *GU*: "નમસ્તે, મને તમારી 2 BHK / 3 BHK પ્રોપર્ટીમાં રસ છે. કૃપા કરીને વધુ વિગતો શેર કરો।"
    2. **Site Visit Notification**:
       - *EN*: "Hello, your site visit has been scheduled. Please check your PropAssist AI dashboard for details."
       - *HI*: "नमस्ते, आपकी साइट विज़िट निर्धारित कर दी गई है। कृपया विवरण के लिए अपना PropAssist AI डैशबोर्ड देखें।"
       - *GU*: "નમસ્તે, તમારી સાઇટ મુલાકાત શેડ્યૂલ કરવામાં આવી છે. કૃપા કરીને વિગતો માટે તમારું PropAssist AI ડેશબોર્ડ તપાસો।"
    3. **Executive Follow-up**:
       - *EN*: "Hello, I am contacting you regarding your property enquiry. Please let me know a convenient time to discuss."
       - *HI*: "नमस्ते, मैं आपकी प्रॉपर्टी पूछताछ के संबंध में आपसे संपर्क कर रहा हूं। कृपया चर्चा के लिए सुविधाजनक समय बताएं।"
       - *GU*: "નમસ્તે, હું તમારી પ્રોપર્ટી પૂછપરછ અંગે તમારો સંપર્ક કરી રહ્યો છું. કૃપા કરીને ચર્ચા માટે અનુકૂળ સમય જણાવો।"
- **Mobile & Desktop Compatibility**:
  - Mobile devices automatically launch the native **WhatsApp mobile application**.
  - Desktop browsers seamlessly launch **WhatsApp Web** (`web.whatsapp.com`) in a new tab.
  - Users have full capability to edit the message before manual sending.
- **Strict Compliance & Activity Logging**:
  - Under Indian DPDP guidelines, automated spam is forbidden. Opening a WhatsApp link never implies automatic dispatch.
  - Activities are recorded in `CommunicationLog` and `AuditLog` strictly under the status `WHATSAPP_LINK_OPENED`. No fake delivery or read statuses are generated.

### D. Free Jitsi Video Calling Integration
- **Free Hosted Provider**: Uses `meet.jit.si` by default with zero configuration or cost.
- **Jitsi IFrame API**: Embedded video calling via official Jitsi Meet External API with camera and microphone controls.
- **Lifecycle & History**:
  - Homebuyer requests video consultation (`POST /api/calls/request`) with status `REQUESTED`.
  - Assigned Sales Executive reviews, accepts, and schedules consultation (`POST /api/calls/:id/accept`) with status `SCHEDULED`.
  - Both join the consultation via room URL `/call/:invitationToken`.
  - Updates call status to `InProgress` and calculates total session duration upon completion (`Completed`).
- **Participant Verification & Privacy**:
  - Strict backend verification on `GET /api/calls/session/:token`: only the authorized buyer and currently assigned executive (or admin) can join.
  - Unauthorized participants receive HTTP 403 Forbidden.
  - No automatic recording and zero paid video SDK dependencies.
- **Self-Hosting Option**:
  - To self-host on a private server (e.g. Docker Jitsi Meet on Ubuntu), deploy Jitsi on your own domain and update `.env`:
    ```bash
    JITSI_DOMAIN="meet.yourrealestatefirm.com"
    ```

### E. In-App Real-Time Chat (Socket.IO)
- **Engine**: Real-time WebSocket communication backed by Socket.IO with JWT authorization handshake.
- **Features**:
  - Homebuyer and assigned executive exchange instant text messages directly inside PropAssist AI.
  - Complete conversation history persisted in the database (`Message` model).
  - Accurate timestamps, unread count badges, and read receipts (`isRead`, `readAt`).
  - Real-time typing indicators with debounce controls (`user_typing`).
  - Role-based authorization: Buyers only access their own conversation; Executives only access currently assigned leads.

### F. MSG91 Transactional SMS
- **Website**: [https://msg91.com/](https://msg91.com/)
- **Setup**: Complete DLT registration → Obtain Auth Key from dashboard → Configure sender ID `PROPST`.
- Add to `.env`: `SMS_API_KEY`, `SMS_SENDER_ID`.

-----

## 9. Database Management Commands

```bash
# Verify database connection and view table row counts
npm run db:check

# Generate Prisma Client models
npm run db:generate

# Synchronize database schema without destroying data
npm run db:migrate

# Idempotently seed all 4 demo roles, projects, inventory, and leads
npm run db:seed
```

---

## 10. How to Run the Backend

```bash
# Start backend in development mode
npm run dev:backend

# Or directly from backend folder:
cd backend
npm start
```
The backend starts on `http://localhost:5000`:
- **Health Endpoint**: `http://localhost:5000/api/health`
- **Swagger Documentation**: `http://localhost:5000/api/docs`

---

## 11. How to Run the Frontend

```bash
# From workspace root:
npm run dev:frontend

# Or directly from frontend folder:
cd frontend
npm run dev
```
The frontend Vite server runs on `http://localhost:5173`.

---

## 12. Run Background Reminder Worker

PropAssist AI includes an autonomous worker that monitors upcoming site visits every 60 seconds and dispatches 24-hour and 2-hour reminders via WhatsApp and SMS:

```bash
# Start the background worker:
npm run worker

# Output:
# ==============================================
# 🤖 PropAssist AI Background Worker Started
# 🕒 Polling interval: 60s
# 📬 Active Tasks: Site Visit 24h/2h Reminders, SMS/WhatsApp queues
# ==============================================
```

---

## 13. API Documentation (Swagger & Health)

- **Interactive Swagger UI**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **Live System Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

- **Live System Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 14. Real User Management & Supabase Authentication

PropAssist AI operates on **100% genuine user accounts and database records**. There are **no hardcoded credentials, no shared demo passwords, and no fake business data** in production.

### Authentication & Security Architecture
- **Supabase Auth Integration**: User identity and password hashing are handled via Supabase Auth (`@supabase/supabase-js`). Passwords are never stored in plain text.
- **PostgreSQL Database Profiles**: User profiles, roles, and enterprise permissions are stored in PostgreSQL/Prisma linked by `supabaseId`.
- **Row Level Security (RLS)**: Comprehensive PostgreSQL RLS policies in `database/rls_policies.sql` enforce tenant isolation, executive assignment scope, and buyer data privacy at the database engine level.
- **Server-Enforced Roles**: Roles (`SUPER_ADMIN`, `SALES_HEAD`, `SALES_EXECUTIVE`, `BUYER`) are strictly loaded from the authenticated database session; client-supplied role tampering is permanently rejected.

### Account Provisioning Workflows

#### 1. First Super Admin Setup (One-Time Initialization)
To establish the initial Super Admin on a clean deployment, run the secure one-time CLI setup:
```bash
npm run setup:admin <email> <password> [fullName] [phone]
```
*Example:*
```bash
npm run setup:admin superadmin@propassist.ai "SecureAdmin2026!#" "Principal Admin" "+919825000001"
```
> [!IMPORTANT]
> This command is **permanently disabled** once the first Super Admin exists in the database. Any subsequent invocation returns `HTTP 403 Forbidden`.

#### 2. Buyer Self-Registration
Prospective homebuyers register through the public registration interface:
- **Web Interface**: Navigate to [http://localhost:5173/login?mode=register](http://localhost:5173/login?mode=register).
- **API Endpoint**: `POST /api/auth/register`
- **Security Guard**: Public registration is strictly locked to the `BUYER` role. Any attempt to pass administrative or staff roles is rejected with `HTTP 403 Forbidden`.

#### 3. Internal Staff Provisioning
Internal sales personnel (`SALES_HEAD`, `SALES_EXECUTIVE`) can **only** be created by an authenticated `SUPER_ADMIN` or `SALES_HEAD`:
- **Admin Dashboard**: Under `/admin/dashboard` → **Users Management** → **Add Staff Member**.
- **API Endpoint**: `POST /api/auth/create-staff` (Requires `Bearer` token with Admin/Sales Head privileges).

---

## 15. Role-Wise Testing Manual (Using Real Accounts)

### TEST 1 — SUPER ADMIN SETUP & VALIDATION
1. Run `npm run setup:admin admin@myrealty.com "Secure#Admin2026" "Executive Admin"`.
2. Open `http://localhost:5173/login`.
3. Sign in with `admin@myrealty.com` and password `Secure#Admin2026`.
4. Verify immediate redirect to `/admin/dashboard`.
5. Open **Users Management** → Add a new `SALES_HEAD` account (`head@myrealty.com`) and a `SALES_EXECUTIVE` account (`exec@myrealty.com`).
6. Attempt to run `npm run setup:admin` again → Verify it fails with **`HTTP 403: Initial Super Admin setup has already been completed`**.

### TEST 2 — SALES HEAD WORKFLOW
1. Sign in as `head@myrealty.com`.
2. Verify redirect to `/sales-head/dashboard`.
3. Open **All Organization Leads** → Observe organization-wide live lead pipeline from database.
4. Assign unassigned leads to `exec@myrealty.com`.
5. Open **Property Bookings & Allotments** → Review pending allotment approvals.

### TEST 3 — SALES EXECUTIVE ISOLATION
1. Sign in as `exec@myrealty.com`.
2. Verify redirect to `/executive/dashboard`.
3. Open **My Assigned Leads** → Confirm that ONLY leads assigned to this executive appear.
4. Attempt to query or modify an unassigned lead or another executive's lead → Verify access is denied with **`HTTP 403 Forbidden`**.
5. Engage in live call or schedule a visit slot.

### TEST 4 — BUYER REGISTRATION & PORTAL
1. Open `http://localhost:5173/login?mode=register`.
2. Register a new buyer (e.g. `buyer@gmail.com`).
3. Verify automatic login and redirect to `/buyer/dashboard`.
4. Verify that internal staff controls (Staff Provisioning, Executive KPIs, Lead Reassignments) are completely inaccessible.
5. In **AI Consultant**, ask questions about Ahmedabad properties (The Grand Orchid / Serene Meadows).
6. Complete a token booking and download the cryptographically verified receipt.

### TEST 5 — BUYER STRICT PRIVACY & ANTI-IDOR VALIDATION
1. Log in as Buyer A.
2. Attempt to pass Buyer B's ID in query parameters:
   ```bash
   curl -H "Authorization: Bearer <BUYER_A_JWT>" http://localhost:5000/api/payments?buyerId=<BUYER_B_ID>
   ```
3. **Result**: Response returns strictly Buyer A's records. Query parameter overrides are ignored.
4. Attempt to download Buyer B's receipt directly:
   ```bash
   curl -H "Authorization: Bearer <BUYER_A_JWT>" http://localhost:5000/api/payments/<BUYER_B_PAYMENT_ID>/receipt
   ```
5. **Result**: Server returns **`HTTP 403 Forbidden: You do not own this payment record`**.

### TEST 6 — REAL TIME REASSIGNMENT REVOCATION
1. Executive A views their assigned lead `GET /api/leads/<LEAD_ID>`.
2. Sales Head reassigns the lead to Executive B.
3. Executive A immediately re-queries the same lead.
4. **Result**: Access is immediately revoked with **`HTTP 403 Forbidden: You are not assigned to this lead`**.

---

## 16. Postman Testing Guide

The complete Postman suite is provided in the repository:
- **Collection**: `docs/PropAssist_AI_Backend.postman_collection.json`
- **Environment**: `docs/PropAssist_AI_Local.postman_environment.json`

### Import & Run
1. Open Postman → Click **Import** → Select both JSON files.
2. Choose **PropAssist AI Local Environment** in the environment selector.
3. Open the **2. Authentication** folder and execute **Login - Super Admin**, **Login - Sales Head**, **Login - Sales Executive A**, or **Login - Buyer A**.
4. Test scripts automatically capture the JWT token and populate `{{authToken}}` globally across all subsequent requests.

---

## 17. Automated Security and Role Testing

Execute the automated end-to-end test suites:

```bash
# Run all automated tests (Integration + Role Isolation)
npm run test

# Run strict role isolation & security tests only
npm run test:roles

# Run REST API integration tests only
npm run test:integration
```
*Verification*: All 28 automated test specifications pass with 0 failures:
- ✅ Buyer A cannot access Buyer B's records (Profile, Leads, Chats, Bookings, Payments, Receipts, Allotments)
- ✅ Forged client-supplied buyer IDs are ignored
- ✅ Executive A cannot view, modify, or call Executive B's leads
- ✅ Lead reassignment immediately revokes prior executive access
- ✅ Atomic double-booking prevention locks concurrent attempts
- ✅ Cryptographic HMAC-SHA256 signature verification blocks forged payments

---

## 18. Troubleshooting & Common Questions

| Problem | Root Cause | Solution |
| :--- | :--- | :--- |
| **`Database connection failed`** | Incorrect password or region in `DATABASE_URL`. | Verify credentials in Supabase Dashboard → Database → Connection String. Run `npm run db:check`. |
| **`Prisma migration error`** | Active connection lock or schema drift. | Run `npm run db:migrate` or `npx prisma db push --force-reset` on local dev. |
| **`Port 5000 already in use`** | Another node process is holding port 5000. | On Windows: `netstat -ano \| findstr :5000` followed by `taskkill /PID <PID> /F`. |
| **`CORS error in browser`** | Frontend origin port mismatch. | `server.js` enables wildcard CORS `origin: '*'`. Ensure backend is running on port 5000. |
| **`Groq API rate limit or error`** | Missing or expired Groq key. | PropAssist AI automatically falls back to its offline multilingual NLP rules engine. Add a fresh key at `console.groq.com`. |
| **`Razorpay signature mismatch`** | Test payment forged without HMAC verification. | Ensure `RAZORPAY_KEY_SECRET` matches your dashboard or test credentials. |

---

## 19. Production Deployment Guidelines

1. **Database Migration**:
   In your production deployment pipeline (e.g. Render, Railway, AWS ECS), set `DATABASE_URL` to the Supabase Transaction Pooler URL (Port 6543) and `DIRECT_URL` to the Session URL (Port 5432). Run `npm run db:migrate`.
2. **Environment Variables**:
   Inject production secrets (`JWT_SECRET`, `GROQ_API_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) through your hosting provider's secret manager. Note that WhatsApp Click-to-Chat and Jitsi Meet operate with zero third-party API tokens or telephony secrets.
3. **Frontend API URL**:
   Ensure `frontend/.env.production` defines `VITE_API_URL="https://api.yourdomain.com"`.
4. **Background Worker Daemon**:
   Run `npm run worker` as a resilient managed background service (e.g., using `PM2`: `pm2 start src/worker.js --name propassist-worker`).

---

## 21. Automatic API Configuration & Complete Supabase Integration Guide

PropAssist AI operates on **strictly 7 core integrations** with zero paid telephony or Meta Cloud APIs.

### The 7 Core Integrations

| # | Integration | Category | Official Portal | Environment Variable | Setup Instructions |
| :- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Supabase** | PostgreSQL DB & Auth & Storage | [supabase.com/dashboard](https://supabase.com/dashboard) | `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Create project → Copy Database Pooler URI (port 6543) & Direct URI (port 5432) → Copy Project URL & Service Role Key from Project Settings > API. |
| **2** | **Groq Cloud AI** | Multilingual LLM (Llama 3.3 70B) | [console.groq.com/keys](https://console.groq.com/keys) | `GROQ_API_KEY`, `GROQ_MODEL` | Sign in → Click **API Keys** → **Create API Key** → Paste key starting with `gsk_`. (Built-in rule-based NLP activates automatically if omitted). |
| **3** | **Razorpay** | Payment Gateway & Escrow | [dashboard.razorpay.com](https://dashboard.razorpay.com/#/access/api-keys) | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Switch to Test Mode → Settings > API Keys → Generate Key ID & Secret (`rzp_test_...`). (Test simulator activates if omitted). |
| **4** | **Jitsi Meet** | Video Consultations | [meet.jit.si](https://meet.jit.si) | `JITSI_DOMAIN=meet.jit.si` | Zero signup or paid calling SDKs required. Uses free public or self-hosted Jitsi instance via IFrame API. |
| **5** | **WebRTC** | P2P In-App Audio Calling | [webrtc.org](https://webrtc.org) | Built-in standard | Browser-to-browser direct voice calls via Socket.IO signaling. Public Google STUN (`stun:stun.l.google.com:19302`) is built in with zero telecom bills. |
| **6** | **Socket.IO** | Real-Time Messaging & Events | [socket.io](https://socket.io) | Built-in engine | Runs directly on the Express HTTP server. Handles real-time chat, unread notifications, typing indicators & WebRTC signaling. |
| **7** | **WhatsApp Click-to-Chat** | Customer Deep Links | [faq.whatsapp.com](https://faq.whatsapp.com/591339899867296) | Zero API keys required | Official `https://wa.me/` standard with validated Indian mobile numbers and prefilled multilingual templates (English, Hindi, Gujarati). |

---

### Supabase PostgreSQL Setup & Migration Workflow

To connect your Supabase PostgreSQL database to PropAssist AI:

1. **Run the Complete Schema in Supabase**:
   Open your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) and run:
   - `database/supabase_schema.sql` (Creates all 20 tables, relations, constraints, performance indexes, and storage buckets).
   - `database/rls_policies.sql` (Enforces Row-Level Security across all application tables).

2. **Configure Credentials in `backend/.env`**:
   ```env
   DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
   SUPABASE_ANON_KEY="your-anon-publishable-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret-key"
   ```

3. **Verify Connection & Health**:
   ```powershell
   npm --prefix backend run db:supabase:verify
   ```

4. **Synchronize Prisma Models (if needed)**:
   ```powershell
   npm --prefix backend run db:supabase:push
   ```

---

### Super Admin API Configuration Dashboard

Super Admins can monitor, inspect, and test all 7 integrations directly from the web interface:
- Navigate to: **Super Admin Dashboard** → **API Integrations & Keys (7)** (`/admin?tab=integrations`).
- **Live Status Badges**: Shows whether each integration is `Connected`, `Setup Ready`, or `Active`.
- **Masked Keys**: Sensitive tokens and secrets are cryptographically masked (`gsk_****`, `rzp_****`, `https://****.supabase.co`).
- **Safe Handshake Test**: Click **Test Connection** next to any integration to perform an immediate latency and handshake check (`POST /api/integrations/test/:id`).


- [x] **No Frontend ID Trust**: All user identities are derived exclusively from cryptographically verified JWT tokens on the server.
- [x] **Strict Buyer Privacy**: Buyer A is prevented from querying, reading, or downloading documents belonging to Buyer B.
- [x] **Executive Operational Boundary**: Sales Executives are restricted exclusively to their active assignments. Reassignment revokes prior access immediately.
- [x] **Atomic Concurrency Protection**: Transactions protect inventory units and site visit slots from simultaneous reservation collisions.
- [x] **Immutable Audit Logs**: All sensitive actions (lead assignments, payments, bookings, status updates) are committed to `AuditLog`.
- [x] **Digital Document Watermarking**: All receipts and allotment letters contain verification reference numbers and digital integrity signatures.

---

*PropAssist AI — Engineered with Precision for Residential Developers.*
