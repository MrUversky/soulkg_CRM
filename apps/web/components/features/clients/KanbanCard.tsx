/**
 * KanbanCard Component
 * 
 * Compact card representation of a client for the Kanban board.
 * Displays essential information and visual indicators.
 */

'use client';

import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Client, ClientStatus } from '@/types/client';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { formatPhone } from '@/lib/utils';
import { Phone, Mail, MessageSquare, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface KanbanCardProps {
  client: Client;
  isDragging?: boolean;
}

const STATUS_COLORS: Record<ClientStatus, string> = {
  NEW_LEAD: 'bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-300',
  QUALIFIED: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300',
  WARMED: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300',
  PROPOSAL_SENT: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-300',
  NEGOTIATION: 'bg-warning-200 text-warning-900 dark:bg-warning-800 dark:text-warning-200',
  SOLD: 'bg-success-200 text-success-900 dark:bg-success-800 dark:text-success-200',
  SERVICE: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
  CLOSED: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-300',
};

export default function KanbanCard({ client }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: client.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const clientName = useMemo(() => {
    if (client.firstName || client.lastName) {
      return `${client.firstName || ''} ${client.lastName || ''}`.trim();
    }
    return 'Unnamed Client';
  }, [client.firstName, client.lastName]);

  const hasUnreadMessages = false; // TODO: Add logic to check for unread messages
  const isImportant = false; // TODO: Add logic to determine importance

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation if dragging
    if (isDragging) {
      e.preventDefault();
      return;
    }
    // Navigation will be handled by Link
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="touch-none"
    >
      <Link
        href={`/dashboard/clients/${client.id}`}
        onClick={handleClick}
        className="block"
      >
        <Card
          {...listeners}
          className={cn(
            'p-3 sm:p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow',
            isDragging && 'shadow-lg ring-2 ring-primary-500 cursor-grabbing'
          )}
        >
          <div className="space-y-2 sm:space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-text-primary truncate">
                  {clientName}
                </h3>
              </div>
              {(hasUnreadMessages || isImportant) && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {hasUnreadMessages && (
                    <MessageSquare className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  )}
                  {isImportant && (
                    <AlertCircle className="h-4 w-4 text-warning-600 dark:text-warning-400" />
                  )}
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{formatPhone(client.phone)}</span>
              </div>
              {client.email && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                  STATUS_COLORS[client.status]
                )}
              >
                {client.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}

