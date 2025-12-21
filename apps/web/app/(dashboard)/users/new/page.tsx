/**
 * New User Page
 * 
 * Page for creating a new user (ADMIN only)
 */

import ProtectedRoute from '@/components/layout/ProtectedRoute';
import UserForm from '@/components/features/users/UserForm';

export default function NewUserPage() {
  return (
    <ProtectedRoute requireRole="ADMIN">
      <UserForm />
    </ProtectedRoute>
  );
}

