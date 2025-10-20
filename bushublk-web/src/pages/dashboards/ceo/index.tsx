import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiGlobeAlt,
  HiOfficeBuilding,
  HiTrendingUp,
  HiUsers,
  HiTruck,
  HiChartSquareBar,
  HiExclamationCircle,
  HiArrowUp,
  HiArrowDown,
  HiLocationMarker
} from 'react-icons/hi';
import { AppContext } from '../../../context/AppContext';

interface Region {
  region_id: number;
  region_name: string;
  depot_count: number;
  bus_count: number;
  active_buses: number;
  maintenance_buses: number;
  out_of_service_buses: number;
  efficiency?: number;
}

const CEODashboard = () => {
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const token = context?.token;

  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch regions
        const regionsResponse = await fetch('/api/ceo/regions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!regionsResponse.ok) {
          throw new Error('Failed to fetch regions');
        }

        const regionsResult = await regionsResponse.json();

        // Fetch depots to calculate region stats
        const depotsResponse = await fetch('/api/ceo/depots', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!depotsResponse.ok) {
          throw new Error('Failed to fetch depots');
        }

        const depotsResult = await depotsResponse.json();

        if (regionsResult.success && depotsResult.success) {
          // Calculate stats for each region
          const regionStats = regionsResult.data.map((region: any) => {
            const regionDepots = depotsResult.data.filter(
              (d: any) => d.region_name === region.region_name
            );

            const totalBuses = regionDepots.reduce((sum: number, d: any) => sum + (d.bus_count || 0), 0);
            const activeBuses = regionDepots.reduce((sum: number, d: any) => sum + (d.active_buses || 0), 0);
            const maintenanceBuses = regionDepots.reduce((sum: number, d: any) => sum + (d.maintenance_buses || 0), 0);
            const outOfServiceBuses = regionDepots.reduce((sum: number, d: any) => sum + (d.out_of_service_buses || 0), 0);

            // Calculate efficiency as percentage of active buses
            const efficiency = totalBuses > 0 ? Math.round((activeBuses / totalBuses) * 100) : 0;

            return {
              region_id: region.region_id,
              region_name: region.region_name,
              depot_count: regionDepots.length,
              bus_count: totalBuses,
              active_buses: activeBuses,
              maintenance_buses: maintenanceBuses,
              out_of_service_buses: outOfServiceBuses,
              efficiency
            };
          });

          setRegions(regionStats);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    } else {
      navigate('/login');
    }
  }, [token, navigate]);

  // Calculate executive metrics from regions
  const executiveMetrics = {
    totalDepots: regions.reduce((sum, r) => sum + r.depot_count, 0),
    totalFleet: regions.reduce((sum, r) => sum + r.bus_count, 0),
    activeFleet: regions.reduce((sum, r) => sum + r.active_buses, 0),
    maintenanceFleet: regions.reduce((sum, r) => sum + r.maintenance_buses, 0),
    outOfServiceFleet: regions.reduce((sum, r) => sum + r.out_of_service_buses, 0),
    averageEfficiency: regions.length > 0 
      ? Math.round(regions.reduce((sum, r) => sum + (r.efficiency || 0), 0) / regions.length)
      : 0
  };

  const getStatusColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-700 bg-green-100';
    if (efficiency >= 80) return 'text-blue-700 bg-blue-100';
    if (efficiency >= 70) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  const getStatusText = (efficiency: number) => {
    if (efficiency >= 90) return 'Excellent';
    if (efficiency >= 80) return 'Good';
    if (efficiency >= 70) return 'Fair';
    return 'Needs Attention';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <HiExclamationCircle className="mx-auto text-6xl text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Dashboard</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-600 mt-1">Strategic overview of SLTB operations nationwide</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last updated</p>
          <p className="text-lg font-semibold text-gray-900">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Regions</p>
              <p className="text-3xl font-bold">{regions.length}</p>
              <p className="text-blue-100 text-xs mt-1">Nationwide</p>
            </div>
            <div className="p-3 bg-blue-500 bg-opacity-30 rounded-full">
              <HiLocationMarker className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Depots</p>
              <p className="text-3xl font-bold">{executiveMetrics.totalDepots}</p>
              <p className="text-green-100 text-xs mt-1">All Regions</p>
            </div>
            <div className="p-3 bg-green-500 bg-opacity-30 rounded-full">
              <HiOfficeBuilding className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Fleet</p>
              <p className="text-3xl font-bold">{executiveMetrics.totalFleet.toLocaleString()}</p>
              <p className="text-purple-100 text-xs mt-1">All Buses</p>
            </div>
            <div className="p-3 bg-purple-500 bg-opacity-30 rounded-full">
              <HiTruck className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Active Fleet</p>
              <p className="text-3xl font-bold">{executiveMetrics.activeFleet.toLocaleString()}</p>
              <p className="text-orange-100 text-xs mt-1">{executiveMetrics.averageEfficiency}% Avg Efficiency</p>
            </div>
            <div className="p-3 bg-orange-500 bg-opacity-30 rounded-full">
              <HiTrendingUp className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Status Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Status Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Active Buses</p>
                <p className="text-2xl font-bold text-green-900">{executiveMetrics.activeFleet}</p>
                <p className="text-xs text-green-600 mt-1">
                  {executiveMetrics.totalFleet > 0 
                    ? `${Math.round((executiveMetrics.activeFleet / executiveMetrics.totalFleet) * 100)}% of fleet`
                    : '0% of fleet'}
                </p>
              </div>
              <HiArrowUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Under Maintenance</p>
                <p className="text-2xl font-bold text-yellow-900">{executiveMetrics.maintenanceFleet}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  {executiveMetrics.totalFleet > 0 
                    ? `${Math.round((executiveMetrics.maintenanceFleet / executiveMetrics.totalFleet) * 100)}% of fleet`
                    : '0% of fleet'}
                </p>
              </div>
              <HiTruck className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Out of Service</p>
                <p className="text-2xl font-bold text-red-900">{executiveMetrics.outOfServiceFleet}</p>
                <p className="text-xs text-red-600 mt-1">
                  {executiveMetrics.totalFleet > 0 
                    ? `${Math.round((executiveMetrics.outOfServiceFleet / executiveMetrics.totalFleet) * 100)}% of fleet`
                    : '0% of fleet'}
                </p>
              </div>
              <HiArrowDown className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Regional Performance Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Regional Performance Overview</h3>
          <button 
            onClick={() => navigate('/ceo/regional-overview')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
          >
            View Details
            <HiChartSquareBar className="ml-1 h-4 w-4" />
          </button>
        </div>
        
        {regions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <HiLocationMarker className="mx-auto text-5xl mb-3 text-gray-300" />
            <p>No regional data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {regions.map((region) => (
              <div 
                key={region.region_id} 
                className="p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => navigate('/ceo/regional-overview')}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <HiLocationMarker className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">{region.region_name}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(region.efficiency || 0)}`}>
                      {getStatusText(region.efficiency || 0)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{region.efficiency}%</p>
                    <p className="text-xs text-gray-500">Efficiency</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Depots</p>
                    <p className="text-lg font-semibold text-gray-900">{region.depot_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Buses</p>
                    <p className="text-lg font-semibold text-gray-900">{region.bus_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Active</p>
                    <p className="text-lg font-semibold text-green-600">{region.active_buses}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Maintenance</p>
                    <p className="text-lg font-semibold text-yellow-600">{region.maintenance_buses}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Out of Service</p>
                    <p className="text-lg font-semibold text-red-600">{region.out_of_service_buses}</p>
                  </div>
                </div>

                {region.out_of_service_buses > 0 && region.out_of_service_buses >= region.bus_count * 0.1 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center text-red-600">
                    <HiExclamationCircle className="h-4 w-4 mr-2" />
                    <span className="text-xs font-medium">
                      High out-of-service rate ({Math.round((region.out_of_service_buses / region.bus_count) * 100)}%) - requires attention
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/ceo/regional-overview')}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <HiGlobeAlt className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Regional Overview</span>
          </button>
          
          <button 
            onClick={() => navigate('/ceo/depot-overview')}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <HiOfficeBuilding className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Depot Overview</span>
          </button>
          
          <button 
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <HiTruck className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Fleet Management</span>
          </button>
          
          <button 
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <HiChartSquareBar className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CEODashboard;