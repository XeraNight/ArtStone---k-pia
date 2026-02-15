-- Add permissions columns to documents table if they don't exist

-- Column: allowed_roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'documents'
        AND column_name = 'allowed_roles'
    ) THEN
        ALTER TABLE documents ADD COLUMN allowed_roles text[] DEFAULT '{"admin", "manager", "sales"}';
    END IF;
END $$;

-- Column: allowed_user_ids
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'documents'
        AND column_name = 'allowed_user_ids'
    ) THEN
        ALTER TABLE documents ADD COLUMN allowed_user_ids text[] DEFAULT '{}';
    END IF;
END $$;

-- Update existing rows to have default values if they are null
UPDATE documents SET allowed_roles = '{"admin", "manager", "sales"}' WHERE allowed_roles IS NULL;
UPDATE documents SET allowed_user_ids = '{}' WHERE allowed_user_ids IS NULL;
