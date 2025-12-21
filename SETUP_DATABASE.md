# Настройка базы данных

## Шаг 1: Установка PostgreSQL

Если PostgreSQL еще не установлен:

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Скачайте и установите с [официального сайта](https://www.postgresql.org/download/windows/)

## Шаг 2: Создание базы данных

```bash
# Подключитесь к PostgreSQL
psql postgres

# Создайте базу данных
CREATE DATABASE soul_kg_crm;

# Создайте пользователя (опционально)
CREATE USER soul_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE soul_kg_crm TO soul_user;

# Выйдите из psql
\q
```

## Шаг 3: Настройка .env файла

1. Перейдите в `packages/database/`
2. Создайте `.env` файл:
   ```bash
   cd packages/database
   ```

3. Для PostgreSQL установленного через Homebrew (macOS), используйте текущего пользователя:
   ```bash
   echo 'DATABASE_URL="postgresql://'$(whoami)'@localhost:5432/soul_kg_crm?schema=public"' > .env
   ```

   Или отредактируйте `.env` вручную:
   ```
   DATABASE_URL="postgresql://Igor@localhost:5432/soul_kg_crm?schema=public"
   ```

   Для других случаев:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/soul_kg_crm?schema=public"
   ```

## Шаг 4: Применение миграций

```bash
cd packages/database
npm run db:migrate
```

Это создаст все таблицы в базе данных.

## Шаг 5: Проверка подключения

```bash
# Откройте Prisma Studio для просмотра данных
npm run db:studio
```

Или проверьте через psql:
```bash
psql soul_kg_crm
\dt  # Показать все таблицы
```

## Использование Docker (альтернатива)

Если предпочитаете Docker:

```bash
# Запустите PostgreSQL в Docker
docker run --name soul-kg-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=soul_kg_crm \
  -p 5432:5432 \
  -d postgres:15

# DATABASE_URL будет:
# postgresql://postgres:postgres@localhost:5432/soul_kg_crm?schema=public
```

## Troubleshooting

**Ошибка: "connection refused"**
- Убедитесь, что PostgreSQL запущен: `brew services list` или `sudo systemctl status postgresql`
- Проверьте порт: по умолчанию PostgreSQL использует порт 5432

**Ошибка: "database does not exist"**
- Создайте базу данных (см. Шаг 2)

**Ошибка: "password authentication failed"**
- Проверьте пароль в DATABASE_URL
- Или создайте нового пользователя с правильным паролем

