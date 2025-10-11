// src/pages/dashboards/ceo/OperationalOverviewPage.tsx
import React, { useState, useMemo } from 'react';
import {
  HiSearch,
  HiSelector,
  HiTruck,
  HiOfficeBuilding,
  HiAdjustments,
  HiCalendar,
  HiInformationCircle
} from 'react-icons/hi';

// --- Types ---
type Bus = {
  id: string;
  registrationNumber: string;
  model: string;
  year: number;
  capacity: number;
  currentRoute: string;
  status: string;
  nextService: string;
  mileage: number;
  fuelEfficiency: number;
  driver: string;
  conductor: string;
  location: string;
  alerts: { type: string; message: string }[];
};

// --- Mock Data: Regions → Districts → Depots → Buses ---
const mockData: Record<string, Record<string, Record<string, Bus[]>>> = {
  'Western Province': {
    'Colombo District': {
      'Pettah Depot': [
        {
          id: 'BUS-001',
          registrationNumber: 'NC-1234',
          model: 'A',
          year: 2020,
          capacity: 45,
          currentRoute: 'Pettah – Dehiwala',
          status: 'Active',
          nextService: '2024-07-15',
          mileage: 125000,
          fuelEfficiency: 8.5,
          driver: 'Kasun Perera',
          conductor: 'Saman Silva',
          location: 'Pettah Depot',
          alerts: [{ type: 'warning', message: 'Service due in 5 days' }],
        },
        {
          id: 'BUS-002',
          registrationNumber: 'NC-5678',
          model: 'B',
          year: 2019,
          capacity: 52,
          currentRoute: 'Pettah – Wellawatte',
          status: 'In Service',
          nextService: '2024-07-20',
          mileage: 98000,
          fuelEfficiency: 9.2,
          driver: 'Nimal Fernando',
          conductor: 'Priya Jayawardena',
          location: 'En Route',
          alerts: [],
        },
      ],
      'Gampaha Depot': [
        {
          id: 'BUS-003',
          registrationNumber: 'NC-9012',
          model: 'A',
          year: 2021,
          capacity: 38,
          currentRoute: 'Colombo – Panadura',
          status: 'Maintenance',
          nextService: '2024-07-25',
          mileage: 67000,
          fuelEfficiency: 10.1,
          driver: 'Chamara Rathnayake',
          conductor: 'Dilani Perera',
          location: 'Maintenance Bay',
          alerts: [{ type: 'error', message: 'Under maintenance – ETA 2 days' }],
        },
      ],
    },
    'Gampaha District': {
      'Divulapitiya Depot': [],
    },
  },
  'Central Province': {
    'Kandy District': {
      'Kandy Depot': [],
    },
    'Matale District': {
      'Matale Depot': [],
    },
  },
};

// --- Mock Assignments: same structure keys as mockData ---
const mockAssignments: Record<
  string,
  Record<string, Record<string, { bus: string; route: string; driver: string; conductor: string }[]>>
> = {
  'Western Province': {
    'Colombo District': {
      'Pettah Depot': [
        { bus: 'NC-1234', route: 'Pettah – Dehiwala', driver: 'Kasun Perera', conductor: 'Saman Silva' },
        { bus: 'NC-5678', route: 'Pettah – Wellawatte', driver: 'Nimal Fernando', conductor: 'Priya Jayawardena' },
      ],
      'Gampaha Depot': [
        { bus: 'NC-9012', route: 'Colombo – Panadura', driver: 'Chamara Rathnayake', conductor: 'Dilani Perera' },
      ],
    },
    'Gampaha District': {
      'Divulapitiya Depot': [],
    },
  },
  'Central Province': {
    'Kandy District': { 'Kandy Depot': [] },
    'Matale District': { 'Matale Depot': [] },
  },
};

