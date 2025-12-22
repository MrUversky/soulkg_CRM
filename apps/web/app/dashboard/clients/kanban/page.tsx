/**
 * Clients Kanban Page
 * 
 * Kanban board view for managing clients by status
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import KanbanBoard from '@/components/features/clients/KanbanBoard';
import Button from '@/components/ui/Button';
import { LayoutGrid, List, Search } from 'lucide-react';
import Input from '@/components/ui/Input';

export default function ClientsKanbanPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Clients Kanban
          </h1>
          <p className="text-sm sm:text-base text-text-tertiary mt-1">
            Manage clients by dragging cards between status columns
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link href="/dashboard/clients" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full sm:w-auto">
              <List className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">List View</span>
            </Button>
          </Link>
          <Link href="/dashboard/clients/new">
            <Button variant="default" className="w-full sm:w-auto">
              <span className="hidden sm:inline">New Client</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="w-full sm:max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 sm:h-12 w-full rounded-lg sm:rounded-xl border border-input/50 bg-background/50 backdrop-blur-sm pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:border-primary-500 focus-visible:bg-background focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all duration-300 ease-spring hover:border-primary/30 hover:bg-background/80"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard search={search || undefined} />
    </div>
  );
}

