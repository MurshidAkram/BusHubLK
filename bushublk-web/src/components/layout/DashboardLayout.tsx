import { ReactNode } from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardNavbar from './DashboardNavbar';

interface Props {
  children: ReactNode;
  role: string;
}

export default function DashboardLayout({ children, role }: Props) {
  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar role={role} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar />
        
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}