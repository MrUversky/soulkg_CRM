/**
 * Login Page
 * 
 * User login page with form validation
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@/components/ui/Card';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      setIsLoading(true);
      await login(data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-subtle px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Soul KG CRM
          </h1>
          <p className="text-base text-text-secondary">
            Sign in to your account
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div
                  className="p-4 rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800"
                  role="alert"
                >
                  <p className="text-sm text-error-600 dark:text-error-400 font-medium">{error}</p>
                </div>
              )}

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                id="email"
                {...register('email')}
                error={errors.email?.message}
                autoComplete="email"
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                id="password"
                {...register('password')}
                error={errors.password?.message}
                autoComplete="current-password"
                required
              />

              <CardFooter className="flex-col gap-4 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isLoading}
                  disabled={isLoading}
                  size="lg"
                >
                  Sign In
                </Button>

                <p className="text-sm text-text-secondary text-center">
                  Don't have an account?{' '}
                  <Link
                    href="/register"
                    className="text-primary hover:text-primary-hover font-medium transition-colors duration-200"
                  >
                    Sign up
                  </Link>
                </p>
              </CardFooter>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

