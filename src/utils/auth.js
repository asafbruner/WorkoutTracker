/**
 * Authentication utilities with proper password hashing
 */

/**
 * Simple hash function using Web Crypto API
 * For production, consider using bcrypt or argon2 on backend
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Get stored password hash from environment or storage
 */
export function getPasswordHash() {
  // Check environment variable first
  const envHash = import.meta.env.VITE_PASSWORD_HASH;
  if (envHash) {
    return envHash;
  }
  
  // Fallback to default (this should be changed!)
  // Default password: "asaf2024"
  // Hash: 74d890b9caffa445e0bd18bacf419de1c4bcb9acec0b2e0c124559d4da8289d3
  return '74d890b9caffa445e0bd18bacf419de1c4bcb9acec0b2e0c124559d4da8289d3';
}

/**
 * Change password
 */
export async function changePassword(currentPassword, newPassword) {
  const currentHash = getPasswordHash();
  const isValid = await verifyPassword(currentPassword, currentHash);
  
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }
  
  const newHash = await hashPassword(newPassword);
  
  // Store new hash in storage
  await window.storage.set('password_hash', newHash);
  
  return { success: true, hash: newHash };
}

/**
 * Check if custom password is set
 */
export async function hasCustomPassword() {
  const stored = await window.storage.get('password_hash');
  return !!stored?.value;
}

/**
 * Get active password hash (custom or default)
 */
export async function getActivePasswordHash() {
  try {
    const stored = await window.storage.get('password_hash');
    if (stored?.value) {
      return stored.value;
    }
  } catch (error) {
    console.error('Error getting password hash from storage:', error);
  }
  return getPasswordHash();
}
