-- ==============================================================================
-- MIGRATION 006: COR (CAREER OPERATIONS REPRESENTATION) WORKFLOW SYSTEM
-- ==============================================================================
-- Complete operational system for the Career Operations team.
-- Links Creators -> COR Requests -> COR Members -> COR Opportunities -> COR Applications -> Events & Notes.
-- Enforces strict creator ownership, admin authorization, and tamper-proof status history.

-- 1. COR REQUESTS (Creator-submitted questionnaire & admin review)
CREATE TABLE IF NOT EXISTS public.cor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  current_role text NOT NULL,
  current_company text,
  experience_years text,
  employment_status text,
  desired_role text NOT NULL,
  skills text[] NOT NULL DEFAULT '{}'::text[],
  secondary_skills text[] DEFAULT '{}'::text[],
  specialization text,
  education_degree text,
  education_institution text,
  education_year text,
  experience_summary text,
  work_history jsonb DEFAULT '[]'::jsonb,
  portfolio_url text,
  linkedin_url text,
  behance_url text,
  github_url text,
  website_url text,
  resume_url text,
  portfolio_docs text[] DEFAULT '{}'::text[],
  expected_salary text,
  current_salary text,
  opportunity_type text,
  preferred_work_type text,
  career_goals text,
  additional_notes text,
  admin_notes text, -- INTERNAL ADMIN-ONLY
  decline_reason text,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  declined_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  declined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_creator_cor_request UNIQUE (creator_id)
);

CREATE INDEX IF NOT EXISTS idx_cor_requests_creator_id ON public.cor_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_cor_requests_status ON public.cor_requests(status);
CREATE INDEX IF NOT EXISTS idx_cor_requests_created_at ON public.cor_requests(created_at DESC);

-- 2. COR MEMBERS (Approved creators in the COR program)
CREATE TABLE IF NOT EXISTS public.cor_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.cor_requests(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'removed', 'expired')),
  desired_role text,
  skills text[] DEFAULT '{}'::text[],
  experience_years text,
  preferred_work_type text,
  internal_notes text, -- INTERNAL ADMIN-ONLY
  career_strategy text, -- INTERNAL ADMIN-ONLY
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamptz DEFAULT now(),
  joined_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cor_members_creator_id ON public.cor_members(creator_id);
CREATE INDEX IF NOT EXISTS idx_cor_members_status ON public.cor_members(status);
CREATE INDEX IF NOT EXISTS idx_cor_members_joined_at ON public.cor_members(joined_at DESC);

-- 3. COR OPPORTUNITIES (Curated opportunities & job listings)
CREATE TABLE IF NOT EXISTS public.cor_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  description text,
  location text NOT NULL,
  workplace_type text NOT NULL DEFAULT 'Remote' CHECK (workplace_type IN ('Remote', 'Hybrid', 'Onsite')),
  salary text,
  required_skills text[] NOT NULL DEFAULT '{}'::text[],
  experience_requirement text,
  job_url text,
  recruiter_name text,
  recruiter_email text,
  recruiter_contact text,
  application_deadline date,
  source text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paused', 'closed')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cor_opps_status ON public.cor_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_cor_opps_created_at ON public.cor_opportunities(created_at DESC);

