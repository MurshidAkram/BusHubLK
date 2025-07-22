import React from 'react'; 
import { 
  HiClock, 
  HiTruck, 
  HiUsers, 
  HiExclamationCircle,
  HiPhone,
  HiChartBar
} from 'react-icons/hi';

const DepotOperationsManagerDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Operations Control Center</h1>
        <p className="text-gray-600">Real-time monitoring and coordination of depot operations</p>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <HiTruck className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Buses</p>
              <p className="text-2xl font-semibold text-gray-900">8</p>
              <p className="text-sm text-green-600"></p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <HiClock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Drivers</p>
              <p className="text-2xl font-semibold text-gray-900">8</p>
              <p className="text-sm text-blue-600"></p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <HiUsers className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Conductors</p>
              <p className="text-2xl font-semibold text-gray-900">7</p>
              <p className="text-sm text-gray-500"></p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <HiExclamationCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Incidents</p>
              <p className="text-2xl font-semibold text-gray-900">2</p>
              <p className="text-sm text-red-600"></p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Operations Grid - now only 1 component per column */}
      <div >
        {/* Live Schedule Status */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Live Schedule Status</h2>
              <HiClock className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            {[
              { route: "Route 138", status: "On Time", delay: "0 min", bus: "NP-1234", color: "green" },
              { route: "Route 101", status: "Delayed", delay: "12 min", bus: "NY-8901", color: "red" },
              { route: "Route 154", status: "On Time", delay: "0 min", bus: "LA-9871", color: "green" },
              { route: "Route 122", status: "Early", delay: "-3 min", bus: "NC-1234", color: "blue" },
              { route: "Route 120", status: "Delayed", delay: "8 min", bus: "NP-3456", color: "red" },
            ].map((schedule, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    schedule.color === 'green' ? 'bg-green-500' :
                    schedule.color === 'red' ? 'bg-red-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{schedule.route}</p>
                    <p className="text-xs text-gray-500">Bus: {schedule.bus}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    schedule.color === 'green' ? 'bg-green-100 text-green-800' :
                    schedule.color === 'red' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {schedule.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{schedule.delay}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty placeholder for grid alignment */}
        <div className="hidden lg:block" />
      </div>

      {/* Operations Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Incidents */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Incidents</h2>
          </div>
          <div className="p-6 space-y-3">
            {[
              { type: "Traffic Delay", route: "Route 122", severity: "Medium", time: "15 min ago" },
              { type: "Mechanical Issue", route: "Route 138", severity: "High", time: "32 min ago" },
            ].map((incident, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                <HiExclamationCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{incident.type}</p>
                  <p className="text-xs text-gray-600">{incident.route}</p>
                  <p className="text-xs text-gray-500">{incident.time}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  incident.severity === 'High' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {incident.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Crew Status */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Crew Status</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">On Duty</span>
              <span className="text-sm font-medium text-green-600">28 pairs</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">On Break</span>
              <span className="text-sm font-medium text-yellow-600">4 pairs</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{width: '12%'}}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Off Duty</span>
              <span className="text-sm font-medium text-gray-600">1 pair</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gray-500 h-2 rounded-full" style={{width: '3%'}}></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6 space-y-3">
            <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <HiUsers className="w-4 h-4 mr-2" />
              Crew status
            </button>
            <button className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              <HiExclamationCircle className="w-4 h-4 mr-2" />
              Report Incident
            </button>
            <button className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <HiClock className="w-4 h-4 mr-2" />
              Adjust Schedule
            </button>
            <button className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <HiChartBar className="w-4 h-4 mr-2" />
              View Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Operations Log */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Operations Log</h2>
        </div>
        <div className="p-6 space-y-4">
          {[
            { action: "Schedule adjustment", details: "Route 03B delayed by 15 minutes due to traffic", time: "2 minutes ago", type: "schedule", status: "resolved" },
            { action: "Crew replacement", details: "Emergency crew assigned to Bus LH-9876", time: "18 minutes ago", type: "crew", status: "active" },
            { action: "Route optimization", details: "Alternative route suggested for Route 05C", time: "35 minutes ago", type: "route", status: "completed" },
            { action: "Incident response", details: "Breakdown assistance dispatched to Bus LH-3456", time: "1 hour ago", type: "incident", status: "resolved" },
          ].map((log, index) => (
            <div key={index} className="flex items-start space-x-4 py-3 border-b border-gray-100 last:border-b-0">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                log.type === 'schedule' ? 'bg-blue-500' :
                log.type === 'crew' ? 'bg-purple-500' :
                log.type === 'route' ? 'bg-green-500' : 'bg-red-500'
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
                <p className="text-xs text-gray-400 mt-1">{log.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DepotOperationsManagerDashboard;
