/**
 * Data Import Module
 * 
 * Module for importing data from various sources (WhatsApp, Telegram, CSV, etc.)
 * into the CRM system.
 */

export * from './extractors';
export * from './parsers';
export * from './validators';
export * from './importers';
export * from './types/import.types';
// Explicit export to ensure TypeScript generates proper .d.ts
export { DataImportService } from './services/data-import-service';
export type {
  ImportOptions,
  ImportResult,
  ParsedClientData,
  ExtractedMessage,
  ExtractedContact,
} from './types/import.types';

