-- ==============================================================================
-- MIGRATION: PRO VERSION JOB POSTINGS & CANDIDATE APPLICATIONS
-- Run this in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. Add 'plan' column to profiles (Free, Pro, Elite) to track Pro candidates
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'::text 
CHECK (plan = ANY (ARRAY['free'::text, 'pro'::text, 'elite'::text]));

-- Automatically promote any legacy is_premium profiles to 'pro'
UPDATE public.profiles SET plan = 'pro' WHERE is_premium = true AND plan = 'free';

-- 2. Create the 'jobs' table
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  type text NOT NULL DEFAULT 'Full-time'::text, -- e.g. Full-time, Commission, Residency, Contract
  location text NOT NULL,
  description text,
  requirements text,
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'closed'::text])),
  is_pro_only boolean NOT NULL DEFAULT true, -- If true, visible ONLY to Pro candidates
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT jobs_pkey PRIMARY KEY (id)
);

-- 3. Create the 'job_applications' table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'shortlisted'::text, 'accepted'::text, 'rejected'::text])),
  cover_letter text,
  portfolio_url text,
  resume_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_applications_pkey PRIMARY KEY (id),
  CONSTRAINT job_applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE,
  CONSTRAINT job_applications_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT job_applications_unique_candidate UNIQUE (job_id, candidate_id)
);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_is_pro_only ON public.jobs(is_pro_only);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate_id ON public.job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- 6. RLS: Job Visibility Policy
-- If a job is marked 'is_pro_only':
--   -> ONLY candidates with the Pro version (plan = 'pro' or 'elite' or is_premium = true) or Admins can view it!
-- If a job is NOT pro-only:
--   -> Anyone can view it.
DROP POLICY IF EXISTS "Jobs visibility based on Pro plan" ON public.jobs;
CREATE POLICY "Jobs visibility based on Pro plan"
ON public.jobs
FOR SELECT
TO authenticated, anon
USING (
  is_pro_only = false
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
  OR (
    SELECT (plan IN ('pro', 'elite') OR is_premium = true)
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- Admins can create, update, and delete jobs
DROP POLICY IF EXISTS "Admins can manage jobs" ON public.jobs;
CREATE POLICY "Admins can manage jobs"
ON public.jobs
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
);

-- 7. RLS: Applications Policy
-- A candidate can ONLY insert an application if they have the Pro version!
DROP POLICY IF EXISTS "Only Pro candidates can apply for jobs" ON public.job_applications;
CREATE POLICY "Only Pro candidates can apply for jobs"
ON public.job_applications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = candidate_id
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_id AND j.status = 'open'
  )
  AND (
    SELECT (plan IN ('pro', 'elite') OR is_premium = true)
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- Candidates can view their own applications; Admins can view all applications
DROP POLICY IF EXISTS "Candidates and Admins can view applications" ON public.job_applications;
CREATE POLICY "Candidates and Admins can view applications"
ON public.job_applications
FOR SELECT
TO authenticated
USING (
  candidate_id = auth.uid()
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
);

-- Admins can update application status (e.g. pending -> shortlisted -> accepted)
DROP POLICY IF EXISTS "Admins can update applications" ON public.job_applications;
CREATE POLICY "Admins can update applications"
ON public.job_applications
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
);

-- 8. Strict Trigger: Enforce Pro version requirement at database level
CREATE OR REPLACE FUNCTION public.check_candidate_pro_before_apply()
RETURNS trigger AS $$
DECLARE
  v_plan text;
  v_premium boolean;
  v_is_pro_only boolean;
BEGIN
  -- Check if job requires Pro
  SELECT is_pro_only INTO v_is_pro_only FROM public.jobs WHERE id = NEW.job_id;

  -- Check candidate profile plan
  SELECT plan, is_premium INTO v_plan, v_premium FROM public.profiles WHERE id = NEW.candidate_id;

  IF (v_is_pro_only IS TRUE OR v_is_pro_only IS NULL) THEN
    IF (v_plan NOT IN ('pro', 'elite') AND v_premium IS NOT TRUE) THEN
      RAISE EXCEPTION 'Candidate must have an active Pro subscription to apply for this job.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_candidate_pro_before_apply ON public.job_applications;
CREATE TRIGGER trg_check_candidate_pro_before_apply
  BEFORE INSERT ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.check_candidate_pro_before_apply();
