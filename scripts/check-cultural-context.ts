#!/usr/bin/env tsx
/**
 * Script to check cultural context accuracy
 * Analyzes clients and their messages to verify cultural origin detection
 */

import { config } from 'dotenv';
import { prisma } from '../packages/database/src/index';

config();

async function main() {
  const organizationId = process.argv[2] || '8ffef617-5216-403e-9633-224a13d70670';

  console.log('🔍 Analyzing cultural context accuracy...\n');
  console.log(`Organization ID: ${organizationId}\n`);

  // Get all clients with cultural context
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
            take: 10, // First 10 messages for analysis
          },
        },
      },
    },
  });

  console.log(`📊 Total clients with cultural context: ${clients.length}\n`);

  // Group by origin
  const originStats: Record<string, number> = {};
  const originDetails: Record<string, any[]> = {};

  for (const client of clients) {
    const context = client.culturalContext as any;
    const origin = context?.likelyOrigin || 'unknown';
    
    originStats[origin] = (originStats[origin] || 0) + 1;
    
    if (!originDetails[origin]) {
      originDetails[origin] = [];
    }
    
    originDetails[origin].push({
      phone: client.phone,
      name: `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'N/A',
      confidence: context?.confidence || 0,
      region: context?.region || 'N/A',
      communicationStyle: context?.communicationStyle || 'N/A',
      dietaryRestrictions: context?.dietaryRestrictions || [],
      messageCount: client.conversations[0]?.messages.length || 0,
      messages: client.conversations[0]?.messages.slice(0, 3).map((m: any) => ({
        content: m.content.substring(0, 100),
        fromMe: m.direction === 'OUTGOING',
      })) || [],
    });
  }

  // Show statistics
  console.log('═'.repeat(80));
  console.log('📈 Origin Distribution:\n');
  const sortedOrigins = Object.entries(originStats).sort((a, b) => b[1] - a[1]);
  for (const [origin, count] of sortedOrigins) {
    const percentage = ((count / clients.length) * 100).toFixed(1);
    console.log(`   ${origin.padEnd(25)} ${count.toString().padStart(3)} (${percentage}%)`);
  }

  // Show detailed samples for India (most common)
  console.log('\n' + '═'.repeat(80));
  console.log('\n🔍 Detailed Analysis: India (Top 10 samples)\n');
  
  const indiaClients = originDetails['India'] || [];
  const samples = indiaClients
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    console.log(`\n[${i + 1}/10] ${sample.phone} (${sample.name})`);
    console.log(`   Confidence: ${sample.confidence}`);
    console.log(`   Region: ${sample.region}`);
    console.log(`   Communication style: ${sample.communicationStyle}`);
    console.log(`   Dietary restrictions: ${sample.dietaryRestrictions.join(', ') || 'none'}`);
    console.log(`   Messages: ${sample.messageCount}`);
    console.log(`   Sample messages:`);
    
    for (const msg of sample.messages) {
      const role = msg.fromMe ? 'Agent' : 'Client';
      const preview = msg.content.length > 80 ? msg.content.substring(0, 80) + '...' : msg.content;
      console.log(`     [${role}]: ${preview}`);
    }
  }

  // Check for potential misclassifications
  console.log('\n' + '═'.repeat(80));
  console.log('\n⚠️  Potential Issues:\n');

  // Check India clients with UAE phone numbers
  const indiaUAE = clients.filter((c) => {
    const context = c.culturalContext as any;
    return context?.likelyOrigin?.toLowerCase().includes('india') && 
           c.phone.startsWith('+971');
  });

  console.log(`   India origin + UAE phone (+971): ${indiaUAE.length} clients`);
  console.log(`   This is expected - many Indians work/live in UAE\n`);

  // Check clients with very low confidence
  const lowConfidence = clients.filter((c) => {
    const context = c.culturalContext as any;
    return context?.confidence && context.confidence < 0.6;
  });

  console.log(`   Low confidence (<0.6): ${lowConfidence.length} clients`);
  if (lowConfidence.length > 0) {
    console.log(`   These might need re-evaluation\n`);
  }

  // Check for cultural markers in messages
  console.log('🔍 Checking for cultural markers in India clients:\n');
  const indiaSamples = originDetails['India']?.slice(0, 5) || [];
  
  for (const sample of indiaSamples) {
    const allMessages = sample.messages.map((m: any) => m.content.toLowerCase()).join(' ');
    const hasNamaste = allMessages.includes('namaste');
    const hasInshallah = allMessages.includes('inshallah');
    const hasMuslimMarkers = hasInshallah || allMessages.includes('allah') || allMessages.includes('muslim');
    
    console.log(`   ${sample.phone}:`);
    console.log(`     Namaste: ${hasNamaste ? '✅' : '❌'}`);
    console.log(`     Muslim markers: ${hasMuslimMarkers ? '⚠️  YES' : '✅ No'}`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

