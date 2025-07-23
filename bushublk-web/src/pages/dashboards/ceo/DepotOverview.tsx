// src/pages/dashboards/ceo/DepotNetworkDetailPage.tsx
import React, { useState, useMemo } from 'react';
import {
  HiTruck,
  HiUsers,
  HiUser,
  HiChevronRight,
  HiChevronDown,
} from 'react-icons/hi';
import { LineChart,Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
// …import other chart components as needed

const allDepots = [
  {
    id: 101,
    name: 'Colombo Central Depot',
    region: 'Western',
    totalFleet: 120,
    activeFleet: 100,
    status: 'Active',
    coords: '6.9271, 79.8612',
    address: '123 Main St, Colombo',
    manager: 'Nimal Perera',
    staffCount: 85,
    dailyPassengers: 4500,
    lastInspection: '2025-07-10',
    ridershipHistory: [
      { date: '2025-07-01', riders: 4000 },
      { date: '2025-07-02', riders: 4380 },
      { date: '2025-07-03', riders: 4500 },
      { date: '2025-07-04', riders: 4400 },
      { date: '2025-07-05', riders: 4550 },
    ],
  },
  {
    id: 102,
    name: 'Gampaha Depot',
    region: 'Western',
    totalFleet: 115,
    activeFleet: 95,
    revenue: 120_000_000,
    status: 'Active',
    coords: '6.9271, 79.8612',
    address: '123 Main St, Colombo',
    manager: 'Priyantha Fernando',
    staffCount: 65,
    dailyPassengers: 4500,
    lastInspection: '2025-07-10',
    ridershipHistory: [
      { date: '2025-07-01', riders: 4200 },
      { date: '2025-07-02', riders: 4380 },
      { date: '2025-07-03', riders: 4500 },
      { date: '2025-07-04', riders: 4600 },
      { date: '2025-07-05', riders: 4450 },
    ]
  },
  {
    id: 103,
    name: 'Kaluthara Depot',
    region: 'Western',
    totalFleet: 110,
    activeFleet: 90,
    revenue: 120_000_000,
    status: 'Active',
    coords: '6.9271, 79.8612',
    address: '123 Main St, Colombo',
    manager: 'Nimal Perera',
    staffCount: 85,
    dailyPassengers: 4500,
    lastInspection: '2025-07-10',
    ridershipHistory: [
      { date: '2025-07-01', riders: 4200 },
      { date: '2025-07-02', riders: 4380 },
      { date: '2025-07-03', riders: 4500 },
      { date: '2025-07-04', riders: 4600 },
      { date: '2025-07-05', riders: 4450 },
    ],
  },
  {
    id: 104,
    name: 'Galle Depot',
    region: 'Southern',
    totalFleet: 80,
    activeFleet: 70,
    revenue: 120_000_000,
    status: 'Active',
    coords: '6.9271, 79.8612',
    address: '123 Main St, Galle',
    manager: 'Nimal Perera',
    staffCount: 85,
    dailyPassengers: 4500,
    lastInspection: '2025-07-10',
    ridershipHistory: [
      { date: '2025-07-01', riders: 4200 },
      { date: '2025-07-02', riders: 4380 },
      { date: '2025-07-03', riders: 4500 },
      { date: '2025-07-04', riders: 4600 },
      { date: '2025-07-05', riders: 4450 },
    ]
  },
  {
    id: 104,
    name: 'Kandy Depot',
    region: 'Central',
    totalFleet: 100,
    activeFleet: 80,
    revenue: 120_000_000,
    status: 'Active',
    coords: '6.9271, 79.8612',
    address: '123 Main St, Galle',
    manager: 'Nimal Perera',
    staffCount: 85,
    dailyPassengers: 4500,
    lastInspection: '2025-07-10',
    ridershipHistory: [
      { date: '2025-07-01', riders: 2200 },
      { date: '2025-07-02', riders: 2380 },
      { date: '2025-07-03', riders: 2500 },
      { date: '2025-07-04', riders: 2600 },
      { date: '2025-07-05', riders: 2450 },
    ]
  },
  
];

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
  // …other depot routes
};

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
        <h2 className="text-2xl font-semibold">Depot Overview</h2>
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
                <HiUsers className="h-6 w-6 text-orange-400 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Staff Number</p>
                  <p className="font-bold">{active.staffCount}</p>
                </div>
              </div>
              <div className="p-4 bg-white shadow rounded flex items-center">
                <HiUser className="h-6 w-6 text-orange-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Manager</p>
                  <p className="font-bold">{active.manager}</p>
                </div>
              </div>
            </div>

            <div title="Routes Overview">
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
                <p className="text-gray-500">No route data available.</p>
              )}
            </div>

            {/* Mini-Chart Example */}
            <div className="bg-white shadow rounded p-4 mb-6 mt-8">
              <h4 className="text-lg mb-2">Daily Passengers</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={active.ridershipHistory}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip formatter={val => `${val} riders`} />
                    <Line type="monotone" dataKey="riders" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Map Embed */}
            <div className="mt-8 bg-white shadow rounded p-4">
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
