-- Add Row Level Security policies for auto_policies and policy_documents tables
-- This ensures users can only access their own data

-- =====================================================
-- AUTO_POLICIES TABLE RLS
-- =====================================================

-- Enable RLS on auto_policies
ALTER TABLE public.auto_policies ENABLE ROW LEVEL SECURITY;

-- Users can view their own auto policies
CREATE POLICY "Users can view own auto policies"
ON public.auto_policies
FOR SELECT
USING (auth.uid() = user_id::uuid);

-- Users can insert their own auto policies
CREATE POLICY "Users can insert own auto policies"
ON public.auto_policies
FOR INSERT
WITH CHECK (auth.uid() = user_id::uuid);

-- Users can update their own auto policies
CREATE POLICY "Users can update own auto policies"
ON public.auto_policies
FOR UPDATE
USING (auth.uid() = user_id::uuid);

-- Users can delete their own auto policies
CREATE POLICY "Users can delete own auto policies"
ON public.auto_policies
FOR DELETE
USING (auth.uid() = user_id::uuid);

-- =====================================================
-- POLICY_DOCUMENTS TABLE RLS
-- =====================================================

-- Enable RLS on policy_documents
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own policy documents
CREATE POLICY "Users can view own policy documents"
ON public.policy_documents
FOR SELECT
USING (auth.uid() = user_id::uuid);

-- Users can insert their own policy documents
CREATE POLICY "Users can insert own policy documents"
ON public.policy_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id::uuid);

-- Users can update their own policy documents
CREATE POLICY "Users can update own policy documents"
ON public.policy_documents
FOR UPDATE
USING (auth.uid() = user_id::uuid);

-- Users can delete their own policy documents
CREATE POLICY "Users can delete own policy documents"
ON public.policy_documents
FOR DELETE
USING (auth.uid() = user_id::uuid);
