/**
 * UserList Component
 * 
 * List of users in the organization (ADMIN only)
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUsers, useDeactivateUser } from '@/lib/hooks/useUsers';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Plus, Mail, User as UserIcon, Shield, UserCheck, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/contexts/auth-context';

const ROLE_COLORS = {
  SUPER_ADMIN: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-300',
  ADMIN: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
  MANAGER: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-300',
};

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
};

export default function UserList() {
  const { user: currentUser } = useAuth();
  const { data, isLoading, error } = useUsers();
  const deactivateMutation = useDeactivateUser();
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const users = data?.data || [];

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    try {
      setDeactivatingId(id);
      await deactivateMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      alert('Failed to deactivate user. Please try again.');
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-4">Users</h1>
          <p className="text-lg text-text-secondary">
            Manage users in your organization
          </p>
        </div>
        <Link href="/dashboard/users/new">
          <Button variant="primary" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add User
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
          <CardBody>
            <div className="text-center py-12">
              <p className="text-error-600 dark:text-error-400">
                Failed to load users. Please try again.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && users.length === 0 && (
        <Card>
          <CardBody>
            <div className="text-center py-16">
              <UserIcon className="h-12 w-12 text-text-tertiary mx-auto mb-6" />
              <h3 className="text-lg font-medium text-text-primary mb-4">
                No users found
              </h3>
              <p className="text-text-secondary mb-6">
                Get started by adding your first user
              </p>
              <Link href="/dashboard/users/new">
                <Button variant="primary">Add User</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      {/* User List */}
      {!isLoading && !error && users.length > 0 && (
        <div className="grid gap-6">
          {users.map((user) => (
            <Card key={user.id}>
              <CardBody>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  <div className="flex items-start gap-4 flex-1">
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
                            Inactive
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
                            Last login: {formatDate(user.lastLoginAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link href={`/dashboard/users/${user.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    {user.id !== currentUser?.id && user.isActive && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeactivate(user.id)}
                        isLoading={deactivatingId === user.id}
                        disabled={deactivatingId === user.id}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Deactivate
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

