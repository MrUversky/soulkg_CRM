# API Контракты: Soul KG CRM

> **Версия**: 1.0  
> **Дата создания**: 2025-12-20  
> **Последнее обновление**: 2025-12-20  
> **Статус**: MVP API Contracts

## 1. Обзор API

### 1.1 Базовый URL

```
Development: http://localhost:3000/api
Production: https://api.soulkg-crm.com/api
```

### 1.2 Формат данных

- **Content-Type**: `application/json`
- **Кодировка**: UTF-8
- **Формат дат**: ISO 8601 (например, `2025-12-20T10:30:00Z`)

### 1.3 Версионирование

API версионируется через префикс пути: `/api/v1/...`

**MVP**: Используется версия v1 без явного указания в пути.

## 2. Аутентификация и авторизация

### 2.1 Аутентификация

Все запросы (кроме `/api/auth/*`) требуют JWT токен в заголовке:

```
Authorization: Bearer <jwt_token>
```

### 2.2 JWT токен

**Структура токена**:
```json
{
  "userId": "uuid",
  "organizationId": "uuid",
  "role": "ADMIN" | "MANAGER",
  "iat": 1234567890,
  "exp": 1234654290
}
```

**Refresh токен**: Используется для обновления access токена.

### 2.3 Авторизация

Роли и права доступа:
- **SUPER_ADMIN**: Полный доступ ко всем организациям (post-MVP)
- **ADMIN**: Полный доступ к своей организации
- **MANAGER**: Доступ к клиентам и общению, ограниченный доступ к настройкам

### 2.4 Изоляция данных

Все запросы автоматически фильтруются по `organizationId` из JWT токена. Пользователь не может получить доступ к данным других организаций.

## 3. Endpoints

### 3.1 Аутентификация

#### POST /api/auth/register
Регистрация нового пользователя организации.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "organizationId": "uuid" // Опционально, если создается новая организация
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "MANAGER",
    "organizationId": "uuid"
  },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### POST /api/auth/login
Вход пользователя.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "MANAGER",
    "organizationId": "uuid"
  },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### POST /api/auth/refresh
Обновление access токена.

**Request**:
```json
{
  "refreshToken": "refresh_token"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "new_jwt_token"
}
```

#### POST /api/auth/logout
Выход пользователя (инвалидация refresh токена).

**Request**: Пустое тело

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

### 3.2 Клиенты

#### GET /api/clients
Получить список клиентов с фильтрацией и пагинацией.

**Query Parameters**:
- `page`: номер страницы (default: 1)
- `limit`: количество на странице (default: 20, max: 100)
- `status`: фильтр по статусу (optional)
- `search`: поиск по имени/телефону (optional)
- `sortBy`: поле сортировки (default: createdAt)
- `sortOrder`: порядок сортировки (asc/desc, default: desc)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "phone": "+996555123456",
      "email": "client@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "status": "QUALIFIED",
      "preferredLanguage": "en",
      "lastMessageAt": "2025-12-20T10:30:00Z",
      "createdAt": "2025-12-19T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### GET /api/clients/:id
Получить детальную информацию о клиенте.

**Response** (200 OK):
```json
{
  "id": "uuid",
  "phone": "+996555123456",
  "email": "client@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "status": "QUALIFIED",
  "preferredLanguage": "en",
  "culturalContext": {
    "halal": true,
    "formality": "casual"
  },
  "metadata": {},
  "assignedPartner": {
    "id": "uuid",
    "name": "Tunduk Travel"
  },
  "promptVariant": {
    "id": "uuid",
    "name": "Friendly Approach"
  },
  "createdAt": "2025-12-19T08:00:00Z",
  "updatedAt": "2025-12-20T10:30:00Z"
}
```

#### POST /api/clients
Создать нового клиента.

**Request**:
```json
{
  "phone": "+996555123456",
  "email": "client@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "preferredLanguage": "en"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "phone": "+996555123456",
  "email": "client@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "status": "NEW_LEAD",
  "preferredLanguage": "en",
  "createdAt": "2025-12-20T10:30:00Z"
}
```

#### PATCH /api/clients/:id
Обновить данные клиента.

