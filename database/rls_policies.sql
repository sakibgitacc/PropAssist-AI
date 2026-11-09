-- ==============================================================================
-- PROPASSIST AI — SUPABASE POSTGRESQL ROW LEVEL SECURITY (RLS) POLICIES
-- Execute this SQL script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Enforces strict role-based access control and tenant-level data isolation.
-- ==============================================================================

-- 1. Helper function to extract current authenticated user's internal ID
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
  SELECT id FROM public."User"
  WHERE "supabaseId" = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Helper function to extract current authenticated user's verified role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public."User"
  WHERE "supabaseId" = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 3. USER PROFILES ("User" table)
-- ==============================================================================
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Super Admin has full platform access
CREATE POLICY "Super Admins can manage all users"
ON public."User"
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('ADMIN', 'SUPER_ADMIN'));

-- Sales Head can view all users in the organization
CREATE POLICY "Sales Head can view users"
ON public."User"
FOR SELECT
TO authenticated
USING (public.get_current_user_role() = 'SALES_HEAD');

-- Individuals can view and edit only their own profile
CREATE POLICY "Users can view own profile"
ON public."User"
FOR SELECT
TO authenticated
USING ("supabaseId" = auth.uid() OR id = public.get_current_user_id());

CREATE POLICY "Users can update own profile"
ON public."User"
FOR UPDATE
TO authenticated
USING ("supabaseId" = auth.uid() OR id = public.get_current_user_id());

-- ==============================================================================
-- 4. LEADS & BUYER PROFILES ("Lead" table)
-- ==============================================================================
ALTER TABLE public."Lead" ENABLE ROW LEVEL SECURITY;

-- Super Admin and Sales Head can manage all leads
CREATE POLICY "Management has full lead access"
ON public."Lead"
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('ADMIN', 'SUPER_ADMIN', 'SALES_HEAD'));

-- Sales Executives can access ONLY leads currently assigned to them
CREATE POLICY "Sales Executives view only assigned leads"
ON public."Lead"
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() = 'SALES_EXECUTIVE' AND
  "assignedExecutiveId" = public.get_current_user_id()
);

CREATE POLICY "Sales Executives update only assigned leads"
ON public."Lead"
FOR UPDATE
TO authenticated
USING (
  public.get_current_user_role() = 'SALES_EXECUTIVE' AND
  "assignedExecutiveId" = public.get_current_user_id()
);

-- Buyers can only view leads that match their registered verified email/phone
CREATE POLICY "Buyers view only own lead record"
ON public."Lead"
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() = 'BUYER' AND
  (email = (SELECT email FROM public."User" WHERE id = public.get_current_user_id()) OR
   phone = (SELECT phone FROM public."User" WHERE id = public.get_current_user_id()))
);

-- ==============================================================================
-- 5. PAYMENTS & VERIFIED RECEIPTS ("Payment" table)
-- ==============================================================================
ALTER TABLE public."Payment" ENABLE ROW LEVEL SECURITY;

-- Management access
CREATE POLICY "Management views all payments"
ON public."Payment"
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('ADMIN', 'SUPER_ADMIN', 'SALES_HEAD'));

-- Buyers can strictly view and download ONLY their own payment receipts
CREATE POLICY "Buyers view own payments only"
ON public."Payment"
FOR SELECT
TO authenticated
USING (
  "buyerId" = public.get_current_user_id() OR
  "buyerEmail" = (SELECT email FROM public."User" WHERE id = public.get_current_user_id())
);

-- ==============================================================================
-- 6. PROPERTY BOOKINGS & ALLOTMENTS ("PropertyBooking" table)
-- ==============================================================================
ALTER TABLE public."PropertyBooking" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Management manages all bookings"
ON public."PropertyBooking"
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('ADMIN', 'SUPER_ADMIN', 'SALES_HEAD'));

CREATE POLICY "Buyers view own bookings and allotments"
ON public."PropertyBooking"
FOR SELECT
TO authenticated
USING ("buyerId" = public.get_current_user_id());

-- ==============================================================================
-- 7. SITE VISIT APPOINTMENTS ("Booking" table)
-- ==============================================================================
ALTER TABLE public."Booking" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Management views all visits"
ON public."Booking"
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('ADMIN', 'SUPER_ADMIN', 'SALES_HEAD'));

CREATE POLICY "Executives view assigned visits"
ON public."Booking"
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() = 'SALES_EXECUTIVE' AND
  "slotId" IN (SELECT id FROM public."VisitSlot" WHERE "assignedExecutiveId" = public.get_current_user_id())
);

CREATE POLICY "Buyers view own visit passes"
ON public."Booking"
FOR SELECT
TO authenticated


USING ("buyerEmail" = (SELECT email FROM public."User" WHERE id = public.get_current_user_id()));

-- ==============================================================================
-- 8. AUDIT LOGS ("AuditLog" table)
-- ==============================================================================
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;

-- Immutable audit logs: Super Admin read-only access
CREATE POLICY "Only Super Admins can inspect audit logs"
ON public."AuditLog"
FOR SELECT
TO authenticated
USING (public.get_current_user_role() IN ('ADMIN', 'SUPER_ADMIN'));

-- ==============================================================================
-- 9. SERVICE ROLE BYPASS
-- The backend server connecting with service_role key automatically bypasses RLS
-- to execute verified business workflows and PDF streaming.
-- ==============================================================================
