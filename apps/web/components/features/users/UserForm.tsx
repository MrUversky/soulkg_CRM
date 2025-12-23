/**
 * UserForm Component
 * 
 * Form for creating and editing users
 */

'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser, useCreateUser, useUpdateUser } from '@/lib/hooks/useUsers';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER']),
  isActive: z.boolean().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  userId?: string;
}

export default function UserForm({ userId }: UserFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const isEdit = !!userId;
  const { data: user, isLoading: isLoadingUser } = useUser(userId || '');
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: isEdit && user
      ? {
          email: user.email,
          password: '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role === 'SUPER_ADMIN' ? 'ADMIN' : user.role,
          isActive: user.isActive,
        }
      : {
          role: 'MANAGER',
          isActive: true,
        },
  });

  const isEditMode = watch('isActive') !== undefined;

  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: userId!,
          data: {
            email: data.email,
            firstName: data.firstName || undefined,
            lastName: data.lastName || undefined,
            role: data.role,
            isActive: data.isActive,
          },
        });
      } else {
        if (!data.password) {
          toast({
            title: t('common.error'),
            description: t('users.passwordRequired'),
            variant: "error",
          });
          return;
        }
        await createMutation.mutateAsync({
          email: data.email,
          password: data.password,
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
          role: data.role,
        });
      }
      toast({
        title: t('common.success'),
        description: isEdit ? t('users.userUpdated') : t('users.userCreated'),
        variant: "success",
      });
      router.push('/dashboard/users');
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('users.failedToSaveUser'),
        variant: "error",
      });
    }
  };

  if (isEdit && isLoadingUser) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <Link href="/dashboard/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-text-primary">
          {isEdit ? t('users.editUser') : t('users.addNewUser')}
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="block">
          <CardHeader>
            <CardTitle>{t('users.userInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={t('users.firstName')}
                placeholder="John"
                {...register('firstName')}
                error={errors.firstName?.message}
              />

              <Input
                label={t('users.lastName')}
                placeholder="Doe"
                {...register('lastName')}
                error={errors.lastName?.message}
              />
            </div>

            <Input
              label={t('auth.email')}
              type="email"
              placeholder="user@example.com"
              {...register('email')}
              error={errors.email?.message}
              required
            />

            {!isEdit && (
              <Input
                label={t('auth.password')}
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
                helperText={t('auth.passwordMinLength')}
                required
              />
            )}

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">
                {t('users.role')}
              </label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="MANAGER">{t('users.roles.MANAGER')}</option>
                <option value="ADMIN">{t('users.roles.ADMIN')}</option>
              </select>
            </div>

            {isEdit && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register('isActive')}
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-text-primary">
                  {t('users.active')}
                </label>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <div className="flex gap-6 w-full">
              <Link href="/dashboard/users" className="flex-1">
                <Button variant="outline" fullWidth>
                  {t('common.cancel')}
                </Button>
              </Link>
              <Button
                type="submit"
                variant="default"
                fullWidth
                isLoading={createMutation.isPending || updateMutation.isPending}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEdit ? t('users.saveChanges') : t('users.createUser')}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

