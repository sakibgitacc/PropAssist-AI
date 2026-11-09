const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// Use Supabase PgBouncer pooled connection (DATABASE_URL on port 6543) for runtime client queries.
// DIRECT_URL (port 5432) is reserved for migrations and CLI schema management.
let dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (dbUrl && !dbUrl.includes('connection_limit')) {
  const separator = dbUrl.includes('?') ? '&' : '?';
  dbUrl = `${dbUrl}${separator}connection_limit=10`;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
