# Design System: Soul KG CRM

> **Версия**: 1.0  
> **Дата создания**: 2025-12-22  
> **Статус**: Активная разработка

## 🎯 Принципы дизайн-системы

### Основные принципы

1. **Консистентность**: Единые токены для всех компонентов
2. **Доступность**: WCAG 2.1 AA стандарты
3. **Масштабируемость**: Легко расширяемая система
4. **Темная/светлая тема**: Поддержка обеих тем из коробки
5. **4px Grid**: Все spacing основаны на 4px сетке

### Правила использования

✅ **DO:**
- Использовать CSS переменные: `var(--color-primary-600)`
- Использовать Tailwind классы: `bg-primary-600`
- Следовать системе токенов
- Проверять контрастность цветов (минимум 4.5:1)

❌ **DON'T:**
- Хардкодить цвета: `color: #3b82f6` ❌
- Хардкодить spacing: `padding: 16px` ❌
- Использовать произвольные значения
- Игнорировать accessibility требования

---

## 🎨 Цветовая палитра

### Primary (Blue)

Основной цвет бренда для акцентов, кнопок, ссылок.

```css
--color-primary-50: #eff6ff;   /* Lightest - backgrounds */
--color-primary-100: #dbeafe;
--color-primary-200: #bfdbfe;
--color-primary-300: #93c5fd;
--color-primary-400: #60a5fa;
--color-primary-500: #3b82f6;  /* Base */
--color-primary-600: #2563eb;  /* Default (light theme) */
--color-primary-700: #1d4ed8;  /* Hover */
--color-primary-800: #1e40af;
--color-primary-900: #1e3a8a;
--color-primary-950: #172554;  /* Darkest */
```

**Использование:**
- `primary-600`: Основные кнопки, ссылки (light theme)
- `primary-500`: Основные кнопки, ссылки (dark theme)
- `primary-50`: Фоновые акценты
- `primary-700`: Hover состояния

**Примеры:**
```tsx
// Tailwind
<button className="bg-primary-600 hover:bg-primary-700 text-white">

// CSS
.button { background-color: var(--color-primary-600); }
```

### Secondary (Purple)

Вторичный цвет для дополнительных акцентов.

```css
--color-secondary-50: #faf5ff;
--color-secondary-500: #a855f7;
--color-secondary-600: #9333ea;  /* Default */
--color-secondary-700: #7e22ce;  /* Hover */
```

**Использование:** Вторичные кнопки, акценты, badges

### Neutral (Gray)

Нейтральные цвета для текста, фонов, границ.

```css
--color-neutral-50: #f9fafb;   /* Lightest backgrounds */
--color-neutral-100: #f3f4f6;
--color-neutral-200: #e5e7eb;  /* Borders (light) */
--color-neutral-300: #d1d5db;
--color-neutral-400: #9ca3af;
--color-neutral-500: #6b7280;  /* Muted text */
--color-neutral-600: #4b5563;  /* Secondary text */
--color-neutral-700: #374151;
--color-neutral-800: #1f2937;
--color-neutral-900: #111827;  /* Primary text (light) */
--color-neutral-950: #030712;
```

**Использование:**
- `neutral-900`: Основной текст (light theme)
- `neutral-600`: Вторичный текст
- `neutral-500`: Приглушенный текст
- `neutral-200`: Границы (light theme)
- `neutral-50`: Фоны

### Semantic Colors

#### Success (Green)
```css
--color-success-500: #22c55e;  /* Base */
--color-success-600: #16a34a;  /* Default */
--color-success-700: #15803d;  /* Hover */
```

**Использование:** Успешные действия, положительные статусы, success messages

#### Warning (Amber)
```css
--color-warning-500: #f59e0b;  /* Default */
--color-warning-600: #d97706;  /* Hover */
```

**Использование:** Предупреждения, pending статусы

#### Error (Red)
```css
--color-error-500: #ef4444;  /* Base */
--color-error-600: #dc2626;  /* Default */
--color-error-700: #b91c1c;  /* Hover */
```

