-- Add storage policies for insurance-documents bucket to restrict access to file owners only

-- Allow users to read their own insurance documents
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