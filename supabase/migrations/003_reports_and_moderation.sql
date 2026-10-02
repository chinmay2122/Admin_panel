-- ==============================================================================
-- MIGRATION: REPORTS & MODERATION SYSTEM
-- Run this in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. Create the 'reports' table
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  artwork_id uuid NOT NULL,
  reporter_user_id uuid NOT NULL,
  artwork_owner_id uuid,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'resolved'::text, 'dismissed'::text])),
  moderation_action text,
  moderation_note text,
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES public.artworks(id) ON DELETE CASCADE,
  CONSTRAINT reports_reporter_user_id_fkey FOREIGN KEY (reporter_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT reports_artwork_owner_id_fkey FOREIGN KEY (artwork_owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 2. Performance Indexes for Reports
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_artwork_id ON public.reports(artwork_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_user_id ON public.reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_artwork_owner_id ON public.reports(artwork_owner_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- 3. Moderation Audit Trail Table
CREATE TABLE IF NOT EXISTS public.moderation_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  artwork_id uuid REFERENCES public.artworks(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT moderation_audit_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_moderation_audit_report_id ON public.moderation_audit_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_moderation_audit_created_at ON public.moderation_audit_logs(created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_audit_logs ENABLE ROW LEVEL SECURITY;

-- Normal authenticated users can insert reports for an artwork
CREATE POLICY "Users can insert reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_user_id);

-- Admins can view and moderate all reports
CREATE POLICY "Admins full access to reports" ON public.reports
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
    )
  );

-- Admins can view audit logs
CREATE POLICY "Admins full access to audit logs" ON public.moderation_audit_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
    )
  );
