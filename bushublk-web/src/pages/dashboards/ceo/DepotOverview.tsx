// src/pages/dashboards/ceo/DepotNetworkDetailPage.tsx
import React, { useState, useMemo } from 'react';
import {
  HiTruck,
  HiUsers,
  HiUser,
  HiCurrencyDollar,
  HiChevronRight,
  HiChevronDown,
} from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
// …import other chart components as needed

const allDepots = [
  {
    id: 101,
    name: 'Colombo Depot',
    region: 'Western',
    vehicles: 120,
    revenue: 120_000_000,
    status: 'Active',
    coords: '6.9271, 79.8612',
    address: '123 Main St, Colombo',
    manager: 'Nimal Perera',
    staffCount: 85,
    dailyPassengers: 4500,
    lastInspection: '2025-07-10',
    efficiencyHistory: [
      { date: 'Jan', efficiency: 88 },
      { date: 'Feb', efficiency: 90 },
      { date: 'Mar', efficiency: 89 },
      { date: 'Apr', efficiency: 91 },
      { date: 'May', efficiency: 92 },
    ],
  },
  {
    id: 102,
    name: 'Gampaha Depot',
    region: 'Western',
    vehicles: 120,
    revenue: 120_000_000,
    status: 'Active',
    coords: '6.9271, 79.8612',
    address: '123 Main St, Colombo',
    manager: 'Nimal Perera',
    staffCount: 85,
    dailyPassengers: 4500,
    lastInspection: '2025-07-10',
    efficiencyHistory: [
      { date: 'Jan', efficiency: 88 },
      { date: 'Feb', efficiency: 90 },
      { date: 'Mar', efficiency: 89 },
      { date: 'Apr', efficiency: 91 },
      { date: 'May', efficiency: 92 },
    ],
  },
  {
    id: 103,
    name: 'Kaluthara Depot',
    region: 'Western',
    vehicles: 120,
    revenue: 120_000_000,
    status: 'Active',
    coords: '6.9271, 79.8612',
    address: '123 Main St, Colombo',
    manager: 'Nimal Perera',
    staffCount: 85,
    dailyPassengers: 4500,
    lastInspection: '2025-07-10',
    efficiencyHistory: [
      { date: 'Jan', efficiency: 88 },
      { date: 'Feb', efficiency: 90 },
      { date: 'Mar', efficiency: 89 },
      { date: 'Apr', efficiency: 91 },
      { date: 'May', efficiency: 92 },
    ],
  },
  {
    id: 104,
    name: 'Galle Depot',
    region: 'Southern',
    vehicles: 120,
    revenue: 120_000_000,
    status: 'Active',
    coords: '6.9271, 79.8612',
    address: '123 Main St, Colombo',
    manager: 'Nimal Perera',
    staffCount: 85,
    dailyPassengers: 4500,
    lastInspection: '2025-07-10',
    efficiencyHistory: [
      { date: 'Jan', efficiency: 88 },
      { date: 'Feb', efficiency: 90 },
      { date: 'Mar', efficiency: 89 },
      { date: 'Apr', efficiency: 91 },
      { date: 'May', efficiency: 92 },
    ],
  },
  
];

const DepotNetworkPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<number|null>(null);
  const [search, setSearch]     = useState('');
  const [region, setRegion]     = useState('All');
  
  const filtered = useMemo(() => 
    allDepots.filter(d =>
      (region==='All' || d.region===region) &&
      d.name.toLowerCase().includes(search.toLowerCase())
    )
  , [search, region]);

  const active = filtered.find(d => d.id === selectedId);

  return (
    <div className="flex h-full">
      {/* Left Pane: List */}
      <div className="w-1/3 border-r p-4 space-y-4">
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
          {['All', ...new Set(allDepots.map(d=>d.region))].map(r=>(
            <option key={r}>{r}</option>
          ))}
        </select>

        <ul className="mt-4 divide-y overflow-auto">
          {filtered.map(depot => {
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
          })}
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

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-white shadow rounded flex items-center">
                <HiTruck className="h-6 w-6 text-blue-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Vehicles</p>
                  <p className="font-bold">{active.vehicles}</p>
                </div>
              </div>
              <div className="p-4 bg-white shadow rounded flex items-center">
                <HiCurrencyDollar className="h-6 w-6 text-purple-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Revenue</p>
                  <p className="font-bold">Rs. {(active.revenue/1e6).toFixed(1)}M</p>
                </div>
              </div>
              <div className="p-4 bg-white shadow rounded flex items-center">
                <HiUsers className="h-6 w-6 text-green-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Staff Number</p>
                  <p className="font-bold">{active.staffCount}</p>
                </div>
              </div>
              <div className="p-4 bg-white shadow rounded flex items-center">
                <HiUser className="h-6 w-6 text-green-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Manager</p>
                  <p className="font-bold">{active.manager}</p>
                </div>
              </div>
            </div>

            {/* Mini-Chart Example */}
            <div className="bg-white shadow rounded p-4 mb-6">
              <h4 className="text-lg mb-2">Efficiency Trend</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={active.efficiencyHistory /* array of {date, efficiency} */}
                  >
                    <XAxis dataKey="date" />
                    <YAxis domain={[0,100]} />
                    <Tooltip />
                    <Bar dataKey="efficiency" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Map Embed */}
            <div className="bg-white shadow rounded p-4">
              <h4 className="text-lg mb-2">Location</h4>
              <iframe
                title="depot-map"
                src={`https://maps.google.com?q=${encodeURIComponent(active.coords)}&output=embed`}
                className="w-full h-64 rounded"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DepotNetworkPage;
