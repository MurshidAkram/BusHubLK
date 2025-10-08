import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../context/AppContext';
import axios, { AxiosError } from 'axios';

// Matches the backend model properties
type BusFromAPI = {
  bus_id: string;
  registration_number: string;
  model: string;
  year: number;
  mileage: number;
  status: string;
  depot_name: string;
  class: string;
  manufacturer: string;
  purchase_date: string;
  updated_at?: string; // Add updated_at for duration calculation
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
  statusDuration?: string; // Duration since status change
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
      return <div className="text-center py-8 text-red-600">Error: {this.state.error}</div>;
    }
    return this.props.children;
  }
}

const FleetManagement: React.FC = () => {
  const context = useContext(AppContext) as AppContextType | undefined;
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const token = context?.token;

  // Utility function to calculate duration since last status change
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

  // Fetch spare parts usage history for a specific bus
  const fetchPartChangesForBus = async (busId: string): Promise<PartChange[]> => {
    try {
      console.log('🔧 Fetching part changes for bus:', busId);
      
      if (!token) {
        console.log('❌ No token available');
        return [];
      }

      const response = await axios.get(
        `http://localhost:5000/api/depot-engineer/buses/${busId}/spare-parts-usage`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('📥 Part changes response:', response.data);

      if (response.data.success && response.data.usageHistory) {
        // Transform the usage history data to match the PartChange interface
        const partChanges: PartChange[] = response.data.usageHistory.map((usage: any) => ({
          date: new Date(usage.usage_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          part: usage.part_name,
          quantity: usage.quantity_used,
          unit: usage.unit || 'pieces', // Include unit from API response
          cost: 0 // We removed cost tracking, so setting to 0
        }));

        console.log('✅ Transformed part changes:', partChanges);
        return partChanges;
      } else {
        console.log('❌ No usage history found or failed response');
        return [];
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('💥 Fetch part changes error:', axiosError);
      return [];
    }
  };

  // Fetch service history for a specific bus
  const fetchServiceHistoryForBus = async (busId: string): Promise<ServiceHistory[]> => {
    try {
      console.log('📋 Fetching service history for bus:', busId);
      
      if (!token) {
        console.log('❌ No token available');
        return [];
      }

      const response = await axios.get(
        `http://localhost:5000/api/depot-engineer/buses/${busId}/service-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('📥 Service history response:', response.data);

      if (response.data.success && response.data.schedules) {
        // Transform the service schedule data to match the ServiceHistory interface
        const serviceHistory: ServiceHistory[] = response.data.schedules.map((schedule: any) => ({
          id: schedule.id,
          date: schedule.completed_date ? schedule.completed_date.split('T')[0] : schedule.scheduled_date.split('T')[0],
          type: schedule.service_type,
          cost: 0, // Cost tracking removed
          status: schedule.calculated_status || schedule.status,
          scheduled_date: schedule.scheduled_date.split('T')[0],
          completed_date: schedule.completed_date ? schedule.completed_date.split('T')[0] : undefined,
          cancelled_date: schedule.cancelled_date ? schedule.cancelled_date.split('T')[0] : undefined,
        }));

        console.log('✅ Transformed service history:', serviceHistory);
        return serviceHistory;
      } else {
        console.log('❌ No service history found or failed response');
        return [];
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('💥 Fetch service history error:', axiosError);
      return [];
    }
  };

  // Fetch current route for a specific bus
  const fetchCurrentRouteForBus = async (busId: string): Promise<string> => {
    try {
      console.log('🛣 Fetching current route for bus:', busId);
      
      if (!token) {
        console.log('❌ No token available');
        return 'N/A';
      }

      // Use the daily assignment endpoint to get current route assignment
      const response = await axios.get(
        `http://localhost:5000/api/daily-assignments/bus/${busId}/current-route`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('📥 Current route response:', response.data);

      if (response.data.success && response.data.assignment) {
        const routeName = response.data.assignment.route_name || 'Unknown Route';
        console.log('✅ Current route found:', routeName);
        return routeName;
      } else {
        console.log('❌ No current route assignment found');
        return 'No route assigned';
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('💥 Fetch current route error:', axiosError);
      
      // If the endpoint doesn't exist, try alternative approach
      if (axiosError.response?.status === 404) {
        try {
          // Fallback: try to get route from daily assignments for this depot
          const fallbackResponse = await axios.get(
            'http://localhost:5000/api/daily-assignments',
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          
          if (fallbackResponse.data.success && fallbackResponse.data.assignments) {
            // Find assignment for this bus
            const busAssignment = fallbackResponse.data.assignments.find(
              (assignment: any) => assignment.bus_id.toString() === busId
            );
            
            if (busAssignment && busAssignment.route_name) {
              console.log('✅ Route found via fallback:', busAssignment.route_name);
              return busAssignment.route_name;
            }
          }
        } catch (fallbackErr) {
          console.error('💥 Fallback route fetch error:', fallbackErr);
        }
      }
      
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

      let apiUrl = 'http://localhost:5000/api/depot-engineer/buses';
      // No need to append 'role' as a query parameter.
      // The backend should derive the user's role from the JWT token.
      if (context?.user?.role === 'depot_manager' || context?.user?.role === 'depot_operations') {
        if (!context?.user?.depot_id) {
          setError('Depot ID is required for this user role.');
          setLoading(false);
          return;
        }
        apiUrl = `http://localhost:5000/api/buses/depot/${context.user.depot_id}`;
      }
      
      console.log('Fetching from:', apiUrl); // Debug log

      const response = await axios.get<BusResponse>(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.buses) {
        // First, create buses with basic data and empty part changes
        const fetchedBuses: Bus[] = await Promise.all(
          response.data.buses.map(async (bus: any) => {
            const partChanges = await fetchPartChangesForBus(bus.bus_id.toString());
            const serviceHistory = await fetchServiceHistoryForBus(bus.bus_id.toString());
            const currentRoute = await fetchCurrentRouteForBus(bus.bus_id.toString());
            
            // Calculate status duration for maintenance and out of service buses
            const statusDuration = calculateStatusDuration(bus.updated_at, bus.status);
            
            return {
              // BusFromAPI properties
              bus_id: bus.bus_id,
              registration_number: bus.registration_number,
              model: bus.model,
              year: bus.year,
              mileage: bus.mileage,
              status: bus.status,
              depot_name: bus.depot_name,
              class: bus.class,
              manufacturer: bus.manufacturer,
              purchase_date: bus.purchase_date,
              updated_at: bus.updated_at,
              
              // Extended properties
              currentRoute: currentRoute, // Real data from bus routes
              lastService: '2024-06-15',
              nextService: '2024-08-15',
              fuelEfficiency: 4.5,
              driver: 'John Doe',
              conductor: 'Jane Smith',
              location: bus.depot_name,
              serviceHistory: serviceHistory, // Real data from service schedules
              partChanges: partChanges, // Real data from spare parts usage history
              statusDuration: statusDuration, // Duration since status change
              alerts: bus.status === 'Maintenance' 
                ? [{ 
                    type: 'error', 
                    message: statusDuration 
                      ? `Under maintenance for ${statusDuration} - ETA 2 days` 
                      : 'Under maintenance - ETA 2 days' 
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
        // If it's a 403, provide a more specific message if possible
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
    // Only fetch if token is present and user role is defined.
    // The specific access check for "Depot Engineers" should be handled by the backend.
    if (token && context?.user?.role) {
      fetchBuses();
    } else if (!token) {
      setError('Please log in to view this page.');
      setLoading(false);
    } else {
      // This else block might be redundant if the above `if` and `else if` cover all cases.
      // If the context.user.role is null/undefined for some reason, this message will show.
      setError('User role not identified. Please log in again.');
      setLoading(false);
    }
  }, [token, context?.user?.role, context?.user?.depot_id]); // Added depot_id to dependency array

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
        return 'bg-green-100 text-green-800';
      case 'In Service':
        return 'bg-blue-100 text-blue-800';
      case 'Maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'Out of Service':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-gray-100 text-gray-800';
      case 'Due Today':
        return 'bg-yellow-100 text-yellow-800';
      case 'Overdue':
        return 'bg-orange-100 text-orange-800';
      case 'Critical Overdue':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-800';
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
    return <div className="text-center py-8">Loading buses...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error: {error}</div>;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
          <StatCard label="Total Buses" value={fleetStats.total} color="text-blue-600" />
          <StatCard label="Active" value={fleetStats.active} color="text-green-600" />
          <StatCard label="In Service" value={fleetStats.inService} color="text-blue-600" />
          <StatCard label="Maintenance" value={fleetStats.maintenance} color="text-yellow-600" />
         
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search by Registration No. or Model"
              className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Filter:</span>
              <select
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="In Service">In Service</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Out of Service">Out of Service</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBuses.map((bus) => (
              <div key={bus.bus_id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{bus.registration_number}</h3>
                    <p className="text-sm text-gray-600">
                      {bus.model} ({bus.year}) - {bus.class || 'N/A'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bus.status)}`}>
                    {bus.status}
                    {bus.statusDuration && (
                      <div className="text-xs text-gray-600 mt-1 font-normal">
                        {bus.statusDuration}
                      </div>
                    )}
                  </span>
                </div>

                {bus.alerts.length > 0 && (
                  <div className="mb-4">
                    {bus.alerts.map((alert, index) => (
                      <div
                        key={index}
                        className="flex items-center text-sm text-yellow-700 bg-yellow-50 p-2 rounded"
                      >
                        <span className="mr-2">⚠</span>
                        <span>{alert.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="mr-2">📍</span>
                    {bus.location || 'N/A'}
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">🛣</span>
                    Current Route: {bus.currentRoute || 'N/A'}
                  </div>
                  {/* <div className="flex items-center">
                    <span className="mr-2">📅</span>
                    Next Service: {bus.nextService || 'N/A'}
                  </div> */}
                </div>

                

                <button
                  onClick={() => handleViewDetails(bus)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>

          {filteredBuses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No buses found matching your criteria.</p>
            </div>
          )}
        </div>

        {showDetails && selectedBus && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedBus.registration_number}</h2>
                    <p className="text-gray-600">
                      {selectedBus.model} ({selectedBus.year})
                    </p>
                  </div>
                  <button onClick={closeDetails} className="text-gray-400 hover:text-gray-600 text-2xl">
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <DetailsSection title="Basic Information" data={[
                    ['Registration', selectedBus.registration_number],
                    ['Model', selectedBus.model],
                    ['Year', selectedBus.year],
                    ['Class', selectedBus.class || 'N/A'],
                  ]} />

                  <DetailsSection title="Performance" data={[
                    ['Total Mileage', `${selectedBus.mileage?.toLocaleString() || 0} km`],
                    ['Last Service', selectedBus.lastService || 'N/A'],
                    ['Next Service', selectedBus.nextService || 'N/A'],
                    ['Status', <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedBus.status)}`}>{selectedBus.status}</span>],
                    ...(selectedBus.statusDuration && (selectedBus.status === 'Maintenance' || selectedBus.status === 'Out of Service') 
                      ? [['Status Duration', selectedBus.statusDuration] as [string, React.ReactNode]]
                      : []),
                  ]} />
                </div>

                <ServiceHistoryTable title="🔧 Service History" serviceHistory={selectedBus.serviceHistory} getServiceStatusColor={getServiceStatusColor} />

                <TableSection title="⚙ Recent Part Changes" columns={['Date', 'Part', 'Quantity', 'Unit']} rows={
                  selectedBus.partChanges.map(item => [item.date, item.part, item.quantity.toString(), item.unit])
                } />
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center">
      <div className={`${color} text-2xl mr-3`}>📊</div>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const ServiceHistoryTable = ({ 
  title, 
  serviceHistory, 
  getServiceStatusColor 
}: {
  title: string;
  serviceHistory: ServiceHistory[];
  getServiceStatusColor: (status: string) => string;
}) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold mb-4 flex items-center">{title}</h3>
    {serviceHistory.length === 0 ? (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
        <p>No service history found</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Service Type</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {serviceHistory.map((item, i) => (
              <tr key={i} className="border-b">
                <td className="px-4 py-2">{item.date}</td>
                <td className="px-4 py-2">{item.type}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const DetailsSection = ({ title, data }: { title: string; data: [string, React.ReactNode][] }) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    <div className="space-y-3">
      {data.map(([label, value], idx) => (
        <div key={idx} className="flex justify-between">
          <span className="text-gray-600">{label}:</span>
          <span className="font-medium">{value}</span>
        </div>
      ))}
    </div>
  </div>
);

const TableSection = ({ title, columns, rows }: {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold mb-4 flex items-center">{title}</h3>
    {rows.length === 0 ? (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
        <p>No recent part changes found</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{columns.map((col, i) => <th key={i} className="px-4 py-2 text-left">{col}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default FleetManagement;