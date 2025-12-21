/**
 * Message Importer
 * 
 * Imports messages into the database in batches
 */

import { prisma, MessageStatus } from '@soul-kg-crm/database';
import type { ParsedMessage } from '../types/import.types';

const BATCH_SIZE = 100; // Import messages in batches of 100

/**
 * Import messages in batches
 */
export async function importMessages(
  organizationId: string,
  conversationId: string,
  messages: ParsedMessage[]
): Promise<number> {
  if (messages.length === 0) {
    return 0;
  }

  let importedCount = 0;

  // Process in batches
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);

    // Use createMany for better performance
    await prisma.message.createMany({
      data: batch.map((msg) => ({
        conversationId,
        organizationId,
        direction: msg.direction,
        sender: msg.sender,
        senderId: null, // For imported messages, senderId is null
        content: msg.content,
        language: msg.language,
        translatedContent: null,
        whatsappMessageId: msg.whatsappMessageId,
        status: MessageStatus.SENT,
        error: null,
        createdAt: msg.timestamp,
      })),
      skipDuplicates: true, // Skip if whatsappMessageId already exists
    });

    importedCount += batch.length;
  }

  // Update conversation lastMessageAt
  if (messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: lastMessage.timestamp },
    });
  }

  return importedCount;
}

