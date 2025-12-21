/**
 * Base interface for data extractors
 * 
 * This allows extension to other sources (Telegram, CSV, Email, etc.)
 */

import type {
  DataExtractor,
  ExtractedContact,
  ExtractedMessage,
} from '../types/import.types';

/**
 * Abstract base class for data extractors
 * 
 * Implementations:
 * - WhatsAppExtractor (MVP)
 * - TelegramExtractor (post-MVP)
 * - CSVExtractor (post-MVP)
 * - EmailExtractor (post-MVP)
 */
export abstract class BaseExtractor implements DataExtractor {
  /**
   * Extract all contacts/chats
   */
  abstract extractContacts(): Promise<ExtractedContact[]>;

  /**
   * Extract messages for a specific contact
   */
  abstract extractMessages(contactId: string): Promise<ExtractedMessage[]>;

  /**
   * Extract media for a message (optional)
   */
  async extractMedia?(_messageId: string): Promise<Buffer | null> {
    return null;
  }
}

