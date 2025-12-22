/**
 * Clients Routes
 * 
 * API endpoints for managing clients
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@soul-kg-crm/database';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Client status enum (must match Prisma schema)
const ClientStatusEnum = z.enum([
  'NEW_LEAD',
  'QUALIFIED',
  'WARMED',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'SOLD',
  'SERVICE',
  'CLOSED',
]);

// Validation schemas
const createClientSchema = z.object({
  phone: z.string().regex(/^\+996\d{9}$/, 'Phone must be in format +996XXXXXXXXX'),
  email: z.string().email('Invalid email format').optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  status: ClientStatusEnum.optional().default('NEW_LEAD'),
  preferredLanguage: z.string().optional(),
});

const updateClientSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  status: ClientStatusEnum.optional(),
  preferredLanguage: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: ClientStatusEnum,
  reason: z.string().optional(),
});

const listClientsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  status: ClientStatusEnum.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'lastMessageAt', 'firstName']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const conversationsQuerySchema = z.object({
  channel: z.enum(['WHATSAPP', 'TELEGRAM', 'EMAIL']).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  offset: z.string().regex(/^\d+$/).transform(Number).optional().default('0'),
});

const messagesQuerySchema = z.object({
  conversationId: z.string().uuid().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('50'),
  offset: z.string().regex(/^\d+$/).transform(Number).optional().default('0'),
  search: z.string().optional(),
});

/**
 * GET /api/clients
 * 
 * Get paginated list of clients for the authenticated user's organization.
 * Supports filtering by status, search by name/phone/email, and sorting.
 * 
 * @route GET /api/clients
 * @access Private (requires authentication)
 * @query {number} [page=1] - Page number (default: 1)
 * @query {number} [limit=20] - Items per page (default: 20)
 * @query {string} [status] - Filter by client status (NEW_LEAD, QUALIFIED, etc.)
 * @query {string} [search] - Search in firstName, lastName, phone, email
 * @query {string} [sortBy=createdAt] - Sort field (createdAt, updatedAt, lastMessageAt, firstName)
 * @query {string} [sortOrder=desc] - Sort order (asc, desc)
 * @returns {Object} data - Array of client objects
 * @returns {Object} pagination - Pagination metadata (page, limit, total, totalPages)
 * @throws {401} Unauthorized if not authenticated
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const query = listClientsQuerySchema.parse(req.query);
    const { page, limit, status, search, sortBy, sortOrder } = query;

    // Build where clause
    const where: any = {
      organizationId: req.user.organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await prisma.client.count({ where });

    // Get clients
    const clients = await prisma.client.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        preferredLanguage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get last message date for each client (if needed)
    // For MVP, we'll skip this optimization

    res.json({
      data: clients.map((client) => ({
        ...client,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Error fetching clients:', error);
    res.status(500).json({
      error: 'Failed to fetch clients',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/clients/:id
 * 
 * Get detailed information about a specific client by ID.
 * Includes conversation metadata (last message date).
 * 
 * @route GET /api/clients/:id
 * @access Private (requires authentication)
 * @param {string} id - Client UUID
 * @returns {Object} Client object with full details
 * @throws {401} Unauthorized if not authenticated
 * @throws {403} Forbidden if client belongs to different organization
 * @throws {404} Not found if client doesn't exist
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        conversations: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            lastMessageAt: true,
          },
        },
      },
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    // Verify client belongs to user's organization
    if (client.organizationId !== req.user.organizationId) {
      res.status(403).json({ error: 'Access denied to this client' });
      return;
    }

    res.json({
      id: client.id,
      phone: client.phone,
      email: client.email,
      firstName: client.firstName,
      lastName: client.lastName,
      status: client.status,
      preferredLanguage: client.preferredLanguage,
      culturalContext: client.culturalContext,
      metadata: client.metadata,
      lastMessageAt: client.conversations[0]?.lastMessageAt?.toISOString() || null,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({
      error: 'Failed to fetch client',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/clients
 * 
 * Create a new client in the authenticated user's organization.
 * Phone number must be unique within the organization.
 * 
 * @route POST /api/clients
 * @access Private (requires authentication)
 * @body {string} phone - Phone number in format +996XXXXXXXXX (required)
 * @body {string} [email] - Email address (optional)
 * @body {string} [firstName] - First name (optional)
 * @body {string} [lastName] - Last name (optional)
 * @body {string} [status=NEW_LEAD] - Client status (optional, default: NEW_LEAD)
 * @body {string} [preferredLanguage] - Preferred language code (optional)
 * @returns {Object} Created client object
 * @throws {400} Validation error if input is invalid
 * @throws {401} Unauthorized if not authenticated
 * @throws {409} Conflict if client with phone number already exists
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const body = createClientSchema.parse(req.body);
    const { phone, email, firstName, lastName, status, preferredLanguage } = body;

    // Check if client already exists in this organization
    const existingClient = await prisma.client.findFirst({
      where: {
        organizationId: req.user.organizationId,
        phone,
      },
    });

    if (existingClient) {
      res.status(409).json({ error: 'Client with this phone number already exists' });
      return;
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        phone,
        email,
        firstName,
        lastName,
        status: status || 'NEW_LEAD',
        preferredLanguage,
        organizationId: req.user.organizationId,
      },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        preferredLanguage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({
      ...client,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Error creating client:', error);
    res.status(500).json({
      error: 'Failed to create client',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * PUT /api/clients/:id
 * 
 * Update client information. Only provided fields will be updated.
 * Phone number cannot be changed (use delete + create if needed).
 * 
 * @route PUT /api/clients/:id
 * @access Private (requires authentication)
 * @param {string} id - Client UUID
 * @body {string} [email] - Email address (optional)
 * @body {string} [firstName] - First name (optional)
 * @body {string} [lastName] - Last name (optional)
 * @body {string} [status] - Client status (optional)
 * @body {string} [preferredLanguage] - Preferred language code (optional)
 * @returns {Object} Updated client object
 * @throws {400} Validation error if input is invalid
 * @throws {401} Unauthorized if not authenticated
 * @throws {403} Forbidden if client belongs to different organization
 * @throws {404} Not found if client doesn't exist
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const body = updateClientSchema.parse(req.body);

    // Check if client exists and belongs to organization
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    // Verify client belongs to user's organization
    if (existingClient.organizationId !== req.user.organizationId) {
      res.status(403).json({ error: 'Access denied to this client' });
      return;
    }

    // Update client
    const client = await prisma.client.update({
      where: { id },
      data: body,
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        preferredLanguage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      ...client,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Error updating client:', error);
    res.status(500).json({
      error: 'Failed to update client',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * PATCH /api/clients/:id/status
 * 
 * Update client status and track status change history.
 * Creates a status history entry for audit purposes.
 * 
 * @route PATCH /api/clients/:id/status
 * @access Private (requires authentication)
 * @param {string} id - Client UUID
 * @body {string} status - New client status (required)
 * @body {string} [reason] - Reason for status change (optional)
 * @returns {Object} Updated client object with new status
 * @throws {400} Validation error if input is invalid
 * @throws {401} Unauthorized if not authenticated
 * @throws {403} Forbidden if client belongs to different organization
 * @throws {404} Not found if client doesn't exist
 */
