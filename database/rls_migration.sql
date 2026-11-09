-- ==============================================================================
-- PROPASSIST AI — ENTERPRISE DATABASE ROW LEVEL SECURITY (RLS) MIGRATION
-- Compliant with Supabase Security Advisor, DPDP 2023, and Least-Privilege RBAC
-- Target Schema: public
-- User Roles: SUPER_ADMIN, SALES_HEAD, SALES_EXECUTIVE, BUYER
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURITY DEFINER CONTEXT FUNCTIONS (Zero Frontend Trust)
-- Derive user identity, ID, email, and role exclusively from auth.uid()
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS text AS $$
  SELECT "id" FROM public."User"
  WHERE "supabaseId" = auth.uid()::text 
     OR "id" = auth.uid()::text
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
  SELECT "role" FROM public."User"
  WHERE "supabaseId" = auth.uid()::text 
     OR "id" = auth.uid()::text
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text AS $$
  SELECT LOWER("email") FROM public."User"
  WHERE "supabaseId" = auth.uid()::text 
     OR "id" = auth.uid()::text
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.current_user_phone()
RETURNS text AS $$
  SELECT "phone" FROM public."User"
  WHERE "supabaseId" = auth.uid()::text 
     OR "id" = auth.uid()::text
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."User"
    WHERE ("supabaseId" = auth.uid()::text OR "id" = auth.uid()::text)
      AND "role" IN ('ADMIN', 'SUPER_ADMIN')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_sales_head_or_above()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."User"
    WHERE ("supabaseId" = auth.uid()::text OR "id" = auth.uid()::text)
      AND "role" IN ('ADMIN', 'SUPER_ADMIN', 'SALES_HEAD')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_sales_executive()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."User"
    WHERE ("supabaseId" = auth.uid()::text OR "id" = auth.uid()::text)
      AND "role" = 'SALES_EXECUTIVE'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_buyer()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."User"
    WHERE ("supabaseId" = auth.uid()::text OR "id" = auth.uid()::text)
      AND "role" = 'BUYER'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Grant execution to authenticated & anon roles
GRANT EXECUTE ON FUNCTION public.current_user_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_user_phone() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_sales_head_or_above() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_sales_executive() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_buyer() TO authenticated, anon;


-- ==============================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON ALL 20 PUBLIC TABLES
-- ==============================================================================

ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CallSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CommunicationLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Consent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FactSheet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."InternalNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LeadAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProjectImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PropertyBooking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Reminder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Unit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VisitSlot" ENABLE ROW LEVEL SECURITY;


-- ==============================================================================
-- 3. DROP ANY OBSOLETE / PERMISSIVE POLICIES TO ENSURE CLEAN STATE
-- ==============================================================================

DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;


-- ==============================================================================
-- 4. DEFINE ROLE-BASED ACCESS POLICIES FOR EVERY TABLE
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table 1: "Project"
-- Catalog information (Publicly viewable when Active; managed by Admin/Sales Head)
-- ------------------------------------------------------------------------------
CREATE POLICY "project_select_policy" ON public."Project"
  FOR SELECT TO authenticated, anon
  USING (
    "status" = 'Active' 
    OR public.is_sales_head_or_above()
  );

CREATE POLICY "project_modify_policy" ON public."Project"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ------------------------------------------------------------------------------
-- Table 2: "ProjectImage"
-- Associated media for real estate developments
-- ------------------------------------------------------------------------------
CREATE POLICY "project_image_select_policy" ON public."ProjectImage"
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "project_image_modify_policy" ON public."ProjectImage"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ------------------------------------------------------------------------------
-- Table 3: "FactSheet"
-- Grounded project details, specifications, RERA data for AI and staff
-- ------------------------------------------------------------------------------
CREATE POLICY "factsheet_select_policy" ON public."FactSheet"
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "factsheet_modify_policy" ON public."FactSheet"
  FOR ALL TO authenticated
  USING (public.is_sales_head_or_above())
  WITH CHECK (public.is_sales_head_or_above());


