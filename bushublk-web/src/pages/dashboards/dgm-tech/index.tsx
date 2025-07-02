import React from 'react';
import { 
  HiGlobeAlt,
  HiOfficeBuilding,
  HiTruck,
  HiCog,
  HiExclamationCircle,
  HiUserGroup,
  HiChartBar,
  HiTrendingUp,
  HiShieldCheck,
  HiLightBulb,
  HiCurrencyDollar,
  HiCalendar,
  HiClipboardCheck,
  HiCollection
} from 'react-icons/hi';

const DGMTechnicalDashboard = () => {
  // Mock data - replace with actual API calls
  const stats = {
    totalRegions: 9,
    totalDepots: 67,
    totalFleetVehicles: 2850,
    technicalStaff: 420,
    criticalIssues: 23,
    maintenanceBacklog: 156,
    complianceScore: 89,
    budgetUtilization: 76,
    innovationProjects: 12,
    trainingPrograms: 28,
    qualityScore: 92,
    resourceEfficiency: 84
  };

  const regionalPerformance = [
    { region: 'Western Province', depots: 15, vehicles: 680, compliance: 94, efficiency: 91, criticalIssues: 3, budget: 78 },
    { region: 'Southern Province', depots: 12, vehicles: 420, compliance: 87, efficiency: 88, criticalIssues: 5, budget: 82 },
    { region: 'Central Province', depots: 10, vehicles: 380, compliance: 91, efficiency: 89, criticalIssues: 2, budget: 75 },
    { region: 'Northern Province', depots: 8, vehicles: 290, compliance: 85, efficiency: 86, criticalIssues: 4, budget: 71 },
    { region: 'Eastern Province', depots: 6, vehicles: 220, compliance: 88, efficiency: 84, criticalIssues: 3, budget: 69 },
    { region: 'North Western', depots: 7, vehicles: 310, compliance: 90, efficiency: 87, criticalIssues: 2, budget: 73 },
    { region: 'North Central', depots: 5, vehicles: 180, compliance: 86, efficiency: 83, criticalIssues: 2, budget: 68 },
    { region: 'Uva Province', depots: 4, vehicles: 150, compliance: 89, efficiency: 85, criticalIssues: 1, budget: 70 },
    { region: 'Sabaragamuwa', depots: 6, vehicles: 220, compliance: 87, efficiency: 82, criticalIssues: 1, budget: 74 }
  ];

  const strategicKPIs = [
    { title: 'Fleet Availability', value: '91.2%', target: '95%', trend: '+2.4%', status: 'improving' },
    { title: 'Maintenance Cost/KM', value: 'Rs. 22.80', target: 'Rs. 20.00', trend: '-1.8%', status: 'improving' },
    { title: 'Technical Compliance', value: '89.3%', target: '95%', trend: '+3.2%', status: 'improving' },
    { title: 'Innovation Index', value: '7.2/10', target: '8.5/10', trend: '+0.8', status: 'improving' },
    { title: 'Staff Competency', value: '86.5%', target: '90%', trend: '+2.1%', status: 'improving' },
    { title: 'Resource Efficiency', value: '84.3%', target: '90%', trend: '+1.5%', status: 'improving' }
  ];

  const criticalAlerts = [
    { id: 1, region: 'Southern Province', issue: 'Major engine overhaul backlog affecting 15 vehicles', priority: 'critical', impact: 'high', eta: '2 days' },
    { id: 2, region: 'Northern Province', issue: 'Parts shortage for brake system maintenance', priority: 'high', impact: 'medium', eta: '1 week' },
    { id: 3, region: 'Eastern Province', issue: 'Technical staff shortage - 3 positions vacant', priority: 'high', impact: 'medium', eta: 'ongoing' },
    { id: 4, region: 'Central Province', issue: 'Compliance audit findings require immediate attention', priority: 'high', impact: 'high', eta: '3 days' }
  ];

  const upcomingMilestones = [
    { title: 'Q2 Technical Review', date: '2024-06-15', status: 'upcoming', department: 'All Regions' },
    { title: 'Fleet Modernization Phase 2', date: '2024-07-01', status: 'planning', department: 'Procurement' },
    { title: 'National Compliance Audit', date: '2024-06-30', status: 'preparation', department: 'Quality Assurance' },
    { title: 'Innovation Summit 2024', date: '2024-08-20', status: 'upcoming', department: 'R&D' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DGM Technical Strategic Dashboard</h1>
          <p className="text-gray-600 mt-1">National technical oversight and strategic decision support</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <span>•</span>
            <span>Covering {stats.totalRegions} regions, {stats.totalDepots} depots</span>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Strategic Priority Score</p>
            <p className="text-2xl font-bold text-blue-600">8.4/10</p>
            <p className="text-xs text-green-600">↑ +0.3 from last month</p>
          </div>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500">
              <HiGlobeAlt className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-700">National Coverage</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalRegions} Regions</p>
              <p className="text-xs text-blue-600">{stats.totalDepots} depots nationwide</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500">
              <HiTruck className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-700">Total Fleet</p>
              <p className="text-2xl font-bold text-green-900">{stats.totalFleetVehicles.toLocaleString()}</p>
              <p className="text-xs text-green-600">Vehicles under management</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500">
              <HiUserGroup className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-700">Technical Workforce</p>
              <p className="text-2xl font-bold text-purple-900">{stats.technicalStaff}</p>
              <p className="text-xs text-purple-600">Skilled professionals</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm border border-orange-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-500">
              <HiExclamationCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-700">Critical Issues</p>
              <p className="text-2xl font-bold text-orange-900">{stats.criticalIssues}</p>
              <p className="text-xs text-orange-600">Requiring immediate attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic KPIs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Strategic Key Performance Indicators</h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View Detailed Analytics</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategicKPIs.map((kpi, index) => (
            <div key={index} className="p-4 rounded-lg border border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">{kpi.title}</p>
                <span className={`text-xs font-medium ${getStatusColor(kpi.status)}`}>
                  {kpi.trend}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                  <p className="text-xs text-gray-500">Target: {kpi.target}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <HiTrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regional Performance Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Regional Performance Matrix</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">Performance</button>
            <button className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">Compliance</button>
            <button className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">Budget</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Region</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Depots</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Vehicles</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Compliance</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Efficiency</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Issues</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Budget</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {regionalPerformance.map((region, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{region.region}</td>
                  <td className="py-3 px-4 text-center text-gray-700">{region.depots}</td>
                  <td className="py-3 px-4 text-center text-gray-700">{region.vehicles}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-medium ${getComplianceColor(region.compliance)}`}>
                      {region.compliance}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-medium ${getComplianceColor(region.efficiency)}`}>
                      {region.efficiency}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      region.criticalIssues === 0 ? 'text-green-600 bg-green-50' :
                      region.criticalIssues <= 2 ? 'text-yellow-600 bg-yellow-50' :
                      'text-red-600 bg-red-50'
                    }`}>
                      {region.criticalIssues}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700">{region.budget}%</td>
                  <td className="py-3 px-4 text-center">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Alerts & Upcoming Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Strategic Alerts</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All Issues</button>
          </div>
          <div className="space-y-4">
            {criticalAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border ${getStatusColor(alert.priority)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{alert.region}</p>
                    <p className="text-sm text-gray-700 mt-1">{alert.issue}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.priority)}`}>
                    {alert.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Impact: {alert.impact}</span>
                  <span>ETA: {alert.eta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Strategic Milestones</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View Calendar</button>
          </div>
          <div className="space-y-4">
            {upcomingMilestones.map((milestone, index) => (
              <div key={index} className="flex items-center p-3 rounded-lg hover:bg-gray-50">
                <div className="p-2 rounded-full bg-blue-50 mr-3">
                  <HiCalendar className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{milestone.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                    <span>{milestone.date}</span>
                    <span>•</span>
                    <span>{milestone.department}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  milestone.status === 'upcoming' ? 'text-blue-600 bg-blue-50' :
                  milestone.status === 'planning' ? 'text-purple-600 bg-purple-50' :
                  'text-yellow-600 bg-yellow-50'
                }`}>
                  {milestone.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Actions Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Strategic Command Center</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <HiGlobeAlt className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Regional Review</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors">
            <HiTruck className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Fleet Analytics</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <HiCog className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Maintenance Strategy</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <HiUserGroup className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Workforce Planning</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
            <HiCurrencyDollar className="h-8 w-8 text-indigo-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Budget Analysis</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-colors">
            <HiLightBulb className="h-8 w-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Innovation Hub</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DGMTechnicalDashboard