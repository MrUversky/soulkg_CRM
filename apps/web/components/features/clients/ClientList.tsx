/**
 * ClientList Component
 * 
 * List of clients with filtering, sorting, and pagination
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useClients } from '@/lib/hooks/useClients';
import { ClientStatus } from '@/types/client';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Search, Plus, Phone, Mail, User } from 'lucide-react';
import { formatPhone, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<ClientStatus, string> = {
  NEW_LEAD: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  QUALIFIED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  WARMED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  PROPOSAL_SENT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  NEGOTIATION: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  SOLD: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  SERVICE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const STATUS_LABELS: Record<ClientStatus, string> = {
  NEW_LEAD: 'New Lead',
  QUALIFIED: 'Qualified',
  WARMED: 'Warmed',
  PROPOSAL_SENT: 'Proposal Sent',
  NEGOTIATION: 'Negotiation',
  SOLD: 'Sold',
  SERVICE: 'Service',
  CLOSED: 'Closed',
};

export default function ClientList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | ''>('');
  const limit = 20;

  const { data, isLoading, error } = useClients({
    page,
    limit,
    search: search || undefined,
    status: statusFilter || undefined,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  const clients = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Clients</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Manage your clients and track their journey through the sales funnel
          </p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button variant="primary" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add Client
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ClientStatus | '');
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">
                Failed to load clients. Please try again.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && clients.length === 0 && (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No clients found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {search || statusFilter
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first client'}
              </p>
              {!search && !statusFilter && (
                <Link href="/dashboard/clients/new">
                  <Button variant="primary">Add Client</Button>
                </Link>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Client List */}
      {!isLoading && !error && clients.length > 0 && (
        <>
          <div className="grid gap-4">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/dashboard/clients/${client.id}`}
                className="block"
              >
                <Card className="hover:shadow-xl transition-all duration-200 cursor-pointer hover:-translate-y-0.5 border-gray-200 dark:border-gray-700">
                  <CardBody className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                            {client.firstName?.[0] || client.phone[4]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {client.firstName || client.lastName
                                ? `${client.firstName || ''} ${client.lastName || ''}`.trim()
                                : 'Unnamed Client'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {formatPhone(client.phone)}
                              </span>
                              {client.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-4 w-4" />
                                  {client.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            STATUS_COLORS[client.status]
                          )}
                        >
                          {STATUS_LABELS[client.status]}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Updated {formatRelativeTime(client.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of{' '}
                {pagination.total} clients
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