**Request**:
```json
{
  "firstName": "Jane Updated",
  "status": "QUALIFIED",
  "preferredLanguage": "ru"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "phone": "+996555123456",
  "firstName": "Jane Updated",
  "status": "QUALIFIED",
  "preferredLanguage": "ru",
  "updatedAt": "2025-12-20T10:35:00Z"
}
```

#### POST /api/clients/:id/status
Изменить статус клиента.

**Request**:
```json
{
  "status": "QUALIFIED",
  "reason": "Клиент ответил на все вопросы квалификации"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "status": "QUALIFIED",
  "statusHistory": {
    "id": "uuid",
    "oldStatus": "NEW_LEAD",
    "newStatus": "QUALIFIED",
    "changedBy": "HUMAN",
    "changedById": "user_uuid",
    "reason": "Клиент ответил на все вопросы квалификации",
    "createdAt": "2025-12-20T10:40:00Z"
  }
}
```

### 3.3 Разговоры и сообщения

#### GET /api/conversations
Получить список разговоров.

**Query Parameters**:
- `clientId`: фильтр по клиенту (optional)
- `status`: фильтр по статусу (ACTIVE/ARCHIVED, optional)
- `managedBy`: фильтр по менеджеру (AI/HUMAN, optional)
- `page`: номер страницы (default: 1)
- `limit`: количество на странице (default: 20)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "clientId": "uuid",
      "client": {
        "firstName": "Jane",
        "phone": "+996555123456"
      },
      "channel": "WHATSAPP",
      "status": "ACTIVE",
      "managedBy": "AI",
      "lastMessageAt": "2025-12-20T10:30:00Z",
      "createdAt": "2025-12-19T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

#### GET /api/conversations/:id
Получить детальную информацию о разговоре.

**Response** (200 OK):
```json
{
  "id": "uuid",
  "clientId": "uuid",
  "client": {
    "id": "uuid",
    "firstName": "Jane",
    "phone": "+996555123456",
    "preferredLanguage": "en"
  },
  "channel": "WHATSAPP",
  "status": "ACTIVE",
  "managedBy": "AI",
  "lastMessageAt": "2025-12-20T10:30:00Z",
  "createdAt": "2025-12-19T08:00:00Z"
}
```

#### GET /api/conversations/:id/messages
Получить сообщения разговора.

**Query Parameters**:
- `page`: номер страницы (default: 1)
- `limit`: количество на странице (default: 50)
- `before`: получить сообщения до указанной даты (optional)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "direction": "INCOMING",
      "sender": "CLIENT",
      "content": "Hello, I'm interested in a tour",
      "language": "en",
      "translatedContent": "Привет, меня интересует тур",
      "status": "SENT",
      "createdAt": "2025-12-20T10:30:00Z"
    },
    {
      "id": "uuid",
      "direction": "OUTGOING",
      "sender": "AI",
      "content": "Hello! I'd be happy to help you find the perfect tour.",
      "language": "en",
      "status": "SENT",
      "createdAt": "2025-12-20T10:30:05Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25
  }
}
```

#### POST /api/conversations/:id/messages
Отправить сообщение клиенту (от менеджера).

**Request**:
```json
{
  "content": "Привет! Я менеджер, могу помочь с выбором тура.",
  "language": "ru" // Язык ответа менеджера (будет переведен на язык клиента)
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "direction": "OUTGOING",
  "sender": "HUMAN",
  "senderId": "user_uuid",
  "content": "Привет! Я менеджер, могу помочь с выбором тура.",
  "translatedContent": "Hello! I'm a manager, I can help you choose a tour.",
  "language": "en", // Язык клиента
  "status": "PENDING",
  "createdAt": "2025-12-20T10:35:00Z"
}
```

#### POST /api/conversations/:id/take
Взять диалог у AI (переключение на менеджера).

**Request**: Пустое тело

**Response** (200 OK):
```json
{
  "id": "uuid",
  "managedBy": "HUMAN",
  "updatedAt": "2025-12-20T10:40:00Z"
}
```

#### POST /api/conversations/:id/release
Вернуть диалог AI (переключение обратно на AI).

**Request**: Пустое тело

**Response** (200 OK):
```json
{
  "id": "uuid",
  "managedBy": "AI",
  "updatedAt": "2025-12-20T10:45:00Z"
}
```

### 3.4 Продукты

#### GET /api/products
Получить список продуктов.

**Query Parameters**:
- `isActive`: фильтр по активности (true/false, optional)
- `partnerId`: фильтр по партнеру (optional)
- `page`: номер страницы (default: 1)
- `limit`: количество на странице (default: 20)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Winter Tour 4 Days",
      "description": "Amazing winter tour...",
      "duration": 4,
      "type": "TOUR",
      "basePrice": "500.00",
      "currency": "USD",
      "isActive": true,
      "partner": {
        "id": "uuid",
        "name": "Tunduk Travel"
      },
      "createdAt": "2025-12-19T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

#### GET /api/products/:id
Получить детальную информацию о продукте.

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Winter Tour 4 Days",
  "description": "Amazing winter tour...",
  "duration": 4,
  "type": "TOUR",
  "basePrice": "500.00",
  "currency": "USD",
  "inclusions": ["Accommodation", "Meals", "Transport"],
  "exclusions": ["Flights", "Insurance"],
  "options": [
    {
      "name": "Banya",
      "price": "50.00",
      "description": "Traditional sauna"
    }
  ],
  "isActive": true,
  "partner": {
    "id": "uuid",
    "name": "Tunduk Travel"
  },
  "createdAt": "2025-12-19T08:00:00Z",
  "updatedAt": "2025-12-19T08:00:00Z"
}
```

