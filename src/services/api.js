import { supabase } from './supabase'

// Upload resume file to Supabase Storage
export const uploadResume = async (file, userId) => {
  const fileName = `${userId}/${Date.now()}_${file.name}`
  
  const { data, error } = await supabase.storage
    .from('resumes')
    .upload(fileName, file)
  
  if (error) return { data: null, error }
  
  const { data: urlData } = supabase.storage
    .from('resumes')
    .getPublicUrl(fileName)
  
  return { data: urlData.publicUrl, error: null }
}

// Save resume record to database
export const saveResumeRecord = async (applicantId, fileUrl, extractedSkills) => {
  const { data, error } = await supabase
    .from('resumes')
    .insert([{
      applicant_id: applicantId,
      file_url: fileUrl,
      extracted_skills: extractedSkills
    }])
  return { data, error }
}

// Get resume by applicant
export const getResume = async (applicantId) => {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('applicant_id', applicantId)
    .maybeSingle()
  return { data, error }
}