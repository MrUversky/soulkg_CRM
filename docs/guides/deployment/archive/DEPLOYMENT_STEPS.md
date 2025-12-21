# 🚀 Текущий статус развертывания

## ✅ Выполнено

- [x] База данных создана на Neon
- [x] Frontend развернут на Vercel: https://soulkg-crm.vercel.app/
- [x] Connection String получен

## 📋 Следующие шаги

### 1. Применить миграции к базе данных Neon

```bash
cd packages/database
DATABASE_URL="postgresql://neondb_owner:npg_ub80MEJLDyUd@ep-fancy-boat-agce4o8g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" npm run db:migrate
npm run db:generate
```

Или через neonctl:
```bash
npx neonctl@latest init
# Следуйте инструкциям для подключения к вашему проекту

# Затем примените миграции
cd packages/database
npm run db:migrate
npm run db:generate
```

### 2. Развернуть API на Railway

1. Зайдите на https://railway.app
2. New Project → Deploy from GitHub repo
3. Выберите ваш репозиторий
4. Railway автоматически определит Dockerfile из `apps/api/Dockerfile`

### 3. Настроить переменные окружения в Railway

В Railway Dashboard → Variables добавьте:

```env
DATABASE_URL=postgresql://neondb_owner:npg_ub80MEJLDyUd@ep-fancy-boat-agce4o8g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PORT=3001
NODE_ENV=production
JWT_SECRET=<сгенерируйте: openssl rand -base64 32>
JWT_REFRESH_SECRET=<сгенерируйте: openssl rand -base64 32>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

**Генерация секретных ключей**:
```bash
openssl rand -base64 32  # для JWT_SECRET
openssl rand -base64 32  # для JWT_REFRESH_SECRET
```

### 4. Получить URL API от Railway

После деплоя Railway предоставит URL вида:
- `https://soul-kg-crm-api.up.railway.app`
- Или другой домен

Скопируйте этот URL.

### 5. Обновить переменные окружения в Vercel

1. Зайдите в Vercel Dashboard → ваш проект
2. Settings → Environment Variables
3. Добавьте/обновите:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-url.railway.app
   ```
   (БЕЗ `/api` в конце!)

4. Передеплойте приложение (Redeploy)

### 6. Проверка

```bash
# Проверьте API health check
curl https://your-api-url.railway.app/health

# Должен вернуть:
# {"status":"ok","timestamp":"..."}
```

Откройте https://soulkg-crm.vercel.app/ и проверьте:
- Страница загружается
- Попробуйте зарегистрироваться
- Проверьте консоль браузера на ошибки

## 🔧 Полезные команды

### Проверка подключения к БД

```bash
psql 'postgresql://neondb_owner:npg_ub80MEJLDyUd@ep-fancy-boat-agce4o8g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

# В psql:
\dt  # список таблиц
\q   # выход
```

### Применение seed данных (опционально)

```bash
cd packages/database
DATABASE_URL="postgresql://neondb_owner:npg_ub80MEJLDyUd@ep-fancy-boat-agce4o8g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" npm run db:seed
```

## 📝 Текущие данные

**База данных**: Neon  
**Connection String**: `postgresql://neondb_owner:npg_ub80MEJLDyUd@ep-fancy-boat-agce4o8g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

**Frontend**: Vercel  
**URL**: https://soulkg-crm.vercel.app/

**API**: Railway (нужно развернуть)

---

**Следующий шаг**: Развернуть API на Railway и настроить переменные окружения

