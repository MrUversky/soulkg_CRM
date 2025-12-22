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
          'fixed top-0 left-0 z-50 h-full w-64 bg-background/95 backdrop-blur-sm border-r border-border shadow-lg transform transition-transform duration-300 ease-in-out',
          'md:translate-x-0 md:static md:z-auto md:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile header */}
          <div className="flex items-center justify-between p-6 border-b border-border md:hidden">
            <span className="text-lg font-bold text-text-primary">
              Menu
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-hover transition-colors duration-200"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : 'text-text-secondary hover:bg-surface-hover hover:shadow-sm'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}

