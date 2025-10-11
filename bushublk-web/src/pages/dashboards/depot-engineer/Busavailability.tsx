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
  buses?: Bus[];
  bus?: Bus;
}

interface PartCondition {
  part_name: string;
  checked: boolean;
}

interface PartCheckingData {
  main_parts: PartCondition[];
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
  const [partCheckingData, setPartCheckingData] = useState<PartCheckingData>({
    main_parts: [
      { part_name: 'Engine', checked: false },
      { part_name: 'Brakes', checked: false },
      { part_name: 'Tires', checked: false },
      { part_name: 'Windows', checked: false },
      { part_name: 'Doors', checked: false },
      { part_name: 'Lights', checked: false },
      { part_name: 'Turn Signals', checked: false },
      { part_name: 'Fire Extinguisher', checked: false }
    ]
  });

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

      let apiUrl = 'http://localhost:5000/api/buses';
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
      console.log('Fetching from:', apiUrl);

      const response = await axios.get<BusResponse>(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success && response.data.buses) {
        setBuses(response.data.buses);
      } else {
        setError(`Failed to fetch buses: ${response.data.message}`);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('API Error:', axiosError);
      if (axiosError.response) {
        setError(`Failed to fetch buses: ${axiosError.response.status} - ${(axiosError.response.data as any)?.message || axiosError.response.statusText}`);
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
    const newStatus = e.target.value as Bus['status'];
    setEditedStatus(newStatus);
  };

  const updatePartCondition = (partIndex: number, checked: boolean) => {
    setPartCheckingData(prev => ({
      ...prev,
      main_parts: prev.main_parts.map((part, index) => 
        index === partIndex ? { ...part, checked } : part
      )
    }));
  };

  const handleSaveChanges = async () => {
    if (!selectedBus || !token) return;

    try {
      setLoading(true);
      setError(null);
      
      // Prepare part checking flags for database
      const partCheckingFlags = {
        // Main parts flags
        engine: partCheckingData.main_parts[0]?.checked || false,
        brakes: partCheckingData.main_parts[1]?.checked || false,
        tires: partCheckingData.main_parts[2]?.checked || false,
        windows: partCheckingData.main_parts[3]?.checked || false,
        doors: partCheckingData.main_parts[4]?.checked || false,
        lights: partCheckingData.main_parts[5]?.checked || false,
        turn_signals: partCheckingData.main_parts[6]?.checked || false,
        fire_extinguisher: partCheckingData.main_parts[7]?.checked || false,
        
        // Part checking metadata
        checking_date: new Date().toISOString(),
        checker_id: context?.user?.userId
      };

      const response = await axios.put<BusResponse>(
        `http://localhost:5000/api/depot-engineer/buses/${selectedBus.bus_id}/status`,
        { 
          status: editedStatus,
          part_checking_data: partCheckingFlags
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.success && response.data.bus) {
          setBuses(prevBuses =>
              prevBuses.map(bus =>
                  bus.bus_id === selectedBus.bus_id ? { ...bus, status: editedStatus } : bus
              )
          );
          setShowEditModal(false);
          setSelectedBus(null);
          // Reset part checking data for next check
          setPartCheckingData({
            main_parts: [
              { part_name: 'Engine', checked: false },
              { part_name: 'Brakes', checked: false },
              { part_name: 'Tires', checked: false },
              { part_name: 'Windows', checked: false },
              { part_name: 'Doors', checked: false },
              { part_name: 'Lights', checked: false },
              { part_name: 'Turn Signals', checked: false },
              { part_name: 'Fire Extinguisher', checked: false }
            ]
          });
      } else {
          setError('Failed to update bus status: ' + (response.data.message || 'Unknown error.'));
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Error updating bus status:', axiosError);
      if (axiosError.response) {
        const errorData = axiosError.response.data as any;
        setError(`Failed to update status: ${axiosError.response.status} - ${errorData?.message || axiosError.response.statusText}`);
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
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Bus Availability </h2>

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium text-gray-700 flex items-center">
              <span className="bg-blue-100 text-blue-800 p-1 rounded mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </span>
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            >
              <option value="">All Statuses</option>
              <option value="Active" className="text-green-600">Active</option>
              <option value="In Service" className="text-blue-600">In Service</option>
              <option value="Maintenance" className="text-yellow-600">Maintenance</option>
              <option value="Out of Service" className="text-red-600">Out of Service</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="class" className="text-sm font-medium text-gray-700 flex items-center">
              <span className="bg-purple-100 text-purple-800 p-1 rounded mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </span>
              Class
            </label>
            <input
              type="text"
              id="class"
              name="class"
              value={filters.class}
              onChange={handleFilterChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out"
              placeholder="e.g., Luxury, Standard"
            />
          </div>

          <div className="md:col-span-3 flex justify-end pt-2">
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out"
            >
              <HiX className="mr-2" />
              Clear All Filters
            </button>
          </div>
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
                Class
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Model
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bus.class}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bus.manufacturer} {bus.model}</td>
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
                        Part Check
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
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
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative p-6 bg-white w-full max-w-4xl mx-auto rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Daily Part Checking & Status Update
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bus Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lg mb-3">Bus Information</h4>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Registration:</span> {selectedBus.registration_number}</p>
                  <p className="text-sm"><span className="font-medium">Model:</span> {selectedBus.manufacturer} {selectedBus.model}</p>
                  <p className="text-sm"><span className="font-medium">Year:</span> {selectedBus.year}</p>
                  <p className="text-sm"><span className="font-medium">Current Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      selectedBus.status === 'Active' ? 'bg-green-100 text-green-800' :
                      selectedBus.status === 'In Service' ? 'bg-blue-100 text-blue-800' :
                      selectedBus.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedBus.status}
                    </span>
                  </p>
                </div>

                {/* Status Change */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Update Status (After Part Check)</label>
                  <p className="text-xs text-gray-600 mb-2">⚠️ Complete the daily part checking first, then select the appropriate status</p>
                  <select
                    value={editedStatus}
                    onChange={handleStatusChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active - Ready for Service</option>
                    <option value="In Service">In Service - Currently Operating</option>
                    <option value="Maintenance">Maintenance - Requires Repair/Service</option>
                    <option value="Out of Service">Out of Service - Not Available</option>
                  </select>
                </div>
              </div>

              {/* Part Checking Checklist - Always visible for depot engineers */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lg mb-3 flex items-center">
                  🔧 Daily Part Checking 
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {partCheckingData.main_parts.filter(part => part.checked).length}/
                    {partCheckingData.main_parts.length} Checked
                  </span>
                </h4>
                
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Main Parts Checklist */}
                  <div className="bg-white p-3 rounded border">
                    <h5 className="font-medium text-blue-600 mb-3">🚌 Main Bus Components</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {partCheckingData.main_parts.map((part, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={part.checked}
                            onChange={(e) => updatePartCondition(index, e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {part.part_name}
                            {part.checked ? ' ✓' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
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
