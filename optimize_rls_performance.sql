-- ============================================================================
-- OPTIMIZED RLS POLICIES - PERFORMANCE FIX
-- ============================================================================
-- This script fixes 84 performance warnings from Supabase Performance Advisor
-- Changes: auth.uid() → (select auth.uid()) to prevent row-by-row evaluation
-- 
-- BACKUP: rollback_rls_optimization.sql (run that if issues occur)
-- Created: 2025-12-19
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Drop existing policies
-- ============================================================================
DROP POLICY IF EXISTS "regions_admin" ON public.regions;

DROP POLICY IF EXISTS "user_roles_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_read_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "leads_admin" ON public.leads;
DROP POLICY IF EXISTS "leads_manager_select" ON public.leads;
DROP POLICY IF EXISTS "leads_manager_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_manager_update" ON public.leads;
DROP POLICY IF EXISTS "leads_sales_select" ON public.leads;
DROP POLICY IF EXISTS "leads_sales_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_sales_update" ON public.leads;

DROP POLICY IF EXISTS "clients_admin" ON public.clients;
DROP POLICY IF EXISTS "clients_manager_select" ON public.clients;
DROP POLICY IF EXISTS "clients_sales_select" ON public.clients;

DROP POLICY IF EXISTS "activities_admin" ON public.activities;

DROP POLICY IF EXISTS "inventory_categories_admin" ON public.inventory_categories;
DROP POLICY IF EXISTS "Allow admins to create inventory categories" ON public.inventory_categories;

DROP POLICY IF EXISTS "inventory_items_admin" ON public.inventory_items;
DROP POLICY IF EXISTS "Allow admins and managers to create inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Allow admins and managers to update inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Allow admins to delete inventory items" ON public.inventory_items;

DROP POLICY IF EXISTS "quotes_admin" ON public.quotes;
DROP POLICY IF EXISTS "quotes_manager" ON public.quotes;
DROP POLICY IF EXISTS "quotes_sales_select" ON public.quotes;
DROP POLICY IF EXISTS "quotes_sales_insert" ON public.quotes;
DROP POLICY IF EXISTS "quotes_sales_update" ON public.quotes;
DROP POLICY IF EXISTS "Quotes Allow All" ON public.quotes;

DROP POLICY IF EXISTS "quote_items_admin" ON public.quote_items;
DROP POLICY IF EXISTS "quote_items_manager" ON public.quote_items;
DROP POLICY IF EXISTS "Quote Items Allow All" ON public.quote_items;

DROP POLICY IF EXISTS "invoices_admin" ON public.invoices;
DROP POLICY IF EXISTS "invoices_manager" ON public.invoices;
DROP POLICY IF EXISTS "invoices_sales_select" ON public.invoices;
DROP POLICY IF EXISTS "Invoices Allow All" ON public.invoices;

DROP POLICY IF EXISTS "invoice_items_admin" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_manager" ON public.invoice_items;
DROP POLICY IF EXISTS "Invoice Items Allow All" ON public.invoice_items;

DROP POLICY IF EXISTS "reservations_admin" ON public.reservations;
DROP POLICY IF EXISTS "reservations_manager" ON public.reservations;

DROP POLICY IF EXISTS "documents_admin" ON public.documents;
DROP POLICY IF EXISTS "documents_select" ON public.documents;

DROP POLICY IF EXISTS "lead_import_logs_admin" ON public.lead_import_logs;

-- ============================================================================
-- STEP 2: Create OPTIMIZED policies for ALL affected tables
-- ============================================================================

-- REGIONS - Optimized
-- ========================================
CREATE POLICY "regions_admin" ON public.regions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'admin'
    )
  );

-- USER_ROLES - Optimized
-- ========================================
CREATE POLICY "user_roles_admin" ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'admin'
    )
  );

CREATE POLICY "user_roles_read_own" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));  -- ✅ OPTIMIZED

CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));  -- ✅ OPTIMIZED

-- PROFILES - Optimized
-- ========================================
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));  -- ✅ OPTIMIZED

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()));  -- ✅ OPTIMIZED

-- LEADS - Optimized (most warnings)
-- ========================================
CREATE POLICY "leads_admin" ON public.leads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'admin'
    )
  );

CREATE POLICY "leads_manager_select" ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'manager'
      AND region_id = leads.region_id
    )
  );

CREATE POLICY "leads_manager_insert" ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'manager'
    )
  );

CREATE POLICY "leads_manager_update" ON public.leads
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'manager'
      AND region_id = leads.region_id
    )
  );

CREATE POLICY "leads_sales_select" ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'sales'
      AND id = leads.assigned_user_id
    )
  );

CREATE POLICY "leads_sales_insert" ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'sales'
    )
  );

CREATE POLICY "leads_sales_update" ON public.leads
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'sales'
      AND id = leads.assigned_user_id
    )
  );

-- CLIENTS - Optimized
-- ========================================
CREATE POLICY "clients_admin" ON public.clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'admin'
    )
  );

CREATE POLICY "clients_manager_select" ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'manager'
      AND region_id = clients.region_id
    )
  );

CREATE POLICY "clients_sales_select" ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'sales'
      AND id = clients.assigned_user_id
    )
  );

