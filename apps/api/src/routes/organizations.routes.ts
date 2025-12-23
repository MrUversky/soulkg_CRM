/**
 * Organizations Routes
 * 
 * API endpoints for managing organizations
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@soul-kg-crm/database';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Validation schemas
const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').optional(),
  logo: z.string().url('Invalid logo URL').optional().or(z.literal('')),
  settings: z.record(z.any()).optional(),
});

/**
 * GET /api/organizations
 * 
 * Get list of organizations for the authenticated user.
 * In MVP, users belong to one organization, but this endpoint supports future multi-org scenarios.
 * Returns an array with the user's organization.
 * 
 * @route GET /api/organizations
 * @access Private (requires authentication)
 * @returns {Object} data - Array containing the user's organization object
 * @returns {string} data[].id - Organization UUID
 * @returns {string} data[].name - Organization name
 * @returns {string} data[].slug - Organization slug
 * @returns {string|null} data[].logo - Organization logo URL
 * @returns {Object} data[].settings - Organization settings
 * @returns {string} data[].createdAt - Organization creation timestamp (ISO string)
 * @returns {string} data[].updatedAt - Organization update timestamp (ISO string)
 * @throws {401} Unauthorized if not authenticated
 * @throws {404} Not found if user doesn't exist
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Get user's organization(s)
    // In MVP: user belongs to one organization
    // Future: support for users in multiple organizations
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        organization: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Return user's organization
    res.json({
      data: [
        {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
          logo: user.organization.logo,
          settings: user.organization.settings,
          createdAt: user.organization.createdAt.toISOString(),
          updatedAt: user.organization.updatedAt.toISOString(),
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      error: 'Failed to fetch organizations',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/organizations/:id
 * 
 * Get organization details by ID.
 * Users can only access their own organization.
 * 
 * @route GET /api/organizations/:id
 * @access Private (requires authentication)
 * @param {string} id - Organization UUID
 * @returns {Object} Organization object
 * @returns {string} id - Organization UUID
 * @returns {string} name - Organization name
 * @returns {string} slug - Organization slug
 * @returns {string|null} logo - Organization logo URL
 * @returns {Object} settings - Organization settings
 * @returns {string} createdAt - Organization creation timestamp (ISO string)
 * @returns {string} updatedAt - Organization update timestamp (ISO string)
 * @throws {401} Unauthorized if not authenticated
 * @throws {403} Forbidden if user doesn't belong to this organization
 * @throws {404} Not found if organization doesn't exist
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    // Verify user belongs to this organization
    if (req.user.organizationId !== id) {
      res.status(403).json({ error: 'Access denied to this organization' });
      return;
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!organization) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    res.json({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      settings: organization.settings,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({
      error: 'Failed to fetch organization',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * PUT /api/organizations/:id
 * 
 * Update organization information.
 * Only ADMIN and SUPER_ADMIN roles can update organization.
 * When name is updated, slug is automatically regenerated.
 * 
 * @route PUT /api/organizations/:id
 * @access Private (requires ADMIN or SUPER_ADMIN role)
 * @param {string} id - Organization UUID
 * @body {string} [name] - Organization name (optional, regenerates slug if provided)
 * @body {string} [logo] - Organization logo URL (optional, empty string to remove)
 * @body {Object} [settings] - Organization settings object (optional)
 * @returns {Object} Updated organization object
 * @returns {string} id - Organization UUID
 * @returns {string} name - Organization name
 * @returns {string} slug - Organization slug (auto-generated from name)
 * @returns {string|null} logo - Organization logo URL
 * @returns {Object} settings - Organization settings
 * @returns {string} createdAt - Organization creation timestamp (ISO string)
 * @returns {string} updatedAt - Organization update timestamp (ISO string)
 * @throws {400} Validation error if input is invalid
 * @throws {401} Unauthorized if not authenticated
 * @throws {403} Forbidden if user doesn't have ADMIN role or doesn't belong to organization
 * @throws {409} Conflict if organization with this name already exists
 */
router.put(
  '/:id',
  authenticateToken,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { id } = req.params;

      // Verify user belongs to this organization
      if (req.user.organizationId !== id) {
        res.status(403).json({ error: 'Access denied to this organization' });
        return;
      }

      const body = updateOrganizationSchema.parse(req.body);
      const { name, logo, settings } = body;

      // If name is being updated, check if slug needs to be regenerated
      let updateData: {
        name?: string;
        slug?: string;
        logo?: string | null;
        settings?: any;
      } = {};

      if (name) {
        updateData.name = name;
        // Generate slug from name
        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // Check if slug already exists (excluding current org)
        const existingOrg = await prisma.organization.findFirst({
          where: {
            slug,
            id: { not: id },
          },
        });

        if (existingOrg) {
          res.status(409).json({ error: 'Organization with this name already exists' });
          return;
        }

        updateData.slug = slug;
      }

      if (logo !== undefined) {
        updateData.logo = logo || null;
      }

      if (settings !== undefined) {
        updateData.settings = settings;
      }

      const organization = await prisma.organization.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        settings: organization.settings,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }

      console.error('Error updating organization:', error);
      res.status(500).json({
        error: 'Failed to update organization',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

export default router;




