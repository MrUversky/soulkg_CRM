#!/usr/bin/env tsx
/**
 * Check import statistics and field filling
 */

import { prisma } from '../packages/database/src/index';

const ORGANIZATION_ID = '8ffef617-5216-403e-9633-224a13d70670';

async function main() {
  console.log('📊 Checking import statistics...\n');

  const total = await prisma.client.count({ where: { organizationId: ORGANIZATION_ID } });
  const withCulturalContext = await prisma.client.count({ 
    where: { 
      organizationId: ORGANIZATION_ID,
      culturalContext: { not: null }
    } 
  });
  const withMetadata = await prisma.client.count({ 
    where: { 
      organizationId: ORGANIZATION_ID,
      metadata: { not: null }
    } 
  });
  const withFirstName = await prisma.client.count({ 
    where: { 
      organizationId: ORGANIZATION_ID,
      firstName: { not: null }
    } 
  });
  const withPhoneAsName = await prisma.client.count({
    where: {
      organizationId: ORGANIZATION_ID,
      OR: [
        { firstName: { startsWith: '+' } },
        { firstName: { startsWith: '9' } },
        { lastName: { startsWith: '+' } }
      ]
    }
  });

  console.log(`📈 Статистика заполнения полей:\n`);
  console.log(`   Всего клиентов: ${total}`);
  console.log(`   С culturalContext: ${withCulturalContext} (${Math.round(withCulturalContext/total*100)}%)`);
  console.log(`   С metadata: ${withMetadata} (${Math.round(withMetadata/total*100)}%)`);
  console.log(`   С firstName: ${withFirstName} (${Math.round(withFirstName/total*100)}%)`);
  console.log(`   ⚠️  С телефоном в имени: ${withPhoneAsName} (${Math.round(withPhoneAsName/total*100)}%)`);
  
  if (withPhoneAsName > 0) {
    console.log(`\n   💡 Примечание: Телефоны в имени - это контакты из WhatsApp, где имя = телефон`);
    console.log(`      Это нормально, если в WhatsApp нет реального имени контакта`);
  }

  // Check status distribution
  const statusDistribution = await prisma.client.groupBy({
    by: ['status'],
    where: { organizationId: ORGANIZATION_ID },
    _count: { id: true },
  });

  console.log(`\n📊 Распределение по статусам:\n`);
  statusDistribution.forEach(({ status, _count }) => {
    console.log(`   ${status}: ${_count.id}`);
  });

  // Sample clients with cultural context
  const sampleClients = await prisma.client.findMany({
    where: {
      organizationId: ORGANIZATION_ID,
      culturalContext: { not: null }
    },
    take: 3,
    select: {
      phone: true,
      firstName: true,
      lastName: true,
      preferredLanguage: true,
      culturalContext: true,
      metadata: true,
    }
  });

  console.log(`\n📋 Примеры клиентов с заполненным culturalContext:\n`);
  for (const client of sampleClients) {
    const ctx = client.culturalContext as any;
    const meta = client.metadata as any;
    console.log(`   ${client.phone}:`);
    console.log(`     Name: ${client.firstName || 'N/A'} ${client.lastName || ''}`);
    console.log(`     Language: ${client.preferredLanguage || 'N/A'}`);
    console.log(`     Country: ${ctx?.country || 'N/A'}`);
    console.log(`     Region: ${ctx?.region || 'N/A'}`);
    console.log(`     Communication Style: ${ctx?.communicationStyle || 'N/A'}`);
    console.log(`     Import Method: ${meta?.statusDetectionMethod || 'N/A'}`);
    console.log('');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

