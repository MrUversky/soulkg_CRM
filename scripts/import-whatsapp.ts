#!/usr/bin/env tsx
/**
 * CLI Script for importing WhatsApp data
 * 
 * Usage:
 *   tsx scripts/import-whatsapp.ts --organization-id <uuid> [options]
 * 
 * Options:
 *   --organization-id <uuid>  Organization ID (required)
 *   --dry-run                 Test run without saving to database
 *   --limit <number>          Limit number of chats to import (for testing)
 *   --use-llm                 Use LLM for status detection
 *   --openrouter-key <key>    OpenRouter API key (required if --use-llm)
 *   --skip-duplicates         Skip duplicate clients (default: true)
 */

import { config } from 'dotenv';
// @ts-ignore - qrcode-terminal doesn't have types
import qrcode from 'qrcode-terminal';
import { DataImportService } from '../packages/data-import/src/services/data-import-service';
import type { ImportOptions } from '../packages/data-import/src/types/import.types';

// Load environment variables from .env file
config();

// Simple argument parser (no external dependencies)
function parseArgs(): {
  organizationId?: string;
  dryRun: boolean;
  limit?: number;
  useLLM: boolean;
  openRouterKey?: string;
  skipDuplicates: boolean;
} {
  const args = process.argv.slice(2);
  const result: ReturnType<typeof parseArgs> = {
    dryRun: false,
    useLLM: false,
    skipDuplicates: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--organization-id':
        if (nextArg && !nextArg.startsWith('--')) {
          result.organizationId = nextArg;
          i++;
        }
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
      case '--limit':
        if (nextArg && !nextArg.startsWith('--')) {
          result.limit = parseInt(nextArg, 10);
          i++;
        }
        break;
      case '--use-llm':
        result.useLLM = true;
        break;
      case '--openrouter-key':
        if (nextArg && !nextArg.startsWith('--')) {
          result.openRouterKey = nextArg;
          i++;
        }
        break;
      case '--skip-duplicates':
        result.skipDuplicates = true;
        break;
      case '--no-skip-duplicates':
        result.skipDuplicates = false;
        break;
      case '--help':
      case '-h':
        console.log(`
WhatsApp Data Import CLI

Usage:
  tsx scripts/import-whatsapp.ts --organization-id <uuid> [options]

Required:
  --organization-id <uuid>  Organization ID

Options:
  --dry-run                 Test run without saving to database
  --limit <number>          Limit number of chats to import (for testing)
  --use-llm                 Use LLM for status detection
  --openrouter-key <key>    OpenRouter API key (or use OPENROUTER_API_KEY env var)
  --skip-duplicates         Skip duplicate clients (default: true)
  --no-skip-duplicates      Don't skip duplicates
  --help, -h                Show this help message

Examples:
  # Test import with 5 chats
  tsx scripts/import-whatsapp.ts --organization-id <uuid> --limit 5 --dry-run

  # Full import with LLM status detection
  tsx scripts/import-whatsapp.ts --organization-id <uuid> --use-llm --openrouter-key <key>
        `);
        process.exit(0);
    }
  }

  return result;
}

/**
 * Display QR code in terminal
 */
function displayQRCode(qrCode: string): void {
  // Add extra spacing at the top
  console.log('\n\n\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📱 SCAN THIS QR CODE WITH WHATSAPP');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('💡 Tip: Open WhatsApp on your phone → Settings → Linked Devices → Link a Device');
  console.log('');
  console.log('───────────────────────────────────────────────────────────────');
  console.log('');
  console.log(''); // Extra spacing before QR code
  
  // Generate QR code with small size for better visibility
  qrcode.generate(qrCode, { small: true });
  
  console.log(''); // Extra spacing after QR code
  console.log('');
  console.log('───────────────────────────────────────────────────────────────');
  console.log('');
  console.log('⏳ Waiting for authentication...');
  console.log('   (Please scan the QR code above with your WhatsApp)');
  console.log('');
  console.log(''); // Extra spacing at the bottom
  console.log('');
}

/**
 * Format progress bar
 */
