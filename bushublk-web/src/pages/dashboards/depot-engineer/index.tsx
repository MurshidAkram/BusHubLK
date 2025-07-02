import React from 'react';
import { 
  HiCog, 
  HiClipboardCheck, 
  HiExclamationCircle, 
  HiTruck, 
  HiCollection,
  HiChartBar,
  HiCalendar,
  HiShieldCheck
} from 'react-icons/hi';

const DepotEngineerDashboard = () => {
  // Mock data - replace with actual API calls
  const stats = {
    activeMaintenanceTasks: 12,
    pendingInspections: 8,
    criticalFaults: 3,
    vehiclesInMaintenance: 15,
    partsLowStock: 6,
    completedToday: 7,
    upcomingPM: 22,
    safetyCompliance: 95
  };

  const recentActivities = [
    { id: 1, type: 'maintenance', message: 'Completed engine overhaul for Bus #LB-2547', time: '10 minutes ago', status: 'completed' },
    { id: 2, type: 'inspection', message: 'Safety inspection required for Bus #LB-1234', time: '25 minutes ago', status: 'pending' },
    { id: 3, type: 'fault', message: 'Critical brake system fault reported for Bus #LB-5678', time: '1 hour ago', status: 'urgent' },
    { id: 4, type: 'parts', message: 'Brake pads inventory running low', time: '2 hours ago', status: 'warning' }
  ];

  const upcomingMaintenance = [
    { id: 1, busNumber: 'LB-2547', type: 'Preventive Maintenance', dueDate: '2025-07-02', priority: 'medium' },
    { id: 2, busNumber: 'LB-1234', type: 'Engine Service', dueDate: '2025-07-03', priority: 'high' },
    { id: 3, busNumber: 'LB-5678', type: 'Brake Inspection', dueDate: '2025-07-02', priority: 'high' },
    { id: 4, busNumber: 'LB-9012', type: 'Transmission Check', dueDate: '2025-07-04', priority: 'low' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Depot Engineer Dashboard</h1>
          <p className="text-gray-600 mt-1">Technical maintenance overview and operations</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last updated</p>
          <p className="text-lg font-semibold text-gray-900">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-50">
              <HiCog className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeMaintenanceTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-50">
              <HiClipboardCheck className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Inspections</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingInspections}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-50">
              <HiExclamationCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Critical Faults</p>
              <p className="text-2xl font-bold text-gray-900">{stats.criticalFaults}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-50">
              <HiTruck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Maintenance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.vehiclesInMaintenance}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-50">
              <HiCollection className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Parts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.partsLowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-50">
              <HiChartBar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-50">
              <HiCalendar className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming PM</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingPM}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-50">
              <HiShieldCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Safety Compliance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.safetyCompliance}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                  {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Maintenance</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Schedule New</button>
          </div>
          <div className="space-y-4">
            {upcomingMaintenance.map((maintenance) => (
              <div key={maintenance.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">{maintenance.busNumber}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(maintenance.priority)}`}>
                      {maintenance.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{maintenance.type}</p>
                  <p className="text-xs text-gray-500">{maintenance.dueDate}</p>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <HiClipboardCheck className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">New Inspection</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors">
            <HiCog className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Create Work Order</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-colors">
            <HiExclamationCircle className="h-8 w-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Report Fault</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <HiCollection className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Check Inventory</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepotEngineerDashboard
