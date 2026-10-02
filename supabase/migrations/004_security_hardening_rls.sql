-- ==============================================================================
-- MIGRATION 004: COMPREHENSIVE SECURITY HARDENING & RLS ENFORCEMENT
-- Compliant with OWASP ASVS v4.0 & OWASP Top 10:2025
-- Run in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- ==============================================================================
-- SECTION 1: PROFILES HARDENING & ANTI-PRIVILEGE ESCALATION
-- ==============================================================================

-- 1. Ensure 'status' column exists in profiles with allowed values check
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'::text 
CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'deactivated'::text]));

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- 2. Secure SECURITY DEFINER function for new user signup
-- Prevents self-assigning 'Admin' role via user metadata injection during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    plan,
    is_premium,
    status
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'User',  -- ALWAYS default to 'User'. Never trust raw_user_meta_data for role elevation!
    'free',  -- Always default to 'free'
    false,   -- Always default to false
    'active' -- Always default to 'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Database Trigger: Prevent Vertical Privilege Escalation & Role Tampering
-- Ensures normal users CANNOT update role, plan, is_premium, or status through direct API requests.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_role text;
BEGIN
  -- Service role / postgres superuser can always update
  IF current_user IN ('postgres', 'service_role') THEN
    RETURN NEW;
  END IF;

  -- Determine caller's verified profile role
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();

  -- If not an authenticated Admin, prohibit tampering with sensitive columns
  IF v_caller_role IS DISTINCT FROM 'Admin' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Unauthorized: Users are not permitted to modify role permissions.';
    END IF;

    IF NEW.plan IS DISTINCT FROM OLD.plan THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot modify subscription plans directly.';
    END IF;

    IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot modify premium status directly.';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot modify account moderation status.';
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Unauthorized: Profile identifier cannot be altered.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 4. RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (status = 'active' OR auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin');

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins full access to profiles" ON public.profiles;
CREATE POLICY "Admins full access to profiles"
ON public.profiles FOR ALL
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin');

-- ==============================================================================
-- SECTION 2: ARTWORKS RLS HARDENING (Hide/Draft Isolation)
-- ==============================================================================

ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artworks are viewable by everyone" ON public.artworks;
CREATE POLICY "Artworks are viewable by everyone"
ON public.artworks FOR SELECT
USING (
  -- Public can only view published and available artworks
  (is_published = true AND status IN ('Available', 'For Sale', 'Sold'))
  -- Or the creator themselves can view all their own artworks (even drafts/hidden)
  OR (auth.uid() = creator_id)
  -- Or an Admin can view all artworks for moderation purposes
  OR ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin')
);

DROP POLICY IF EXISTS "Creators can insert artworks" ON public.artworks;
CREATE POLICY "Creators can insert artworks"
ON public.artworks FOR INSERT
WITH CHECK (
  auth.uid() = creator_id
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'active')
);

DROP POLICY IF EXISTS "Creators can update their artworks" ON public.artworks;
CREATE POLICY "Creators can update their artworks"
ON public.artworks FOR UPDATE
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can delete their artworks" ON public.artworks;
CREATE POLICY "Creators can delete their artworks"
ON public.artworks FOR DELETE
USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Admins can manage all artworks" ON public.artworks;
CREATE POLICY "Admins can manage all artworks"
ON public.artworks FOR ALL
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin');

-- ==============================================================================
-- SECTION 3: REPORTS & MODERATION RLS HARDENING
-- ==============================================================================

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert reports" ON public.reports;
CREATE POLICY "Users can insert reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reporter_user_id
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'active')
);

DROP POLICY IF EXISTS "Users can view their submitted reports" ON public.reports;
CREATE POLICY "Users can view their submitted reports"
ON public.reports FOR SELECT
TO authenticated
USING (auth.uid() = reporter_user_id);

DROP POLICY IF EXISTS "Admins full access to reports" ON public.reports;
CREATE POLICY "Admins full access to reports"
ON public.reports FOR ALL
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin');

-- ==============================================================================
-- SECTION 4: MODERATION AUDIT LOGS (TAMPER-RESISTANT APPEND-ONLY)
-- ==============================================================================

ALTER TABLE public.moderation_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs
DROP POLICY IF EXISTS "Admins view audit logs" ON public.moderation_audit_logs;
CREATE POLICY "Admins view audit logs"
ON public.moderation_audit_logs FOR SELECT
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin');

-- Admins can insert audit logs (Append-only)
DROP POLICY IF EXISTS "Admins insert audit logs" ON public.moderation_audit_logs;
CREATE POLICY "Admins insert audit logs"
ON public.moderation_audit_logs FOR INSERT
TO authenticated
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin');

-- Explicitly NO UPDATE or DELETE policy exists for moderation_audit_logs.
-- Revoke destructive grants from authenticated role to ensure immutability
REVOKE UPDATE, DELETE, TRUNCATE ON public.moderation_audit_logs FROM authenticated, anon;

-- ==============================================================================
-- SECTION 5: SECURITY DEFINER FUNCTIONS (SAFE SEARCH PATH)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_candidate_pro_before_apply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan text;
  v_premium boolean;
  v_is_pro_only boolean;
BEGIN
  SELECT is_pro_only INTO v_is_pro_only FROM public.jobs WHERE id = NEW.job_id;
  SELECT plan, is_premium INTO v_plan, v_premium FROM public.profiles WHERE id = NEW.candidate_id;

  IF (v_is_pro_only IS TRUE OR v_is_pro_only IS NULL) THEN
    IF (v_plan NOT IN ('pro', 'elite') AND v_premium IS NOT TRUE) THEN
      RAISE EXCEPTION 'Candidate must possess an active Pro subscription to apply for this listing.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ==============================================================================
-- SECTION 6: SUPABASE STORAGE POLICIES (Bucket: artworks)
-- ==============================================================================

-- Ensure bucket exists and has path-based isolation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    
    -- Public read for artworks bucket
    DROP POLICY IF EXISTS "Public can view artwork images" ON storage.objects;
    CREATE POLICY "Public can view artwork images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'artworks');

    -- Authenticated creators can only upload to their own user directory: artworks/<user_id>/*
    DROP POLICY IF EXISTS "Users can upload to their own artwork folder" ON storage.objects;
    CREATE POLICY "Users can upload to their own artwork folder"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'artworks' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );

    -- File owners or Admins can update their own artwork images
    DROP POLICY IF EXISTS "Users can update their own artwork files" ON storage.objects;
    CREATE POLICY "Users can update their own artwork files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'artworks' 
      AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
      )
    );

    -- File owners or Admins can delete artwork images
    DROP POLICY IF EXISTS "Users can delete their own artwork files" ON storage.objects;
    CREATE POLICY "Users can delete their own artwork files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'artworks' 
      AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
      )
    );
  END IF;
END $$;
