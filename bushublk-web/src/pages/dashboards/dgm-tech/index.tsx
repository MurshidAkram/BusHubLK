import { useState } from 'react';
import { FaBus, FaCheckCircle, FaCalendarCheck, FaTools, FaExclamationTriangle, FaFlag, FaFileExport, FaSearch, FaCog, FaEye } from 'react-icons/fa';
//import type MaintenanceDashboard from '../regional-tech';

const MaintenanceDashboard = () => {
  // State for the time period filter
  const [timePeriod, setTimePeriod] = useState('Last 7 Days');
  
  // Mock data - in a real app, this would come from an API
  const fleetData = {
    totalBuses: 2346,
    activeBuses: 1892,
    maintenanceBuses: 327,
    inactiveBuses: 127,
    availability: 87,
    northernAvailability: 92,
    easternAvailability: 85,
    westernAvailability: 89,
    serviceCompliance: 78,
    targetCompliance: 95,
    mttr: 2.8,
    mttrChange: -0.5,
    alerts: [
      {
        id: 1,
        type: 'bus',
        description: 'BUS-1015 - Engine Overheating',
        location: 'Northern / Depot 1',
        date: 'Today',
        status: 'Urgent',
        statusColor: 'danger'
      },
      {
        id: 2,
        type: 'calendar',
        description: '12 Buses overdue for service >30 days',
        location: 'Multiple Depots',
        date: '2 days ago',
        status: 'Pending',
        statusColor: 'warning'
      },
      {
        id: 3,
        type: 'tools',
        description: 'Depot 3 - Spare part shortage',
        location: 'Eastern / Depot 3',
        date: '3 days ago',
        status: 'In Progress',
        statusColor: 'primary'
      },
      {
        id: 4,
        type: 'bus',
        description: 'BUS-2042 - Brake system failure',
        location: 'Western / Depot 2',
        date: '5 days ago',
        status: 'Resolved',
        statusColor: 'success'
      }
    ],
    recentServices: [
      {
        busId: 'BUS-1012',
        model: 'Volvo B8R',
        depot: 'Northern / Depot 1',
        serviceType: 'Scheduled Maintenance',
        date: '15 Jun 2023',
        status: 'Completed',
        statusClass: 'active'
      },
      {
        busId: 'BUS-1015',
        model: 'Scania K320',
        depot: 'Northern / Depot 1',
        serviceType: 'Engine Repair',
        date: '10 May 2023',
        status: 'In Progress',
        statusClass: 'maintenance'
      },
      {
        busId: 'BUS-2001',
        model: 'Volvo B8R',
        depot: 'Northern / Depot 2',
        serviceType: 'Brake Inspection',
        date: '20 Jun 2023',
        status: 'Completed',
        statusClass: 'active'
      },
      {
        busId: 'BUS-3004',
        model: 'Mercedes OC500',
        depot: 'Eastern / Depot 1',
        serviceType: 'Suspension Repair',
        date: '8 May 2023',
        status: 'Pending Parts',
        statusClass: 'maintenance'
      }
    ]
  };

  // Status badge component
  const StatusBadge = ({ status, color }) => {
    const colorClasses = {
      primary: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
        {status}
      </span>
    );
  };

  // Status indicator component
  const StatusIndicator = ({ status, type }) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[type]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Global Fleet Overview</h1>
        <p className="text-gray-600">Technical health summary of the entire SLTB fleet</p>
      </div>

      {/* Fleet Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Buses Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Total Buses</h3>
            <FaBus className="text-gray-500" />
          </div>
          <div className="p-4">
            <h2 className="text-3xl font-bold mb-4">{fleetData.totalBuses.toLocaleString()}</h2>
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="font-medium">{fleetData.activeBuses.toLocaleString()} <span className="text-green-600">(80%)</span></p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Maintenance</p>
                <p className="font-medium">{fleetData.maintenanceBuses.toLocaleString()} <span className="text-yellow-600">(14%)</span></p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="font-medium">{fleetData.inactiveBuses.toLocaleString()} <span className="text-red-600">(6%)</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Fleet Availability Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Fleet Availability</h3>
            <FaCheckCircle className="text-gray-500" />
          </div>
          <div className="p-4">
            <div className="h-32 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{fleetData.availability}%</div>
                <p className="text-sm text-gray-500">Overall Availability</p>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <span className="text-sm">Northern: {fleetData.northernAvailability}%</span>
              <span className="text-sm">Eastern: {fleetData.easternAvailability}%</span>
              <span className="text-sm">Western: {fleetData.westernAvailability}%</span>
            </div>
          </div>
        </div>

        {/* Service Compliance Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Service Compliance</h3>
            <FaCalendarCheck className="text-gray-500" />
          </div>
          <div className="p-4">
            <div className="h-32 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{fleetData.serviceCompliance}%</div>
                <p className="text-sm text-gray-500">On-Time Maintenance</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span>Target: {fleetData.targetCompliance}%</span>
                <span>{fleetData.serviceCompliance}%</span>
              </div>
              <div className="bg-gray-200 h-2 rounded-full mt-1">
                <div 
                  className="bg-blue-600 h-full rounded-full" 
                  style={{ width: `${(fleetData.serviceCompliance / fleetData.targetCompliance) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* MTTR Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">MTTR</h3>
            <FaTools className="text-gray-500" />
          </div>
          <div className="p-4">
            <div className="h-32 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{fleetData.mttr}</div>
                <p className="text-sm text-gray-500">Mean Time To Repair (days)</p>
              </div>
            </div>
            <div className="text-sm mt-4">
              <span className="text-green-600">▼ {Math.abs(fleetData.mttrChange)} days</span> from last month
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Health Map */}
      {/* <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Fleet Health by Region</h3>
          <select 
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last Quarter</option>
          </select>
        </div>
        <div className="p-4">
          <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 text-lg">Interactive Map Visualization</p>
          </div>
          <div className="flex justify-between mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-sm mr-2"></div>
              <span className="text-sm">Good (0-2 issues)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-sm mr-2"></div>
              <span className="text-sm">Moderate (3-5 issues)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-sm mr-2"></div>
              <span className="text-sm">Critical (5+ issues)</span>
            </div>
          </div>
        </div>
      </div> */}

      {/* Critical Alerts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Critical Alerts</h3>
            <FaExclamationTriangle className="text-red-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alert</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fleetData.alerts.map(alert => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {alert.type === 'bus' && <FaBus className="text-red-500 mr-2" />}
                        {alert.type === 'calendar' && <FaCalendarCheck className="text-yellow-500 mr-2" />}
                        {alert.type === 'tools' && <FaTools className="text-blue-500 mr-2" />}
                        <span>{alert.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={alert.status} color={alert.statusColor} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Quick Actions</h3>
            <FaFlag className="text-gray-500" />
          </div>
          <div className="p-4 space-y-3">
            <button className="w-full flex items-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <FaFlag className="mr-3" />
              View Raised issues
            </button>
            <button className="w-full flex items-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              <FaFileExport className="mr-3" />
              Generate Monthly Report
            </button>
            <button className="w-full flex items-center px-4 py-3 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors">
              <FaSearch className="mr-3" />
              Audit Service Records
            </button>
           
          </div>
        </div>
      </div>

      {/* Recent Service Activities */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Recent Service Activities</h3>
          <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depot</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fleetData.recentServices.map((service, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.busId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.model}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.depot}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.serviceType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusIndicator status={service.status} type={service.statusClass} />
                  </td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;