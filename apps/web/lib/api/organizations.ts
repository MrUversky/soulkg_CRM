/**
 * Organizations API
 * 
 * API functions for organization operations
 */

import apiClient from '../api-client';
import { Organization, UpdateOrganizationRequest } from '@/types/organization';

export interface OrganizationListResponse {
  data: Organization[];
}

export const organizationsApi = {
  /**
   * Get list of organizations for the user
   */
  async getOrganizations(): Promise<OrganizationListResponse> {
    const response = await apiClient.get<OrganizationListResponse>('/organizations');
    return response.data;
  },

  /**
   * Get organization by ID
   */
  async getOrganization(id: string): Promise<Organization> {
    const response = await apiClient.get<Organization>(`/organizations/${id}`);
    return response.data;
  },

  /**
   * Update organization
   */
  async updateOrganization(id: string, data: UpdateOrganizationRequest): Promise<Organization> {
    const response = await apiClient.put<Organization>(`/organizations/${id}`, data);
    return response.data;
  },
};


