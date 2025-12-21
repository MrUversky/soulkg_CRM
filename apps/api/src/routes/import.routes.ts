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
 * Start WhatsApp data import
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
 * Get import status
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
 * Cancel import
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

