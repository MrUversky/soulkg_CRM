/**
 * ClientList Component
 * 
 * List of clients with filtering, sorting, and pagination
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useClients } from '@/lib/hooks/useClients';
import { ClientStatus } from '@/types/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Search, Plus, Phone, Mail, User, LayoutGrid } from 'lucide-react';
import { formatPhone, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();

  // Восстановление позиции скролла при возврате
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('clients-list-scroll');
    if (savedScroll) {
      const scrollPosition = parseInt(savedScroll, 10);
      // Используем setTimeout для восстановления после рендера
      setTimeout(() => {
        window.scrollTo({ top: scrollPosition, behavior: 'instant' });
        sessionStorage.removeItem('clients-list-scroll');
      }, 0);
    }
  }, []);

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

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load clients. Please try again.",
        variant: "error",
      });
    }
  }, [error, toast]);

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-3 sm:mb-4 md:mb-6 leading-tight">Clients</h1>
          <p className="text-sm sm:text-base lg:text-lg text-text-secondary leading-relaxed">
            Manage your clients and track their journey through the sales funnel
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0">
          <Link href="/dashboard/clients/kanban" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
              <span className="hidden sm:inline">Kanban View</span>
              <span className="sm:hidden">Kanban</span>
            </Button>
          </Link>
          <Link href="/dashboard/clients/new" className="w-full sm:w-auto">
            <Button variant="default" size="lg" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
              <span className="hidden sm:inline">Add Client</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-text-muted" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 sm:pl-11 text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="w-full sm:w-52 flex-shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ClientStatus | '');
                  setPage(1);
                }}
                className="w-full h-10 sm:h-12 px-3 sm:px-4 py-2 text-sm sm:text-base border border-border rounded-lg sm:rounded-xl bg-background/50 backdrop-blur-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
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
        </CardContent>
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
          <CardContent>
            <div className="text-center py-12">
              <p className="text-error-600 dark:text-error-400">
                Failed to load clients. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && clients.length === 0 && (
        <Card>
          <CardContent>
            <div className="text-center py-16">
              <User className="h-12 w-12 text-text-muted mx-auto mb-6" />
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
                  <Button variant="default">Add Client</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client List */}
      {!isLoading && !error && clients.length > 0 && (
        <>
          <div className="grid gap-3 sm:gap-4">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/dashboard/clients/${client.id}?from=list`}
                className="block"
                onClick={() => {
                  // Сохраняем позицию скролла окна перед переходом
                  sessionStorage.setItem('clients-list-scroll', window.scrollY.toString());
                }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 ease-spring cursor-pointer hover:-translate-y-1 border-border/50 group">
                  <CardContent className="py-4 sm:py-6 lg:py-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-base sm:text-lg flex-shrink-0 shadow-md shadow-primary/30 group-hover:shadow-lg group-hover:shadow-primary/40 transition-shadow duration-300">
                            {client.firstName?.[0] || client.phone[4]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-text-primary truncate mb-1.5 sm:mb-2 group-hover:text-primary transition-colors duration-200">
                              {client.firstName || client.lastName
                                ? `${client.firstName || ''} ${client.lastName || ''}`.trim()
                                : 'Unnamed Client'}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-text-secondary">
                              <span className="flex items-center gap-1.5 sm:gap-2">
                                <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">{formatPhone(client.phone)}</span>
                              </span>
                              {client.email && (
                                <span className="flex items-center gap-1.5 sm:gap-2">
                                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span className="truncate max-w-[200px] sm:max-w-none">{client.email}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col sm:items-end items-center justify-between sm:justify-end gap-2 sm:gap-3 sm:pl-4 flex-shrink-0">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold',
                            STATUS_COLORS[client.status]
                          )}
                        >
                          {STATUS_LABELS[client.status]}
                        </span>
                        <span className="text-xs text-text-muted whitespace-nowrap">
                          Updated {formatRelativeTime(client.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4">
              <p className="text-xs sm:text-sm text-text-secondary text-center sm:text-left">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of{' '}
                {pagination.total} clients
              </p>
              <div className="flex gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex-1 sm:flex-none"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="flex-1 sm:flex-none"
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

