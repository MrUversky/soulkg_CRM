/**
 * Organization Types
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  logo?: string;
  settings?: Record<string, any>;
}

