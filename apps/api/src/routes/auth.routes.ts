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
import * as http from 'http';

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
  // #region agent log
  import('http').then(http=>{const r=http.request({hostname:'127.0.0.1',port:7243,path:'/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});r.write(JSON.stringify({location:'auth.routes.ts:198',message:'Login endpoint called',data:{email:req.body?.email,hasPassword:!!req.body?.password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'}));r.end();}).catch(()=>{});
  // #endregion
  try {
    const body = loginSchema.parse(req.body);
    const { email, password } = body;
  // #region agent log
  const log1={location:'auth.routes.ts:203',message:'Searching for user',data:{email,passwordLength:password.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'};const r1=http.request({hostname:'127.0.0.1',port:7243,path:'/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});r1.write(JSON.stringify(log1));r1.end();
  // #endregion

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
    // #region agent log
    const log2={location:'auth.routes.ts:214',message:'User lookup result',data:{userFound:!!user,userId:user?.id,userEmail:user?.email,isActive:user?.isActive,hasPasswordHash:!!user?.passwordHash,passwordHashLength:user?.passwordHash?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'};const r2=http.request({hostname:'127.0.0.1',port:7243,path:'/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});r2.write(JSON.stringify(log2));r2.end();
    // #endregion

    if (!user) {
      // #region agent log
      const log3={location:'auth.routes.ts:217',message:'User not found',data:{email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'};const r3=http.request({hostname:'127.0.0.1',port:7243,path:'/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});r3.write(JSON.stringify(log3));r3.end();
      // #endregion
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    // #region agent log
    const log4={location:'auth.routes.ts:221',message:'Verifying password',data:{passwordLength:password.length,passwordHashLength:user.passwordHash.length,passwordHashPrefix:user.passwordHash.substring(0,10)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};const r4=http.request({hostname:'127.0.0.1',port:7243,path:'/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});r4.write(JSON.stringify(log4));r4.end();
    // #endregion
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    // #region agent log
    const log5={location:'auth.routes.ts:222',message:'Password verification result',data:{isValidPassword},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};const r5=http.request({hostname:'127.0.0.1',port:7243,path:'/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});r5.write(JSON.stringify(log5));r5.end();
    // #endregion
    if (!isValidPassword) {
      // #region agent log
      const log6={location:'auth.routes.ts:223',message:'Password invalid',data:{email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};const r6=http.request({hostname:'127.0.0.1',port:7243,path:'/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});r6.write(JSON.stringify(log6));r6.end();
      // #endregion
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

    // #region agent log
    const log7={location:'auth.routes.ts:246',message:'Sending success response',data:{userId:user.id,hasAccessToken:!!tokens.accessToken,hasRefreshToken:!!tokens.refreshToken,accessTokenLength:tokens.accessToken?.length,refreshTokenLength:tokens.refreshToken?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'};const r7=http.request({hostname:'127.0.0.1',port:7243,path:'/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});r7.write(JSON.stringify(log7));r7.end();
    // #endregion
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

