# 🚀 Ваше развертывание - Пошаговая инструкция

## ✅ Уже выполнено

- [x] База данных создана на Neon
- [x] **Миграции применены к Neon БД** ✅
- [x] Frontend развернут на Vercel: https://soulkg-crm.vercel.app/
- [x] Connection String получен
- [x] JWT секреты сгенерированы

## 📋 Следующие шаги

### Шаг 1: Развернуть API на Railway

1. **Зайдите на https://railway.app**
   - Зарегистрируйтесь через GitHub (если еще не зарегистрированы)

2. **Создайте новый проект**
   - Нажмите "New Project"
   - Выберите "Deploy from GitHub repo"
   - Выберите ваш репозиторий `soulkg_CRM`

3. **Railway автоматически определит Dockerfile**
   - Убедитесь, что он использует `apps/api/Dockerfile`
   - Если нет, укажите вручную: `apps/api/Dockerfile`

4. **Добавьте переменные окружения**
   
   В Railway Dashboard → ваш сервис → Variables добавьте:

   ```env
   DATABASE_URL=postgresql://neondb_owner:npg_ub80MEJLDyUd@ep-fancy-boat-agce4o8g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   PORT=3001
   NODE_ENV=production
   JWT_SECRET=Vg7b6eObgXwhv/u6yJsKKP5bQD/Dl59KjMwXVlL51X8=
   JWT_REFRESH_SECRET=qyHyW4oRMTvHSILWrDQZB2FKi2kIjTgJI0dHsV35igQ=
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   ```

5. **Дождитесь деплоя**
   - Railway автоматически соберет и задеплоит ваш API
   - Это займет 3-5 минут
   - **Примечание**: Railway автоматически редеплоится при каждом push в GitHub (см. RAILWAY_AUTO_DEPLOY.md)

6. **Скопируйте URL API**
   - После деплоя Railway предоставит URL вида:
     - `https://soul-kg-crm-api-production.up.railway.app`
     - Или другой домен
   - Скопируйте этот URL - он понадобится для следующего шага

### Шаг 2: Обновить Frontend в Vercel

1. **Зайдите в Vercel Dashboard**
   - https://vercel.com/dashboard
   - Откройте проект `soulkg-crm`

2. **Добавьте переменную окружения**
   - Settings → Environment Variables
   - Добавьте новую переменную:
     - **Key**: `NEXT_PUBLIC_API_URL`
     - **Value**: URL вашего API от Railway (БЕЗ `/api` в конце!)
       - Например: `https://soul-kg-crm-api-production.up.railway.app`
     - **Environment**: Production, Preview, Development (выберите все)

3. **Передеплойте приложение**
   - Перейдите в Deployments
   - Найдите последний деплой
   - Нажмите "..." → "Redeploy"
   - Или сделайте новый commit и push в main

### Шаг 3: Проверка

1. **Проверьте API health check**
   ```bash
   curl https://your-api-url.railway.app/health
   ```
   
   Должен вернуть:
   ```json
   {"status":"ok","timestamp":"2025-01-01T00:00:00.000Z"}
   ```

2. **Проверьте Frontend**
   - Откройте https://soulkg-crm.vercel.app/
   - Откройте DevTools (F12) → Console
   - Попробуйте зарегистрироваться
   - Проверьте, что нет ошибок в консоли
   - Проверьте Network tab - запросы должны идти на ваш Railway API

3. **Проверьте базу данных (опционально)**
   ```bash
   psql 'postgresql://neondb_owner:npg_ub80MEJLDyUd@ep-fancy-boat-agce4o8g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
   
   # В psql:
   \dt  # список таблиц
   SELECT COUNT(*) FROM organizations;  # проверка данных
   \q   # выход
   ```

## 🔧 Полезные команды

### Применить seed данные (опционально)

```bash
cd packages/database
DATABASE_URL="postgresql://neondb_owner:npg_ub80MEJLDyUd@ep-fancy-boat-agce4o8g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" npm run db:seed
```

### Проверить логи Railway

- Зайдите в Railway Dashboard → ваш сервис → Logs
- Там будут видны все логи API

### Проверить логи Vercel

- Зайдите в Vercel Dashboard → ваш проект → Deployments → выберите деплой → Logs

## 📝 Ваши данные

**База данных**: Neon  
**Connection String**: `postgresql://neondb_owner:npg_ub80MEJLDyUd@ep-fancy-boat-agce4o8g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

**Frontend**: Vercel  
**URL**: https://soulkg-crm.vercel.app/

**API**: Railway (нужно развернуть)  
**URL**: (будет после деплоя)

**JWT секреты** (уже сгенерированы):
- `JWT_SECRET`: `Vg7b6eObgXwhv/u6yJsKKP5bQD/Dl59KjMwXVlL51X8=`
- `JWT_REFRESH_SECRET`: `qyHyW4oRMTvHSILWrDQZB2FKi2kIjTgJI0dHsV35igQ=`

---

## ⚠️ Важные моменты

1. **Connection String содержит пароль** - не коммитьте его в Git!
2. **JWT секреты** - не коммитьте их в Git!
3. **NEXT_PUBLIC_API_URL** должен быть БЕЗ `/api` в конце - оно добавляется автоматически в коде
4. После изменения переменных окружения в Vercel нужно **передеплоить** приложение

---

**Следующий шаг**: Развернуть API на Railway (Шаг 1) → Обновить Vercel (Шаг 2) → Проверить (Шаг 3)

