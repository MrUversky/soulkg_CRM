/**
 * Import Routes
 * 
 * API endpoints for data import
 */

import { Router } from 'express';
import { z } from 'zod';

// Dynamic import to handle optional dependency
let DataImportService: any = null;
try {
  const dataImportModule = require('@soul-kg-crm/data-import');
  DataImportService = dataImportModule.DataImportService;
} catch (error) {
  console.warn('⚠️  Data import module not available:', (error as Error).message);
}

const router = Router();

// Store active imports (in production, use Redis or database)
const activeImports = new Map<string, any>();

// Validation schemas
const startImportSchema = z.object({
  organizationId: z.string().uuid(),
  importContacts: z.boolean().optional().default(true),
  importMessages: z.boolean().optional().default(true),
  detectStatus: z.boolean().optional().default(true),
  skipDuplicates: z.boolean().optional().default(true),
  dryRun: z.boolean().optional().default(false),
});

/**
 * POST /api/import/whatsapp/start
 * 
 * Start WhatsApp data import process.
 * Initializes WhatsApp connection and returns QR code for authentication.
 * Import runs in background (non-blocking).
 * 
 * @route POST /api/import/whatsapp/start
 * @access Public (but requires organizationId in body)
 * @body {string} organizationId - Organization UUID (required)
 * @body {boolean} [importContacts=true] - Whether to import contacts (optional, default: true)
 * @body {boolean} [importMessages=true] - Whether to import messages (optional, default: true)
 * @body {boolean} [detectStatus=true] - Whether to detect client status (optional, default: true)
 * @body {boolean} [skipDuplicates=true] - Whether to skip duplicate records (optional, default: true)
 * @body {boolean} [dryRun=false] - Test run without saving data (optional, default: false)
 * @returns {Object} Import status object
 * @returns {string} importId - Import UUID for tracking
 * @returns {string} status - Import status (RUNNING)
 * @returns {string} qrCode - QR code string for WhatsApp authentication
 * @returns {string} message - Status message
 * @throws {400} Validation error if input is invalid
 * @throws {503} Service unavailable if data import module is not available
 * @throws {500} Internal server error if import fails to start
 */
router.post('/whatsapp/start', async (req, res) => {
  if (!DataImportService) {
    res.status(503).json({
      error: 'Data import service not available',
      message: 'The data import module is not installed or not available',
    });
    return;
  }

  try {
    const body = startImportSchema.parse(req.body);
    const { organizationId } = body;

    // Create import service
    const importService = new DataImportService(organizationId);

    // Initialize WhatsApp connection
    await importService.initialize();

    // Get QR code
    const qrCode = await importService.getQRCode();

    // Store service
    activeImports.set(importService.importId, importService);

    // Start import in background (non-blocking)
    importService.startImport(body).catch((error: unknown) => {
      console.error(`Import ${importService.importId} failed:`, error);
    });

    res.status(202).json({
      importId: importService.importId,
      status: 'RUNNING',
      qrCode,
      message: 'Import started. Scan QR code to authenticate WhatsApp.',
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }

    console.error('Error starting import:', error);
    res.status(500).json({
      error: 'Failed to start import',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/import/whatsapp/:importId/status
 * 
 * Get status of a WhatsApp data import process.
 * Returns current status and progress information.
 * Note: Status is currently stored in memory (TODO: persist in database).
 * 
 * @route GET /api/import/whatsapp/:importId/status
 * @access Public
 * @param {string} importId - Import UUID
 * @returns {Object} Import status object
 * @returns {string} importId - Import UUID
 * @returns {string} status - Import status (RUNNING, COMPLETED, FAILED, CANCELLED)
 * @returns {string} message - Status message
 * @throws {404} Not found if import doesn't exist
 * @throws {500} Internal server error if status retrieval fails
 */
router.get('/whatsapp/:importId/status', async (req, res) => {
  try {
    const { importId } = req.params;
    const importService = activeImports.get(importId);

    if (!importService) {
      res.status(404).json({ error: 'Import not found' });
      return;
    }

    // TODO: Store import results in database for persistence
    // For now, return basic status
    res.json({
      importId,
      status: 'RUNNING', // TODO: Get actual status from service
      message: 'Import is in progress',
    });
  } catch (error) {
    console.error('Error getting import status:', error);
    res.status(500).json({
      error: 'Failed to get import status',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/import/whatsapp/:importId/cancel
 * 
 * Cancel an active WhatsApp data import process.
 * Disconnects WhatsApp session and removes import from active imports.
 * 
 * @route POST /api/import/whatsapp/:importId/cancel
 * @access Public
 * @param {string} importId - Import UUID
 * @returns {Object} Cancellation status object
 * @returns {string} importId - Import UUID
 * @returns {string} status - Import status (CANCELLED)
 * @returns {string} message - Success message
 * @throws {404} Not found if import doesn't exist
 * @throws {500} Internal server error if cancellation fails
 */
router.post('/whatsapp/:importId/cancel', async (req, res) => {
  try {
    const { importId } = req.params;
    const importService = activeImports.get(importId);

    if (!importService) {
      res.status(404).json({ error: 'Import not found' });
      return;
    }

    await importService.disconnect();
    activeImports.delete(importId);

    res.json({
      importId,
      status: 'CANCELLED',
      message: 'Import cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling import:', error);
    res.status(500).json({
      error: 'Failed to cancel import',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

