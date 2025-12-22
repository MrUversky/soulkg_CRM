/**
 * ClientDetail Component
 * 
 * Detailed view of a client with edit capabilities
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClient, useUpdateClientStatus } from '@/lib/hooks/useClients';
import { ClientStatus } from '@/types/client';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, Phone, Mail, User, Calendar, Edit } from 'lucide-react';
import { formatPhone, formatDate } from '@/lib/utils';
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

interface ClientDetailProps {
  clientId: string;
}

export default function ClientDetail({ clientId }: ClientDetailProps) {
  const router = useRouter();
  const { data: client, isLoading, error } = useClient(clientId);
  const updateStatusMutation = useUpdateClientStatus();
  const [selectedStatus, setSelectedStatus] = useState<ClientStatus | ''>('');

  const handleStatusChange = async (newStatus: ClientStatus) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: clientId,
        status: newStatus,
      });
      setSelectedStatus('');
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <p className="text-error-600 dark:text-error-400">
              Failed to load client. Please try again.
            </p>
            <Link href="/dashboard/clients">
              <Button variant="outline" className="mt-4">
                Back to Clients
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-text-primary">
            {client.firstName || client.lastName
              ? `${client.firstName || ''} ${client.lastName || ''}`.trim()
              : 'Unnamed Client'}
          </h1>
        </div>
        <Link href={`/dashboard/clients/${clientId}/edit`}>
          <Button variant="primary">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-text-tertiary flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </dt>
                  <dd className="mt-1 text-base text-text-primary">
                    {formatPhone(client.phone)}
                  </dd>
                </div>
                {client.email && (
                  <div>
                    <dt className="text-sm font-medium text-text-tertiary flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </dt>
                    <dd className="mt-1 text-base text-text-primary">
                      {client.email}
                    </dd>
                  </div>
                )}
                {client.preferredLanguage && (
                  <div>
                    <dt className="text-sm font-medium text-text-tertiary">
                      Preferred Language
                    </dt>
                    <dd className="mt-1 text-base text-text-primary">
                      {client.preferredLanguage.toUpperCase()}
                    </dd>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Current Status
                  </label>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                        STATUS_COLORS[client.status]
                      )}
                    >
                      {STATUS_LABELS[client.status]}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Change Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(STATUS_LABELS) as ClientStatus[]).map((status) => (
                      <Button
                        key={status}
                        variant={client.status === status ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusChange(status)}
                        disabled={updateStatusMutation.isPending || client.status === status}
                      >
                        {STATUS_LABELS[status]}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-text-tertiary flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Created
                  </dt>
                  <dd className="mt-1 text-sm text-text-primary">
                    {formatDate(client.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-text-tertiary">
                    Last Updated
                  </dt>
                  <dd className="mt-1 text-sm text-text-primary">
                    {formatDate(client.updatedAt)}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

