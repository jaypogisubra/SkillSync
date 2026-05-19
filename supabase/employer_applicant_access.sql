-- Run this once in Supabase: SQL Editor -> New query -> Run
-- Fixes employers seeing "Unnamed Applicant" and "No resume uploaded"

-- 1. Store applicant profile + resume on each application (employers can always read applications)
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS applicant_snapshot jsonb DEFAULT '{}'::jsonb;

-- 1b. Let job seekers update the snapshot on their own applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'applications' AND policyname = 'Applicants can update own application snapshot'
  ) THEN
    CREATE POLICY "Applicants can update own application snapshot"
    ON applications FOR UPDATE
    TO authenticated
    USING (applicant_id = auth.uid())
    WITH CHECK (applicant_id = auth.uid());
  END IF;
END $$;

-- 2. RPC: secure employer view of applicants (bypasses RLS safely)
CREATE OR REPLACE FUNCTION get_employer_applicants()
RETURNS TABLE (
  id uuid,
  job_id uuid,
  applicant_id uuid,
  status text,
  created_at timestamptz,
  applicant_snapshot jsonb,
  job_title text,
  employment_type text,
  job_location text,
  full_name text,
  email text,
  contact_number text,
  skills text,
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
    j.employment_type,
    j.location AS job_location,
    COALESCE(p.full_name, a.applicant_snapshot->>'full_name') AS full_name,
    COALESCE(p.email, a.applicant_snapshot->>'email') AS email,
    COALESCE(p.contact_number, a.applicant_snapshot->>'contact_number') AS contact_number,
    COALESCE(p.skills, a.applicant_snapshot->>'skills') AS skills,
    COALESCE(r.file_url, a.applicant_snapshot->'resume'->>'file_url') AS resume_file_url,
    COALESCE(r.file_name, a.applicant_snapshot->'resume'->>'file_name') AS resume_file_name,
    COALESCE(r.file_size, (a.applicant_snapshot->'resume'->>'file_size')::bigint) AS resume_file_size,
    COALESCE(r.created_at, (a.applicant_snapshot->'resume'->>'created_at')::timestamptz) AS resume_created_at
  FROM applications a
  JOIN jobs j ON j.id = a.job_id
  LEFT JOIN profiles p ON p.id = a.applicant_id
  LEFT JOIN resumes r ON r.applicant_id = a.applicant_id
  WHERE j.employer_id = auth.uid()
  ORDER BY a.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_employer_applicants() TO authenticated;

-- 3. RLS: let employers read profiles of applicants who applied to their jobs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Employers can view applicant profiles'
  ) THEN
    CREATE POLICY "Employers can view applicant profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM applications a
        JOIN jobs j ON j.id = a.job_id
        WHERE a.applicant_id = profiles.id
          AND j.employer_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 4. RLS: let employers read resumes of applicants who applied to their jobs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'resumes' AND policyname = 'Employers can view applicant resumes'
  ) THEN
    CREATE POLICY "Employers can view applicant resumes"
    ON resumes FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM applications a
        JOIN jobs j ON j.id = a.job_id
        WHERE a.applicant_id = resumes.applicant_id
          AND j.employer_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 5. Storage: let employers download resume files for their applicants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'Employers can read applicant resume files'
  ) THEN
    CREATE POLICY "Employers can read applicant resume files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'resumes'
      AND EXISTS (
        SELECT 1
        FROM applications a
        JOIN jobs j ON j.id = a.job_id
        WHERE j.employer_id = auth.uid()
          AND a.applicant_id::text = (storage.foldername(name))[1]
      )
    );
  END IF;
END $$;

-- 6. Backfill existing applications with current profile + resume data
UPDATE applications a
SET applicant_snapshot = jsonb_build_object(
  'full_name', COALESCE(p.full_name, ''),
  'email', COALESCE(p.email, ''),
  'contact_number', COALESCE(p.contact_number, ''),
  'skills', COALESCE(p.skills, ''),
  'resume', CASE
    WHEN r.file_url IS NOT NULL THEN jsonb_build_object(
      'file_url', r.file_url,
      'file_name', COALESCE(r.file_name, 'Resume'),
      'file_size', r.file_size,
      'created_at', r.created_at
    )
    ELSE NULL
  END
)
FROM profiles p
LEFT JOIN resumes r ON r.applicant_id = p.id
WHERE a.applicant_id = p.id
  AND (a.applicant_snapshot IS NULL OR a.applicant_snapshot = '{}'::jsonb);
