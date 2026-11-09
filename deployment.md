# PropAssist AI — Enterprise Production Deployment Runbook

> **Platform**: PropAssist AI — Enterprise Multi-Tenant Real Estate Sales & Governance Platform  
> **GitHub Repository**: [https://github.com/sakibgitacc/PropAssist-AI](https://github.com/sakibgitacc/PropAssist-AI)  
> **Live Frontend Application**: [https://propassist-frontend.onrender.com](https://propassist-frontend.onrender.com)  
> **Live Backend API Gateway**: [https://propassist-backend.onrender.com](https://propassist-backend.onrender.com)  
> **API Documentation (Swagger)**: [https://propassist-backend.onrender.com/api/docs](https://propassist-backend.onrender.com/api/docs)  
> **System Health Check**: [https://propassist-backend.onrender.com/api/health](https://propassist-backend.onrender.com/api/health)

---

## 1. System Architecture & Topology

PropAssist AI is engineered as an enterprise-grade, cloud-native decoupled platform:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER TOUCHPOINTS                                │
│   [Desktop / Mobile Browser]  ──►  Render Global Edge CDN (SSL/TLS)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
┌───────────────────────────────┐       ┌────────────────────────────────┐
│   FRONTEND STATIC SITE        │       │   BACKEND WEB SERVICE (API)    │
│   Host: Render Static Site    │       │   Host: Render Web Service     │
│   Tech: React 18, Vite,       │       │   Tech: Node.js 20, Express,   │
│         Tailwind CSS, Lucide  │──────►│         Prisma ORM, Socket.IO  │
│   URL: propassist-frontend    │ /api  │   URL: propassist-backend      │
└───────────────────────────────┘       └───────────────┬────────────────┘
                                                        │
         ┌──────────────────────────────────────────────┼──────────────────────────────┐
         ▼                                              ▼                              ▼
┌─────────────────────────────────┐   ┌───────────────────────────────────┐   ┌─────────────────────────────────┐
│     SUPABASE POSTGRESQL         │   │         EXTERNAL ENGINES          │   │      REAL-TIME COMMS & MEDIA    │
│  • Transaction Pool (Port 6543) │   │  • Groq Cloud AI LLM              │   │  • Jitsi Meet WebRTC Rooms      │
│  • Direct Migration (Port 5432) │   │  • Razorpay Escrow Gateway        │   │  • Socket.IO P2P Audio & Chat   │
│  • Row-Level Security (RLS)     │   │  • Cryptographic HMAC-SHA256      │   │  • Click-to-WhatsApp Gateway    │
└─────────────────────────────────┘   └───────────────────────────────────┘   └─────────────────────────────────┘
```

---

## 2. Production Deployment Steps (Render Cloud)

### Phase A: Deploy Backend Web Service

1. Sign in to [Render Dashboard](https://dashboard.render.com/) via GitHub.
2. Click **New +** → Select **Web Service**.
3. Connect your repository: `sakibgitacc/PropAssist-AI`.
4. Configure the service settings:
   - **Name**: `propassist-backend`
   - **Region**: `Singapore` (or region closest to target users)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free` or `Starter`
5. Configure Environment Variables in the **Environment** tab:
   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://postgres.vrtphjylvgojuvkokngb:[YOUR_DB_PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
   DIRECT_URL=postgresql://postgres.vrtphjylvgojuvkokngb:[YOUR_DB_PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
   SUPABASE_URL=https://vrtphjylvgojuvkokngb.supabase.co
   SUPABASE_ANON_KEY=sb_publishable_2Qel945PUoaaP64IMnbsXQ_2K1UIb3z
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret
   JWT_SECRET=propassist_jwt_super_secure_secret_token_2026_xyz
   JWT_EXPIRES_IN=7d
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=openai/gpt-oss-120b
   RAZORPAY_KEY_ID=rzp_test_TW1juKRTnACBhA
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   JITSI_DOMAIN=meet.jit.si
   CLIENT_URL=*
   ```
6. Click **Create Web Service**. Wait 2–3 minutes until the service status turns **Live**.

---

### Phase B: Deploy Frontend Static Site

1. In Render Dashboard, click **New +** → Select **Static Site**.
2. Connect the repository: `sakibgitacc/PropAssist-AI`.
3. Configure settings:
   - **Name**: `propassist-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory**: `dist`
4. Add the Environment Variable under the **Environment** tab:
   ```env
   VITE_API_URL=https://propassist-backend.onrender.com/api
   ```
5. Configure SPA Routing Rewrites under **Redirects/Rewrites**:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`
6. Click **Create Static Site**. Wait 1–2 minutes until the status turns **Live**.

---

## 3. Reviewer & Demonstration Accounts

All four enterprise persona accounts are pre-seeded in the database:

| Role | Email Identity | Password | Workspace Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@propassist.ai` | `Admin@123` | Multi-tenant organization oversight, staff provisioning, statutory audit logs, global inventory |
| **Sales Head** | `saleshead@propassist.ai` | `Sales@123` | Quota management, executive tracking, team performance, lead allocation, RERA approvals |
| **Sales Executive** | `executive1@propassist.ai` | `Exec@123` | Assigned lead workstation, follow-up scheduler, Jitsi video tours, WhatsApp handoff |
| **Verified Buyer** | `buyer@example.com` | `Buyer@123` | RERA statutory dossier, escrow token booking, balance settlement, allotment download |

*(Prospective homebuyers can also register a new account on `/login` with instant PostgreSQL onboarding).*

---

## 4. Database Connection & Pooling Strategy

To prevent connection exhaustion under high concurrency, PropAssist AI uses a dual-connection Prisma setup:

* **Pooled Connection (`DATABASE_URL`, Port 6543)**:  
  Uses Supabase Supavisor / PgBouncer in transaction mode (`?pgbouncer=true&sslmode=require`) for runtime API queries, handling thousands of concurrent buyer sessions efficiently.
* **Direct Connection (`DIRECT_URL`, Port 5432)**:  
  Direct PostgreSQL connection used exclusively by Prisma CLI for schema migrations (`npx prisma db push`).

---

## 5. Automated Verification & Health Monitoring

Verify platform integrity using these automated diagnostic endpoints:

```bash
# 1. API Health & Engine Diagnostics
curl -X GET https://propassist-backend.onrender.com/api/health

# 2. Swagger OpenAPI Documentation
https://propassist-backend.onrender.com/api/docs

# 3. Database & Role Access Verification (Local test)
node backend/src/scripts/seed-brief-sample.js
```

---

## 6. Security & Statutory RERA Compliance

1. **GUJRERA Statutory Escrow**: All property payments are locked to RERA-registered escrow accounts (`70% construction reserve`) with HMAC-SHA256 cryptographic signatures.
2. **Double-Booking Prevention**: Property reservations execute atomic database row updates (`Unit.status = 'Booked' | 'Allotted'`) preventing duplicate sales.
3. **Audit Trail**: Every administrative action, profile change, payment, and allotment approval is permanently recorded in the immutable `AuditLog` table.
4. **Transport Layer Security**: Enforced HTTPS/TLS 1.3 across all Render and Supabase endpoints.