-- ------------------------------------------------------------------------------
-- Table 4: "Unit"
-- Real-time residential inventory units
-- ------------------------------------------------------------------------------
CREATE POLICY "unit_select_policy" ON public."Unit"
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "unit_modify_policy" ON public."Unit"
  FOR ALL TO authenticated
  USING (public.is_sales_head_or_above())
  WITH CHECK (public.is_sales_head_or_above());


-- ------------------------------------------------------------------------------
-- Table 5: "VisitSlot"
-- VIP preview appointment slots
-- ------------------------------------------------------------------------------
CREATE POLICY "visitslot_select_policy" ON public."VisitSlot"
  FOR SELECT TO authenticated, anon
  USING ("isActive" = true OR public.is_sales_head_or_above());

CREATE POLICY "visitslot_modify_policy" ON public."VisitSlot"
  FOR ALL TO authenticated
  USING (public.is_sales_head_or_above())
  WITH CHECK (public.is_sales_head_or_above());


-- ------------------------------------------------------------------------------
-- Table 6: "Organization"
-- Developer legal entity and RERA license
-- ------------------------------------------------------------------------------
CREATE POLICY "organization_select_policy" ON public."Organization"
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "organization_modify_policy" ON public."Organization"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ------------------------------------------------------------------------------
-- Table 7: "User"
-- App profiles. Super Admin has full view; Sales Head views staff;
-- Executives and Buyers access ONLY their own profile.
-- ------------------------------------------------------------------------------
CREATE POLICY "user_admin_all_policy" ON public."User"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "user_sales_head_select_policy" ON public."User"
  FOR SELECT TO authenticated
  USING (
    public.is_sales_head_or_above()
    AND "role" IN ('SALES_EXECUTIVE', 'SALES_HEAD', 'BUYER')
  );

CREATE POLICY "user_self_select_policy" ON public."User"
  FOR SELECT TO authenticated
  USING (
    "id" = public.current_user_id() 
    OR "supabaseId" = auth.uid()::text
  );

CREATE POLICY "user_self_update_policy" ON public."User"
  FOR UPDATE TO authenticated
  USING (
    "id" = public.current_user_id() 
    OR "supabaseId" = auth.uid()::text
  )
  WITH CHECK (
    "id" = public.current_user_id() 
    OR "supabaseId" = auth.uid()::text
  );


-- ------------------------------------------------------------------------------
-- Table 8: "Lead"
-- Sales pipeline.
-- - Super Admin & Sales Head: Organization-wide access
-- - Sales Executive: ONLY currently assigned leads
-- - Buyer: ONLY own inquiry record (matched by verified email)
-- ------------------------------------------------------------------------------
CREATE POLICY "lead_management_all_policy" ON public."Lead"
  FOR ALL TO authenticated
  USING (public.is_sales_head_or_above())
  WITH CHECK (public.is_sales_head_or_above());

CREATE POLICY "lead_executive_select_policy" ON public."Lead"
  FOR SELECT TO authenticated
  USING (
    public.is_sales_executive()
    AND "assignedExecutiveId" = public.current_user_id()
  );

CREATE POLICY "lead_executive_update_policy" ON public."Lead"
  FOR UPDATE TO authenticated
  USING (
    public.is_sales_executive()
    AND "assignedExecutiveId" = public.current_user_id()
  )
  WITH CHECK (
    public.is_sales_executive()
    AND "assignedExecutiveId" = public.current_user_id()
  );

CREATE POLICY "lead_buyer_select_policy" ON public."Lead"
  FOR SELECT TO authenticated
  USING (
    LOWER("email") = public.current_user_email()
    OR ("phone" = public.current_user_phone() AND public.current_user_phone() IS NOT NULL)
  );

