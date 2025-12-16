import { supabase, isSupabaseConfigured } from './supabaseClient'

// Hybrid storage implementation
// Uses Supabase when configured, falls back to localStorage

const storage = {
  async get(key) {
    // Try Supabase first if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('user_data')
          .select('value')
          .eq('key', key)
          .single()
        
        if (error) {
          if (error.code !== 'PGRST116') { // Not found is ok
            console.error('Supabase get error:', error)
          }
          // Fall back to localStorage
          return this.getFromLocalStorage(key)
        }
        
        return data ? { value: data.value } : null
      } catch (error) {
        console.error('Supabase get error:', error)
        return this.getFromLocalStorage(key)
      }
    }
    
    // Use localStorage if Supabase not configured
    return this.getFromLocalStorage(key)
  },

  async set(key, value) {
    // Save to localStorage first (as backup)
    this.setToLocalStorage(key, value)
    
    // Try Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('user_data')
          .upsert({ 
            key, 
            value,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'key'
          })
        
        if (error) {
          console.error('Supabase set error:', error)
        }
        
        return { success: !error }
      } catch (error) {
        console.error('Supabase set error:', error)
        return { success: false }
      }
    }
    
    return { success: true }
  },

  async delete(key) {
    // Delete from localStorage
    this.deleteFromLocalStorage(key)
    
    // Try Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('user_data')
          .delete()
          .eq('key', key)
        
        if (error) {
          console.error('Supabase delete error:', error)
        }
        
        return { success: !error }
      } catch (error) {
        console.error('Supabase delete error:', error)
        return { success: false }
      }
    }
    
    return { success: true }
  },

  // LocalStorage helpers
  getFromLocalStorage(key) {
    try {
      const value = localStorage.getItem(key)
      return value ? { value } : null
    } catch (error) {
      console.error('LocalStorage get error:', error)
      return null
    }
  },

  setToLocalStorage(key, value) {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.error('LocalStorage set error:', error)
    }
  },

  deleteFromLocalStorage(key) {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('LocalStorage delete error:', error)
    }
  },

  // Migration helper: sync localStorage to Supabase
  async migrateToSupabase() {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase not configured' }
    }

    try {
      const keys = ['workout_logs', 'workout_program', 'auth_state']
      let migrated = 0

      for (const key of keys) {
        const value = localStorage.getItem(key)
        if (value) {
          await this.set(key, value)
          migrated++
        }
      }

      return { success: true, message: `Migrated ${migrated} items to Supabase` }
    } catch (error) {
      console.error('Migration error:', error)
      return { success: false, message: 'Migration failed' }
    }
  },

  // Export all data
  async exportData() {
    const data = {
      workout_logs: null,
      workout_program: null,
      exported_at: new Date().toISOString()
    }

    try {
      const logsResult = await this.get('workout_logs')
      if (logsResult?.value) {
        data.workout_logs = JSON.parse(logsResult.value)
      }

      const programResult = await this.get('workout_program')
      if (programResult?.value) {
        data.workout_program = JSON.parse(programResult.value)
      }

      return data
    } catch (error) {
      console.error('Export error:', error)
      throw error
    }
  },

  // Import data
  async importData(data) {
    try {
      if (data.workout_logs) {
        await this.set('workout_logs', JSON.stringify(data.workout_logs))
      }

      if (data.workout_program) {
        await this.set('workout_program', JSON.stringify(data.workout_program))
      }

      return { success: true, message: 'Data imported successfully' }
    } catch (error) {
      console.error('Import error:', error)
      return { success: false, message: 'Import failed' }
    }
  }
}

// Attach to window object so the WorkoutTracker component can use it
window.storage = storage

export default storage
