/**
 * KanbanBoard Component
 * 
 * Kanban board for managing clients by status with drag-and-drop functionality.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useClients, useUpdateClientStatus } from '@/lib/hooks/useClients';
import { Client, ClientStatus } from '@/types/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import KanbanCard from './KanbanCard';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const STATUS_ORDER: ClientStatus[] = [
  'NEW_LEAD',
  'QUALIFIED',
  'WARMED',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'SOLD',
  'SERVICE',
  'CLOSED',
];

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

interface KanbanBoardProps {
  search?: string;
}

export default function KanbanBoard({ search }: KanbanBoardProps) {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const updateStatusMutation = useUpdateClientStatus();

  // Fetch all clients (without pagination for kanban)
  const { data: clientsData, isLoading } = useClients({
    limit: 1000, // Get all clients for kanban
    search,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group clients by status
  const clientsByStatus = useMemo(() => {
    if (!clientsData?.data) return {} as Record<ClientStatus, Client[]>;

    const grouped = STATUS_ORDER.reduce((acc, status) => {
      acc[status] = [];
      return acc;
    }, {} as Record<ClientStatus, Client[]>);

    clientsData.data.forEach((client) => {
      if (grouped[client.status]) {
        grouped[client.status].push(client);
      }
    });

    return grouped;
  }, [clientsData]);

  // Get active client for drag overlay
  const activeClient = useMemo(() => {
    if (!activeId || !clientsData?.data) return null;
    return clientsData.data.find((c) => c.id === activeId) || null;
  }, [activeId, clientsData]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const clientId = active.id as string;
    const newStatus = over.id as ClientStatus;

    // Find client to get current status
    const client = clientsData?.data?.find((c) => c.id === clientId);
    if (!client) return;

    // Don't update if status hasn't changed
    if (client.status === newStatus) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: clientId,
        status: newStatus,
        reason: 'Moved via Kanban board',
      });
      toast({
        title: 'Success',
        description: 'Client status updated successfully',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update status',
        variant: 'error',
      });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Add visual feedback during drag
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-4 px-4 sm:px-6 lg:px-8 xl:px-10">
        {STATUS_ORDER.map((status) => {
          const clients = clientsByStatus[status] || [];
          const count = clients.length;

          return (
            <div
              key={status}
              className="flex-shrink-0 w-[260px] sm:w-[280px] lg:w-[320px]"
            >
              <Card className="flex flex-col h-[calc(100vh-280px)] sm:h-[calc(100vh-260px)]">
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm sm:text-base">
                      {STATUS_LABELS[status]}
                    </CardTitle>
                    <span className="text-xs sm:text-sm text-text-tertiary bg-surface px-2 py-1 rounded">
                      {count}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto min-h-0">
                  <SortableContext
                    items={clients.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 sm:space-y-3">
                      {clients.length === 0 ? (
                        <div className="text-center py-8 text-text-tertiary text-sm">
                          No clients
                        </div>
                      ) : (
                        clients.map((client) => (
                          <KanbanCard key={client.id} client={client} />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeClient ? (
          <div className="opacity-90 rotate-3">
            <KanbanCard client={activeClient} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

