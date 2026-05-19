import { supabase } from './supabase'

// Get current session token
export const getToken = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

// Check if user is logged in
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

// Get current session
export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}