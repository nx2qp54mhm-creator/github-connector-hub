-- =====================================================
-- MIGRATION: Add delete_user_account() Function
-- DATE: 2025-12-29
-- PURPOSE: Allow users to securely delete their own account and all associated data
-- =====================================================

-- Create function to delete user account and all associated data
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user's ID from auth context
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete user data from all tables (order matters for FK constraints)
  -- 1. Delete auto_policies first (may reference policy_documents)
  DELETE FROM auto_policies WHERE user_id = current_user_id;

  -- 2. Delete policy_documents
  DELETE FROM policy_documents WHERE user_id = current_user_id;

  -- 3. Delete user_policies
  DELETE FROM user_policies WHERE user_id = current_user_id;

  -- 4. Delete user_plans
  DELETE FROM user_plans WHERE user_id = current_user_id;

  -- 5. Delete user_selected_cards
  DELETE FROM user_selected_cards WHERE user_id = current_user_id;

  -- 6. Delete the auth user (this cascades to profiles table)
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION delete_user_account() IS 'Allows authenticated users to delete their own account and all associated data. Uses SECURITY DEFINER to access auth.users table.';
