/**
 * Register Page
 * 
 * User registration page with form validation
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
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organizationName: z.string().min(1, 'Organization name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const t = useTranslations();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const registerSchema = z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(8, t('auth.passwordMinLength')),
    confirmPassword: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    organizationName: z.string().min(1, t('auth.organizationNameRequired')),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.passwordsDontMatch'),
    path: ['confirmPassword'],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      setIsLoading(true);
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationName: data.organizationName,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || t('auth.registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 sm:px-6 py-12 sm:py-16 overflow-hidden bg-background-subtle">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-background to-secondary-50/50 dark:from-primary-950/30 dark:via-background dark:to-secondary-950/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.08)_0%,_transparent_50%)]" />
      
      {/* Theme toggle and Language switcher - Mobile friendly positioning */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 sm:gap-2 z-20">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md relative z-10 pt-8 sm:pt-0">
        
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight bg-gradient-to-br from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Soul KG CRM
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            {t('auth.createAccount')}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="block">
            <CardHeader>
              <CardTitle>{t('auth.register')}</CardTitle>
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

              <div className="grid grid-cols-2 gap-6">
                <Input
                  label={t('auth.firstName')}
                  placeholder="John"
                  id="firstName"
                  {...register('firstName')}
                  error={errors.firstName?.message}
                />

                <Input
                  label={t('auth.lastName')}
                  placeholder="Doe"
                  id="lastName"
                  {...register('lastName')}
                  error={errors.lastName?.message}
                />
              </div>

              <Input
                label={t('auth.email')}
                type="email"
                placeholder="you@example.com"
                id="email"
                {...register('email')}
                error={errors.email?.message}
                autoComplete="email"
                required
              />

              <Input
                label={t('auth.organizationName')}
                placeholder="My Company"
                id="organizationName"
                {...register('organizationName')}
                error={errors.organizationName?.message}
                required
              />

              <Input
                label={t('auth.password')}
                type="password"
                placeholder="••••••••"
                id="password"
                {...register('password')}
                error={errors.password?.message}
                autoComplete="new-password"
                helperText={t('auth.passwordMinLength')}
                required
              />

              <Input
                label={t('auth.confirmPassword')}
                type="password"
                placeholder="••••••••"
                id="confirmPassword"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
                autoComplete="new-password"
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
                {t('auth.createAccountButton')}
              </Button>

              <p className="text-sm text-text-secondary text-center">
                {t('auth.haveAccount')}{' '}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary-hover font-medium transition-colors duration-200"
                >
                  {t('auth.signIn')}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

