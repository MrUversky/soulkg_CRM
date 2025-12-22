/**
 * Clients API
 * 
 * API functions for client operations
 */

import apiClient from '../api-client';
import { Client, ClientListResponse, ClientListParams, CreateClientRequest, UpdateClientRequest } from '@/types/client';

export const clientsApi = {
  /**
   * Get list of clients with filtering and pagination
   */
  async getClients(params?: ClientListParams): Promise<ClientListResponse> {
    const response = await apiClient.get<ClientListResponse>('/clients', { params });
    return response.data;
  },

  /**
   * Get client by ID
   */
  async getClient(id: string): Promise<Client> {
    const response = await apiClient.get<Client>(`/clients/${id}`);
    return response.data;
  },

  /**
   * Create new client
   */
  async createClient(data: CreateClientRequest): Promise<Client> {
    const response = await apiClient.post<Client>('/clients', data);
    return response.data;
  },

  /**
   * Update client
   */
  async updateClient(id: string, data: UpdateClientRequest): Promise<Client> {
    const response = await apiClient.put<Client>(`/clients/${id}`, data);
    return response.data;
  },

  /**
   * Update client status
   */
  async updateClientStatus(id: string, status: string, reason?: string): Promise<Client> {
    const response = await apiClient.patch<Client>(`/clients/${id}/status`, {
      status,
      reason,
    });
    return response.data;
  },
};