-- ACTIVITIES - Optimized
-- ========================================
CREATE POLICY "activities_admin" ON public.activities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'admin'
    )
  );

-- INVENTORY_CATEGORIES - Optimized
-- ========================================
CREATE POLICY "inventory_categories_admin" ON public.inventory_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'admin'
    )
  );

CREATE POLICY "Allow admins to create inventory categories" ON public.inventory_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'admin'
    )
  );

-- INVENTORY_ITEMS - Optimized
-- ========================================
CREATE POLICY "inventory_items_admin" ON public.inventory_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'admin'
    )
  );

CREATE POLICY "Allow admins and managers to create inventory items" ON public.inventory_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Allow admins and managers to update inventory items" ON public.inventory_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Allow admins to delete inventory items" ON public.inventory_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'admin'
    )
  );

-- QUOTES - Optimized
-- ========================================
CREATE POLICY "quotes_admin" ON public.quotes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'admin'
    )
  );

CREATE POLICY "quotes_manager" ON public.quotes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.clients c ON c.id = quotes.client_id
      WHERE p.id = (select auth.uid())  -- ✅ OPTIMIZED
      AND p.role = 'manager'
      AND p.region_id = c.region_id
    )
  );

CREATE POLICY "quotes_sales_select" ON public.quotes
  FOR SELECT
  TO authenticated
  USING (
    created_by = (select auth.uid())  -- ✅ OPTIMIZED
    OR EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = quotes.client_id
      AND assigned_user_id = (select auth.uid())  -- ✅ OPTIMIZED
    )
  );

CREATE POLICY "quotes_sales_insert" ON public.quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'sales'
    )
  );

CREATE POLICY "quotes_sales_update" ON public.quotes
  FOR UPDATE
  TO authenticated
  USING (
    created_by = (select auth.uid())  -- ✅ OPTIMIZED
  );

CREATE POLICY "Quotes Allow All" ON public.quotes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
    )
  );

-- QUOTE_ITEMS - Optimized
-- ========================================
CREATE POLICY "quote_items_admin" ON public.quote_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'admin'
    )
  );

CREATE POLICY "quote_items_manager" ON public.quote_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'manager'
    )
  );

CREATE POLICY "Quote Items Allow All" ON public.quote_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
    )
  );

-- INVOICES - Optimized
-- ========================================
CREATE POLICY "invoices_admin" ON public.invoices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'admin'
    )
  );

CREATE POLICY "invoices_manager" ON public.invoices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.clients c ON c.id = invoices.client_id
      WHERE p.id = (select auth.uid())  -- ✅ OPTIMIZED
      AND p.role = 'manager'
      AND p.region_id = c.region_id
    )
  );

CREATE POLICY "invoices_sales_select" ON public.invoices
  FOR SELECT
  TO authenticated
  USING (
    created_by = (select auth.uid())  -- ✅ OPTIMIZED
    OR EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = invoices.client_id
      AND assigned_user_id = (select auth.uid())  -- ✅ OPTIMIZED
    )
  );

CREATE POLICY "Invoices Allow All" ON public.invoices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
    )
  );

-- INVOICE_ITEMS - Optimized
-- ========================================
CREATE POLICY "invoice_items_admin" ON public.invoice_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'admin'
    )
  );

CREATE POLICY "invoice_items_manager" ON public.invoice_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'manager'
    )
  );

CREATE POLICY "Invoice Items Allow All" ON public.invoice_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
    )
  );

-- RESERVATIONS - Optimized
-- ========================================
CREATE POLICY "reservations_admin" ON public.reservations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'admin'
    )
  );

CREATE POLICY "reservations_manager" ON public.reservations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'manager'
    )
  );

-- DOCUMENTS - Optimized
-- ========================================
CREATE POLICY "documents_admin" ON public.documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'admin'
    )
  );

CREATE POLICY "documents_select" ON public.documents
  FOR SELECT
  TO authenticated
  USING (
    created_by = (select auth.uid())  -- ✅ OPTIMIZED
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role IN ('admin', 'manager')
    )
  );

-- LEAD_IMPORT_LOGS - Optimized
-- ========================================
CREATE POLICY "lead_import_logs_admin" ON public.lead_import_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())  -- ✅ OPTIMIZED
      AND role = 'admin'
    )
  );

-- ============================================================================
-- STEP 3: Verification
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Optimized RLS policies applied successfully!';
  RAISE NOTICE '📊 Check Supabase Performance Advisor - warnings should be reduced';
  RAISE NOTICE '🔄 If issues occur, run: rollback_rls_optimization.sql';
END $$;

-- List all policies to verify
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('regions', 'user_roles', 'leads', 'clients', 'reservations')
ORDER BY tablename, policyname;

COMMIT;

-- ============================================================================
-- PERFORMANCE IMPACT:
-- ============================================================================
-- Before: auth.uid() evaluated for EACH ROW (e.g., 10,000 times for 10k rows)
-- After:  (select auth.uid()) evaluated ONCE per query
-- 
-- Expected result: 84 warnings → 0 warnings in Performance Advisor
-- Performance gain: Significant on large datasets (1000+ rows)
-- Functionality: UNCHANGED - same security, better performance
-- ============================================================================
