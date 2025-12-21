/**
 * Users Routes
 * 
 * API endpoints for managing users within an organization
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@soul-kg-crm/database';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { hashPassword } from '../utils/password';

const router = Router();

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER']).optional().default('MANAGER'),
});

const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER']).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/users
 * 
 * Get list of all users in the authenticated user's organization.
 * Only ADMIN and SUPER_ADMIN roles can access this endpoint.
 * 
 * @route GET /api/users
 * @access Private (requires ADMIN or SUPER_ADMIN role)
 * @returns {Object} data - Array of user objects (without passwordHash)
 * @throws {401} Unauthorized if not authenticated
 * @throws {403} Forbidden if user doesn't have ADMIN role
 */
router.get('/', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        organizationId: req.user.organizationId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      data: users.map((user) => ({
        ...user,
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/users/:id
 * 
 * Get detailed information about a specific user by ID.
 * Users can view their own profile, ADMIN can view any user in organization.
 * 
 * @route GET /api/users/:id
 * @access Private (requires authentication)
 * @param {string} id - User UUID
 * @returns {Object} User object (without passwordHash)
 * @throws {401} Unauthorized if not authenticated
 * @throws {403} Forbidden if user tries to access another user's profile (non-ADMIN)
 * @throws {404} Not found if user doesn't exist or belongs to different organization
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    // Users can view their own profile, ADMIN can view any user in organization
    if (req.user.userId !== id && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        organizationId: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify user belongs to the same organization
    if (user.organizationId !== req.user.organizationId) {
      res.status(403).json({ error: 'Access denied to this user' });
      return;
    }

    res.json({
      ...user,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/users
 * Create new user in the organization
 * Only ADMIN can create users
 */
router.post('/', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const body = createUserSchema.parse(req.body);
    const { email, password, firstName, lastName, role } = body;

    // Check if user already exists in this organization
    const existingUser = await prisma.user.findUnique({
      where: {
        organizationId_email: {
          organizationId: req.user.organizationId,
          email,
        },
      },
    });

    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists in the organization' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role || 'MANAGER',
        organizationId: req.user.organizationId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({
      ...user,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Error creating user:', error);
    res.status(500).json({
      error: 'Failed to create user',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * PUT /api/users/:id
 * Update user
 * Users can update their own profile (except role), ADMIN can update any user
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const body = updateUserSchema.parse(req.body);

    // Check if user exists and belongs to organization
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify user belongs to the same organization
    if (existingUser.organizationId !== req.user.organizationId) {
      res.status(403).json({ error: 'Access denied to this user' });
      return;
    }

    // Check permissions
    const isSelf = req.user.userId === id;
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    // Users can only update their own profile (except role and isActive)
    if (!isSelf && !isAdmin) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Only ADMIN can change role and isActive
    if ((body.role !== undefined || body.isActive !== undefined) && !isAdmin) {
      res.status(403).json({ error: 'Only ADMIN can change role and active status' });
      return;
    }

    // Check email uniqueness if email is being updated
    if (body.email && body.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: {
          organizationId_email: {
            organizationId: req.user.organizationId,
            email: body.email,
          },
        },
      });

      if (emailExists) {
        res.status(409).json({ error: 'User with this email already exists in the organization' });
        return;
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: body,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      ...user,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Error updating user:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * DELETE /api/users/:id
 * Deactivate user (soft delete by setting isActive = false)
 * Only ADMIN can deactivate users
 */
router.delete('/:id', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    // Prevent self-deletion
    if (req.user.userId === id) {
      res.status(400).json({ error: 'Cannot deactivate your own account' });
      return;
    }

    // Check if user exists and belongs to organization
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify user belongs to the same organization
    if (existingUser.organizationId !== req.user.organizationId) {
      res.status(403).json({ error: 'Access denied to this user' });
      return;
    }

    // Deactivate user (soft delete)
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({
      error: 'Failed to deactivate user',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

