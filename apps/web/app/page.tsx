'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useTranslations } from 'next-intl';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const t = useTranslations();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 sm:px-6 py-12 sm:py-16 overflow-hidden bg-background-subtle">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-background to-secondary-50/50 dark:from-primary-950/30 dark:via-background dark:to-secondary-950/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.1)_0%,_transparent_50%)]" />
      
      {/* Theme toggle and Language switcher - Mobile friendly positioning */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 sm:gap-2 z-20">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      
      {/* Content */}
      <div className="text-center max-w-3xl w-full relative z-10 pt-12 sm:pt-0">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight bg-gradient-to-br from-primary-600 to-secondary-600 bg-clip-text text-transparent px-4">
          {t('home.title')}
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-text-secondary mb-8 sm:mb-12 leading-relaxed max-w-2xl mx-auto px-4">
          {t('home.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4">
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="default" size="lg" className="w-full sm:w-auto min-w-[200px]">
              {t('home.signIn')}
            </Button>
          </Link>
          <Link href="/register" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto min-w-[200px]">
              {t('home.getStarted')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