#### POST /api/products
Создать новый продукт.

**Request**:
```json
{
  "name": "Winter Tour 4 Days",
  "description": "Amazing winter tour...",
  "duration": 4,
  "type": "TOUR",
  "basePrice": "500.00",
  "currency": "USD",
  "inclusions": ["Accommodation", "Meals"],
  "exclusions": ["Flights"],
  "partnerId": "uuid"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "Winter Tour 4 Days",
  "description": "Amazing winter tour...",
  "duration": 4,
  "type": "TOUR",
  "basePrice": "500.00",
  "currency": "USD",
  "isActive": true,
  "createdAt": "2025-12-20T10:50:00Z"
}
```

#### PATCH /api/products/:id
Обновить продукт.

**Request**:
```json
{
  "name": "Winter Tour 4 Days Updated",
  "basePrice": "550.00"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Winter Tour 4 Days Updated",
  "basePrice": "550.00",
  "updatedAt": "2025-12-20T10:55:00Z"
}
```

#### DELETE /api/products/:id
Удалить продукт (soft delete).

**Response** (200 OK):
```json
{
  "message": "Product deleted successfully"
}
```

#### GET /api/products/:id/tours
Получить список туров для продукта.

**Query Parameters**:
- `startDate`: фильтр по начальной дате (ISO 8601, optional)
- `endDate`: фильтр по конечной дате (ISO 8601, optional)
- `status`: фильтр по статусу (AVAILABLE/FULL/CANCELLED, optional)
- `page`: номер страницы (default: 1)
- `limit`: количество на странице (default: 20)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "productId": "uuid",
      "product": {
        "name": "Weekend Getaway",
        "type": "TOUR"
      },
      "startDate": "2025-01-15T00:00:00Z",
      "endDate": "2025-01-18T00:00:00Z",
      "maxParticipants": 8,
      "currentParticipants": 3,
      "price": "500.00",
      "currency": "USD",
      "status": "AVAILABLE",
      "createdAt": "2025-12-20T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

#### POST /api/products/:id/tours
Создать новый тур (экземпляр продукта).

**Request**:
```json
{
  "startDate": "2025-02-15T00:00:00Z",
  "endDate": "2025-02-18T00:00:00Z",
  "maxParticipants": 8,
  "price": "550.00",
  "currency": "USD"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "productId": "uuid",
  "startDate": "2025-02-15T00:00:00Z",
  "endDate": "2025-02-18T00:00:00Z",
  "maxParticipants": 8,
  "currentParticipants": 0,
  "price": "550.00",
  "currency": "USD",
  "status": "AVAILABLE",
  "createdAt": "2025-12-20T11:00:00Z"
}
```

#### GET /api/tours/:id
Получить детальную информацию о туре.

