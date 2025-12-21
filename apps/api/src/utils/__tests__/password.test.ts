/**
 * Password Utilities Tests
 * 
 * Unit tests for password hashing and verification
 */

import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../password';

describe('Password Utilities', () => {
  const plainPassword = 'testPassword123!';

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const hash = await hashPassword(plainPassword);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(plainPassword);
      expect(hash.length).toBeGreaterThan(20); // bcrypt hash is long
    });

    it('should generate different hashes for the same password', async () => {
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);
      
      // bcrypt includes salt, so hashes should be different
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const hash = await hashPassword(plainPassword);
      const isValid = await verifyPassword(plainPassword, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await hashPassword(plainPassword);
      const isValid = await verifyPassword('wrongPassword', hash);
      
      expect(isValid).toBe(false);
    });

    it('should handle empty password', async () => {
      const hash = await hashPassword('');
      const isValid = await verifyPassword('', hash);
      
      expect(isValid).toBe(true);
    });
  });

  describe('hashPassword + verifyPassword integration', () => {
    it('should hash and verify password correctly', async () => {
      const password = 'MySecurePassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should work with special characters', async () => {
      const password = 'P@ssw0rd!#$%^&*()';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should work with unicode characters', async () => {
      const password = 'Пароль123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });
  });
});

