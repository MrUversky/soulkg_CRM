/**
 * useClients Hook
 * 
 * Custom hook for managing clients data with React Query
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../api/clients';
import {
  ClientListParams,
  CreateClientRequest,
  UpdateClientRequest,
  ClientStatus,
  ConversationsParams,
  MessagesParams,
} from '@/types/client';

export function useClients(params?: ClientListParams) {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => clientsApi.getClients(params),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getClient(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientRequest) => clientsApi.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientRequest }) =>
      clientsApi.updateClient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.id] });
    },
  });
}

export function useUpdateClientStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: ClientStatus; reason?: string }) =>
      clientsApi.updateClientStatus(id, status, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.id] });
    },
  });
}

export function useClientConversations(clientId: string, params?: ConversationsParams) {
  return useQuery({
    queryKey: ['client', clientId, 'conversations', params],
    queryFn: () => clientsApi.getClientConversations(clientId, params),
    enabled: !!clientId,
  });
}

export function useClientMessages(clientId: string, params?: MessagesParams) {
  return useQuery({
    queryKey: ['client', clientId, 'messages', params],
    queryFn: () => clientsApi.getClientMessages(clientId, params),
    enabled: !!clientId,
  });
}

export function useClientStatusHistory(clientId: string) {
  return useQuery({
    queryKey: ['client', clientId, 'status-history'],
    queryFn: () => clientsApi.getClientStatusHistory(clientId),
    enabled: !!clientId,
  });
}

