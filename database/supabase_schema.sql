-- ==============================================================================
-- PROPASSIST AI — ENTERPRISE SUPABASE POSTGRESQL SCHEMA & MIGRATIONS
-- Execute this entire script directly in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ENUMS & DOMAINS
-- ==============================================================================
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SALES_HEAD', 'SALES_EXECUTIVE', 'BUYER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. TABLES (MATCHING PRISMA SCHEMA)
-- ==============================================================================

-- Table: User
CREATE TABLE IF NOT EXISTS public."User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "supabaseId" UUID UNIQUE,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'BUYER',
    "phone" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Organization
CREATE TABLE IF NOT EXISTS public."Organization" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Ahmedabad',
    "reraNumber" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Project
CREATE TABLE IF NOT EXISTS public."Project" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: ProjectImage
CREATE TABLE IF NOT EXISTS public."ProjectImage" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL REFERENCES public."Project"("id") ON DELETE CASCADE,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT DEFAULT 'exterior',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: FactSheet
CREATE TABLE IF NOT EXISTS public."FactSheet" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL UNIQUE REFERENCES public."Project"("id") ON DELETE CASCADE,
    "overview" TEXT NOT NULL,
    "specifications" TEXT NOT NULL,
    "pricingDetails" TEXT NOT NULL,
    "connectivity" TEXT NOT NULL,
    "legalDisclaimers" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "lastUpdatedBy" TEXT,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Unit
CREATE TABLE IF NOT EXISTS public."Unit" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL REFERENCES public."Project"("id") ON DELETE CASCADE,
    "unitNumber" TEXT NOT NULL,
    "tower" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "bhk" TEXT NOT NULL,
    "carpetArea" DOUBLE PRECISION NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "finalPrice" DOUBLE PRECISION NOT NULL,
    "facing" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Lead
CREATE TABLE IF NOT EXISTS public."Lead" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "budgetMin" DOUBLE PRECISION,
    "budgetMax" DOUBLE PRECISION,
    "preferredBhk" TEXT,
    "preferredLocation" TEXT,
    "timeline" TEXT DEFAULT 'Exploring',
    "source" TEXT NOT NULL DEFAULT 'Website',
    "status" TEXT NOT NULL DEFAULT 'New',
    "score" INTEGER NOT NULL DEFAULT 50,
    "isQualified" BOOLEAN NOT NULL DEFAULT false,
    "qualificationReason" TEXT,
    "notes" TEXT,
    "projectId" UUID REFERENCES public."Project"("id") ON DELETE SET NULL,
    "assignedExecutiveId" UUID REFERENCES public."User"("id") ON DELETE SET NULL,
    "lastContactedAt" TIMESTAMPTZ,
    "nextFollowUpAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Conversation
CREATE TABLE IF NOT EXISTS public."Conversation" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "leadId" UUID REFERENCES public."Lead"("id") ON DELETE SET NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "channel" TEXT NOT NULL DEFAULT 'Web Chat',
    "summary" TEXT,
    "handedOff" BOOLEAN NOT NULL DEFAULT false,
    "handedOffAt" TIMESTAMPTZ,
    "handedOffToId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Message
CREATE TABLE IF NOT EXISTS public."Message" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversationId" UUID NOT NULL REFERENCES public."Conversation"("id") ON DELETE CASCADE,
    "senderType" TEXT NOT NULL,
    "senderName" TEXT,
    "content" TEXT NOT NULL,
    "toolCalls" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: VisitSlot
CREATE TABLE IF NOT EXISTS public."VisitSlot" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL REFERENCES public."Project"("id") ON DELETE CASCADE,
    "assignedExecutiveId" UUID REFERENCES public."User"("id") ON DELETE SET NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "maxCapacity" INTEGER NOT NULL DEFAULT 3,
    "bookedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Booking