-- 4. COR APPLICATIONS (Admin applies on behalf of specific creator)
CREATE TABLE IF NOT EXISTS public.cor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cor_member_id uuid NOT NULL REFERENCES public.cor_members(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.cor_opportunities(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Recommended' CHECK (status IN (
    'Recommended',
    'Preparing Application',
    'Applied',
    'Screening',
    'Interview',
    'Final Round',
    'Offer',
    'Rejected'
  )),
  applied_date date DEFAULT CURRENT_DATE,
  interview_date date,
  consultant text NOT NULL DEFAULT 'Career Operations',
  applied_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_member_opportunity_app UNIQUE (cor_member_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_cor_apps_creator_id ON public.cor_applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_cor_apps_cor_member_id ON public.cor_applications(cor_member_id);
CREATE INDEX IF NOT EXISTS idx_cor_apps_opportunity_id ON public.cor_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_cor_apps_status ON public.cor_applications(status);
CREATE INDEX IF NOT EXISTS idx_cor_apps_created_at ON public.cor_applications(created_at DESC);

-- 5. COR APPLICATION EVENTS / STATUS HISTORY (Preserves chronological journey)
CREATE TABLE IF NOT EXISTS public.cor_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.cor_applications(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_by_name text NOT NULL DEFAULT 'Career Operations',
  note text,
  scheduled_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cor_app_events_app_id ON public.cor_application_events(application_id);
CREATE INDEX IF NOT EXISTS idx_cor_app_events_created_at ON public.cor_application_events(created_at ASC);

-- 6. COR ADMIN INTERNAL NOTES (Strictly private to Career Team)
CREATE TABLE IF NOT EXISTS public.cor_admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cor_member_id uuid REFERENCES public.cor_members(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.cor_applications(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  content text NOT NULL,
  is_internal_only boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cor_notes_member_id ON public.cor_admin_notes(cor_member_id);
CREATE INDEX IF NOT EXISTS idx_cor_notes_app_id ON public.cor_admin_notes(application_id);
CREATE INDEX IF NOT EXISTS idx_cor_notes_created_at ON public.cor_admin_notes(created_at DESC);

-- 7. COR ACTIVITY (Audit log & event stream)
CREATE TABLE IF NOT EXISTS public.cor_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  cor_member_id uuid REFERENCES public.cor_members(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.cor_applications(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  description text NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name text NOT NULL DEFAULT 'Admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cor_activity_creator_id ON public.cor_activity(creator_id);
CREATE INDEX IF NOT EXISTS idx_cor_activity_created_at ON public.cor_activity(created_at DESC);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.cor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cor_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cor_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cor_application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cor_admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cor_activity ENABLE ROW LEVEL SECURITY;

-- COR Requests Policies
DROP POLICY IF EXISTS "Admins full access to cor_requests" ON public.cor_requests;
CREATE POLICY "Admins full access to cor_requests"
  ON public.cor_requests FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin');

DROP POLICY IF EXISTS "Creators view and insert own cor_request" ON public.cor_requests;
CREATE POLICY "Creators view and insert own cor_request"
  ON public.cor_requests FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Creators insert own cor_request"
  ON public.cor_requests FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

-- COR Members Policies
DROP POLICY IF EXISTS "Admins full access to cor_members" ON public.cor_members;
CREATE POLICY "Admins full access to cor_members"
  ON public.cor_members FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin');

DROP POLICY IF EXISTS "Creators view own cor_member record" ON public.cor_members;
CREATE POLICY "Creators view own cor_member record"
  ON public.cor_members FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

-- COR Opportunities Policies
DROP POLICY IF EXISTS "Admins full access to cor_opportunities" ON public.cor_opportunities;
CREATE POLICY "Admins full access to cor_opportunities"
  ON public.cor_opportunities FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin');

DROP POLICY IF EXISTS "Authenticated users view open opportunities" ON public.cor_opportunities;
CREATE POLICY "Authenticated users view open opportunities"
  ON public.cor_opportunities FOR SELECT
  TO authenticated
  USING (status = 'open' OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin');

-- COR Applications Policies
DROP POLICY IF EXISTS "Admins full access to cor_applications" ON public.cor_applications;
CREATE POLICY "Admins full access to cor_applications"
  ON public.cor_applications FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin');

DROP POLICY IF EXISTS "Creators view own applications" ON public.cor_applications;
CREATE POLICY "Creators view own applications"
  ON public.cor_applications FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

-- COR Application Events Policies
DROP POLICY IF EXISTS "Admins full access to cor_application_events" ON public.cor_application_events;
CREATE POLICY "Admins full access to cor_application_events"
  ON public.cor_application_events FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin');

DROP POLICY IF EXISTS "Creators view own application events" ON public.cor_application_events;
CREATE POLICY "Creators view own application events"
  ON public.cor_application_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cor_applications a
      WHERE a.id = application_id AND a.creator_id = auth.uid()
    )
  );

-- COR Admin Notes Policies (CRITICAL: CREATORS NEVER HAVE ACCESS)
DROP POLICY IF EXISTS "Admins only access to cor_admin_notes" ON public.cor_admin_notes;
CREATE POLICY "Admins only access to cor_admin_notes"
  ON public.cor_admin_notes FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin');

REVOKE ALL ON public.cor_admin_notes FROM anon;

-- COR Activity Policies
DROP POLICY IF EXISTS "Admins full access to cor_activity" ON public.cor_activity;
CREATE POLICY "Admins full access to cor_activity"
  ON public.cor_activity FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin');

DROP POLICY IF EXISTS "Creators view own cor_activity" ON public.cor_activity;
CREATE POLICY "Creators view own cor_activity"
  ON public.cor_activity FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());
