/**
 * Conversation Importer
 * 
 * Imports conversations into the database
 */

import { prisma } from '@soul-kg-crm/database';
import { CommunicationChannel, ConversationStatus, ConversationManager } from '@soul-kg-crm/database';

export interface ImportConversationResult {
  conversationId: string;
  created: boolean;
}

/**
 * Import or get existing conversation
 */
export async function importConversation(
  organizationId: string,
  clientId: string,
  channel: CommunicationChannel = CommunicationChannel.WHATSAPP
): Promise<ImportConversationResult> {
  // Check if conversation already exists
  const existing = await prisma.conversation.findFirst({
    where: {
      organizationId,
      clientId,
      channel,
      status: ConversationStatus.ACTIVE,
    },
  });

  if (existing) {
    return {
      conversationId: existing.id,
      created: false,
    };
  }

  // Create new conversation
  const created = await prisma.conversation.create({
    data: {
      organizationId,
      clientId,
      channel,
      status: ConversationStatus.ACTIVE,
      managedBy: ConversationManager.AI, // Default to AI, can be changed later
    },
  });

  return {
    conversationId: created.id,
    created: true,
  };
}

