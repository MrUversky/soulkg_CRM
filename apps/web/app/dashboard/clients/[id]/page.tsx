/**
 * Client Detail Page
 * 
 * Detailed view of a single client
 */

import { use } from 'react';
import ClientDetail from '@/components/features/clients/ClientDetail';

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ClientDetail clientId={id} />;
}

