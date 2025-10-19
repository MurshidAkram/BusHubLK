import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../context/AppContext';
import axios, { AxiosError } from 'axios';
import { 
  HiTruck, 
  HiCog, 
  HiCheckCircle, 
  HiExclamationCircle,
  HiSearch,
  HiFilter,
  HiX,
  HiLocationMarker,
  HiMap
} from 'react-icons/hi';

// Matches the backend model properties
type BusFromAPI = {
  bus_id: string;
  registration_number: string;
  model: string;
  year: number;

  status: string;
  depot_name: string;
  class: string;
  manufacturer: string;
  purchase_date: string;
  updated_at?: string;
};

// Extended type with dummy data
type Bus = BusFromAPI & {
  currentRoute?: string;
  nextService?: string;
  lastService?: string;
  fuelEfficiency?: number;
  driver?: string;
  conductor?: string;
  location?: string;
  serviceHistory: ServiceHistory[];
  partChanges: PartChange[];
  alerts: Alert[];
  statusDuration?: string;
};

type ServiceHistory = {
  id: number;
  date: string;
  type: string;
  cost: number;
  status: string;
  scheduled_date: string;
  completed_date?: string;
  cancelled_date?: string;
};

type PartChange = {
  date: string;
  part: string;
  quantity: number;
  unit: string;
  cost: number;
};

type Alert = {
  type: string;
  message: string;
};

interface BusResponse {
  message: string;
  buses: BusFromAPI[];
}

