/**
 * Users Page
 * 
 * Users management page (ADMIN only)
 */

import ProtectedRoute from '@/components/layout/ProtectedRoute';
import UserList from '@/components/features/users/UserList';

export default function UsersPage() {
  return (
    <ProtectedRoute requireRole="ADMIN">
      <UserList />
    </ProtectedRoute>
  );
}

