// src/pages/dashboards/ceo/RegionalOverviewPage.tsx
import React, { useState, useEffect, useContext } from 'react';
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
import { AppContext } from '../../../context/AppContext';

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
  address?: string;
  latitude?: number;
  longitude?: number;
}

const RegionalOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const token = context?.token;
  
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
        setError(null);

        if (!token) {
          console.error('No authentication token found');
          navigate('/login');
          return;
        }

        console.log('Fetching regions and depots with authentication...');
        
        // Fetch regions from CEO API
        const regionsResponse = await fetch('/api/ceo/regions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!regionsResponse.ok) {
          if (regionsResponse.status === 403) {
            throw new Error('Access denied. Please log in again.');
          }
          throw new Error(`Regions API error! status: ${regionsResponse.status}`);
        }
        
        const regionsResult = await regionsResponse.json();
        
        // Fetch depots from CEO API
        const depotsResponse = await fetch('/api/ceo/depots', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!depotsResponse.ok) {
          if (depotsResponse.status === 403) {
            throw new Error('Access denied. Please log in again.');
          }
          throw new Error(`Depots API error! status: ${depotsResponse.status}`);
        }
        
        const depotsResult = await depotsResponse.json();
        
        if (regionsResult.success && depotsResult.success) {
          // Convert any float values to integers and calculate region stats
          const depotsData = depotsResult.data.map((depot: any) => ({
            depot_id: depot.depot_id,
            depot_name: depot.depot_name,
            region_name: depot.region_name,
            bus_count: Math.floor(depot.bus_count || 0),
            active_buses: Math.floor(depot.active_buses || 0),
            maintenance_buses: Math.floor(depot.maintenance_buses || 0),
            out_of_service_buses: Math.floor(depot.out_of_service_buses || 0),
            address: depot.address,
            latitude: depot.latitude,
            longitude: depot.longitude
          }));

          // Calculate stats for each region from depot data
          const regionStats = regionsResult.data.map((region: any) => {
            const regionDepots = depotsData.filter((d: Depot) => d.region_name === region.region_name);
            
            return {
              region_id: region.region_id,
              region_name: region.region_name,
              depot_count: regionDepots.length,
              bus_count: regionDepots.reduce((sum: number, d: Depot) => sum + d.bus_count, 0),
              active_buses: regionDepots.reduce((sum: number, d: Depot) => sum + d.active_buses, 0),
              maintenance_buses: regionDepots.reduce((sum: number, d: Depot) => sum + d.maintenance_buses, 0),
              out_of_service_buses: regionDepots.reduce((sum: number, d: Depot) => sum + d.out_of_service_buses, 0)
            };
          });
          
          setRegions(regionStats);
          setDepots(depotsData);
          console.log('Successfully fetched data:', { 
            regionsCount: regionStats.length, 
            depotsCount: depotsData.length 
          });
        } else {
          throw new Error('API responses indicate failure');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load data: ${errorMessage}`);
        
        // If authentication error, redirect to login
        if (errorMessage.includes('Access denied') || errorMessage.includes('403')) {
          setTimeout(() => navigate('/login'), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    } else {
      setLoading(false);
      setError('Not authenticated');
      navigate('/login');
    }
  }, [token, navigate]);

  // Get depots for selected region
  const getDepotsForRegion = (regionName: string) => {
    return depots.filter(depot => depot.region_name === regionName);
  };

  // Handle navigation to depot overview
  const handleViewDetails = (region: Region) => {
    const regionDepots = getDepotsForRegion(region.region_name);
    
    // Navigate to depot overview page with region data
    navigate('/ceo/depot-overview', { 
      state: { 
        regionId: region.region_id,
        regionName: region.region_name,
        depots: regionDepots
      }
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading regional data...</p>
        </div>
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
              Make sure you're logged in and the backend server is running
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
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <HiLocationMarker className="text-blue-600 text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Regions</p>
              <p className="text-3xl font-bold text-gray-900">{regions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <HiOfficeBuilding className="text-green-600 text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Depots</p>
              <p className="text-3xl font-bold text-gray-900">
                {regions.reduce((sum, region) => sum + region.depot_count, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <HiUsers className="text-purple-600 text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Buses</p>
              <p className="text-3xl font-bold text-gray-900">
                {regions.reduce((sum, region) => sum + region.bus_count, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <HiTrendingUp className="text-orange-600 text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Buses</p>
              <p className="text-3xl font-bold text-gray-900">
                {regions.reduce((sum, region) => sum + (region.active_buses || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Regions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {regions.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <HiLocationMarker className="mx-auto text-6xl mb-4" />
            <p className="text-lg">No regional data available</p>
          </div>
        ) : (
          regions.map(region => (
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
                <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
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

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center">
                    <HiExclamationCircle className="mr-1" />
                    Out of Service
                  </span>
                  <span className="text-sm font-medium text-red-600">{region.out_of_service_buses || 0}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(region);
                  }}
                  className="w-full flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 py-2 rounded-lg transition-colors"
                >
                  <HiEye className="mr-1" />
                  View Depot Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected Region Details */}
      {selectedRegion && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedRegion.region_name} - Depot Details
            </h2>
            <button 
              onClick={() => setSelectedRegion(null)}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>

          {getDepotsForRegion(selectedRegion.region_name).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getDepotsForRegion(selectedRegion.region_name).map(depot => (
                <div 
                  key={depot.depot_id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                  onClick={() => navigate('/ceo/depot-overview', { 
                    state: { 
                      regionName: selectedRegion.region_name,
                      depots: getDepotsForRegion(selectedRegion.region_name)
                    }
                  })}
                >
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <HiOfficeBuilding className="mr-2 text-blue-600" />
                    {depot.depot_name}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Buses:</span>
                      <span className="font-medium text-gray-900">{depot.bus_count}</span>
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
                  {depot.address && (
                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                      {depot.address}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
              <HiOfficeBuilding className="mx-auto text-5xl mb-3 text-gray-300" />
              <p className="font-medium">No depot data available for this region</p>
              <p className="text-sm mt-1">Depots may not be assigned to this region yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegionalOverviewPage;