/**
 * WhatsApp Web Integration Module
 * 
 * Provides long-running WhatsApp Web integration for real-time messaging
 * Uses whatsapp-web.js for client connection and BullMQ for message queuing
 */

// Client and Session Management
export { WhatsAppClient } from './client/whatsapp-client';
export { WhatsAppSessionManager } from './client/session-manager';

// Message Queue
export { WhatsAppMessageQueue } from './queue/message-queue';
export { WhatsAppIncomingQueue } from './queue/incoming-queue';

// Message Handler
export { WhatsAppMessageHandler } from './handlers/message-handler';

// Agent API
export { sendMessageForAgent, sendBulkMessagesForAgent } from './api/agent-api';
export type { BulkSendResult } from './api/agent-api';

// Types
export type * from './types/whatsapp.types';

