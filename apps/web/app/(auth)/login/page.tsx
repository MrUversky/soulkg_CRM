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
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

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
    <div className="min-h-screen flex items-center justify-center relative px-6 py-16 overflow-hidden bg-background-subtle">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-background to-secondary-50/50 dark:from-primary-950/30 dark:via-background dark:to-secondary-950/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.08)_0%,_transparent_50%)]" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Theme toggle */}
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight bg-gradient-to-br from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Soul KG CRM
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Sign in to your account
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="block w-full">
            <CardHeader>
              <CardTitle>Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
            </CardContent>
            <CardFooter className="flex-col gap-6">
              <Button
                type="submit"
                variant="default"
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
        </Card>
      </div>
    </div>
  );
}

