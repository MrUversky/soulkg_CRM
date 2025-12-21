# Схема базы данных: Soul KG CRM

> **Версия**: 1.0  
> **Дата создания**: 2025-12-20  
> **Последнее обновление**: 2025-12-20  
> **Статус**: MVP Database Schema

## 1. Обзор схемы

### 1.1 Принципы проектирования

- **Мультитенантность**: Все таблицы содержат `organization_id` (tenant_id)
- **Row Level Security (RLS)**: Политики безопасности на уровне строк
- **Нормализация**: 3NF для основных таблиц, денормализация для производительности где нужно
- **Индексы**: Оптимизация запросов по tenant_id и часто используемым полям
- **Версионирование**: История изменений для критичных сущностей

### 1.2 Технологии

- **СУБД**: PostgreSQL 15+
- **ORM**: Prisma
- **Расширения**: pgvector (для будущего RAG)
- **Миграции**: Prisma Migrate

## 2. Таблицы

### 2.1 Организации и пользователи

#### organizations
Организации (tenants) системы.

```prisma
model Organization {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique // URL-friendly идентификатор
  logo        String?  // URL к логотипу
  settings    Json?    // Настройки организации (JSON)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  users       User[]
  clients     Client[]
  products    Product[]
  partners    Partner[]
  conversations Conversation[]
  agentConfigurations AgentConfiguration[]
  promptVariants PromptVariant[]
  experiments Experiment[]
  
  @@map("organizations")
}
```

**RLS политика**: Пользователи видят только свою организацию (через JWT токен).

#### users
Пользователи организаций.

```prisma
model User {
  id             String   @id @default(uuid())
  organizationId String
  email          String
  passwordHash   String
  firstName      String?
  lastName       String?
  role           UserRole @default(MANAGER)
  isActive       Boolean  @default(true)
  lastLoginAt    DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  sentMessages   Message[]    @relation("SentByUser")
  statusChanges  ClientStatusHistory[]

  @@unique([organizationId, email])
  @@index([organizationId])
  @@index([email])
  @@map("users")
}

enum UserRole {
  SUPER_ADMIN  // Супер-админ платформы (post-MVP)
  ADMIN        // Админ организации
  MANAGER      // Менеджер продаж
}
```

**RLS политика**: Пользователи видят только пользователей своей организации.

### 2.2 Клиенты и общение

#### clients
Клиенты организаций.

```prisma
model Client {
  id                String         @id @default(uuid())
  organizationId    String
  phone             String         // Формат: +996555123456
  email             String?
  firstName         String?
  lastName          String?
  status            ClientStatus   @default(NEW_LEAD)
  preferredLanguage String?        // en, ru, ar, fr, de, es, pl
  culturalContext   Json?          // Культурный контекст (халяль, формальность и т.д.)
  metadata          Json?          // Дополнительные данные
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  // Relations
  organization      Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  conversations     Conversation[]
  statusHistory     ClientStatusHistory[]
  clientProducts    ClientProduct[]
  assignedPartner   Partner?       @relation(fields: [assignedPartnerId], references: [id])
  assignedPartnerId String?
  promptVariant     PromptVariant? @relation(fields: [promptVariantId], references: [id])
  promptVariantId   String?        // Назначенный вариант промпта для A/B тестирования

  @@unique([organizationId, phone])
  @@index([organizationId])
  @@index([organizationId, status])
  @@index([organizationId, phone])
  @@index([organizationId, createdAt])
  @@map("clients")
}

enum ClientStatus {
  NEW_LEAD        // Новый лид
  QUALIFIED       // Квалифицирован
  WARMED          // Прогрет
  PROPOSAL_SENT   // Отправлено предложение
  NEGOTIATION     // Переговоры
  SOLD            // Продано
  SERVICE         // Сервисное сопровождение
  CLOSED          // Закрыт
}
```

**RLS политика**: Пользователи видят только клиентов своей организации.

#### conversations
Разговоры с клиентами.

