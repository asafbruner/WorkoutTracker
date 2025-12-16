import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase credentials are provided
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co'))
}

// Create Supabase client with PostgREST preferences
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    })
  : null

// Track if Supabase is working (determined lazily on first use)
let supabaseStatus = null // null = not checked, true = working, false = not working

// No upfront table check - just try to use it and handle errors
export const isSupabaseReady = () => {
  // Return cached status if we've checked before
  if (supabaseStatus !== null) {
    return Promise.resolve(supabaseStatus)
  }
  
  // If not configured, return false immediately
  if (!isSupabaseConfigured() || !supabase) {
    supabaseStatus = false
    return Promise.resolve(false)
  }
  
  // Return true optimistically - we'll handle errors when operations fail
  // This avoids any upfront table check that could cause 406 errors
  return Promise.resolve(true)
}

// Mark Supabase as working (called after successful operation)
export const markSupabaseWorking = () => {
  if (supabaseStatus === null) {
    supabaseStatus = true
    console.info('✅ Supabase connected - data will sync to cloud')
  }
}

// Mark Supabase as not working (called after failed operation)
export const markSupabaseNotWorking = () => {
  if (supabaseStatus === null) {
    supabaseStatus = false
    console.info('ℹ️ Using localStorage only. Supabase table may not be set up. See SUPABASE_SETUP.md to enable cloud sync.')
  }
}
