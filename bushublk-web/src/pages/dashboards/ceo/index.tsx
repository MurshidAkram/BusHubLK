import { useState, useEffect } from 'react';
import { 
  HiGlobeAlt,
  HiOfficeBuilding,
  HiCurrencyDollar,
  HiTrendingUp,
  HiUsers,
  HiTruck,
  HiChartSquareBar,
  HiShieldCheck,
  HiExclamationCircle,
  HiArrowUp,
  HiArrowDown,
  HiLightBulb,
  HiFlag
} from 'react-icons/hi';

const CEODashboard = () => {
  const [fleetData, setFleetData] = useState({
    totalRegions: 0,
    totalDepots: 0,
    totalFleet: 0,
    loading: true,
    error: null as string | null
  });

  const [regionalData, setRegionalData] = useState<any[]>([]);
  const [regionalLoading, setRegionalLoading] = useState(true);
  const [regionalError, setRegionalError] = useState<string | null>(null);

  // Fetch fleet summary and regional data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFleetData(prev => ({ ...prev, loading: true }));
        setRegionalLoading(true);
        
        // Fetch fleet summary
        const fleetResponse = await fetch('http://localhost:5000/api/ceo/fleet-summary');
        
        if (!fleetResponse.ok) {
          throw new Error(`Fleet API error! status: ${fleetResponse.status}`);
        }
        
        const fleetResult = await fleetResponse.json();
        
        if (fleetResult.success) {
          setFleetData({
            totalRegions: parseInt(fleetResult.data.total_regions) || 0,
            totalDepots: parseInt(fleetResult.data.total_depots) || 0,
            totalFleet: parseInt(fleetResult.data.total_buses) || 0,
            loading: false,
            error: null
          });
        } else {
          throw new Error('Fleet API response indicates failure');
        }

        // Fetch regional data
        const regionalResponse = await fetch('http://localhost:5000/api/ceo/regions');
        
        if (!regionalResponse.ok) {
          throw new Error(`Regional API error! status: ${regionalResponse.status}`);
        }
        
        const regionalResult = await regionalResponse.json();
        
        if (regionalResult.success) {
          // Transform regional data to match expected format
          const transformedRegions = regionalResult.data.map((region: any, index: number) => ({
            id: region.region_id,
            name: region.region_name,
            depots: region.depot_count || 0,
            vehicles: region.bus_count || 0,
            revenue: (region.bus_count || 0) * 100000000, // Estimate revenue based on fleet size
            efficiency: 85 + (index % 10), // Mock efficiency for now
            growth: (Math.random() * 6 - 1).toFixed(1), // Random growth between -1% and 5%
            status: region.active_buses > (region.bus_count * 0.8) ? 'excellent' : 
                   region.active_buses > (region.bus_count * 0.6) ? 'good' : 'needs_attention',
            criticalIssues: region.maintenance_buses > 10 ? Math.floor(region.maintenance_buses / 10) : 0,
            active_buses: region.active_buses || 0,
            maintenance_buses: region.maintenance_buses || 0,
            out_of_service_buses: region.out_of_service_buses || 0
          }));
          
          setRegionalData(transformedRegions);
          setRegionalLoading(false);
          setRegionalError(null);
        } else {
          throw new Error('Regional API response indicates failure');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        
        // Set fallback data for fleet
        setFleetData({
          totalRegions: 12,
          totalDepots: 45,
          totalFleet: 2850,
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });

        // Set fallback data for regions
        setRegionalData([
          { 
            id: 1, 
            name: 'Western Province', 
            depots: 12, 
            vehicles: 720, 
            revenue: 680000000, 
            efficiency: 89, 
            growth: 5.2,
            status: 'excellent',
            criticalIssues: 2
          },
          { 
            id: 2, 
            name: 'Central Province', 
            depots: 8, 
            vehicles: 480, 
            revenue: 420000000, 
            efficiency: 85, 
            growth: 3.8,
            status: 'good',
            criticalIssues: 1
          },
          { 
            id: 3, 
            name: 'Southern Province', 
            depots: 10, 
            vehicles: 650, 
            revenue: 580000000, 
            efficiency: 88, 
            growth: 4.5,
            status: 'excellent',
            criticalIssues: 0
          }
        ]);
        setRegionalLoading(false);
        setRegionalError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    fetchData();
  }, []);

  // Mock data - replace with actual API calls
  const executiveMetrics = {
    totalRevenue: 2450000000, // in LKR
    totalDepots: 45,
    totalFleet: 2850,
    totalEmployees: 8420,
    totalRoutes: 320,
    totalPassengers: 185000, // daily
    operationalEfficiency: 87,
    customerSatisfaction: 82,
    safetyScore: 94,
    complianceScore: 91
  };

  const keyAlerts = [
    { id: 1, type: 'financial', message: 'Q4 revenue target 98% achieved', priority: 'low', time: '2 hours ago' },
    { id: 2, type: 'operational', message: 'Eastern Province efficiency below target', priority: 'high', time: '4 hours ago' },
    { id: 3, type: 'compliance', message: 'Annual safety audit completed successfully', priority: 'low', time: '1 day ago' },
    { id: 4, type: 'strategic', message: 'New depot construction project on schedule', priority: 'medium', time: '1 day ago' },
    { id: 5, type: 'technical', message: 'Fleet modernization program 75% complete', priority: 'medium', time: '2 days ago' }
  ];

  const performanceIndicators = [
    { title: 'Revenue Growth', value: '8.5%', trend: 'up', target: '10%', status: 'on-track' },
    { title: 'Operational Costs', value: 'Rs. 18.2/km', trend: 'down', target: 'Rs. 17.5/km', status: 'improving' },
    { title: 'Fleet Utilization', value: '91%', trend: 'up', target: '93%', status: 'on-track' },
    { title: 'Employee Satisfaction', value: '78%', trend: 'up', target: '80%', status: 'on-track' },
    { title: 'Safety Incidents', value: '0.08/1000km', trend: 'down', target: '0.05/1000km', status: 'improving' },
    { title: 'On-Time Performance', value: '87%', trend: 'up', target: '90%', status: 'on-track' }
  ];

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `Rs. ${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `Rs. ${(amount / 1000000).toFixed(1)}M`;
    } else {
      return `Rs. ${amount.toLocaleString()}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-700 bg-green-100';
      case 'good': return 'text-blue-700 bg-blue-100';
      case 'fair': return 'text-yellow-700 bg-yellow-100';
      case 'needs_attention': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'financial': return <HiCurrencyDollar className="h-4 w-4" />;
      case 'operational': return <HiTrendingUp className="h-4 w-4" />;
      case 'compliance': return <HiShieldCheck className="h-4 w-4" />;
      case 'strategic': return <HiLightBulb className="h-4 w-4" />;
      case 'technical': return <HiTruck className="h-4 w-4" />;
      default: return <HiFlag className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-600 mt-1">Strategic overview of BusHubLK operations nationwide</p>
          {fleetData.error && (
            <p className="text-yellow-600 text-sm mt-1">
              ⚠️ Using demo data - API connection failed: {fleetData.error}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last updated</p>
          <p className="text-lg font-semibold text-gray-900">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Regions</p>
              <p className="text-2xl font-bold">
                {fleetData.loading ? '...' : fleetData.totalRegions}
              </p>
              <p className="text-green-100 text-xs mt-1">Nationwide</p>
            </div>
            <div className="p-3 bg-green-500 bg-opacity-30 rounded-full">
              <HiGlobeAlt className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Depots</p>
              <p className="text-2xl font-bold">
                {fleetData.loading ? '...' : fleetData.totalDepots}
              </p>
              <p className="text-blue-100 text-xs mt-1">All Regions</p>
            </div>
            <div className="p-3 bg-blue-500 bg-opacity-30 rounded-full">
              <HiOfficeBuilding className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Fleet Size</p>
              <p className="text-2xl font-bold">
                {fleetData.loading ? '...' : fleetData.totalFleet.toLocaleString()}
              </p>
              <p className="text-purple-100 text-xs mt-1">Active Vehicles</p>
            </div>
            <div className="p-3 bg-purple-500 bg-opacity-30 rounded-full">
              <HiTruck className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Employees</p>
              <p className="text-2xl font-bold">{executiveMetrics.totalEmployees.toLocaleString()}</p>
              <p className="text-orange-100 text-xs mt-1">All Roles</p>
            </div>
            <div className="p-3 bg-orange-500 bg-opacity-30 rounded-full">
              <HiUsers className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Daily Passengers</p>
              <p className="text-2xl font-bold">{executiveMetrics.totalPassengers.toLocaleString()}</p>
              <p className="text-indigo-100 text-xs mt-1">Per Day</p>
            </div>
            <div className="p-3 bg-indigo-500 bg-opacity-30 rounded-full">
              <HiGlobeAlt className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performanceIndicators.map((indicator, index) => (
            <div key={index} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">{indicator.title}</p>
                {indicator.trend === 'up' ? (
                  <HiArrowUp className="h-4 w-4 text-green-600" />
                ) : (
                  <HiArrowDown className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-gray-900">{indicator.value}</p>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Target: {indicator.target}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    indicator.status === 'on-track' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {indicator.status.replace('-', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regional Overview and Key Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regional Overview */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Regional Performance Overview</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View Details</button>
          </div>
          
          {regionalLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading regional data...</span>
            </div>
          ) : regionalError ? (
            <div className="text-center py-8">
              <p className="text-yellow-600 text-sm mb-2">⚠️ Using demo data - API connection failed</p>
              <p className="text-gray-500 text-xs">{regionalError}</p>
            </div>
          ) : null}
          
          <div className="space-y-4">
            {regionalData.map((region) => (
              <div key={region.id} className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">{region.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(region.status)}`}>
                      {region.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${parseFloat(region.growth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(region.growth) >= 0 ? '+' : ''}{region.growth}%
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="text-xs text-gray-500">Depots</p>
                    <p className="font-medium text-gray-900">{region.depots}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vehicles</p>
                    <p className="font-medium text-gray-900">{region.vehicles}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Revenue</p>
                    <p className="font-medium text-gray-900">{formatCurrency(region.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Efficiency</p>
                    <p className="font-medium text-gray-900">{region.efficiency}%</p>
                  </div>
                </div>
                {region.criticalIssues > 0 && (
                  <div className="mt-2 flex items-center text-red-600">
                    <HiExclamationCircle className="h-4 w-4 mr-1" />
                    <span className="text-xs">{region.criticalIssues} critical issue(s) require attention</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Key Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Key Alerts</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
          </div>
          <div className="space-y-3">
            {keyAlerts.map((alert) => (
              <div key={alert.id} className={`p-3 rounded-lg border ${getPriorityColor(alert.priority)}`}>
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Executive Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <HiChartSquareBar className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Strategic Dashboard</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors">
            <HiCurrencyDollar className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Financial Reports</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <HiGlobeAlt className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Regional Analysis</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <HiUsers className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Workforce Analytics</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
            <HiShieldCheck className="h-8 w-8 text-indigo-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Compliance Review</span>
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

export default CEODashboard