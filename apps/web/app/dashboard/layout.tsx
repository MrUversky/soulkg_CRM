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
          <main className="flex-1 md:ml-64 min-h-[calc(100vh-4rem)] p-6 md:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

