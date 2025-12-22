/**
 * Edit Client Page
 * 
 * Page for editing an existing client
 */

import { use } from 'react';
import ClientForm from '@/components/features/clients/ClientForm';

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ClientForm clientId={id} />;
}

