/**
 * Message Parser
 * 
 * Parses extracted messages into structured format for import
 */

import type { ExtractedMessage, ParsedMessage } from '../types/import.types';
import { MessageDirection, MessageSender } from '@soul-kg-crm/database';
import { detectLanguage } from './language-detector';

/**
 * Parse extracted messages into import format
 */
export function parseMessages(messages: ExtractedMessage[]): ParsedMessage[] {
  return messages.map((msg) => ({
    content: msg.content,
    timestamp: msg.timestamp,
    direction: msg.fromMe ? MessageDirection.OUTGOING : MessageDirection.INCOMING,
    sender: msg.fromMe ? MessageSender.HUMAN : MessageSender.CLIENT, // For import, assume human if fromMe
    language: detectLanguage(msg.content),
    whatsappMessageId: msg.id,
  }));
}

