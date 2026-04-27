'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

interface DashboardShellProps {
  children: React.ReactNode;
  clinicName?: string;
  doctorName?: string;
  userRole?: string;
}

export default function DashboardShell({ children, clinicName, doctorName, userRole }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app">
      <Sidebar
        clinicName={clinicName}
        doctorName={doctorName}
        userRole={userRole}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className="main">
        <Topbar />
        <div className="page">
          {children}
        </div>
      </main>
    </div>
  );
}
