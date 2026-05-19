import { supabase } from './supabase'
import { getCurrentUser as getStoredUser } from './localStorageService'

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

// Sign Out — always clear local session even if Supabase is slow
export const signOut = async () => {
  const storedUser = getStoredUser()

  localStorage.removeItem("skillsync_user")
  localStorage.removeItem("skillsync_candidate_profile")
  if (storedUser?.id) {
    localStorage.removeItem(`skillsync_candidate_profile_${storedUser.id}`)
  }

  document.body.style.overflow = ""

  try {
    await Promise.race([
      supabase.auth.signOut(),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ])
  } catch {
    // Local session already cleared
  }

  return { error: null }
}

// Get Current User
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}