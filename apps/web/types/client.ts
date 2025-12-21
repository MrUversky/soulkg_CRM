/**
 * Client Types
 */

export type ClientStatus =
  | 'NEW_LEAD'
  | 'QUALIFIED'
  | 'WARMED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'SOLD'
  | 'SERVICE'
  | 'CLOSED';

export interface Client {
  id: string;
  organizationId: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  status: ClientStatus;
  preferredLanguage?: string;
  culturalContext?: {
    halal?: boolean;
    formality?: 'formal' | 'casual';
    timezone?: string;
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ClientListResponse {
  data: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClientListParams {
  page?: number;
  limit?: number;
  status?: ClientStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateClientRequest {
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  status?: ClientStatus;
  preferredLanguage?: string;
}

export interface UpdateClientRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  status?: ClientStatus;
  preferredLanguage?: string;
}