**Response** (200 OK):
```json
{
  "id": "uuid",
  "productId": "uuid",
  "product": {
    "id": "uuid",
    "name": "Weekend Getaway",
    "description": "Amazing weekend tour...",
    "type": "TOUR",
    "duration": 4
  },
  "startDate": "2025-01-15T00:00:00Z",
  "endDate": "2025-01-18T00:00:00Z",
  "maxParticipants": 8,
  "currentParticipants": 3,
  "price": "500.00",
  "currency": "USD",
  "status": "AVAILABLE",
  "notes": "Special winter edition",
  "clients": [
    {
      "id": "uuid",
      "firstName": "Jane",
      "status": "BOOKED",
      "participants": 2
    }
  ],
  "createdAt": "2025-12-20T10:00:00Z",
  "updatedAt": "2025-12-20T10:00:00Z"
}
```

#### POST /api/clients/:id/tours/:tourId/book
Забронировать тур для клиента.

**Request**:
```json
{
  "participants": 2,
  "notes": "Special dietary requirements"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "clientId": "uuid",
  "tourId": "uuid",
  "status": "BOOKED",
  "participants": 2,
  "notes": "Special dietary requirements",
  "createdAt": "2025-12-20T11:05:00Z"
}
```

### 3.5 Партнеры

#### GET /api/partners
Получить список партнеров.

**Query Parameters**:
- `isAvailable`: фильтр по доступности (true/false, optional)
- `page`: номер страницы (default: 1)
- `limit`: количество на странице (default: 20)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Tunduk Travel",
      "contactPhone": "+996555123456",
      "contactEmail": "info@tunduk.com",
      "contactWhatsApp": "+996555123456",
      "rating": "4.5",
      "isAvailable": true,
      "createdAt": "2025-12-19T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

#### GET /api/partners/:id
Получить детальную информацию о партнере.

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Tunduk Travel",
  "contactPhone": "+996555123456",
  "contactEmail": "info@tunduk.com",
  "contactWhatsApp": "+996555123456",
  "contactTelegram": "@tunduk_travel",
  "conditions": "Standard partnership conditions",
  "rating": "4.5",
  "isAvailable": true,
  "products": [
    {
      "id": "uuid",
      "name": "Winter Tour 4 Days"
    }
  ],
  "createdAt": "2025-12-19T08:00:00Z",
  "updatedAt": "2025-12-19T08:00:00Z"
}
```

#### POST /api/partners
Создать нового партнера.

**Request**:
```json
{
  "name": "Tunduk Travel",
  "contactPhone": "+996555123456",
  "contactEmail": "info@tunduk.com",
  "contactWhatsApp": "+996555123456",
  "conditions": "Standard partnership conditions"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "Tunduk Travel",
  "contactPhone": "+996555123456",
  "contactEmail": "info@tunduk.com",
  "contactWhatsApp": "+996555123456",
  "isAvailable": true,
  "createdAt": "2025-12-20T11:00:00Z"
}
```

#### POST /api/clients/:id/assign-partner
Назначить партнера клиенту (передача клиента партнеру).

**Request**:
```json
{
  "partnerId": "uuid",
  "message": "Клиент выбрал тур, передаем партнеру для исполнения"
}
```

**Response** (200 OK):
```json
{
  "client": {
    "id": "uuid",
    "assignedPartnerId": "uuid",
    "status": "SERVICE"
  },
  "partner": {
    "id": "uuid",
    "name": "Tunduk Travel"
  },
  "message": "Client assigned to partner successfully"
}
```

### 3.6 AI-агенты и конфигурации

#### GET /api/agents/configurations
Получить конфигурации AI-агентов.

**Query Parameters**:
- `agentType`: фильтр по типу агента (optional)
- `isActive`: фильтр по активности (true/false, optional)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "agentType": "QUALIFICATION",
      "name": "Default Qualification Agent",
      "prompt": "You are a qualification agent...",
      "isActive": true,
      "createdAt": "2025-12-19T08:00:00Z"
    }
  ]
}
```

#### GET /api/agents/configurations/:id
Получить детальную конфигурацию агента.

**Response** (200 OK):
```json
{
  "id": "uuid",
  "agentType": "QUALIFICATION",
  "name": "Default Qualification Agent",
  "prompt": "You are a qualification agent...",
  "settings": {
    "temperature": 0.7,
    "maxTokens": 500
  },
  "isActive": true,
  "createdAt": "2025-12-19T08:00:00Z",
  "updatedAt": "2025-12-19T08:00:00Z"
}
```

