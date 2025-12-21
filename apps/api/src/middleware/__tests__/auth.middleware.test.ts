/**
 * Auth Middleware Tests
 * 
 * Unit tests for authentication middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken, requireRole } from '../auth.middleware';
import { generateAccessToken } from '../../utils/jwt';

// Mock Express types
const createMockRequest = (headers: Record<string, string> = {}): Partial<Request> => ({
  headers,
} as Request);

const createMockResponse = (): Partial<Response> => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const createMockNext = (): NextFunction => {
  return vi.fn();
};

describe('Auth Middleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key';
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', () => {
      const token = generateAccessToken({
        userId: 'user-123',
        organizationId: 'org-456',
        role: 'ADMIN',
      });

      const req = createMockRequest({
        authorization: `Bearer ${token}`,
      }) as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe('user-123');
      expect(req.user?.organizationId).toBe('org-456');
    });

    it('should reject request without token', () => {
      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      authenticateToken(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });

    it('should reject request with invalid token', () => {
      const req = createMockRequest({
        authorization: 'Bearer invalid-token',
      }) as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      authenticateToken(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    });

    it('should handle token without Bearer prefix', () => {
      const token = generateAccessToken({
        userId: 'user-123',
        organizationId: 'org-456',
        role: 'ADMIN',
      });

      const req = createMockRequest({
        authorization: token, // Missing "Bearer " prefix
      }) as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      authenticateToken(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireRole', () => {
    it('should allow access for user with required role', () => {
      const req = createMockRequest() as Request;
      req.user = {
        userId: 'user-123',
        organizationId: 'org-456',
        role: 'ADMIN',
      };
      const res = createMockResponse() as Response;
      const next = createMockNext();

      const middleware = requireRole('ADMIN');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access for SUPER_ADMIN when explicitly allowed', () => {
      const req = createMockRequest() as Request;
      req.user = {
        userId: 'user-123',
        organizationId: 'org-456',
        role: 'SUPER_ADMIN',
      };
      const res = createMockResponse() as Response;
      const next = createMockNext();

      // SUPER_ADMIN is explicitly in the allowed roles list
      const middleware = requireRole('ADMIN', 'SUPER_ADMIN');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject access for user without required role', () => {
      const req = createMockRequest() as Request;
      req.user = {
        userId: 'user-123',
        organizationId: 'org-456',
        role: 'MANAGER',
      };
      const res = createMockResponse() as Response;
      const next = createMockNext();

      const middleware = requireRole('ADMIN');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
    });

    it('should reject access for unauthenticated user', () => {
      const req = createMockRequest() as Request;
      // No req.user
      const res = createMockResponse() as Response;
      const next = createMockNext();

      const middleware = requireRole('ADMIN');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });
  });
});