router.patch('/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const body = updateStatusSchema.parse(req.body);
    const { status, reason } = body;

    // Check if client exists and belongs to organization
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    // Verify client belongs to user's organization
    if (existingClient.organizationId !== req.user.organizationId) {
      res.status(403).json({ error: 'Access denied to this client' });
      return;
    }

    // Update client status and create history record in a transaction
    const [client] = await prisma.$transaction([
      prisma.client.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          preferredLanguage: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.clientStatusHistory.create({
        data: {
          clientId: id,
          organizationId: req.user.organizationId,
          oldStatus: existingClient.status,
          newStatus: status,
          changedBy: 'HUMAN',
          changedById: req.user.userId,
          reason: reason || null,
        },
      }),
    ]);

    res.json({
      ...client,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Error updating client status:', error);
    res.status(500).json({
      error: 'Failed to update client status',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/clients/:id/conversations
 * 
 * Get list of conversations for a specific client.
 * Supports filtering by channel and status, with pagination.
 * 
 * @route GET /api/clients/:id/conversations
 * @access Private (requires authentication)
 * @param {string} id - Client UUID
 * @query {string} [channel] - Filter by channel (WHATSAPP, TELEGRAM, EMAIL)
 * @query {string} [status] - Filter by status (ACTIVE, ARCHIVED)
 * @query {number} [limit=20] - Maximum number of conversations to return
 * @query {number} [offset=0] - Number of conversations to skip
 * @returns {Object} data - Array of conversation objects
 * @returns {Object} pagination - Pagination metadata (total, limit, offset)
 * @throws {401} Unauthorized if not authenticated
 * @throws {403} Forbidden if client belongs to different organization
 * @throws {404} Not found if client doesn't exist
 */
router.get('/:id/conversations', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const query = conversationsQuerySchema.parse(req.query);
    const { channel, status, limit, offset } = query;

    // Verify client exists and belongs to user's organization
    const client = await prisma.client.findUnique({
      where: { id },
      select: { id: true, organizationId: true },
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    if (client.organizationId !== req.user.organizationId) {
      res.status(403).json({ error: 'Access denied to this client' });
      return;
    }

    // Build where clause
    const where: any = {
      clientId: id,
      organizationId: req.user.organizationId,
    };

    if (channel) {
      where.channel = channel;
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.conversation.count({ where });

    // Get conversations
    const conversations = await prisma.conversation.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
      select: {
        id: true,
        channel: true,
        status: true,
        managedBy: true,
        lastMessageAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    res.json({
      data: conversations.map((conv) => ({
        id: conv.id,
        channel: conv.channel,
        status: conv.status,
        managedBy: conv.managedBy,
        lastMessageAt: conv.lastMessageAt?.toISOString() || null,
        messageCount: conv._count.messages,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
      })),
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Error fetching conversations:', error);
    res.status(500).json({
      error: 'Failed to fetch conversations',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/clients/:id/messages
 * 
 * Get messages for a specific client.
 * Supports filtering by conversation, search, and pagination.
 * Messages are sorted by creation date (newest first).
 * 
 * @route GET /api/clients/:id/messages
 * @access Private (requires authentication)
 * @param {string} id - Client UUID
 * @query {string} [conversationId] - Filter by conversation ID
 * @query {number} [limit=50] - Maximum number of messages to return
 * @query {number} [offset=0] - Number of messages to skip
 * @query {string} [search] - Search in message content
 * @returns {Object} data - Array of message objects
 * @returns {Object} pagination - Pagination metadata (total, limit, offset)
 * @throws {401} Unauthorized if not authenticated
 * @throws {403} Forbidden if client belongs to different organization
 * @throws {404} Not found if client doesn't exist
 */
router.get('/:id/messages', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const query = messagesQuerySchema.parse(req.query);
    const { conversationId, limit, offset, search } = query;

    // Verify client exists and belongs to user's organization
    const client = await prisma.client.findUnique({
      where: { id },
      select: { id: true, organizationId: true },
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    if (client.organizationId !== req.user.organizationId) {
      res.status(403).json({ error: 'Access denied to this client' });
      return;
    }

    // Build where clause
    const where: any = {
      organizationId: req.user.organizationId,
      conversation: {
        clientId: id,
      },
    };

    if (conversationId) {
      where.conversationId = conversationId;
    }

    if (search) {
      where.content = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Get total count
    const total = await prisma.message.count({ where });

    // Get messages
    const messages = await prisma.message.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        conversation: {
          select: {
            id: true,
            channel: true,
          },
        },
        sentByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      select: {
        id: true,
        conversationId: true,
        direction: true,
        sender: true,
        senderId: true,
        content: true,
        language: true,
        translatedContent: true,
        status: true,
        createdAt: true,
        conversation: {
          select: {
            id: true,
            channel: true,
          },
        },
        sentByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({
      data: messages.map((msg) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        conversation: {
          id: msg.conversation.id,
          channel: msg.conversation.channel,
        },
        direction: msg.direction,
        sender: msg.sender,
        senderId: msg.senderId,
        senderUser: msg.sentByUser
          ? {
              id: msg.sentByUser.id,
              firstName: msg.sentByUser.firstName,
              lastName: msg.sentByUser.lastName,
            }
          : null,
        content: msg.content,
        language: msg.language,
        translatedContent: msg.translatedContent,
        status: msg.status,
        createdAt: msg.createdAt.toISOString(),
      })),
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Error fetching messages:', error);
    res.status(500).json({
      error: 'Failed to fetch messages',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/clients/:id/status-history
 * 
 * Get status change history for a specific client.
 * Returns chronological list of status changes with who changed it and why.
 * 
 * @route GET /api/clients/:id/status-history
 * @access Private (requires authentication)
 * @param {string} id - Client UUID
 * @returns {Object} data - Array of status history objects
 * @throws {401} Unauthorized if not authenticated
 * @throws {403} Forbidden if client belongs to different organization
 * @throws {404} Not found if client doesn't exist
 */
router.get('/:id/status-history', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    // Verify client exists and belongs to user's organization
    const client = await prisma.client.findUnique({
      where: { id },
      select: { id: true, organizationId: true },
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    if (client.organizationId !== req.user.organizationId) {
      res.status(403).json({ error: 'Access denied to this client' });
      return;
    }

    // Get status history
    const statusHistory = await prisma.clientStatusHistory.findMany({
      where: {
        clientId: id,
        organizationId: req.user.organizationId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      select: {
        id: true,
        oldStatus: true,
        newStatus: true,
        changedBy: true,
        changedById: true,
        reason: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      data: statusHistory.map((entry) => ({
        id: entry.id,
        oldStatus: entry.oldStatus,
        newStatus: entry.newStatus,
        changedBy: entry.changedBy,
        changedById: entry.changedById,
        changedByUser: entry.user
          ? {
              id: entry.user.id,
              firstName: entry.user.firstName,
              lastName: entry.user.lastName,
              email: entry.user.email,
            }
          : null,
        reason: entry.reason,
        createdAt: entry.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching status history:', error);
    res.status(500).json({
      error: 'Failed to fetch status history',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

