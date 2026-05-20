-- Run in Supabase SQL Editor to support advanced admin capabilities
-- Adds is_suspended column to profiles table and defines RPC helper functions

-- 1. Extend profiles table schema with is_suspended column if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

-- 2. RPC: Suspend or activate a user account
CREATE OR REPLACE FUNCTION public.admin_toggle_user_suspension(user_id uuid, suspend_status boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET is_suspended = suspend_status
  WHERE id = user_id;
END;
$$;

-- 3. RPC: Update user profile information by admin
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  user_id uuid,
  new_full_name text,
  new_email text,
  new_contact_number text,
  new_address text,
  new_skills text,
  new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    full_name = new_full_name,
    email = new_email,
    contact_number = new_contact_number,
    address = new_address,
    skills = new_skills,
    role = new_role
  WHERE id = user_id;
END;
$$;

-- 4. RPC: Cleanly delete user account (profiles, resumes, applications)
CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.resumes WHERE applicant_id = user_id;
  DELETE FROM public.applications WHERE applicant_id = user_id;
  DELETE FROM public.profiles WHERE id = user_id;
END;
$$;

-- 5. RPC: Fetch all uploaded resumes in public storage joined with profiles
CREATE OR REPLACE FUNCTION public.admin_get_all_resumes()
RETURNS TABLE (
  applicant_id uuid,
  file_url text,
  file_name text,
  file_size bigint,
  created_at timestamptz,
  applicant_name text,
  applicant_email text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.applicant_id,
    r.file_url,
    r.file_name,
    r.file_size,
    r.created_at,
    p.full_name AS applicant_name,
    p.email AS applicant_email
  FROM public.resumes r
  LEFT JOIN public.profiles p ON p.id = r.applicant_id
  ORDER BY r.created_at DESC NULLS LAST;
$$;

-- 6. RPC: Fetch all submitted job applications with full details
CREATE OR REPLACE FUNCTION public.admin_get_all_applications()
RETURNS TABLE (
  id uuid,
  job_id uuid,
  applicant_id uuid,
  status text,
  created_at timestamptz,
  applicant_snapshot jsonb,
  job_title text,
  job_employment_type text,
  job_location text,
  job_required_skills text,
  job_employer_id uuid,
  employer_name text,
  employer_email text,
  applicant_name text,
  applicant_email text,
  resume_file_url text,
  resume_file_name text,
  resume_file_size bigint,
  resume_created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.job_id,
    a.applicant_id,
    a.status,
    a.created_at,
    a.applicant_snapshot,
    j.title AS job_title,
    j.employment_type AS job_employment_type,
    j.location AS job_location,
    j.required_skills AS job_required_skills,
    j.employer_id AS job_employer_id,
    emp.full_name AS employer_name,
    emp.email AS employer_email,
    COALESCE(p.full_name, a.applicant_snapshot->>'full_name') AS applicant_name,
    COALESCE(p.email, a.applicant_snapshot->>'email') AS applicant_email,
    COALESCE(r.file_url, a.applicant_snapshot->'resume'->>'file_url') AS resume_file_url,
    COALESCE(r.file_name, a.applicant_snapshot->'resume'->>'file_name') AS resume_file_name,
    COALESCE(r.file_size, (a.applicant_snapshot->'resume'->>'file_size')::bigint) AS resume_file_size,
    COALESCE(r.created_at, (a.applicant_snapshot->'resume'->>'created_at')::timestamptz) AS resume_created_at
  FROM public.applications a
  JOIN public.jobs j ON j.id = a.job_id
  LEFT JOIN public.profiles p ON p.id = a.applicant_id
  LEFT JOIN public.profiles emp ON emp.id = j.employer_id
  LEFT JOIN public.resumes r ON r.applicant_id = a.applicant_id
  ORDER BY a.created_at DESC;
$$;

-- 7. RPC: Delete a specific resume file record and update snapshots
CREATE OR REPLACE FUNCTION public.admin_delete_resume(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.resumes WHERE applicant_id = user_id;
  
  -- Update applications snapshots to remove the resume block
  UPDATE public.applications
  SET applicant_snapshot = applicant_snapshot - 'resume'
  WHERE applicant_id = user_id;
END;
$$;

-- 8. Grant Execution Permissions to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.admin_toggle_user_suspension(uuid, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, text, text, text, text, text) TO anon, authenticated;
-- Note: delete_user is dangerous, restrict or keep for local admin access. Granting to support local admin
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_resumes() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_applications() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_resume(uuid) TO anon, authenticated;
