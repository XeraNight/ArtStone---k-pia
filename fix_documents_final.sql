-- DEFINITIVE FIX - Drop and recreate columns as text[]
-- This handles the case where columns already exist with wrong type

-- Step 1: Drop existing columns if they exist (with CASCADE to remove dependencies)
ALTER TABLE documents 
  DROP COLUMN IF EXISTS allowed_roles CASCADE,
  DROP COLUMN IF EXISTS allowed_user_ids CASCADE;

-- Step 2: Add columns with correct text[] type
ALTER TABLE documents 
  ADD COLUMN allowed_roles text[] DEFAULT ARRAY['admin', 'manager', 'sales']::text[],
  ADD COLUMN allowed_user_ids text[] DEFAULT ARRAY[]::text[];

-- Step 3: Update all existing rows to have default values
UPDATE documents 
SET 
  allowed_roles = ARRAY['admin', 'manager', 'sales']::text[],
  allowed_user_ids = ARRAY[]::text[];

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND column_name IN ('allowed_roles', 'allowed_user_ids');
