// src/pages/dashboards/ceo/RegionalOverviewPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOfficeBuilding,
  HiTrendingUp,
  HiUsers,
  HiLocationMarker,
  HiChartBar,
  HiCog,
  HiEye,
  HiExclamationCircle
} from 'react-icons/hi';

interface Region {
  region_id: number;
  region_name: string;
  depot_count: number;
  bus_count: number;
  active_buses?: number;
  maintenance_buses?: number;
  out_of_service_buses?: number;
}

interface Depot {
  depot_id: number;
  depot_name: string;
  region_name: string;
  bus_count: number;
  active_buses: number;
  maintenance_buses: number;
  out_of_service_buses: number;
}

const RegionalOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [regions, setRegions] = useState<Region[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch regions and depots data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch regions from CEO API (no auth required)
        const regionsResponse = await fetch('http://localhost:5000/api/ceo/regions');
        
        if (!regionsResponse.ok) {
          throw new Error(`Regions API error! status: ${regionsResponse.status}`);
        }
        
        const regionsResult = await regionsResponse.json();
        
        // Fetch depots from CEO API (no auth required)
        const depotsResponse = await fetch('http://localhost:5000/api/ceo/depots');
        
        if (!depotsResponse.ok) {
          throw new Error(`Depots API error! status: ${depotsResponse.status}`);
        }
        
        const depotsResult = await depotsResponse.json();
        
        if (regionsResult.success && depotsResult.success) {
          // Convert any float values to integers
          const processedRegions = regionsResult.data.map((region: any) => ({
            ...region,
            depot_count: Math.floor(region.depot_count || 0),
            bus_count: Math.floor(region.bus_count || 0),
            active_buses: Math.floor(region.active_buses || 0),
            maintenance_buses: Math.floor(region.maintenance_buses || 0),
            out_of_service_buses: Math.floor(region.out_of_service_buses || 0)
          }));
          
          const processedDepots = depotsResult.data.map((depot: any) => ({
            ...depot,
            bus_count: Math.floor(depot.bus_count || 0),
            active_buses: Math.floor(depot.active_buses || 0),
            maintenance_buses: Math.floor(depot.maintenance_buses || 0),
            out_of_service_buses: Math.floor(depot.out_of_service_buses || 0)
          }));
          
          setRegions(processedRegions);
          setDepots(processedDepots);
          setError(null);
          console.log('Successfully fetched data from database:', { 
            regionsCount: processedRegions.length, 
            depotsCount: processedDepots.length 
          });
        } else {
          throw new Error('API responses indicate failure');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Database connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        
        // Use fallback mock data when database connection fails
        console.log('Using fallback mock data due to database connection issue...');
        
        const mockRegions = [
          { region_id: 1, region_name: 'Colombo', depot_count: 12, bus_count: 450, active_buses: 380, maintenance_buses: 45, out_of_service_buses: 25 },
          { region_id: 2, region_name: 'Gampaha', depot_count: 4, bus_count: 320, active_buses: 280, maintenance_buses: 25, out_of_service_buses: 15 },
          { region_id: 3, region_name: 'Kaluthara', depot_count: 3, bus_count: 180, active_buses: 150, maintenance_buses: 20, out_of_service_buses: 10 },
          { region_id: 4, region_name: 'Wayamba', depot_count: 8, bus_count: 380, active_buses: 320, maintenance_buses: 35, out_of_service_buses: 25 },
          { region_id: 5, region_name: 'Mahanuwara', depot_count: 6, bus_count: 240, active_buses: 200, maintenance_buses: 25, out_of_service_buses: 15 },
          { region_id: 6, region_name: 'Sabaragamuwa', depot_count: 7, bus_count: 280, active_buses: 240, maintenance_buses: 25, out_of_service_buses: 15 },
          { region_id: 7, region_name: 'Southern', depot_count: 5, bus_count: 200, active_buses: 170, maintenance_buses: 20, out_of_service_buses: 10 },
          { region_id: 8, region_name: 'Rajarata', depot_count: 6, bus_count: 240, active_buses: 200, maintenance_buses: 25, out_of_service_buses: 15 },
          { region_id: 9, region_name: 'Nuwaraeliya', depot_count: 3, bus_count: 120, active_buses: 100, maintenance_buses: 15, out_of_service_buses: 5 },
          { region_id: 10, region_name: 'New Eastern', depot_count: 4, bus_count: 160, active_buses: 135, maintenance_buses: 15, out_of_service_buses: 10 },
          { region_id: 11, region_name: 'Northern', depot_count: 5, bus_count: 200, active_buses: 170, maintenance_buses: 20, out_of_service_buses: 10 },
          { region_id: 12, region_name: 'Uva', depot_count: 4, bus_count: 160, active_buses: 135, maintenance_buses: 15, out_of_service_buses: 10 }
        ];
        
        const mockDepots = [
          { depot_id: 1, depot_name: 'Rathmalana', region_name: 'Colombo', bus_count: 45, active_buses: 38, maintenance_buses: 5, out_of_service_buses: 2 },
          { depot_id: 2, depot_name: 'Moratuwa', region_name: 'Colombo', bus_count: 40, active_buses: 35, maintenance_buses: 3, out_of_service_buses: 2 },
          { depot_id: 3, depot_name: 'Katubedda', region_name: 'Colombo', bus_count: 35, active_buses: 30, maintenance_buses: 3, out_of_service_buses: 2 },
          { depot_id: 4, depot_name: 'Udahamulla', region_name: 'Colombo', bus_count: 38, active_buses: 32, maintenance_buses: 4, out_of_service_buses: 2 },
          { depot_id: 5, depot_name: 'Maharagama', region_name: 'Colombo', bus_count: 42, active_buses: 36, maintenance_buses: 4, out_of_service_buses: 2 },
          
          { depot_id: 6, depot_name: 'Negombo', region_name: 'Gampaha', bus_count: 80, active_buses: 70, maintenance_buses: 6, out_of_service_buses: 4 },
          { depot_id: 7, depot_name: 'Divulapitiya', region_name: 'Gampaha', bus_count: 60, active_buses: 52, maintenance_buses: 5, out_of_service_buses: 3 },
          { depot_id: 8, depot_name: 'Nittambuwa', region_name: 'Gampaha', bus_count: 70, active_buses: 62, maintenance_buses: 5, out_of_service_buses: 3 },
          { depot_id: 9, depot_name: 'Kirindiwela', region_name: 'Gampaha', bus_count: 55, active_buses: 48, maintenance_buses: 4, out_of_service_buses: 3 },
          
          { depot_id: 10, depot_name: 'Beruwala', region_name: 'Kaluthara', bus_count: 60, active_buses: 50, maintenance_buses: 7, out_of_service_buses: 3 },
          { depot_id: 11, depot_name: 'Panadura', region_name: 'Kaluthara', bus_count: 70, active_buses: 60, maintenance_buses: 7, out_of_service_buses: 3 },
          { depot_id: 12, depot_name: 'Kaluthara', region_name: 'Kaluthara', bus_count: 50, active_buses: 40, maintenance_buses: 6, out_of_service_buses: 4 },
          
          { depot_id: 13, depot_name: 'Kurunegala', region_name: 'Wayamba', bus_count: 85, active_buses: 72, maintenance_buses: 8, out_of_service_buses: 5 },
          { depot_id: 14, depot_name: 'Puttalam', region_name: 'Wayamba', bus_count: 75, active_buses: 65, maintenance_buses: 6, out_of_service_buses: 4 },
          
          { depot_id: 15, depot_name: 'Kandy', region_name: 'Mahanuwara', bus_count: 90, active_buses: 75, maintenance_buses: 10, out_of_service_buses: 5 },
          { depot_id: 16, depot_name: 'Matale', region_name: 'Mahanuwara', bus_count: 70, active_buses: 60, maintenance_buses: 7, out_of_service_buses: 3 },
          
          { depot_id: 17, depot_name: 'Ratnapura', region_name: 'Sabaragamuwa', bus_count: 80, active_buses: 68, maintenance_buses: 8, out_of_service_buses: 4 },
          { depot_id: 18, depot_name: 'Kegalle', region_name: 'Sabaragamuwa', bus_count: 65, active_buses: 55, maintenance_buses: 6, out_of_service_buses: 4 }
        ];
        
        setRegions(mockRegions);
        setDepots(mockDepots);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get depots for selected region
  const getDepotsForRegion = (regionName: string) => {
    return depots.filter(depot => depot.region_name === regionName);
  };

  // Handle navigation to depot overview
  const handleViewDetails = (region: Region) => {
    // Navigate to depot overview page with region data
    navigate('/ceo/depot-overview', { 
      state: { 
        regionId: region.region_id,
        regionName: region.region_name,
        depots: getDepotsForRegion(region.region_name)
      }
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading regional data...</span>
      </div>
    );
  }

  if (error && regions.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <HiExclamationCircle className="mx-auto text-6xl text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600 mb-2">Could not fetch regional data from the database.</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <p className="text-xs text-gray-500">
              Make sure the backend server is running on localhost:5000
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Regional Overview</h1>
          <p className="text-gray-600 mt-1">Monitor performance across all SLTB regions</p>
        </div>
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center">
            <HiExclamationCircle className="text-yellow-600 mr-2" />
            <span className="text-yellow-800 text-sm">Using fallback data - {error}</span>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <HiLocationMarker className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Regions</p>
              <p className="text-2xl font-bold text-gray-900">{regions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <HiOfficeBuilding className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Depots</p>
              <p className="text-2xl font-bold text-gray-900">
                {regions.reduce((sum, region) => sum + region.depot_count, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <HiUsers className="text-purple-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Fleet</p>
              <p className="text-2xl font-bold text-gray-900">
                {regions.reduce((sum, region) => sum + region.bus_count, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <HiTrendingUp className="text-orange-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Buses</p>
              <p className="text-2xl font-bold text-gray-900">
                {regions.reduce((sum, region) => sum + (region.active_buses || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Regions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {regions.map(region => {
          return (
            <div
              key={region.region_id}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer transform hover:scale-105 ${
                selectedRegion?.region_id === region.region_id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => setSelectedRegion(selectedRegion?.region_id === region.region_id ? null : region)}
            >
              {/* Region Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 truncate">{region.region_name}</h3>
                <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                  Active: {region.active_buses || 0}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center">
                    <HiOfficeBuilding className="mr-1" />
                    Depots
                  </span>
                  <span className="text-sm font-medium text-gray-900">{region.depot_count}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center">
                    <HiUsers className="mr-1" />
                    Total Buses
                  </span>
                  <span className="text-sm font-medium text-gray-900">{region.bus_count}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center">
                    <HiChartBar className="mr-1" />
                    Active
                  </span>
                  <span className="text-sm font-medium text-green-600">{region.active_buses || 0}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center">
                    <HiCog className="mr-1" />
                    Maintenance
                  </span>
                  <span className="text-sm font-medium text-yellow-600">{region.maintenance_buses || 0}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => handleViewDetails(region)}
                  className="w-full flex items-center justify-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <HiEye className="mr-1" />
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Region Details */}
      {selectedRegion && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {selectedRegion.region_name} - Depot Details
            </h2>
            <button 
              onClick={() => setSelectedRegion(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getDepotsForRegion(selectedRegion.region_name).map(depot => (
              <div key={depot.depot_id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <h4 className="font-medium text-gray-800 mb-3">{depot.depot_name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Buses:</span>
                    <span className="font-medium">{depot.bus_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active:</span>
                    <span className="font-medium text-green-600">{depot.active_buses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maintenance:</span>
                    <span className="font-medium text-yellow-600">{depot.maintenance_buses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Out of Service:</span>
                    <span className="font-medium text-red-600">{depot.out_of_service_buses}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {getDepotsForRegion(selectedRegion.region_name).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <HiOfficeBuilding className="mx-auto text-4xl mb-2" />
              <p>No depot data available for this region</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegionalOverviewPage;