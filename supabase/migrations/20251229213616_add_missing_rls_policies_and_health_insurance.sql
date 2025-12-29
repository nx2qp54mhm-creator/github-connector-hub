-- =====================================================
-- MIGRATION: Add Missing RLS Policies and Health Insurance Column
-- DATE: 2025-12-29
-- PURPOSE: Close critical security gaps identified after frontend auth improvements
-- =====================================================

-- =====================================================
-- 1. ADD MISSING COLUMN TO PROFILES TABLE
-- =====================================================

-- Add has_health_insurance column (referenced in Profile.tsx)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS has_health_insurance BOOLEAN;

-- =====================================================
-- 2. ADD MISSING DELETE POLICY FOR PROFILES
-- =====================================================

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- =====================================================
-- 3. ADD RLS POLICIES FOR AUTO_POLICIES TABLE
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE public.auto_policies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Users can view own auto policies" ON public.auto_policies;
DROP POLICY IF EXISTS "Users can insert own auto policies" ON public.auto_policies;
DROP POLICY IF EXISTS "Users can update own auto policies" ON public.auto_policies;
DROP POLICY IF EXISTS "Users can delete own auto policies" ON public.auto_policies;

-- Users can only view their own auto policies
CREATE POLICY "Users can view own auto policies"
ON public.auto_policies
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own auto policies
CREATE POLICY "Users can insert own auto policies"
ON public.auto_policies
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own auto policies
CREATE POLICY "Users can update own auto policies"
ON public.auto_policies
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can only delete their own auto policies
CREATE POLICY "Users can delete own auto policies"
ON public.auto_policies
FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- 4. ADD RLS POLICIES FOR POLICY_DOCUMENTS TABLE
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Users can view own policy documents" ON public.policy_documents;
DROP POLICY IF EXISTS "Users can insert own policy documents" ON public.policy_documents;
DROP POLICY IF EXISTS "Users can update own policy documents" ON public.policy_documents;
DROP POLICY IF EXISTS "Users can delete own policy documents" ON public.policy_documents;

-- Users can only view their own policy documents
CREATE POLICY "Users can view own policy documents"
ON public.policy_documents
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own policy documents
CREATE POLICY "Users can insert own policy documents"
ON public.policy_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own policy documents
CREATE POLICY "Users can update own policy documents"
ON public.policy_documents
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can only delete their own policy documents
CREATE POLICY "Users can delete own policy documents"
ON public.policy_documents
FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION QUERIES (commented out - for manual testing)
-- =====================================================

-- To verify RLS is enabled and policies exist, run:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
