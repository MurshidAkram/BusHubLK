import React, { useState, useEffect, useContext } from 'react';
import { HiSearch, HiFilter, HiX, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { AppContext } from '../../../context/AppContext';
import axios, { AxiosError } from 'axios';

interface Bus {
  bus_id: string;
  registration_number: string;
  depot_id: string;
  class: string;
  manufacturer: string;
  model: string;
  year: number;
  mileage: string;
  status: 'Active' | 'In Service' | 'Maintenance' | 'Out of Service';
  depot_name?: string;
  region_name?: string;
}

interface Filters {
  status: string;
  class: string;
  depot: string;
}

interface AppContextType {
  user: { role: string; userId: string; depot_id?: string; region_id?: string; } | null;
  token: string | null;
}

interface BusResponse {
  success: boolean;
  message: string;
  buses?: Bus[]; // Changed to optional as not all responses will have 'buses'
  bus?: Bus;    // Added 'bus' (singular) for update responses
}

const Busavailability = () => {
  const context = useContext(AppContext) as AppContextType | null;

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState<Filters>({
    status: '',
    class: '',
    depot: '',
  });
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [editedStatus, setEditedStatus] = useState<Bus['status']>('Active');

  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const userRole = context?.user?.role;
  const userDepotId = context?.user?.depot_id;
  const userRegionId = context?.user?.region_id;
  const token = context?.token;

  const fetchBuses = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        setError('Authentication token is missing. Please log in.');
        setLoading(false);
        return;
      }

      let apiUrl = 'http://localhost:5000/api/buses'; // Default fallback
      if (userRole === 'depot_engineer') {
        apiUrl = 'http://localhost:5000/api/depot-engineer/buses';
      } else if (userRole === 'depot_manager' || userRole === 'depot_operations') {
        if (!userDepotId) {
          setError('Depot ID is required for this user role.');
          setLoading(false);
          return;
        }
        apiUrl = `http://localhost:5000/api/buses/depot/${userDepotId}`;
      }
      console.log('Fetching from:', apiUrl); // Debug log

      const response = await axios.get<BusResponse>(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success && response.data.buses) { // Ensure this is `buses` for GET
        setBuses(response.data.buses);
      } else {
        setError(`Failed to fetch buses: ${response.data.message}`);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('API Error:', axiosError);
      if (axiosError.response) {
        setError(`Failed to fetch buses: ${axiosError.response.status} - ${axiosError.response.data?.message || axiosError.response.statusText}`);
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
    if (token && userRole) {
      fetchBuses();
    } else if (!token) {
      setError('Please log in to view bus availability.');
      setLoading(false);
    }
  }, [token, userRole, userDepotId, userRegionId]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: '', class: '', depot: '' });
    setCurrentPage(1);
  };

  const filteredBuses = buses.filter(bus => {
    const matchesSearch = searchTerm === '' ||
      bus.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.depot_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.region_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filters.status === '' || bus.status === filters.status;
    const matchesClass = filters.class === '' || bus.class.toLowerCase().includes(filters.class.toLowerCase());
    const matchesDepot = filters.depot === '' || bus.depot_id === filters.depot;

    return matchesSearch && matchesStatus && matchesClass && matchesDepot;
  });

  const totalPages = Math.ceil(filteredBuses.length / itemsPerPage);
  const currentBuses = filteredBuses.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleEditClick = (bus: Bus) => {
    setSelectedBus(bus);
    setEditedStatus(bus.status);
    setShowEditModal(true);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setSelectedBus(null);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditedStatus(e.target.value as Bus['status']);
  };

  const handleSaveChanges = async () => {
    if (!selectedBus || !token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await axios.put<BusResponse>(
        `http://localhost:5000/api/depot-engineer/buses/${selectedBus.bus_id}/status`,
        { status: editedStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // CORRECTED: Check for 'bus' (singular) in the response for updates
      if (response.data.success && response.data.bus) {
          // Update the specific bus in the local state with the new status
          setBuses(prevBuses =>
              prevBuses.map(bus =>
                  bus.bus_id === selectedBus.bus_id ? { ...bus, status: editedStatus } : bus
              )
          );
          setShowEditModal(false);
          setSelectedBus(null);
          // Optionally, show a success message temporarily
          // setError(null); // Clear any previous error message
      } else {
          // This else block handles cases where success is false or 'bus' property is missing
          setError('Failed to update bus status: ' + (response.data.message || 'Unknown error.'));
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Error updating bus status:', axiosError);
      if (axiosError.response) {
        setError(`Failed to update status: ${axiosError.response.status} - ${axiosError.response.data?.message || axiosError.response.statusText}`);
      } else {
        setError('Failed to update bus status. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading buses...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Bus Availability Dashboard</h2>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search by registration, manufacturer, model, depot or region..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <HiFilter className="mr-2" />
            Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status:</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="In Service">In Service</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Out of Service">Out of Service</option>
            </select>
          </div>
          <div>
            <label htmlFor="class" className="block text-sm font-medium text-gray-700">Class:</label>
            <input
              type="text"
              id="class"
              name="class"
              value={filters.class}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              placeholder="e.g., Luxury"
            />
          </div>
          <div>
            <label htmlFor="depot" className="block text-sm font-medium text-gray-700">Depot:</label>
            <input
              type="text"
              id="depot"
              name="depot"
              value={filters.depot}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              placeholder="e.g., Kandy"
            />
          </div>
          <button
            onClick={clearFilters}
            className="md:col-span-3 w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <HiX className="mr-2" /> Clear Filters
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reg. Number
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Depot
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Region
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manufacturer
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Model
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mileage
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentBuses.length > 0 ? (
              currentBuses.map((bus) => (
                <tr key={bus.bus_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bus.registration_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bus.depot_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bus.region_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bus.class}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bus.manufacturer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bus.model}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bus.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bus.mileage}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      bus.status === 'Active' ? 'bg-green-100 text-green-800' :
                      bus.status === 'In Service' ? 'bg-blue-100 text-blue-800' :
                      bus.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bus.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {userRole === 'depot_engineer' && (
                      <button
                        onClick={() => handleEditClick(bus)}
                        className="text-blue-600 hover:text-blue-900 ml-4"
                      >
                        Edit Status
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  No buses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <nav className="flex items-center justify-between pt-4" aria-label="Pagination">
        <div className="flex-1 flex justify-between">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiChevronLeft className="h-5 w-5" /> Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next <HiChevronRight className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {showEditModal && selectedBus && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 bg-white w-96 max-w-full mx-auto rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Bus Status</h3>
            <button
              onClick={handleCancelEdit}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <HiX className="h-6 w-6" />
            </button>
            <div className="mt-4">
              <p className="text-sm text-gray-700 mb-2">Registration Number: <span className="font-semibold">{selectedBus.registration_number}</span></p>
              <p className="text-sm text-gray-700 mb-4">Current Status: <span className="font-semibold">{selectedBus.status}</span></p>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Current Status:</span>
                <select
                  value={editedStatus}
                  onChange={handleStatusChange}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="In Service">In Service</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Out of Service">Out of Service</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-500 hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Busavailability;