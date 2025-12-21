#!/usr/bin/env tsx
/**
 * Check if client fields are correctly filled
 */

import { prisma } from '../packages/database/src/index';

const ORGANIZATION_ID = '8ffef617-5216-403e-9633-224a13d70670';

async function main() {
  console.log('🔍 Checking client fields...\n');

  const clients = await prisma.client.findMany({
    where: { organizationId: ORGANIZATION_ID },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  console.log(`📊 Found ${clients.length} recent clients\n`);

  for (const client of clients) {
    console.log(`\n📱 ${client.phone}`);
    console.log(`   firstName: ${client.firstName || 'NULL'}`);
    console.log(`   lastName: ${client.lastName || 'NULL'}`);
    console.log(`   preferredLanguage: ${client.preferredLanguage || 'NULL'}`);
    console.log(`   status: ${client.status}`);
    console.log(`   culturalContext: ${client.culturalContext ? '✅ Filled' : '❌ NULL'}`);
    console.log(`   metadata: ${client.metadata ? '✅ Filled' : '❌ NULL'}`);
    
    if (client.culturalContext) {
      const ctx = client.culturalContext as any;
      console.log(`   Cultural Context Details:`);
      console.log(`     - Country: ${ctx.country || 'N/A'}`);
      console.log(`     - Region: ${ctx.region || 'N/A'}`);
      console.log(`     - Language: ${ctx.language || 'N/A'}`);
      console.log(`     - Communication Style: ${ctx.communicationStyle || 'N/A'}`);
    }
    
    if (client.metadata) {
      const meta = client.metadata as any;
      console.log(`   Metadata Details:`);
      console.log(`     - Import Source: ${meta.importSource || 'N/A'}`);
      console.log(`     - Status Detection Method: ${meta.statusDetectionMethod || 'N/A'}`);
      console.log(`     - Message Count: ${meta.messageCount || 'N/A'}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