```prisma
model Conversation {
  id             String            @id @default(uuid())
  organizationId String
  clientId       String
  channel        CommunicationChannel @default(WHATSAPP)
  status         ConversationStatus   @default(ACTIVE)
  managedBy      ConversationManager   @default(AI) // AI или HUMAN
  lastMessageAt  DateTime?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  // Relations
  organization   Organization      @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  client         Client           @relation(fields: [clientId], references: [id], onDelete: Cascade)
  messages       Message[]

  @@index([organizationId, clientId])
  @@index([organizationId, status])
  @@index([organizationId, lastMessageAt])
  @@map("conversations")
}

enum CommunicationChannel {
  WHATSAPP
  TELEGRAM  // Будущее
  EMAIL     // Будущее
}

enum ConversationStatus {
  ACTIVE
  ARCHIVED
}

enum ConversationManager {
  AI      // Управляется AI-агентом
  HUMAN   // Управляется менеджером
}
```

**RLS политика**: Пользователи видят только разговоры своей организации.

#### messages
Сообщения в разговорах.

```prisma
model Message {
  id                String        @id @default(uuid())
  conversationId    String
  organizationId    String
  direction         MessageDirection
  sender            MessageSender
  senderId          String?       // ID пользователя (если HUMAN) или null (если AI)
  content           String
  language          String?       // Определенный язык сообщения
  translatedContent String?       // Переведенный контент (для менеджера)
  whatsappMessageId String?      // ID сообщения в WhatsApp
  status            MessageStatus @default(SENT)
  error             String?       // Ошибка при отправке
  createdAt         DateTime      @default(now())

  // Relations
  conversation      Conversation  @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  organization      Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  sentByUser        User?         @relation("SentByUser", fields: [senderId], references: [id])

  @@index([organizationId, conversationId])
  @@index([organizationId, createdAt])
  @@index([conversationId, createdAt])
  @@index([whatsappMessageId])
  @@map("messages")
}

enum MessageDirection {
  INCOMING  // От клиента
  OUTGOING  // К клиенту
}

enum MessageSender {
  CLIENT  // Клиент
  AI      // AI-агент
  HUMAN   // Менеджер
}

enum MessageStatus {
  PENDING   // В очереди
  SENT      // Отправлено
  DELIVERED // Доставлено (если доступно)
  FAILED    // Ошибка отправки
}
```

**RLS политика**: Пользователи видят только сообщения своей организации.

#### client_status_history
История изменений статусов клиентов.

```prisma
model ClientStatusHistory {
  id          String       @id @default(uuid())
  clientId    String
  organizationId String
  oldStatus   ClientStatus?
  newStatus   ClientStatus
  changedBy   StatusChangedBy
  changedById String?      // ID пользователя или AI агента
  reason      String?      // Причина изменения
  createdAt   DateTime     @default(now())

  // Relations
  client      Client       @relation(fields: [clientId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user        User?        @relation(fields: [changedById], references: [id])

  @@index([organizationId, clientId])
  @@index([organizationId, createdAt])
  @@map("client_status_history")
}

enum StatusChangedBy {
  AI      // Изменено AI-агентом
  HUMAN   // Изменено менеджером
  SYSTEM  // Изменено системой
}
```

**RLS политика**: Пользователи видят только историю своей организации.

### 2.3 Продукты и партнеры

#### products
Продукты/туры организаций.

```prisma
model Product {
  id             String   @id @default(uuid())
  organizationId String
  name           String
  description    String?  // Описание тура
  duration       Int?     // Длительность в днях
  type           ProductType
  basePrice      Decimal  // Базовая цена
  currency       String   @default("USD")
  inclusions     Json?    // Что включено (JSON массив)
  exclusions     Json?    // Что не включено (JSON массив)
  options        Json?    // Опции (баня, снегоходы и т.д.)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  partner        Partner?     @relation(fields: [partnerId], references: [id])
  partnerId      String?
  clientProducts ClientProduct[]
  tours          Tour[]       // Конкретные туры с датами

  @@index([organizationId])
  @@index([organizationId, isActive])
  @@map("products")
}

enum ProductType {
  TOUR
  SERVICE
  PACKAGE
}
```

**RLS политика**: Пользователи видят только продукты своей организации.

