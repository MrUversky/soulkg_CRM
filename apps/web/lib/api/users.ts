/**
 * Users API
 * 
 * API functions for user operations
 */

import apiClient from '../api-client';
import { User, CreateUserRequest, UpdateUserRequest } from '@/types/user';

export interface UserListResponse {
  data: User[];
}

export const usersApi = {
  /**
   * Get list of users in organization
   */
  async getUsers(): Promise<UserListResponse> {
    const response = await apiClient.get<UserListResponse>('/users');
    return response.data;
  },

  /**
   * Get user by ID
   */
  async getUser(id: string): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  /**
   * Create new user
   */
  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await apiClient.post<User>('/users', data);
    return response.data;
  },

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put<User>(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Deactivate user
   */
  async deactivateUser(id: string): Promise<User> {
    const response = await apiClient.delete<User>(`/users/${id}`);
    return response.data;
  },
};




