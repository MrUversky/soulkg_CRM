/**
 * Clients API
 * 
 * API functions for client operations
 */

import apiClient from '../api-client';
import {
  Client,
  ClientListResponse,
  ClientListParams,
  CreateClientRequest,
  UpdateClientRequest,
  ConversationsResponse,
  MessagesResponse,
  ConversationsParams,
  MessagesParams,
  StatusHistoryResponse,
  ClientProductsResponse,
  ClientProduct,
  AddProductRequest,
} from '@/types/client';

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

  /**
   * Get conversations for a client
   */
  async getClientConversations(id: string, params?: ConversationsParams): Promise<ConversationsResponse> {
    const response = await apiClient.get<ConversationsResponse>(`/clients/${id}/conversations`, { params });
    return response.data;
  },

  /**
   * Get messages for a client
   */
  async getClientMessages(id: string, params?: MessagesParams): Promise<MessagesResponse> {
    const response = await apiClient.get<MessagesResponse>(`/clients/${id}/messages`, { params });
    return response.data;
  },

  /**
   * Get status history for a client
   */
  async getClientStatusHistory(id: string): Promise<StatusHistoryResponse> {
    const response = await apiClient.get<StatusHistoryResponse>(`/clients/${id}/status-history`);
    return response.data;
  },

  /**
   * Get products and tours for a client
   */
  async getClientProducts(id: string): Promise<ClientProductsResponse> {
    const response = await apiClient.get<ClientProductsResponse>(`/clients/${id}/products`);
    return response.data;
  },

  /**
   * Add a product to a client
   */
  async addClientProduct(id: string, data: AddProductRequest): Promise<ClientProduct> {
    const response = await apiClient.post<ClientProduct>(`/clients/${id}/products`, data);
    return response.data;
  },

  /**
   * Remove a product from a client
   */
  async removeClientProduct(id: string, productId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/clients/${id}/products/${productId}`);
    return response.data;
  },
};


