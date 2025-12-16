import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase credentials are provided
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co'))
}

// Create Supabase client
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null

// Test if the database table is set up correctly
let tableExists = null

export const checkTableExists = async () => {
  if (tableExists !== null) return tableExists
  
  if (!isSupabaseConfigured() || !supabase) {
    tableExists = false
    return false
  }

  try {
    // Try a simple query to check if table exists
    const { error } = await supabase
      .from('user_data')
      .select('key')
      .limit(1)
    
    if (error) {
      // 42P01 = table does not exist
      // PGRST116 = no rows returned (table exists but empty)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('⚠️ Supabase table "user_data" does not exist. Please run the setup SQL from SUPABASE_SETUP.md')
        tableExists = false
      } else if (error.code === 'PGRST116') {
        // Table exists but no data
        tableExists = true
      } else {
        console.warn('⚠️ Supabase error:', error.message)
        tableExists = false
      }
    } else {
      tableExists = true
    }
  } catch (error) {
    console.warn('⚠️ Supabase connection test failed:', error.message)
    tableExists = false
  }
  
  return tableExists
}

// Check if Supabase is ready to use
export const isSupabaseReady = async () => {
  if (!isSupabaseConfigured()) return false
  return await checkTableExists()
}
