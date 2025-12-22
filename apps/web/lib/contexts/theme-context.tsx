'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Load theme from localStorage first
    let savedTheme: Theme | null = null;
    try {
      savedTheme = localStorage.getItem('theme') as Theme | null;
    } catch (e) {
      // localStorage might not be available
    }
    
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
    
    // Apply initial theme immediately
    const root = window.document.documentElement;
    const initialTheme = savedTheme && ['light', 'dark', 'system'].includes(savedTheme) 
      ? savedTheme 
      : 'system';
    
    let effectiveTheme: 'light' | 'dark';
    if (initialTheme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      effectiveTheme = initialTheme;
    }
    
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
    root.setAttribute('data-theme', effectiveTheme);
    setResolvedTheme(effectiveTheme);
    
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    let effectiveTheme: 'light' | 'dark';

    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      effectiveTheme = theme;
    }

    setResolvedTheme(effectiveTheme);
    root.classList.add(effectiveTheme);
    root.setAttribute('data-theme', effectiveTheme);
    
    // Save to localStorage
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      // localStorage might not be available
    }
    
    // Force reflow to ensure classes are applied
    root.offsetHeight;
  }, [theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== 'system' || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      const effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
      setResolvedTheme(effectiveTheme);
      root.classList.add(effectiveTheme);
      root.setAttribute('data-theme', effectiveTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Always provide context, but only apply classes after mount
  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

