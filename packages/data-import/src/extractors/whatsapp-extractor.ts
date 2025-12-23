/**
 * WhatsApp Data Extractor
 * 
 * Extracts data from WhatsApp Web using whatsapp-web.js
 */

import { Message as WhatsAppMessage, type Client } from 'whatsapp-web.js';
import { BaseExtractor } from './base-extractor';
import {
  createWhatsAppClient,
  extractPhoneFromWhatsAppId,
  normalizePhoneNumber,
  isIndividualChat,
} from '@soul-kg-crm/shared';
import type {
  ExtractedContact,
  ExtractedMessage,
} from '../types/import.types';

export interface WhatsAppExtractorOptions {
  organizationId: string;
  sessionPath?: string;
}

/**
 * WhatsApp extractor implementation
 * 
 * Extracts contacts and messages from WhatsApp Web
 */
export class WhatsAppExtractor extends BaseExtractor {
  private client: Client;
  private isReady: boolean = false;
  private readonly rateLimitDelay: number = 1000; // 1 second between requests to avoid blocking
  private lastRequestTime: number = 0;

  constructor(options: WhatsAppExtractorOptions) {
    super();

    // Initialize WhatsApp client with session management using shared utilities
    // Mode 'import' ensures different clientId and dataPath than integration
    // This prevents session conflicts between import and integration
    this.client = createWhatsAppClient(
      options.organizationId,
      'import',
      options.sessionPath
    );

    this.setupEventHandlers();
  }

  /**
   * Rate limiting helper to avoid WhatsApp blocking
   * Ensures minimum delay between requests
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Setup event handlers for WhatsApp client
   */
  private setupEventHandlers(): void {
    this.client.on('qr', () => {
      // QR code will be handled by getQRCode() method
      // Don't log here to avoid duplicate output
    });

    this.client.on('ready', () => {
      console.log('WhatsApp client is ready');
      this.isReady = true;
    });

    this.client.on('authenticated', () => {
      console.log('WhatsApp client authenticated');
    });

    this.client.on('auth_failure', (msg: string) => {
      console.error('WhatsApp authentication failure:', msg);
      this.isReady = false;
    });

    this.client.on('disconnected', (reason: string) => {
      console.log('WhatsApp client disconnected:', reason);
      this.isReady = false;
    });
  }

