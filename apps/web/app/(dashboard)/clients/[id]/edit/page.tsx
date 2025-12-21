/**
 * Edit Client Page
 * 
 * Page for editing an existing client
 */

import ClientForm from '@/components/features/clients/ClientForm';

export default function EditClientPage({ params }: { params: { id: string } }) {
  return <ClientForm clientId={params.id} />;
}

