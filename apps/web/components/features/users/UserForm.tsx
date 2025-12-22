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
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
          alert('Password is required for new users');
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
      router.push('/dashboard/users');
    } catch (error: any) {
      console.error('Failed to save user:', error);
      alert(error.response?.data?.error || 'Failed to save user. Please try again.');
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
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-text-primary">
          {isEdit ? 'Edit User' : 'Add New User'}
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              placeholder="user@example.com"
              {...register('email')}
              error={errors.email?.message}
              required
            />

            {!isEdit && (
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
                helperText="Must be at least 8 characters"
                required
              />
            )}

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">
                Role
              </label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
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
                  Active
                </label>
              </div>
            )}
          </CardBody>
          <CardFooter>
            <div className="flex gap-6 w-full">
              <Link href="/dashboard/users" className="flex-1">
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
                {isEdit ? 'Save Changes' : 'Create User'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

