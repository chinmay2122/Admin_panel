-- ==============================================================================
-- MIGRATION 005: STUDIO SETTINGS & PLATFORM CONTROLS WITH AUDIT LOGGING
-- ==============================================================================

-- 1. Create Platform Settings Table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id text PRIMARY KEY DEFAULT 'default',
  free_artwork_limit integer NOT NULL DEFAULT 3 CHECK (free_artwork_limit >= 0 AND free_artwork_limit <= 10000),
  lite_artwork_limit integer NOT NULL DEFAULT 50 CHECK (lite_artwork_limit >= 0 AND lite_artwork_limit <= 10000),
  pro_artwork_limit integer NOT NULL DEFAULT 100 CHECK (pro_artwork_limit >= 0 AND pro_artwork_limit <= 10000),
  invite_request_limit integer NOT NULL DEFAULT 20 CHECK (invite_request_limit >= 0 AND invite_request_limit <= 10000),
  cor_enabled boolean NOT NULL DEFAULT true,
  featured_creator_controls_enabled boolean NOT NULL DEFAULT true,
  moderation_settings_enabled boolean NOT NULL DEFAULT true,
  platform_announcement text NOT NULL DEFAULT 'Welcome to the iRAS Studio prototype.',
  default_profile_visibility text NOT NULL DEFAULT 'public' CHECK (default_profile_visibility = ANY (ARRAY['public'::text, 'private'::text])),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text
);

-- 2. Seed Default Settings
INSERT INTO public.platform_settings (
  id,
  free_artwork_limit,
  lite_artwork_limit,
  pro_artwork_limit,
  invite_request_limit,
  cor_enabled,
  featured_creator_controls_enabled,
  moderation_settings_enabled,
  platform_announcement,
  default_profile_visibility
) VALUES (
  'default',
  3,
  50,
  100,
  20,
  true,
  true,
  true,
  'Welcome to the iRAS Studio prototype.',
  'public'
) ON CONFLICT (id) DO NOTHING;

-- 3. Create Settings Audit Trail (Append-Only)
CREATE TABLE IF NOT EXISTS public.settings_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id text NOT NULL,
  changed_settings jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settings_audit_created_at ON public.settings_audit_logs(created_at DESC);

-- 4. Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Platform Settings
DROP POLICY IF EXISTS "Public and authenticated read platform settings" ON public.platform_settings;
CREATE POLICY "Public and authenticated read platform settings"
  ON public.platform_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can update platform settings" ON public.platform_settings;
CREATE POLICY "Admins can update platform settings"
  ON public.platform_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- 6. RLS Policies for Settings Audit Logs (Strict Append-Only for Admins)
DROP POLICY IF EXISTS "Admins view settings audit logs" ON public.settings_audit_logs;
CREATE POLICY "Admins view settings audit logs"
  ON public.settings_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

DROP POLICY IF EXISTS "Admins insert settings audit logs" ON public.settings_audit_logs;
CREATE POLICY "Admins insert settings audit logs"
  ON public.settings_audit_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Enforce strict append-only by revoking UPDATE, DELETE, TRUNCATE
REVOKE UPDATE, DELETE, TRUNCATE ON public.settings_audit_logs FROM authenticated, anon;
