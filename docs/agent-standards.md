# Стандарты разработки агентов

> **⚠️ ВАЖНО**: Этот документ описывает стандарты для **AI агентов системы** (qualification-agent, sales-agent и т.д.), которые будут создаваться позже.  
> Для **мета-агентов для Cursor** см. `docs/agents/meta-agents/README.md` и `docs/agents/how-to-create-agents.md`

## Общие принципы

### 1. Изоляция и переиспользование
- Каждый агент - независимый модуль
- Агенты взаимодействуют через четко определенные интерфейсы
- Общая логика выносится в shared модули

### 2. Контекст и память
- Агенты должны явно запрашивать необходимый контекст
- Долгосрочная память хранится в векторной БД
- Краткосрочная память - в Redis/сессии
- Контекст передается между агентами через структурированные сообщения

### 3. Логирование и трассировка
- Все действия агентов логируются
- Каждое взаимодействие имеет traceId для отслеживания цепочки
- Логи структурированы (JSON) для удобного анализа
- Критичные действия логируются с уровнем WARN/ERROR

### 4. Обработка ошибок
- Агенты должны gracefully обрабатывать ошибки
- При ошибке агент должен вернуть понятное сообщение пользователю
- Технические детали ошибок логируются, но не показываются пользователю
- Fallback механизмы для критичных операций

## Структура агента

### Обязательные компоненты

```typescript
interface AgentModule {
  // Метаданные
  metadata: {
    id: string;
    name: string;
    version: string;
    description: string;
  };
  
  // Конфигурация
  config: AgentConfig;
  
  // Основной обработчик
  handle: (input: AgentInput) => Promise<AgentOutput>;
  
  // Валидация входных данных
  validate: (input: AgentInput) => ValidationResult;
  
  // Обработка ошибок
  errorHandler: (error: Error, context: AgentContext) => AgentOutput;
  
  // Логирование
  logger: Logger;
}
```

### Системный промпт (System Prompt)

Каждый агент должен иметь четко определенный системный промпт:

```markdown
# Структура системного промпта

## Роль агента
[Четкое описание роли и цели агента]

## Контекст
[Информация о клиенте, организации, текущей ситуации]

## Доступные инструменты
[Список инструментов, которые агент может использовать]

## Правила поведения
- [Правило 1]
- [Правило 2]
- ...

## Формат ответа
[Ожидаемый формат ответа агента]

## Ограничения
- [Ограничение 1]
- [Ограничение 2]
```

## Взаимодействие между агентами

### Протокол сообщений

```typescript
// Запрос от одного агента к другому
interface AgentRequest {
  from: string;              // ID агента-отправителя
  to: string;                 // ID агента-получателя
  action: string;            // Действие, которое нужно выполнить
  payload: {
    // Данные запроса
  };
  context: AgentContext;     // Контекст разговора/клиента
  traceId: string;          // Для трассировки
  timestamp: string;
}

// Ответ агента
interface AgentResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  traceId: string;
  timestamp: string;
}
```

### Примеры взаимодействий

#### Агент квалификации → Агент прогрева
```typescript
// Агент квалификации определил, что лид готов к прогреву
await agentMessaging.send({
  from: 'qualification-agent',
  to: 'warming-agent',
  action: 'start_warming',
  payload: {
    clientId: 'client-123',
    preferences: { budget: 'high', dates: 'summer-2025' },
    qualificationScore: 0.85
  },
  context: { conversationId: 'conv-456', organizationId: 'org-789' },
  traceId: 'trace-abc'
});
```

#### Агент продажи → Агент сервиса
```typescript
// Продажа завершена, передаем клиента в сервис
await agentMessaging.send({
  from: 'sales-agent',
  to: 'service-agent',
  action: 'client_purchased',
  payload: {
    clientId: 'client-123',
    productId: 'tour-xyz',
    purchaseDate: '2025-01-27',
    specialRequests: ['vegetarian meals', 'airport pickup']
  },
  context: { conversationId: 'conv-456', organizationId: 'org-789' },
  traceId: 'trace-def'
});
```

