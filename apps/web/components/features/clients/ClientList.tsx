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
  NEW_LEAD: 'bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-300',
  QUALIFIED: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300',
  WARMED: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300',
  PROPOSAL_SENT: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-300',
  NEGOTIATION: 'bg-warning-200 text-warning-900 dark:bg-warning-800 dark:text-warning-200',
  SOLD: 'bg-success-200 text-success-900 dark:bg-success-800 dark:text-success-200',
  SERVICE: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
  CLOSED: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-300',
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
          <h1 className="text-4xl font-bold text-text-primary mb-4">Clients</h1>
          <p className="text-lg text-text-secondary">
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
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-tertiary" />
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
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
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
            <div className="text-center py-16">
              <User className="h-12 w-12 text-text-tertiary mx-auto mb-6" />
              <h3 className="text-lg font-medium text-text-primary mb-4">
                No clients found
              </h3>
              <p className="text-text-secondary mb-6">
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
          <div className="grid gap-6">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/dashboard/clients/${client.id}`}
                className="block"
              >
                <Card className="hover:shadow-xl transition-all duration-200 cursor-pointer hover:-translate-y-0.5 border-border">
                  <CardBody>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium flex-shrink-0">
                            {client.firstName?.[0] || client.phone[4]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-text-primary truncate mb-2">
                              {client.firstName || client.lastName
                                ? `${client.firstName || ''} ${client.lastName || ''}`.trim()
                                : 'Unnamed Client'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                              <span className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {formatPhone(client.phone)}
                              </span>
                              {client.email && (
                                <span className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  {client.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end gap-3">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            STATUS_COLORS[client.status]
                          )}
                        >
                          {STATUS_LABELS[client.status]}
                        </span>
                        <span className="text-xs text-text-tertiary">
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
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-text-secondary">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of{' '}
                {pagination.total} clients
              </p>
              <div className="flex gap-4">
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

