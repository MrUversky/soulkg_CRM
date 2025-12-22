/**
 * Edit User Page
 * 
 * Page for editing an existing user (ADMIN only)
 */

import { use } from 'react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import UserForm from '@/components/features/users/UserForm';

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute requireRole="ADMIN">
      <UserForm userId={id} />
    </ProtectedRoute>
  );
}

