const { createClient } = require('@supabase/supabase-js');

/**
 * PropAssist AI — Supabase Primary Database & Authentication Service
 * 
 * Provides:
 * - Supabase Auth: Real User Registration, Password Hashing & Verification
 * - Supabase Auth Admin: Internal Staff Provisioning (SUPER_ADMIN only)
 * - Supabase Storage: Private buckets for Payment Receipts & Allotment Letters
 * - Signed URLs: Time-limited cryptographic download links
 * - Connection Handshake Test: Live health verification for Admin status dashboard
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function isSupabaseConfigured() {
  return !!(
    SUPABASE_URL &&
    !SUPABASE_URL.includes('your-project-ref') &&
    SUPABASE_URL.startsWith('https://') &&
    ((SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_SERVICE_ROLE_KEY.includes('your_supabase')) ||
      (SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('your_supabase')))
  );
}

let supabaseAdminClient = null;
let supabaseAnonClient = null;

function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase configuration missing: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided in backend/.env'
    );
  }
  if (!supabaseAdminClient) {
    const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    supabaseAdminClient = createClient(SUPABASE_URL, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseAdminClient;
}

function getSupabaseAnon() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase configuration missing: SUPABASE_URL and SUPABASE_ANON_KEY must be provided in backend/.env'
    );
  }
  if (!supabaseAnonClient) {
    const key = SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY;
    supabaseAnonClient = createClient(SUPABASE_URL, key, {
      auth: {
        persistSession: false
      }
    });
  }
  return supabaseAnonClient;
}

/**
 * Register a real user in Supabase Auth
 */
async function registerInSupabase({ email, password, name, role = 'BUYER', phone = null }) {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      error: 'Supabase credentials are not configured in backend/.env. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    };
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        phone
      }
    });

    if (error) {
      return { configured: true, error: error.message };
    }

    return {
      configured: true,
      user: data.user
    };
  } catch (err) {
    return { configured: true, error: err.message };
  }
}

/**
 * Authenticate real credentials against Supabase Auth
 */
async function signInWithSupabase({ email, password }) {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      error: 'Supabase credentials are not configured in backend/.env. Please configure SUPABASE_URL and SUPABASE_ANON_KEY.'
    };
  }

  try {
    const client = getSupabaseAnon();
    const { data, error } = await client.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    });

    if (error) {
      return { configured: true, error: error.message };
    }

    return {
      configured: true,
      session: data.session,
      user: data.user
    };
  } catch (err) {
    return { configured: true, error: err.message };
  }
}

/**
 * Request real password reset email via Supabase
 */
async function resetPasswordInSupabase(email) {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      error: 'Supabase credentials are not configured in backend/.env.'
    };
  }

  try {
    const client = getSupabaseAnon();
    const { error } = await client.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?mode=reset`
    });

    if (error) {
      return { configured: true, error: error.message };
    }

    return { configured: true, success: true };
  } catch (err) {
    return { configured: true, error: err.message };
  }
}

/**
 * Safe connection test for Supabase API & Auth
 */
async function testSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      status: 'NOT_CONFIGURED',
      message: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from backend/.env'
    };
  }

  const startTime = Date.now();
  try {
    const admin = getSupabaseAdmin();
    // Test auth service ping by listing users with limit 1
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    const latencyMs = Date.now() - startTime;

    if (error) {
      return {
        configured: true,
        status: 'ERROR',
        error: error.message,
        latencyMs
      };
    }

    return {
      configured: true,
      status: 'CONNECTED',
      latencyMs,
      endpoint: SUPABASE_URL,
      message: 'Supabase Auth & PostgreSQL connection established successfully.'
    };
  } catch (err) {
    return {
      configured: true,
      status: 'ERROR',
      error: err.message,
      latencyMs: Date.now() - startTime
    };
  }
}

/**
 * Supabase Storage: Ensure bucket exists
 */
async function ensureBucketExists(bucketName = 'documents', isPublic = false) {
  if (!isSupabaseConfigured()) return false;
  try {
    const admin = getSupabaseAdmin();
    const { data: buckets } = await admin.storage.listBuckets();
    const exists = buckets?.some(b => b.name === bucketName);
    if (!exists) {
      await admin.storage.createBucket(bucketName, { public: isPublic });
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase Storage] Could not verify bucket ${bucketName}:`, err.message);
    return false;
  }
}

/**
 * Supabase Storage: Upload document buffer to private bucket
 */
async function uploadDocument(bucket, filePath, fileBuffer, contentType = 'application/pdf') {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase Storage is not configured.');
  }
  const admin = getSupabaseAdmin();
  await ensureBucketExists(bucket, false);

  const { data, error } = await admin.storage.from(bucket).upload(filePath, fileBuffer, {
    contentType,
    upsert: true
  });

  if (error) throw error;
  return data;
}

/**
 * Supabase Storage: Generate secure time-limited signed URL
 */
async function getSignedUrl(bucket, filePath, expiresInSeconds = 3600) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase Storage is not configured.');
  }
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(filePath, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

module.exports = {
  isSupabaseConfigured,
  registerInSupabase,
  signInWithSupabase,
  resetPasswordInSupabase,
  testSupabaseConnection,
  ensureBucketExists,
  uploadDocument,
  getSignedUrl,
  getSupabaseAdmin,
  getSupabaseAnon
};
