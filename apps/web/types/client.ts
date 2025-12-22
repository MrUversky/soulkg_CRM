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
  metadata?: ClientMetadata;
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

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface ClientMetadata {
  notes?: Note[];
  tags?: string[];
}

export interface UpdateClientRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  status?: ClientStatus;
  preferredLanguage?: string;
  metadata?: ClientMetadata;
}

export type CommunicationChannel = 'WHATSAPP' | 'TELEGRAM' | 'EMAIL';
export type ConversationStatus = 'ACTIVE' | 'ARCHIVED';
export type ConversationManager = 'AI' | 'HUMAN';
export type MessageDirection = 'INCOMING' | 'OUTGOING';
export type MessageSender = 'CLIENT' | 'AI' | 'HUMAN';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface Conversation {
  id: string;
  channel: CommunicationChannel;
  status: ConversationStatus;
  managedBy: ConversationManager;
  lastMessageAt: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  conversation: {
    id: string;
    channel: CommunicationChannel;
  };
  direction: MessageDirection;
  sender: MessageSender;
  senderId: string | null;
  senderUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  content: string;
  language: string | null;
  translatedContent: string | null;
  status: MessageStatus;
  createdAt: string;
}

export interface ConversationsResponse {
  data: Conversation[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface MessagesResponse {
  data: Message[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ConversationsParams {
  channel?: CommunicationChannel;
  status?: ConversationStatus;
  limit?: number;
  offset?: number;
}

export interface MessagesParams {
  conversationId?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export type StatusChangedBy = 'AI' | 'HUMAN';

export interface StatusHistoryEntry {
  id: string;
  oldStatus: ClientStatus | null;
  newStatus: ClientStatus;
  changedBy: StatusChangedBy;
  changedById: string | null;
  changedByUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  reason: string | null;
  createdAt: string;
}

export interface StatusHistoryResponse {
  data: StatusHistoryEntry[];
}

// Products and Tours
export type ClientProductStatus = 'INTERESTED' | 'PROPOSED' | 'SELECTED' | 'BOOKED';
export type ClientTourStatus = 'INTERESTED' | 'PROPOSED' | 'SELECTED' | 'BOOKED' | 'CONFIRMED' | 'CANCELLED';
export type ProductType = 'TOUR' | 'SERVICE' | 'PACKAGE';
export type TourStatus = 'AVAILABLE' | 'FULL' | 'CANCELLED' | 'COMPLETED';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  currency: string;
  type: ProductType;
}

export interface TourProduct {
  id: string;
  name: string;
}

export interface Tour {
  id: string;
  startDate: string;
  endDate: string;
  price: string | null;
  currency: string;
  status: TourStatus;
  maxParticipants: number | null;
  currentParticipants: number;
  product: TourProduct;
}

export interface ClientProduct {
  id: string;
  productId: string;
  product: Product;
  status: ClientProductStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientTour {
  id: string;
  tourId: string;
  tour: Tour;
  status: ClientTourStatus;
  participants: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientProductsResponse {
  products: ClientProduct[];
  tours: ClientTour[];
}

export interface AddProductRequest {
  productId: string;
  status?: ClientProductStatus;
  notes?: string;
}

