import React from 'react';
import { 
  HiCog, 
  HiClipboardCheck, 
  HiExclamationCircle, 
  HiTruck, 
  HiCollection,
  HiChartBar,
  HiCalendar,
  HiShieldCheck,
  HiPlus,
  HiDownload
} from 'react-icons/hi';

const DepotEngineerDashboard = () => {
  // Mock data - replace with actual API calls
  const stats = {
    assignedBuses: 24,
    pendingRepairs: 5,
    upcomingServices: 3,
    completedRepairs: 18,
    activeMaintenanceTasks: 12,
    pendingInspections: 8,
    criticalFaults: 3,
    vehiclesInMaintenance: 15,
    partsLowStock: 6,
    completedToday: 7,
    upcomingPM: 22,
    safetyCompliance: 95
  };

  const alerts = [
    { id: 1, type: 'critical', bus: 'Bus #12', message: 'Engine overdue for service', icon: HiExclamationCircle },
    { id: 2, type: 'warning', bus: 'Bus #07', message: 'Brake system needs inspection', icon: HiExclamationCircle }
  ];

  const recentActivities = [
    { id: 1, activity: 'Engine oil change', bus: '#15', date: '2023-05-20', status: 'Completed' },
    { id: 2, activity: 'Brake pad replacement', bus: '#08', date: '2023-05-18', status: 'Completed' },
    { id: 3, activity: 'Tire rotation', bus: '#12', date: '2023-05-10', status: 'Completed' }
  ];

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <HiPlus className="w-4 h-4" />
              New Repair
            </button>
            
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Assigned Buses</p>
                <p className="text-4xl font-bold text-gray-900">{stats.assignedBuses}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <HiTruck className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Pending Repairs</p>
                <p className="text-4xl font-bold text-gray-900">{stats.pendingRepairs}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <HiCog className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Upcoming Services</p>
                <p className="text-4xl font-bold text-gray-900">{stats.upcomingServices}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <HiCalendar className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Completed Repairs</p>
                <p className="text-4xl font-bold text-gray-900">{stats.completedRepairs}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <HiClipboardCheck className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="mb-8">
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className={`flex items-center gap-3 p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                <alert.icon className="w-5 h-5" />
                <span className="font-medium">{alert.bus}:</span>
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        </div>

       

        {/* Recent Activity Table */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-500">Recent Activity</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.activity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.bus}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepotEngineerDashboard;