/**
 * Dashboard Page
 * 
 * Main dashboard page with overview
 */

'use client';

import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's what's happening with your CRM today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              New Leads
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Qualified
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Sold
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/dashboard/clients/new"
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Add New Client
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Create a new client record
              </p>
            </a>
            <a
              href="/dashboard/clients"
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                View All Clients
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Browse and manage clients
              </p>
            </a>
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <a
                href="/dashboard/users"
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Manage Users
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Add or edit users
                </p>
              </a>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

