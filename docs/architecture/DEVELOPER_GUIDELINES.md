# Developer Guidelines

> **Руководство для разработчиков**: Как работать с дизайн-системой, создавать компоненты и следовать архитектуре

## 📚 Содержание

1. [Архитектура компонентов](#архитектура-компонентов)
2. [Дизайн-система](#дизайн-система)
3. [Создание новых компонентов](#создание-новых-компонентов)
4. [Правила композиции](#правила-композиции)
5. [Best Practices](#best-practices)
6. [Anti-patterns](#anti-patterns)
7. [Accessibility](#accessibility)

---

## Архитектура компонентов

### Структура папок

```
components/
├── ui/              # Primitives (базовые компоненты из shadcn/ui)
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── index.ts
├── blocks/          # Composed components (составные компоненты)
│   ├── form-field.tsx
│   ├── data-table.tsx
│   └── status-badge.tsx
├── features/        # Feature-specific (специфичные для фич)
│   ├── clients/
│   │   ├── ClientList.tsx
│   │   ├── ClientForm.tsx
│   │   └── ClientDetail.tsx
│   └── users/
│       ├── UserList.tsx
│       └── UserForm.tsx
└── layout/          # Layout компоненты
    ├── Header.tsx
    ├── Sidebar.tsx
    └── ProtectedRoute.tsx
```

### Иерархия компонентов

```
Primitives (ui/) 
    ↓
Blocks (blocks/)
    ↓
Features (features/)
    ↓
Pages (app/)
```

**Правило**: Компоненты могут импортировать только из уровней выше или того же уровня.

- ✅ `features/clients/ClientList` может импортировать из `ui/` и `blocks/`
- ❌ `ui/Button` НЕ может импортировать из `features/` или `blocks/`
- ✅ `blocks/form-field` может импортировать из `ui/`
- ❌ `blocks/form-field` НЕ может импортировать из `features/`

---

## Дизайн-система

### Использование токенов

**Всегда используй токены дизайн-системы вместо хардкода:**

```tsx
// ✅ Правильно
<div className="bg-primary text-text-primary p-6 rounded-xl shadow-md">
  <Button variant="primary">Click me</Button>
</div>

// ❌ Неправильно
<div className="bg-blue-500 text-gray-900 p-6 rounded-lg shadow">
  <Button className="bg-blue-600">Click me</Button>
</div>
```

### Доступные токены

#### Цвета
- `bg-primary`, `text-primary`, `border-primary`
- `bg-secondary`, `text-secondary`, `border-secondary`
- `bg-success`, `bg-warning`, `bg-error`, `bg-info`
- `bg-background`, `bg-surface`, `bg-card`
- `text-text-primary`, `text-text-secondary`, `text-text-muted`

#### Spacing
- `p-4`, `p-6`, `p-8` (padding)
- `m-4`, `m-6`, `m-8` (margin)
- `gap-4`, `gap-6`, `gap-8` (gap)
- `space-y-4`, `space-y-6`, `space-y-8` (vertical spacing)

#### Радиусы
- `rounded-xl` (16px) - стандартный
- `rounded-2xl` (24px) - для карточек
- `rounded-full` - для круглых элементов

#### Тени
- `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`

**Подробнее**: См. `docs/architecture/SPACING_SYSTEM.md` и `styles/design-tokens.css`

---

## Создание новых компонентов

### Шаг 1: Определи уровень компонента

**Primitive (ui/)** - базовый компонент без бизнес-логики:
- Button, Input, Card, Select, etc.
- Используется везде
- Не зависит от фич

**Block (blocks/)** - составной компонент из primitives:
- FormField (Input + Label + Error)
- DataTable (Table + Pagination + Filters)
- StatusBadge (Badge с цветами статусов)

**Feature (features/)** - специфичный для фичи:
- ClientList, UserForm, etc.
- Содержит бизнес-логику
- Используется только в одной фиче

### Шаг 2: Создай компонент

#### Пример: Создание Primitive компонента

```tsx
/**
 * Select Component
 * 
 * A select dropdown component with custom styling.
 * 
 * @example
 * ```tsx
 * <Select>
 *   <option value="1">Option 1</option>
 *   <option value="2">Option 2</option>
 * </Select>
 * ```
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Error message to display */
  error?: string
  /** Label text */
  label?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, id, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="block text-sm font-semibold text-text-primary">
            {label}
            {props.required && <span className="text-error-600 ml-1.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            "flex h-12 w-full rounded-xl border border-input/50 bg-background/50 backdrop-blur-sm px-4 py-3 text-base",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
            error && "border-error-500",
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p className="text-sm text-error-600" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
export default Select
```

#### Пример: Создание Block компонента

```tsx
/**
 * FormField Component
 * 
 * A composed form field with label, input, error, and helper text.
 * 
 * @example
 * ```tsx
 * <FormField
 *   label="Email"
 *   type="email"
 *   error={errors.email?.message}
 *   helperText="We'll never share your email"
 * />
 * ```
 */

import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"

export interface FormFieldProps extends React.ComponentProps<typeof Input> {
  /** Helper text displayed below input */
  helperText?: string
}

export function FormField({ helperText, ...props }: FormFieldProps) {
  return (
    <Input
      {...props}
      helperText={helperText || props.helperText}
    />
  )
}
```

### Шаг 3: Добавь в index.ts

```tsx
// components/ui/index.ts
export { Button } from "./Button"
export { Input } from "./Input"
export { Card } from "./Card"
export { Select } from "./Select" // новый компонент
```

### Шаг 4: Документируй

- ✅ JSDoc комментарии с описанием
- ✅ Примеры использования в @example
- ✅ Описание всех props
- ✅ Accessibility notes

---

## Правила композиции

### 1. Используй primitives для базовых элементов

```tsx
// ✅ Правильно
import { Button, Input, Card } from "@/components/ui"

// ❌ Неправильно
import Button from "@/components/ui/Button" // используй named export
```

### 2. Создавай blocks из primitives

```tsx
// ✅ Правильно - блок использует primitives
import { Input, Button } from "@/components/ui"

export function LoginForm() {
  return (
    <form>
      <Input label="Email" />
      <Input label="Password" type="password" />
      <Button>Login</Button>
    </form>
  )
}

// ❌ Неправильно - блок не должен использовать features
import { ClientList } from "@/components/features/clients" // ❌
```

### 3. Features используют blocks и primitives

```tsx
// ✅ Правильно
import { Card, CardHeader, CardBody } from "@/components/ui"
import { FormField } from "@/components/blocks"

export function ClientForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Information</CardTitle>
      </CardHeader>
      <CardBody>
        <FormField label="Name" />
      </CardBody>
    </Card>
  )
}
```

---

## Best Practices

### 1. Всегда используй forwardRef

```tsx
// ✅ Правильно
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <button ref={ref} className={cn("...", className)} {...props} />
  )
)

// ❌ Неправильно
function Button({ className, ...props }: ButtonProps) {
  return <button className={cn("...", className)} {...props} />
}
```

### 2. Используй cn() для className

```tsx
// ✅ Правильно
import { cn } from "@/lib/utils"

<div className={cn("base-classes", isActive && "active-class", className)} />

// ❌ Неправильно
<div className={`base-classes ${isActive ? "active-class" : ""} ${className}`} />
```

### 3. Поддерживай accessibility

```tsx
// ✅ Правильно
<button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  onClick={handleClick}
>
  <XIcon aria-hidden="true" />
</button>

// ❌ Неправильно
<button onClick={handleClick}>
  <XIcon />
</button>
```

### 4. Используй TypeScript строго

```tsx
// ✅ Правильно
interface ButtonProps {
  variant: "primary" | "secondary"
  size?: "sm" | "md" | "lg"
}

// ❌ Неправильно
interface ButtonProps {
  variant: string // слишком широкий тип
  size?: any // никогда не используй any
}
```

### 5. Документируй компоненты

```tsx
/**
 * Button Component
 * 
 * @example
 * ```tsx
 * <Button variant="primary">Click me</Button>
 * ```
 */
```

---

## Anti-patterns

### ❌ Хардкод значений

```tsx
// ❌ Неправильно
<div className="bg-blue-500 p-6 rounded-lg">

// ✅ Правильно
<div className="bg-primary p-6 rounded-xl">
```

### ❌ Прямые импорты из features в ui/

```tsx
// ❌ Неправильно - ui/Button.tsx
import { useClients } from "@/lib/hooks/useClients" // бизнес-логика в primitive

// ✅ Правильно - features/clients/ClientList.tsx
import { useClients } from "@/lib/hooks/useClients"
```

### ❌ Смешивание уровней

```tsx
// ❌ Неправильно - блок использует feature
import { ClientList } from "@/components/features/clients"

// ✅ Правильно - feature использует блок
import { DataTable } from "@/components/blocks"
```

### ❌ Игнорирование accessibility

```tsx
// ❌ Неправильно
<button onClick={handleClick}>
  <Icon />
</button>

// ✅ Правильно
<button 
  onClick={handleClick}
  aria-label="Close"
  aria-expanded={isOpen}
>
  <Icon aria-hidden="true" />
</button>
```

### ❌ Неиспользование токенов

```tsx
// ❌ Неправильно
<div style={{ padding: "24px", backgroundColor: "#3b82f6" }}>

// ✅ Правильно
<div className="p-6 bg-primary">
```

---

## Accessibility

### Обязательные требования

1. **ARIA атрибуты**
   - `aria-label` для иконок без текста
   - `aria-expanded` для раскрывающихся элементов
   - `aria-invalid` для полей с ошибками
   - `aria-describedby` для связи с helper text

2. **Keyboard navigation**
   - Все интерактивные элементы доступны с клавиатуры
   - Tab порядок логичен
   - Escape закрывает модальные окна

3. **Focus states**
   - Видимый focus ring для всех интерактивных элементов
   - Используй `focus-visible:ring-2 focus-visible:ring-primary-500`

4. **Color contrast**
   - Минимум WCAG 2.1 AA (4.5:1 для текста)
   - Не полагайся только на цвет для передачи информации

### Примеры

```tsx
// ✅ Правильно - доступная кнопка
<button
  aria-label="Delete item"
  onClick={handleDelete}
  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
>
  <TrashIcon aria-hidden="true" />
</button>

// ✅ Правильно - доступное поле ввода
<Input
  label="Email"
  type="email"
  error={errors.email?.message}
  aria-describedby={errors.email ? "email-error" : "email-helper"}
  required
/>
<p id="email-error" role="alert">{errors.email?.message}</p>
```

---

## Полезные ссылки

- **Дизайн-система**: `docs/architecture/SPACING_SYSTEM.md`
- **Frontend архитектура**: `docs/architecture/frontend-architecture.md`
- **Токены**: `apps/web/styles/design-tokens.css`
- **shadcn/ui**: https://ui.shadcn.com/docs
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/

---

**Последнее обновление**: 2025-12-22




