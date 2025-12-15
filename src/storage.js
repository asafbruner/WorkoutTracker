// LocalStorage-based storage implementation for the workout tracker
// This provides a simple key-value storage API that persists data in the browser

const storage = {
  async get(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  async set(key, value) {
    try {
      localStorage.setItem(key, value);
      return { success: true };
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  },

  async delete(key) {
    try {
      localStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      console.error('Storage delete error:', error);
      throw error;
    }
  }
};

// Attach to window object so the WorkoutTracker component can use it
window.storage = storage;

export default storage;
