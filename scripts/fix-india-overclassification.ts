#!/usr/bin/env tsx
/**
 * Fix over-classification of India origin
 * Reclassifies clients marked as India but without cultural markers to UAE/unknown
 */

import { config } from 'dotenv';
import { prisma } from '../packages/database/src/index';

config();

async function main() {
  const organizationId = process.argv[2] || '8ffef617-5216-403e-9633-224a13d70670';
  const dryRun = process.argv.includes('--dry-run');

  console.log('🔧 Fixing India over-classification...\n');
  console.log(`Organization ID: ${organizationId}`);
  console.log(`Dry run: ${dryRun ? 'Yes' : 'No'}\n`);

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
            take: 20, // Check first 20 messages
          },
        },
      },
    },
  });

  let fixed = 0;
  let kept = 0;

  for (const client of clients) {
    const context = client.culturalContext as any;
    if (!context || !context.likelyOrigin) continue;

    const origin = context.likelyOrigin.toLowerCase();
    if (!origin.includes('india')) continue;

    const conversation = client.conversations[0];
    if (!conversation || conversation.messages.length === 0) continue;

    // Check for cultural markers
    const allMessages = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ');

    const hasNamaste = allMessages.includes('namaste');
    const hasIndiaMention = 
      allMessages.includes('india') || 
      allMessages.includes('indian') ||
      allMessages.includes('mumbai') ||
      allMessages.includes('delhi') ||
      allMessages.includes('bangalore') ||
      allMessages.includes('chennai') ||
      allMessages.includes('hyderabad');
    
    const hasMuslimMarkers = 
      allMessages.includes('inshallah') || 
      allMessages.includes('allah') ||
      allMessages.includes('muslim');

    // If no clear markers, reclassify to UAE
    if (!hasNamaste && !hasIndiaMention && !hasMuslimMarkers) {
      const newContext = {
        ...context,
        likelyOrigin: 'UAE',
        confidence: Math.min(context.confidence || 0.8, 0.7), // Lower confidence
        culturalNotes: [
          ...(context.culturalNotes || []),
          'Reclassified from India due to lack of cultural markers',
        ],
      };

      console.log(`🔧 ${client.phone}: India → UAE (no markers)`);
      console.log(`   Messages checked: ${conversation.messages.length}`);

      if (!dryRun) {
        await prisma.client.update({
          where: { id: client.id },
          data: {
            culturalContext: newContext as any,
            metadata: {
              ...((client.metadata as any) || {}),
              originFixed: new Date().toISOString(),
              previousOrigin: 'India',
              reason: 'No cultural markers found',
            },
          },
        });
      }

      fixed++;
    } else {
      console.log(`✅ ${client.phone}: Keeping India (markers: Namaste=${hasNamaste}, India mention=${hasIndiaMention})`);
      kept++;
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 Summary:\n');
  console.log(`   Fixed (India → UAE): ${fixed}`);
  console.log(`   Kept (India with markers): ${kept}`);

  if (dryRun) {
    console.log('\n⚠️  DRY RUN: No database changes were made');
  } else {
    console.log('\n✅ Over-classification fixed!');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

