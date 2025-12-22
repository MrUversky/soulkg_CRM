# Frontend Architecture: Component Structure

> **Версия**: 1.0  
> **Дата создания**: 2025-12-22  
> **Статус**: Активная разработка

## 🏗️ Архитектура компонентов

### Принципы

1. **Иерархия компонентов**: Primitives → Blocks → Features → Pages
2. **Separation of Concerns**: Каждый слой имеет свою ответственность
3. **Composition over Configuration**: Используем композицию компонентов
4. **DRY**: Переиспользование компонентов, избегание дублирования
5. **Type Safety**: Строгая типизация TypeScript

---

## 📁 Структура папок

```
components/
├── ui/              # Primitives (shadcn/ui)
│   ├── button.tsx   # Базовый Button
│   ├── input.tsx    # Базовый Input
│   ├── card.tsx     # Базовый Card
│   └── index.ts     # Re-exports
│
├── blocks/          # Composed Components
│   ├── form-field.tsx      # Input + Label + Error
│   ├── data-table.tsx      # Table + Pagination
│   ├── status-badge.tsx    # Badge с статусами
│   └── index.ts
│
├── features/        # Feature-specific Components
│   ├── clients/
│   │   ├── ClientList.tsx
│   │   ├── ClientForm.tsx
│   │   └── ClientDetail.tsx
│   ├── users/
│   │   ├── UserList.tsx
│   │   └── UserForm.tsx
│   └── settings/
│       └── OrganizationSettings.tsx
│
└── layout/          # Layout Components
    ├── Header.tsx
    ├── Sidebar.tsx
    └── ProtectedRoute.tsx
```

---

## 🎯 Слои компонентов

### 1. Primitives (`components/ui/`)

**Назначение**: Базовые, атомарные компоненты без бизнес-логики.

**Источник**: shadcn/ui (копируемые компоненты)

**Примеры**:
- `Button` - кнопка с вариантами (primary, secondary, outline, ghost, danger)
- `Input` - поле ввода
- `Card` - карточка с header, body, footer

**Правила**:
- ✅ Используют только дизайн-токены
- ✅ Не содержат бизнес-логику
- ✅ Полностью переиспользуемые
- ✅ Accessible из коробки (ARIA, keyboard navigation)
- ❌ Не импортируются напрямую в features/
- ❌ Не содержат специфичную логику

**Пример использования**:
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="lg">
  Click me
</Button>
```

---

### 2. Blocks (`components/blocks/`)

**Назначение**: Композиции из primitives для создания переиспользуемых паттернов.

**Примеры**:
- `FormField` - Input + Label + Error message
- `DataTable` - Table с пагинацией и фильтрами
- `StatusBadge` - Badge с цветами статусов
- `SearchInput` - Input с иконкой поиска

**Правила**:
- ✅ Композируют primitives из `ui/`
- ✅ Могут содержать простую логику (валидация, форматирование)
- ✅ Переиспользуемые между features
- ✅ Используются в features/ и pages
- ❌ Не содержат бизнес-логику (API calls, state management)
- ❌ Не импортируются напрямую из ui/

**Пример использования**:
```tsx
import { FormField } from '@/components/blocks';

<FormField
  label="Email"
  error={errors.email?.message}
  {...register('email')}
/>
```

---

### 3. Features (`components/features/`)

**Назначение**: Компоненты специфичные для конкретной фичи/домена.

**Примеры**:
- `ClientList` - список клиентов с фильтрацией
- `ClientForm` - форма создания/редактирования клиента
- `UserList` - список пользователей

**Правила**:
- ✅ Содержат бизнес-логику (API calls, state management)
- ✅ Используют hooks для данных (`useClients`, `useUsers`)
- ✅ Могут использовать blocks и primitives
- ✅ Специфичны для одной фичи
- ❌ Не переиспользуются между фичами
- ❌ Не импортируются напрямую из ui/

**Пример использования**:
```tsx
import { ClientList } from '@/components/features/clients';

<ClientList />
```

---

### 4. Layout (`components/layout/`)

**Назначение**: Компоненты для структуры страницы.

**Примеры**:
- `Header` - шапка с навигацией
- `Sidebar` - боковая панель
- `ProtectedRoute` - защита маршрутов

**Правила**:
- ✅ Используются в layout файлах Next.js
- ✅ Могут использовать primitives и blocks
- ✅ Содержат навигационную логику
- ❌ Не содержат бизнес-логику фич

---

## 🔄 Правила импорта

### ✅ Правильно

```tsx
// Features импортируют из blocks и ui
import { FormField } from '@/components/blocks';
import { Button } from '@/components/ui';

// Blocks импортируют только из ui
import { Input, Button } from '@/components/ui';

// Pages импортируют features
import { ClientList } from '@/components/features/clients';
```

### ❌ Неправильно

```tsx
// Features НЕ должны импортировать напрямую из ui
import { Input } from '@/components/ui/input';  // ❌

// Используйте blocks вместо этого
import { FormField } from '@/components/blocks';  // ✅

// Blocks НЕ должны импортировать из features
import { ClientList } from '@/components/features/clients';  // ❌
```

---

## 📐 Правила композиции

### 1. Component Composition

Используйте композицию вместо пропсов-хеллов:

```tsx
// ✅ Хорошо - композиция
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Actions</CardFooter>
</Card>

