# Database Package

Prisma schema and database utilities for Soul KG CRM.

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `DATABASE_URL` in `.env` with your PostgreSQL connection string:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/soul_kg_crm?schema=public"
   ```

3. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```

4. Create initial migration:
   ```bash
   npm run db:migrate
   ```

## Scripts

- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Create and apply migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with test data (or `npx prisma db seed`)

## Seed Data

Seed скрипт (`prisma/seed.ts`) создает:
- Тестовую организацию "Soul KG" (slug: `soul-kg`)
- Промпт для STATUS_DETECTION агента с настройками LLM

Для запуска seed:
```bash
npm run db:seed
# или
npx prisma db seed
```

## Usage

```typescript
import { prisma } from '@soul-kg-crm/database';

// Use prisma client
const clients = await prisma.client.findMany({
  where: { organizationId: 'org-id' }
});
```

