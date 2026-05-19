import { supabase } from './supabase'

function extractResumeStoragePath(fileUrl) {
  if (!fileUrl) return null

  const markers = [
    '/storage/v1/object/public/resumes/',
    '/storage/v1/object/sign/resumes/',
    '/storage/v1/object/authenticated/resumes/',
  ]

  for (const marker of markers) {
    const index = fileUrl.indexOf(marker)
    if (index !== -1) {
      return decodeURIComponent(fileUrl.slice(index + marker.length).split('?')[0])
    }
  }

  const fallback = fileUrl.indexOf('/resumes/')
  if (fallback !== -1) {
    return decodeURIComponent(fileUrl.slice(fallback + '/resumes/'.length).split('?')[0])
  }

  return null
}

export async function getResumeViewUrl(fileUrl) {
  if (!fileUrl) return { url: null, error: new Error('No resume URL') }

  const storagePath = extractResumeStoragePath(fileUrl)
  if (!storagePath) {
    return { url: fileUrl, error: null }
  }

  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(storagePath, 60 * 60)

  if (error || !data?.signedUrl) {
    return { url: fileUrl, error }
  }

  return { url: data.signedUrl, error: null }
}

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