/**
 * Edit User Page
 * 
 * Page for editing an existing user (ADMIN only)
 */

import ProtectedRoute from '@/components/layout/ProtectedRoute';
import UserForm from '@/components/features/users/UserForm';

export default function EditUserPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute requireRole="ADMIN">
      <UserForm userId={params.id} />
    </ProtectedRoute>
  );
}

