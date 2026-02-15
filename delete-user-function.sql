-- Function to delete a user from auth.users (admin only)
-- This function must be created with security definer to have permissions
CREATE OR REPLACE FUNCTION delete_user_by_id(user_id_to_delete UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to delete users
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Delete from profiles table (CASCADE will handle related data)
  DELETE FROM profiles WHERE id = user_id_to_delete;
  
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$;