CREATE POLICY "lead_insert_policy" ON public."Lead"
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- Table 9: "InternalNote"
-- Strictly confidential executive notes. ZERO ACCESS for Buyers / Anon.
-- ------------------------------------------------------------------------------
CREATE POLICY "internal_note_management_policy" ON public."InternalNote"
  FOR ALL TO authenticated
  USING (public.is_sales_head_or_above())
  WITH CHECK (public.is_sales_head_or_above());

CREATE POLICY "internal_note_executive_select_policy" ON public."InternalNote"
  FOR SELECT TO authenticated
  USING (
    public.is_sales_executive()
    AND "leadId" IN (
      SELECT "id" FROM public."Lead" 
      WHERE "assignedExecutiveId" = public.current_user_id()
    )
  );

CREATE POLICY "internal_note_executive_insert_policy" ON public."InternalNote"
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_sales_executive()
    AND "authorId" = public.current_user_id()
    AND "leadId" IN (
      SELECT "id" FROM public."Lead" 
      WHERE "assignedExecutiveId" = public.current_user_id()
    )
  );


-- ------------------------------------------------------------------------------
-- Table 10: "LeadAssignment"
-- Audit trail of lead handoffs. ZERO ACCESS for Buyers / Anon.
-- ------------------------------------------------------------------------------
CREATE POLICY "lead_assignment_management_policy" ON public."LeadAssignment"
  FOR ALL TO authenticated
  USING (public.is_sales_head_or_above())
  WITH CHECK (public.is_sales_head_or_above());

CREATE POLICY "lead_assignment_executive_select_policy" ON public."LeadAssignment"
  FOR SELECT TO authenticated
  USING (
    public.is_sales_executive()
    AND "executiveId" = public.current_user_id()
  );


-- ------------------------------------------------------------------------------
-- Table 11: "Booking" (Site Visit Bookings)
-- - Super Admin & Sales Head: All bookings
-- - Sales Executive: Bookings for assigned leads or assigned visit slots
-- - Buyer: ONLY own bookings (matched by email or linked lead)
-- ------------------------------------------------------------------------------
CREATE POLICY "booking_management_policy" ON public."Booking"
  FOR ALL TO authenticated
  USING (public.is_sales_head_or_above())
  WITH CHECK (public.is_sales_head_or_above());

CREATE POLICY "booking_executive_select_policy" ON public."Booking"
  FOR SELECT TO authenticated
  USING (
    public.is_sales_executive()
    AND (
      "leadId" IN (
        SELECT "id" FROM public."Lead" 
        WHERE "assignedExecutiveId" = public.current_user_id()
      )
      OR "slotId" IN (
        SELECT "id" FROM public."VisitSlot" 
        WHERE "assignedExecutiveId" = public.current_user_id()
      )
    )
  );

CREATE POLICY "booking_executive_update_policy" ON public."Booking"
  FOR UPDATE TO authenticated
  USING (
    public.is_sales_executive()
    AND (
      "leadId" IN (
        SELECT "id" FROM public."Lead" 
        WHERE "assignedExecutiveId" = public.current_user_id()
      )
      OR "slotId" IN (
        SELECT "id" FROM public."VisitSlot" 
        WHERE "assignedExecutiveId" = public.current_user_id()
      )
    )
  )
  WITH CHECK (
    public.is_sales_executive()
    AND (
      "leadId" IN (
        SELECT "id" FROM public."Lead" 
        WHERE "assignedExecutiveId" = public.current_user_id()
      )
      OR "slotId" IN (
        SELECT "id" FROM public."VisitSlot" 
        WHERE "assignedExecutiveId" = public.current_user_id()
      )
    )
  );

CREATE POLICY "booking_buyer_select_policy" ON public."Booking"
  FOR SELECT TO authenticated
  USING (
    LOWER("buyerEmail") = public.current_user_email()
    OR "leadId" IN (
      SELECT "id" FROM public."Lead" 
      WHERE LOWER("email") = public.current_user_email()
    )
  );

