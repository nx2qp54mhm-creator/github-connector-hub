-- =====================================================
-- MIGRATION: Add Benefit Guide Upload System
-- DATE: 2025-12-30
-- PURPOSE: Support admin upload and AI extraction of credit card benefit guides
-- =====================================================

-- =====================================================
-- 1. Add admin role to profiles table
-- =====================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.profiles.is_admin IS 'Whether user has admin privileges for benefit guide management';

-- =====================================================
-- 2. Create benefit_guide_documents table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.benefit_guide_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Document metadata
  issuer VARCHAR(100) NOT NULL,
  card_id VARCHAR(100),
  card_name VARCHAR(200),

  -- File info
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(50),

  -- Version tracking
  guide_version VARCHAR(50),
  effective_date DATE,

  -- Processing status
  processing_status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  extraction_started_at TIMESTAMPTZ,
  extraction_completed_at TIMESTAMPTZ,

  -- Admin tracking
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add check constraint for processing_status
ALTER TABLE public.benefit_guide_documents
ADD CONSTRAINT benefit_guide_documents_status_check
CHECK (processing_status IN ('pending', 'processing', 'extracted', 'review_needed', 'approved', 'rejected', 'error'));

-- Add comments
COMMENT ON TABLE public.benefit_guide_documents IS 'Tracks uploaded PDF benefit guides from credit card issuers';
COMMENT ON COLUMN public.benefit_guide_documents.processing_status IS 'pending | processing | extracted | review_needed | approved | rejected | error';
COMMENT ON COLUMN public.benefit_guide_documents.card_id IS 'Internal card ID (e.g., chase_sapphire_reserve) - can be null for new cards';

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_benefit_guide_documents_issuer ON public.benefit_guide_documents(issuer);
CREATE INDEX IF NOT EXISTS idx_benefit_guide_documents_status ON public.benefit_guide_documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_benefit_guide_documents_uploaded_by ON public.benefit_guide_documents(uploaded_by);

-- =====================================================
-- 3. Create extracted_benefits table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.extracted_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to source document
  document_id UUID REFERENCES public.benefit_guide_documents(id) ON DELETE CASCADE,

  -- Card identification
  card_id VARCHAR(100) NOT NULL,

  -- Benefit data
  benefit_type VARCHAR(50) NOT NULL,
  extracted_data JSONB NOT NULL,

  -- Confidence and review
  confidence_score DECIMAL(3,2),
  requires_review BOOLEAN DEFAULT false,
  review_notes TEXT,
  source_excerpts JSONB,

  -- Review workflow
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  is_approved BOOLEAN,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add check constraint for benefit_type
ALTER TABLE public.extracted_benefits
ADD CONSTRAINT extracted_benefits_type_check
CHECK (benefit_type IN (
  'rental', 'tripProtection', 'baggageProtection', 'purchaseProtection',
  'extendedWarranty', 'returnProtection', 'travelPerks', 'cellPhoneProtection',
  'roadsideAssistance', 'emergencyAssistance', 'priceProtection'
));

-- Add comments
COMMENT ON TABLE public.extracted_benefits IS 'Stores AI-extracted benefit data from uploaded guides before approval';
COMMENT ON COLUMN public.extracted_benefits.benefit_type IS 'Type of benefit: rental, tripProtection, purchaseProtection, etc.';
COMMENT ON COLUMN public.extracted_benefits.confidence_score IS 'AI confidence score from 0.00 to 1.00';
COMMENT ON COLUMN public.extracted_benefits.source_excerpts IS 'JSON array of text excerpts from the PDF that support the extraction';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_extracted_benefits_document ON public.extracted_benefits(document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_benefits_card ON public.extracted_benefits(card_id);
CREATE INDEX IF NOT EXISTS idx_extracted_benefits_type ON public.extracted_benefits(benefit_type);
CREATE INDEX IF NOT EXISTS idx_extracted_benefits_review ON public.extracted_benefits(requires_review) WHERE requires_review = true;

-- =====================================================
-- 4. Create admin_audit_log table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who and when
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,

  -- What action
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100),

  -- Change details
  old_data JSONB,
  new_data JSONB,
  change_summary TEXT,

  -- Request context
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add check constraint for action
ALTER TABLE public.admin_audit_log
ADD CONSTRAINT admin_audit_log_action_check
CHECK (action IN ('upload', 'extract', 'review', 'approve', 'reject', 'edit', 'delete', 'create_card', 'update_card'));

-- Add comments
COMMENT ON TABLE public.admin_audit_log IS 'Audit trail for all admin actions on benefit guide system';
COMMENT ON COLUMN public.admin_audit_log.action IS 'upload | extract | review | approve | reject | edit | delete | create_card | update_card';
COMMENT ON COLUMN public.admin_audit_log.entity_type IS 'Type of entity: document, benefit, card, template';

-- Create indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_user ON public.admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity ON public.admin_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON public.admin_audit_log(created_at DESC);

-- =====================================================
-- 5. Enable RLS and create policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.benefit_guide_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- benefit_guide_documents policies (admin only)
CREATE POLICY "Admins can view all benefit guide documents"
  ON public.benefit_guide_documents FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert benefit guide documents"
  ON public.benefit_guide_documents FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update benefit guide documents"
  ON public.benefit_guide_documents FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete benefit guide documents"
  ON public.benefit_guide_documents FOR DELETE
  USING (public.is_admin());

-- extracted_benefits policies (admin only)
CREATE POLICY "Admins can view all extracted benefits"
  ON public.extracted_benefits FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert extracted benefits"
  ON public.extracted_benefits FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update extracted benefits"
  ON public.extracted_benefits FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete extracted benefits"
  ON public.extracted_benefits FOR DELETE
  USING (public.is_admin());

-- admin_audit_log policies (admin read-only, system can insert)
CREATE POLICY "Admins can view audit log"
  ON public.admin_audit_log FOR SELECT
  USING (public.is_admin());

-- Allow service role to insert audit logs
CREATE POLICY "Service role can insert audit logs"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 6. Create updated_at trigger function (if not exists)
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS set_benefit_guide_documents_updated_at ON public.benefit_guide_documents;
CREATE TRIGGER set_benefit_guide_documents_updated_at
  BEFORE UPDATE ON public.benefit_guide_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_extracted_benefits_updated_at ON public.extracted_benefits;
CREATE TRIGGER set_extracted_benefits_updated_at
  BEFORE UPDATE ON public.extracted_benefits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 7. Grant permissions
-- =====================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.benefit_guide_documents TO authenticated;
GRANT ALL ON public.extracted_benefits TO authenticated;
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;

-- =====================================================
-- 8. Create storage bucket for benefit guides
-- =====================================================
-- Note: This creates the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'benefit-guides',
  'benefit-guides',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for benefit-guides bucket (admin only)
CREATE POLICY "Admins can upload benefit guides"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'benefit-guides' AND
    public.is_admin()
  );

CREATE POLICY "Admins can view benefit guides"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'benefit-guides' AND
    public.is_admin()
  );

CREATE POLICY "Admins can update benefit guides"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'benefit-guides' AND
    public.is_admin()
  );

CREATE POLICY "Admins can delete benefit guides"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'benefit-guides' AND
    public.is_admin()
  );
