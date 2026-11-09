-- ============================================================
-- PropAssist AI - PostgreSQL Initial Schema Migration (Supabase)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SALES_EXECUTIVE',
    "phone" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Ahmedabad',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "bhkOptions" TEXT NOT NULL,
    "minPrice" DOUBLE PRECISION NOT NULL,
    "maxPrice" DOUBLE PRECISION NOT NULL,
    "minArea" DOUBLE PRECISION NOT NULL,
    "maxArea" DOUBLE PRECISION NOT NULL,
    "possession" TEXT NOT NULL,
    "reraNumber" TEXT NOT NULL,
    "amenities" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Project Images
CREATE TABLE IF NOT EXISTS "ProjectImage" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT DEFAULT 'exterior',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Fact Sheets
CREATE TABLE IF NOT EXISTS "FactSheet" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "projectId" TEXT UNIQUE NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "overview" TEXT NOT NULL,
    "specifications" TEXT NOT NULL,
    "pricingDetails" TEXT NOT NULL,
    "connectivity" TEXT NOT NULL,
    "legalDisclaimers" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "lastUpdatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Leads Table
CREATE TABLE IF NOT EXISTS "Lead" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "budgetMin" DOUBLE PRECISION,
    "budgetMax" DOUBLE PRECISION,
    "preferredBhk" TEXT,
    "preferredLocation" TEXT,
    "timeline" TEXT DEFAULT 'Exploring',
    "source" TEXT NOT NULL DEFAULT 'AI Chatbot',
    "status" TEXT NOT NULL DEFAULT 'New',
    "projectId" TEXT REFERENCES "Project"("id") ON DELETE SET NULL,
    "assignedExecutiveId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "followUpDate" TIMESTAMP(3),
    "notes" TEXT,
    "isQualified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Conversations
CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "leadId" TEXT REFERENCES "Lead"("id") ON DELETE CASCADE,
    "channel" TEXT NOT NULL DEFAULT 'Web Chat',
    "language" TEXT NOT NULL DEFAULT 'en',
    "summary" TEXT,
    "handedOff" BOOLEAN NOT NULL DEFAULT false,
    "handedOffToId" TEXT,
    "handedOffAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Messages
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "conversationId" TEXT NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
    "senderType" TEXT NOT NULL,
    "senderName" TEXT,
    "content" TEXT NOT NULL,
    "toolCalls" TEXT,
    "language" TEXT DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Visit Slots
CREATE TABLE IF NOT EXISTS "VisitSlot" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 3,
    "bookedCount" INTEGER NOT NULL DEFAULT 0,
    "assignedExecutiveId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_capacity CHECK ("bookedCount" <= "capacity")
);

-- Bookings
CREATE TABLE IF NOT EXISTS "Booking" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "leadId" TEXT NOT NULL REFERENCES "Lead"("id") ON DELETE CASCADE,
    "slotId" TEXT NOT NULL REFERENCES "VisitSlot"("id") ON DELETE CASCADE,
    "buyerName" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "buyerEmail" TEXT,
    "bookingDate" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Confirmed',
    "specialRequests" TEXT,
    "confirmationCode" TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Lead Assignments
CREATE TABLE IF NOT EXISTS "LeadAssignment" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "leadId" TEXT NOT NULL REFERENCES "Lead"("id") ON DELETE CASCADE,
    "executiveId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "assignedById" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "reason" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Internal Notes
CREATE TABLE IF NOT EXISTS "InternalNote" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "leadId" TEXT NOT NULL REFERENCES "Lead"("id") ON DELETE CASCADE,
    "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Reminders
CREATE TABLE IF NOT EXISTS "Reminder" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "leadId" TEXT NOT NULL REFERENCES "Lead"("id") ON DELETE CASCADE,
    "bookingId" TEXT REFERENCES "Booking"("id") ON DELETE SET NULL,
    "reminderType" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "channel" TEXT NOT NULL DEFAULT 'SMS/WhatsApp Simulation',
    "messageContent" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Consent Records
CREATE TABLE IF NOT EXISTS "Consent" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "leadPhone" TEXT NOT NULL,
    "leadEmail" TEXT,
    "purpose" TEXT NOT NULL DEFAULT 'Property Communication & Visit Notifications',
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Call Sessions
CREATE TABLE IF NOT EXISTS "CallSession" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "leadId" TEXT NOT NULL REFERENCES "Lead"("id") ON DELETE CASCADE,
    "executiveId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "buyerId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "roomName" TEXT UNIQUE NOT NULL,
    "invitationToken" TEXT UNIQUE NOT NULL,
    "callType" TEXT NOT NULL DEFAULT 'video',
    "status" TEXT NOT NULL DEFAULT 'Created',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_phone ON "Lead"("phone");
CREATE INDEX IF NOT EXISTS idx_leads_status ON "Lead"("status");
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON "Lead"("assignedExecutiveId");
CREATE INDEX IF NOT EXISTS idx_visitslots_date ON "VisitSlot"("date");
CREATE INDEX IF NOT EXISTS idx_callsessions_token ON "CallSession"("invitationToken");
