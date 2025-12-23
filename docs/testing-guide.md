# Руководство по тестированию

## Быстрый старт

### 1. Запуск Backend API

```bash
cd apps/api
npm run dev
```

API будет доступен на `http://localhost:3001`

**Проверка работоспособности**:
```bash
curl http://localhost:3001/health
```

### 2. Запуск Frontend

```bash
cd apps/web
npm run dev
```

Frontend будет доступен на `http://localhost:3000`

### 3. Тестирование API endpoints

#### Регистрация нового пользователя

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "organizationName": "Test Organization"
  }'
```

#### Вход пользователя

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Сохраните `accessToken` из ответа для следующих запросов.

#### Получение списка клиентов

```bash
curl http://localhost:3001/api/clients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Создание клиента

```bash
curl -X POST http://localhost:3001/api/clients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+996555123456",
    "email": "client@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 4. Тестирование Frontend

1. Откройте `http://localhost:3000` в браузере
2. Зарегистрируйте нового пользователя или войдите
3. Проверьте:
   - ✅ Страница Dashboard загружается
   - ✅ Список клиентов отображается
   - ✅ Можно создать нового клиента
   - ✅ Можно редактировать клиента
   - ✅ Можно изменить статус клиента
   - ✅ Страница Users доступна (только для ADMIN)
   - ✅ Страница Settings доступна (только для ADMIN)

### 5. Unit тесты

```bash
cd apps/api
npm test
```

Все 26 тестов должны пройти успешно.

### 6. Проверка сборки

```bash
# Backend
cd apps/api
npm run build

# Frontend
cd apps/web
npm run build
```

## Чек-лист тестирования

### Backend API
- [ ] Health check endpoint работает
- [ ] Регистрация пользователя работает
- [ ] Вход пользователя работает
- [ ] Refresh token работает
- [ ] Выход работает
- [ ] CRUD операции для клиентов работают
- [ ] CRUD операции для пользователей работают (ADMIN only)
- [ ] CRUD операции для организаций работают (ADMIN only)
- [ ] Мультитенантность работает (изоляция данных)
- [ ] Права доступа работают (MANAGER vs ADMIN)

### Frontend
- [ ] Страница логина работает
- [ ] Страница регистрации работает
- [ ] Dashboard загружается после входа
- [ ] Список клиентов отображается
- [ ] Создание клиента работает
- [ ] Редактирование клиента работает
- [ ] Изменение статуса клиента работает
- [ ] Список пользователей отображается (ADMIN only)
- [ ] Создание пользователя работает (ADMIN only)
- [ ] Настройки организации работают (ADMIN only)
- [ ] Responsive дизайн работает на мобильных устройствах
- [ ] Обработка ошибок работает корректно

### Интеграция
- [ ] Frontend корректно подключается к Backend API
- [ ] JWT токены сохраняются и используются корректно
- [ ] Автоматический refresh токена работает
- [ ] Редирект на login при истечении токена работает

## Известные проблемы

Если вы столкнулись с проблемами:

1. **Backend не запускается**: Проверьте переменные окружения (DATABASE_URL, JWT_SECRET)
2. **Frontend не подключается к API**: Проверьте NEXT_PUBLIC_API_URL в `.env.local`
3. **Ошибки CORS**: Убедитесь, что CORS настроен правильно в `apps/api/src/index.ts`
4. **Ошибки базы данных**: Убедитесь, что миграции применены (`npm run db:migrate`)

## Следующие шаги

После успешного тестирования:
1. Написать integration тесты для API routes
2. Написать E2E тесты для Frontend (Playwright)
3. Проверить производительность (пагинация, фильтрация)
4. Проверить мультитенантность на реальных данных




