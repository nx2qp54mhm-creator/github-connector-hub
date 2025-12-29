-- =====================================================
-- MIGRATION: Add Onboarding Fields to Profiles
-- DATE: 2025-12-29
-- PURPOSE: Support guided onboarding flow for new users
-- =====================================================

-- Add onboarding_completed column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Add onboarding_step column (0=welcome, 1=card done, 2=policy done, 3=chat done)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether user has completed or dismissed the onboarding flow';
COMMENT ON COLUMN public.profiles.onboarding_step IS 'Current onboarding step (0=welcome, 1=card, 2=policy, 3=chat)';

-- Mark existing users as having completed onboarding
-- This prevents showing onboarding to users who signed up before this feature
UPDATE public.profiles
SET onboarding_completed = true, onboarding_step = 3
WHERE onboarding_completed IS NULL OR onboarding_completed = false;