  /**
   * Initialize and connect to WhatsApp
   */
  async initialize(): Promise<void> {
    if (this.isReady) {
      return;
    }

    console.log('   Initializing WhatsApp client...');
    await this.client.initialize();
    console.log('   Client initialized, waiting for authentication...');
    
    // Wait for ready state
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WhatsApp client initialization timeout (120 seconds). If you need to scan QR code, use getQRCode() first.'));
      }, 120000); // 120 seconds timeout

      this.client.once('ready', () => {
        console.log('   ✅ WhatsApp client is ready!');
        clearTimeout(timeout);
        resolve();
      });

      this.client.once('authenticated', () => {
        console.log('   ✅ WhatsApp client authenticated');
      });

      this.client.once('auth_failure', (msg: string) => {
        clearTimeout(timeout);
        reject(new Error(`Authentication failed: ${msg}`));
      });

      // QR code handling is done in getQRCode() method
    });
  }

  /**
   * Get QR code for authentication
   */
  async getQRCode(): Promise<string | null> {
    return new Promise((resolve) => {
      this.client.once('qr', (qr: string) => {
        resolve(qr);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        resolve(null);
      }, 30000);
    });
  }

  /**
   * Extract contacts from WhatsApp
   * Uses proper API methods and rate limiting to avoid blocking
   * 
   * @param limit - Optional limit on number of contacts to extract (for testing)
   */
  async extractContacts(limit?: number): Promise<ExtractedContact[]> {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready. Call initialize() first.');
    }

    console.log('📋 Extracting contacts from WhatsApp...');
    await this.rateLimit();
    
    // Get all chats (individual chats only)
    const chats = await this.client.getChats();
    console.log(`   Found ${chats.length} total chats`);
    
    const contacts: ExtractedContact[] = [];
    const seenPhones = new Set<string>(); // Avoid duplicates
    let processedCount = 0;
    let skippedGroups = 0;

    // Process chats with rate limiting
    for (const chat of chats) {
      try {
        // Skip group chats (only process individual chats)
        if (chat.isGroup) {
          skippedGroups++;
          continue;
        }

        processedCount++;
        if (processedCount % 10 === 0) {
          console.log(`   Processing contact ${processedCount}...`);
        }
        
        await this.rateLimit();

        // Extract phone number from chat ID (format: 996XXXXXXXXX@c.us)
        const chatId = chat.id._serialized;
        
        // Skip if not individual chat (use shared utility)
        if (!isIndividualChat(chatId)) {
          continue;
        }

        // Use shared utility to extract and normalize phone number
        const phone = extractPhoneFromWhatsAppId(chatId);
        
        // Extract digits for validation
        const phoneDigits = phone.replace(/\D/g, '');

        // Skip system contacts (WhatsApp, Status, etc.) with invalid phone numbers
        if (phone === '+0' || phoneDigits === '0' || phone.length < 8) {
          console.log(`   ⏭️  Skipping system contact: ${chat.name || phone}`);
          continue;
        }

        // Skip if we've already seen this phone number
        if (seenPhones.has(phone)) {
          continue;
        }
        seenPhones.add(phone);

        // Get contact name from chat (most reliable method)
        // chat.name is available for PrivateChat and contains the contact name
        let name = chat.name || phone;
        let avatar: string | undefined;

        // Try to get contact details using proper API
        try {
          await this.rateLimit();
          
          // Use getContactById with chat ID (more reliable than chat.getContact())
          // Extract digits from WhatsApp ID (remove @c.us suffix)
          const contactId = chatId.replace(/@c\.us$/, '');
          const contact = await this.client.getContactById(contactId).catch(() => null);
          
          if (contact) {
            // Prefer pushname (display name) over name (saved name)
            name = contact.pushname || contact.name || chat.name || phone;
            
            // Get profile picture with rate limiting
            await this.rateLimit();
            avatar = await contact.getProfilePicUrl().catch(() => undefined);
          }
        } catch (error) {
          // If contact retrieval fails, use chat name as fallback
          // This is acceptable - chat.name is usually available
          name = chat.name || phone;
        }

        contacts.push({
          phone,
          name,
          avatar,
        });

        // Stop if limit reached
        if (limit && contacts.length >= limit) {
          console.log(`   ⚏ Reached limit of ${limit} contacts`);
          break;
        }
      } catch (error) {
        console.error(`   ⚠️  Error extracting contact for chat ${chat.id._serialized}:`, error);
        // Continue with next chat - don't fail entire import
      }
    }

    console.log(`✅ Extracted ${contacts.length} contacts (skipped ${skippedGroups} group chats)`);
    return contacts;
  }

  /**
   * Extract messages for a specific contact
   * Uses proper API methods and rate limiting to avoid blocking
   * 
   * @param contactId - Can be phone number (format: +996XXXXXXXXX) or WhatsApp chat ID
   */
  async extractMessages(contactId: string): Promise<ExtractedMessage[]> {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready. Call initialize() first.');
    }

    try {
      await this.rateLimit();

      // Try to get chat by ID first (if it's a WhatsApp chat ID)
      let chat;
      try {
        chat = await this.client.getChatById(contactId);
      } catch {
        // If not found by ID, try to find by phone number
        await this.rateLimit();
        const chats = await this.client.getChats();
        // Normalize phone number using shared utility
        const normalizedPhone = normalizePhoneNumber(contactId);

        // Find chat by phone number (using chat ID matching - most reliable)
        for (const c of chats) {
          if (c.isGroup) continue;
          
          // Extract phone from chat ID directly using shared utility
          const chatId = c.id._serialized;
          
          // Skip if not individual chat
          if (!isIndividualChat(chatId)) {
            continue;
          }
          
          try {
            // Use shared utility to extract and normalize phone number
            const chatPhone = extractPhoneFromWhatsAppId(chatId);
            
            // Match by normalized phone
            if (chatPhone === normalizedPhone) {
              chat = c;
              break;
            }
          } catch {
            // Skip invalid chat IDs
            continue;
          }
        }

        if (!chat) {
          throw new Error(`Chat not found for contact: ${contactId}`);
        }
      }

      // Fetch messages with rate limiting
      await this.rateLimit();
      const messages = await chat.fetchMessages({ limit: 1000 });

      return messages.map((msg: WhatsAppMessage) => ({
        id: msg.id._serialized,
        content: msg.body,
        timestamp: new Date(msg.timestamp * 1000),
        fromMe: msg.fromMe,
        type: this.getMessageType(msg),
        mediaUrl: msg.hasMedia ? msg.id._serialized : undefined,
      }));
    } catch (error) {
      console.error(`Error extracting messages for contact ${contactId}:`, error);
      throw error;
    }
  }

  /**
   * Extract media for a message
   * Uses rate limiting to avoid blocking
   */
  async extractMedia(messageId: string): Promise<Buffer | null> {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready. Call initialize() first.');
    }

    try {
      await this.rateLimit();
      const message = await this.client.getMessageById(messageId);
      if (!message || !message.hasMedia) {
        return null;
      }

      await this.rateLimit();
      const media = await message.downloadMedia();
      if (!media) {
        return null;
      }

      // Convert base64 to buffer
      return Buffer.from(media.data, 'base64');
    } catch (error) {
      console.error(`Error extracting media for message ${messageId}:`, error);
      return null;
    }
  }

  // normalizePhoneNumber method removed - now using shared utility from @soul-kg-crm/shared/utils/phone

  /**
   * Determine message type
   */
  private getMessageType(msg: WhatsAppMessage): 'text' | 'image' | 'video' | 'audio' | 'document' {
    if (msg.hasMedia) {
      const mediaType = msg.type;
      switch (mediaType) {
        case 'image':
          return 'image';
        case 'video':
          return 'video';
        case 'audio':
        case 'ptt': // Voice message
          return 'audio';
        case 'document':
          return 'document';
        default:
          return 'text';
      }
    }
    return 'text';
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    await this.client.destroy();
    this.isReady = false;
  }
}