#### POST /api/agents/configurations
Создать новую конфигурацию агента.

**Request**:
```json
{
  "agentType": "QUALIFICATION",
  "name": "Friendly Qualification Agent",
  "prompt": "You are a friendly qualification agent...",
  "settings": {
    "temperature": 0.8,
    "maxTokens": 500
  }
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "agentType": "QUALIFICATION",
  "name": "Friendly Qualification Agent",
  "prompt": "You are a friendly qualification agent...",
  "isActive": true,
  "createdAt": "2025-12-20T11:10:00Z"
}
```

#### PATCH /api/agents/configurations/:id
Обновить конфигурацию агента.

**Request**:
```json
{
  "prompt": "Updated prompt...",
  "settings": {
    "temperature": 0.9
  }
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "prompt": "Updated prompt...",
  "settings": {
    "temperature": 0.9,
    "maxTokens": 500
  },
  "updatedAt": "2025-12-20T11:15:00Z"
}
```

### 3.7 Экспериментирование (A/B тестирование)

#### GET /api/experiments
Получить список экспериментов.

**Query Parameters**:
- `status`: фильтр по статусу (ACTIVE/PAUSED/COMPLETED, optional)
- `agentType`: фильтр по типу агента (optional)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "agentType": "QUALIFICATION",
      "name": "Qualification Tone Test",
      "status": "ACTIVE",
      "startDate": "2025-12-19T08:00:00Z",
      "variants": [
        {
          "id": "uuid",
          "name": "Formal Approach",
          "isDefault": false
        },
        {
          "id": "uuid",
          "name": "Friendly Approach",
          "isDefault": true
        }
      ]
    }
  ]
}
```

#### GET /api/experiments/:id/metrics
Получить метрики эксперимента.

**Response** (200 OK):
```json
{
  "experimentId": "uuid",
  "variants": [
    {
      "variantId": "uuid",
      "variantName": "Formal Approach",
      "metrics": {
        "totalClients": 50,
        "conversionRate": 0.65,
        "avgTimeToConversion": 3600,
        "avgMessagesToConversion": 8,
        "soldRate": 0.45
      }
    },
    {
      "variantId": "uuid",
      "variantName": "Friendly Approach",
      "metrics": {
        "totalClients": 52,
        "conversionRate": 0.75,
        "avgTimeToConversion": 2800,
        "avgMessagesToConversion": 6,
        "soldRate": 0.55
      }
    }
  ],
  "recommendation": {
    "bestVariant": "uuid",
    "confidence": "high",
    "reason": "Friendly Approach shows 15% higher conversion rate"
  }
}
```

#### POST /api/experiments
Создать новый эксперимент.

**Request**:
```json
{
  "agentType": "QUALIFICATION",
  "name": "Qualification Tone Test",
  "description": "Testing formal vs friendly approach",
  "variantIds": ["uuid1", "uuid2"]
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "agentType": "QUALIFICATION",
  "name": "Qualification Tone Test",
  "status": "ACTIVE",
  "startDate": "2025-12-20T11:20:00Z",
  "createdAt": "2025-12-20T11:20:00Z"
}
```

### 3.8 WhatsApp интеграция

#### GET /api/whatsapp/status
Получить статус подключения WhatsApp.

**Response** (200 OK):
```json
{
  "status": "CONNECTED",
  "lastConnectedAt": "2025-12-20T08:00:00Z",
  "qrCode": null
}
```

#### POST /api/whatsapp/connect
Инициировать подключение WhatsApp (получить QR-код).

**Request**: Пустое тело

**Response** (200 OK):
```json
{
  "status": "CONNECTING",
  "qrCode": "data:image/png;base64,...",
  "expiresAt": "2025-12-20T11:25:00Z"
}
```

#### POST /api/whatsapp/disconnect
Отключить WhatsApp.

**Request**: Пустое тело

**Response** (200 OK):
```json
{
  "message": "WhatsApp disconnected successfully"
}
```

### 3.9 Аналитика

#### GET /api/analytics/dashboard
Получить данные для дашборда.

**Query Parameters**:
- `startDate`: начальная дата (ISO 8601, optional)
- `endDate`: конечная дата (ISO 8601, optional)

**Response** (200 OK):
```json
{
  "clients": {
    "total": 150,
    "byStatus": {
      "NEW_LEAD": 20,
      "QUALIFIED": 35,
      "PROPOSAL_SENT": 25,
      "SOLD": 15,
      "SERVICE": 10
    },
    "newToday": 5,
    "newThisWeek": 25
  },
  "conversations": {
    "active": 20,
    "managedByAI": 15,
    "managedByHuman": 5
  },
  "conversion": {
    "leadToQualified": 0.65,
    "qualifiedToSold": 0.43,
    "overall": 0.28
  }
}
```

#### GET /api/analytics/conversion-funnel
Получить данные воронки конверсии.

**Query Parameters**:
- `startDate`: начальная дата (ISO 8601, optional)
- `endDate`: конечная дата (ISO 8601, optional)

**Response** (200 OK):
```json
{
  "funnel": [
    {
      "stage": "NEW_LEAD",
      "count": 100,
      "percentage": 100
    },
    {
      "stage": "QUALIFIED",
      "count": 65,
      "percentage": 65
    },
    {
      "stage": "PROPOSAL_SENT",
      "count": 45,
      "percentage": 45
    },
    {
      "stage": "SOLD",
      "count": 28,
      "percentage": 28
    }
  ]
}
```

## 4. Обработка ошибок

### 4.1 Формат ошибок

Все ошибки возвращаются в следующем формате:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Дополнительные детали (опционально)
  }
}
```

