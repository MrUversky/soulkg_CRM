/**
 * Dashboard Page
 * 
 * Main dashboard page with overview
 */

'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/contexts/auth-context';
import { useClients } from '@/lib/hooks/useClients';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Fetch clients for stats
  const { data: clientsData } = useClients({ page: 1, limit: 1000 });
  const clients = clientsData?.data || [];
  
  // Calculate stats
  const totalClients = clients.length;
  const newLeads = clients.filter(c => c.status === 'NEW_LEAD').length;
  const qualified = clients.filter(c => c.status === 'QUALIFIED').length;
  const sold = clients.filter(c => c.status === 'SOLD').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight bg-gradient-to-br from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-lg md:text-xl text-text-secondary leading-relaxed">
          Here's what's happening with your CRM today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-l-4 border-l-primary-500 hover:border-l-primary-600 transition-colors duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-4xl md:text-5xl font-bold text-text-primary leading-tight">{totalClients}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success-500 hover:border-l-success-600 transition-colors duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              New Leads
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-4xl md:text-5xl font-bold text-text-primary leading-tight">{newLeads}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning-500 hover:border-l-warning-600 transition-colors duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Qualified
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-4xl md:text-5xl font-bold text-text-primary leading-tight">{qualified}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary-500 hover:border-l-secondary-600 transition-colors duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Sold
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-4xl md:text-5xl font-bold text-text-primary leading-tight">{sold}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Link
              href="/dashboard/clients/new"
              className="group p-8 md:p-10 rounded-xl border-2 border-border/50 hover:border-primary/50 hover:bg-primary-light/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] block overflow-hidden"
            >
              <h3 className="font-bold text-lg md:text-xl text-text-primary mb-3 md:mb-4 group-hover:text-primary transition-colors duration-300">
                Add New Client
              </h3>
              <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                Create a new client record
              </p>
            </Link>
            <Link
              href="/dashboard/clients"
              className="group p-8 md:p-10 rounded-xl border-2 border-border/50 hover:border-primary/50 hover:bg-primary-light/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] block overflow-hidden"
            >
              <h3 className="font-bold text-lg md:text-xl text-text-primary mb-3 md:mb-4 group-hover:text-primary transition-colors duration-300">
                View All Clients
              </h3>
              <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                Browse and manage clients
              </p>
            </Link>
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <Link
                href="/dashboard/users"
                className="group p-8 md:p-10 rounded-xl border-2 border-border/50 hover:border-primary/50 hover:bg-primary-light/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] block overflow-hidden"
              >
                <h3 className="font-bold text-lg md:text-xl text-text-primary mb-3 md:mb-4 group-hover:text-primary transition-colors duration-300">
                  Manage Users
                </h3>
                <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                  Add or edit users
                </p>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