**Использование:** Ошибки, удаление, опасные действия

#### Info (Blue)
```css
--color-info-500: #3b82f6;  /* Default */
--color-info-600: #2563eb;  /* Hover */
```

**Использование:** Информационные сообщения, подсказки

---

## 📝 Типографика

### Шрифты

```css
--font-sans: 'Inter', system-ui, sans-serif;  /* Основной */
--font-mono: 'JetBrains Mono', monospace;     /* Код */
```

### Размеры шрифтов

```css
--text-xs: 0.75rem;      /* 12px - Captions, labels */
--text-sm: 0.875rem;     /* 14px - Small text, helper text */
--text-base: 1rem;       /* 16px - Body text (default) */
--text-lg: 1.125rem;     /* 18px - Large body */
--text-xl: 1.25rem;      /* 20px - Small headings */
--text-2xl: 1.5rem;      /* 24px - H3 */
--text-3xl: 1.875rem;    /* 30px - H2 */
--text-4xl: 2.25rem;     /* 36px - H1 */
--text-5xl: 3rem;        /* 48px - Display */
--text-6xl: 3.75rem;     /* 60px - Large display */
```

### Веса шрифтов

```css
--font-light: 300;
--font-normal: 400;      /* Default */
--font-medium: 500;      /* Emphasis */
--font-semibold: 600;    /* Headings */
--font-bold: 700;        /* Strong emphasis */
```

### Line Height

```css
--leading-none: 1;       /* Tight */
--leading-tight: 1.25;    /* Headings */
--leading-snug: 1.375;
--leading-normal: 1.5;    /* Default body */
--leading-relaxed: 1.625;
--leading-loose: 2;       /* Spacious */
```

### Иерархия заголовков

```tsx
// H1 - Главный заголовок страницы
<h1 className="text-4xl font-bold leading-tight text-text-primary">

// H2 - Разделы
<h2 className="text-3xl font-semibold leading-tight text-text-primary">

// H3 - Подразделы
<h3 className="text-2xl font-semibold leading-snug text-text-primary">

// H4 - Мелкие заголовки
<h4 className="text-xl font-medium leading-snug text-text-primary">

// Body - Основной текст
<p className="text-base leading-normal text-text-primary">

// Small - Вспомогательный текст
<span className="text-sm leading-normal text-text-secondary">

// Caption - Подписи, метки
<span className="text-xs leading-normal text-text-muted">
```

---

## 📏 Spacing (4px Grid System)

Все отступы основаны на 4px сетке для консистентности.

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px - Default */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

### Использование

```tsx
// Tailwind
<div className="p-4">        {/* padding: 1rem */}
<div className="m-6">        {/* margin: 1.5rem */}
<div className="gap-4">      {/* gap: 1rem */}

// CSS
.container { padding: var(--space-4); }
```

### Рекомендации

- **Компоненты**: `p-4` или `p-6` (16px-24px)
- **Секции**: `py-8` или `py-12` (32px-48px)
- **Элементы формы**: `gap-4` (16px)
- **Карточки**: `p-6` (24px)

---

## 🔲 Border Radius

```css
--radius-none: 0;
--radius-sm: 0.25rem;   /* 4px - Small elements */
--radius-md: 0.375rem;   /* 6px - Default */
--radius-lg: 0.5rem;     /* 8px - Buttons, inputs */
--radius-xl: 0.75rem;    /* 12px - Cards */
--radius-2xl: 1rem;      /* 16px - Large cards */
--radius-3xl: 1.5rem;    /* 24px - Extra large */
--radius-full: 9999px;    /* Pills, avatars */
```

### Использование

```tsx
// Buttons
<button className="rounded-lg">      {/* 8px */}

// Cards
<Card className="rounded-xl">       {/* 12px */}

// Inputs
<input className="rounded-lg">      {/* 8px */}

// Badges, Pills
<span className="rounded-full">     {/* Full */}
```

---

## 🌑 Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);           /* Subtle */
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), ...;    /* Default */
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), ...;  /* Elevated */
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), ...;  /* High */
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);    /* Highest */
--shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);  /* Inset */
```

### Использование

```tsx
// Cards (default)
<Card className="shadow-md">

// Elevated cards
<Card className="shadow-lg hover:shadow-xl">

// Buttons
<button className="shadow-sm hover:shadow-md">

// Modals
<Modal className="shadow-2xl">
```

---

## ⚡ Transitions & Animations

### Durations

```css
--duration-fast: 150ms;    /* Micro interactions */
--duration-base: 200ms;    /* Default */
--duration-slow: 300ms;    /* Smooth transitions */
--duration-slower: 500ms;  /* Page transitions */
```

### Easing

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);  /* Default */
```

### Использование

```tsx
// Tailwind (встроенные)
<button className="transition-all duration-200 ease-in-out">

// CSS
.button {
  transition: all var(--transition-base);
}
```

---

## 🎭 Темы (Light/Dark)

### Light Theme (Default)

```css
--color-background: #ffffff;
--color-surface: #ffffff;
--color-text-primary: #111827;
--color-text-secondary: #6b7280;
--color-border: #e5e7eb;
```

### Dark Theme

Автоматически применяется через `@media (prefers-color-scheme: dark)`:

```css
--color-background: #0f172a;
--color-surface: #1e293b;
--color-text-primary: #f1f5f9;
--color-text-secondary: #cbd5e1;
--color-border: #334155;
```

### Использование

Темы переключаются автоматически на основе системных настроек пользователя. Все компоненты должны работать в обеих темах.

```tsx
// Компоненты автоматически адаптируются
<Card className="bg-surface text-text-primary border-border">
```

---

## 📐 Breakpoints

```css
sm: 640px   /* Mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Wide Desktop */
2xl: 1536px /* Extra Wide */
```

### Mobile First Approach

```tsx
// Начинаем с mobile, затем расширяем
<div className="
  grid 
  grid-cols-1          /* Mobile: 1 колонка */
  md:grid-cols-2       /* Tablet: 2 колонки */
  lg:grid-cols-3       /* Desktop: 3 колонки */
  gap-4
">
```

---

## ♿ Accessibility

### Color Contrast

- **Обычный текст**: Минимум 4.5:1
- **Крупный текст**: Минимум 3:1
- **Интерактивные элементы**: Минимум 3:1

### Focus States

Все интерактивные элементы должны иметь видимый focus indicator:

```css
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### Touch Targets

Минимальный размер для touch элементов: **44x44px**

---

## 📚 Примеры использования

### Кнопка

```tsx
<button className="
  bg-primary-600 
  hover:bg-primary-700 
  text-white 
  px-4 py-2 
  rounded-lg 
  font-medium
  transition-colors duration-200
  focus-visible:outline-2 focus-visible:outline-primary-500
">
  Click me
</button>
```

### Карточка

```tsx
<Card className="
  bg-surface 
  border border-border 
  rounded-xl 
  p-6 
  shadow-md 
  hover:shadow-lg 
  transition-shadow duration-200
">
  <h3 className="text-2xl font-semibold text-text-primary mb-2">
    Title
  </h3>
  <p className="text-base text-text-secondary">
    Content
  </p>
</Card>
```

### Input

```tsx
<input className="
  w-full 
  px-3 py-2 
  bg-surface 
  border border-border 
  rounded-lg 
  text-text-primary 
  placeholder:text-text-muted
  focus:outline-none 
  focus:ring-2 
  focus:ring-primary-500 
  focus:border-transparent
  transition-all duration-200
" />
```

---

## 🔄 Миграция с хардкода

### ❌ Плохо

```tsx
<div className="bg-blue-600 text-white p-4 rounded-lg">
  {/* Хардкод цветов и spacing */}
</div>
```

### ✅ Хорошо

```tsx
<div className="bg-primary-600 text-white p-4 rounded-lg">
  {/* Использование токенов */}
</div>
```

---

## 📖 Дополнительные ресурсы

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**Последнее обновление**: 2025-12-22




