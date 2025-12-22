/**
 * Header Component
 * 
 * Main header with navigation and user menu
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { Menu, LogOut, User, Settings } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useState } from 'react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-xl shadow-sm">
      <div className="flex h-16 items-center px-6 sm:px-8 lg:px-10">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl hover:bg-surface-hover transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6 text-text-secondary" />
        </button>

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 ml-4 md:ml-0">
          <span className="text-xl font-bold bg-gradient-to-br from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Soul KG CRM
          </span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Theme toggle */}
        <div className="mr-3">
          <ThemeToggle />
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-hover transition-all duration-200 hover:scale-105 active:scale-95 group"
            aria-label="User menu"
            aria-expanded={showUserMenu}
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-sm font-semibold shadow-md shadow-primary/30 group-hover:shadow-lg group-hover:shadow-primary/40 transition-shadow duration-200">
              {user?.firstName?.[0] || user?.email[0].toUpperCase()}
            </div>
            <span className="hidden md:block text-sm font-medium text-text-primary">
              {user?.firstName || user?.email}
            </span>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl shadow-xl bg-background/95 backdrop-blur-xl border border-border/50 py-3 z-50 overflow-hidden">
                <div className="px-5 py-5 border-b border-border/50 bg-gradient-to-r from-primary-50/50 to-secondary-50/50 dark:from-primary-950/30 dark:to-secondary-950/30">
                  <p className="text-sm font-semibold text-text-primary">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {user?.role}
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-5 py-4 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-all duration-200"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-5 py-4 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/30 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

