-- Enable RLS on documents table and create basic SELECT policy
-- This allows all authenticated users to at least VIEW documents

-- Enable RLS if not already enabled
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policies to start fresh
DROP POLICY IF EXISTS "Users can view documents they have access to" ON documents;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON documents;

-- Create SUPER SIMPLE policy - all authenticated users can view all documents
CREATE POLICY "Enable read access for authenticated users" 
ON documents
FOR SELECT
TO authenticated
USING (true);  -- Allow all authenticated users to see all documents

-- Allow admins to update
DROP POLICY IF EXISTS "Admins and managers can update documents" ON documents;

CREATE POLICY "Admins and managers can update documents" 
ON documents
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role::text IN ('admin', 'manager')
  )
);

-- Allow admins to insert
DROP POLICY IF EXISTS "Admins can insert documents" ON documents;

CREATE POLICY "Admins can insert documents" 
ON documents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role::text = 'admin'
  )
);

-- Check if it worked
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'documents';
