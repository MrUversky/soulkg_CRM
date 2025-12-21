# Data Import Module

Module for importing existing data from WhatsApp into the CRM system.

## Overview

This module extracts data from WhatsApp Web, parses it, validates it, and imports it into the database. It's designed to be extensible to support other data sources in the future (Telegram, CSV, Email, etc.).

## Architecture

```
WhatsApp Web → Extractor → Parser → Validator → Importer → Database
```

### Components

- **Extractors**: Extract data from sources (WhatsApp, Telegram, CSV, etc.)
- **Parsers**: Parse and structure extracted data (language detection, status detection)
- **Validators**: Validate data before import (phone format, duplicates)
- **Importers**: Import validated data into database (clients, conversations, messages)

## Usage

### Basic Import (Heuristic Status Detection)

```typescript
import { DataImportService } from '@soul-kg-crm/data-import';

// Create service
const importService = new DataImportService(organizationId);

// Initialize WhatsApp connection
await importService.initialize();

// Get QR code for authentication
const qrCode = await importService.getQRCode();
// Display QR code to user for scanning

// Start import with heuristic status detection
const result = await importService.startImport({
  organizationId,
  importContacts: true,
  importMessages: true,
  detectStatus: true,
  useLLMStatusDetection: false, // Use heuristic detection
  skipDuplicates: true,
  dryRun: false,
});

// Check result
console.log(`Imported ${result.successfulImports} clients`);
console.log(`Skipped ${result.skippedDuplicates} duplicates`);
console.log(`Failed ${result.failedImports} imports`);
```

### LLM-based Status Detection

```typescript
import { DataImportService } from '@soul-kg-crm/data-import';

// Create service with LLM status detection
const importService = new DataImportService(
  organizationId,
  undefined, // importId (optional)
  {
    useLLMStatusDetection: true,
    openRouterApiKey: process.env.OPENROUTER_API_KEY!,
  }
);

// Initialize WhatsApp connection
await importService.initialize();

// Start import with LLM status detection
const result = await importService.startImport({
  organizationId,
  importContacts: true,
  importMessages: true,
  detectStatus: true,
  useLLMStatusDetection: true, // Use LLM-based detection
  skipDuplicates: true,
  dryRun: false,
});
```

**Note**: LLM status detection requires:
- OpenRouter API key in environment variable
- STATUS_DETECTION agent configuration in database (created via seed)
- Prompts loaded from database for the organization

// Disconnect
await importService.disconnect();
```

## Extending to Other Sources

To add support for other data sources (e.g., Telegram, CSV), implement the `DataExtractor` interface:

```typescript
import { BaseExtractor } from '@soul-kg-crm/data-import';

class TelegramExtractor extends BaseExtractor {
  async extractContacts(): Promise<ExtractedContact[]> {
    // Implementation
  }

  async extractMessages(contactId: string): Promise<ExtractedMessage[]> {
    // Implementation
  }
}
```

## Status Detection

The module supports two methods for detecting client status:

### 1. Heuristic Detection (Default)

Fast, rule-based detection using keyword matching:

- **NEW_LEAD**: Recent first message (< 7 days), no qualification signs
- **QUALIFIED**: Questions about dates, budget, number of people
- **PROPOSAL_SENT**: Tour mentioned, information sent
- **SOLD**: Payment, booking, confirmation keywords
- **SERVICE**: During or after tour keywords
- **CLOSED**: No activity > 30 days or explicit refusal

### 2. LLM-based Detection (Optional)

More accurate detection using AI (OpenRouter GPT-4o-mini):

- Analyzes full conversation context
- Understands intent and context better than keywords
- Supports multiple languages
- Falls back to heuristic if LLM fails
- Requires OpenRouter API key and database configuration

To use LLM detection:
1. Set `useLLMStatusDetection: true` in import options
2. Provide `openRouterApiKey` in service constructor
3. Ensure STATUS_DETECTION agent configuration exists in database (run seed)

## Language Detection

Supports detection of:
- English (en)
- Russian (ru)
- Arabic (ar)
- French (fr)
- German (de)
- Spanish (es)
- Polish (pl)

## Validation

- Phone number format validation (+996XXXXXXXXX)
- Duplicate detection (by phone number)
- Name conflict detection
- Date validation

## Performance

- Processes chats in batches
- Imports messages in batches of 100
- Skips duplicates if configured
- Handles errors gracefully

## Future Enhancements

- ML-based language detection
- ML-based status detection
- Automatic error correction
- Incremental import (only new messages)
- Support for other sources (Telegram, CSV, Email)

