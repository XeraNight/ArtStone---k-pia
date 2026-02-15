-- SIMPLE FIX - Just add columns without RLS policies
-- Run this first, then we'll add policies separately

-- Step 1: Add missing columns if they don't exist
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS allowed_roles text[] DEFAULT ARRAY['admin', 'manager', 'sales']::text[],
  ADD COLUMN IF NOT EXISTS allowed_user_ids text[] DEFAULT ARRAY[]::text[];

-- Step 2: Update existing rows to have default values
UPDATE documents 
SET 
  allowed_roles = COALESCE(allowed_roles, ARRAY['admin', 'manager', 'sales']::text[]),
  allowed_user_ids = COALESCE(allowed_user_ids, ARRAY[]::text[])
WHERE allowed_roles IS NULL OR allowed_user_ids IS NULL;

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND column_name IN ('allowed_roles', 'allowed_user_ids');
