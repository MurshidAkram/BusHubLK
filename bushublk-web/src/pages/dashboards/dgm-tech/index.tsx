import { useState, useEffect } from 'react';
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

interface DashboardSummary {
  total_regions: number;
  total_depots: number;
  total_buses: number;
  buses_in_maintenance: number;
  buses_out_of_service: number;
  buses_active: number;
  maintenance_percentage: number;
}

interface RegionData {
  region_id: number;
  region_name: string;
  bus_count: number;
  depot_count: number;
  maintenance_count: number;
}

const MaintenanceDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [serviceHistoryCount, setServiceHistoryCount] = useState<number>(0);
  const [partsUsageCount, setPartsUsageCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch dashboard summary data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/dgm-technical/dashboard-summary');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setDashboardData(result.data);
          setError(null);
        } else {
          throw new Error(result.message || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    const fetchRegionData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/dgm-technical/regions');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setRegionData(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch region data');
        }
      } catch (err) {
        console.error('Error fetching region data:', err);
        // Set default data if API fails
        setRegionData([
          { region_id: 1, region_name: 'Northern Region', bus_count: 756, depot_count: 3, maintenance_count: 45 },
          { region_id: 2, region_name: 'Eastern Region', bus_count: 662, depot_count: 4, maintenance_count: 38 },
          { region_id: 3, region_name: 'Western Region', bus_count: 474, depot_count: 2, maintenance_count: 29 }
        ]);
      }
    };

    const fetchServiceHistoryCount = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: '1',
          limit: '1',
          regionId: 'all',
          depotId: 'all',
          status: 'all',
          serviceType: '',
          startDate: '',
          endDate: ''
        });

        const response = await fetch(`http://localhost:5000/api/dgm-technical/service-history?${queryParams}`);
        const result = await response.json();
        
        if (result.success) {
          setServiceHistoryCount(result.data.pagination.totalRecords);
        }
      } catch (err) {
        console.error('Error fetching service history count:', err);
        setServiceHistoryCount(0);
      }
    };

    const fetchPartsUsageCount = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: '1',
          limit: '1',
          regionId: 'all',
          depotId: 'all',
          search: ''
        });

        const response = await fetch(`http://localhost:5000/api/dgm-technical/parts-history?${queryParams}`);
        const result = await response.json();
        
        if (result.success) {
          setPartsUsageCount(result.pagination.totalRecords);
        }
      } catch (err) {
        console.error('Error fetching parts usage count:', err);
        setPartsUsageCount(0);
      }
    };

    fetchDashboardData();
    fetchRegionData();
    fetchServiceHistoryCount();
    fetchPartsUsageCount();
  }, []);
  
  // Use real data or fallback to default values
  const fleetData = dashboardData ? {
    totalBuses: dashboardData.total_buses,
    activeBuses: dashboardData.buses_active,
    maintenanceBuses: dashboardData.buses_in_maintenance,
    inactiveBuses: dashboardData.buses_out_of_service,
    inServiceBreakdown: {
      northern: 756,
      eastern: 662,
      western: 474,
      onRoute: Math.floor(dashboardData.buses_active * 0.75),
      atDepot: Math.floor(dashboardData.buses_active * 0.25)
    },
    underMaintenanceBreakdown: {
      scheduled: Math.floor(dashboardData.buses_in_maintenance * 0.6),
      unscheduled: Math.floor(dashboardData.buses_in_maintenance * 0.4),
      northern: Math.floor(dashboardData.buses_in_maintenance * 0.4),
      eastern: Math.floor(dashboardData.buses_in_maintenance * 0.35),
      western: Math.floor(dashboardData.buses_in_maintenance * 0.25)
    },
    outOfServiceBreakdown: {
      awaitingParts: Math.floor(dashboardData.buses_out_of_service * 0.5),
      majorRepairs: Math.floor(dashboardData.buses_out_of_service * 0.3),
      other: Math.floor(dashboardData.buses_out_of_service * 0.2),
      northern: Math.floor(dashboardData.buses_out_of_service * 0.4),
      eastern: Math.floor(dashboardData.buses_out_of_service * 0.35),
      western: Math.floor(dashboardData.buses_out_of_service * 0.25)
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
  } : {
    totalBuses: 0,
    activeBuses: 0,
    maintenanceBuses: 0,
    inactiveBuses: 0,
    inServiceBreakdown: {
      northern: 0,
      eastern: 0,
      western: 0,
      onRoute: 0,
      atDepot: 0
    },
    underMaintenanceBreakdown: {
      scheduled: 0,
      unscheduled: 0,
      northern: 0,
      eastern: 0,
      western: 0
    },
    outOfServiceBreakdown: {
      awaitingParts: 0,
      majorRepairs: 0,
      other: 0,
      northern: 0,
      eastern: 0,
      western: 0
    },
    alerts: [],
    recentServices: []
  };

  // Service History & Parts Usage Combined Pie Chart
  const ServiceAndPartsChart = () => {
    const colors = ['#3B82F6', '#10B981'];
    
    // Use real counts from database
    const totalServiceHistory = serviceHistoryCount;
    const totalPartsUsage = partsUsageCount;
    
    const chartData = [
      { label: 'Service History', count: totalServiceHistory, color: colors[0] },
      { label: 'Parts Usage', count: totalPartsUsage, color: colors[1] }
    ];
    
    const totalCount = totalServiceHistory + totalPartsUsage;
    const [hoveredSlice, setHoveredSlice] = useState<{label: string, count: number, x: number, y: number} | null>(null);
    
    let currentAngle = 0;
    const centerX = 150;
    const centerY = 150;
    const radius = 100;

    const createSlice = (data: any, index: number) => {
      if (data.count === 0) return null;
      
      const sliceAngle = (data.count / totalCount) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      
      const startRadians = (startAngle * Math.PI) / 180;
      const endRadians = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startRadians);
      const y1 = centerY + radius * Math.sin(startRadians);
      const x2 = centerX + radius * Math.cos(endRadians);
      const y2 = centerY + radius * Math.sin(endRadians);
      
      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      currentAngle = endAngle;
      
      return (
        <g key={index}>
          <path
            d={pathData}
            fill={data.color}
            stroke="white"
            strokeWidth="2"
            style={{ 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              filter: hoveredSlice?.label === data.label ? 'brightness(1.1)' : 'none'
            }}
            onMouseEnter={(e) => {
              setHoveredSlice({
                label: data.label,
                count: data.count,
                x: e.clientX,
                y: e.clientY
              });
            }}
            onMouseMove={(e) => {
              setHoveredSlice(prev => prev ? {
                ...prev,
                x: e.clientX,
                y: e.clientY
              } : null);
            }}
            onMouseLeave={() => setHoveredSlice(null)}
          />
        </g>
      );
    };

    return (
      <div className="relative flex justify-center items-center h-80">
        <svg width="300" height="300" viewBox="0 0 300 300">
          {chartData.map((data, index) => createSlice(data, index))}
        </svg>
        
        {/* Tooltip */}
        {hoveredSlice && (
          <div 
            className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none"
            style={{
              left: hoveredSlice.x + 10,
              top: hoveredSlice.y - 40,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="text-sm font-medium">{hoveredSlice.label}</div>
            <div className="text-xs">{hoveredSlice.count.toLocaleString()} total</div>
          </div>
        )}
        
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
          <div className="text-2xl font-bold text-gray-900">{totalCount.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total Operations</div>
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Service History</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Parts Usage</span>
          </div>
        </div>
      </div>
    );
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <FaExclamationTriangle className="text-red-400 mt-1" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Quick Actions</h3>
            <FaFlag className="text-gray-500" />
          </div>
          <div className="p-4 space-y-3">
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

        {/* Service History & Parts Usage Chart */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Service History & Parts Usage Distribution</h3>
            <FaTools className="text-gray-500" />
          </div>
          <div className="p-4">
            <ServiceAndPartsChart />
          </div>
        </div>
      </div>

      {/* Recent Service Activities
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
      </div> */}
    </div>
  );
};

export default MaintenanceDashboard;