// ❌ Плохо - пропсы-хелл
<Card
  title="Title"
  description="Description"
  content="Content"
  footer="Actions"
/>
```

### 2. Custom Hooks для логики

Выносите бизнес-логику в hooks:

```tsx
// ✅ Хорошо - логика в hook
const { clients, loading, error } = useClients({ status: 'QUALIFIED' });
return <ClientList clients={clients} loading={loading} />;

// ❌ Плохо - логика в компоненте
function ClientList() {
  const [clients, setClients] = useState([]);
  useEffect(() => {
    // API call...
  }, []);
  // ...
}
```

### 3. Server Components где возможно

Используйте Server Components для данных:

```tsx
// ✅ Server Component (по умолчанию в Next.js)
async function ClientsPage() {
  const clients = await getClients(); // Server-side
  return <ClientList clients={clients} />;
}

// Client Component только для интерактивности
'use client';
export function ClientFilters() {
  const [filters, setFilters] = useState();
  // ...
}
```

---

## 🎨 Интеграция с дизайн-системой

### Использование токенов

Все компоненты должны использовать токены из дизайн-системы:

```tsx
// ✅ Использование токенов через Tailwind
<Button className="bg-primary-600 hover:bg-primary-700 text-white">

// ✅ Использование токенов через CSS переменные
.button {
  background-color: var(--color-primary-600);
}

// ❌ Хардкод
<Button className="bg-blue-600">  // ❌
```

### Темы (Light/Dark)

Компоненты автоматически адаптируются к темам через CSS переменные:

```tsx
// Автоматически работает в обеих темах
<Card className="bg-surface text-text-primary border-border">
```

---

## 📝 Создание нового компонента

### Шаг 1: Определить слой

- **Primitive?** → `components/ui/`
- **Block?** → `components/blocks/`
- **Feature?** → `components/features/[feature]/`

### Шаг 2: Создать компонент

```tsx
// components/blocks/form-field.tsx
'use client';

import { Input } from '@/components/ui';
import { Label } from '@/components/ui/label'; // если нужен
import { cn } from '@/lib/utils';

interface FormFieldProps extends React.ComponentProps<typeof Input> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function FormField({ label, error, helperText, className, ...props }: FormFieldProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={props.id}>
          {label}
          {props.required && <span className="text-error-600 ml-1">*</span>}
        </Label>
      )}
      <Input
        className={cn(error && 'border-error-600', className)}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${props.id}-error`} className="text-sm text-error-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
```

### Шаг 3: Экспортировать

```tsx
// components/blocks/index.ts
export { FormField } from './form-field';
```

### Шаг 4: Документировать

Добавьте JSDoc комментарии:

```tsx
/**
 * FormField Component
 * 
 * Composed component that combines Input with Label and Error message.
 * 
 * @example
 * ```tsx
 * <FormField
 *   label="Email"
 *   type="email"
 *   error={errors.email?.message}
 *   {...register('email')}
 * />
 * ```
 */
```

---

## 🧪 Тестирование компонентов

### Unit Tests (Primitives & Blocks)

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui';

test('Button renders correctly', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});
```

### Integration Tests (Features)

```tsx
import { render, screen } from '@testing-library/react';
import { ClientList } from '@/components/features/clients';

test('ClientList displays clients', async () => {
  render(<ClientList />);
  // Test interactions...
});
```

---

## 📚 Best Practices

### 1. Именование

- **Компоненты**: `PascalCase` (FormField, ClientList)
- **Файлы**: `kebab-case.tsx` или `PascalCase.tsx` (соответствует имени компонента)
- **Props**: `camelCase` (onClick, isLoading)

### 2. Типизация

```tsx
// ✅ Явные типы
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

// ❌ any типы
function Button(props: any) {  // ❌
```

### 3. Accessibility

```tsx
// ✅ ARIA атрибуты
<button
  aria-label="Close menu"
  aria-expanded={isOpen}
  aria-controls="menu"
>

// ✅ Keyboard navigation
<button onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    handleClick();
  }
}}>
```

### 4. Performance

```tsx
// ✅ Мемоизация для дорогих вычислений
const memoizedValue = useMemo(() => expensiveCalculation(data), [data]);

// ✅ Callback мемоизация
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);
```

---

## 🔄 Миграция существующих компонентов

### Процесс миграции

1. **Анализ**: Какие props, состояния, зависимости?
2. **Создание нового**: Скопировать из shadcn/ui, настроить под дизайн-систему
3. **Тестирование**: Визуально, функционально, accessibility
4. **Миграция**: Заменить импорты, обновить использование
5. **Удаление**: Удалить старый компонент после полной миграции

### Legacy Wrappers

Временно создаем обертки для совместимости:

```tsx
// components/ui/Button.tsx (legacy wrapper)
export { Button } from './button';
export type { ButtonProps } from './button';
```

После миграции всех использований - удаляем wrapper.

---

## 📖 Дополнительные ресурсы

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [React Composition Patterns](https://react.dev/learn/passing-data-deeply-with-context)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**Последнее обновление**: 2025-12-22

