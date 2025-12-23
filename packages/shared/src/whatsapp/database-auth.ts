/**
 * Database-based authentication strategy for WhatsApp Web
 * 
 * Stores session data in PostgreSQL database instead of file system.
 * This allows sessions to persist across container restarts in production.
 * 
 * Uses RemoteAuth with a custom Store implementation that saves to database.
 */

import { RemoteAuth, type Store } from 'whatsapp-web.js';
import { prisma } from '@soul-kg-crm/database';

/**
 * Database store implementation for RemoteAuth
 * 
 * Stores session ZIP archives in WhatsAppSession.sessionData field (as base64 string).
 * RemoteAuth compresses session directory to ZIP, then calls save() to store it.
 * On restore, extract() writes ZIP file to disk for RemoteAuth to decompress.
 */
class DatabaseStore implements Store {
  private organizationId: string;
  private fs: typeof import('fs');
  private dataPath: string; // Store dataPath for ZIP file location

  constructor(organizationId: string, _clientId: string, dataPath?: string) {
    this.organizationId = organizationId;
    // Import fs dynamically (it's available in Node.js)
    this.fs = require('fs');
    // Use provided dataPath or default to current working directory
    this.dataPath = dataPath || process.cwd();
  }

  /**
   * Check if session exists in database
   */
  async sessionExists(_options: { session: string }): Promise<boolean> {
    try {
      const session = await prisma.whatsAppSession.findUnique({
        where: { organizationId: this.organizationId },
        select: { sessionData: true },
      });

      return !!session?.sessionData;
    } catch (error) {
      console.error(`[DatabaseStore] Error checking session existence:`, error);
      return false;
    }
  }

  /**
   * Delete session from database
   */
  async delete(_options: { session: string }): Promise<void> {
    try {
      await prisma.whatsAppSession.update({
        where: { organizationId: this.organizationId },
        data: { sessionData: null },
      });
    } catch (error) {
      console.error(`[DatabaseStore] Error deleting session:`, error);
      throw error;
    }
  }

  /**
   * Save session ZIP archive to database
   * 
   * RemoteAuth creates a ZIP file named `{session}.zip` in the current working directory
   * and calls this method. We read the ZIP file from disk and save it as base64 string in database.
   */
  async save(options: { session: string }): Promise<void> {
    try {
      const path = require('path');
      // RemoteAuth creates ZIP file in dataPath (userDataDir)
      const zipFilePath = path.join(this.dataPath, `${options.session}.zip`);
      
      console.log(`[DatabaseStore] Looking for ZIP file: ${zipFilePath}`);
      console.log(`[DatabaseStore] Data path: ${this.dataPath}`);
      console.log(`[DatabaseStore] Session name: ${options.session}`);
      
      // Check if ZIP file exists (created by RemoteAuth.compressSession)
      if (!this.fs.existsSync(zipFilePath)) {
        // Try current working directory as fallback (for backward compatibility)
        const cwdPath = path.join(process.cwd(), `${options.session}.zip`);
        if (this.fs.existsSync(cwdPath)) {
          console.log(`[DatabaseStore] Found ZIP file at fallback path: ${cwdPath}`);
          const zipBuffer = this.fs.readFileSync(cwdPath);
          await this.saveToDatabase(options.session, zipBuffer);
          return;
        }
        
        console.warn(`[DatabaseStore] ZIP file not found at: ${zipFilePath}`);
        console.warn(`[DatabaseStore] Also checked fallback path: ${cwdPath}`);
        console.warn(`[DatabaseStore] This might mean session wasn't compressed yet.`);
        return;
      }

      console.log(`[DatabaseStore] Found ZIP file, reading...`);
      // Read ZIP file as buffer
      const zipBuffer = this.fs.readFileSync(zipFilePath);
      
      await this.saveToDatabase(options.session, zipBuffer);
    } catch (error) {
      console.error(`[DatabaseStore] Error saving session:`, error);
      throw error;
    }
  }

  /**
   * Helper method to save ZIP buffer to database
   */
  private async saveToDatabase(sessionName: string, zipBuffer: Buffer): Promise<void> {
    // Convert to base64 string for storage
    const zipBase64 = zipBuffer.toString('base64');

    console.log(`[DatabaseStore] Saving to database (size: ${zipBuffer.length} bytes, base64: ${zipBase64.length} chars)`);

    // Save to database
    await prisma.whatsAppSession.upsert({
      where: { organizationId: this.organizationId },
      update: {
        sessionData: zipBase64,
        updatedAt: new Date(),
      },
      create: {
        id: sessionName,
        organizationId: this.organizationId,
        sessionData: zipBase64,
      },
    });

    console.log(`[DatabaseStore] ✅ Session saved to database for organization ${this.organizationId}`);
  }

  /**
   * Extract session ZIP archive from database to disk
   * 
   * RemoteAuth expects ZIP file at the specified path.
   * We read base64 string from database, convert to buffer, and write to disk.
   */
  async extract(options: { session: string; path: string }): Promise<void> {
    try {
      const session = await prisma.whatsAppSession.findUnique({
        where: { organizationId: this.organizationId },
        select: { sessionData: true },
      });

      if (!session?.sessionData) {
        throw new Error(`Session not found in database for organization ${this.organizationId}`);
      }

      // Convert base64 string to buffer
      const zipBuffer = Buffer.from(session.sessionData, 'base64');

      // Write ZIP file to disk at the specified path
      this.fs.writeFileSync(options.path, zipBuffer);

      console.log(`[DatabaseStore] Session extracted from database to ${options.path}`);
    } catch (error) {
      console.error(`[DatabaseStore] Error extracting session:`, error);
      throw error;
    }
  }
}

/**
 * Database-based authentication strategy
 * 
 * Extends RemoteAuth to use database storage instead of file system.
 * This ensures sessions persist across container restarts in production.
 */
export class DatabaseAuth extends RemoteAuth {
  constructor(organizationId: string, clientId: string, dataPath?: string) {
    const store = new DatabaseStore(organizationId, clientId, dataPath);
    
    super({
      store,
      clientId,
      dataPath, // Required for RemoteAuth to manage temporary files
      backupSyncIntervalMs: 3600000, // Sync every 1 hour (optimized: was 5 minutes)
      // Note: Additional forced sync happens on 'disconnected' event in WhatsAppClient
      // This periodic sync is a safety net in case of process crash
    });
  }
}