#### partners
Партнеры организаций.

```prisma
model Partner {
  id             String   @id @default(uuid())
  organizationId String
  name           String
  contactPhone   String?
  contactEmail   String?
  contactWhatsApp String?
  contactTelegram String?
  conditions     String? // Условия сотрудничества
  rating         Decimal? // Рейтинг партнера
  isAvailable    Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  products       Product[]
  clients        Client[]

  @@index([organizationId])
  @@index([organizationId, isAvailable])
  @@map("partners")
}
```

**RLS политика**: Пользователи видят только партнеров своей организации.

#### client_products
Связь клиентов с продуктами (какие туры интересны клиенту).

```prisma
model ClientProduct {
  id          String   @id @default(uuid())
  clientId    String
  productId   String
  status      ClientProductStatus @default(INTERESTED)
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  client      Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([clientId, productId])
  @@index([clientId])
  @@index([productId])
  @@map("client_products")
}

enum ClientProductStatus {
  INTERESTED    // Интересуется
  PROPOSED      // Предложено
  SELECTED      // Выбрано
  BOOKED        // Забронировано
}
```

**RLS политика**: Пользователи видят только связи клиентов с продуктами своей организации.

#### tours
Конкретные туры с датами (экземпляры продуктов).

```prisma
model Tour {
  id             String   @id @default(uuid())
  organizationId String
  productId      String   // Ссылка на шаблон продукта
  startDate      DateTime // Дата начала тура
  endDate        DateTime // Дата окончания тура
  maxParticipants Int?    // Максимальное количество участников
  currentParticipants Int @default(0) // Текущее количество участников
  price          Decimal? // Цена для этого конкретного тура (может отличаться от базовой)
  currency       String   @default("USD")
  status         TourStatus @default(AVAILABLE)
  notes          String?  // Дополнительные заметки
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  product        Product      @relation(fields: [productId], references: [id], onDelete: Cascade)
  clientTours    ClientTour[]

  @@index([organizationId, productId])
  @@index([organizationId, startDate])
  @@index([organizationId, status])
  @@index([startDate, endDate])
  @@map("tours")
}

enum TourStatus {
  AVAILABLE     // Доступен для бронирования
  FULL          // Заполнен
  CANCELLED     // Отменен
  COMPLETED     // Завершен
}
```

**RLS политика**: Пользователи видят только туры своей организации.

**Примечание**: 
- `Product` - это шаблон тура (например, "Weekend Getaway 3-4 дня")
- `Tour` - это конкретный тур с датами (например, "Weekend Getaway с 15 по 18 января 2025")
- Один продукт может иметь множество туров с разными датами

#### client_tours
Связь клиентов с конкретными турами (бронирования).

```prisma
model ClientTour {
  id          String   @id @default(uuid())
  clientId    String
  tourId      String
  status      ClientTourStatus @default(INTERESTED)
  participants Int?    // Количество участников от клиента
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  client      Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  tour        Tour     @relation(fields: [tourId], references: [id], onDelete: Cascade)

  @@unique([clientId, tourId])
  @@index([clientId])
  @@index([tourId])
  @@map("client_tours")
}

enum ClientTourStatus {
  INTERESTED    // Интересуется этим туром
  PROPOSED      // Предложен клиенту
  SELECTED      // Клиент выбрал этот тур
  BOOKED        // Забронирован
  CONFIRMED     // Подтвержден
  CANCELLED     // Отменен
}
```

**RLS политика**: Пользователи видят только бронирования своей организации.

### 2.4 AI-агенты и конфигурации

#### agent_configurations
Конфигурации AI-агентов для организаций.

```prisma
model AgentConfiguration {
  id             String   @id @default(uuid())
  organizationId String
  agentType      AgentType
  name           String   // Название конфигурации
  prompt         String   // Промпт агента
  settings       Json?    // Настройки агента (JSON)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([organizationId, agentType, name])
  @@index([organizationId, agentType])
  @@index([organizationId, isActive])
  @@map("agent_configurations")
}

enum AgentType {
  COMMUNICATION    // Агент общения
  QUALIFICATION    // Агент квалификации
  PRODUCT_SELECTION // Агент подбора тура
  WARMING          // Агент прогрева (post-MVP)
  SALES            // Агент продажи (post-MVP)
  SERVICE          // Агент сервисного сопровождения (post-MVP)
  FEEDBACK         // Агент обратной связи (post-MVP)
}
```