### 4.2 Коды ошибок

#### Аутентификация и авторизация
- `UNAUTHORIZED` (401): Токен отсутствует или невалиден
- `FORBIDDEN` (403): Недостаточно прав доступа
- `INVALID_CREDENTIALS` (401): Неверный email или пароль
- `TOKEN_EXPIRED` (401): Токен истек

#### Валидация
- `VALIDATION_ERROR` (400): Ошибка валидации данных
- `MISSING_REQUIRED_FIELD` (400): Отсутствует обязательное поле
- `INVALID_FORMAT` (400): Неверный формат данных

#### Ресурсы
- `NOT_FOUND` (404): Ресурс не найден
- `ALREADY_EXISTS` (409): Ресурс уже существует
- `CONFLICT` (409): Конфликт данных

#### Бизнес-логика
- `INVALID_STATUS_TRANSITION` (400): Недопустимый переход статуса
- `WHATSAPP_NOT_CONNECTED` (400): WhatsApp не подключен
- `RATE_LIMIT_EXCEEDED` (429): Превышен лимит запросов

#### Серверные ошибки
- `INTERNAL_ERROR` (500): Внутренняя ошибка сервера
- `SERVICE_UNAVAILABLE` (503): Сервис временно недоступен

### 4.3 Примеры ошибок

#### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication token is missing or invalid"
  }
}
```

#### 400 Validation Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "phone": "Phone number is required",
      "email": "Invalid email format"
    }
  }
}
```

#### 404 Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Client with id 'uuid' not found"
  }
}
```

## 5. Rate Limiting

### 5.1 Лимиты

- **Аутентификация**: 5 запросов в минуту
- **Обычные запросы**: 100 запросов в минуту
- **Отправка сообщений**: 20 сообщений в минуту (ограничение WhatsApp)

### 5.2 Заголовки

При превышении лимита возвращаются заголовки:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1234567890
```

## 6. Пагинация

### 6.1 Формат

Все списковые endpoints поддерживают пагинацию через query parameters:
- `page`: номер страницы (default: 1)
- `limit`: количество элементов на странице (default: 20, max: 100)

### 6.2 Ответ

Ответ включает объект `pagination`:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 7. WebSocket (будущее)

Для real-time обновлений планируется WebSocket API:
- Обновления сообщений в реальном времени
- Уведомления о новых клиентах
- Статус подключения WhatsApp

**MVP**: Используется polling для обновлений.

---

**Следующие шаги**:
1. Реализация API endpoints согласно контрактам
2. Настройка валидации запросов (Zod схемы)
3. Настройка rate limiting
4. Настройка WebSocket для real-time обновлений (post-MVP)

