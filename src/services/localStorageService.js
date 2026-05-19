import { supabase } from './supabase'

// Save user profile to Supabase
export const saveProfile = async (userId, profileData) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert([{ id: userId, ...profileData }])
  return { data, error }
}

// Get user profile
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

// Update user profile
export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
  return { data, error }
}

// --- Local Storage Functions ---
const USER_KEY = "skillsync_user"
const PROFILE_KEY = "skillsync_candidate_profile"

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem(USER_KEY)
    return user ? JSON.parse(user) : null
  } catch (error) {
    console.error("Error reading current user from localStorage:", error)
    return null
  }
}

export const setCurrentUser = (user) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch (error) {
    console.error("Error writing current user to localStorage:", error)
  }
}

export const getCandidateProfile = () => {
  try {
    const profile = localStorage.getItem(PROFILE_KEY)
    return profile ? JSON.parse(profile) : null
  } catch (error) {
    console.error("Error reading candidate profile from localStorage:", error)
    return null
  }
}

export const saveCandidateProfile = (profileData) => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData))
  } catch (error) {
    console.error("Error saving candidate profile to localStorage:", error)
  }
}