// components/common/Sidebar/Sidebar.tsx
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';


interface SidebarProps {
  role?: string;
  children?: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ role, children }) => {
    const context = useContext(AppContext);
  const user = context?.user;
    
  return (
    <aside className="w-64 bg-gray-800 text-white flex-shrink-0">
      <div className="h-full flex flex-col">
        {/* Logo/Branding */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              BusHubLK
            </span>
            {role && (
              <span className="block text-sm text-gray-400 mt-1">
                {role.replace('_', ' ')} Dashboard
              </span>
            )}
          </h2>
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4">
          {children || (
            <div className="space-y-2">
              {/* Default sidebar items if no children */}
              <div className="p-2 text-gray-400">No navigation items</div>
            </div>
          )}
        </nav>
        
         
      {/* User Profile Section - Updated */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full" />
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="text-sm">
            <p className="font-medium">{user?.name || 'User'}</p>
            <p className="text-gray-400 text-xs">{user?.email || 'No email'}</p>
          </div>
        </div>
      </div>
        </div>
    </aside>
  );
};

export default Sidebar;