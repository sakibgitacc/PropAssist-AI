# PropAssist AI — Deployment & Evaluation Guide

> **Client Brief**: Company A, Ahmedabad — Real Estate Developer's AI Lead-Response & Site-Visit Booking Assistant  
> **Repository**: [https://github.com/sakibattar/PropAssist-AI](https://github.com/sakibattar/PropAssist-AI)  
> **Target Production**: Node.js, Express, React (Vite, TailwindCSS), PostgreSQL / Supabase, Groq Llama 3 NLP, Jitsi WebRTC, Razorpay Escrow  

---

## 1. Quick Local Setup (Step-by-Step)

Follow these exact steps to run the complete solution locally on your machine.

### Prerequisites
* **Node.js**: v18.0.0 or higher (v20+ recommended)
* **npm**: v9.0.0 or higher
* **PostgreSQL** or free **Supabase PostgreSQL** instance

### Step 1: Clone Repository
```bash
git clone https://github.com/sakibattar/PropAssist-AI.git
cd PropAssist-AI
```

### Step 2: Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```
*(Alternatively: `cd backend && npm install`, then `cd ../frontend && npm install`)*

### Step 3: Configure Environment Variables
Create `.env` inside the `backend/` folder based on `.env.example`:
```bash
cp backend/.env.example backend/.env
```
*(Populate with your PostgreSQL/Supabase database URL, Groq API key, and JWT secret. See Section 3 for variable names.)*

### Step 4: Run Database Migrations & Seed Sample Data
```bash
cd backend
npx prisma db push
node src/scripts/seed-rich-enterprise-data.js
node src/scripts/seed-brief-sample.js
cd ..
```
*This seeds Company A's 2 Ahmedabad residential projects (The Grand Orchid & Serene Meadows), RERA Fact Sheets, real inventory units, VIP visit slots, and the 3 official brief leads (`LD-58210`, `LD-58211`, `LD-58224`).*

### Step 5: Start Backend and Frontend
Open two terminal windows:

**Terminal 1 (Backend API - Port 5000):**
```bash
npm run dev:backend
```
*API runs at `http://localhost:5000`. Swagger API Docs available at `http://localhost:5000/api/docs`.*

**Terminal 2 (Frontend UI - Port 5173):**
```bash
npm run dev:frontend
```
*Web application runs at `http://localhost:5173`.*

---

## 2. Reviewer Demo Login Accounts

All 4 role-based user personas are pre-seeded and verified for immediate testing:

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@propassist.ai` | `Admin@123` | System audit logs, staff provisioning, role-based access control, security metrics |
| **Sales Head** | `saleshead@propassist.ai` | `Sales@123` | Lead assignment, team conversion analytics, RERA allotment approvals, fact sheet editor |
| **Sales Executive** | `executive1@propassist.ai` | `Exec@123` | Assigned lead inbox, Jitsi video consultations, WhatsApp advisor, visit attendance |
| **Verified Buyer** | `buyer@example.com` | `Buyer@123` | Multilingual AI chat advisor, atomic site-visit booking, token escrow deposit, RERA allotment download |

*Note: You can also register a brand new buyer account using the public **Create Account** button on `/login`.*

---

## 3. Environment Variables (Names Only)

*In compliance with security rules, only variable names are listed below. No secret values are exposed.*

### Backend Environment Variables (`backend/.env`)
* `PORT`
* `NODE_ENV`
* `DATABASE_URL`
* `DIRECT_URL`
* `SUPABASE_URL`
* `SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY`
* `JWT_SECRET`
* `JWT_EXPIRES_IN`
* `GROQ_API_KEY`
* `GROQ_MODEL`
* `RAZORPAY_KEY_ID`
* `RAZORPAY_KEY_SECRET`
* `JITSI_DOMAIN`

### Frontend Environment Variables (`frontend/.env`)
* `VITE_API_URL`
* `VITE_RAZORPAY_KEY_ID`

---

## 4. Production Deployment Architecture

PropAssist AI is built as a cloud-ready decoupled architecture:

* **Frontend (SPA)**: Deployed to **Vercel** or **Netlify** with single-page application rewrites (`/* -> /index.html`).
* **Backend API**: Deployed as an auto-scaling Node.js service on **Render**, **Railway**, or **AWS ECS/App Runner**.
* **Database & Auth**: Hosted on **Supabase PostgreSQL** (Seoul/Mumbai region) with PgBouncer connection pooling and Row-Level Security (RLS).
* **AI NLP Inference**: High-throughput **Groq Cloud** API (`llama-3.3-70b-versatile` / `gpt-oss-120b`) with a local keyword/intent fallback when offline.
* **Virtual Consultations**: Distributed **Jitsi Meet WebRTC** infrastructure (`meet.jit.si`) for in-browser HD audio/video walkthroughs.
* **Escrow Payments**: **Razorpay Payment Gateway** in Test Mode with cryptographic HMAC-SHA256 signature verification and simulated fallback.

---

## 5. Automated Verification & Test Suite

Run the automated test suite to verify atomic locking, role-based access control (RLS), and API endpoints:

```bash
# Run backend automated test suite
npm run test:backend

# Run Supabase Row-Level Security verification script
node backend/test-rls-access.js
```


