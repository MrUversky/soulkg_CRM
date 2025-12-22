'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

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
    <div className="min-h-screen flex items-center justify-center relative px-6 py-16 overflow-hidden bg-background-subtle">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-background to-secondary-50/50 dark:from-primary-950/30 dark:via-background dark:to-secondary-950/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.1)_0%,_transparent_50%)]" />
      
      {/* Content */}
      <div className="text-center max-w-3xl w-full relative z-10">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight bg-gradient-to-br from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          Soul KG CRM
        </h1>
        <p className="text-xl md:text-2xl text-text-secondary mb-12 leading-relaxed max-w-2xl mx-auto">
          Multi-tenant CRM system with AI agents for tour sales automation
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="default" size="lg" className="w-full sm:w-auto min-w-[200px]">
              Sign In
            </Button>
          </Link>
          <Link href="/register" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto min-w-[200px]">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
