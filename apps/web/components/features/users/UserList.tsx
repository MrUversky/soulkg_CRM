/**
 * UserList Component
 * 
 * List of users in the organization (ADMIN only)
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUsers, useDeactivateUser } from '@/lib/hooks/useUsers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Plus, Mail, User as UserIcon, Shield, UserCheck, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { useLocale, useTranslations } from 'next-intl';

const ROLE_COLORS = {
  SUPER_ADMIN: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-300',
  ADMIN: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
  MANAGER: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-300',
};

export default function UserList() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const locale = useLocale();
  const t = useTranslations();
  const { data, isLoading, error } = useUsers();
  const deactivateMutation = useDeactivateUser();
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const users = data?.data || [];

  // Create ROLE_LABELS dynamically using translations
  const ROLE_LABELS = {
    SUPER_ADMIN: t('users.roles.SUPER_ADMIN'),
    ADMIN: t('users.roles.ADMIN'),
    MANAGER: t('users.roles.MANAGER'),
  };

  useEffect(() => {
    if (error) {
      toast({
        title: t('common.error'),
        description: t('users.failedToLoadUsers'),
        variant: "error",
      });
    }
  }, [error, toast, t]);

  const handleDeactivate = async (id: string) => {
    if (!confirm(t('users.confirmDeactivate'))) {
      return;
    }

    try {
      setDeactivatingId(id);
      await deactivateMutation.mutateAsync(id);
      toast({
        title: t('common.success'),
        description: t('users.userDeactivated'),
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('users.failedToDeactivate'),
        variant: "error",
      });
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-6">{t('users.title')}</h1>
          <p className="text-lg text-text-secondary">
            {t('users.manageUsers')}
          </p>
        </div>
        <Link href="/dashboard/users/new">
          <Button variant="default" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            {t('users.addUser')}
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-error-600 dark:text-error-400">
                {t('users.failedToLoadUsers')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && users.length === 0 && (
        <Card>
          <CardContent>
            <div className="text-center py-16">
              <UserIcon className="h-12 w-12 text-text-tertiary mx-auto mb-6" />
              <h3 className="text-lg font-medium text-text-primary mb-4">
                {t('users.noUsersFound')}
              </h3>
              <p className="text-text-secondary mb-6">
                {t('users.getStartedAddingUser')}
              </p>
              <Link href="/dashboard/users/new">
                <Button variant="default">{t('users.addUser')}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User List */}
      {!isLoading && !error && users.length > 0 && (
        <div className="grid gap-6">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="py-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  <div className="flex items-start gap-5 flex-1">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium flex-shrink-0">
                      {user.firstName?.[0] || user.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-text-primary">
                          {user.firstName || user.lastName
                            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                            : user.email}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ROLE_COLORS[user.role]
                          }`}
                        >
                          {ROLE_LABELS[user.role]}
                        </span>
                        {!user.isActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-300">
                            {t('users.inactive')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </span>
                        {user.lastLoginAt && (
                          <span className="text-xs">
                            {t('users.lastLogin')}: {formatDate(user.lastLoginAt, locale)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link href={`/dashboard/users/${user.id}/edit`}>
                      <Button variant="outline" size="sm">
                        {t('users.edit')}
                      </Button>
                    </Link>
                    {user.id !== currentUser?.id && user.isActive && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeactivate(user.id)}
                        isLoading={deactivatingId === user.id}
                        disabled={deactivatingId === user.id}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t('users.deactivate')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