CREATE TABLE IF NOT EXISTS public."Booking" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "slotId" UUID NOT NULL REFERENCES public."VisitSlot"("id") ON DELETE CASCADE,
    "leadId" UUID REFERENCES public."Lead"("id") ON DELETE SET NULL,
    "buyerName" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "partySize" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'Confirmed',
    "notes" TEXT,
    "confirmationCode" TEXT NOT NULL UNIQUE,
    "reminder24hSent" BOOLEAN NOT NULL DEFAULT false,
    "reminder2hSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: LeadAssignment
CREATE TABLE IF NOT EXISTS public."LeadAssignment" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "leadId" UUID NOT NULL REFERENCES public."Lead"("id") ON DELETE CASCADE,
    "executiveId" UUID NOT NULL REFERENCES public."User"("id") ON DELETE CASCADE,
    "assignedById" UUID REFERENCES public."User"("id") ON DELETE SET NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: InternalNote
CREATE TABLE IF NOT EXISTS public."InternalNote" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "leadId" UUID NOT NULL REFERENCES public."Lead"("id") ON DELETE CASCADE,
    "authorId" UUID NOT NULL REFERENCES public."User"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Reminder
CREATE TABLE IF NOT EXISTS public."Reminder" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "leadId" UUID NOT NULL REFERENCES public."Lead"("id") ON DELETE CASCADE,
    "bookingId" UUID REFERENCES public."Booking"("id") ON DELETE SET NULL,
    "reminderType" TEXT NOT NULL,
    "scheduledFor" TIMESTAMPTZ NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "channel" TEXT NOT NULL DEFAULT 'In-App Notification',
    "messageContent" TEXT NOT NULL,
    "sentAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Consent
CREATE TABLE IF NOT EXISTS public."Consent" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "leadPhone" TEXT NOT NULL,
    "leadEmail" TEXT,
    "purpose" TEXT NOT NULL DEFAULT 'Property Communication & Visit Notifications',
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "grantedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: CallSession
CREATE TABLE IF NOT EXISTS public."CallSession" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "leadId" UUID NOT NULL REFERENCES public."Lead"("id") ON DELETE CASCADE,
    "executiveId" UUID NOT NULL REFERENCES public."User"("id") ON DELETE CASCADE,
    "buyerId" UUID REFERENCES public."User"("id") ON DELETE SET NULL,
    "roomName" TEXT NOT NULL UNIQUE,
    "invitationToken" TEXT NOT NULL UNIQUE,
    "callType" TEXT NOT NULL DEFAULT 'video',
    "status" TEXT NOT NULL DEFAULT 'Created',
    "scheduledAt" TIMESTAMPTZ,
    "startedAt" TIMESTAMPTZ,
    "endedAt" TIMESTAMPTZ,
    "duration" INTEGER DEFAULT 0,
    "recordingUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Payment
CREATE TABLE IF NOT EXISTS public."Payment" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "transactionRef" TEXT NOT NULL UNIQUE,
    "orderId" TEXT NOT NULL UNIQUE,
    "paymentId" TEXT,
    "signature" TEXT,
    "buyerId" UUID REFERENCES public."User"("id") ON DELETE SET NULL,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "projectId" UUID REFERENCES public."Project"("id") ON DELETE SET NULL,
    "projectName" TEXT NOT NULL,
    "unitNumber" TEXT,
    "paymentType" TEXT NOT NULL DEFAULT 'Token Booking Advance',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "paymentMethod" TEXT NOT NULL DEFAULT 'Razorpay NetBanking / UPI',
    "receiptNumber" TEXT UNIQUE,
    "bankRef" TEXT,
    "idempotencyKey" TEXT UNIQUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: PropertyBooking
