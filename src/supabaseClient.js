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
let tableCheckPromise = null

const createTable = async () => {
  try {
    // Execute SQL to create the table using Supabase RPC or REST API
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_data (
        id BIGSERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_data_key ON user_data(key);
      
      ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Allow all operations" ON user_data;
      CREATE POLICY "Allow all operations" ON user_data
        FOR ALL
        USING (true)
        WITH CHECK (true);
    `
    
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (error) {
      // If RPC doesn't work, try using the REST API directly
      console.info('ℹ️ Attempting to create table via SQL query...')
      
      // Try using fetch directly to Supabase SQL endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: createTableSQL })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create table: ${response.status}`)
      }
      
      console.info('✅ Supabase table created successfully')
      return true
    }
    
    console.info('✅ Supabase table created successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to create Supabase table:', error.message)
    console.info('ℹ️ Please create the table manually using SUPABASE_SETUP.md')
    return false
  }
}

export const checkTableExists = async () => {
  // Return cached result if available
  if (tableExists !== null) return tableExists
  
  // Return ongoing check if in progress
  if (tableCheckPromise) return tableCheckPromise
  
  if (!isSupabaseConfigured() || !supabase) {
    tableExists = false
    return false
  }

  // Create the check promise
  tableCheckPromise = (async () => {
    try {
      // Try to insert a test record then delete it
      const testKey = '__table_check_test__'
      const { error: insertError } = await supabase
        .from('user_data')
        .insert({ 
          key: testKey, 
          value: 'test',
          updated_at: new Date().toISOString()
        })
      
      if (insertError) {
        // 42P01 = table does not exist
        if (insertError.code === '42P01' || insertError.message?.includes('does not exist')) {
          console.info('ℹ️ Supabase table does not exist. Attempting to create it automatically...')
          
          // Try to create the table
          const created = await createTable()
          
          if (created) {
            // Try insert again
            const { error: retryError } = await supabase
              .from('user_data')
              .insert({ 
                key: testKey, 
                value: 'test',
                updated_at: new Date().toISOString()
              })
            
            if (!retryError) {
              await supabase.from('user_data').delete().eq('key', testKey)
              tableExists = true
              console.info('✅ Supabase table created and connected - data will sync to cloud')
              return true
            }
          }
          
          console.info('ℹ️ Using localStorage only. To enable cloud sync, follow SUPABASE_SETUP.md')
          tableExists = false
          return false
        } else if (insertError.code === '23505') {
          // Unique constraint violation = table exists and this key already exists
          await supabase.from('user_data').delete().eq('key', testKey)
          tableExists = true
          console.info('✅ Supabase connected - data will sync to cloud')
          return true
        } else {
          console.warn('⚠️ Supabase error:', insertError.message)
          tableExists = false
          return false
        }
      }
      
      // Insert succeeded, clean up
      await supabase.from('user_data').delete().eq('key', testKey)
      tableExists = true
      console.info('✅ Supabase connected - data will sync to cloud')
      return true
    } catch (error) {
      console.warn('⚠️ Supabase connection test failed:', error.message)
      tableExists = false
      return false
    } finally {
      tableCheckPromise = null
    }
  })()
  
  return tableCheckPromise
}

// Check if Supabase is ready to use
export const isSupabaseReady = async () => {
  if (!isSupabaseConfigured()) return false
  return await checkTableExists()
}