**RLS политика**: Пользователи видят только конфигурации своей организации.

#### prompt_variants
Варианты промптов для A/B тестирования.

```prisma
model PromptVariant {
  id             String   @id @default(uuid())
  organizationId String
  agentType      AgentType
  name           String   // Название варианта
  description    String?  // Описание варианта
  prompt         String   // Промпт варианта
  isActive       Boolean  @default(true)
  isDefault      Boolean  @default(false) // Вариант по умолчанию
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  clients        Client[]
  experiments    Experiment[]

  @@index([organizationId, agentType])
  @@index([organizationId, isActive])
  @@map("prompt_variants")
}
```

**RLS политика**: Пользователи видят только варианты своей организации.

#### experiments
Эксперименты A/B тестирования.

```prisma
model Experiment {
  id             String   @id @default(uuid())
  organizationId String
  agentType      AgentType
  name           String   // Название эксперимента
  description    String?  // Описание эксперимента
  status         ExperimentStatus @default(ACTIVE)
  startDate      DateTime @default(now())
  endDate        DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  variants       PromptVariant[] // Варианты в эксперименте

  @@index([organizationId, status])
  @@index([organizationId, agentType])
  @@map("experiments")
}

enum ExperimentStatus {
  ACTIVE      // Активен
  PAUSED      // Приостановлен
  COMPLETED   // Завершен
  CANCELLED   // Отменен
}
```

**RLS политика**: Пользователи видят только эксперименты своей организации.

### 2.5 Анализ и метрики

#### dialogue_analysis
Результаты анализа диалогов (post-MVP, но структура заложена).

```prisma
model DialogueAnalysis {
  id             String   @id @default(uuid())
  organizationId String
  analysisType   AnalysisType
  promptVariantId String? // Анализируемый вариант промпта
  data           Json     // Результаты анализа (JSON)
  recommendations Json?   // Рекомендации (JSON)
  createdAt      DateTime @default(now())

  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  variant        PromptVariant? @relation(fields: [promptVariantId], references: [id])

  @@index([organizationId, createdAt])
  @@index([organizationId, analysisType])
  @@map("dialogue_analysis")
}

enum AnalysisType {
  SUCCESS_PATTERNS    // Анализ успешных паттернов
  PROBLEM_AREAS       // Выявление проблемных мест
  CONVERSION_METRICS  // Метрики конверсии
  RECOMMENDATIONS     // Рекомендации по улучшению
}
```

**RLS политика**: Пользователи видят только анализ своей организации.

### 2.6 WhatsApp интеграция

#### whatsapp_sessions
Сессии WhatsApp для организаций.

```prisma
model WhatsAppSession {
  id             String   @id @default(uuid())
  organizationId String   @unique // Одна сессия на организацию
  status         WhatsAppSessionStatus @default(DISCONNECTED)
  qrCode         String?  // QR-код для авторизации (временный)
  lastConnectedAt DateTime?
  lastDisconnectedAt DateTime?
  errorMessage   String?  // Сообщение об ошибке
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@map("whatsapp_sessions")
}

enum WhatsAppSessionStatus {
  CONNECTING     // Подключение
  CONNECTED      // Подключено
  DISCONNECTED   // Отключено
  ERROR          // Ошибка
}
```

**RLS политика**: Пользователи видят только сессию своей организации.

## 3. Индексы

### 3.1 Основные индексы

Все таблицы имеют индексы на `organizationId` для быстрой фильтрации по организации.

### 3.2 Составные индексы

- `clients`: `[organizationId, status]`, `[organizationId, createdAt]`
- `conversations`: `[organizationId, status]`, `[organizationId, lastMessageAt]`
- `messages`: `[organizationId, conversationId]`, `[conversationId, createdAt]`
- `client_status_history`: `[organizationId, clientId]`, `[organizationId, createdAt]`
- `tours`: `[organizationId, productId]`, `[organizationId, startDate]`, `[organizationId, status]`, `[startDate, endDate]`
- `client_tours`: `[clientId]`, `[tourId]`

