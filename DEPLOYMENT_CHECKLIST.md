# ✅ Чек-лист развертывания

## ✅ Выполнено

- [x] База данных создана на Neon
- [x] Миграции применены к Neon БД
- [x] Frontend развернут на Vercel: https://soulkg-crm.vercel.app/
- [x] JWT секреты сгенерированы

## 📋 Осталось сделать

### 1. Развернуть API на Railway

- [ ] Зарегистрироваться на https://railway.app
- [ ] Создать новый проект из GitHub репозитория
- [ ] Убедиться, что используется `apps/api/Dockerfile`
- [ ] Добавить переменные окружения (см. ниже)
- [ ] Дождаться деплоя (3-5 минут)
- [ ] Скопировать URL API от Railway

**Переменные окружения для Railway**:
```env
DATABASE_URL=postgresql://neondb_owner:npg_ub80MEJLDyUd@ep-fancy-boat-agce4o8g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PORT=3001
NODE_ENV=production
JWT_SECRET=Vg7b6eObgXwhv/u6yJsKKP5bQD/Dl59KjMwXVlL51X8=
JWT_REFRESH_SECRET=qyHyW4oRMTvHSILWrDQZB2FKi2kIjTgJI0dHsV35igQ=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### 2. Обновить Frontend в Vercel

- [ ] Зайти в Vercel Dashboard → проект `soulkg-crm`
- [ ] Settings → Environment Variables
- [ ] Добавить `NEXT_PUBLIC_API_URL` = URL от Railway (БЕЗ `/api`)
- [ ] Передеплоить приложение (Redeploy)

### 3. Проверка

- [ ] Проверить API health: `curl https://your-api-url.railway.app/health`
- [ ] Открыть https://soulkg-crm.vercel.app/
- [ ] Проверить консоль браузера на ошибки
- [ ] Попробовать зарегистрироваться
- [ ] Проверить Network tab - запросы идут на Railway API

## 📝 Ваши данные

**База данных**: Neon ✅  
**Connection String**: `postgresql://neondb_owner:npg_ub80MEJLDyUd@ep-fancy-boat-agce4o8g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

**Frontend**: Vercel ✅  
**URL**: https://soulkg-crm.vercel.app/

**API**: Railway ⏳  
**URL**: (будет после деплоя)

**JWT секреты**:
- `JWT_SECRET`: `Vg7b6eObgXwhv/u6yJsKKP5bQD/Dl59KjMwXVlL51X8=`
- `JWT_REFRESH_SECRET`: `qyHyW4oRMTvHSILWrDQZB2FKi2kIjTgJI0dHsV35igQ=`

---

**Следующий шаг**: Развернуть API на Railway → см. [YOUR_DEPLOYMENT.md](./YOUR_DEPLOYMENT.md)

