# Soul KG CRM - Web Application

Frontend приложение для Soul KG CRM системы, построенное на Next.js 16 с App Router.

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Запуск dev сервера

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

### Сборка для production

```bash
npm run build
npm start
```

## 📁 Структура проекта

```
apps/web/
├── app/                    # Next.js App Router страницы
│   ├── (auth)/            # Auth routes (login, register)
│   ├── dashboard/         # Dashboard routes
│   └── layout.tsx         # Root layout
├── components/            # React компоненты
│   ├── ui/                # Primitives (базовые компоненты)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── index.ts
│   ├── blocks/            # Composed components (составные)
│   ├── features/          # Feature-specific компоненты
│   │   ├── clients/
│   │   └── users/
│   └── layout/            # Layout компоненты
│       ├── Header.tsx
│       └── Sidebar.tsx
├── lib/                   # Утилиты и хелперы
│   ├── contexts/          # React Contexts
│   ├── hooks/             # Custom hooks
│   └── utils.ts           # Утилиты
├── styles/                # Стили
│   └── design-tokens.css  # Дизайн-токены (CSS переменные)
└── app/globals.css        # Глобальные стили
```

## 🎨 Дизайн-система

Проект использует единую дизайн-систему с токенами:

- **Цвета**: Primary, Secondary, Semantic (success/warning/error)
- **Spacing**: 4px grid система (p-4, p-6, p-8, gap-4, gap-6, space-y-6, etc.)
- **Типографика**: Система размеров и весов
- **Тени**: Многоуровневая система теней
- **Анимации**: Плавные переходы с spring easing

**Важно**: Всегда используй токены дизайн-системы вместо хардкода значений.

### Примеры использования токенов

```tsx
// ✅ Правильно
<div className="bg-primary text-text-primary p-6 rounded-xl shadow-md">
  <Button variant="primary">Click me</Button>
</div>

// ❌ Неправильно
<div className="bg-blue-500 text-gray-900 p-6 rounded-lg">
  <Button className="bg-blue-600">Click me</Button>
</div>
```

**Подробнее**: 
- [Дизайн-система](../docs/architecture/SPACING_SYSTEM.md)
- [Developer Guidelines](../docs/architecture/DEVELOPER_GUIDELINES.md)
- [Frontend Architecture](../docs/architecture/frontend-architecture.md)

## 🧩 Компоненты

### Архитектура компонентов

Компоненты организованы по уровням:

1. **Primitives (ui/)** - базовые компоненты без бизнес-логики
2. **Blocks (blocks/)** - составные компоненты из primitives
3. **Features (features/)** - специфичные для фич компоненты
4. **Layout (layout/)** - компоненты макета

**Правило**: Компоненты могут импортировать только из уровней выше.

### Использование компонентов

```tsx
// Импорт primitives
import { Button, Input, Card } from "@/components/ui"

// Импорт blocks
import { FormField } from "@/components/blocks"

// Использование
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardBody>
    <Input label="Email" type="email" />
    <Button variant="primary">Submit</Button>
  </CardBody>
</Card>
```

**Подробнее**: [Developer Guidelines](../docs/architecture/DEVELOPER_GUIDELINES.md)

## 🛠 Технологии

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4 + CSS Variables
- **UI Library**: shadcn/ui (копируемые компоненты)
- **State Management**: React Context API (auth), React Query (server state)
- **Forms**: React Hook Form + Zod
- **TypeScript**: Строгая типизация

## 📚 Документация

- [Developer Guidelines](../docs/architecture/DEVELOPER_GUIDELINES.md) - Как работать с компонентами и дизайн-системой
- [Frontend Architecture](../docs/architecture/frontend-architecture.md) - Архитектура фронтенда
- [Spacing System](../docs/architecture/SPACING_SYSTEM.md) - Система spacing
- [System Design](../../docs/architecture/system-design.md) - Общая архитектура системы

## 🔧 Разработка

### Создание нового компонента

1. Определи уровень компонента (primitive/block/feature)
2. Создай файл компонента с JSDoc документацией
3. Добавь в соответствующий `index.ts`
4. Используй токены дизайн-системы
5. Добавь accessibility атрибуты

**Подробнее**: [Developer Guidelines](../docs/architecture/DEVELOPER_GUIDELINES.md#создание-новых-компонентов)

### Линтинг

```bash
npm run lint
```

## 🌙 Темная тема

Приложение поддерживает темную тему автоматически через:
- `prefers-color-scheme: dark` (системные настройки)
- Класс `dark` на `<html>` элементе

Все компоненты автоматически адаптируются к теме через CSS переменные.

## 📝 Лицензия

Private project - Soul KG CRM
