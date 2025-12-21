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
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Here's what's happening with your CRM today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="elevated" className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{totalClients}</p>
          </CardBody>
        </Card>

        <Card variant="elevated" className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              New Leads
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{newLeads}</p>
          </CardBody>
        </Card>

        <Card variant="elevated" className="border-l-4 border-l-yellow-500">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Qualified
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{qualified}</p>
          </CardBody>
        </Card>

        <Card variant="elevated" className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Sold
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{sold}</p>
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/dashboard/clients/new"
              className="group p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:shadow-lg"
            >
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Add New Client
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a new client record
              </p>
            </Link>
            <Link
              href="/dashboard/clients"
              className="group p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:shadow-lg"
            >
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                View All Clients
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Browse and manage clients
              </p>
            </Link>
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <Link
                href="/dashboard/users"
                className="group p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:shadow-lg"
              >
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Manage Users
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
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

