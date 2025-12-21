#!/usr/bin/env tsx
/**
 * Script to analyze status detection quality
 */

import { prisma } from '../packages/database/src/index';

const ORGANIZATION_ID = '8ffef617-5216-403e-9633-224a13d70670';

async function main() {
  console.log('🔍 Analyzing status detection quality...\n');

  // Get all clients with their conversations and messages
  const clients = await prisma.client.findMany({
    where: { organizationId: ORGANIZATION_ID },
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`📊 Found ${clients.length} clients to analyze\n`);
  console.log('═'.repeat(80));
  console.log('');

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    const conversation = client.conversations[0];
    const messages = conversation?.messages || [];
    const statusHistory = client.statusHistory[0];

    console.log(`\n[${i + 1}] Клиент: ${client.firstName || ''} ${client.lastName || ''}`.trim() || client.phone);
    console.log(`   Телефон: ${client.phone}`);
    console.log(`   Статус: ${client.status}`);
    console.log(`   Язык: ${client.preferredLanguage || 'не определен'}`);
    console.log(`   Сообщений: ${messages.length}`);
    
    if (statusHistory) {
      console.log(`   История статуса: ${statusHistory.oldStatus || 'N/A'} → ${statusHistory.newStatus}`);
      console.log(`   Причина: ${statusHistory.reason || 'не указана'}`);
    }

    if (messages.length > 0) {
      const firstMessage = messages[0];
      const lastMessage = messages[messages.length - 1];
      const daysSinceLast = Math.floor(
        (Date.now() - lastMessage.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      console.log(`   Первое сообщение: ${firstMessage.createdAt.toLocaleDateString()}`);
      console.log(`   Последнее сообщение: ${lastMessage.createdAt.toLocaleDateString()} (${daysSinceLast} дней назад)`);
      
      console.log(`\n   💬 История диалога:`);
      messages.slice(0, 10).forEach((msg, idx) => {
        const direction = msg.direction === 'INCOMING' ? '👤 Клиент' : '🤖 Агент';
        const content = msg.content.length > 100 
          ? msg.content.substring(0, 100) + '...'
          : msg.content;
        console.log(`      ${idx + 1}. ${direction}: ${content}`);
      });
      
      if (messages.length > 10) {
        console.log(`      ... и еще ${messages.length - 10} сообщений`);
      }

      // Анализ контекста для определения ожидаемого статуса
      console.log(`\n   📋 Анализ:`);
      const allText = messages.map(m => m.content.toLowerCase()).join(' ');
      const keywords = {
        CLOSED: ['no thank', 'not interested', 'не интересно', 'не нужно', 'нет', daysSinceLast > 30],
        SOLD: ['paid', 'booked', 'confirmed', 'оплатил', 'забронировал', 'подтвердил', 'payment'],
        SERVICE: ['during tour', 'on tour', 'сейчас в', 'на туре', 'currently'],
        NEGOTIATION: ['discussing', 'negotiating', 'modifications', 'обсуждаем', 'изменения', 'can we', 'is it possible'],
        PROPOSAL_SENT: ['proposal', 'itinerary', 'предложение', 'маршрут', 'sent you'],
        QUALIFIED: ['dates', 'prices', 'budget', 'number of people', 'how much', 'даты', 'цены', 'бюджет', 'сколько'],
        WARMED: ['interested', 'tell me more', 'расскажите', 'интересно', 'sounds good'],
        NEW_LEAD: [messages.length <= 2 && daysSinceLast < 7],
      };

      const detectedKeywords: string[] = [];
      Object.entries(keywords).forEach(([status, terms]) => {
        terms.forEach(term => {
          if (typeof term === 'boolean' && term) {
            detectedKeywords.push(status);
          } else if (typeof term === 'string' && allText.includes(term)) {
            detectedKeywords.push(status);
          }
        });
      });

      console.log(`      Найденные ключевые слова: ${detectedKeywords.length > 0 ? detectedKeywords.join(', ') : 'нет явных признаков'}`);
      console.log(`      Дней с последнего сообщения: ${daysSinceLast}`);
      console.log(`      Количество сообщений: ${messages.length}`);
      
      // Оценка адекватности
      const statusMatch = detectedKeywords.includes(client.status) || 
                         (client.status === 'CLOSED' && daysSinceLast > 30) ||
                         (client.status === 'NEW_LEAD' && messages.length <= 2);
      
      console.log(`      ✅ Статус "${client.status}" ${statusMatch ? 'соответствует' : 'НЕ соответствует'} контексту диалога`);
      
      if (!statusMatch) {
        const suggestedStatus = detectedKeywords[0] || (daysSinceLast > 30 ? 'CLOSED' : 'NEW_LEAD');
        console.log(`      💡 Предлагаемый статус: ${suggestedStatus}`);
      }
    }

    console.log('\n' + '─'.repeat(80));
  }

  // Общая статистика
  console.log('\n\n📈 Общая статистика:');
  const statusDistribution = await prisma.client.groupBy({
    by: ['status'],
    where: { organizationId: ORGANIZATION_ID },
    _count: { id: true },
  });

  statusDistribution.forEach(({ status, _count }) => {
    console.log(`   ${status}: ${_count.id} клиентов`);
  });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