CREATE POLICY "booking_buyer_update_policy" ON public."Booking"
  FOR UPDATE TO authenticated
  USING (
    LOWER("buyerEmail") = public.current_user_email()
    OR "leadId" IN (
      SELECT "id" FROM public."Lead" 
      WHERE LOWER("email") = public.current_user_email()
    )
  )
  WITH CHECK (
    LOWER("buyerEmail") = public.current_user_email()
    OR "leadId" IN (
      SELECT "id" FROM public."Lead" 
      WHERE LOWER("email") = public.current_user_email()
    )
  );

CREATE POLICY "booking_insert_policy" ON public."Booking"
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- Table 12: "PropertyBooking" (Apartment Allotment & Advance Booking)
-- - Super Admin & Sales Head: All bookings (approval/rejection)
-- - Sales Executive: View bookings for assigned leads
-- - Buyer: ONLY own booked units and issued allotment letters
-- ------------------------------------------------------------------------------
CREATE POLICY "property_booking_management_policy" ON public."PropertyBooking"
  FOR ALL TO authenticated
  USING (public.is_sales_head_or_above())
  WITH CHECK (public.is_sales_head_or_above());

CREATE POLICY "property_booking_executive_select_policy" ON public."PropertyBooking"
  FOR SELECT TO authenticated
  USING (
    public.is_sales_executive()
    AND (
      "assignedExecutiveId" = public.current_user_id()
      OR "buyerId" IN (
        SELECT "id" FROM public."User" 
        WHERE "email" IN (
          SELECT "email" FROM public."Lead" 
          WHERE "assignedExecutiveId" = public.current_user_id()
        )
      )
    )
  );

CREATE POLICY "property_booking_buyer_select_policy" ON public."PropertyBooking"
  FOR SELECT TO authenticated
  USING (
    "buyerId" = public.current_user_id()
    OR LOWER("buyerEmail") = public.current_user_email()
  );

CREATE POLICY "property_booking_buyer_insert_policy" ON public."PropertyBooking"
  FOR INSERT TO authenticated
  WITH CHECK (
    "buyerId" = public.current_user_id()
    OR LOWER("buyerEmail") = public.current_user_email()
  );


-- ------------------------------------------------------------------------------
-- Table 13: "Payment" (Razorpay Token Advances & Verified Escrow Ledger)
-- - Super Admin & Sales Head: All transactions
-- - Sales Executive: View payments for assigned buyers
-- - Buyer: View ONLY own payment transactions & receipts
-- ------------------------------------------------------------------------------
CREATE POLICY "payment_management_policy" ON public."Payment"
  FOR ALL TO authenticated
  USING (public.is_sales_head_or_above())
  WITH CHECK (public.is_sales_head_or_above());

CREATE POLICY "payment_executive_select_policy" ON public."Payment"
  FOR SELECT TO authenticated
  USING (
    public.is_sales_executive()
    AND (
      "buyerId" IN (
        SELECT "id" FROM public."User" 
        WHERE "email" IN (
          SELECT "email" FROM public."Lead" 
          WHERE "assignedExecutiveId" = public.current_user_id()
        )
      )
      OR LOWER("buyerEmail") IN (
        SELECT LOWER("email") FROM public."Lead" 
        WHERE "assignedExecutiveId" = public.current_user_id()
      )
    )
  );

CREATE POLICY "payment_buyer_select_policy" ON public."Payment"
  FOR SELECT TO authenticated
  USING (
    "buyerId" = public.current_user_id()
    OR LOWER("buyerEmail") = public.current_user_email()
  );

CREATE POLICY "payment_buyer_insert_policy" ON public."Payment"
  FOR INSERT TO authenticated
  WITH CHECK (
    "buyerId" = public.current_user_id()
    OR LOWER("buyerEmail") = public.current_user_email()
  );


-- ------------------------------------------------------------------------------
-- Table 14: "Conversation"
-- Real-time chat dialogue sessions
-- ------------------------------------------------------------------------------
CREATE POLICY "conversation_management_policy" ON public."Conversation"
  FOR ALL TO authenticated
  USING (public.is_sales_head_or_above())
  WITH CHECK (public.is_sales_head_or_above());

