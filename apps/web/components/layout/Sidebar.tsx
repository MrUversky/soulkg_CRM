/**
 * Sidebar Component
 * 
 * Navigation sidebar for dashboard
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Settings,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Clients',
    href: '/dashboard/clients',
    icon: Users,
  },
  {
    name: 'Users',
    href: '/dashboard/users',
    icon: UserCheck,
    adminOnly: true,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    adminOnly: true,
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-background/95 backdrop-blur-xl border-r border-border/50 shadow-xl transform transition-transform duration-300 ease-in-out',
          'md:translate-x-0 md:static md:z-auto md:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="px-6 py-6 border-b border-border/50">
            <h2 className="text-xl font-bold text-text-primary">Soul KG CRM</h2>
          </div>

          {/* Mobile header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 md:hidden">
            <span className="text-lg font-semibold text-text-primary">
              Menu
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-surface-hover transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-text-secondary" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-6 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-5 py-3.5 rounded-xl text-base font-medium transition-all duration-300 ease-spring',
                    'group relative',
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary/30 scale-[1.02]'
                      : 'text-text-secondary hover:bg-surface-hover/80 hover:text-text-primary hover:shadow-md hover:scale-[1.01]'
                  )}
                >
                  <Icon className={cn(
                    'h-5 w-5 transition-transform duration-300',
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  )} />
                  <span>{item.name}</span>
                  {isActive && (
                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white/80" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}

