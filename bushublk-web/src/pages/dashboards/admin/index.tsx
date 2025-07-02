// pages/dashboard/admin/index.tsx
import React from 'react';
import { HiUserAdd, HiCog, HiUsers, HiChartBar } from 'react-icons/hi';

const AdminDashboard = () => {
  // Mock data - replace with real API calls later
  const stats = [
    { name: 'Total Employees', value: '247', change: '+12%', changeType: 'increase' },
    { name: 'Active Roles', value: '8', change: '0%', changeType: 'neutral' },
    { name: 'Pending Requests', value: '5', change: '+2', changeType: 'increase' },
    { name: 'System Health', value: '98%', change: '1%', changeType: 'increase' },
  ];

  const quickActions = [
    { icon: <HiUserAdd className="h-6 w-6" />, name: 'Add Employee', href: 'admin/create-account' },
    { icon: <HiCog className="h-6 w-6" />, name: 'Manage Roles', href: 'manage-roles' },
    { icon: <HiUsers className="h-6 w-6" />, name: 'View All Staff', href: 'employees' },
    { icon: <HiChartBar className="h-6 w-6" />, name: 'Analytics', href: 'analytics' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">{stat.name}</p>
            <p className="text-2xl font-semibold">{stat.value}</p>
            <p className={`text-sm ${
              stat.changeType === 'increase' ? 'text-green-600' : 
              stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-medium mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <a
              key={action.name}
              href={action.href}
              className="flex flex-col items-center p-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="bg-blue-100 p-2 rounded-full text-blue-600 mb-2">
                {action.icon}
              </div>
              <span className="text-sm text-center">{action.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-medium mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {['Account created for John D.', 'Role permissions updated', 'New depot added'].map((item) => (
            <div key={item} className="flex items-start pb-2 border-b border-gray-100">
              <div className="bg-green-100 p-1 rounded-full mr-3 mt-1">
                <HiUserAdd className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm">{item}</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard