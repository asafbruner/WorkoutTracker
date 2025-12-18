import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hashPassword, verifyPassword, getPasswordHash, getActivePasswordHash, changePassword } from '../src/utils/auth';

// Mock window.storage
global.window = {
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  }
};

describe('Authentication Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password using SHA-256', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 produces 64 hex characters
    });

    it('should produce consistent hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different passwords', async () => {
      const password1 = 'testPassword123';
      const password2 = 'differentPassword456';
      const hash1 = await hashPassword(password1);
      const hash2 = await hashPassword(password2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', async () => {
      const hash = await hashPassword('');
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });

    it('should handle special characters', async () => {
      const password = 'p@$$w0rd!#%';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const correctPassword = 'testPassword123';
      const incorrectPassword = 'wrongPassword456';
      const hash = await hashPassword(correctPassword);
      const isValid = await verifyPassword(incorrectPassword, hash);
      
      expect(isValid).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('testpassword123', hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('getPasswordHash', () => {
    it('should return environment variable hash if set', () => {
      const envHash = 'abc123def456';
      vi.stubEnv('VITE_PASSWORD_HASH', envHash);
      
      const hash = getPasswordHash();
      expect(hash).toBe(envHash);
      
      vi.unstubAllEnvs();
    });

    it('should return default hash if no environment variable', () => {
      // When no env var is set, should return default hash
      const hash = getPasswordHash();
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 hash length
    });
  });

  describe('getActivePasswordHash', () => {
    it('should return custom password hash from storage if available', async () => {
      const customHash = 'custom_hash_123';
      window.storage.get.mockResolvedValue({ value: customHash });
      
      const hash = await getActivePasswordHash();
      
      expect(hash).toBe(customHash);
      expect(window.storage.get).toHaveBeenCalledWith('password_hash');
    });

    it('should return default hash if no custom hash in storage', async () => {
      window.storage.get.mockResolvedValue(null);
      
      const hash = await getActivePasswordHash();
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should handle storage errors gracefully', async () => {
      window.storage.get.mockRejectedValue(new Error('Storage error'));
      
      const hash = await getActivePasswordHash();
      
      expect(hash).toBeDefined();
    });
  });

  describe('changePassword', () => {
    it('should change password with correct current password', async () => {
      const currentPassword = 'oldPassword123';
      const newPassword = 'newPassword456';
      const currentHash = await hashPassword(currentPassword);
      
      // Mock getPasswordHash to return current hash
      vi.stubEnv('VITE_PASSWORD_HASH', currentHash);
      
      window.storage.set.mockResolvedValue({ success: true });
      
      const result = await changePassword(currentPassword, newPassword);
      
      expect(result.success).toBe(true);
      expect(result.hash).toBeDefined();
      expect(window.storage.set).toHaveBeenCalledWith('password_hash', expect.any(String));
      
      vi.unstubAllEnvs();
    });

    it('should reject change with incorrect current password', async () => {
      const currentPassword = 'oldPassword123';
      const wrongPassword = 'wrongPassword';
      const newPassword = 'newPassword456';
      const currentHash = await hashPassword(currentPassword);
      
      vi.stubEnv('VITE_PASSWORD_HASH', currentHash);
      
      await expect(changePassword(wrongPassword, newPassword))
        .rejects.toThrow('Current password is incorrect');
      
      expect(window.storage.set).not.toHaveBeenCalled();
      
      vi.unstubAllEnvs();
    });

    it('should handle storage errors', async () => {
      const currentPassword = 'oldPassword123';
      const newPassword = 'newPassword456';
      const currentHash = await hashPassword(currentPassword);
      
      vi.stubEnv('VITE_PASSWORD_HASH', currentHash);
      window.storage.set.mockRejectedValue(new Error('Storage error'));
      
      await expect(changePassword(currentPassword, newPassword))
        .rejects.toThrow();
      
      vi.unstubAllEnvs();
    });
  });
});
