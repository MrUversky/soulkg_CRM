#!/usr/bin/env tsx
/**
 * Reclassify clients incorrectly identified as India
 * Uses improved prompt to be more conservative
 */

import { config } from 'dotenv';
import { prisma } from '../packages/database/src/index';
import { OpenRouterProvider } from '../packages/agents/src/providers/openrouter-provider';
import { PromptLoader } from '../packages/agents/src/prompt-manager/prompt-loader';
import { LLMStatusDetector } from '../packages/agents/src/detectors/status-detector';
import { StatusDetectionStrategy } from '../packages/agents/src/detectors/strategy';
import { detectPrimaryLanguage } from '../packages/data-import/src/parsers/language-detector';

config();

async function main() {
  const organizationId = process.argv[2] || '8ffef617-5216-403e-9633-224a13d70670';
  const limit = parseInt(process.argv[3] || '10', 10);
  const dryRun = process.argv.includes('--dry-run');

  console.log('🔄 Reclassifying India clients with improved prompt...\n');
  console.log(`Organization ID: ${organizationId}`);
  console.log(`Limit: ${limit} clients`);
  console.log(`Dry run: ${dryRun ? 'Yes' : 'No'}\n`);

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    console.error('❌ Error: OPENROUTER_API_KEY environment variable is required');
    process.exit(1);
  }

  const llmProvider = new OpenRouterProvider({
    apiKey: openRouterKey,
    defaultModel: 'openai/gpt-4o-mini',
  });
  const promptLoader = new PromptLoader(prisma);
  const llmDetector = new LLMStatusDetector(llmProvider, promptLoader);
  const statusDetectionStrategy = new StatusDetectionStrategy({
    llmDetector,
    useLLMByDefault: true,
    fallbackToHeuristic: true,
  });

  // Get India clients with low confidence or no cultural markers
  const clients = await prisma.client.findMany({
    where: {
      organizationId,
      culturalContext: { not: null },
    },
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
    take: limit * 2, // Get more to filter
  });

  // Filter India clients
  const indiaClients = clients.filter((c) => {
    const context = c.culturalContext as any;
    return context?.likelyOrigin?.toLowerCase().includes('india');
  }).slice(0, limit);

  console.log(`📊 Found ${indiaClients.length} India clients to reclassify\n`);
  console.log('═'.repeat(80));

  let changed = 0;
  let unchanged = 0;

  for (let i = 0; i < indiaClients.length; i++) {
    const client = indiaClients[i];
    const conversation = client.conversations[0];
    
    if (!conversation || conversation.messages.length === 0) {
      console.log(`\n[${i + 1}/${indiaClients.length}] ⏭️  ${client.phone}: No messages`);
      continue;
    }

    const messages = conversation.messages;
    const extractedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      timestamp: msg.createdAt,
      fromMe: msg.direction === 'OUTGOING',
      type: 'text' as const,
    }));

    const languageMessages = extractedMessages.map((m) => ({
      content: m.content,
      timestamp: m.timestamp,
    }));
    const primaryLanguage = detectPrimaryLanguage(languageMessages);

    const firstMessageDate = messages[0].createdAt;
    const lastMessageDate = messages[messages.length - 1].createdAt;

    const currentContext = client.culturalContext as any;
    console.log(`\n[${i + 1}/${indiaClients.length}] 🔍 ${client.phone}`);
    console.log(`   Current: ${currentContext.likelyOrigin} (confidence: ${currentContext.confidence || 'N/A'})`);
    
    // Check for cultural markers
    const allMessages = messages.map((m) => m.content.toLowerCase()).join(' ');
    const hasNamaste = allMessages.includes('namaste');
    const hasIndiaMention = allMessages.includes('india') || allMessages.includes('indian');
    const hasMuslimMarkers = allMessages.includes('inshallah') || allMessages.includes('allah');
    
    console.log(`   Markers: Namaste=${hasNamaste}, India mention=${hasIndiaMention}, Muslim=${hasMuslimMarkers}`);

    try {
      const statusResult = await statusDetectionStrategy.detectStatus({
        organizationId,
        messages: extractedMessages,
        firstMessageDate,
        lastMessageDate,
        language: primaryLanguage,
        useLLM: true,
        fallbackToHeuristic: true,
      });

      if (statusResult.culturalContext) {
        const newOrigin = statusResult.culturalContext.likelyOrigin;
        const newConfidence = statusResult.culturalContext.confidence || 0;
        
        console.log(`   New: ${newOrigin} (confidence: ${newConfidence})`);

        if (newOrigin?.toLowerCase() !== currentContext.likelyOrigin?.toLowerCase()) {
          console.log(`   ✅ Changed: ${currentContext.likelyOrigin} → ${newOrigin}`);
          
          if (!dryRun) {
            const enhancedContext = {
              ...statusResult.culturalContext,
              language: primaryLanguage,
              timezone: currentContext.timezone,
              countryCode: currentContext.countryCode,
            };

            await prisma.client.update({
              where: { id: client.id },
              data: {
                culturalContext: enhancedContext as any,
                metadata: {
                  ...((client.metadata as any) || {}),
                  originReclassified: new Date().toISOString(),
                  previousOrigin: currentContext.likelyOrigin,
                },
              },
            });
          }
          
          changed++;
        } else {
          console.log(`   ⏭️  Unchanged`);
          unchanged++;
        }
      }
    } catch (error) {
      console.error(`   ❌ Error:`, error);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 Summary:\n');
  console.log(`   Changed: ${changed}`);
  console.log(`   Unchanged: ${unchanged}`);

  if (dryRun) {
    console.log('\n⚠️  DRY RUN: No database changes were made');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});