## Управление памятью

### Типы памяти

1. **Рабочая память (Working Memory)**
   - Текущая сессия разговора
   - Хранится в Redis
   - TTL: 24 часа
   - Используется для контекста текущего диалога

2. **Эпизодическая память (Episodic Memory)**
   - История взаимодействий с клиентом
   - Хранится в PostgreSQL
   - Используется для анализа паттернов

3. **Семантическая память (Semantic Memory)**
   - Знания о продуктах, процессах, лучших практиках
   - Хранится в векторной БД (pgvector/Qdrant)
   - Используется для RAG (Retrieval Augmented Generation)

### Доступ к памяти

```typescript
// Получение контекста клиента
const clientContext = await memory.getClientContext(clientId, {
  includeHistory: true,      // История общения
  includePreferences: true,  // Предпочтения
  includeStatus: true        // Текущий статус
});

// Сохранение информации о клиенте
await memory.saveClientInfo(clientId, {
  preferences: { budget: 'high' },
  notes: 'Interested in mountain tours'
});

// Поиск похожих случаев
const similarCases = await memory.searchSimilar({
  query: 'client interested in mountain tours with high budget',
  limit: 5
});
```

## Тестирование агентов

### Типы тестов

1. **Unit тесты**
   - Тестирование логики агента изолированно
   - Моки для внешних зависимостей
   - Проверка валидации входных данных

2. **Integration тесты**
   - Тестирование взаимодействия агентов
   - Тестирование с реальной БД (test database)
   - Проверка цепочек вызовов

3. **E2E тесты**
   - Полные сценарии использования
   - Тестирование с реальным WhatsApp (test account)
   - Проверка пользовательских сценариев

### Пример теста

```typescript
describe('QualificationAgent', () => {
  it('should qualify lead and update status', async () => {
    const agent = new QualificationAgent(config);
    const result = await agent.handle({
      message: 'I want to visit Kyrgyzstan in summer, budget around $2000',
      clientId: 'test-client',
      conversationId: 'test-conv'
    });
    
    expect(result.success).toBe(true);
    expect(result.clientStatus).toBe('qualified');
    expect(result.qualificationScore).toBeGreaterThan(0.7);
  });
});
```

## Документация агента

Каждый агент должен иметь документацию:

```markdown
# [Название агента]

## Описание
[Что делает агент]

## Входные данные
- [Параметр 1]: [Описание]
- [Параметр 2]: [Описание]

## Выходные данные
- [Результат 1]: [Описание]
- [Результат 2]: [Описание]

## Используемые инструменты
- [Инструмент 1]: [Описание]
- [Инструмент 2]: [Описание]

## Примеры использования
[Примеры вызовов и ответов]

## Ограничения
[Известные ограничения и edge cases]

## Changelog
- v1.0.0: Initial version
```

## Чек-лист перед деплоем агента

- [ ] Агент протестирован (unit + integration тесты)
- [ ] Системный промпт проверен и оптимизирован
- [ ] Документация создана и актуальна
- [ ] Логирование настроено
- [ ] Обработка ошибок реализована
- [ ] Метрики производительности настроены
- [ ] Агент добавлен в систему мониторинга
- [ ] Конфигурация проверена для всех окружений
- [ ] Миграции БД (если нужны) протестированы

## Best Practices

1. **Не плодить документы**: Используйте существующие шаблоны и структуры
2. **Прибирать за собой**: Удаляйте временные файлы, очищайте тестовые данные
3. **Версионирование**: Все агенты должны иметь версии, изменения документируются
4. **Мониторинг**: Критичные метрики должны отслеживаться
5. **Graceful degradation**: При недоступности внешних сервисов агент должен работать в ограниченном режиме

