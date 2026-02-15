-- Update RLS policies to allow managers to INSERT and DELETE documents

-- Allow managers to insert documents (currently only admins can)
DROP POLICY IF EXISTS "Admins can insert documents" ON documents;

CREATE POLICY "Admins and managers can insert documents" 
ON documents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role::text IN ('admin', 'manager')
  )
);

-- Allow managers to delete documents
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON documents;

CREATE POLICY "Admins and managers can delete documents" 
ON documents
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role::text IN ('admin', 'manager')
  )
);

-- Update inventory_items policies to allow managers
DROP POLICY IF EXISTS "Admins can insert inventory items" ON inventory_items;

CREATE POLICY "Admins and managers can insert inventory items" 
ON inventory_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role::text IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS "Admins can delete inventory items" ON inventory_items;

CREATE POLICY "Admins and managers can delete inventory items" 
ON inventory_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role::text IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS "Admins can update inventory items" ON inventory_items;

CREATE POLICY "Admins and managers can update inventory items" 
ON inventory_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role::text IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role::text IN ('admin', 'manager')
  )
);

-- Check results
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('documents', 'inventory_items')
ORDER BY tablename, cmd;
