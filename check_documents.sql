-- Check if documents exist and what their structure is
SELECT 
  id, 
  title, 
  category,
  created_by,
  allowed_roles,
  allowed_user_ids,
  created_at
FROM documents
LIMIT 10;

-- Check current RLS policies on documents table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'documents';
