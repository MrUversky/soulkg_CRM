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
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';

// Schema will be created dynamically with translations
const createClientSchema = (t: (key: string) => string) => z.object({
  phone: z.string().regex(/^\+996\d{9}$/, t('clients.phoneFormatError')),
  email: z.string().email(t('clients.invalidEmail')).optional().or(z.literal('')),
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

type ClientFormData = z.infer<ReturnType<typeof createClientSchema>>;

interface ClientFormProps {
  clientId?: string;
}

export default function ClientForm({ clientId }: ClientFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const isEdit = !!clientId;
  const { data: client, isLoading: isLoadingClient } = useClient(clientId || '');
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(createClientSchema(t)),
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
      toast({
        title: t('clients.success'),
        description: isEdit ? t('clients.clientUpdated') : t('clients.clientCreated'),
        variant: "success",
      });
      router.push('/dashboard/clients');
    } catch (error: any) {
      toast({
        title: t('clients.error'),
        description: error.response?.data?.error || t('clients.failedToLoad'),
        variant: "error",
      });
    }
  };

  if (isEdit && isLoadingClient) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('clients.back')}
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-text-primary">
          {isEdit ? t('clients.editClient') : t('clients.createClient')}
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="block">
          <CardHeader>
            <CardTitle>{t('clients.contactInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {!isEdit && (
              <Input
                label={t('clients.phone')}
                placeholder="+996555123456"
                {...register('phone')}
                error={errors.phone?.message}
                helperText={t('clients.phoneFormat')}
                required
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={t('clients.firstName')}
                placeholder="John"
                {...register('firstName')}
                error={errors.firstName?.message}
              />

              <Input
                label={t('clients.lastName')}
                placeholder="Doe"
                {...register('lastName')}
                error={errors.lastName?.message}
              />
            </div>

            <Input
              label={t('clients.email')}
              type="email"
              placeholder="client@example.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">
                {t('clients.status')}
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="NEW_LEAD">{t('clientStatus.NEW_LEAD')}</option>
                <option value="QUALIFIED">{t('clientStatus.QUALIFIED')}</option>
                <option value="WARMED">{t('clientStatus.WARMED')}</option>
                <option value="PROPOSAL_SENT">{t('clientStatus.PROPOSAL_SENT')}</option>
                <option value="NEGOTIATION">{t('clientStatus.NEGOTIATION')}</option>
                <option value="SOLD">{t('clientStatus.SOLD')}</option>
                <option value="SERVICE">{t('clientStatus.SERVICE')}</option>
                <option value="CLOSED">{t('clientStatus.CLOSED')}</option>
              </select>
            </div>

            <Input
              label={t('clients.preferredLanguage')}
              placeholder="en, ru, kg"
              {...register('preferredLanguage')}
              error={errors.preferredLanguage?.message}
              helperText="Language code (e.g., en, ru, kg)"
            />
          </CardContent>
          <CardFooter>
            <div className="flex gap-6 w-full">
              <Link href="/dashboard/clients" className="flex-1">
                <Button variant="outline" fullWidth>
                  {t('clients.cancel')}
                </Button>
              </Link>
              <Button
                type="submit"
                variant="default"
                fullWidth
                isLoading={createMutation.isPending || updateMutation.isPending}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEdit ? t('clients.save') : t('clients.createClient')}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

