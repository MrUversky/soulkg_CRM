#!/usr/bin/env tsx
/**
 * Check who sent the last message in each conversation
 */

import { prisma } from '../packages/database/src/index';

const ORGANIZATION_ID = '8ffef617-5216-403e-9633-224a13d70670';

async function main() {
  console.log('🔍 Checking last message sender for CLOSED clients...\n');

  const clients = await prisma.client.findMany({
    where: { 
      organizationId: ORGANIZATION_ID,
      status: 'CLOSED'
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
  });

  console.log(`📊 Found ${clients.length} CLOSED clients\n`);
  console.log('═'.repeat(80));

  let issuesFound = 0;

  for (const client of clients) {
    const conversation = client.conversations[0];
    const messages = conversation?.messages || [];
    
    if (messages.length === 0) {
      console.log(`\n⚠️  ${client.phone}: Нет сообщений!`);
      continue;
    }

    const lastMessage = messages[messages.length - 1];
    const lastMessageSender = lastMessage.direction === 'INCOMING' ? '👤 Клиент' : '🤖 Агент';
    const daysSinceLast = Math.floor(
      (Date.now() - lastMessage.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(`\n📱 ${client.phone}`);
    console.log(`   Всего сообщений: ${messages.length}`);
    console.log(`   Последнее сообщение: ${lastMessage.createdAt.toLocaleDateString()} (${daysSinceLast} дней назад)`);
    console.log(`   Отправитель: ${lastMessageSender}`);
    console.log(`   Содержание: ${lastMessage.content.substring(0, 100)}${lastMessage.content.length > 100 ? '...' : ''}`);

    // Проверяем, кто написал последние 3 сообщения
    const last3Messages = messages.slice(-3);
    console.log(`\n   Последние 3 сообщения:`);
    last3Messages.forEach((msg, idx) => {
      const sender = msg.direction === 'INCOMING' ? '👤 Клиент' : '🤖 Агент';
      const content = msg.content.substring(0, 80);
      console.log(`      ${idx + 1}. ${sender}: ${content || '(пустое)'}`);
    });

    // Проблема: если последнее сообщение от клиента, а статус CLOSED - это неправильно
    if (lastMessage.direction === 'INCOMING') {
      issuesFound++;
      console.log(`\n   ⚠️  ПРОБЛЕМА: Последнее сообщение от клиента, но статус CLOSED!`);
      console.log(`      Клиент написал ${daysSinceLast} дней назад, но агент не ответил.`);
      console.log(`      Это должно быть не CLOSED, а возможно нужна эскалация или другой статус.`);
    } else {
      console.log(`\n   ✅ ОК: Последнее сообщение от агента, клиент не ответил ${daysSinceLast} дней - правильно CLOSED`);
    }

    console.log('\n' + '─'.repeat(80));
  }

  console.log(`\n\n📊 Итого:`);
  console.log(`   Всего CLOSED клиентов: ${clients.length}`);
  console.log(`   Проблемных (последнее сообщение от клиента): ${issuesFound}`);
  console.log(`   Правильно определенных: ${clients.length - issuesFound}`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

