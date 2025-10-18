import React, { useState, useEffect, useContext } from 'react';
import { FaTimes } from 'react-icons/fa';
import { AppContext } from '../../../context/AppContext';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const buildApiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

interface BusDetail {
  bus_id: number;
  registration_number: string;
  class?: string;
  manufacturer?: string;
  model?: string;
  year?: number;
  mileage?: number;
  status: string;
  is_active: boolean;
}

interface DepotData {
  depot: string;
  depot_id: number;
  region_name: string;
  active: number;
  in_service: number;
  out_of_service: number;
  under_maintenance: number;
  lastInspection: string;
  buses: BusDetail[];
}

const Regionservicemonitor: React.FC = () => {
  const context = useContext(AppContext);
  const token = context?.token;
  
  const [data, setData] = useState<DepotData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepot, setSelectedDepot] = useState<DepotData | null>(null);

  // Helper function to format numbers properly
  const formatNumber = (num: number): string => {
    return Number(num).toLocaleString();
  };

  // Fetch depot service monitor data
  useEffect(() => {
    const fetchDepotData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!token) {
          setError('Authentication token is missing');
          return;
        }

        const response = await fetch(buildApiUrl('/api/depots/service-monitor'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData((result.depots || []).map((depot: any) => ({
          ...depot,
          buses: Array.isArray(depot.buses)
            ? depot.buses.map((bus: any) => ({
                ...bus,
                mileage: bus.mileage !== null && bus.mileage !== undefined ? Number(bus.mileage) : undefined,
                year: bus.year !== null && bus.year !== undefined ? Number(bus.year) : undefined
              }))
            : []
        })));
      } catch (err) {
        console.error('Error fetching depot data:', err);
        setError('Failed to fetch depot data');
      } finally {
        setLoading(false);
      }
    };

    fetchDepotData();
  }, [token]);

  const handleDepotClick = (depot: DepotData) => {
    setSelectedDepot(depot);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center text-gray-500">Loading depot data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  // Group depots by region
  const regions = Array.from(new Set(data.map(d => d.region_name)));
  const depotsByRegion: { [region: string]: DepotData[] } = {};
  regions.forEach(region => {
    depotsByRegion[region] = data.filter(d => d.region_name === region);
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Service status by Depot</h1>

        {/* Regions List */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Regions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {regions.map(region => (
              <div
                key={region}
                className={`p-4 rounded-lg cursor-pointer transition-colors duration-200 border ${selectedDepot && selectedDepot.region_name === region ? 'bg-blue-100 border-blue-300 text-blue-800' : 'hover:bg-gray-50 border-gray-200'}`}
                onClick={() => setSelectedDepot(null)}
              >
                <div className="font-medium text-lg">{region}</div>
                <div className="text-sm text-gray-600 mt-2">{depotsByRegion[region].length} Depots</div>
              </div>
            ))}
          </div>
        </div>

        {/* Depots List */}
        {!selectedDepot && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Depots</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map(depot => (
                <div
                  key={depot.depot_id}
                  className="p-4 rounded-lg cursor-pointer transition-colors duration-200 border hover:bg-blue-50 border-gray-200"
                  onClick={() => handleDepotClick(depot)}
                >
                  <div className="font-medium text-base">{depot.depot}</div>
                  <div className="text-sm text-gray-500 mt-1">Region: {depot.region_name}</div>
                  <div className="flex justify-between items-center mt-3 text-sm">
                    <span className="text-gray-600">Active: {formatNumber(depot.active)}</span>
                    {/* <span className="text-gray-600">In Service: {formatNumber(depot.in_service)}</span> */}
                  </div>
                  <div className="flex justify-between items-center mt-1 text-sm">
                    <span className="text-red-600">Out: {formatNumber(depot.out_of_service)}</span>
                    <span className="text-yellow-600">Maint: {formatNumber(depot.under_maintenance)}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">Last Inspection: {depot.lastInspection}</div>
                  <div className="mt-1 text-xs text-gray-500">Total Buses: {formatNumber(depot.buses?.length || 0)}</div>
                  {/* Additional actions can be added here if needed */}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Depot Details */}
        {selectedDepot && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{selectedDepot.depot} Depot</h3>
                <p className="text-sm text-gray-600 mt-1">Region: {selectedDepot.region_name}</p>
              </div>
              <button
                onClick={() => setSelectedDepot(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Active</div>
                <div className="text-xl font-bold text-green-600">{formatNumber(selectedDepot.active)}</div>
              </div>
              {/* <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">In Service</div>
                <div className="text-xl font-bold text-blue-600">{formatNumber(selectedDepot.in_service)}</div>
              </div> */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Out of Service</div>
                <div className="text-xl font-bold text-red-600">{formatNumber(selectedDepot.out_of_service)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Under Maintenance</div>
                <div className="text-xl font-bold text-yellow-600">{formatNumber(selectedDepot.under_maintenance)}</div>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">Last Inspection: {selectedDepot.lastInspection}</div>
            <div className="mt-4 text-lg font-semibold text-blue-700">
              Total Vehicles: {formatNumber(selectedDepot.active + selectedDepot.in_service + selectedDepot.out_of_service + selectedDepot.under_maintenance)}
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Bus Details</h4>
              {selectedDepot.buses.length === 0 ? (
                <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4">
                  No buses found for this depot.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Registration</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Class</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Model</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Year</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                        {/* <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Mileage</th> */}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedDepot.buses.map((bus) => (
                        <tr key={bus.bus_id}>
                          <td className="px-4 py-2 text-sm text-gray-900 font-medium">{bus.registration_number}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{bus.class || '—'}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{bus.model || '—'}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{bus.year || '—'}</td>
                          <td className="px-4 py-2 text-sm font-semibold">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              bus.status === 'Active'
                                ? 'bg-green-100 text-green-700'
                                : bus.status === 'Maintenance'
                                ? 'bg-yellow-100 text-yellow-700'
                                : bus.status === 'Out of Service'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {bus.status}
                            </span>
                          </td>
                          {/* <td className="px-4 py-2 text-sm text-gray-600">
                            {bus.mileage ? `${formatNumber(bus.mileage)} km` : '—'}
                          </td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Regionservicemonitor;