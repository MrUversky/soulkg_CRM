#!/usr/bin/env tsx
/**
 * Script to reclassify existing clients with improved LLM status detection
 * 
 * Usage:
 *   tsx scripts/reclassify-clients.ts --organization-id <uuid> [options]
 * 
 * Options:
 *   --organization-id <uuid>  Organization ID (required)
 *   --use-llm                 Use LLM for status detection (default: true)
 *   --limit <number>          Limit number of clients to reclassify (for testing)
 *   --dry-run                 Test run without updating database
 */

import { config } from 'dotenv';
import { prisma, ClientStatus } from '../packages/database/src/index';
import { OpenRouterProvider } from '../packages/agents/src/providers/openrouter-provider';
import { PromptLoader } from '../packages/agents/src/prompt-manager/prompt-loader';
import { LLMStatusDetector } from '../packages/agents/src/detectors/status-detector';
import { StatusDetectionStrategy } from '../packages/agents/src/detectors/strategy';
import { detectPrimaryLanguage } from '../packages/data-import/src/parsers/language-detector';

// Load environment variables
config();

interface ReclassifyOptions {
  organizationId: string;
  useLLM: boolean;
  limit?: number;
  dryRun: boolean;
}

function parseArgs(): ReclassifyOptions {
  const args = process.argv.slice(2);
  const result: Partial<ReclassifyOptions> = {
    useLLM: true,
    dryRun: false,
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
      case '--use-llm':
        result.useLLM = true;
        break;
      case '--no-llm':
        result.useLLM = false;
        break;
      case '--limit':
        if (nextArg && !nextArg.startsWith('--')) {
          result.limit = parseInt(nextArg, 10);
          i++;
        }
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Reclassify Clients Script

Usage:
  tsx scripts/reclassify-clients.ts --organization-id <uuid> [options]

Required:
  --organization-id <uuid>  Organization ID

Options:
  --use-llm                 Use LLM for status detection (default: true)
  --no-llm                  Use heuristic instead of LLM
  --limit <number>          Limit number of clients to reclassify
  --dry-run                 Test run without updating database
  --help, -h                Show this help message

Examples:
  # Reclassify all clients with LLM
  tsx scripts/reclassify-clients.ts --organization-id <uuid> --use-llm

  # Test with 5 clients
  tsx scripts/reclassify-clients.ts --organization-id <uuid> --limit 5 --dry-run
        `);
        process.exit(0);
    }
  }

  if (!result.organizationId) {
    throw new Error('--organization-id is required');
  }

  return result as ReclassifyOptions;
}

async function main() {
  const options = parseArgs();

  console.log('🔄 Starting client reclassification...\n');
  console.log('Configuration:');
  console.log(`  Organization ID: ${options.organizationId}`);
  console.log(`  Method: ${options.useLLM ? 'LLM' : 'Heuristic'}`);
  console.log(`  Limit: ${options.limit ? `${options.limit} clients` : 'All clients'}`);
  console.log(`  Dry run: ${options.dryRun ? 'Yes (no database updates)' : 'No (will update database)'}`);
  console.log('');

  // Initialize LLM if needed
  let statusDetectionStrategy: StatusDetectionStrategy | undefined;
  
  if (options.useLLM) {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      console.error('❌ Error: OPENROUTER_API_KEY environment variable is required when using --use-llm');
      process.exit(1);
    }

    try {
      console.log('🤖 Initializing LLM status detection...');
      const llmProvider = new OpenRouterProvider({
        apiKey: openRouterKey,
        defaultModel: 'openai/gpt-4o-mini',
      });
      const promptLoader = new PromptLoader(prisma);
      const llmDetector = new LLMStatusDetector(llmProvider, promptLoader);
      statusDetectionStrategy = new StatusDetectionStrategy({
        llmDetector,
        useLLMByDefault: true,
        fallbackToHeuristic: true,
      });
      console.log('✅ LLM initialized\n');
    } catch (error) {
      console.error('❌ Failed to initialize LLM:', error);
      process.exit(1);
    }
  }

  // Get all clients for the organization
  const clients = await prisma.client.findMany({
    where: { organizationId: options.organizationId },
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
    take: options.limit,
  });

  console.log(`📊 Found ${clients.length} clients to reclassify\n`);
  console.log('═'.repeat(80));

  const results = {
    total: clients.length,
    processed: 0,
    updated: 0,
    unchanged: 0,
    errors: 0,
    changes: [] as Array<{
      phone: string;
      oldStatus: ClientStatus;
      newStatus: ClientStatus;
      reasoning?: string;
    }>,
  };

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    const conversation = client.conversations[0];
    
    if (!conversation || conversation.messages.length === 0) {
      console.log(`\n[${i + 1}/${clients.length}] ⏭️  ${client.phone}: No messages, skipping`);
      results.processed++;
      continue;
    }

    const messages = conversation.messages;
    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    const firstMessageDate = firstMessage.createdAt;
    const lastMessageDate = lastMessage.createdAt;

    // Convert messages to ExtractedMessage format
    const extractedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      timestamp: msg.createdAt,
      fromMe: msg.direction === 'OUTGOING',
      type: 'text' as const,
    }));


    const clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.phone;
    console.log(`\n[${i + 1}/${clients.length}] 🔍 ${client.phone} (${clientName})`);
    console.log(`   Current status: ${client.status}`);
    console.log(`   Messages: ${messages.length}`);
    console.log(`   Last message: ${lastMessageDate.toLocaleDateString()}`);

    // Detect language from extracted messages
    const primaryLanguage = detectPrimaryLanguage(extractedMessages);
    console.log(`   Language: ${primaryLanguage || 'unknown'}`);

    try {
      let newStatus: ClientStatus;
      let reasoning: string | undefined;

      if (options.useLLM && statusDetectionStrategy) {
        const statusResult = await statusDetectionStrategy.detectStatus({
          organizationId: options.organizationId,
          messages: extractedMessages,
          firstMessageDate,
          lastMessageDate,
          language: primaryLanguage,
          useLLM: true,
          fallbackToHeuristic: true,
        });
        newStatus = statusResult.status;
        reasoning = statusResult.reasoning;
      } else {
        // Use heuristic (from strategy)
        const statusResult = await statusDetectionStrategy?.detectStatus({
          organizationId: options.organizationId,
          messages: extractedMessages,
          firstMessageDate,
          lastMessageDate,
          language: primaryLanguage,
          useLLM: false,
        }) || {
          status: client.status, // Fallback to current status
          confidence: 0.5,
          reasoning: 'Heuristic not available',
        };
        newStatus = statusResult.status;
        reasoning = statusResult.reasoning;
      }

      console.log(`   New status: ${newStatus}`);
      if (reasoning) {
        console.log(`   Reasoning: ${reasoning.substring(0, 100)}${reasoning.length > 100 ? '...' : ''}`);
      }

      if (newStatus !== client.status) {
        console.log(`   ✅ Status changed: ${client.status} → ${newStatus}`);
        
        if (!options.dryRun) {
          // Update client status
          await prisma.client.update({
            where: { id: client.id },
            data: { status: newStatus },
          });

          // Create status history entry
          await prisma.clientStatusHistory.create({
            data: {
              organizationId: client.organizationId,
              clientId: client.id,
              oldStatus: client.status,
              newStatus,
              changedBy: 'AI',
              reason: `Reclassified: ${reasoning || 'Status detection update'}`,
            },
          });
        }

        results.updated++;
        results.changes.push({
          phone: client.phone,
          oldStatus: client.status,
          newStatus,
          reasoning,
        });
      } else {
        console.log(`   ➡️  Status unchanged`);
        results.unchanged++;
      }

      results.processed++;
    } catch (error) {
      console.error(`   ❌ Error:`, error);
      results.errors++;
      results.processed++;
    }

    // Small delay to avoid rate limiting
    if (options.useLLM && i < clients.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 Reclassification Summary:\n');
  console.log(`   Total clients: ${results.total}`);
  console.log(`   Processed: ${results.processed}`);
  console.log(`   Updated: ${results.updated}`);
  console.log(`   Unchanged: ${results.unchanged}`);
  console.log(`   Errors: ${results.errors}`);

  if (results.changes.length > 0) {
    console.log('\n📝 Status Changes:\n');
    results.changes.forEach((change, idx) => {
      console.log(`   ${idx + 1}. ${change.phone}: ${change.oldStatus} → ${change.newStatus}`);
    });
  }

  if (options.dryRun) {
    console.log('\n⚠️  DRY RUN: No database changes were made');
  } else {
    console.log('\n✅ Reclassification completed!');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

