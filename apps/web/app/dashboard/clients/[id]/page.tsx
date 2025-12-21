/**
 * Client Detail Page
 * 
 * Detailed view of a single client
 */

import ClientDetail from '@/components/features/clients/ClientDetail';

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  return <ClientDetail clientId={params.id} />;
}

