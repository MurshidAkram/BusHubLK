import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${API_URL}/api`;

const DGMOperationsDashboard = () => {
  const token = localStorage.getItem('bushublk_token') || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fleetStats, setFleetStats] = useState<any>({});
  const [crewCounts, setCrewCounts] = useState<any>({});
  const [depots, setDepots] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [depotsCount, setDepotsCount] = useState(0);

  const [depotsPage, setDepotsPage] = useState(1);
  const DEPUTS_PAGE_SIZE = 10;

  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
  const res = await axios.get(`${API_BASE_URL}/dgm-operations-dashboard/overview`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        params: {
          depotsLimit: DEPUTS_PAGE_SIZE,
          depotsOffset: (depotsPage - 1) * DEPUTS_PAGE_SIZE,
          regionId: selectedRegion || undefined,
          incidentsLimit: 8
        }
      });
      const d = res.data.data;
      setFleetStats(d.fleetStats || {});
      setCrewCounts(d.crewCounts || {});
      setDepots(d.depotsPerformance || []);
      setIncidents(d.incidents || []);
      setDepotsCount(d.depotsCount || 0);
      setRegions(d.regions || []);
    } catch (err: any) {
      console.error('DGM overview error', err);
      setError(err?.response?.data?.error || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depotsPage, selectedRegion]);

  // Color configurations
  const driverColors = ['#10B981', '#F59E0B'];
  const conductorColors = ['#3B82F6', '#8B5CF6'];
  const fleetColors = ['#10B981', '#F59E0B', '#EF4444'];

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      <strong>Error:</strong> {error}
    </div>
  );

  return (
    <div className="space-y-6 p-4 bg-gray-50 min-h-screen">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white transform transition-transform hover:scale-105">
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium opacity-90">Total Regions</div>
              <div className="text-3xl font-bold">{regions.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white transform transition-transform hover:scale-105">
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium opacity-90">Total Depots</div>
              <div className="text-3xl font-bold">{depotsCount}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white transform transition-transform hover:scale-105">
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium opacity-90">Active Buses</div>
              <div className="text-3xl font-bold">{fleetStats.active ?? 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Region Filter */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Filter by Region:</label>
          <select 
            value={selectedRegion ?? ''} 
            onChange={(e) => setSelectedRegion(e.target.value ? Number(e.target.value) : null)} 
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">All Regions</option>
            {regions.map(r => <option key={r.region_id} value={r.region_id}>{r.region_name}</option>)}
          </select>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Drivers Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            Drivers Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[
                    { name: 'On Duty', value: crewCounts.drivers_on_duty ?? 0 }, 
                    { name: 'On Break', value: crewCounts.drivers_on_break ?? 0 }
                  ]} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80} 
                  label={({ name }) => name}
                >
                  {[0, 1].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={driverColors[index]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [value, 'Count']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conductors Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            Conductors Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[
                    { name: 'On Duty', value: crewCounts.conductors_on_duty ?? 0 }, 
                    { name: 'On Break', value: crewCounts.conductors_on_break ?? 0 }
                  ]} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80} 
                  label={({ name }) => name}
                >
                  {[0, 1].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={conductorColors[index]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [value, 'Count']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Status Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            Fleet Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[
                    { name: 'Active buses', value: fleetStats.active ?? 0 }, 
                    { name: 'Maintenance buses', value: fleetStats.maintenance ?? 0 }, 
                    { name: 'Out of Service buses', value: fleetStats.out_of_service ?? 0 }
                  ]} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80} 
                  label={({ name }) => name}
                >
                  {[0, 1, 2].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={fleetColors[index]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [value, 'Count']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Depots Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Depots Performance</h3>
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Total: {depotsCount}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {depots.map((d, index) => (
            <div 
              key={d.depot_id} 
              className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200 bg-gradient-to-br from-white to-gray-50"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="font-semibold text-gray-800 text-lg">{d.depot_name}</div>
              </div>
              <div className="text-sm text-gray-600 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Region: {d.region_name}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-green-50 p-2 rounded-lg text-center">
                  <div className="text-green-700 font-bold text-lg">{d.buses}</div>
                  <div className="text-green-600 text-xs">Buses</div>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg text-center">
                  <div className="text-blue-700 font-bold text-lg">{d.crews}</div>
                  <div className="text-blue-600 text-xs">Crews</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{(depotsPage - 1) * DEPUTS_PAGE_SIZE + 1}</span> -{' '}
            <span className="font-semibold">{Math.min(depotsPage * DEPUTS_PAGE_SIZE, depotsCount)}</span> of{' '}
            <span className="font-semibold">{depotsCount}</span> depots
          </div>
          <div className="flex gap-2">
            <button 
              disabled={depotsPage === 1} 
              onClick={() => setDepotsPage(p => Math.max(1, p - 1))} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                depotsPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Previous
            </button>
            <button 
              disabled={depotsPage * DEPUTS_PAGE_SIZE >= depotsCount} 
              onClick={() => setDepotsPage(p => p + 1)} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                depotsPage * DEPUTS_PAGE_SIZE >= depotsCount
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DGMOperationsDashboard;