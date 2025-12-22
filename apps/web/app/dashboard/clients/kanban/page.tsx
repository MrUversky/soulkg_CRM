/**
 * Clients Kanban Page
 * 
 * Kanban board view for managing clients by status
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import KanbanBoard from '@/components/features/clients/KanbanBoard';
import Button from '@/components/ui/Button';
import { LayoutGrid, List, Search } from 'lucide-react';
import Input from '@/components/ui/Input';

export default function ClientsKanbanPage() {
  const [search, setSearch] = useState('');
  const boardRef = useRef<HTMLDivElement>(null);

  // Восстановление позиции скролла при возврате
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('clients-kanban-scroll');
    if (savedScroll && boardRef.current) {
      const scrollPosition = parseInt(savedScroll, 10);
      // Используем requestAnimationFrame для восстановления после рендера
      requestAnimationFrame(() => {
        if (boardRef.current) {
          boardRef.current.scrollLeft = scrollPosition;
          sessionStorage.removeItem('clients-kanban-scroll');
        }
      });
    }
  }, []);

  return (
    <>
      {/* Header и Search - ограничены по ширине для читаемости */}
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-3 sm:mb-4 md:mb-6 leading-tight">
              Clients Kanban
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-text-secondary leading-relaxed">
              Manage clients by dragging cards between status columns
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link href="/dashboard/clients" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <List className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                <span className="hidden sm:inline">List View</span>
                <span className="sm:hidden">List</span>
              </Button>
            </Link>
            <Link href="/dashboard/clients/new" className="w-full sm:w-auto">
              <Button variant="default" size="lg" className="w-full sm:w-auto">
                <span className="hidden sm:inline">Add Client</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-text-muted pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 sm:h-12 w-full rounded-lg sm:rounded-xl border border-input/50 bg-background/50 backdrop-blur-sm pl-9 sm:pl-11 pr-4 py-2 sm:py-3 text-sm sm:text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:border-primary-500 focus-visible:bg-background focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all duration-300 ease-spring hover:border-primary/30 hover:bg-background/80"
            />
          </div>
        </div>
      </div>

      {/* Kanban Board - на всю ширину экрана */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <KanbanBoard search={search || undefined} scrollRef={boardRef} />
      </div>
    </>
  );
}

