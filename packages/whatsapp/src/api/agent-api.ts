/**
 * Public API for AI Agents
 * 
 * Provides functions for agents to send messages through WhatsApp
 * This is a placeholder - will be implemented in Этап 3.3
 */

export interface BulkSendResult {
  success: number;
  failed: number;
  errors: Array<{ to: string; error: string }>;
}

export async function sendMessageForAgent(
  _organizationId: string,
  _to: string,
  _content: string,
  _conversationId: string,
  _agentType: string
): Promise<void> {
  // Placeholder - will be implemented in Этап 3.3
  throw new Error('Not implemented yet');
}

export async function sendBulkMessagesForAgent(
  _organizationId: string,
  _messages: Array<{ to: string; content: string; conversationId?: string }>,
  _agentType: string
): Promise<BulkSendResult> {
  // Placeholder - will be implemented in Этап 3.3
  throw new Error('Not implemented yet');
}

