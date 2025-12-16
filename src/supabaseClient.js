import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// IMPORTANT: You need to replace these with your actual Supabase credentials
// Get them from: https://app.supabase.com/project/_/settings/api

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  const isConfigured = supabaseUrl !== 'YOUR_SUPABASE_URL' && 
                       supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
                       supabaseUrl && 
                       supabaseAnonKey &&
                       supabaseUrl.includes('supabase.co')
  
  return isConfigured
}

// Only create the client if properly configured
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    })
  : null
