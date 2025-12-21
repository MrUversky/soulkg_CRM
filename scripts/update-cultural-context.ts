#!/usr/bin/env tsx
/**
 * Script to update cultural context for existing clients using LLM
 * 
 * Usage:
 *   tsx scripts/update-cultural-context.ts --organization-id <uuid> [options]
 * 
 * Options:
 *   --organization-id <uuid>  Organization ID (required)
 *   --limit <number>          Limit number of clients to update (for testing)
 *   --dry-run                 Test run without updating database
 *   --force                   Force update even if cultural context exists
 */

import { config } from 'dotenv';
import { prisma } from '../packages/database/src/index';
import { Prisma } from '@prisma/client';
import { OpenRouterProvider } from '../packages/agents/src/providers/openrouter-provider';
import { PromptLoader } from '../packages/agents/src/prompt-manager/prompt-loader';
import { LLMStatusDetector } from '../packages/agents/src/detectors/status-detector';
import { StatusDetectionStrategy } from '../packages/agents/src/detectors/strategy';
import { detectPrimaryLanguage } from '../packages/data-import/src/parsers/language-detector';
import { extractCountryCode } from '../packages/data-import/src/parsers/cultural-context-detector';

// Load environment variables
config();

interface UpdateOptions {
  organizationId: string;
  limit?: number;
  dryRun: boolean;
  force: boolean;
}

