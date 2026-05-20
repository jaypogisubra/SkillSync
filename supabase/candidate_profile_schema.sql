-- Run in Supabase SQL Editor to support the advanced candidate profile, resume, and application tracking systems.

-- 1. Add fields to profiles for candidate portfolios, experience, education, and settings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS work_experience jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_links jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_picture_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS visibility boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bookmarked_jobs jsonb DEFAULT '[]'::jsonb;

-- 2. Add fields to resumes for resume score, completeness, and parsed structures
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS resume_score int DEFAULT 0;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS completeness int DEFAULT 0;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS parsed_details jsonb DEFAULT '{}'::jsonb;

-- 3. Add fields to applications for support files and interview details
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS supporting_files jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS interview_schedule jsonb DEFAULT '{}'::jsonb;

-- 4. Create the notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL, -- 'job_match', 'application_update', 'interview', 'message', 'announcement'
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists and create new ones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications" ON public.notifications
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications" ON public.notifications
      FOR UPDATE TO authenticated USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' AND policyname = 'Users can delete own notifications'
  ) THEN
    CREATE POLICY "Users can delete own notifications" ON public.notifications
      FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- Enable permissions
GRANT ALL ON public.notifications TO authenticated, anon;
