/**
 * Settings Page
 * 
 * Organization settings page (ADMIN only)
 */

import ProtectedRoute from '@/components/layout/ProtectedRoute';
import OrganizationSettings from '@/components/features/settings/OrganizationSettings';

export default function SettingsPage() {
  return (
    <ProtectedRoute requireRole="ADMIN">
      <OrganizationSettings />
    </ProtectedRoute>
  );
}

