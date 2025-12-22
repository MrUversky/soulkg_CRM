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
    <div className="min-h-screen flex items-center justify-center bg-background-subtle px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-4">
          Soul KG CRM
        </h1>
        <p className="text-xl text-text-secondary mb-8">
          Multi-tenant CRM system with AI agents for tour sales automation
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button variant="primary" size="lg">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary" size="lg">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
