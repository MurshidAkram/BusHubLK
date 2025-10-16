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

const routeData: Record<
  number,
  { routeName: string; numberofbus: number; load: number; dailyRidership: number }[]
> = {
  101: [
    { routeName: '120: Colombo – Horana', numberofbus: 12, load: 75, dailyRidership: 1500 },
    { routeName: '100: Fort – Moratuwa',  numberofbus: 18, load: 68, dailyRidership: 1200 },
    { routeName: '138: Pettah – Kottawa', numberofbus: 15, load: 80, dailyRidership: 1700 },
  ],
  102: [
    { routeName: '15: Gampaha – Negombo', numberofbus: 10, load: 70, dailyRidership: 1100 },
    { routeName: '39: Gampaha – Wattala', numberofbus: 7, load: 65, dailyRidership: 900  },
  ],
  // Other depot routes can be added here
};

const DepotNetworkPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const token = context?.token;
  
  const [selectedId, setSelectedId] = useState<number|null>(null);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [depots, setDepots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch all depots when no navigation state is available
  const fetchAllDepots = async () => {
    try {
      setLoading(true);
      if (!token) throw new Error('No authentication token found');

      const response = await fetch('http://localhost:5000/api/ceo/depots', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
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
            coords: '6.9271, 79.8612',
            address: `${depot.depot_name} Depot, ${depot.region_name}`,
            manager: 'Depot Manager',
            lastInspection: '2025-01-15',
          }));
          setDepots(transformedDepots);
        }
      } else {
        throw new Error('Failed to fetch depots');
      }
    } catch (err) {
      console.error('Error fetching depots:', err);
      // Fallback to mock data
      setDepots([
        {
          id: 101,
          name: 'Colombo Central Depot',
          region: 'Western',
          totalFleet: 120,
          activeFleet: 100,
          maintenanceFleet: 15,
          outOfServiceFleet: 5,
          status: 'Active',
          coords: '6.9271, 79.8612',
          address: 'Colombo Central Depot, Western',
          manager: 'Depot Manager',
          lastInspection: '2025-01-15',
        },
        {
          id: 102,
          name: 'Gampaha Depot',
          region: 'Western',
          totalFleet: 80,
          activeFleet: 70,
          maintenanceFleet: 8,
          outOfServiceFleet: 2,
          status: 'Active',
          coords: '6.9271, 79.8612',
          address: 'Gampaha Depot, Western',
          manager: 'Depot Manager',
          lastInspection: '2025-01-15',
        }
      ]);
    } finally {
      setLoading(false);
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
        totalFleet: depot.bus_count,
        activeFleet: depot.active_buses,
        maintenanceFleet: depot.maintenance_buses,
        outOfServiceFleet: depot.out_of_service_buses,
        status: depot.active_buses > 0 ? 'Active' : 'Maintenance',
        coords: '6.9271, 79.8612', // Default coordinates
        address: `${depot.depot_name} Depot, ${state.regionName}`,
        manager: 'Depot Manager', // Default manager
        lastInspection: '2025-01-15',
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

  const filtered = useMemo(() => 
    depots.filter(d =>
      (region==='All' || d.region===region) &&
      d.name.toLowerCase().includes(search.toLowerCase())
    )
  , [search, region, depots]);

  const active = filtered.find(d => d.id === selectedId);

  return (
    <div className="flex h-full">
      {/* Left Pane: List */}
      <div className="w-1/3 border-r p-4 space-y-4">
        {/* Back button if navigated from RegionalOverview */}
        {location.state?.regionName && (
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate('/ceo/regional-overview')}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <HiArrowLeft className="mr-2" />
              Back to Regional Overview
            </button>
          </div>
        )}
        
        <h2 className="text-2xl font-semibold">
          {location.state?.regionName ? `${location.state.regionName} - Depot Overview` : 'Depot Overview'}
        </h2>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <select
          value={region}
          onChange={e=>setRegion(e.target.value)}
          className="w-full p-2 border rounded"
        >
          {['All', ...new Set(depots.map((d: any) => d.region))].map(r=>(
            <option key={r}>{r}</option>
          ))}
        </select>

        <ul className="mt-4 divide-y overflow-auto">
          {loading ? (
            <li className="py-4 text-center text-gray-500">
              Loading depots...
            </li>
          ) : filtered.length > 0 ? (
            filtered.map(depot => {
              const isActive = depot.id === selectedId;
              return (
                <li
                  key={depot.id}
                  onClick={()=>setSelectedId(isActive ? null : depot.id)}
                  className={`py-2 flex justify-between items-center cursor-pointer ${
                    isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <span>{depot.name}</span>
                  {isActive ? (
                    <HiChevronDown className="h-5 w-5" />
                  ) : (
                    <HiChevronRight className="h-5 w-5" />
                  )}
                </li>
              );
            })
          ) : (
            <li className="py-4 text-center text-gray-500">
              No depots found
            </li>
          )}
        </ul>
      </div>

      {/* Right Pane: Detail */}
      <div className="flex-1 p-6 overflow-auto">
        {!active && (
          <p className="text-gray-500">Select a depot to view its details.</p>
        )}
        {active && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">{active.name}</h2>
              <span className={`px-2 py-1 rounded-full text-sm ${
                active.status==='Active' ? 'bg-green-100 text-green-700'
                : active.status==='Maintenance' ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
              }`}>
                {active.status}
              </span>
            </div>

            {/* KPI Row - 4 cards only */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-white shadow rounded flex items-center">
                <HiTruck className="h-6 w-6 text-blue-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Total Fleet</p>
                  <p className="font-bold">{active.totalFleet}</p>
                </div>
              </div>
              <div className="p-4 bg-white shadow rounded flex items-center">
                <HiTruck className="h-6 w-6 text-green-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Active Fleet</p>
                  <p className="font-bold">{active.activeFleet}</p>
                </div>
              </div>
              <div className="p-4 bg-white shadow rounded flex items-center">
                <HiTruck className="h-6 w-6 text-yellow-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Maintenance</p>
                  <p className="font-bold">{active.maintenanceFleet || 0}</p>
                </div>
              </div>
              <div className="p-4 bg-white shadow rounded flex items-center">
                <HiTruck className="h-6 w-6 text-red-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Out of Service</p>
                  <p className="font-bold">{active.outOfServiceFleet || 0}</p>
                </div>
              </div>
            </div>

            {/* Routes Overview */}
            <div className="bg-white shadow rounded p-4 mb-6">
              <h4 className="text-lg mb-4">Routes Overview</h4>
              {routeData[active.id]?.length ? (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Route</th>
                        <th className="px-4 py-2 text-left">Number of Buses</th>
                        <th className="px-4 py-2 text-left">Load %</th>
                        <th className="px-4 py-2 text-left">Daily Riders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routeData[active.id].map((r, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2">{r.routeName}</td>
                          <td className="px-4 py-2">{r.numberofbus}</td>
                          <td className="px-4 py-2">{r.load}%</td>
                          <td className="px-4 py-2">{r.dailyRidership}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No route data available for this depot.</p>
              )}
            </div>

            {/* Bus Fleet Details Table - Replaces the chart */}
            <div className="bg-white shadow rounded p-4 mb-6">
              <h4 className="text-lg mb-4">Bus Fleet Details</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Bus ID</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Registration</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Model</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Year</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Mileage</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Last Service</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Array.from({ length: active.totalFleet }, (_, index) => {
                      const models = ['Ashok Leyland', 'Tata', 'Mahindra', 'Eicher'];
                      const status = index < active.activeFleet ? 'Active' : 
                                   index < active.activeFleet + (active.maintenanceFleet || 0) ? 'Maintenance' : 'Out of Service';
                      const model = models[index % models.length];
                      const year = 2018 + (index % 6);
                      const mileage = 150000 + (index * 12000);
                      const lastService = new Date(2025, 0, 1 + (index % 30)).toLocaleDateString();
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">{active.name.substring(0, 3).toUpperCase()}-{String(index + 1).padStart(3, '0')}</td>
                          <td className="px-4 py-3 text-gray-900">WP-{2000 + index}</td>
                          <td className="px-4 py-3 text-gray-900">{model}</td>
                          <td className="px-4 py-3 text-gray-900">{year}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              status === 'Active' ? 'bg-green-100 text-green-800' :
                              status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-900">{mileage.toLocaleString()} km</td>
                          <td className="px-4 py-3 text-gray-900">{lastService}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {active.totalFleet === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <HiTruck className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p>No buses found for this depot</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DepotNetworkPage;