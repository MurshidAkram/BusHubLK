import React from 'react';
import { 
  HiOfficeBuilding,
  HiCog, 
  HiClipboardCheck, 
  HiExclamationCircle, 
  HiTruck, 
  HiCollection,
  HiChartBar,
  HiUserGroup,
  HiAcademicCap,
  HiShieldCheck,
  HiLightBulb,
  HiCalendar
} from 'react-icons/hi';

const RegionalTechnicalOfficerDashboard = () => {
  // Mock data - replace with actual API calls
  const stats = {
    totalDepots: 8,
    activeMaintenanceTasks: 45,
    pendingInspections: 23,
    criticalIssues: 7,
    totalFleetVehicles: 320,
    technicalStaff: 64,
    trainingPrograms: 12,
    complianceScore: 92,
    resourceUtilization: 87,
    completedToday: 28,
    upcomingPM: 156,
    innovationProjects: 5
  };

  const depotOverview = [
    { id: 1, name: 'Colombo Central Depot', vehicles: 45, staff: 12, status: 'operational', compliance: 95, criticalIssues: 1 },
    { id: 2, name: 'Maharagama Depot', vehicles: 38, staff: 9, status: 'operational', compliance: 88, criticalIssues: 2 },
    { id: 3, name: 'Nugegoda Depot', vehicles: 42, staff: 11, status: 'maintenance', compliance: 92, criticalIssues: 0 },
    { id: 4, name: 'Moratuwa Depot', vehicles: 35, staff: 8, status: 'operational', compliance: 90, criticalIssues: 1 }
  ];

  const criticalAlerts = [
    { id: 1, depot: 'Colombo Central', issue: 'Engine overhaul required for 3 buses', priority: 'high', time: '15 minutes ago' },
    { id: 2, depot: 'Maharagama', issue: 'Brake system maintenance backlog', priority: 'medium', time: '1 hour ago' },
    { id: 3, depot: 'Nugegoda', issue: 'Parts inventory critically low', priority: 'high', time: '2 hours ago' },
    { id: 4, depot: 'Moratuwa', issue: 'Safety compliance inspection due', priority: 'medium', time: '3 hours ago' }
  ];

  const performanceMetrics = [
    { title: 'Fleet Availability', value: '89%', trend: '+2.3%', color: 'green' },
    { title: 'Maintenance Efficiency', value: '92%', trend: '+1.8%', color: 'green' },
    { title: 'Cost per KM', value: 'Rs. 24.5', trend: '-3.2%', color: 'green' },
    { title: 'Technical Issues', value: '7', trend: '-15%', color: 'green' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-50';
      case 'maintenance': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
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

  const getTrendColor = (trend: string) => {
    return trend.startsWith('+') || trend.startsWith('-') && trend.includes('%') 
      ? 'text-green-600' 
      : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Regional Technical Officer Dashboard</h1>
          <p className="text-gray-600 mt-1">Regional engineering oversight and technical coordination</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last updated</p>
          <p className="text-lg font-semibold text-gray-900">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-50">
              <HiOfficeBuilding className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Depots</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDepots}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-50">
              <HiCog className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeMaintenanceTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-50">
              <HiExclamationCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Critical Issues</p>
              <p className="text-2xl font-bold text-gray-900">{stats.criticalIssues}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-50">
              <HiTruck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Fleet Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFleetVehicles}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-50">
              <HiUserGroup className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Technical Staff</p>
              <p className="text-2xl font-bold text-gray-900">{stats.technicalStaff}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-50">
              <HiAcademicCap className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Training Programs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.trainingPrograms}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-50">
              <HiShieldCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Compliance Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.complianceScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-50">
              <HiLightBulb className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Innovation Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.innovationProjects}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="p-4 rounded-lg bg-gray-50">
              <p className="text-sm text-gray-600">{metric.title}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xl font-bold text-gray-900">{metric.value}</p>
                <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                  {metric.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Depot Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Depot Overview</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {depotOverview.map((depot) => (
              <div key={depot.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">{depot.name}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(depot.status)}`}>
                      {depot.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <span>{depot.vehicles} vehicles</span>
                    <span>{depot.staff} staff</span>
                    <span>Compliance: {depot.compliance}%</span>
                  </div>
                  {depot.criticalIssues > 0 && (
                    <p className="text-xs text-red-600 mt-1">{depot.criticalIssues} critical issue(s)</p>
                  )}
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Details
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Critical Alerts</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {criticalAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                  {alert.priority.charAt(0).toUpperCase() + alert.priority.slice(1)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{alert.depot}</p>
                  <p className="text-sm text-gray-600">{alert.issue}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <HiOfficeBuilding className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Depot Status</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <HiCog className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Coordinate Tasks</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors">
            <HiClipboardCheck className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Quality Review</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <HiUserGroup className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Staff Management</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
            <HiAcademicCap className="h-8 w-8 text-indigo-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Training</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-colors">
            <HiChartBar className="h-8 w-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegionalTechnicalOfficerDashboard