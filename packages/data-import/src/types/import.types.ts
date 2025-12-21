/**
 * Types for data import module
 */

import { ClientStatus } from '@soul-kg-crm/database';

/**
 * Extracted contact information from WhatsApp
 */
export interface ExtractedContact {
  phone: string;
  name?: string;
  avatar?: string;
}

/**
 * Extracted message from WhatsApp
 */
export interface ExtractedMessage {
  id: string;
  content: string;
  timestamp: Date;
  fromMe: boolean;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
}

/**
 * Extracted chat data from WhatsApp
 */
export interface ExtractedChat {
  contact: ExtractedContact;
  messages: ExtractedMessage[];
  firstMessageDate: Date;
  lastMessageDate: Date;
}

/**
 * Parsed client data ready for import
 */
export interface ParsedClientData {
  phone: string;
  name?: string;
  email?: string;
  preferredLanguage?: string;
  detectedStatus: ClientStatus;
  messages: ParsedMessage[];
  firstMessageDate: Date;
  lastMessageDate: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Parsed message ready for import
 */
export interface ParsedMessage {
  content: string;
  timestamp: Date;
  direction: 'INCOMING' | 'OUTGOING';
  sender: 'CLIENT' | 'AI' | 'HUMAN';
  language?: string;
  whatsappMessageId?: string;
}

/**
 * Import options
 */
export interface ImportOptions {
  organizationId?: string; // Optional, can be passed to constructor
  importContacts?: boolean;
  importMessages?: boolean;
  detectStatus?: boolean;
  useLLMStatusDetection?: boolean; // Use LLM-based status detection instead of heuristic
  skipDuplicates?: boolean;
  dryRun?: boolean;
  limit?: number; // Limit number of contacts to import (for testing)
}

/**
 * Import result
 */
export interface ImportResult {
  importId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED';
  totalChats: number;
  processedChats: number;
  successfulImports: number;
  failedImports: number;
  skippedDuplicates: number;
  errors: ImportError[];
}

/**
 * Import error
 */
export interface ImportError {
  chat: string;
  error: string;
}

/**
 * Base interface for data extractors
 * Allows extension to other sources (Telegram, CSV, etc.)
 */
export interface DataExtractor {
  /**
   * Extract all contacts/chats
   */
  extractContacts(): Promise<ExtractedContact[]>;

  /**
   * Extract messages for a specific contact
   */
  extractMessages(contactId: string): Promise<ExtractedMessage[]>;

  /**
   * Extract media for a message (optional)
   */
  extractMedia?(messageId: string): Promise<Buffer | null>;
}

