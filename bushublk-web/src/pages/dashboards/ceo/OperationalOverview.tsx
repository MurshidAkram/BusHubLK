import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  HiSearch,
  HiSelector,
  HiTruck,
  HiOfficeBuilding,
  HiAdjustments,
  HiInformationCircle,
  HiChartBar,
  HiUsers,
  HiExclamationCircle
} from 'react-icons/hi';
import { AppContext } from '../../../context/AppContext';

interface Bus {
  bus_id: number;
  registration_number: string;
  manufacturer: string;
  model: string;
  manufacturing_year: number;
  status: string;
  mileage: number;
  depot_id: number;
  depot_name: string;
  region_name: string;
}

interface Assignment {
  assignment_id: number;
  bus_registration: string;
  route_name: string;
  driver_name: string;
  conductor_name: string;
  depot_id: number;
  depot_name: string;
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

export default function OperationalOverviewPage() {
  const context = useContext(AppContext);
  const token = context?.token;

  // State
  const [regions, setRegions] = useState<string[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [depotFilter, setDepotFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!token) {
          setError('Authentication required');
          return;
        }

        // Fetch depots
        const depotsResponse = await fetch('/api/ceo/depots', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!depotsResponse.ok) {
          throw new Error('Failed to fetch depots');
        }

        const depotsData = await depotsResponse.json();
        
        if (depotsData.success) {
          const depotsWithDetails = depotsData.data.map((d: any) => ({
            depot_id: d.depot_id,
            depot_name: d.depot_name,
            region_name: d.region_name,
            bus_count: d.bus_count || 0,
            active_buses: d.active_buses || 0,
            maintenance_buses: d.maintenance_buses || 0,
            out_of_service_buses: d.out_of_service_buses || 0
          }));
          
          setDepots(depotsWithDetails);
          
          // Extract unique regions
          const uniqueRegions = [...new Set(depotsWithDetails.map((d: Depot) => d.region_name))];
          setRegions(uniqueRegions);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Fetch buses and assignments when depot is selected
  useEffect(() => {
    const fetchDepotDetails = async () => {
      if (depotFilter === 'All' || !token) {
        setBuses([]);
        setAssignments([]);
        return;
      }

      try {
        const selectedDepot = depots.find(d => d.depot_name === depotFilter);
        if (!selectedDepot) return;

        // Fetch buses for this depot
        const busesResponse = await fetch(`/api/ceo/depots/${selectedDepot.depot_id}/buses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (busesResponse.ok) {
          const busesData = await busesResponse.json();
          if (busesData.success) {
            const busesWithDepot = busesData.data.map((b: any) => ({
              ...b,
              depot_id: selectedDepot.depot_id,
              depot_name: selectedDepot.depot_name,
              region_name: selectedDepot.region_name
            }));
            setBuses(busesWithDepot);
          }
        }

        // Fetch assignments for this depot
        const assignmentsResponse = await fetch(`/api/daily-assignments/depot/${selectedDepot.depot_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json();
          if (Array.isArray(assignmentsData)) {
            const formattedAssignments = assignmentsData.map((a: any) => ({
              assignment_id: a.assignment_id,
              bus_registration: a.bus_name,
              route_name: a.route_name,
              driver_name: a.driver_name,
              conductor_name: a.conductor_name || 'N/A',
              depot_id: a.depot_id,
              depot_name: a.depot_name
            }));
            setAssignments(formattedAssignments);
          }
        }

      } catch (err) {
        console.error('Error fetching depot details:', err);
      }
    };

    fetchDepotDetails();
  }, [depotFilter, depots, token]);

  // Filter depots by region
  const filteredDepots = useMemo(() => {
    if (regionFilter === 'All') return depots;
    return depots.filter(d => d.region_name === regionFilter);
  }, [depots, regionFilter]);

  // Get depot names for dropdown
  const depotNames = useMemo(() => {
    return filteredDepots.map(d => d.depot_name);
  }, [filteredDepots]);

  // Filter buses by search and status
  const filteredBuses = useMemo(() => {
    return buses.filter(bus => {
      const matchesSearch = 
        bus.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.model.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || bus.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [buses, searchTerm, statusFilter]);

  // Fleet statistics
  const fleetStats = useMemo(() => {
    const total = buses.length;
    const active = buses.filter(b => b.status === 'Active').length;
    const inService = buses.filter(b => b.status === 'In Service').length;
    const maintenance = buses.filter(b => b.status === 'Maintenance').length;
    const avgMileage = total > 0 
      ? Math.round(buses.reduce((sum, b) => sum + (b.mileage || 0), 0) / total)
      : 0;

    return {
      total,
      active,
      inService,
      maintenance,
      avgMileage
    };
  }, [buses]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading operational data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <HiExclamationCircle className="mx-auto text-6xl text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Operational Overview</h2>
        <p className="text-gray-600 mt-1">Real-time depot operations and fleet management</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <FilterSelect
            label="Region"
            options={['All', ...regions]}
            value={regionFilter}
            onChange={(val) => {
              setRegionFilter(val);
              setDepotFilter('All');
            }}
          />
          <FilterSelect
            label="Depot"
            options={['All', ...depotNames]}
            value={depotFilter}
            disabled={depotNames.length === 0}
            onChange={setDepotFilter}
          />
        </div>
      </div>

      {/* Fleet Summary */}
      {depotFilter !== 'All' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Total Buses" 
            value={fleetStats.total} 
            icon={<HiTruck />}
            color="blue"
          />
          <StatCard
            label="Active Buses"
            value={fleetStats.active + fleetStats.inService}
            icon={<HiChartBar />}
            color="green"
          />
          <StatCard
            label="In Maintenance"
            value={fleetStats.maintenance}
            icon={<HiAdjustments />}
            color="yellow"
          />
          <StatCard
            label="Avg. Mileage"
            value={`${fleetStats.avgMileage.toLocaleString()} km`}
            icon={<HiInformationCircle />}
            color="purple"
          />
        </div>
      )}

      {/* Today's Assignments */}
      {depotFilter !== 'All' && assignments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              <HiUsers className="inline mr-2 h-5 w-5" />
              Today's Assignments
            </h3>
            <span className="text-sm text-gray-500">{assignments.length} active</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bus</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr key={assignment.assignment_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{assignment.bus_registration}</td>
                    <td className="px-4 py-3 text-gray-700">{assignment.route_name}</td>
                    <td className="px-4 py-3 text-gray-700">{assignment.driver_name}</td>
                    <td className="px-4 py-3 text-gray-700">{assignment.conductor_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Search & Status Filter */}
      {depotFilter !== 'All' && buses.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search by registration # or model"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <FilterSelect
            label="Status"
            options={['All', 'Active', 'In Service', 'Maintenance', 'Out of Service']}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      )}

      {/* Bus Fleet Cards */}
      {depotFilter !== 'All' && (
        <div>
          {filteredBuses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBuses.map((bus) => (
                <div
                  key={bus.bus_id}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{bus.registration_number}</h3>
                      <p className="text-sm text-gray-500">
                        {bus.manufacturer} {bus.model} ({bus.manufacturing_year})
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        bus.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : bus.status === 'In Service'
                          ? 'bg-blue-100 text-blue-800'
                          : bus.status === 'Maintenance'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {bus.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <InfoRow 
                      icon={<HiOfficeBuilding className="h-4 w-4" />}
                      label="Depot" 
                      value={bus.depot_name} 
                    />
                    <InfoRow 
                      icon={<HiInformationCircle className="h-4 w-4" />}
                      label="Region" 
                      value={bus.region_name} 
                    />
                    <InfoRow 
                      icon={<HiTruck className="h-4 w-4" />}
                      label="Mileage" 
                      value={`${(bus.mileage || 0).toLocaleString()} km`} 
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <HiTruck className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No buses found matching your filters</p>
            </div>
          )}
        </div>
      )}

      {/* Initial State - No Depot Selected */}
      {depotFilter === 'All' && (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <HiOfficeBuilding className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Depot</h3>
          <p className="text-gray-500">Choose a region and depot to view operational details</p>
        </div>
      )}
    </div>
  );
}

// Reusable Components
const StatCard: React.FC<{ 
  label: string; 
  value: number | string; 
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}> = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
      <div className="flex items-center">
        <div className={`text-2xl ${colorClasses[color]} p-3 rounded-lg mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  value: string 
}> = ({ icon, label, value }) => (
  <div className="flex items-center text-gray-600">
    <span className="mr-2">{icon}</span>
    <span className="font-medium mr-2">{label}:</span>
    <span>{value}</span>
  </div>
);

const FilterSelect: React.FC<{
  label: string;
  options: string[];
  value: string;
  disabled?: boolean;
  onChange: (val: string) => void;
}> = ({ label, options, value, disabled = false, onChange }) => (
  <div className="flex-1 min-w-[12rem]">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <HiSelector className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
      <select
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  </div>
);