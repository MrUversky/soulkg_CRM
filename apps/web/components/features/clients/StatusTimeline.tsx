/**
 * StatusTimeline Component
 * 
 * Displays a visual timeline of client status changes with who changed it and why.
 */

'use client';

import { useClientStatusHistory } from '@/lib/hooks/useClients';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusHistoryEntry, ClientStatus } from '@/types/client';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { Clock, User, Bot, ArrowRight } from 'lucide-react';

interface StatusTimelineProps {
  clientId: string;
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

const STATUS_LABELS: Record<ClientStatus, string> = {
  NEW_LEAD: 'New Lead',
  QUALIFIED: 'Qualified',
  WARMED: 'Warmed',
  PROPOSAL_SENT: 'Proposal Sent',
  NEGOTIATION: 'Negotiation',
  SOLD: 'Sold',
  SERVICE: 'Service',
  CLOSED: 'Closed',
};

export default function StatusTimeline({ clientId }: StatusTimelineProps) {
  const { data, isLoading } = useClientStatusHistory(clientId);

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const history = data?.data || [];

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-text-tertiary">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No status changes recorded yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-border" />

          {/* Timeline items */}
          <div className="space-y-4 sm:space-y-6">
            {history.map((entry, index) => (
              <TimelineItem key={entry.id} entry={entry} isFirst={index === 0} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TimelineItemProps {
  entry: StatusHistoryEntry;
  isFirst: boolean;
}

function TimelineItem({ entry, isFirst }: TimelineItemProps) {
  const changedByLabel =
    entry.changedBy === 'AI'
      ? 'AI Assistant'
      : entry.changedByUser
      ? `${entry.changedByUser.firstName || ''} ${entry.changedByUser.lastName || ''}`.trim() ||
        entry.changedByUser.email
      : 'System';

  const oldStatusLabel = entry.oldStatus ? STATUS_LABELS[entry.oldStatus] : 'None';
  const newStatusLabel = STATUS_LABELS[entry.newStatus];

  return (
    <div className="relative flex gap-2 sm:gap-4">
      {/* Timeline dot */}
      <div className="relative z-10 flex-shrink-0">
        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-surface border-2 border-primary flex items-center justify-center">
          {entry.changedBy === 'AI' ? (
            <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          ) : (
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 sm:pb-6 min-w-0">
        <div className="bg-surface border border-border rounded-lg p-3 sm:p-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary">
                {entry.changedBy === 'AI' ? (
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                ) : (
                  <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                )}
                <span className="font-medium truncate">{changedByLabel}</span>
                {entry.changedBy === 'HUMAN' && entry.changedByUser && (
                  <span className="text-text-tertiary hidden sm:inline">({entry.changedByUser.email})</span>
                )}
              </div>
            </div>
            <div className="text-xs text-text-tertiary flex items-center gap-1 flex-shrink-0">
              <Clock className="h-3 w-3" />
              {formatDate(entry.createdAt)}
            </div>
          </div>

          {/* Status change */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
            {entry.oldStatus && (
              <>
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 sm:py-1 rounded text-xs font-medium whitespace-nowrap',
                    STATUS_COLORS[entry.oldStatus]
                  )}
                >
                  {oldStatusLabel}
                </span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-text-tertiary flex-shrink-0" />
              </>
            )}
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 sm:py-1 rounded text-xs font-medium whitespace-nowrap',
                STATUS_COLORS[entry.newStatus]
              )}
            >
              {newStatusLabel}
            </span>
          </div>

          {/* Reason */}
          {entry.reason && (
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border">
              <div className="text-xs text-text-tertiary mb-1">Reason:</div>
              <div className="text-xs sm:text-sm text-text-primary break-words">{entry.reason}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

