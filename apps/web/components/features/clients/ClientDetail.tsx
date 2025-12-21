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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
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
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </dt>
                  <dd className="mt-1 text-base text-gray-900 dark:text-gray-100">
                    {formatPhone(client.phone)}
                  </dd>
                </div>
                {client.email && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </dt>
                    <dd className="mt-1 text-base text-gray-900 dark:text-gray-100">
                      {client.email}
                    </dd>
                  </div>
                )}
                {client.preferredLanguage && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Preferred Language
                    </dt>
                    <dd className="mt-1 text-base text-gray-900 dark:text-gray-100">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Created
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(client.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Last Updated
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
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

