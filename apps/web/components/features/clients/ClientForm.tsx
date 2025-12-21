/**
 * ClientForm Component
 * 
 * Form for creating and editing clients
 */

'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useClient, useCreateClient, useUpdateClient } from '@/lib/hooks/useClients';
import { ClientStatus } from '@/types/client';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const clientSchema = z.object({
  phone: z.string().regex(/^\+996\d{9}$/, 'Phone must be in format +996XXXXXXXXX'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  status: z.enum([
    'NEW_LEAD',
    'QUALIFIED',
    'WARMED',
    'PROPOSAL_SENT',
    'NEGOTIATION',
    'SOLD',
    'SERVICE',
    'CLOSED',
  ]).optional(),
  preferredLanguage: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  clientId?: string;
}

export default function ClientForm({ clientId }: ClientFormProps) {
  const router = useRouter();
  const isEdit = !!clientId;
  const { data: client, isLoading: isLoadingClient } = useClient(clientId || '');
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: isEdit && client
      ? {
          phone: client.phone,
          email: client.email || '',
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          status: client.status,
          preferredLanguage: client.preferredLanguage || '',
        }
      : {
          status: 'NEW_LEAD',
        },
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: clientId!,
          data: {
            email: data.email || undefined,
            firstName: data.firstName || undefined,
            lastName: data.lastName || undefined,
            status: data.status,
            preferredLanguage: data.preferredLanguage || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          phone: data.phone,
          email: data.email || undefined,
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
          status: data.status,
          preferredLanguage: data.preferredLanguage || undefined,
        });
      }
      router.push('/dashboard/clients');
    } catch (error: any) {
      console.error('Failed to save client:', error);
    }
  };

  if (isEdit && isLoadingClient) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Client' : 'Add New Client'}
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            {!isEdit && (
              <Input
                label="Phone"
                placeholder="+996555123456"
                {...register('phone')}
                error={errors.phone?.message}
                helperText="Format: +996XXXXXXXXX"
                required
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="John"
                {...register('firstName')}
                error={errors.firstName?.message}
              />

              <Input
                label="Last Name"
                placeholder="Doe"
                {...register('lastName')}
                error={errors.lastName?.message}
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="client@example.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NEW_LEAD">New Lead</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="WARMED">Warmed</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="SOLD">Sold</option>
                <option value="SERVICE">Service</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <Input
              label="Preferred Language"
              placeholder="en, ru, kg"
              {...register('preferredLanguage')}
              error={errors.preferredLanguage?.message}
              helperText="Language code (e.g., en, ru, kg)"
            />
          </CardBody>
          <CardFooter>
            <div className="flex gap-4 w-full">
              <Link href="/dashboard/clients" className="flex-1">
                <Button variant="outline" fullWidth>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={createMutation.isPending || updateMutation.isPending}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEdit ? 'Save Changes' : 'Create Client'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

