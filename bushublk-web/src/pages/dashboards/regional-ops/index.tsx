import React from 'react';
import { 
  HiOfficeBuilding, 
  HiTruck, 
  HiUsers, 
  HiChartBar,
  HiClock,
  HiExclamationCircle,
  HiCheckCircle,
  HiLocationMarker,
  HiPhone,
  HiTrendingUp,
  HiFlag,
  HiClipboardList
} from 'react-icons/hi';

const RegionalOperationsOfficerDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Regional Operations Command Center</h1>
        <p className="text-gray-600">Coordinating and monitoring operations across all depots in the Western Region</p>
      </div>

      {/* Regional Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <HiOfficeBuilding className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Depots</p>
              <p className="text-2xl font-semibold text-gray-900">8</p>
              <p className="text-sm text-green-600">All operational</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <HiTruck className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Regional Fleet</p>
              <p className="text-2xl font-semibold text-gray-900">247</p>
              <p className="text-sm text-green-600">89% in service</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <HiUsers className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Staff</p>
              <p className="text-2xl font-semibold text-gray-900">496</p>
              <p className="text-sm text-purple-600">248 crews active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <HiChartBar className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Regional OTP</p>
              <p className="text-2xl font-semibold text-gray-900">84%</p>
              <p className="text-sm text-orange-600">Target: 85%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Depot Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Depot Performance Status</h2>
              <HiOfficeBuilding className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { depot: "Pettah Depot", buses: 45, otp: 92, crews: 90, status: "excellent" },
                { depot: "Nugegoda Depot", buses: 38, otp: 87, crews: 76, status: "good" },
                { depot: "Maharagama Depot", buses: 42, otp: 81, crews: 84, status: "average" },
                { depot: "Moratuwa Depot", buses: 35, otp: 78, crews: 70, status: "needs_attention" },
                { depot: "Panadura Depot", buses: 32, otp: 85, crews: 64, status: "good" },
              ].map((depot, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      depot.status === 'excellent' ? 'bg-green-500' :
                      depot.status === 'good' ? 'bg-blue-500' :
                      depot.status === 'average' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{depot.depot}</p>
                      <p className="text-xs text-gray-500">
                        {depot.buses} buses • {depot.crews} crews
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{depot.otp}%</p>
                    <p className="text-xs text-gray-500">OTP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Regional Operations Map */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Regional Operations Map</h2>
              <HiLocationMarker className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center">
                <HiLocationMarker className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Western Region Operations Map</p>
                <p className="text-xs text-gray-400">Real-time depot and fleet tracking</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-green-600">220</p>
                <p className="text-xs text-gray-500">Buses On Route</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-blue-600">27</p>
                <p className="text-xs text-gray-500">At Terminals</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Allocation & Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resource Allocation */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Resource Allocation</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fleet Utilization</span>
                  <span className="font-medium">89%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '89%'}}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Crew Allocation</span>
                  <span className="font-medium">92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '92%'}}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Route Coverage</span>
                  <span className="font-medium">96%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{width: '96%'}}></div>
                </div>
              </div>

              <div className="pt-2">
                <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">
                  Optimize Resources
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Regional Incidents */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Regional Incidents</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {[
                { depot: "Nugegoda", type: "Schedule Delay", severity: "Medium", time: "12 min ago" },
                { depot: "Moratuwa", type: "Staff Shortage", severity: "High", time: "28 min ago" },
                { depot: "Maharagama", type: "Route Deviation", severity: "Low", time: "45 min ago" },
              ].map((incident, index) => (
                <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
                  incident.severity === 'High' ? 'bg-red-50' :
                  incident.severity === 'Medium' ? 'bg-orange-50' : 'bg-yellow-50'
                }`}>
                  <HiExclamationCircle className={`w-5 h-5 mt-0.5 ${
                    incident.severity === 'High' ? 'text-red-600' :
                    incident.severity === 'Medium' ? 'text-orange-600' : 'text-yellow-600'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{incident.type}</p>
                    <p className="text-xs text-gray-600">{incident.depot} Depot</p>
                    <p className="text-xs text-gray-500">{incident.time}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    incident.severity === 'High' ? 'bg-red-100 text-red-800' :
                    incident.severity === 'Medium' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {incident.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compliance & KPIs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Compliance Status</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { metric: "Safety Compliance", value: 96, status: "good" },
                { metric: "Schedule Adherence", value: 84, status: "average" },
                { metric: "Fuel Efficiency", value: 91, status: "good" },
                { metric: "Customer Satisfaction", value: 88, status: "good" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.metric}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{item.value}%</span>
                    {item.status === 'good' ? (
                      <HiCheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <HiExclamationCircle className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                </div>
              ))}
              
              <div className="pt-2">
                <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">
                  View Detailed Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Trends */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Performance Trends</h2>
              <HiTrendingUp className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">On-Time Performance</span>
                  <span className="text-sm text-green-600">↑ 2.3%</span>
                </div>
                <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <HiChartBar className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Fleet Efficiency</span>
                  <span className="text-sm text-blue-600">↑ 1.8%</span>
                </div>
                <div className="h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <HiTrendingUp className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strategic Actions */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Strategic Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <HiPhone className="w-4 h-4 mr-2" />
                Emergency Coordination
              </button>
              <button className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <HiClipboardList className="w-4 h-4 mr-2" />
                Resource Reallocation
              </button>
              <button className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <HiTrendingUp className="w-4 h-4 mr-2" />
                Performance Analysis
              </button>
              <button className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                <HiFlag className="w-4 h-4 mr-2" />
                Compliance Review
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Operations Activity Log */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Regional Operations Log</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { 
                action: "Resource reallocation", 
                details: "5 buses transferred from Pettah to Moratuwa depot", 
                time: "15 minutes ago", 
                type: "resource", 
                depot: "Multiple",
                status: "completed" 
              },
              { 
                action: "Route optimization", 
                details: "Route 245 schedule adjusted for peak hour efficiency", 
                time: "32 minutes ago", 
                type: "route", 
                depot: "Nugegoda",
                status: "active" 
              },
              { 
                action: "Incident coordination", 
                details: "Multi-depot response to traffic congestion on Galle Road", 
                time: "48 minutes ago", 
                type: "incident", 
                depot: "Regional",
                status: "resolved" 
              },
              { 
                action: "Performance review", 
                details: "Weekly KPI assessment completed for all depots", 
                time: "1 hour ago", 
                type: "review", 
                depot: "Regional",
                status: "completed" 
              },
            ].map((log, index) => (
              <div key={index} className="flex items-start space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  log.type === 'resource' ? 'bg-purple-500' :
                  log.type === 'route' ? 'bg-green-500' :
                  log.type === 'incident' ? 'bg-red-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{log.action}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      log.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                      log.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{log.details}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">{log.time}</p>
                    <p className="text-xs text-gray-500">{log.depot}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalOperationsOfficerDashboard