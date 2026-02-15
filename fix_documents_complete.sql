-- Complete fix for documents table
-- Run this entire script in Supabase SQL Editor

-- Step 1: Add missing columns if they don't exist
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS allowed_roles text[] DEFAULT '{"admin", "manager", "sales"}',
  ADD COLUMN IF NOT EXISTS allowed_user_ids text[] DEFAULT '{}';

-- Step 2: Update existing rows to have default values
UPDATE documents 
SET 
  allowed_roles = COALESCE(allowed_roles, '{"admin", "manager", "sales"}'),
  allowed_user_ids = COALESCE(allowed_user_ids, '{}')
WHERE allowed_roles IS NULL OR allowed_user_ids IS NULL;

-- Step 3: Add RLS policy for document access if it doesn't exist
DROP POLICY IF EXISTS "Users can view documents they have access to" ON documents;

CREATE POLICY "Users can view documents they have access to" ON documents
FOR SELECT
TO authenticated
USING (
  -- Admins can see everything
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role::text = 'admin'
  )
  OR
  -- Document creator can see their own documents
  created_by = auth.uid()
  OR
  -- Users with allowed role can see the document
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role::text = ANY(allowed_roles)
  )
  OR
  -- Explicitly allowed users can see the document
  auth.uid()::text = ANY(allowed_user_ids)
);

-- Step 4: Add update policy for admins and managers
DROP POLICY IF EXISTS "Admins and managers can update documents" ON documents;

CREATE POLICY "Admins and managers can update documents" ON documents
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

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND column_name IN ('allowed_roles', 'allowed_user_ids');
