# Интеграция с WhatsApp Web

## 🎯 Обзор

Система использует **WhatsApp Web** через библиотеку `whatsapp-web.js` для чтения и отправки сообщений. Это означает, что мы эмулируем веб-клиент WhatsApp и работаем напрямую через браузерную сессию.

## ⚠️ Важные ограничения

### Технические ограничения
1. **Одна сессия на аккаунт**: Одновременно может быть активна только одна сессия WhatsApp Web
2. **Необходимость QR-кода**: При первом подключении требуется сканирование QR-кода
3. **Поддержание сессии**: Сессия может разорваться, требуется механизм переподключения
4. **Rate Limits**: WhatsApp ограничивает частоту отправки сообщений
5. **Нет официального API**: Нет гарантий стабильности, могут быть изменения в WhatsApp

### Функциональные ограничения
- ❌ Массовая рассылка ограничена (риск блокировки)
- ❌ Нет webhook от WhatsApp (нужно самим слушать сообщения)
- ❌ Ограниченная информация о статусе доставки
- ⚠️ Риск блокировки аккаунта при злоупотреблении

## 🏗️ Архитектура интеграции

### Компоненты

```
┌─────────────────┐
│  WhatsApp Web   │
│     Client      │ ← whatsapp-web.js
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Message Queue  │ ← BullMQ для обработки сообщений
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Message Handler│ ← Обработка входящих/исходящих
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Agents      │ ← Генерация ответов
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database       │ ← Сохранение истории
└─────────────────┘
```

### Структура модуля

```
packages/
└── whatsapp/
    ├── client/              # WhatsApp клиент
    │   ├── whatsapp-client.ts
    │   ├── session-manager.ts
    │   └── connection-handler.ts
    ├── handlers/            # Обработчики событий
    │   ├── message-handler.ts
    │   ├── status-handler.ts
    │   └── error-handler.ts
    ├── queue/               # Очереди сообщений
    │   ├── message-queue.ts
    │   └── send-message-job.ts
    └── types/               # Типы
        └── whatsapp.types.ts
```

## 🔧 Реализация

### 1. WhatsApp Client Service

