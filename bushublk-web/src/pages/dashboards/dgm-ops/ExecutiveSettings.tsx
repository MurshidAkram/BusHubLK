import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${API_URL}/api`;

interface DepotReport {
  depot: string;
  region: string;
  totalBuses: number;
  activeBuses: number;
  maintenanceBuses: number;
  outOfServiceBuses: number;
  driversOnDuty: number;
  driversOnBreak: number;
  conductorsOnDuty: number;
  conductorsOnBreak: number;
  routesCovered: number;
  totalRoutes: number;
}

// State will be fetched from backend
const mockDepotReports: DepotReport[] = [];

const OpsReports = () => {
  const token = localStorage.getItem('bushublk_token') || '';
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedDepot, setSelectedDepot] = useState<string>('All');
  const [depotReports, setDepotReports] = useState<DepotReport[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Derived lists from fetched data
  const regions = ['All', ...Array.from(new Set(depotReports.map((d) => d.region)))];
  // show depots filtered by selectedRegion
  const depotsForRegion = ['All', ...Array.from(new Set(
    depotReports
      .filter(d => selectedRegion === 'All' || d.region === selectedRegion)
      .map((d) => d.depot)
  ))];

  const filteredDepots = depotReports.filter((d) =>
    (selectedRegion === 'All' || d.region === selectedRegion) &&
    (selectedDepot === 'All' || d.depot === selectedDepot)
  );

  // Map backend row to DepotReport shape
  const mapDepotRowToReport = (row: any): DepotReport => {
    return {
      depot: row.depot_name || row.depot || `Depot ${row.depot_id || ''}`,
      region: row.region_name || row.region || 'Unknown',
      totalBuses: Number(row.buses || row.total_buses) || 0,
      activeBuses: Number(row.active_buses) || Number(row.active) || 0,
      maintenanceBuses: Number(row.maintenance_buses) || 0,
      outOfServiceBuses: Number(row.out_of_service_buses) || 0,
      driversOnDuty: Number(row.drivers_on_duty) || 0,
      driversOnBreak: Number(row.drivers_on_break) || 0,
      conductorsOnDuty: Number(row.conductors_on_duty) || 0,
      conductorsOnBreak: Number(row.conductors_on_break) || 0,
      routesCovered: Number(row.routes_covered) || 0,
      totalRoutes: Number(row.total_routes) || 0,
    };
  };

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      setFetchError(null);
      try {
  const res = await axios.get(`${API_BASE_URL}/dgm-operations-dashboard/overview`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          params: {
            depotsLimit: 1000, // fetch many; UI does local filtering
            depotsOffset: 0,
            regionId: undefined,
            incidentsLimit: 0
          }
        });
        const d = res.data.data;
        // backend returns depotsPerformance as array
        const reports = (d.depotsPerformance || []).map(mapDepotRowToReport);
        setDepotReports(reports);
      } catch (err: any) {
        console.error('Failed to fetch depot reports', err);
        setFetchError(err?.response?.data?.error || err.message || 'Failed to fetch');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupedByRegion = filteredDepots.reduce<Record<string, typeof filteredDepots>>((acc, curr) => {
    if (!acc[curr.region]) acc[curr.region] = [];
    acc[curr.region].push(curr);
    return acc;
  }, {});

  // Color configurations
  const busColors = {
    active: '#10B981',
    maintenance: '#F59E0B',
    outOfService: '#EF4444'
  };

  const crewColors = {
    driversOnDuty: '#3B82F6',
    driversOnBreak: '#60A5FA',
    conductorsOnDuty: '#8B5CF6',
    conductorsOnBreak: '#A78BFA'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Operations Reports - Depot Summary</h1>
            <p className="text-gray-600">
              Regional performance reports including fleet usage, crew availability, and route coverage.
            </p>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4 lg:mt-0">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Filter by Region</label>
              <select 
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-40"
                value={selectedRegion} 
                onChange={(e) => { setSelectedRegion(e.target.value); setSelectedDepot('All'); }}
              >
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Filter by Depot</label>
              <select 
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-40"
                value={selectedDepot} 
                onChange={(e) => setSelectedDepot(e.target.value)}
              >
                {depotsForRegion.map((depot) => (
                  <option key={depot} value={depot}>
                    {depot}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-xl text-white">
            <div className="text-sm font-medium opacity-90">Total Depots</div>
            <div className="text-2xl font-bold">{filteredDepots.length}</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-xl text-white">
            <div className="text-sm font-medium opacity-90">Total Buses</div>
            <div className="text-2xl font-bold">{filteredDepots.reduce((sum, depot) => sum + depot.totalBuses, 0)}</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-xl text-white">
            <div className="text-sm font-medium opacity-90">Total Drivers</div>
            <div className="text-2xl font-bold">{filteredDepots.reduce((sum, depot) => sum + depot.driversOnDuty + depot.driversOnBreak, 0)}</div>
          </div>
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4 rounded-xl text-white">
            <div className="text-sm font-medium opacity-90">Total Conductors</div>
            <div className="text-2xl font-bold">{filteredDepots.reduce((sum, depot) => sum + depot.conductorsOnDuty + depot.conductorsOnBreak, 0)}</div>
          </div>
        </div>

        {/* Charts by Region */}
        {Object.entries(groupedByRegion).map(([regionName, depots]) => (
          <div key={regionName} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              {regionName} Region
            </h2>

            {/* Fleet Chart */}
            <section className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Fleet Status by Depot</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart 
                  data={depots} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  barGap={0}
                  barCategoryGap="15%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="depot" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      backgroundColor: 'white'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="activeBuses" 
                    name="Active Buses" 
                    fill={busColors.active}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="maintenanceBuses" 
                    name="In Maintenance" 
                    fill={busColors.maintenance}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="outOfServiceBuses" 
                    name="Out of Service" 
                    fill={busColors.outOfService}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* Crew Chart */}
            <section className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Crew Status by Depot</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart 
                  data={depots} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  barGap={0}
                  barCategoryGap="15%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="depot" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      backgroundColor: 'white'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="driversOnDuty" 
                    name="Drivers On Duty" 
                    fill={crewColors.driversOnDuty}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="driversOnBreak" 
                    name="Drivers On Break" 
                    fill={crewColors.driversOnBreak}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="conductorsOnDuty" 
                    name="Conductors On Duty" 
                    fill={crewColors.conductorsOnDuty}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="conductorsOnBreak" 
                    name="Conductors On Break" 
                    fill={crewColors.conductorsOnBreak}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>
        ))}

        {/* Loading / Error / No Data */}
        {loading && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-gray-500 text-lg">Loading data...</div>
          </div>
        )}
        {fetchError && (
          <div className="text-center py-12 bg-red-50 rounded-xl border border-red-200">
            <div className="text-red-600 text-lg">{fetchError}</div>
            <div className="text-red-400 text-sm mt-2">Check backend server and try again</div>
          </div>
        )}
        {!loading && !fetchError && filteredDepots.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-gray-500 text-lg">No data available for the selected filters</div>
            <div className="text-gray-400 text-sm mt-2">Try selecting different region or depot filters</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpsReports;