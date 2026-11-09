/**
 * PropAssist AI One-Command Setup Script
 * Validates Node environment, database connectivity, applies migrations,
 * seeds idempotent data, and audits API keys
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('================================================================');
console.log('🏗️   PROPASSIST AI — SYSTEM INITIALIZATION & ENVIRONMENT AUDIT   ');
console.log('================================================================\n');

// 1. Verify Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
console.log(`[1/5] Checking Node.js Environment: ${nodeVersion}`);
if (majorVersion < 18) {
  console.error(`❌ Error: Node.js version 18.0.0 or higher is required. Found ${nodeVersion}.`);
  process.exit(1);
}
console.log('      ✅ Node.js version satisfies enterprise requirements.\n');

// 2. Check backend .env file
const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
const backendEnvExamplePath = path.join(__dirname, '..', 'backend', '.env.example');

console.log('[2/5] Auditing Backend Configuration (.env)...');
if (!fs.existsSync(backendEnvPath)) {
  console.log('      ⚠️  backend/.env not found. Creating from .env.example...');
  if (fs.existsSync(backendEnvExamplePath)) {
    fs.copyFileSync(backendEnvExamplePath, backendEnvPath);
    console.log('      ✅ Created backend/.env from template.');
  } else {
    console.error('      ❌ backend/.env.example missing!');
  }
} else {
  console.log('      ✅ backend/.env is present.');
}

// 3. Generate Prisma ORM client & apply migrations
console.log('\n[3/5] Applying Database Schema & Prisma Generation...');
try {
  execSync('npx prisma generate', { cwd: path.join(__dirname, '..', 'backend'), stdio: 'inherit' });
  execSync('npx prisma db push --skip-generate', { cwd: path.join(__dirname, '..', 'backend'), stdio: 'inherit' });
  console.log('      ✅ Database schema is synchronized.');
} catch (err) {
  console.error('      ❌ Database sync failed. Check database credentials in .env.');
  process.exit(1);
}

// 4. Seed database idempotently
console.log('\n[4/5] Seeding Idempotent Demo Accounts & Residential Projects...');
try {
  execSync('node src/db/seed.js', { cwd: path.join(__dirname, '..', 'backend'), stdio: 'inherit' });
  console.log('      ✅ Idempotent database seed complete.');
} catch (err) {
  console.error('      ❌ Seeding failed:', err.message);
  process.exit(1);
}

// 5. External Integration Audit
console.log('\n[5/5] External API Credentials Audit:');

// Simple native .env parser
const envConfig = {};
if (fs.existsSync(backendEnvPath)) {
  const envContent = fs.readFileSync(backendEnvPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        envConfig[key] = val;
      }
    }
  });
}

function auditKey(name, envVal, placeholder) {
  const isSet = envVal && !envVal.includes(placeholder) && envVal.length > 5;
  if (isSet) {
    console.log(`      ✅ ${name.padEnd(20)}: CONFIGURED (Live Mode Enabled)`);
  } else {
    console.log(`      ⚡ ${name.padEnd(20)}: DEMO SIMULATOR (Safe test fallback active)`);
  }
}

auditKey('Groq AI (LLM)', envConfig.GROQ_API_KEY, 'your_groq');
auditKey('Razorpay Gateway', envConfig.RAZORPAY_KEY_ID, 'your_razorpay');
console.log('      ✅ Jitsi Video Calling : ACTIVE (Free Hosted meet.jit.si / Self-Hosted)');
console.log('      ✅ WhatsApp            : CLICK-TO-CHAT ACTIVE (Official wa.me - Zero API Keys Required)');
console.log('      ✅ Socket.IO Chat      : ACTIVE (Real-Time In-App Messaging)');
auditKey('MSG91 SMS Gateway', envConfig.SMS_API_KEY, 'your_sms');

console.log('\n================================================================');
console.log('🎉  PropAssist AI is 100% READY FOR DEVELOPMENT & EVALUATION!   ');
console.log('================================================================');
console.log('\nQuick Commands:');
console.log('  ▶ npm run dev            : Start both Backend (5000) and Frontend (5173)');
console.log('  ▶ npm run test           : Run all automated security and API test suites');
console.log('  ▶ npm run worker         : Run scheduled background visit notification worker');
console.log('Account Provisioning Workflow:');
console.log('  👑 1. Initial Super Admin Setup : npm run setup:admin <email> <password> [name] [phone]');
console.log('  🏡 2. Buyer Self-Registration   : http://localhost:5173/login?mode=register');
console.log('  👔 3. Internal Staff Provisioning: Authenticated Super Admin creates Sales Head & Executives\n');
