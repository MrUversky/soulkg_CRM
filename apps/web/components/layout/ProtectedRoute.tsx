/**
 * Protected Route Component
 * 
 * Wrapper component that protects routes requiring authentication
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'ADMIN' | 'MANAGER' | 'SUPER_ADMIN';
}

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && requireRole && user) {
      const roleHierarchy = {
        SUPER_ADMIN: 3,
        ADMIN: 2,
        MANAGER: 1,
      };

      const userRoleLevel = roleHierarchy[user.role] || 0;
      const requiredRoleLevel = roleHierarchy[requireRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, user, requireRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireRole && user) {
    const roleHierarchy = {
      SUPER_ADMIN: 3,
      ADMIN: 2,
      MANAGER: 1,
    };

    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requireRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Access Denied
            </h1>
            <p className="text-text-secondary">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

