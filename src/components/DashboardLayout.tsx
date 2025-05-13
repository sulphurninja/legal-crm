'use client';

import { ReactNode } from 'react';
import DashboardSidebar from './DashboardSidebar';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { logout } = useAuth();

  const handleLogout = () => {
    if (logout) {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - fixed on desktop, drawer on mobile */}
      <DashboardSidebar onLogout={handleLogout} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-4 lg:p-6 pt-6 lg:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}
