// src/pages/dashboards/ceo/DepotNetworkDetailPage.tsx
import React, { useState, useMemo, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HiTruck,
  HiChevronRight,
  HiChevronDown,
  HiArrowLeft,
} from 'react-icons/hi';
import { AppContext } from '../../../context/AppContext';

interface Route {
  route_id: number;
  route_number: string;
  route_name: string;
  origin: string;
  destination: string;
  number_of_buses: number;
  load_percentage: number;
  daily_ridership: number;
}

interface Bus {
  bus_id: number;
  registration_number: string;
  model: string;
  manufacturing_year: number;
  status: string;
  mileage: number;
  last_service_date: string;
}

interface Depot {
  id: number;
  name: string;
  region: string;
  totalFleet: number;
  activeFleet: number;
  maintenanceFleet: number;
  outOfServiceFleet: number;
  status: string;
  coords: string;
  address: string;
  manager: string;
  lastInspection: string;
}

const DepotNetworkPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const token = context?.token;
  
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [depots, setDepots] = useState<Depot[]>([]);
  const [loading, setLoading] = useState(true);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [busesLoading, setBusesLoading] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch all depots
  const fetchAllDepots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/ceo/depots', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Please check if the API endpoint exists and the backend is running.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorData
        });
        
        if (response.status === 403) {
          throw new Error('Access denied. Your session may have expired. Please log in again.');
        }
        
        if (response.status === 500) {
          throw new Error(`Server error: ${errorData.message || errorData.error || 'Internal server error. Check backend logs for details.'}`);
        }
        
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: Failed to fetch depots`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        const transformedDepots = data.data.map((depot: any) => ({
          id: depot.depot_id,
          name: depot.depot_name,
          region: depot.region_name,
          totalFleet: depot.bus_count || 0,
          activeFleet: depot.active_buses || 0,
          maintenanceFleet: depot.maintenance_buses || 0,
          outOfServiceFleet: depot.out_of_service_buses || 0,
          status: depot.active_buses > 0 ? 'Active' : 'Maintenance',
          coords: depot.latitude && depot.longitude ? `${depot.latitude}, ${depot.longitude}` : 'Unknown',
          address: depot.address || `${depot.depot_name} Depot, ${depot.region_name}`,
          manager: depot.manager_name || 'Depot Manager',
          lastInspection: depot.last_inspection_date || '2025-01-15',
        }));
        setDepots(transformedDepots);
      }
    } catch (err: any) {
      console.error('Error fetching depots:', err);
      setError(`Failed to load depots: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch routes for a specific depot
  const fetchDepotRoutes = async (depotId: number) => {
    try {
      setRoutesLoading(true);
      
      if (!token) return;

      const response = await fetch(`/api/ceo/depots/${depotId}/routes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Routes endpoint returned non-JSON response');
        setRoutes([]);
        return;
      }

      if (!response.ok) {
        console.warn(`Failed to fetch routes: HTTP ${response.status}`);
        setRoutes([]);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        setRoutes(data.data);
      } else {
        setRoutes([]);
      }
    } catch (err: any) {
      console.error('Error fetching routes:', err);
      setRoutes([]);
    } finally {
      setRoutesLoading(false);
    }
  };

  // Fetch buses for a specific depot
  const fetchDepotBuses = async (depotId: number) => {
    try {
      setBusesLoading(true);
      
      if (!token) return;

      const response = await fetch(`/api/ceo/depots/${depotId}/buses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Buses endpoint returned non-JSON response');
        setBuses([]);
        return;
      }

      if (!response.ok) {
        console.warn(`Failed to fetch buses: HTTP ${response.status}`);
        setBuses([]);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        setBuses(data.data);
      } else {
        setBuses([]);
      }
    } catch (err: any) {
      console.error('Error fetching buses:', err);
      setBuses([]);
    } finally {
      setBusesLoading(false);
    }
  };
  
  // Handle navigation from RegionalOverview
  useEffect(() => {
    const state = location.state as any;
    if (state?.regionName && state?.depots) {
      // Use the actual depot data passed from RegionalOverview
      const transformedDepots = state.depots.map((depot: any) => ({
        id: depot.depot_id,
        name: depot.depot_name,
        region: state.regionName,
        totalFleet: depot.bus_count || 0,
        activeFleet: depot.active_buses || 0,
        maintenanceFleet: depot.maintenance_buses || 0,
        outOfServiceFleet: depot.out_of_service_buses || 0,
        status: depot.active_buses > 0 ? 'Active' : 'Maintenance',
        coords: depot.latitude && depot.longitude ? `${depot.latitude}, ${depot.longitude}` : 'Unknown',
        address: depot.address || `${depot.depot_name} Depot, ${state.regionName}`,
        manager: depot.manager_name || 'Depot Manager',
        lastInspection: depot.last_inspection_date || '2025-01-15',
      }));
      setDepots(transformedDepots);
      setRegion(state.regionName);
      setLoading(false);
      
      // Auto-select first depot if only one depot in the region
      if (transformedDepots.length === 1) {
        setSelectedId(transformedDepots[0].id);
      }
    } else {
      // Fetch all depots when accessing directly
      fetchAllDepots();
    }
  }, [location.state, token]);

  // Fetch routes and buses when a depot is selected
  useEffect(() => {
    if (selectedId) {
      fetchDepotRoutes(selectedId);
      fetchDepotBuses(selectedId);
    } else {
      setRoutes([]);
      setBuses([]);
    }
  }, [selectedId]);

  const filtered = useMemo(() => 
    depots.filter(d =>
      (region === 'All' || d.region === region) &&
      d.name.toLowerCase().includes(search.toLowerCase())
    )
  , [search, region, depots]);

  const active = filtered.find(d => d.id === selectedId);

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Pane: List */}
      <div className="w-1/3 border-r bg-white p-6 space-y-4 overflow-y-auto">
        {/* Back button if navigated from RegionalOverview */}
        {location.state?.regionName && (
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate('/ceo/regional-overview')}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              <HiArrowLeft className="mr-2 h-5 w-5" />
              Back to Regional Overview
            </button>
          </div>
        )}
        
        <h2 className="text-2xl font-bold text-gray-800">
          {location.state?.regionName ? `${location.state.regionName} - Depot Overview` : 'Depot Overview'}
        </h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <input
          type="text"
          placeholder="Search depots..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={region}
          onChange={e => setRegion(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {['All', ...new Set(depots.map((d: any) => d.region))].map(r => (
            <option key={r}>{r}</option>
          ))}
        </select>

        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Loading depots...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map(depot => {
              const isActive = depot.id === selectedId;
              return (
                <div
                  key={depot.id}
                  onClick={() => setSelectedId(isActive ? null : depot.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-blue-50 border-2 border-blue-500 shadow-md' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>
                        {depot.name}
                      </h3>
                      <p className="text-sm text-gray-500">{depot.region}</p>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span className="text-green-600 font-medium">Active: {depot.activeFleet}</span>
                        <span className="text-yellow-600 font-medium">Maintenance: {depot.maintenanceFleet}</span>
                      </div>
                    </div>
                    {isActive ? (
                      <HiChevronDown className="h-6 w-6 text-blue-600" />
                    ) : (
                      <HiChevronRight className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>No depots found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Detail */}
      <div className="flex-1 p-8 overflow-y-auto">
        {!active && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <HiTruck className="mx-auto h-16 w-16 mb-4" />
              <p className="text-lg">Select a depot to view its details</p>
            </div>
          </div>
        )}
        {active && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">{active.name}</h2>
                  <p className="text-gray-500 mt-1">{active.address}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  active.status === 'Active' ? 'bg-green-100 text-green-700'
                  : active.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
                }`}>
                  {active.status}
                </span>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Fleet</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{active.totalFleet}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <HiTruck className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Active Fleet</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{active.activeFleet}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <HiTruck className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Maintenance</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">{active.maintenanceFleet || 0}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <HiTruck className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Out of Service</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{active.outOfServiceFleet || 0}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <HiTruck className="h-8 w-8 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Routes Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h4 className="text-xl font-bold text-gray-800 mb-4">Routes Overview</h4>
              {routesLoading ? (
                <div className="py-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-500">Loading routes...</p>
                </div>
              ) : routes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Route</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Number of Buses</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Load %</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Daily Riders</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {routes.map((r, i) => (
                        <tr key={r.route_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <span className="font-semibold text-gray-800">{r.route_number}</span>
                              <span className="text-gray-600">: {r.origin} – {r.destination}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{r.number_of_buses}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${r.load_percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-700">{r.load_percentage}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{r.daily_ridership?.toLocaleString() || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <p>No route data available for this depot.</p>
                  <p className="text-sm mt-2">Routes may not be assigned to this depot yet.</p>
                </div>
              )}
            </div>

            {/* Bus Fleet Details Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h4 className="text-xl font-bold text-gray-800 mb-4">Bus Fleet Details</h4>
              {busesLoading ? (
                <div className="py-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-500">Loading bus fleet...</p>
                </div>
              ) : buses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bus ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Registration</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Model</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Year</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mileage</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Service</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {buses.map((bus) => (
                        <tr key={bus.bus_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-gray-900 font-medium">{bus.bus_id}</td>
                          <td className="px-6 py-4 text-gray-900 font-mono text-sm">{bus.registration_number}</td>
                          <td className="px-6 py-4 text-gray-700">{bus.model}</td>
                          <td className="px-6 py-4 text-gray-700">{bus.manufacturing_year}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              bus.status === 'Active' ? 'bg-green-100 text-green-800' :
                              bus.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                              bus.status === 'In Service' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {bus.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {bus.mileage ? `${bus.mileage.toLocaleString()} km` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {bus.last_service_date ? new Date(bus.last_service_date).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400">
                  <HiTruck className="mx-auto h-16 w-16 mb-4" />
                  <p className="text-lg font-medium">No buses found for this depot</p>
                  <p className="text-sm mt-2">Buses may not be assigned to this depot yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepotNetworkPage;