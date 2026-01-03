-- Fix privilege escalation: Prevent users from modifying is_admin column
-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new policy that prevents is_admin modification
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = id)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid() = id AND
  -- Prevent users from modifying admin status - must remain unchanged
  is_admin IS NOT DISTINCT FROM (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid())
);