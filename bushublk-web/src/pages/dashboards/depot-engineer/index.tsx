import React from 'react';
import { 
  HiCog, 
  HiExclamationCircle, 
  HiTruck, 
  HiCheckCircle,
  HiClock,
  HiEye
} from 'react-icons/hi';

const DepotEngineerDashboard = () => {
  // Mock data - replace with actual API calls
  const stats = {
    totalBuses: 42,
    activeBuses: 24,
    underMaintenance: 5,
    awaitingApproval: 3,
    criticalIssues: 2,
    busesOverdueService: 4,
    busesDueToday: 7,
    busesOperational: 18,
    busesInGarage: 6,
    complianceRate: 92
  };

  const pendingApprovals = [
    { id: 1, bus: 'Bus #12', lastTrip: 'Route 42', condition: 'Minor tire wear', status: 'Pending Review' },
    { id: 2, bus: 'Bus #07', lastTrip: 'Route 15', condition: 'Brake fluid low', status: 'Needs Inspection' },
    { id: 3, bus: 'Bus #23', lastTrip: 'Route 8', condition: 'No issues reported', status: 'Ready for Approval' }
  ];

  const maintenanceAlerts = [
    { id: 1, type: 'critical', bus: 'Bus #12', issue: 'Engine overdue for service (500km over)', daysOverdue: 7, icon: HiExclamationCircle },
    { id: 2, type: 'warning', bus: 'Bus #07', issue: 'Brake system inspection due', daysOverdue: 3, icon: HiCog },
    { id: 3, type: 'warning', bus: 'Bus #19', issue: 'Transmission fluid change needed', daysOverdue: 2, icon: HiCog }
  ];

  const busStatusOverview = [
    { id: 1, bus: '#15', lastCheck: '2023-05-20', nextService: '2023-06-15', status: 'Active', operationalHours: 245 },
    { id: 2, bus: '#08', lastCheck: '2023-05-18', nextService: '2023-06-02', status: 'Maintenance', operationalHours: 312 },
    { id: 3, bus: '#12', lastCheck: '2023-05-10', nextService: '2023-05-28', status: 'Pending Review', operationalHours: 198 }
  ];

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Pending Review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Depot Operations Dashboard</h1>
            <p className="text-gray-500">Manage bus fleet status and maintenance</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <HiCog className="w-4 h-4" />
              Update Fleet Status
            </button>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Buses</p>
                <p className="text-4xl font-bold text-gray-900">{stats.totalBuses}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <HiTruck className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Active Buses</p>
                <p className="text-4xl font-bold text-gray-900">{stats.activeBuses}</p>
                <p className="text-sm text-green-600">{stats.busesOperational} operational</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <HiCheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Under Maintenance</p>
                <p className="text-4xl font-bold text-gray-900">{stats.underMaintenance}</p>
                <p className="text-sm text-red-600">{stats.criticalIssues} critical</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <HiCog className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Awaiting Approval</p>
                <p className="text-4xl font-bold text-gray-900">{stats.awaitingApproval}</p>
                <p className="text-sm text-blue-600">{stats.busesDueToday} due today</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <HiClock className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pending Approvals */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-500">Pending Bus Condition Review</h3>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{pendingApprovals.length} awaiting action</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Trip</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingApprovals.map((approval) => (
                    <tr key={approval.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{approval.bus}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{approval.lastTrip}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{approval.condition}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                          Review <HiEye className="inline ml-1 w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Maintenance Alerts */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-500">Maintenance Alerts</h3>
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">{stats.criticalIssues} critical</span>
            </div>
            <div className="p-4 space-y-3">
              {maintenanceAlerts.map((alert) => (
                <div key={alert.id} className={`flex items-start gap-3 p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                  <alert.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{alert.bus}: {alert.issue}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {alert.daysOverdue > 0 
                        ? `${alert.daysOverdue} day${alert.daysOverdue > 1 ? 's' : ''} overdue`
                        : 'Due soon'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bus Status Overview */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-500">Bus Status Overview</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Check</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operational Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {busStatusOverview.map((bus) => (
                  <tr key={bus.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bus.bus}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bus.lastCheck}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bus.nextService}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bus.operationalHours}h</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(bus.status)}`}>
                        {bus.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-blue-600 hover:text-blue-900 text-sm font-medium mr-3">
                        <HiEye className="inline mr-1 w-4 h-4" /> View
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                        <HiCog className="inline mr-1 w-4 h-4" /> Manage
                      </button>
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