### 3.3 Уникальные индексы

- `users`: `[organizationId, email]`
- `clients`: `[organizationId, phone]`
- `client_products`: `[clientId, productId]`
- `whatsapp_sessions`: `[organizationId]` (unique)

## 4. Row Level Security (RLS)

### 4.1 Принцип RLS

Все таблицы имеют RLS политики, которые автоматически фильтруют данные по `organizationId` из JWT токена пользователя.

### 4.2 Пример RLS политики

```sql
-- Пример для таблицы clients
CREATE POLICY clients_organization_isolation ON clients
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- Установка organization_id из JWT токена
CREATE FUNCTION set_organization_id()
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_organization_id', 
    (current_setting('request.jwt.claims', true)::json->>'organization_id'), 
    true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.3 Применение RLS

RLS применяется автоматически через Prisma при выполнении запросов. Middleware в API устанавливает `organization_id` из JWT токена перед выполнением запросов.

## 5. Миграции

### 5.1 Структура миграций

Миграции создаются через Prisma Migrate:

```bash
npx prisma migrate dev --name init
```

### 5.2 Версионирование схемы

- Версия схемы хранится в `_prisma_migrations`
- Каждая миграция имеет уникальное имя и timestamp
- Миграции применяются автоматически при деплое

## 6. Ограничения и валидации

### 6.1 Уровень БД

- Foreign keys для целостности данных
- Unique constraints для предотвращения дубликатов
- Check constraints для валидации значений (если нужно)

### 6.2 Уровень приложения

- Валидация через Prisma схемы
- Валидация через Zod схемы в API
- Валидация tenant_id на всех уровнях

## 7. Производительность

### 7.1 Оптимизация запросов

- Индексы на часто используемых полях
- Составные индексы для сложных запросов
- Партиционирование больших таблиц (post-MVP)

### 7.2 Кэширование

- Кэширование конфигураций агентов (Redis опционально)
- Кэширование промптов для быстрого доступа
- Кэширование метрик аналитики

## 8. Seed данные для разработки

### 8.1 Структура seed данных

Для разработки и тестирования нужны следующие seed данные:

**Организация**:
- 1 тестовая организация (Soul KG)

**Пользователи**:
- 1 админ организации
- 1-2 менеджера продаж

**Клиенты**:
- 10-20 тестовых клиентов с разными статусами
- Разные языки (en, ru, ar, fr, de, es, pl)
- Разные культурные контексты

**Продукты**:
- 5-10 шаблонов продуктов (Weekend Getaway, Exploration & Connection, Private Escape)
- Разные типы, цены, длительности

**Туры**:
- 10-15 конкретных туров с датами (экземпляры продуктов)
- Разные даты (прошедшие, текущие, будущие)
- Разные статусы (available, full, completed)

**Партнеры**:
- 2-3 тестовых партнера
- С контактами (WhatsApp, Telegram, Email)

**Сообщения**:
- История общения для тестовых клиентов
- Примеры диалогов на разных языках

### 8.2 Использование seed данных

Seed данные используются для:
- Локальной разработки
- Тестирования функциональности
- Демонстрации системы
- E2E тестов

**Примечание**: Seed данные будут созданы на основе реальных данных из WhatsApp переписки Soul KG (после предоставления пользователем).

## 9. Будущие улучшения

### 9.1 Векторное хранилище

- Использование pgvector для RAG
- Векторные индексы для семантического поиска диалогов
- Хранение embeddings промптов и сообщений

### 9.2 Расширенная аналитика

- Отдельные таблицы для метрик
- Материализованные представления для отчетов
- Партиционирование по датам для больших таблиц

---

**Следующие шаги**:
1. Создание Prisma схемы на основе этой документации
2. Генерация миграций
3. Настройка RLS политик
4. Создание seed данных для разработки
5. Определение API контрактов (api-contracts.md)

