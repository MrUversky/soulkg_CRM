/**
 * Dashboard Layout
 * 
 * Layout for authenticated dashboard pages
 */

'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background-subtle">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 md:ml-0 min-h-[calc(100vh-4rem)]">
            <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

