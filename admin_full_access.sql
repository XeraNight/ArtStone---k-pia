-- Enable RLS on all tables (just to be safe)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin (renamed to avoid collisions)
CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
CREATE POLICY "Admins have full access to profiles" ON profiles
FOR ALL TO authenticated
USING (auth_is_admin())
WITH CHECK (auth_is_admin());

-- LEADS
DROP POLICY IF EXISTS "Admins have full access to leads" ON leads;
CREATE POLICY "Admins have full access to leads" ON leads
FOR ALL TO authenticated
USING (auth_is_admin())
WITH CHECK (auth_is_admin());

-- CLIENTS
DROP POLICY IF EXISTS "Admins have full access to clients" ON clients;
CREATE POLICY "Admins have full access to clients" ON clients
FOR ALL TO authenticated
USING (auth_is_admin())
WITH CHECK (auth_is_admin());

-- QUOTES
DROP POLICY IF EXISTS "Admins have full access to quotes" ON quotes;
CREATE POLICY "Admins have full access to quotes" ON quotes
FOR ALL TO authenticated
USING (auth_is_admin())
WITH CHECK (auth_is_admin());

-- INVOICES
DROP POLICY IF EXISTS "Admins have full access to invoices" ON invoices;
CREATE POLICY "Admins have full access to invoices" ON invoices
FOR ALL TO authenticated
USING (auth_is_admin())
WITH CHECK (auth_is_admin());

-- DOCUMENTS
DROP POLICY IF EXISTS "Admins have full access to documents" ON documents;
CREATE POLICY "Admins have full access to documents" ON documents
FOR ALL TO authenticated
USING (auth_is_admin())
WITH CHECK (auth_is_admin());

-- INVENTORY
DROP POLICY IF EXISTS "Admins have full access to inventory" ON inventory_items;
CREATE POLICY "Admins have full access to inventory" ON inventory_items
FOR ALL TO authenticated
USING (auth_is_admin())
WITH CHECK (auth_is_admin());

DROP POLICY IF EXISTS "Admins have full access to inventory categories" ON inventory_categories;
CREATE POLICY "Admins have full access to inventory categories" ON inventory_categories
FOR ALL TO authenticated
USING (auth_is_admin())
WITH CHECK (auth_is_admin());

-- ACTIVITIES
DROP POLICY IF EXISTS "Admins have full access to activities" ON activities;
CREATE POLICY "Admins have full access to activities" ON activities
FOR ALL TO authenticated
USING (auth_is_admin())
WITH CHECK (auth_is_admin());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Admins have full access to notifications" ON notifications;
CREATE POLICY "Admins have full access to notifications" ON notifications
FOR ALL TO authenticated
USING (auth_is_admin())
WITH CHECK (auth_is_admin());

-- REGIONS (Usually public read, but restricted write)
DROP POLICY IF EXISTS "Admins have full access to regions" ON regions;
CREATE POLICY "Admins have full access to regions" ON regions
FOR ALL TO authenticated
USING (auth_is_admin())
WITH CHECK (auth_is_admin());

-- TASKS (If table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins have full access to tasks" ON tasks';
    EXECUTE 'CREATE POLICY "Admins have full access to tasks" ON tasks FOR ALL TO authenticated USING (auth_is_admin()) WITH CHECK (auth_is_admin())';
  END IF;
END
$$;

COMMENT ON FUNCTION auth_is_admin IS 'Helper function to check if the current user has the admin role';