export default function OperationalOverviewPage() {
  // Filters
  const regions = Object.keys(mockData);
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const districts = regionFilter !== 'All' ? Object.keys(mockData[regionFilter]) : [];
  const [districtFilter, setDistrictFilter] = useState<string>('All');
  const depots =
    regionFilter !== 'All' && districtFilter !== 'All'
      ? Object.keys(mockData[regionFilter][districtFilter])
      : [];
  const [depotFilter, setDepotFilter] = useState<string>('All');

  // Bus Search & Status Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const statusOptions = ['All', 'Active', 'In Service', 'Maintenance'];

  // Get buses for the selected depot
  const buses: Bus[] = useMemo(() => {
    if (
      regionFilter !== 'All' &&
      districtFilter !== 'All' &&
      depotFilter !== 'All'
    ) {
      return mockData[regionFilter][districtFilter][depotFilter];
    }
    return [];
  }, [regionFilter, districtFilter, depotFilter]);

  // Fleet summary stats
  const fleetStats = useMemo(() => {
    const total = buses.length;
    const active = buses.filter(b => b.status === 'Active').length;
    const inService = buses.filter(b => b.status === 'In Service').length;
    const maintenance = buses.filter(b => b.status === 'Maintenance').length;
    const avgFE =
      total > 0
        ? (buses.reduce((s, b) => s + b.fuelEfficiency, 0) / total).toFixed(1)
        : '—';
    return { total, active, inService, maintenance, avgFE };
  }, [buses]);

  // Filter buses by search/status
  const filteredBuses = useMemo(
    () =>
      buses.filter(b =>
        (b.registrationNumber + b.model)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ),
    [buses, searchTerm]
  );

  // Current assignments for selected depot
  const assignments = useMemo(() => {
    if (
      regionFilter !== 'All' &&
      districtFilter !== 'All' &&
      depotFilter !== 'All'
    ) {
      return (
        mockAssignments[regionFilter]?.[districtFilter]?.[depotFilter] || []
      );
    }
    return [];
  }, [regionFilter, districtFilter, depotFilter]);

  return (
    <div className="p-6 space-y-6">
      {/* Filters: Region / District / Depot */}
      <h2 className="text-2xl font-semibold">Depot Operational Overview</h2>
      <div className="flex flex-wrap gap-4">
        <FilterSelect
          label="Region"
          options={['All', ...regions]}
          value={regionFilter}
          onChange={val => {
            setRegionFilter(val);
            setDistrictFilter('All');
            setDepotFilter('All');
          }}
        />
        <FilterSelect
          label="District"
          options={['All', ...districts]}
          value={districtFilter}
          disabled={!districts.length}
          onChange={val => {
            setDistrictFilter(val);
            setDepotFilter('All');
          }}
        />
        <FilterSelect
          label="Depot"
          options={['All', ...depots]}
          value={depotFilter}
          disabled={!depots.length}
          onChange={setDepotFilter}
        />
      </div>
      

      {/* Fleet Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Buses" value={fleetStats.total} icon={<HiTruck />} />
        <StatCard
          label="Active / In Service"
          value={fleetStats.active + fleetStats.inService}
          icon={<HiOfficeBuilding />}
        />
        <StatCard
          label="In Maintenance"
          value={fleetStats.maintenance}
          icon={<HiAdjustments />}
        />
        <StatCard
          label="Avg. Fuel Eff."
          value={`${fleetStats.avgFE} km/l`}
          icon={<HiCalendar />}
        />
      </div>

      {/* Current Assignments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Today Assignments</h3>
        {assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Bus</th>
                  <th className="px-4 py-2 text-left">Route</th>
                  <th className="px-4 py-2 text-left">Driver</th>
                  <th className="px-4 py-2 text-left">Conductor</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((asgn, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2">{asgn.bus}</td>
                    <td className="px-4 py-2">{asgn.route}</td>
                    <td className="px-4 py-2">{asgn.driver}</td>
                    <td className="px-4 py-2">{asgn.conductor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No assignments for this depot.</p>
        )}
      </div>

      {/* Search & Status */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <HiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            placeholder="Search by reg. # or model"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <FilterSelect
          label="Status"
          options={statusOptions}
          value="All"
          onChange={() => {}}
        />
      </div>

      {/* Bus Cards */}
      {filteredBuses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBuses.map(bus => (
            <div
              key={bus.id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{bus.registrationNumber}</h3>
                  <p className="text-sm text-gray-500">
                    {bus.model} ({bus.year})
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    bus.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : bus.status === 'In Service'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {bus.status}
                </span>
              </div>

              {bus.alerts.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center bg-yellow-50 text-yellow-800 p-2 rounded mb-4 text-sm"
                >
                  <HiInformationCircle className="mr-2" />
                  {a.message}
                </div>
              ))}

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p>
                  <HiInformationCircle className="inline mr-1" />
                  {bus.location}
                </p>
                <p>
                  <HiAdjustments className="inline mr-1" />
                  Route: {bus.currentRoute}
                </p>
                <p>
                  <HiCalendar className="inline mr-1" />
                  Next Service: {bus.nextService}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <InfoPair label="Mileage" value={`${bus.mileage.toLocaleString()} km`} />
                <InfoPair label="Fuel Eff." value={`${bus.fuelEfficiency} km/l`} />
                <InfoPair label="Capacity" value={`${bus.capacity} seats`} />
                <InfoPair label="Driver" value={bus.driver} />
                <InfoPair label="Conductor" value={bus.conductor} />
              </div>

              <button className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                View Details
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No buses found for this depot.</p>
      )}

    </div>
  );
}

// ——— Reusable Components ———

const StatCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div className="bg-white rounded-lg p-4 shadow flex items-center">
    <div className="text-2xl text-blue-600 mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const InfoPair: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div>
    <p className="text-gray-500 text-xs">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

const FilterSelect: React.FC<{
  label: string;
  options: string[];
  value: string;
  disabled?: boolean;
  onChange: (val: string) => void;
}> = ({ label, options, value, disabled = false, onChange }) => (
  <div className="relative flex-1 min-w-[12rem]">
    <HiSelector className="absolute left-3 top-3 text-gray-400" />
    <select
      disabled={disabled}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border rounded-lg"
    >
      {options.map(opt => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);
