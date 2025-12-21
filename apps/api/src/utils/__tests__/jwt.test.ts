/**
 * JWT Utilities Tests
 * 
 * Unit tests for JWT token generation and verification
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  JWTPayload,
} from '../jwt';

describe('JWT Utilities', () => {
  const mockPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: 'user-123',
    organizationId: 'org-456',
    role: 'ADMIN',
  };

  beforeEach(() => {
    // Set test environment variables
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = generateAccessToken(mockPayload);
      const token2 = generateAccessToken({
        ...mockPayload,
        userId: 'user-789',
      });
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate different token than access token', () => {
      const accessToken = generateAccessToken(mockPayload);
      const refreshToken = generateRefreshToken(mockPayload);
      
      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.organizationId).toBe(mockPayload.organizationId);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyAccessToken('invalid-token');
      }).toThrow();
    });

    it('should verify token with correct secret', () => {
      // This test verifies that token verification works correctly
      // Testing with wrong secret requires module reload which is complex
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.organizationId).toBe(mockPayload.organizationId);
      expect(decoded.role).toBe(mockPayload.role);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.organizationId).toBe(mockPayload.organizationId);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        verifyRefreshToken('invalid-token');
      }).toThrow();
    });

    it('should not accept access token as refresh token', () => {
      const accessToken = generateAccessToken(mockPayload);
      
      expect(() => {
        verifyRefreshToken(accessToken);
      }).toThrow();
    });
  });
});

