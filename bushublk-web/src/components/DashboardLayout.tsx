// components/dashboard/DashboardLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  sidebarContent?: React.ReactNode;
  role?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ sidebarContent, role }) => {
  return (
    <div className="flex h-screen bg-gray-100 pt-16"> {/* pt-16 to account for fixed navbar */}
      <Sidebar role={role}>
        {sidebarContent}
      </Sidebar>
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;