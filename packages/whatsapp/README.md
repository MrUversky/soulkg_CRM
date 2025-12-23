# WhatsApp Web Integration Module

Long-running WhatsApp Web integration for real-time messaging in Soul KG CRM.

## Overview

This module provides:
- **Long-running WhatsApp Client**: Persistent connection to WhatsApp Web
- **Session Management**: Multiple sessions (one per organization)
- **Message Queue**: BullMQ-based queue for reliable message sending with rate limiting
- **Incoming Message Processing**: Queue-based processing of incoming messages with API rate limiting
- **Message Handler**: Integration with data-import parsers for message processing

## Architecture

```
WhatsApp Web Client (whatsapp-web.js)
    ↓
Session Manager (manages multiple sessions)
    ↓
Incoming Queue (processes incoming messages)
    ↓
Message Handler (parsing, validation)
    ↓
Send Queue (sends outgoing messages)
```

## Key Features

- **Rate Limiting**: Configurable rate limits per organization (default: 10 messages/min)
- **Session Isolation**: Different sessions for import vs integration
- **Automatic Reconnection**: Exponential backoff on disconnection
- **Natural Behavior**: Random delays to mimic human behavior
- **API Rate Limiting**: Separate rate limiter for additional API requests (getContactById, etc.)

## Usage

```typescript
import { WhatsAppSessionManager, WhatsAppMessageQueue } from '@soul-kg-crm/whatsapp';

// Initialize session manager
const sessionManager = new WhatsAppSessionManager();

// Connect organization
await sessionManager.getOrCreateClient('org-123');

// Send message
const messageQueue = new WhatsAppMessageQueue();
await messageQueue.addSendMessageJob({
  organizationId: 'org-123',
  to: '+996555123456',
  content: 'Hello!',
  conversationId: 'conv-456',
});
```

## Dependencies

- `whatsapp-web.js`: WhatsApp Web client
- `bullmq`: Message queue
- `ioredis`: Redis client for BullMQ
- `@soul-kg-crm/data-import`: Parsers and importers
- `@soul-kg-crm/shared`: Shared utilities
- `@soul-kg-crm/database`: Database access

## Configuration

Settings are stored in `Organization.settings.whatsapp`:
- Rate limiting (messages per minute/hour/day, concurrency)
- Safety settings (mass sending, confirmation requirements)

