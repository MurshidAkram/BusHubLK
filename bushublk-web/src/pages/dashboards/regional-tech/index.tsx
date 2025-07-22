import React from 'react';
import { 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaClock, 
  FaWrench, 
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaBus,
  FaTools,
  FaClipboardList
} from 'react-icons/fa';

const MaintenanceDashboard = () => {
  // Sample data
  const regions = [
    {
      name: 'Western Province',
      status: 'operational',
      depots: [
        { name: 'Colombo Central', issues: 2, status: 'minor' },
        { name: 'Gampaha Main', issues: 0, status: 'operational' },
        { name: 'Kalutara', issues: 1, status: 'minor' }
      ],
      upcomingServices: 15,
      breakdowns: 3
    },
    {
      name: 'Central Province',
      status: 'critical',
      depots: [
        { name: 'Kandy Central', issues: 4, status: 'critical' },
        { name: 'Matale', issues: 2, status: 'minor' }
      ],
      upcomingServices: 8,
      breakdowns: 6
    },
    {
      name: 'Southern Province',
      status: 'operational',
      depots: [
        { name: 'Galle Main', issues: 0, status: 'operational' },
        { name: 'Matara', issues: 1, status: 'minor' }
      ],
      upcomingServices: 12,
      breakdowns: 2
    }
  ];

  const inspections = [
    {
      type: 'Periodic Safety Check',
      date: 'Tomorrow • 9:00 AM',
      location: 'Colombo Central Depot',
      buses: 15,
      priority: 'high'
    },
    {
      type: 'Oil Change Batch',
      date: 'Jul 15 • All day',
      location: 'Gampaha Main Depot',
      buses: 10,
      priority: 'medium'
    },
    {
      type: 'Tire Rotation',
      date: 'Jun 18 • 10:00 AM',
      location: 'Kandy Central Depot',
      buses: 8,
      priority: 'low'
    }
  ];

  const activeIssues = [
    {
      id: 'ISS-2023-045',
      bus: 'NP-AB-7894',
      issue: 'Engine overheating',
      depot: 'Kandy Central',
      status: 'awaiting parts',
      daysOpen: 3
    },
    {
      id: 'ISS-2023-046',
      bus: 'WP-EF-4567',
      issue: 'Brake system failure',
      depot: 'Colombo Central',
      status: 'in progress',
      daysOpen: 1
    },
    {
      id: 'ISS-2023-047',
      bus: 'SP-XY-1234',
      issue: 'AC compressor failure',
      depot: 'Galle Main',
      status: 'diagnosing',
      daysOpen: 2
    }
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'operational': return 'bg-green-100 text-green-800';
      case 'minor': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'awaiting parts': return 'bg-purple-100 text-purple-800';
      case 'in progress': return 'bg-yellow-100 text-yellow-800';
      case 'diagnosing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Top Metrics Cards - Keep as is */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <FaCheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-gray-600 text-sm"></span>
                </div>
                <div className="text-3xl font-bold text-gray-900">8</div>
                <div className="text-green-500 text-sm mt-1">+3 from yesterday</div>
              </div>
            </div>
          </div>

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

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <FaTools className="w-5 h-5 text-purple-500 mr-2" />
                  <span className="text-gray-600 text-sm">Preventive Maintenance</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">23</div>
                <div className="text-purple-500 text-sm mt-1">Scheduled this month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Region-wise Service Monitor */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Region-wise Service Monitor</h2>
                <button className="text-blue-600 text-sm hover:text-blue-800">View All Regions</button>
              </div>
              
              <div className="space-y-6">
                {regions.map((region, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <FaMapMarkerAlt className={`w-5 h-5 mr-2 ${
                          region.status === 'operational' ? 'text-green-500' : 
                          region.status === 'minor' ? 'text-orange-500' : 'text-red-500'
                        }`} />
                        <h3 className="font-semibold text-gray-800">{region.name}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(region.status)}`}>
                        {region.status.charAt(0).toUpperCase() + region.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">Depots</div>
                        <div className="font-semibold">{region.depots.length}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">Upcoming Services</div>
                        <div className="font-semibold">{region.upcomingServices}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">Active Breakdowns</div>
                        <div className="font-semibold">{region.breakdowns}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Depot Status</h4>
                      {region.depots.map((depot, depotIndex) => (
                        <div key={depotIndex} className="flex justify-between items-center p-2 border-b border-gray-100 last:border-0">
                          <span className="text-gray-800">{depot.name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(depot.status)}`}>
                            {depot.issues} {depot.issues === 1 ? 'issue' : 'issues'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

           
          </div>

          {/* Inspection Scheduler */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Inspection Scheduler</h2>
                <button className="text-blue-600 text-sm hover:text-blue-800">Schedule New</button>
              </div>
              
              <div className="space-y-4">
                {inspections.map((inspection, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                          inspection.priority === 'high' ? 'bg-red-100' :
                          inspection.priority === 'medium' ? 'bg-orange-100' : 'bg-blue-100'
                        }`}>
                          <FaClipboardList className={
                            inspection.priority === 'high' ? 'text-red-600' :
                            inspection.priority === 'medium' ? 'text-orange-600' : 'text-blue-600'
                          } />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{inspection.type}</h3>
                          <p className="text-sm text-gray-600">{inspection.date}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(inspection.priority)}`}>
                        {inspection.priority}
                      </span>
                    </div>
                    <div className="pl-11">
                      <div className="text-sm text-gray-600 mb-1">
                        <FaMapMarkerAlt className="inline mr-1" /> {inspection.location}
                      </div>
                      <div className="text-sm text-gray-600">
                        <FaBus className="inline mr-1" /> {inspection.buses} buses
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-3 bg-blue-50 rounded-lg flex flex-col items-center justify-center hover:bg-blue-100 transition-colors">
                  <FaWrench className="w-6 h-6 text-blue-600 mb-2" />
                  <span className="text-sm text-gray-800">Log New Issue</span>
                </button>
                <button className="p-3 bg-green-50 rounded-lg flex flex-col items-center justify-center hover:bg-green-100 transition-colors">
                  <FaCalendarAlt className="w-6 h-6 text-green-600 mb-2" />
                  <span className="text-sm text-gray-800">Schedule Inspection</span>
                </button>
                <button className="p-3 bg-purple-50 rounded-lg flex flex-col items-center justify-center hover:bg-purple-100 transition-colors">
                  <FaClipboardList className="w-6 h-6 text-purple-600 mb-2" />
                  <span className="text-sm text-gray-800">Generate Report</span>
                </button>
                <button className="p-3 bg-orange-50 rounded-lg flex flex-col items-center justify-center hover:bg-orange-100 transition-colors">
                  <FaTools className="w-6 h-6 text-orange-600 mb-2" />
                  <span className="text-sm text-gray-800">Maintenance Checklist</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;