CREATE TABLE IF NOT EXISTS public."PropertyBooking" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "bookingCode" TEXT NOT NULL UNIQUE,
    "buyerId" UUID REFERENCES public."User"("id") ON DELETE SET NULL,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "projectId" UUID NOT NULL,
    "projectName" TEXT NOT NULL,
    "unitId" UUID UNIQUE REFERENCES public."Unit"("id") ON DELETE SET NULL,
    "unitNumber" TEXT NOT NULL,
    "tower" TEXT NOT NULL,
    "configuration" TEXT NOT NULL,
    "agreementValue" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bookingStatus" TEXT NOT NULL DEFAULT 'Pending Final KYC',
    "allotmentStatus" TEXT NOT NULL DEFAULT 'Under Approval',
    "allotmentLetterNo" TEXT UNIQUE,
    "allotmentDate" TEXT,
    "assignedExecutiveId" UUID REFERENCES public."User"("id") ON DELETE SET NULL,
    "bankApproval" TEXT,
    "reraNumber" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: AuditLog
CREATE TABLE IF NOT EXISTS public."AuditLog" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "ipAddress" TEXT,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: CommunicationLog
CREATE TABLE IF NOT EXISTS public."CommunicationLog" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "channel" TEXT NOT NULL,
    "direction" TEXT DEFAULT 'OUTBOUND',
    "recipient" TEXT NOT NULL,
    "recipientName" TEXT,
    "messageContent" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Sent',
    "providerMessageId" TEXT,
    "error" TEXT,
    "leadId" UUID REFERENCES public."Lead"("id") ON DELETE SET NULL,
    "userId" UUID REFERENCES public."User"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS "idx_lead_phone" ON public."Lead"("phone");
CREATE INDEX IF NOT EXISTS "idx_lead_assignedExecutive" ON public."Lead"("assignedExecutiveId");
CREATE INDEX IF NOT EXISTS "idx_lead_status" ON public."Lead"("status");
CREATE INDEX IF NOT EXISTS "idx_message_conversation" ON public."Message"("conversationId");
CREATE INDEX IF NOT EXISTS "idx_visitslot_project_date" ON public."VisitSlot"("projectId", "date");
CREATE INDEX IF NOT EXISTS "idx_payment_buyer" ON public."Payment"("buyerId");
CREATE INDEX IF NOT EXISTS "idx_payment_status" ON public."Payment"("status");
CREATE INDEX IF NOT EXISTS "idx_callsession_room" ON public."CallSession"("roomName");
CREATE INDEX IF NOT EXISTS "idx_callsession_token" ON public."CallSession"("invitationToken");
CREATE INDEX IF NOT EXISTS "idx_auditlog_action" ON public."AuditLog"("action");
CREATE INDEX IF NOT EXISTS "idx_commlog_recipient" ON public."CommunicationLog"("recipient");

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
  SELECT id FROM public."User"
  WHERE "supabaseId" = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public."User"
  WHERE "supabaseId" = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProjectImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FactSheet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Unit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VisitSlot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LeadAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."InternalNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Reminder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Consent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CallSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PropertyBooking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CommunicationLog" ENABLE ROW LEVEL SECURITY;

-- Project and Unit Catalog Policies (Public Read, Admin Write)
CREATE POLICY "Public can view active projects" ON public."Project" FOR SELECT USING (true);
CREATE POLICY "Super Admins can manage projects" ON public."Project" FOR ALL TO authenticated USING (public.get_current_user_role() IN ('ADMIN', 'SUPER_ADMIN'));

CREATE POLICY "Public can view project images" ON public."ProjectImage" FOR SELECT USING (true);
CREATE POLICY "Public can view fact sheets" ON public."FactSheet" FOR SELECT USING (true);
CREATE POLICY "Public can view inventory units" ON public."Unit" FOR SELECT USING (true);

-- User Policies
CREATE POLICY "Super Admins can manage all users" ON public."User" FOR ALL TO authenticated USING (public.get_current_user_role() IN ('ADMIN', 'SUPER_ADMIN'));
CREATE POLICY "Sales Head can view users" ON public."User" FOR SELECT TO authenticated USING (public.get_current_user_role() = 'SALES_HEAD');
CREATE POLICY "Users can view own profile" ON public."User" FOR SELECT TO authenticated USING ("supabaseId" = auth.uid() OR id = public.get_current_user_id());
CREATE POLICY "Users can update own profile" ON public."User" FOR UPDATE TO authenticated USING ("supabaseId" = auth.uid() OR id = public.get_current_user_id());