function parseArgs(): UpdateOptions {
  const args = process.argv.slice(2);
  const result: Partial<UpdateOptions> = {
    dryRun: false,
    force: false,
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
      case '--limit':
        if (nextArg && !nextArg.startsWith('--')) {
          result.limit = parseInt(nextArg, 10);
          i++;
        }
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
      case '--force':
        result.force = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Update Cultural Context Script

Usage:
  tsx scripts/update-cultural-context.ts --organization-id <uuid> [options]

Required:
  --organization-id <uuid>  Organization ID

Options:
  --limit <number>          Limit number of clients to update
  --dry-run                 Test run without updating database
  --force                   Force update even if cultural context exists
  --help, -h                Show this help message

Examples:
  # Update cultural context for all clients without it
  tsx scripts/update-cultural-context.ts --organization-id <uuid>

  # Test with 5 clients
  tsx scripts/update-cultural-context.ts --organization-id <uuid> --limit 5 --dry-run

  # Force update all clients
  tsx scripts/update-cultural-context.ts --organization-id <uuid> --force
        `);
        process.exit(0);
    }
  }

  if (!result.organizationId) {
    throw new Error('--organization-id is required');
  }

  return result as UpdateOptions;
}

async function main() {
  const options = parseArgs();

  console.log('🌍 Starting cultural context update...\n');
  console.log('Configuration:');
  console.log(`  Organization ID: ${options.organizationId}`);
  console.log(`  Limit: ${options.limit ? `${options.limit} clients` : 'All clients'}`);
  console.log(`  Force update: ${options.force ? 'Yes' : 'No (only clients without context)'}`);
  console.log(`  Dry run: ${options.dryRun ? 'Yes (no database updates)' : 'No (will update database)'}`);
  console.log('');

  // Initialize LLM
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    console.error('❌ Error: OPENROUTER_API_KEY environment variable is required');
    process.exit(1);
  }

  let statusDetectionStrategy: StatusDetectionStrategy;
  try {
    console.log('🤖 Initializing LLM...');
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

  // Get clients
  const whereClause: any = {
    organizationId: options.organizationId,
  };

  if (!options.force) {
    // Only clients without cultural context
    whereClause.culturalContext = { equals: Prisma.JsonNull };
  }

  let clients = await prisma.client.findMany({
    where: whereClause,
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
    take: options.limit ? options.limit * 2 : undefined, // Get more to filter by confidence
  });

  // Filter by confidence if not forcing (Prisma doesn't support JSON field filtering easily)
  if (!options.force) {
    clients = clients.filter((client) => {
      const context = client.culturalContext as any;
      return !context || (context.confidence && context.confidence < 0.6);
    });
    
    // Apply limit after filtering
    if (options.limit) {
      clients = clients.slice(0, options.limit);
    }
  }

  console.log(`📊 Found ${clients.length} clients to update\n`);
  console.log('═'.repeat(80));

  const results = {
    total: clients.length,
    processed: 0,
    updated: 0,
    unchanged: 0,
    errors: 0,
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

    // Detect language
    const languageMessages = extractedMessages.map((m) => ({
      content: m.content,
      timestamp: m.timestamp,
    }));
    const primaryLanguage = detectPrimaryLanguage(languageMessages);

    const clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.phone;
    console.log(`\n[${i + 1}/${clients.length}] 🔍 ${client.phone} (${clientName})`);
    console.log(`   Current language: ${client.preferredLanguage || primaryLanguage}`);
    console.log(`   Messages: ${messages.length}`);
    
    const currentContext = client.culturalContext as any;
    if (currentContext) {
      const confidence = currentContext.confidence || 0;
      // Skip if confidence is high and not forcing
      if (!options.force && confidence >= 0.6) {
        console.log(`   Current context: ${currentContext.likelyOrigin || 'unknown'} (${currentContext.region || 'unknown'}) - confidence: ${confidence}`);
        console.log(`   ⏭️  Skipping (high confidence, use --force to update)`);
        results.unchanged++;
        results.processed++;
        continue;
      }
      console.log(`   Current context: ${currentContext.likelyOrigin || 'unknown'} (${currentContext.region || 'unknown'}) - confidence: ${confidence}`);
    } else {
      console.log(`   Current context: None`);
    }

    try {
      const statusResult = await statusDetectionStrategy.detectStatus({
        organizationId: options.organizationId,
        messages: extractedMessages,
        firstMessageDate,
        lastMessageDate,
        language: primaryLanguage,
        useLLM: true,
        fallbackToHeuristic: true,
      });

      if (statusResult.culturalContext) {
        const newContext = statusResult.culturalContext;
        console.log(`   New context: ${newContext.likelyOrigin || 'unknown'} (${newContext.region || 'unknown'}) - confidence: ${newContext.confidence || 'N/A'}`);
        console.log(`   Communication style: ${newContext.communicationStyle || 'N/A'}`);
        if (newContext.dietaryRestrictions && newContext.dietaryRestrictions.length > 0) {
          console.log(`   Dietary restrictions: ${newContext.dietaryRestrictions.join(', ')}`);
        }

        // Add timezone and country code from phone
        // Get timezone from existing context or detect from phone
        const existingContext = client.culturalContext as any;
        const countryCode = client.phone ? extractCountryCode(client.phone) : undefined;
        
        // Determine timezone from country code
        let timezone: string | undefined;
        if (countryCode === '971') {
          timezone = 'Asia/Dubai';
        } else if (countryCode === '996') {
          timezone = 'Asia/Bishkek';
        } else if (countryCode === '92') {
          timezone = 'Asia/Karachi';
        } else if (countryCode === '7') {
          timezone = 'Europe/Moscow';
        } else if (countryCode === '44') {
          timezone = 'Europe/London';
        }
        
        const enhancedContext = {
          ...newContext,
          language: primaryLanguage,
          timezone: existingContext?.timezone || timezone,
          countryCode,
        };

        if (!options.dryRun) {
          await prisma.client.update({
            where: { id: client.id },
            data: {
              culturalContext: enhancedContext as any,
              metadata: {
                ...((client.metadata as any) || {}),
                culturalContextUpdatedAt: new Date().toISOString(),
                culturalContextUpdateReason: 'llm_reanalysis',
              },
            },
          });
        }

        results.updated++;
        console.log(`   ✅ Updated`);
      } else {
        console.log(`   ⚠️  No cultural context in LLM response`);
        results.unchanged++;
      }

      results.processed++;
    } catch (error) {
      console.error(`   ❌ Error:`, error);
      results.errors++;
      results.processed++;
    }

    // Small delay to avoid rate limiting
    if (i < clients.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 Update Summary:\n');
  console.log(`   Total clients: ${results.total}`);
  console.log(`   Processed: ${results.processed}`);
  console.log(`   Updated: ${results.updated}`);
  console.log(`   Unchanged: ${results.unchanged}`);
  console.log(`   Errors: ${results.errors}`);

  if (options.dryRun) {
    console.log('\n⚠️  DRY RUN: No database changes were made');
  } else {
    console.log('\n✅ Cultural context update completed!');
  }

  await prisma.$disconnect();
}


main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

