# Руководство по развертыванию

Полное руководство по развертыванию Soul KG CRM в production.

## 🎯 Рекомендуемая архитектура

**Frontend (Next.js)** → **Vercel**  
**Backend API (Express)** → **Railway** или **Render**  
**База данных (PostgreSQL)** → **Neon** или **Supabase**

---

## 📋 Быстрый старт

### 1. База данных (Neon)

1. Создайте проект на [Neon](https://neon.tech/)
2. Скопируйте Connection String
3. Примените миграции:
   ```bash
   cd packages/database
   DATABASE_URL="postgresql://..." npm run db:migrate
   ```

### 2. Backend API (Railway)

1. Создайте проект на [Railway](https://railway.app/)
2. Подключите GitHub репозиторий
3. Railway автоматически определит Dockerfile (`apps/api/Dockerfile`)
4. Добавьте переменные окружения (см. ниже)
5. Дождитесь деплоя

### 3. Frontend (Vercel)

1. Создайте проект на [Vercel](https://vercel.com/)
2. Подключите GitHub репозиторий
3. **Важно**: Установите Root Directory = `apps/web`
4. Добавьте переменную окружения: `NEXT_PUBLIC_API_URL=https://your-api-url.railway.app`
5. Передеплойте

---

## 🔧 Переменные окружения

### Backend (Railway)

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
PORT=3001
NODE_ENV=production
JWT_SECRET=<openssl rand -base64 32>
JWT_REFRESH_SECRET=<openssl rand -base64 32>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Frontend (Vercel)

```env
NEXT_PUBLIC_API_URL=https://your-api-url.railway.app
```

**Важно**: БЕЗ `/api` в конце!

---

## ✅ Проверка работоспособности

### API Healthcheck
```bash
curl https://your-api-url.railway.app/health
# Ожидается: {"status":"ok","timestamp":"..."}
```

### API Регистрация
```bash
curl -X POST https://your-api-url.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123","organizationName":"Test"}'
```

### Frontend
1. Откройте URL от Vercel
2. Проверьте консоль браузера (F12)
3. Попробуйте зарегистрироваться

---

## 🐛 Решение проблем

### Healthcheck не проходит
- Проверьте логи Railway
- Проверьте переменные окружения
- Убедитесь, что сервер слушает на `0.0.0.0`

### Prisma ошибки
- Убедитесь, что `binaryTargets` включает `debian-openssl-3.0.x`
- Проверьте, что openssl установлен в Docker образе

### Frontend не подключается к API
- Проверьте `NEXT_PUBLIC_API_URL` в Vercel
- Проверьте CORS настройки в API
- Проверьте Network tab в DevTools

---

## 📚 Дополнительные ресурсы

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Neon Documentation](https://neon.tech/docs)

---

**Последнее обновление**: 2025-12-21