CREATE POLICY "conversation_executive_policy" ON public."Conversation"
  FOR ALL TO authenticated
  USING (
    public.is_sales_executive()
    AND (
      "handedOffToId" = public.current_user_id()
      OR "leadId" IN (
        SELECT "id" FROM public."Lead" 
        WHERE "assignedExecutiveId" = public.current_user_id()
      )
    )
  )
  WITH CHECK (
    public.is_sales_executive()
    AND (
      "handedOffToId" = public.current_user_id()
      OR "leadId" IN (
        SELECT "id" FROM public."Lead" 
        WHERE "assignedExecutiveId" = public.current_user_id()
      )
    )
  );

CREATE POLICY "conversation_buyer_select_policy" ON public."Conversation"
  FOR SELECT TO authenticated
  USING (
    "leadId" IN (
      SELECT "id" FROM public."Lead" 
      WHERE LOWER("email") = public.current_user_email()
    )
  );

CREATE POLICY "conversation_insert_policy" ON public."Conversation"
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- Table 15: "Message"
-- Individual chat entries
-- ------------------------------------------------------------------------------
CREATE POLICY "message_management_policy" ON public."Message"
  FOR ALL TO authenticated
  USING (public.is_sales_head_or_above())
  WITH CHECK (public.is_sales_head_or_above());

CREATE POLICY "message_executive_policy" ON public."Message"
  FOR ALL TO authenticated
  USING (
    public.is_sales_executive()
    AND "conversationId" IN (
      SELECT "id" FROM public."Conversation"
      WHERE "handedOffToId" = public.current_user_id()
         OR "leadId" IN (
           SELECT "id" FROM public."Lead" 
           WHERE "assignedExecutiveId" = public.current_user_id()
         )
    )
  )
  WITH CHECK (
    public.is_sales_executive()
    AND "conversationId" IN (
      SELECT "id" FROM public."Conversation"
      WHERE "handedOffToId" = public.current_user_id()
         OR "leadId" IN (
           SELECT "id" FROM public."Lead" 
           WHERE "assignedExecutiveId" = public.current_user_id()
         )
    )
  );

CREATE POLICY "message_buyer_select_policy" ON public."Message"
  FOR SELECT TO authenticated
  USING (
    "conversationId" IN (
      SELECT "id" FROM public."Conversation"
      WHERE "leadId" IN (
        SELECT "id" FROM public."Lead" 
        WHERE LOWER("email") = public.current_user_email()
      )
    )
  );

CREATE POLICY "message_buyer_insert_policy" ON public."Message"
  FOR INSERT TO authenticated
  WITH CHECK (
    "conversationId" IN (
      SELECT "id" FROM public."Conversation"
      WHERE "leadId" IN (
        SELECT "id" FROM public."Lead" 
        WHERE LOWER("email") = public.current_user_email()
      )
    )
  );

CREATE POLICY "message_anon_insert_policy" ON public."Message"
  FOR INSERT TO anon
  WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- Table 16: "CallSession"
-- WebRTC audio & Jitsi Meet video consultation sessions
-- ------------------------------------------------------------------------------
CREATE POLICY "call_session_management_policy" ON public."CallSession"
  FOR ALL TO authenticated
  USING (public.is_sales_head_or_above())
  WITH CHECK (public.is_sales_head_or_above());

CREATE POLICY "call_session_executive_policy" ON public."CallSession"
  FOR ALL TO authenticated
  USING (
    public.is_sales_executive()
    AND "executiveId" = public.current_user_id()
  )
  WITH CHECK (
    public.is_sales_executive()
    AND "executiveId" = public.current_user_id()
  );