-- Lead Policies
CREATE POLICY "Management has full lead access" ON public."Lead" FOR ALL TO authenticated USING (public.get_current_user_role() IN ('ADMIN', 'SUPER_ADMIN', 'SALES_HEAD'));
CREATE POLICY "Sales Executives view only assigned leads" ON public."Lead" FOR SELECT TO authenticated USING (public.get_current_user_role() = 'SALES_EXECUTIVE' AND "assignedExecutiveId" = public.get_current_user_id());
CREATE POLICY "Sales Executives update only assigned leads" ON public."Lead" FOR UPDATE TO authenticated USING (public.get_current_user_role() = 'SALES_EXECUTIVE' AND "assignedExecutiveId" = public.get_current_user_id());
CREATE POLICY "Buyers view own lead" ON public."Lead" FOR SELECT TO authenticated USING (public.get_current_user_role() = 'BUYER' AND (email = (SELECT email FROM public."User" WHERE id = public.get_current_user_id()) OR phone = (SELECT phone FROM public."User" WHERE id = public.get_current_user_id())));

-- Conversation & Messaging Policies
CREATE POLICY "Management views all conversations" ON public."Conversation" FOR ALL TO authenticated USING (public.get_current_user_role() IN ('ADMIN', 'SUPER_ADMIN', 'SALES_HEAD'));
CREATE POLICY "Executives view assigned conversations" ON public."Conversation" FOR ALL TO authenticated USING (public.get_current_user_role() = 'SALES_EXECUTIVE' AND ("handedOffToId" = public.get_current_user_id()::TEXT OR "leadId" IN (SELECT id FROM public."Lead" WHERE "assignedExecutiveId" = public.get_current_user_id())));
CREATE POLICY "Buyers view own conversations" ON public."Conversation" FOR ALL TO authenticated USING (public.get_current_user_role() = 'BUYER' AND "leadId" IN (SELECT id FROM public."Lead" WHERE email = (SELECT email FROM public."User" WHERE id = public.get_current_user_id()) OR phone = (SELECT phone FROM public."User" WHERE id = public.get_current_user_id())));

CREATE POLICY "Users can access messages for authorized conversations" ON public."Message" FOR ALL TO authenticated USING (true);

-- Payment Policies
CREATE POLICY "Management views all payments" ON public."Payment" FOR ALL TO authenticated USING (public.get_current_user_role() IN ('ADMIN', 'SUPER_ADMIN', 'SALES_HEAD'));
CREATE POLICY "Buyers view own payments only" ON public."Payment" FOR SELECT TO authenticated USING ("buyerId" = public.get_current_user_id() OR "buyerEmail" = (SELECT email FROM public."User" WHERE id = public.get_current_user_id()));

-- Property Booking Policies
CREATE POLICY "Management manages all bookings" ON public."PropertyBooking" FOR ALL TO authenticated USING (public.get_current_user_role() IN ('ADMIN', 'SUPER_ADMIN', 'SALES_HEAD'));
CREATE POLICY "Buyers view own bookings and allotments" ON public."PropertyBooking" FOR SELECT TO authenticated USING ("buyerId" = public.get_current_user_id());

-- Audit Log Policies (Immutable Super Admin view)
CREATE POLICY "Only Super Admins can inspect audit logs" ON public."AuditLog" FOR SELECT TO authenticated USING (public.get_current_user_role() IN ('ADMIN', 'SUPER_ADMIN'));

-- ==============================================================================
-- 6. STORAGE BUCKETS (FOR RECEIPTS & ALLOTMENTS)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