```typescript
// packages/whatsapp/client/whatsapp-client.ts

import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import { EventEmitter } from 'events';

export class WhatsAppClient extends EventEmitter {
  private client: Client;
  private organizationId: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(organizationId: string) {
    super();
    this.organizationId = organizationId;
    
    // Инициализация клиента с сохранением сессии
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: `org-${organizationId}`,
        dataPath: `.whatsapp-sessions/org-${organizationId}`
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // QR код для авторизации
    this.client.on('qr', (qr) => {
      this.emit('qr', qr);
      console.log(`[WhatsApp ${this.organizationId}] QR Code generated`);
    });

    // Готовность к работе
    this.client.on('ready', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('ready');
      console.log(`[WhatsApp ${this.organizationId}] Client is ready!`);
    });

    // Аутентификация успешна
    this.client.on('authenticated', () => {
      console.log(`[WhatsApp ${this.organizationId}] Authenticated`);
    });

    // Аутентификация неуспешна
    this.client.on('auth_failure', (msg) => {
      console.error(`[WhatsApp ${this.organizationId}] Auth failure:`, msg);
      this.emit('auth_failure', msg);
    });

    // Разрыв соединения
    this.client.on('disconnected', (reason) => {
      this.isConnected = false;
      console.warn(`[WhatsApp ${this.organizationId}] Disconnected:`, reason);
      this.emit('disconnected', reason);
      this.handleReconnect();
    });

    // Входящие сообщения
    this.client.on('message', async (message: Message) => {
      await this.handleIncomingMessage(message);
    });

    // Статус сообщения
    this.client.on('message_ack', (msg, ack) => {
      this.emit('message_ack', { msg, ack });
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.client.initialize();
    } catch (error) {
      console.error(`[WhatsApp ${this.organizationId}] Initialization error:`, error);
      throw error;
    }
  }

  async sendMessage(to: string, content: string): Promise<Message> {
    if (!this.isConnected) {
      throw new Error('WhatsApp client is not connected');
    }

    try {
      const number = this.formatPhoneNumber(to);
      const message = await this.client.sendMessage(number, content);
      return message;
    } catch (error) {
      console.error(`[WhatsApp ${this.organizationId}] Send message error:`, error);
      throw error;
    }
  }

  async handleIncomingMessage(message: Message) {
    // Игнорируем сообщения от себя
    if (message.fromMe) return;

    // Игнорируем статусы и групповые сообщения (если нужно)
    if (message.isStatus || message.from.includes('@g.us')) {
      return;
    }

    this.emit('message', {
      id: message.id._serialized,
      from: message.from,
      to: message.to,
      body: message.body,
      timestamp: message.timestamp,
      hasMedia: message.hasMedia,
      type: message.type
    });
  }

  private formatPhoneNumber(phone: string): string {
    // Форматирование номера для WhatsApp (международный формат)
    // Пример: +996555123456 -> 996555123456@c.us
    const cleaned = phone.replace(/\D/g, '');
    return `${cleaned}@c.us`;
  }

  private async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[WhatsApp ${this.organizationId}] Max reconnect attempts reached`);
      this.emit('max_reconnect_reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff
    
    console.log(`[WhatsApp ${this.organizationId}] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.client.initialize();
      } catch (error) {
        console.error(`[WhatsApp ${this.organizationId}] Reconnect error:`, error);
        this.handleReconnect();
      }
    }, delay);
  }

  async destroy(): Promise<void> {
    await this.client.destroy();
    this.isConnected = false;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async getQRCode(): Promise<string | null> {
    // QR код генерируется автоматически при первом подключении
    // Можно сохранить в БД для отображения в UI
    return null; // Реализовать через событие 'qr'
  }
}
```

### 2. Session Manager

```typescript
// packages/whatsapp/client/session-manager.ts

import { WhatsAppClient } from './whatsapp-client';
import { prisma } from '@/packages/database';

export class WhatsAppSessionManager {
  private clients: Map<string, WhatsAppClient> = new Map();

  async getOrCreateClient(organizationId: string): Promise<WhatsAppClient> {
    if (this.clients.has(organizationId)) {
      const client = this.clients.get(organizationId)!;
      if (client.getConnectionStatus()) {
        return client;
      }
      // Переподключение если отключен
      await client.initialize();
      return client;
    }

    const client = new WhatsAppClient(organizationId);
    this.setupClientEvents(client, organizationId);
    
    await client.initialize();
    this.clients.set(organizationId, client);
    
    return client;
  }

  private setupClientEvents(client: WhatsAppClient, organizationId: string) {
    client.on('qr', async (qr) => {
      // Сохраняем QR код в БД для отображения в UI
      await prisma.whatsAppSession.upsert({
        where: { organizationId },
        update: { qrCode: qr, status: 'WAITING_QR' },
        create: { organizationId, qrCode: qr, status: 'WAITING_QR' }
      });
    });

    client.on('ready', async () => {
      await prisma.whatsAppSession.update({
        where: { organizationId },
        data: { status: 'CONNECTED', qrCode: null }
      });
    });

    client.on('disconnected', async (reason) => {
      await prisma.whatsAppSession.update({
        where: { organizationId },
        data: { status: 'DISCONNECTED', lastError: reason }
      });
    });
  }

  async disconnect(organizationId: string): Promise<void> {
    const client = this.clients.get(organizationId);
    if (client) {
      await client.destroy();
      this.clients.delete(organizationId);
    }
  }
}
```

### 3. Message Queue Handler

```typescript
// packages/whatsapp/queue/message-queue.ts

import Queue from 'bull';
import { WhatsAppSessionManager } from '../client/session-manager';
import { prisma } from '@/packages/database';

export class WhatsAppMessageQueue {
  private sendQueue: Queue;
  private sessionManager: WhatsAppSessionManager;

  constructor() {
    this.sendQueue = new Queue('whatsapp-send', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    });

    this.sessionManager = new WhatsAppSessionManager();
    this.setupProcessors();
  }

  private setupProcessors() {
    // Обработка отправки сообщений
    this.sendQueue.process('send-message', async (job) => {
      const { organizationId, to, content, conversationId } = job.data;
      
      try {
        const client = await this.sessionManager.getOrCreateClient(organizationId);
        const message = await client.sendMessage(to, content);

        // Сохраняем сообщение в БД
        await prisma.message.create({
          data: {
            conversationId,
            content,
            direction: 'OUTGOING',
            whatsappMessageId: message.id._serialized,
            status: 'SENT',
            sentAt: new Date()
          }
        });

        return { success: true, messageId: message.id._serialized };
      } catch (error) {
        console.error('Send message error:', error);
        throw error;
      }
    });
  }

  async addSendMessageJob(data: {
    organizationId: string;
    to: string;
    content: string;
    conversationId: string;
  }): Promise<void> {
    await this.sendQueue.add('send-message', data, {
      priority: 1
    });
  }
}
```

### 4. Message Handler (интеграция с агентами)

```typescript
// packages/whatsapp/handlers/message-handler.ts

import { WhatsAppClient } from '../client/whatsapp-client';
import { prisma } from '@/packages/database';
import { AgentOrchestrator } from '@/packages/agents/orchestrator';

export class WhatsAppMessageHandler {
  private agentOrchestrator: AgentOrchestrator;

  constructor() {
    this.agentOrchestrator = new AgentOrchestrator();
  }

  async handleIncomingMessage(data: {
    organizationId: string;
    from: string;
    body: string;
    messageId: string;
    timestamp: number;
  }) {
    const { organizationId, from, body, messageId, timestamp } = data;

    try {
      // Находим или создаем клиента
      let client = await prisma.client.findFirst({
        where: {
          organizationId,
          phone: this.extractPhoneNumber(from)
        }
      });

      if (!client) {
        // Создаем нового клиента
        client = await prisma.client.create({
          data: {
            organizationId,
            phone: this.extractPhoneNumber(from),
            status: 'NEW_LEAD',
            source: 'WHATSAPP'
          }
        });
      }

      // Находим или создаем разговор
      let conversation = await prisma.conversation.findFirst({
        where: {
          clientId: client.id,
          channel: 'WHATSAPP',
          status: 'ACTIVE'
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            clientId: client.id,
            organizationId,
            channel: 'WHATSAPP',
            status: 'ACTIVE'
          }
        });
      }

      // Сохраняем входящее сообщение
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: body,
          direction: 'INCOMING',
          whatsappMessageId: messageId,
          status: 'RECEIVED',
          receivedAt: new Date(timestamp * 1000)
        }
      });

      // Передаем агенту для обработки
      const response = await this.agentOrchestrator.processMessage({
        organizationId,
        clientId: client.id,
        conversationId: conversation.id,
        message: body,
        context: {
          clientStatus: client.status,
          conversationHistory: await this.getRecentMessages(conversation.id)
        }
      });

      // Отправляем ответ через очередь
      if (response.reply) {
        await this.sendReply(organizationId, from, response.reply, conversation.id);
      }

      // Обновляем статус клиента если изменился
      if (response.clientStatusUpdate) {
        await prisma.client.update({
          where: { id: client.id },
          data: { status: response.clientStatusUpdate }
        });
      }

    } catch (error) {
      console.error('Handle incoming message error:', error);
      // Логируем ошибку, но не падаем
    }
  }

  private extractPhoneNumber(whatsappId: string): string {
    // Извлекаем номер из формата WhatsApp (996555123456@c.us -> 996555123456)
    return whatsappId.split('@')[0];
  }

  private async getRecentMessages(conversationId: string, limit: number = 10) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { receivedAt: 'desc' },
      take: limit
    });
  }

  private async sendReply(
    organizationId: string,
    to: string,
    content: string,
    conversationId: string
  ) {
    // Используем очередь для отправки
    const { WhatsAppMessageQueue } = await import('../queue/message-queue');
    const queue = new WhatsAppMessageQueue();
    await queue.addSendMessageJob({
      organizationId,
      to,
      content,
      conversationId
    });
  }
}
```

## 📊 Схема БД для WhatsApp

```prisma
model WhatsAppSession {
  id            String   @id @default(cuid())
  organizationId String  @unique
  organization  Organization @relation(fields: [organizationId], references: [id])
  
  status        String   // CONNECTED, DISCONNECTED, WAITING_QR, ERROR
  qrCode        String?  // QR код для авторизации
  lastError     String?
  connectedAt   DateTime?
  disconnectedAt DateTime?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Message {
  id              String   @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  
  content         String
  direction       String   // INCOMING, OUTGOING
  whatsappMessageId String? @unique
  
  status          String   // SENT, DELIVERED, READ, FAILED, RECEIVED
  receivedAt      DateTime?
  sentAt          DateTime?
  
  createdAt       DateTime @default(now())
  
  @@index([conversationId])
  @@index([whatsappMessageId])
}
```

## 🔒 Безопасность

### Хранение сессий
- Сессии хранятся локально в `.whatsapp-sessions/`
- Каждая организация имеет свою папку сессии
- Папки должны быть в `.gitignore`
- В production использовать безопасное хранилище (S3, encrypted volume)

### Ограничения отправки
```typescript
// Rate limiting для отправки сообщений
const RATE_LIMITS = {
  messagesPerMinute: 20,  // Максимум 20 сообщений в минуту
  messagesPerHour: 200,   // Максимум 200 сообщений в час
  messagesPerDay: 1000    // Максимум 1000 сообщений в день
};
```

## 🚨 Обработка ошибок

### Типичные ошибки и решения

1. **Disconnected**
   - Автоматическое переподключение с exponential backoff
   - Уведомление администратора при множественных ошибках

2. **QR Code требуется**
   - Сохранение QR в БД
   - Отображение в UI для сканирования
   - Автоматическое обновление статуса после подключения

3. **Rate Limit**
   - Очередь сообщений с задержками
   - Приоритизация важных сообщений
   - Уведомление при достижении лимитов

4. **Блокировка аккаунта**
   - Мониторинг предупреждений от WhatsApp
   - Автоматическая остановка отправки при подозрении
   - Уведомление администратора

## 📈 Мониторинг

### Метрики для отслеживания
- Статус подключения (connected/disconnected)
- Количество отправленных/полученных сообщений
- Время ответа на сообщения
- Количество ошибок подключения
- Rate limit предупреждения

### Логирование
```typescript
logger.info('WhatsApp message sent', {
  organizationId,
  to,
  messageId,
  duration: Date.now() - startTime
});

logger.error('WhatsApp connection error', {
  organizationId,
  error: error.message,
  stack: error.stack
});
```

## 🎯 Best Practices

1. **Всегда используйте очередь** для отправки сообщений
2. **Обрабатывайте ошибки gracefully** - не падайте при ошибках WhatsApp
3. **Сохраняйте все сообщения** в БД для истории
4. **Мониторьте подключение** - автоматическое переподключение
5. **Соблюдайте rate limits** - не спамьте клиентам
6. **Тестируйте на тестовом аккаунте** перед production

## 🔄 Миграция на официальный API (будущее)

Когда появится доступ к официальному API:
1. Создать абстракцию `ChannelProvider` интерфейса
2. Реализовать `WhatsAppWebProvider` и `WhatsAppApiProvider`
3. Переключение через конфигурацию
4. Постепенная миграция клиентов