function formatProgress(current: number, total: number): string {
  const percentage = Math.round((current / total) * 100);
  const barLength = 30;
  const filled = Math.round((current / total) * barLength);
  const empty = barLength - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}% (${current}/${total})`;
}

/**
 * Main import function
 */
async function main() {
  const args = parseArgs();

  // Validate required arguments
  if (!args.organizationId) {
    console.error('❌ Error: --organization-id is required');
    console.error('Run with --help for usage information');
    process.exit(1);
  }

  // Get OpenRouter key from args or environment
  const openRouterKey = args.openRouterKey || process.env.OPENROUTER_API_KEY;
  
  if (args.useLLM && !openRouterKey) {
    console.error('❌ Error: OpenRouter API key is required when using --use-llm');
    console.error('   Provide it via --openrouter-key or OPENROUTER_API_KEY environment variable');
    process.exit(1);
  }

  console.log('🚀 Starting WhatsApp data import...\n');
  console.log('Configuration:');
  console.log(`  Organization ID: ${args.organizationId}`);
  console.log(`  Dry run: ${args.dryRun ? 'Yes' : 'No'}`);
  console.log(`  Limit: ${args.limit ? `${args.limit} chats` : 'All chats'}`);
  console.log(`  Status detection: ${args.useLLM ? 'LLM' : 'Heuristic'}`);
  if (args.useLLM) {
    const keySource = args.openRouterKey ? 'command line' : 'environment variable';
    console.log(`  OpenRouter key: ${keySource} (${openRouterKey ? 'provided' : 'missing'})`);
  }
  console.log(`  Skip duplicates: ${args.skipDuplicates ? 'Yes' : 'No'}`);
  console.log('');

  try {
    // Create import service
    const importService = new DataImportService(
      args.organizationId,
      undefined,
      args.useLLM && openRouterKey
        ? {
            useLLMStatusDetection: true,
            openRouterApiKey: openRouterKey,
          }
        : undefined
    );

    // Initialize WhatsApp connection
    console.log('📡 Initializing WhatsApp connection...\n');
    
    // Start getting QR code BEFORE initialization (so we can catch the 'qr' event)
    let qrCodeShown = false;
    const qrCodePromise = importService.getQRCode().then((qr) => {
      if (qr) {
        qrCodeShown = true;
        displayQRCode(qr);
        console.log('\n⏳ Waiting for you to scan the QR code...');
        console.log('   (This may take up to 60 seconds)\n');
      }
      return qr;
    });

    // Start initialization in parallel (this will trigger QR code generation if needed)
    const initPromise = importService.initialize()
      .then(() => {
        if (qrCodeShown) {
          console.log('✅ WhatsApp authenticated!\n');
        } else {
          console.log('✅ Already authenticated or session restored\n');
        }
      })
      .catch((error) => {
        // If timeout and QR was shown, user might still be scanning
        if (error.message.includes('timeout') && qrCodeShown) {
          console.log('\n⏳ Still waiting for QR code scan...');
          console.log('   Please scan the QR code above with your WhatsApp\n');
          // Wait a bit more and try again
          return new Promise<void>((resolve, reject) => {
            setTimeout(async () => {
              try {
                await importService.initialize();
                console.log('✅ WhatsApp authenticated!\n');
                resolve();
              } catch (err: any) {
                console.error('❌ Authentication failed:', err.message);
                reject(err);
              }
            }, 30000); // Wait 30 more seconds
          });
        }
        throw error;
      });

    // Wait for QR code to be shown (if needed) - don't block on this
    qrCodePromise.catch(() => {
      // Ignore errors, QR might not be needed if already authenticated
    });

    // Now wait for initialization to complete
    await initPromise;

    // Prepare import options
    const importOptions: ImportOptions = {
      organizationId: args.organizationId,
      importContacts: true,
      importMessages: true,
      detectStatus: true,
      useLLMStatusDetection: args.useLLM,
      skipDuplicates: args.skipDuplicates,
      dryRun: args.dryRun,
      limit: args.limit, // Limit number of contacts for testing
    };

    // Log limit if specified
    if (args.limit) {
      console.log(`⚠️  Limiting import to ${args.limit} chats (for testing)\n`);
    }

    // Start import
    console.log('📥 Starting data import...\n');

    const result = await importService.startImport(importOptions);

    // Show progress during import (simplified)
    if (result.totalChats > 0) {
      console.log(`\n📊 Progress: ${formatProgress(result.processedChats, result.totalChats)}`);
    }

    // Display results
    console.log('\n✅ Import completed!\n');
    console.log('Results:');
    console.log(`  Total chats: ${result.totalChats}`);
    console.log(`  Processed: ${result.processedChats}`);
    console.log(`  Successful: ${result.successfulImports}`);
    console.log(`  Failed: ${result.failedImports}`);
    console.log(`  Skipped (duplicates): ${result.skippedDuplicates}`);

    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.chat}: ${error.error}`);
      });
    }

    // Disconnect
    await importService.disconnect();
    console.log('\n👋 Disconnected from WhatsApp');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

