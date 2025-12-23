/**
 * OrganizationSettings Component
 * 
 * Settings page for organization (ADMIN only)
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/contexts/auth-context';
import { useOrganization, useUpdateOrganization } from '@/lib/hooks/useOrganizations';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';

const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  logo: z.string().url('Invalid logo URL').optional().or(z.literal('')),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

export default function OrganizationSettings() {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const { user } = useAuth();
  const { data: organization, isLoading, error } = useOrganization(user?.organizationId || '');
  const updateMutation = useUpdateOrganization();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: organization
      ? {
          name: organization.name,
          logo: organization.logo || '',
        }
      : undefined,
  });

  const onSubmit = async (data: OrganizationFormData) => {
    if (!user?.organizationId) return;

    try {
      await updateMutation.mutateAsync({
        id: user.organizationId,
        data: {
          name: data.name,
          logo: data.logo || undefined,
        },
      });
      toast({
        title: t('common.success'),
        description: t('settings.organizationUpdated'),
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('settings.failedToUpdateOrganization'),
        variant: "error",
      });
    }
  };

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (error || (!isLoading && !organization)) {
      toast({
        title: t('common.error'),
        description: t('settings.failedToLoadSettings'),
        variant: "error",
      });
    }
  }, [error, isLoading, organization, toast, t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!organization) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-error-600 dark:text-error-400">
              {t('settings.failedToLoadSettings')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-4">{t('settings.title')}</h1>
        <p className="text-lg text-text-secondary">
          {t('settings.manageOrganizationSettings')}
        </p>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.appearance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-text-primary mb-1">
                {t('settings.theme')}
              </h3>
              <p className="text-sm text-text-secondary">
                {t('settings.chooseTheme')}
              </p>
            </div>
            <ThemeToggle />
          </div>
          <div className="mt-6 pt-6 border-t border-border">
            <ThemeToggle variant="dropdown" />
          </div>
        </CardContent>
      </Card>

      {/* Organization Settings */}
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="block">
          <CardHeader>
            <CardTitle>{t('settings.organizationInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <Input
              label={t('settings.organizationName')}
              placeholder="My Company"
              {...register('name')}
              error={errors.name?.message}
              required
            />

            <Input
              label={t('settings.logoUrl')}
              type="url"
              placeholder="https://example.com/logo.png"
              {...register('logo')}
              error={errors.logo?.message}
              helperText={t('settings.logoUrlHelper')}
            />

            <div className="pt-6 border-t border-border">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-semibold text-text-tertiary mb-2">
                    {t('settings.organizationId')}
                  </dt>
                  <dd className="text-sm text-text-primary font-mono">
                    {organization.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-text-tertiary mb-2">
                    {t('settings.slug')}
                  </dt>
                  <dd className="text-sm text-text-primary">
                    {organization.slug}
                  </dd>
                </div>
              </dl>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              variant="default"
              isLoading={updateMutation.isPending}
              disabled={updateMutation.isPending}
            >
              {t('settings.saveChanges')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