interface AppContextType {
  user: { role: string; userId: string; depot_id?: string; region_id?: string; } | undefined;
  token: string | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${API_URL}/api`;

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-64 bg-red-50 rounded-lg border border-red-200 p-6">
          <HiExclamationCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
          <p className="text-red-600 text-center">Error: {this.state.error}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const FleetManagement: React.FC = () => {
  // @ts-ignore

  const context = useContext(AppContext) as AppContextType | undefined;
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fleetStatus, setFleetStatus] = useState<{ active:number; maintenance:number; outOfService:number; total:number }>({
    active: 0, maintenance: 0, outOfService: 0, total: 0
  });

  const token = context?.token;

  const calculateStatusDuration = (updatedAt: string | undefined, status: string): string => {
    if (!updatedAt || (status !== 'Maintenance' && status !== 'Out of Service')) {
      return '';
    }

    try {
      const updatedDate = new Date(updatedAt);
      const now = new Date();
      const diffInMs = now.getTime() - updatedDate.getTime();
      
      const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? `${hours} hr${hours > 1 ? 's' : ''}` : ''}`;
      } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
    } catch (error) {
      console.error('Error calculating status duration:', error);
      return '';
    }
  };

  const fetchCurrentRouteForBus = async (busId: string): Promise<string> => {
    try {
      if (!token) return 'N/A';
      const today = new Date().toISOString().slice(0, 10);
      const response = await axios.get(
        `${API_BASE_URL}/buses/bus/${busId}/current-route`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success && response.data.route) {
        const { route_number, route_name } = response.data.route;
        return `Route ${route_number} - ${route_name}`;
      } else {
        return 'No route assigned';
      }
    } catch {
      return 'No route assigned';
    }
  };

  const fetchBuses = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        setError('Authentication token is missing. Please log in.');
        setLoading(false);
        return;
      }

      let apiUrl = `${API_BASE_URL}/depot-engineer/buses`;
      if (context?.user?.role === 'depot_manager' || context?.user?.role === 'depot_operations') {
        if (!context?.user?.depot_id) {
          setError('Depot ID is required for this user role.');
          setLoading(false);
          return;
        }
        apiUrl = `${API_BASE_URL}/buses/depot/${context.user.depot_id}`;
      }
      
      console.log('Fetching from:', apiUrl);

      const response = await axios.get<BusResponse>(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.buses) {
        const fetchedBuses: Bus[] = await Promise.all(
          response.data.buses.map(async (bus: any) => {
            const currentRoute = await fetchCurrentRouteForBus(bus.bus_id.toString());
            const statusDuration = calculateStatusDuration(bus.updated_at, bus.status);
            
            return {
              bus_id: bus.bus_id,
              registration_number: bus.registration_number,
              model: bus.model,
              year: bus.year,
            
              status: bus.status,
              depot_name: bus.depot_name,
              class: bus.class,
              manufacturer: bus.manufacturer,
              purchase_date: bus.purchase_date,
              updated_at: bus.updated_at,
              
              currentRoute: currentRoute,
              lastService: '2024-06-15',
              nextService: '2024-08-15',
              fuelEfficiency: 4.5,
              driver: 'John Doe',
              conductor: 'Jane Smith',
              location: bus.depot_name,
              serviceHistory: [],
              partChanges: [],
              statusDuration: statusDuration,
              alerts: bus.status === 'Maintenance' 
                ? [{ 
                    type: 'error', 
                    message: statusDuration 
                      ? `Under maintenance for ${statusDuration}` 
                      : 'Under maintenance'
                  }] 
                : bus.status === 'Out of Service'
                  ? [{
                      type: 'error',
                      message: statusDuration
                        ? `Out of service for ${statusDuration}`
                        : 'Out of service'
                    }]
                  : [],
            };
          })
        );
        setBuses(fetchedBuses);
      } else {
        setError(`Failed to fetch buses: ${response.data.message}`);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('API Error:', axiosError);
      if (axiosError.response) {
        if (axiosError.response.status === 403) {
            setError(`Permission Denied: You do not have access to view this information. Please check your user role with an administrator.`);
        } else {
            setError(`Failed to fetch buses: ${axiosError.response.status} - ${(axiosError.response.data as any)?.message || axiosError.response.statusText}. Please verify the API endpoint with the backend team.`);
        }
      } else if (axiosError.request) {
        setError('Failed to fetch buses. The API endpoint might be down or unreachable.');
      } else {
        setError(`Error setting up request: ${axiosError.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && context?.user?.role) {
      fetchBuses();
    } else if (!token) {
      setError('Please log in to view this page.');
      setLoading(false);
    } else {
      setError('User role not identified. Please log in again.');
      setLoading(false);
    }
  }, [token, context?.user?.role, context?.user?.depot_id]);

  useEffect(() => {
    // If you already fetch fleetStatus in a parent page, remove this block.
    const fetchFleet = async () => {
      try {
  const res = await axios.get(`${API_BASE_URL}/depot-ops-dashboard/depot/${context?.user?.depot_id}/fleet-status`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        const d = res.data || {};
        setFleetStatus({
          active: Number(d.active ?? d.activeBuses ?? 0),
          maintenance: Number(d.maintenance ?? d.maintenanceBuses ?? 0),
          outOfService: Number(d.outOfService ?? d.out_of_service ?? 0),
          total: Number(d.total ?? d.totalBuses ?? 0)
        });
      } catch (e) {
        console.warn('Failed to load fleet status', e);
      }
    };
    fetchFleet();
  }, [context?.user?.depot_id, token]);

  const filteredBuses = buses.filter((bus) => {
    const matchesSearch =
      bus.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || bus.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Service':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Out of Service':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <HiCheckCircle className="w-4 h-4" />;
      case 'In Service':
        return <HiTruck className="w-4 h-4" />;
      case 'Maintenance':
        return <HiCog className="w-4 h-4" />;
      case 'Out of Service':
        return <HiExclamationCircle className="w-4 h-4" />;
      default:
        return <HiTruck className="w-4 h-4" />;
    }
  };

  const handleViewDetails = (bus: Bus) => {
    setSelectedBus(bus);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedBus(null);
  };

  const fleetStats = {
    total: buses.length,
    active: buses.filter((b) => b.status === 'Active').length,
    inService: buses.filter((b) => b.status === 'In Service').length,
    maintenance: buses.filter((b) => b.status === 'Maintenance').length,
    avgFuelEfficiency: (
      buses.reduce((sum, b) => sum + (b.fuelEfficiency || 0), 0) / (buses.length || 1)
    ).toFixed(1),
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading fleet information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 bg-red-50 rounded-lg border border-red-200 p-6">
        <HiExclamationCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to load fleet data</h3>
        <p className="text-red-600 text-center">{error}</p>
        <button 
          onClick={fetchBuses}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
              <p className="text-gray-600 mt-1">Manage and monitor your bus fleet operations</p>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center space-x-2 text-sm text-gray-500">
                </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Total Buses" 
            value={fleetStats.total} 
            icon={<HiTruck className="w-5 h-5" />}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard 
            label="Active" 
            value={fleetStats.active} 
            icon={<HiCheckCircle className="w-5 h-5" />}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard 
            label="Out of Service" 
            value={fleetStatus.outOfService ?? 0} 
            icon={<HiExclamationCircle className="w-5 h-5" />}
            color="text-red-600"
            bgColor="bg-red-50"
          />
          <StatCard 
            label="Maintenance" 
            value={fleetStats.maintenance} 
            icon={<HiCog className="w-5 h-5" />}
            color="text-yellow-600"
            bgColor="bg-yellow-50"
          />
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by registration number or model..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <HiFilter className="w-5 h-5 text-gray-400" />
              <select
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-w-40"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active buses </option>
                <option value="Maintenance">Maintenance buses </option>
                <option value="Out of Service">Out of Service buses </option>
              </select>
            </div>
          </div>

          {/* Bus Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
            {filteredBuses.map((bus) => (
              <div key={bus.bus_id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-200 group flex flex-col justify-between h-full">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                       {bus.registration_number}
                     </h3>
                     <p className="text-sm text-gray-600">
                       {bus.model} • {bus.year} • {bus.class || 'N/A'}
                     </p>
                   </div>
                   <div className="flex flex-col items-end">
                     <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(bus.status)}`}>
                       {getStatusIcon(bus.status)}
                       {bus.status}
                     </span>
                     {bus.statusDuration && (
                       <div className="text-xs text-gray-500 mt-1 font-normal">
                         {bus.statusDuration}
                       </div>
                     )}
                   </div>
                 </div>
 
                 {bus.alerts.length > 0 && (
                   <div className="mb-4">
                     {bus.alerts.map((alert, index) => (
                       <div
                         key={index}
                         className="flex items-center text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg"
                       >
                         <HiExclamationCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                         <span>{alert.message}</span>
                       </div>
                     ))}
                   </div>
                 )}
 
                <div className="space-y-3 mb-6 text-sm text-gray-600 flex-1">
                   <div className="flex items-center">
                     <HiLocationMarker className="w-4 h-4 mr-3 text-gray-400" />
                     <span className="font-medium">Location:</span>
                     <span className="ml-2">{bus.location || 'N/A'}</span>
                   </div>
                   <div className="flex items-start">
                     <HiMap className="w-4 h-4 mr-3 text-gray-400 mt-0.5" />
                     <div>
                       <span className="font-medium">Current Route:</span>
                       <p className="text-gray-700 mt-1">{bus.currentRoute || 'No route assigned'}</p>
                     </div>
                   </div>
                 </div>
 
                <button
                   onClick={() => handleViewDetails(bus)}
                   className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium group"
                 >
                   View Details
                 </button>
               </div>
             ))}
           </div>

          {filteredBuses.length === 0 && (
            <div className="text-center py-12">
              <HiTruck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No buses found matching your criteria.</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter terms</p>
            </div>
          )}
        </div>

        {/* Bus Details Modal */}
        {showDetails && selectedBus && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-2xl p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedBus.registration_number}</h2>
                    <p className="text-gray-600 mt-1">
                      {selectedBus.model} • {selectedBus.year} • {selectedBus.manufacturer}
                    </p>
                  </div>
                  <button 
                    onClick={closeDetails}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <HiX className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <DetailsSection 
                    title="Basic Information" 
                    icon={<HiTruck className="w-5 h-5" />}
                    data={[
                      ['Registration Number', selectedBus.registration_number],
                      ['Model', selectedBus.model],
                      ['Manufacturer', selectedBus.manufacturer],
                      ['Year', selectedBus.year],
                      ['Class', selectedBus.class || 'N/A'],
                      ['Depot', selectedBus.depot_name],
                    ]} 
                  />

                  <DetailsSection 
                    title="Performance & Status" 
                    icon={<HiCog className="w-5 h-5" /> }
                    data={[
                      ['Current Status', 
                        <span key="status" className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBus.status)}`}>
                          {getStatusIcon(selectedBus.status)}
                          {selectedBus.status}
                        </span>
                      ],
                      ['Last Service', selectedBus.lastService || 'N/A'],
                    ]} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

const StatCard = ({ label, value, icon, color, bgColor }: { 
  label: string; 
  value: string | number; 
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${bgColor}`}>
        <div className={color}>{icon}</div>
      </div>
    </div>
  </div>
);

const DetailsSection = ({ title, icon, data }: { 
  title: string; 
  icon: React.ReactNode;
  data: [string, React.ReactNode][];
}) => (
  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="space-y-4">
      {data.map(([label, value], idx) => (
        <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
          <span className="text-gray-600 font-medium">{label}:</span>
          <span className="font-medium text-gray-900 text-right">{value}</span>
        </div>
      ))}
    </div>
  </div>
);

export default FleetManagement;