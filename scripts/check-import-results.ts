#!/usr/bin/env tsx
/**
 * Script to check import results
 */

import { prisma } from '../packages/database/src/index';

const ORGANIZATION_ID = '8ffef617-5216-403e-9633-224a13d70670';

async function main() {
  console.log('📊 Checking import results...\n');

  // Count clients
  const clientCount = await prisma.client.count({
    where: { organizationId: ORGANIZATION_ID },
  });

  // Count conversations
  const conversationCount = await prisma.conversation.count({
    where: { organizationId: ORGANIZATION_ID },
  });

  // Count messages
  const messageCount = await prisma.message.count({
    where: { organizationId: ORGANIZATION_ID },
  });

  // Status distribution
  const statusDistribution = await prisma.client.groupBy({
    by: ['status'],
    where: { organizationId: ORGANIZATION_ID },
    _count: { id: true },
  });

  // Language distribution
  const languageDistribution = await prisma.client.groupBy({
    by: ['preferredLanguage'],
    where: { organizationId: ORGANIZATION_ID },
    _count: { id: true },
  });

  // Top clients by message count
  const topClients = await prisma.client.findMany({
    where: { organizationId: ORGANIZATION_ID },
    include: {
      conversations: {
        include: {
          messages: true,
        },
      },
    },
    take: 10,
  });

  const clientsWithMessageCount = topClients.map((client) => ({
    name: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.phone,
    phone: client.phone,
    status: client.status,
    language: client.preferredLanguage,
    messageCount: client.conversations.reduce(
      (sum, conv) => sum + conv.messages.length,
      0
    ),
  })).sort((a, b) => b.messageCount - a.messageCount);

  console.log('=== Импортированные данные ===\n');
  console.log(`👥 Клиентов: ${clientCount}`);
  console.log(`💬 Разговоров: ${conversationCount}`);
  console.log(`📨 Сообщений: ${messageCount}\n`);

  console.log('=== Распределение по статусам ===');
  statusDistribution.forEach(({ status, _count }) => {
    console.log(`  ${status}: ${_count.id}`);
  });

  console.log('\n=== Распределение по языкам ===');
  languageDistribution.forEach(({ preferredLanguage, _count }) => {
    const lang = preferredLanguage || 'не определен';
    console.log(`  ${lang}: ${_count.id}`);
  });

  console.log('\n=== Топ-10 клиентов по количеству сообщений ===');
  clientsWithMessageCount.slice(0, 10).forEach((client, index) => {
    console.log(
      `  ${index + 1}. ${client.name} (${client.phone}) - ${client.messageCount} сообщений - ${client.status} (${client.language || 'не определен'})`
    );
  });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

