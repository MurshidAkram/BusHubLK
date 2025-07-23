import { useState } from 'react';
import { FaBus, FaCheckCircle, FaTools, FaExclamationTriangle, FaFlag, FaFileExport, FaSearch, FaCalendarCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface StatusBadgeProps {
  status: string;
  color: 'primary' | 'success' | 'warning' | 'danger';
}

interface StatusIndicatorProps {
  status: string;
  type: 'active' | 'maintenance' | 'inactive';
}

const MaintenanceDashboard = () => {
  const [timePeriod, setTimePeriod] = useState('Last 7 Days');
  const navigate = useNavigate();
  
  const fleetData = {
    totalBuses: 2346,
    activeBuses: 1892,
    maintenanceBuses: 327,
    inactiveBuses: 127,
    inServiceBreakdown: {
      northern: 756,
      eastern: 662,
      western: 474,
      onRoute: 1421,
      atDepot: 471
    },
    underMaintenanceBreakdown: {
      scheduled: 196,
      unscheduled: 131,
      northern: 131,
      eastern: 114,
      western: 82
    },
    outOfServiceBreakdown: {
      awaitingParts: 64,
      majorRepairs: 38,
      other: 25,
      northern: 51,
      eastern: 44,
      western: 32
    },
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
        model: 'A',
        depot: 'Northern / Depot 1',
        serviceType: 'Scheduled Maintenance',
        date: '15 Jun 2023',
        status: 'Completed',
        statusClass: 'active'
      },
      {
        busId: 'BUS-1015',
        model: 'B',
        depot: 'Northern / Depot 1',
        serviceType: 'Engine Repair',
        date: '10 May 2023',
        status: 'In Progress',
        statusClass: 'maintenance'
      },
      {
        busId: 'BUS-2001',
        model: 'A',
        depot: 'Northern / Depot 2',
        serviceType: 'Brake Inspection',
        date: '20 Jun 2023',
        status: 'Completed',
        statusClass: 'active'
      },
      {
        busId: 'BUS-3004',
        model: 'B',
        depot: 'Eastern / Depot 1',
        serviceType: 'Suspension Repair',
        date: '8 May 2023',
        status: 'Pending Parts',
        statusClass: 'maintenance'
      }
    ]
  };

  const StatusBadge = ({ status, color }: StatusBadgeProps) => {
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

  const StatusIndicator = ({ status, type }: StatusIndicatorProps) => {
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
            
          </div>
        </div>

        {/* In Service Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">In Service</h3>
            <FaCheckCircle className="text-green-500" />
          </div>
          <div className="p-4">
            <div className="text-3xl font-bold text-green-600 mb-2">{fleetData.activeBuses.toLocaleString()}</div>
            
          </div>
        </div>

        {/* Under Maintenance Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Under Maintenance</h3>
            <FaTools className="text-yellow-500" />
          </div>
          <div className="p-4">
            <div className="text-3xl font-bold text-red-600 mb-2">{fleetData.maintenanceBuses.toLocaleString()}</div>
            <p className="text-sm text-gray-500 mb-4">Not available for service</p>
            
            
          </div>
         
        </div>

        {/* Out of Service Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Out of Service</h3>
            <FaExclamationTriangle className="text-red-500" />
          </div>
          <div className="p-4">
            <div className="text-3xl font-bold text-red-600 mb-2">{fleetData.inactiveBuses.toLocaleString()}</div>
            <p className="text-sm text-gray-500 mb-4">Not available for service</p>
            
            
          </div>
        </div>
      </div>

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
                      <StatusBadge status={alert.status} color={alert.statusColor as StatusBadgeProps['color']} />
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
            <button
              onClick={() => navigate('/dgm-technical/Dgmtechnicalissue')}
              className="w-full flex items-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaFlag className="mr-3" />
              View Raised issues
            </button>

            <button
              onClick={() => navigate('/dgm-technical/GenerateReports')}
              className="w-full flex items-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <FaFileExport className="mr-3" />
              Generate Monthly Report
            </button>

            <button
              onClick={() => navigate('/dgm-technical/Servicehistoryexplorer')}
              className="w-full flex items-center px-4 py-3 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
            >
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
                    <StatusIndicator status={service.status} type={service.statusClass as StatusIndicatorProps['type']} />
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