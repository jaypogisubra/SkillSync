import { supabase } from './supabase'

// Get all open jobs
export const getJobs = async () => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'open')
  return { data, error }
}

// Get single job by ID
export const getJobById = async (id) => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

// Create a job (employer)
export const createJob = async (jobData) => {
  const { data, error } = await supabase
    .from('jobs')
    .insert([jobData])
  return { data, error }
}

// Apply for a job (job seeker)
export const applyForJob = async (jobId, applicantId) => {
  const { data, error } = await supabase
    .from('applications')
    .insert([{
      job_id: jobId,
      applicant_id: applicantId,
      status: 'applied'
    }])
  return { data, error }
}

// Get applications by applicant
export const getMyApplications = async (applicantId) => {
  const { data, error } = await supabase
    .from('applications')
    .select('*, jobs(*)')
    .eq('applicant_id', applicantId)
  return { data, error }
}