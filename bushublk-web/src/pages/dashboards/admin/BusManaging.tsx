// pages/dashboards/admin/BusManagement.tsx
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../context/AppContext';
import { 
  HiOutlineSearch, 
  HiOutlineRefresh, 
  HiOutlinePlus, 
  HiOutlinePencilAlt, 
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineTruck,
  HiOutlineFilter,
  HiOutlineLocationMarker,
  HiOutlineOfficeBuilding
} from 'react-icons/hi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Bus {
  bus_id: string;
  registration_number: string;
  depot_id: string;
  depot_name: string;
  region_id: string;
  region_name: string;
  class: string;
  manufacturer: string;
  model: string;
  year: number;
  mileage: number;
  status: string;
  purchase_date: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Region {
  region_id: string;
  region_name: string;
}

interface Depot {
  depot_id: string;
  depot_name: string;
  region_id: string;
}

const BusManaging = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [filteredBuses, setFilteredBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentBus, setCurrentBus] = useState<Bus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [regions, setRegions] = useState<Region[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [filteredDepots, setFilteredDepots] = useState<Depot[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const context = useContext(AppContext);

  // Filter states
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [depotFilter, setDepotFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    registration_number: '',
    depot_id: '',
    class: 'A',
    manufacturer: '',
    model: '',
    year: new Date().getFullYear(),
    mileage: 0,
    status: 'Active',
    purchase_date: new Date().toISOString().split('T')[0]
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch all buses
  const fetchBuses = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/buses', {
        headers: {
          'Authorization': `Bearer ${context?.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch buses');
      }

      const data = await response.json();
      setBuses(data.buses);
      setFilteredBuses(data.buses);
    } catch (error: any) {
      toast.error(error.message || 'Error fetching buses');
    } finally {
      setLoading(false);
    }
  };

  // Fetch regions and depots
  const fetchRegionsAndDepots = async () => {
    try {
      const regionsResponse = await fetch('http://localhost:5000/api/regions', {
        headers: {
          'Authorization': `Bearer ${context?.token}`
        }
      });
      
      if (!regionsResponse.ok) {
        throw new Error('Failed to fetch regions');
      }
      
      const regionsData = await regionsResponse.json();
      setRegions(regionsData.regions);

      const depotsResponse = await fetch('http://localhost:5000/api/depots', {
        headers: {
          'Authorization': `Bearer ${context?.token}`
        }
      });
      
      if (!depotsResponse.ok) {
        throw new Error('Failed to fetch depots');
      }
      
      const depotsData = await depotsResponse.json();
      setDepots(depotsData.depots);
      setFilteredDepots(depotsData.depots);
    } catch (error: any) {
      toast.error(error.message || 'Error fetching regions/depots');
    }
  };

  useEffect(() => {
    fetchBuses();
    fetchRegionsAndDepots();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...buses];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(bus => 
        bus.registration_number.toLowerCase().includes(term) ||
        bus.manufacturer.toLowerCase().includes(term) ||
        bus.model.toLowerCase().includes(term)
      );
    }

    // Apply region filter
    if (regionFilter) {
      result = result.filter(bus => bus.region_id === regionFilter);
    }

    // Apply depot filter
    if (depotFilter) {
      result = result.filter(bus => bus.depot_id === depotFilter);
    }

    // Apply status filter
    if (statusFilter) {
      result = result.filter(bus => bus.status === statusFilter);
    }

    // Apply class filter
    if (classFilter) {
      result = result.filter(bus => bus.class === classFilter);
    }

    setFilteredBuses(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, regionFilter, depotFilter, statusFilter, classFilter, buses]);

  // Update filtered depots when region changes
  useEffect(() => {
    if (regionFilter) {
      setFilteredDepots(depots.filter(depot => depot.region_id === regionFilter));
    } else {
      setFilteredDepots(depots);
    }
    setDepotFilter(null); // Reset depot filter when region changes
  }, [regionFilter, depots]);

  // Pagination
  const totalPages = Math.ceil(filteredBuses.length / itemsPerPage);
  const currentItems = filteredBuses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      registration_number: '',
      depot_id: '',
      class: 'A',
      manufacturer: '',
      model: '',
      year: new Date().getFullYear(),
      mileage: 0,
      status: 'Active',
      purchase_date: new Date().toISOString().split('T')[0]
    });
    setCurrentBus(null);
    setFormErrors({});
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.registration_number.trim()) {
      errors.registration_number = 'Registration number is required';
    }

    if (!formData.depot_id) {
      errors.depot_id = 'Depot is required';
    }

    if (!formData.manufacturer.trim()) {
      errors.manufacturer = 'Manufacturer is required';
    }

    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear()) {
      errors.year = 'Invalid year';
    }

    if (formData.mileage < 0) {
      errors.mileage = 'Mileage must be positive';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create new bus
  const createBus = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/buses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create bus');
      }

      const data = await response.json();
      toast.success('Bus created successfully');
      
      // Update local state
      setBuses([...buses, data.bus]);
      resetForm();
      setShowCreateModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Error creating bus');
    }
  };

  // Edit bus
  const editBus = (bus: Bus) => {
    setCurrentBus(bus);
    setFormData({
      registration_number: bus.registration_number,
      depot_id: bus.depot_id,
      class: bus.class,
      manufacturer: bus.manufacturer,
      model: bus.model || '',
      year: bus.year,
      mileage: bus.mileage,
      status: bus.status,
      purchase_date: bus.purchase_date ? bus.purchase_date.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowEditModal(true);
  };

  // Update bus
  const updateBus = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !currentBus) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/buses/${currentBus.bus_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update bus');
      }

      const data = await response.json();
      toast.success('Bus updated successfully');
      
      // Update local state
      setBuses(buses.map(b => b.bus_id === currentBus.bus_id ? data.bus : b));
      resetForm();
      setShowEditModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Error updating bus');
    }
  };

  // Delete bus
  const deleteBus = async (busId: string) => {
    if (!window.confirm('Are you sure you want to delete this bus?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/buses/${busId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${context?.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete bus');
      }

      // Update local state
      setBuses(buses.filter(bus => bus.bus_id !== busId));
      toast.success('Bus deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error deleting bus');
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="flex items-center px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 disabled:opacity-50"
        >
          Previous
        </button>
        
        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-6">
        {/* Header and actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Bus Management</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <HiOutlineFilter className="mr-2" />
              Filters
            </button>
            <button
              onClick={fetchBuses}
              className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <HiOutlineRefresh className="mr-2" />
              Refresh
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
            >
              <HiOutlinePlus className="mr-2" />
              Add Bus
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col space-y-4">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiOutlineSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md"
                placeholder="Search buses by registration, manufacturer or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={regionFilter || ''}
                    onChange={(e) => setRegionFilter(e.target.value || null)}
                  >
                    <option value="">All Regions</option>
                    {regions.map((region) => (
                      <option key={region.region_id} value={region.region_id}>
                        {region.region_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Depot</label>
                  <select
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={depotFilter || ''}
                    onChange={(e) => setDepotFilter(e.target.value || null)}
                    disabled={!regionFilter}
                  >
                    <option value="">All Depots</option>
                    {filteredDepots.map((depot) => (
                      <option key={depot.depot_id} value={depot.depot_id}>
                        {depot.depot_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={statusFilter || ''}
                    onChange={(e) => setStatusFilter(e.target.value || null)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="In Service">In Service</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Out of Service">Out of Service</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={classFilter || ''}
                    onChange={(e) => setClassFilter(e.target.value || null)}
                  >
                    <option value="">All Classes</option>
                    <option value="A">Class A</option>
                    <option value="B">Class B</option>
                    <option value="C">Class C</option>
                    <option value="D">Class D</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Buses table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredBuses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No buses found matching your criteria
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bus Details
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Depot/Region
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Specifications
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((bus) => (
                      <tr key={bus.bus_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                              <HiOutlineTruck className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {bus.registration_number}
                              </div>
                              <div className="text-sm text-gray-500">
                                {bus.manufacturer} {bus.model}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{bus.depot_name}</div>
                          <div className="text-sm text-gray-500">{bus.region_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Class {bus.class}</div>
                          <div className="text-sm text-gray-500">
                            {bus.year} • {bus.mileage.toLocaleString()} km
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${bus.status === 'Active' ? 'bg-green-100 text-green-800' :
                              bus.status === 'In Service' ? 'bg-blue-100 text-blue-800' :
                              bus.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                              bus.status === 'Out of Service' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {bus.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(bus.updated_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => editBus(bus)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <HiOutlinePencilAlt className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => deleteBus(bus.bus_id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <HiOutlineTrash className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination()}
            </>
          )}
        </div>
      </div>

      {/* Create Bus Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Bus</h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <HiOutlineX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={createBus} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${formErrors.registration_number ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  required
                />
                {formErrors.registration_number && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.registration_number}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depot *
                </label>
                <select
                  name="depot_id"
                  value={formData.depot_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${formErrors.depot_id ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  required
                >
                  <option value="">Select Depot</option>
                  {depots.map(depot => (
                    <option key={depot.depot_id} value={depot.depot_id}>
                      {depot.depot_name}
                    </option>
                  ))}
                </select>
                {formErrors.depot_id && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.depot_id}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class *
                  </label>
                  <select
                    name="class"
                    value={formData.class}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="A">Class A</option>
                    <option value="B">Class B</option>
                    <option value="C">Class C</option>
                    <option value="D">Class D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="In Service">In Service</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Out of Service">Out of Service</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer *
                  </label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.manufacturer ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    required
                  />
                  {formErrors.manufacturer && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.manufacturer}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year *
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className={`w-full px-3 py-2 border ${formErrors.year ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    required
                  />
                  {formErrors.year && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.year}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mileage (km) *
                  </label>
                  <input
                    type="number"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleInputChange}
                    min="0"
                    className={`w-full px-3 py-2 border ${formErrors.mileage ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    required
                  />
                  {formErrors.mileage && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.mileage}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bus Modal */}
      {showEditModal && currentBus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Bus</h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowEditModal(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <HiOutlineX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={updateBus} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${formErrors.registration_number ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  required
                />
                {formErrors.registration_number && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.registration_number}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depot *
                </label>
                <select
                  name="depot_id"
                  value={formData.depot_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${formErrors.depot_id ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  required
                >
                  <option value="">Select Depot</option>
                  {depots.map(depot => (
                    <option key={depot.depot_id} value={depot.depot_id}>
                      {depot.depot_name}
                    </option>
                  ))}
                </select>
                {formErrors.depot_id && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.depot_id}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class *
                  </label>
                  <select
                    name="class"
                    value={formData.class}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="A">Class A</option>
                    <option value="B">Class B</option>
                    <option value="C">Class C</option>
                    <option value="D">Class D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="In Service">In Service</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Out of Service">Out of Service</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer *
                  </label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.manufacturer ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    required
                  />
                  {formErrors.manufacturer && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.manufacturer}</p>
                  )}
                </div>

                
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year *
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className={`w-full px-3 py-2 border ${formErrors.year ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    required
                  />
                  {formErrors.year && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.year}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mileage (km) *
                  </label>
                  <input
                    type="number"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleInputChange}
                    min="0"
                    className={`w-full px-3 py-2 border ${formErrors.mileage ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    required
                  />
                  {formErrors.mileage && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.mileage}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Update Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusManaging;