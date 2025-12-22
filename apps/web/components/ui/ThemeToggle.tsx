'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/lib/contexts/theme-context';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown';
  className?: string;
}

export function ThemeToggle({ variant = 'button', className }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn('h-10 w-10 rounded-lg bg-background-subtle', className)} />
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <button
          onClick={() => setTheme('light')}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
            theme === 'light'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'text-text-secondary hover:bg-background-subtle hover:text-text-primary'
          )}
        >
          <Sun className="w-4 h-4" />
          <span>Light</span>
          {theme === 'light' && (
            <div className="ml-auto w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400" />
          )}
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
            theme === 'dark'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'text-text-secondary hover:bg-background-subtle hover:text-text-primary'
          )}
        >
          <Moon className="w-4 h-4" />
          <span>Dark</span>
          {theme === 'dark' && (
            <div className="ml-auto w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400" />
          )}
        </button>
        <button
          onClick={() => setTheme('system')}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
            theme === 'system'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'text-text-secondary hover:bg-background-subtle hover:text-text-primary'
          )}
        >
          <Monitor className="w-4 h-4" />
          <span>System</span>
          {theme === 'system' && (
            <div className="ml-auto w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400" />
          )}
        </button>
      </div>
    );
  }

  // Button variant - cycles through themes
  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 h-10 w-10 rounded-lg',
        'bg-background-subtle hover:bg-background-hover',
        'border border-border/50 hover:border-primary/50',
        'text-text-secondary hover:text-text-primary',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
    >
      <Sun className="w-5 h-5 absolute transition-all duration-300 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      <Moon className="w-5 h-5 absolute transition-all duration-300 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