CREATE POLICY "call_session_buyer_select_policy" ON public."CallSession"
  FOR SELECT TO authenticated
  USING (
    "buyerId" = public.current_user_id()
    OR "leadId" IN (
      SELECT "id" FROM public."Lead" 
      WHERE LOWER("email") = public.current_user_email()
    )
  );

CREATE POLICY "call_session_buyer_insert_policy" ON public."CallSession"
  FOR INSERT TO authenticated
  WITH CHECK (
    "buyerId" = public.current_user_id()
    OR "leadId" IN (
      SELECT "id" FROM public."Lead" 
      WHERE LOWER("email") = public.current_user_email()
    )
  );

CREATE POLICY "call_session_token_anon_policy" ON public."CallSession"
  FOR SELECT TO anon
  USING ("invitationToken" IS NOT NULL);


-- ------------------------------------------------------------------------------
-- Table 17: "CommunicationLog"
-- Outbound WhatsApp wa.me & SMS simulation delivery log
-- ------------------------------------------------------------------------------
CREATE POLICY "comm_log_management_policy" ON public."CommunicationLog"
  FOR ALL TO authenticated
  USING (public.is_sales_head_or_above())
  WITH CHECK (public.is_sales_head_or_above());

CREATE POLICY "comm_log_executive_select_policy" ON public."CommunicationLog"
  FOR SELECT TO authenticated
  USING (
    public.is_sales_executive()
    AND (
      "userId" = public.current_user_id()
      OR "leadId" IN (
        SELECT "id" FROM public."Lead" 
        WHERE "assignedExecutiveId" = public.current_user_id()
      )
    )
  );

CREATE POLICY "comm_log_buyer_select_policy" ON public."CommunicationLog"
  FOR SELECT TO authenticated
  USING (
    "userId" = public.current_user_id()
    OR "leadId" IN (
      SELECT "id" FROM public."Lead" 
      WHERE LOWER("email") = public.current_user_email()
    )
  );


-- ------------------------------------------------------------------------------
-- Table 18: "Reminder"
-- Automated 24h & 2h site visit reminders. Zero buyer access.
-- ------------------------------------------------------------------------------
CREATE POLICY "reminder_management_policy" ON public."Reminder"
  FOR ALL TO authenticated
  USING (public.is_sales_head_or_above())
  WITH CHECK (public.is_sales_head_or_above());

CREATE POLICY "reminder_executive_select_policy" ON public."Reminder"
  FOR SELECT TO authenticated
  USING (
    public.is_sales_executive()
    AND "leadId" IN (
      SELECT "id" FROM public."Lead" 
      WHERE "assignedExecutiveId" = public.current_user_id()
    )
  );


-- ------------------------------------------------------------------------------
-- Table 19: "Consent"
-- DPDP 2023 Digital Consent Registry
-- ------------------------------------------------------------------------------
CREATE POLICY "consent_management_policy" ON public."Consent"
  FOR ALL TO authenticated
  USING (public.is_sales_head_or_above())
  WITH CHECK (public.is_sales_head_or_above());

CREATE POLICY "consent_executive_select_policy" ON public."Consent"
  FOR SELECT TO authenticated
  USING (
    public.is_sales_executive()
    AND LOWER("leadEmail") IN (
      SELECT LOWER("email") FROM public."Lead" 
      WHERE "assignedExecutiveId" = public.current_user_id()
    )
  );

CREATE POLICY "consent_buyer_select_policy" ON public."Consent"
  FOR SELECT TO authenticated
  USING (LOWER("leadEmail") = public.current_user_email());

CREATE POLICY "consent_insert_policy" ON public."Consent"
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- Table 20: "AuditLog"
-- Append-only system audit log. Immutable regulatory record.
-- ------------------------------------------------------------------------------
CREATE POLICY "audit_log_admin_select_policy" ON public."AuditLog"
  FOR SELECT TO authenticated
  USING (public.is_sales_head_or_above());

CREATE POLICY "audit_log_insert_policy" ON public."AuditLog"
  FOR INSERT TO authenticated
  WITH CHECK (true);

