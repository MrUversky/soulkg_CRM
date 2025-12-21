#!/usr/bin/env tsx
/**
 * Script to fix dietary restrictions for clients from India
 * Removes Halal from clients where it was incorrectly assigned
 * 
 * Usage:
 *   tsx scripts/fix-dietary-restrictions.ts --organization-id <uuid> [--dry-run]
 */

import { config } from 'dotenv';
import { prisma } from '../packages/database/src/index';

config();

interface FixOptions {
  organizationId: string;
  dryRun: boolean;
}

function parseArgs(): FixOptions {
  const args = process.argv.slice(2);
  const result: Partial<FixOptions> = {
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
      case '--dry-run':
        result.dryRun = true;
        break;
    }
  }

  if (!result.organizationId) {
    throw new Error('--organization-id is required');
  }

  return result as FixOptions;
}

async function main() {
  const options = parseArgs();

  console.log('🔧 Fixing dietary restrictions for Indian clients...\n');
  console.log(`Organization ID: ${options.organizationId}`);
  console.log(`Dry run: ${options.dryRun ? 'Yes' : 'No'}\n`);

  // Get all clients from India with Halal restriction
  const clients = await prisma.client.findMany({
    where: {
      organizationId: options.organizationId,
    },
  });

  let fixed = 0;
  let skipped = 0;

  for (const client of clients) {
    const context = client.culturalContext as any;
    if (!context || !context.likelyOrigin) continue;

    const origin = context.likelyOrigin.toLowerCase();
    const restrictions = context.dietaryRestrictions || [];

    // Check if client is from India and has Halal
    if (origin.includes('india') && restrictions.includes('Halal')) {
      // Check if there are Muslim indicators (we'll be conservative)
      // If no clear Muslim indicators, remove Halal
      // For now, we'll remove Halal from all Indian clients unless we have strong evidence
      
      // Check for Muslim indicators in messages
      // Get conversation messages to check for Muslim cultural markers
      const conversation = await prisma.conversation.findFirst({
        where: { clientId: client.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 50, // Check recent messages
          },
        },
      });

      const messages = conversation?.messages || [];
      const messageTexts = messages.map((m) => m.content.toLowerCase()).join(' ');
      
      // Muslim indicators: Inshallah, Allah, Muslim, Islam, etc.
      const hasMuslimIndicators = 
        context.culturalNotes?.some((note: string) => 
          note.toLowerCase().includes('muslim') || 
          note.toLowerCase().includes('islam')
        ) ||
        messageTexts.includes('inshallah') ||
        messageTexts.includes('allah') ||
        messageTexts.includes('muslim') ||
        messageTexts.includes('islam');

      if (!hasMuslimIndicators) {
        // Remove Halal, keep other restrictions
        const newRestrictions = restrictions.filter((r: string) => r !== 'Halal');
        
        const updatedContext = {
          ...context,
          dietaryRestrictions: newRestrictions,
        };

        console.log(`🔧 ${client.phone} (${context.likelyOrigin}): Removing Halal`);
        console.log(`   Old: ${restrictions.join(', ') || 'none'}`);
        console.log(`   New: ${newRestrictions.join(', ') || 'none'}`);

        if (!options.dryRun) {
          const currentMetadata = (client.metadata as any) || {};
          await prisma.client.update({
            where: { id: client.id },
            data: {
              culturalContext: updatedContext as any,
              metadata: {
                ...currentMetadata,
                dietaryRestrictionsFixed: new Date().toISOString(),
                dietaryRestrictionsReason: 'Removed Halal for Hindu Indian client',
              },
            },
          });
        }

        fixed++;
      } else {
        console.log(`⏭️  ${client.phone} (${context.likelyOrigin}): Keeping Halal (Muslim indicators found)`);
        skipped++;
      }
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 Summary:\n');
  console.log(`   Fixed: ${fixed}`);
  console.log(`   Skipped (Muslim indicators): ${skipped}`);

  if (options.dryRun) {
    console.log('\n⚠️  DRY RUN: No database changes were made');
  } else {
    console.log('\n✅ Dietary restrictions fixed!');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

