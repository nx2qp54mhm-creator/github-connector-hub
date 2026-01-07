-- =====================================================
-- MIGRATION: Setup Insurance Documents Storage Bucket
-- DATE: 2026-01-07
-- PURPOSE: Ensure insurance-documents bucket exists for user policy uploads
-- =====================================================

-- Create insurance-documents storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'insurance-documents',
  'insurance-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']::text[];

-- Drop existing policies if any (for idempotent migration)
DROP POLICY IF EXISTS "Users can read own insurance documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own insurance documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own insurance documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own insurance documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role can access insurance documents" ON storage.objects;

-- Allow users to read their own insurance documents (user_id is first folder in path)
CREATE POLICY "Users can read own insurance documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'insurance-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload own insurance documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'insurance-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own files
CREATE POLICY "Users can update own insurance documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'insurance-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own insurance documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'insurance-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Note: Service role bypasses RLS, so no explicit policy needed for Edge Functions
