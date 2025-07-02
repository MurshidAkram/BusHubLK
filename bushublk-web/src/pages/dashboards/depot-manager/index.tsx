import React from 'react';
import { 
  HiTruck, 
  HiUsers, 
  HiExclamationCircle, 
  HiClipboardCheck,
  HiClock,
  HiChartBar
} from 'react-icons/hi';

const DepotManagerDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Depot Manager Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening at your depot today.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <HiTruck className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Buses</p>
              <p className="text-2xl font-semibold text-gray-900">24</p>
              <p className="text-sm text-green-600">+2 from yesterday</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <HiUsers className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Staff on Duty</p>
              <p className="text-2xl font-semibold text-gray-900">48</p>
              <p className="text-sm text-gray-500">24 Drivers, 24 Conductors</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <HiExclamationCircle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Maintenance Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">3</p>
              <p className="text-sm text-orange-600">Needs attention</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <HiClipboardCheck className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Routes Covered</p>
              <p className="text-2xl font-semibold text-gray-900">12</p>
              <p className="text-sm text-green-600">100% coverage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
              <HiClock className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { route: "Route 01", time: "06:00 AM", driver: "John Silva", status: "On Time" },
                { route: "Route 03", time: "06:30 AM", driver: "Priya Perera", status: "Delayed" },
                { route: "Route 05", time: "07:00 AM", driver: "Kasun Fernando", status: "On Time" },
                { route: "Route 07", time: "07:30 AM", driver: "Nimal Raj", status: "On Time" },
              ].map((schedule, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{schedule.route}</p>
                      <p className="text-xs text-gray-500">{schedule.driver}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{schedule.time}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      schedule.status === 'On Time' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {schedule.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fleet Status */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Fleet Status</h2>
              <HiChartBar className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Buses</span>
                <span className="text-sm font-medium text-green-600">24/30</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '80%'}}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Under Maintenance</span>
                <span className="text-sm font-medium text-orange-600">3/30</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{width: '10%'}}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Out of Service</span>
                <span className="text-sm font-medium text-red-600">3/30</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{width: '10%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { action: "Route assignment updated", details: "Route 03 assigned to Bus LH-2456", time: "2 minutes ago", type: "assignment" },
              { action: "Maintenance completed", details: "Bus LH-1234 - Oil change and inspection", time: "1 hour ago", type: "maintenance" },
              { action: "Driver reported late", details: "John Silva - Route 01 - Traffic delay", time: "2 hours ago", type: "alert" },
              { action: "New schedule created", details: "Weekend special routes added", time: "3 hours ago", type: "schedule" },
            ].map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'assignment' ? 'bg-blue-500' :
                  activity.type === 'maintenance' ? 'bg-green-500' :
                  activity.type === 'alert' ? 'bg-red-500' : 'bg-purple-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.details}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepotManagerDashboard;