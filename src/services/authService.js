import { supabase } from './supabase'

// Sign Up
export const signUp = async (email, password, fullName, role) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role }
    }
  })
  return { data, error }
}

// Sign In
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

// Sign Out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  localStorage.removeItem("skillsync_user")
  localStorage.removeItem("skillsync_candidate_profile")
  return { error }
}

// Get Current User
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}