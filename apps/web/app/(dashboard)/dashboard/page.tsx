/**
 * Dashboard Page
 * 
 * Main dashboard page with overview
 */

'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/contexts/auth-context';
import { useClients } from '@/lib/hooks/useClients';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Fetch clients for stats
  const { data: clientsData } = useClients({ page: 1, limit: 1000 });
  const clients = clientsData?.data || [];
  
  // Calculate stats
  const totalClients = clients.length;
  const newLeads = clients.filter(c => c.status === 'NEW_LEAD').length;
  const qualified = clients.filter(c => c.status === 'QUALIFIED').length;
  const sold = clients.filter(c => c.status === 'SOLD').length;

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
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalClients}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              New Leads
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{newLeads}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Qualified
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{qualified}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Sold
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sold}</p>
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
            <Link
              href="/dashboard/clients/new"
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Add New Client
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Create a new client record
              </p>
            </Link>
            <Link
              href="/dashboard/clients"
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                View All Clients
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Browse and manage clients
              </p>
            </Link>
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <Link
                href="/dashboard/users"
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Manage Users
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Add or edit users
                </p>
              </Link>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

