# @soul-kg-crm/agents

Пакет для работы с AI агентами системы Soul KG CRM.

## Описание

Этот пакет предоставляет инфраструктуру для работы с AI агентами:
- **LLM Providers** - интеграция с различными LLM провайдерами (OpenRouter, OpenAI, Anthropic)
- **Prompt Manager** - загрузка и управление промптами из базы данных
- **Status Detector** - LLM-based детекция статусов клиентов
- **Cache** - кеширование результатов LLM запросов

## Установка

```bash
npm install @soul-kg-crm/agents
```

## Основные компоненты

### LLM Providers

Интеграция с LLM провайдерами через единый интерфейс:

```typescript
import { OpenRouterProvider } from '@soul-kg-crm/agents';

const provider = new OpenRouterProvider({
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultModel: 'openrouter/gpt-4o-mini'
});

const response = await provider.complete({
  prompt: 'Определи статус клиента...',
  organizationId: 'org-123'
});
```

### Prompt Manager

Загрузка промптов из базы данных с кешированием:

```typescript
import { PromptLoader } from '@soul-kg-crm/agents';

const loader = new PromptLoader(prisma);

const prompt = await loader.loadPrompt({
  organizationId: 'org-123',
  agentType: 'STATUS_DETECTION',
  name: 'default'
});
```

### Status Detector

LLM-based детекция статусов клиентов:

```typescript
import { LLMStatusDetector } from '@soul-kg-crm/agents';

const detector = new LLMStatusDetector({
  llmProvider: provider,
  promptLoader: loader
});

const status = await detector.detectStatus({
  organizationId: 'org-123',
  messages: conversationMessages
});
```

## Структура

```
packages/agents/
├── src/
│   ├── providers/          # LLM провайдеры
│   ├── prompt-manager/      # Управление промптами
│   ├── detectors/           # Детекторы (Status Detector)
│   ├── cache/               # Кеширование
│   └── types/               # TypeScript типы
└── __tests__/               # Тесты
```

## Требования

- Node.js 18+
- PostgreSQL (для хранения промптов)
- OpenRouter API ключ (или другой LLM провайдер)

## Разработка

```bash
# Установка зависимостей
npm install

# Компиляция
npm run build

# Тесты
npm test

# Тесты с покрытием
npm run test:coverage
```

## Лицензия

Private - Soul KG CRM

