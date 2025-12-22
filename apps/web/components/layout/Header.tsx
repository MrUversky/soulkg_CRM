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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm shadow-sm">
      <div className="flex h-16 items-center px-6 md:px-8">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-surface-hover transition-colors duration-200"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-4">
          <span className="text-xl font-bold text-text-primary">
            Soul KG CRM
          </span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-hover transition-colors duration-200"
            aria-label="User menu"
            aria-expanded={showUserMenu}
          >
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
              {user?.firstName?.[0] || user?.email[0].toUpperCase()}
            </div>
            <span className="hidden md:block text-sm font-medium text-text-secondary">
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
              <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-background border border-border py-2 z-50">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-text-primary">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {user?.role}
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-surface-hover transition-colors duration-200"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-error-600 dark:text-error-400 hover:bg-surface-hover transition-colors duration-200"
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

