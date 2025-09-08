import { useState, useEffect } from 'react';
import { 
  FaBus, FaCheckCircle, FaTools, FaExclamationTriangle, 
  FaFlag, FaFileExport, FaSearch 
} from 'react-icons/fa';
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
  total_accidents: number;
  total_breakdowns: number;
  total_incidents: number;
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
  const [inspectionCount, setInspectionCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch dashboard summary data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/dgm-technical/dashboard-summary');
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
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
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        if (result.success) {
          setRegionData(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch region data');
        }
      } catch (err) {
        console.error('Error fetching region data:', err);
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

    const fetchInspectionCount = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: '1',
          limit: '1',
          regionId: 'all',
          depotId: 'all',
          status: 'all'
        });

        const response = await fetch(`http://localhost:5000/api/dgm-technical/inspection-history?${queryParams}`);
        const result = await response.json();
        
        if (result.success) {
          setInspectionCount(result.pagination.totalRecords);
        }
      } catch (err) {
        console.error('Error fetching inspection count:', err);
        setInspectionCount(0);
      }
    };

    fetchDashboardData();
    fetchRegionData();
    fetchServiceHistoryCount();
    fetchPartsUsageCount();
    fetchInspectionCount();
  }, []);

  // Chart for Service, Parts Usage & Inspections
  const ServicePartsInspectionChart = () => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B'];
    const totalServiceHistory = serviceHistoryCount;
    const totalPartsUsage = partsUsageCount;
    const totalInspections = inspectionCount;
    
    const chartData = [
      { label: 'Service History', count: totalServiceHistory, color: colors[0] },
      { label: 'Parts Usage', count: totalPartsUsage, color: colors[1] },
      { label: 'Inspections', count: totalInspections, color: colors[2] }
    ];
    
    const totalCount = totalServiceHistory + totalPartsUsage + totalInspections;
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
            style={{ cursor: 'pointer', filter: hoveredSlice?.label === data.label ? 'brightness(1.1)' : 'none' }}
            onMouseEnter={(e) => setHoveredSlice({ label: data.label, count: data.count, x: e.clientX, y: e.clientY })}
            onMouseMove={(e) => setHoveredSlice(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
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
        {hoveredSlice && (
          <div 
            className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none"
            style={{ left: hoveredSlice.x + 10, top: hoveredSlice.y - 40, transform: 'translateX(-50%)' }}
          >
            <div className="text-sm font-medium">{hoveredSlice.label}</div>
            <div className="text-xs">{hoveredSlice.count.toLocaleString()} total</div>
          </div>
        )}
        <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
          <div className="text-2xl font-bold text-gray-900">{totalCount.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total Operations</div>
        </div>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
          <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div><span className="text-xs text-gray-600">Service History</span></div>
          <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div><span className="text-xs text-gray-600">Parts Usage</span></div>
          <div className="flex items-center"><div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div><span className="text-xs text-gray-600">Inspections</span></div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard data...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex">
          <FaExclamationTriangle className="text-red-400 mt-1" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Retry</button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
        {/* Total Regions */}
        <SummaryCard title="Total Regions" value={dashboardData?.total_regions} icon={<FaFlag className="text-blue-500" />} color="text-blue-600" />
        {/* Total Depots */}
        <SummaryCard title="Total Depots" value={dashboardData?.total_depots} icon={<FaBus className="text-purple-500" />} color="text-purple-600" />
        {/* Total Buses */}
        <SummaryCard title="Total Buses" value={dashboardData?.total_buses} icon={<FaBus className="text-gray-500" />} color="text-gray-600" />
        {/* In Service */}
        <SummaryCard title="In Service" value={dashboardData?.buses_active} icon={<FaCheckCircle className="text-green-500" />} color="text-green-600" />
        {/* Under Maintenance */}
        <SummaryCard title="Under Maintenance" value={dashboardData?.buses_in_maintenance} icon={<FaTools className="text-yellow-500" />} color="text-yellow-600" subtitle="Not available for service" />
        {/* Out of Service */}
        <SummaryCard title="Out of Service" value={dashboardData?.buses_out_of_service} icon={<FaExclamationTriangle className="text-red-500" />} color="text-red-600" subtitle="Not available for service" />
      </div>

      {/* Incident Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Incidents */}
        <SummaryCard title="Total Incidents" value={dashboardData?.total_incidents} icon={<FaExclamationTriangle className="text-orange-500" />} color="text-orange-600" subtitle="All reported incidents" />
        {/* Accidents */}
        <SummaryCard title="Accidents" value={dashboardData?.total_accidents} icon={<FaExclamationTriangle className="text-red-500" />} color="text-red-600" subtitle="Traffic accidents" />
        {/* Breakdowns */}
        <SummaryCard title="Breakdowns" value={dashboardData?.total_breakdowns} icon={<FaTools className="text-yellow-500" />} color="text-yellow-600" subtitle="Mechanical failures" />
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
    {/* Smaller width, taller height */}
    <button 
      onClick={() => navigate('/dgm-technical/GenerateReports')} 
      className="w-full flex items-center px-4 py-6 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
    >
      <FaFileExport className="mr-3" /> Generate Monthly Report
    </button>

    <button 
      onClick={() => navigate('/dgm-technical/Servicehistoryexplorer')} 
      className="w-full flex items-center px-4 py-6 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
    >
      <FaSearch className="mr-3" /> Audit Service Records
    </button>
  </div>
</div>

        {/* Operations Overview Chart */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Operations Overview: Service, Parts & Inspections</h3>
            <FaTools className="text-gray-500" />
          </div>
          <div className="p-4">
            <ServicePartsInspectionChart />
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Summary Card component
const SummaryCard = ({ title, value, icon, color, subtitle }: { title: string, value: number | undefined, icon: React.ReactNode, color: string, subtitle?: string }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
      <h3 className="font-semibold text-gray-800">{title}</h3>
      {icon}
    </div>
    <div className="p-4">
      <div className={`text-3xl font-bold ${color} mb-2`}>{value?.toLocaleString() || 0}</div>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  </div>
);

export default MaintenanceDashboard;
