import React from 'react';
import { 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaClock, 
  FaWrench, 
  FaCalendarAlt,
  FaMapMarkerAlt 
} from 'react-icons/fa';

const MaintenanceDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Active Breakdowns */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <FaExclamationTriangle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-gray-600 text-sm">Active Breakdowns</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">12</div>
                <div className="text-red-500 text-sm mt-1">+2 from yesterday</div>
              </div>
            </div>
          </div>

          {/* Resolved Today */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <FaCheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-gray-600 text-sm">Resolved Today</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">8</div>
                <div className="text-green-500 text-sm mt-1">+3 from yesterday</div>
              </div>
            </div>
          </div>

          {/* Pending Inspections */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <FaCalendarAlt className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-gray-600 text-sm">Pending Inspections</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">5</div>
                <div className="text-blue-500 text-sm mt-1">Due this week</div>
              </div>
            </div>
          </div>

         
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Regional Status */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Regional Status</h2>
                <button className="text-blue-600 text-sm hover:text-blue-800">View All</button>
              </div>
              
              <div className="space-y-4">
                {/* Status Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Operational</span>
                    </div>
                    <div className="text-lg font-semibold">8 Depots</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Minor Issues</span>
                    </div>
                    <div className="text-lg font-semibold">3 Depots</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Critical Issues</span>
                    </div>
                    <div className="text-lg font-semibold">1 Depot</div>
                  </div>
                </div>

                {/* Depot Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <div>
                      <div className="font-medium text-gray-900">Depot A</div>
                      <div className="text-sm text-gray-600">3 active breakdowns, 1 awaiting parts</div>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Critical</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                    <div>
                      <div className="font-medium text-gray-900">Depot B</div>
                      <div className="text-sm text-gray-600">2 minor issues, all repairs in progress</div>
                    </div>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Minor</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Inspections */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Inspections</h2>
                <button className="text-blue-600 text-sm hover:text-blue-800">View All</button>
              </div>
              
              <div className="space-y-4">
                {/* Periodic Safety Check */}
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaCalendarAlt className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Periodic Safety Check</div>
                    <div className="text-sm text-gray-600">Tomorrow • 9:00 AM</div>
                    <div className="text-sm text-gray-500">Depot C • 15 buses scheduled</div>
                  </div>
                </div>

                {/* Oil Change Batch */}
                <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FaWrench className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Oil Change Batch</div>
                    <div className="text-sm text-gray-600">Jul 15 • All day</div>
                    <div className="text-sm text-gray-500">Depot A • 10 buses due</div>
                  </div>
                </div>

                {/* Tire Rotation */}
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <FaMapMarkerAlt className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Tire Rotation</div>
                    <div className="text-sm text-gray-600">Jun 18 • 10:00 AM</div>
                    <div className="text-sm text-gray-500">Depot B • 8 buses scheduled</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;