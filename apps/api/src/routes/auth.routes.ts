/**
 * Authentication Routes
 * 
 * API endpoints for user authentication (register, login, refresh, logout)
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@soul-kg-crm/database';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organizationId: z.string().uuid().optional(), // Optional: create new org if not provided
  organizationName: z.string().optional(), // Required if organizationId not provided
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /api/auth/register
 * 
 * Register a new user and optionally create a new organization.
 * If organizationId is provided, user is added to existing organization.
 * If organizationName is provided, a new organization is created.
 * First user in organization automatically becomes ADMIN.
 * 
 * @route POST /api/auth/register
 * @access Public
 * @body {string} email - User email (required)
 * @body {string} password - User password, min 8 characters (required)
 * @body {string} [firstName] - User first name (optional)
 * @body {string} [lastName] - User last name (optional)
 * @body {string} [organizationId] - Existing organization ID (optional, requires organizationName if not provided)
 * @body {string} [organizationName] - New organization name (required if organizationId not provided)
 * @returns {Object} user - Created user object
 * @returns {Object} tokens - Access and refresh tokens
 * @throws {400} Validation error if input is invalid
 * @throws {409} Conflict if user or organization already exists
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);
    const { email, password, firstName, lastName, organizationId, organizationName } = body;

    // Check if user already exists
    let organization;
    
    if (organizationId) {
      // Use existing organization
      organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }

      // Check if user already exists in this organization
      const existingUser = await prisma.user.findUnique({
        where: {
          organizationId_email: {
            organizationId,
            email,
          },
        },
      });

      if (existingUser) {
        res.status(409).json({ error: 'User already exists in this organization' });
        return;
      }
    } else {
      // Create new organization
      if (!organizationName) {
        res.status(400).json({ error: 'Organization name is required when creating new organization' });
        return;
      }

      // Generate slug from organization name
      const slug = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if slug already exists
      const existingOrg = await prisma.organization.findUnique({
        where: { slug },
      });

      if (existingOrg) {
        res.status(409).json({ error: 'Organization with this name already exists' });
        return;
      }

      organization = await prisma.organization.create({
        data: {
          name: organizationName,
          slug,
        },
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user (first user in organization becomes ADMIN)
    const userCount = await prisma.user.count({
      where: { organizationId: organization.id },
    });

    const role = userCount === 0 ? 'ADMIN' : 'MANAGER';

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        organizationId: organization.id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate tokens
    const tokens = {
      accessToken: generateAccessToken({
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
      }),
      refreshToken: generateRefreshToken({
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
      }),
    };

    res.status(201).json({
      user,
      tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Failed to register user',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/auth/login
 * 
 * Authenticate user and return access/refresh tokens.
 * Updates lastLoginAt timestamp on successful login.
 * 
 * @route POST /api/auth/login
 * @access Public
 * @body {string} email - User email (required)
 * @body {string} password - User password (required)
 * @returns {Object} user - Authenticated user object (without passwordHash)
 * @returns {Object} tokens - Access and refresh tokens
 * @throws {400} Validation error if input is invalid
 * @throws {401} Unauthorized if email/password is incorrect
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);
    const { email, password } = body;

    // Find user by email (check all organizations)
    const user = await prisma.user.findFirst({
      where: {
        email,
        isActive: true,
      },
      include: {
        organization: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = {
      accessToken: generateAccessToken({
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
      }),
      refreshToken: generateRefreshToken({
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
      }),
    };

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
      tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Login error:', error);
    res.status(500).json({
      error: 'Failed to login',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/auth/refresh
 * 
 * Refresh access token using refresh token.
 * Verifies refresh token and returns new access token.
 * User must still exist and be active.
 * 
 * @route POST /api/auth/refresh
 * @access Public
 * @body {string} refreshToken - Valid refresh token (required)
 * @returns {Object} accessToken - New access token
 * @throws {400} Validation error if input is invalid
 * @throws {403} Forbidden if refresh token is invalid or user is inactive
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const body = refreshTokenSchema.parse(req.body);
    const { refreshToken } = body;

    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      res.status(403).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        organizationId: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(403).json({ error: 'User not found or inactive' });
      return;
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    });

    res.json({
      accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Refresh token error:', error);
    res.status(500).json({
      error: 'Failed to refresh token',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/auth/logout
 * 
 * Logout user. Client should remove tokens from storage.
 * In production, you might want to maintain a blacklist of refresh tokens.
 * 
 * @route POST /api/auth/logout
 * @access Private (requires authentication)
 * @returns {Object} message - Success message
 * @throws {401} Unauthorized if not authenticated
 */
router.post('/logout', authenticateToken, async (_req: Request, res: Response) => {
  // In a production system, you might want to maintain a blacklist of refresh tokens
  // For MVP, we'll just return success and let the client remove tokens
  res.json({
    message: 'Logged out successfully',
  });
});

export default router;

