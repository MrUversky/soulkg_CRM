/**
 * WhatsApp integration types
 */

import type { Message } from 'whatsapp-web.js';

/**
 * WhatsApp client events
 */
export interface WhatsAppClientEvents {
  qr: (qr: string) => void;
  ready: () => void;
  authenticated: () => void;
  auth_failure: (msg: string) => void;
  disconnected: (reason: string) => void;
  message: (message: WhatsAppMessageData) => void;
  message_ack: (msg: Message, ack: any) => void;
  max_reconnect_reached: () => void;
}

/**
 * Normalized WhatsApp message data
 */
export interface WhatsAppMessageData {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  hasMedia: boolean;
  type: string;
}

/**
 * WhatsApp connection status
 */
export type WhatsAppConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

