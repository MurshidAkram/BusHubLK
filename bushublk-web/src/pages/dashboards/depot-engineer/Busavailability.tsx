import React, { useState } from 'react';
import { HiSearch, HiFilter, HiEye, HiChevronLeft, HiChevronRight, HiX, HiPencil } from 'react-icons/hi';

interface Bus {
  id: string;
  class: 'A' | 'B' | 'C' | 'D';
  capacity: number;
  route: string;
  mileage: string;
  status: 'Active' | 'In Service' | 'Maintenance' | 'Out of Service';
  lastService: string;
  nextService: string;
}

interface Filters {
  status: string;
  class: string;
  route: string;
}

const Busavailability = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedStatus, setEditedStatus] = useState<'Active' | 'In Service' | 'Maintenance' | 'Out of Service'>('Active');
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    class: 'all',
    route: 'all'
  });

  const busesPerPage = 5;

  // Sample bus data with updated status options
  const [busData, setBusData] = useState<Bus[]>([
    {
      id: '#12',
      class: 'A',
      capacity: 45,
      route: 'Route 101',
      mileage: '45,200 km',
      status: 'Active',
      lastService: '2023-05-15',
      nextService: '2023-06-15'
    },
    {
      id: '#07',
      class: 'B',
      capacity: 50,
      route: 'Route 205',
      mileage: '38,750 km',
      status: 'In Service',
      lastService: '2023-04-28',
      nextService: '-'
    },
    {
      id: '#15',
      class: 'C',
      capacity: 40,
      route: 'Route 302',
      mileage: '52,100 km',
      status: 'Maintenance',
      lastService: '2023-05-20',
      nextService: '2023-06-20'
    },
    {
      id: '#22',
      class: 'A',
      capacity: 45,
      route: 'Route 101',
      mileage: '67,800 km',
      status: 'Out of Service',
      lastService: '2023-03-10',
      nextService: '-'
    },
    // Add more buses with different statuses as needed
    {
      id: '#18',
      class: 'B',
      capacity: 50,
      route: 'Route 205',
      mileage: '29,400 km',
      status: 'Active',
      lastService: '2023-05-10',
      nextService: '2023-06-10'
    },
    {
      id: '#25',
      class: 'C',
      capacity: 40,
      route: 'Route 302',
      mileage: '41,300 km',
      status: 'In Service',
      lastService: '2023-05-18',
      nextService: '2023-06-18'
    }
  ]);

  // Filter buses based on search term and filters
  const filteredBuses = busData.filter((bus: Bus) => {
    const matchesSearch = 
      bus.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.status.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filters.status === 'all' || 
      (filters.status === 'active' && bus.status === 'Active') ||
      (filters.status === 'in-service' && bus.status === 'In Service') ||
      (filters.status === 'maintenance' && bus.status === 'Maintenance') ||
      (filters.status === 'out-of-service' && bus.status === 'Out of Service');
    
    const matchesClass = 
      filters.class === 'all' ||
      bus.class === filters.class;
    
    const matchesRoute = 
      filters.route === 'all' ||
      (filters.route === '101' && bus.route.includes('101')) ||
      (filters.route === '205' && bus.route.includes('205')) ||
      (filters.route === '302' && bus.route.includes('302'));
    
    return matchesSearch && matchesStatus && matchesClass && matchesRoute;
  });

  // Calculate statistics
  const totalBuses = filteredBuses.length;
  const activeBuses = filteredBuses.filter(bus => bus.status === 'Active').length;
  const inServiceBuses = filteredBuses.filter(bus => bus.status === 'In Service').length;
  const maintenanceBuses = filteredBuses.filter(bus => bus.status === 'Maintenance').length;
  const outOfServiceBuses = filteredBuses.filter(bus => bus.status === 'Out of Service').length;

  // Pagination
  const totalPages = Math.ceil(filteredBuses.length / busesPerPage);
  const startIndex = (currentPage - 1) * busesPerPage;
  const endIndex = startIndex + busesPerPage;
  const currentBuses = filteredBuses.slice(startIndex, endIndex);

  const getStatusColor = (status: 'Active' | 'In Service' | 'Maintenance' | 'Out of Service') => {
    switch (status) {
      case 'Active':
        return 'text-green-600 bg-green-100';
      case 'In Service':
        return 'text-blue-600 bg-blue-100';
      case 'Maintenance':
        return 'text-orange-600 bg-orange-100';
      case 'Out of Service':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getClassColor = (busClass: 'A' | 'B' | 'C' | 'D') => {
    switch (busClass) {
      case 'A':
        return 'bg-blue-100 text-blue-800';
      case 'B':
        return 'bg-green-100 text-green-800';
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      case 'D':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      class: 'all',
      route: 'all'
    });
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    setShowFilters(false);
  };

  const handleViewBus = (bus: Bus) => {
    setSelectedBus(bus);
    setEditedStatus(bus.status);
    setIsEditing(false);
  };

  const closeBusDetails = () => {
    setSelectedBus(null);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditedStatus(e.target.value as 'Active' | 'In Service' | 'Maintenance' | 'Out of Service');
  };

  const handleSaveChanges = () => {
    if (!selectedBus) return;

    const updatedBusData = busData.map(bus => 
      bus.id === selectedBus.id ? { ...bus, status: editedStatus } : bus
    );

    setBusData(updatedBusData);
    setSelectedBus({ ...selectedBus, status: editedStatus });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    if (selectedBus) {
      setEditedStatus(selectedBus.status);
    }
    setIsEditing(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
      <div className="p-6 border-b border-gray-600">
  <h3 className="text-lg font-semibold text-black-500">Bus Status Update</h3>
  <p className="text-sm text-gray-400">Review and approve buses for daily service</p>
</div>
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search buses..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          {/* Filter Button */}
          <div className="relative">
            <button 
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => setShowFilters(!showFilters)}
            >
              <HiFilter className="mr-2 h-4 w-4" />
              Filter
            </button>
            
            {/* Filter Dropdown */}
            {showFilters && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg z-10 p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-gray-900">Filter Options</h3>
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <HiX className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="in-service">In Service</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="out-of-service">Out of Service</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <select
                      name="class"
                      value={filters.class}
                      onChange={handleFilterChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Classes</option>
                      <option value="A">Class A</option>
                      <option value="B">Class B</option>
                      <option value="C">Class C</option>
                      <option value="D">Class D</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                    <select
                      name="route"
                      value={filters.route}
                      onChange={handleFilterChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Routes</option>
                      <option value="101">Route 101</option>
                      <option value="205">Route 205</option>
                      <option value="302">Route 302</option>
                    </select>
                  </div>
                  
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={resetFilters}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Reset
                    </button>
                    <button
                      onClick={applyFilters}
                      className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-500 hover:bg-blue-600"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Bus Fleet Overview</h3>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-gray-800">Active {activeBuses} buses</span>
          </div>
        </div>
        {/* <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active</h3>
          <span className="text-2xl font-bold text-green-600">{activeBuses}</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">In Service</h3>
          <span className="text-2xl font-bold text-blue-600">{inServiceBuses}</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Maintenance</h3>
          <span className="text-2xl font-bold text-orange-600">{maintenanceBuses}</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Out of Service</h3>
          <span className="text-2xl font-bold text-red-600">{outOfServiceBuses}</span>
        </div> */}
      </div>

      {/* Bus Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bus ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mileage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentBuses.map((bus) => (
                <tr key={bus.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {bus.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${getClassColor(bus.class)}`}>
                      {bus.class}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bus.capacity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bus.route}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bus.mileage}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bus.status)}`}>
                      {bus.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bus.lastService}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bus.nextService}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button 
                      className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
                      onClick={() => handleViewBus(bus)}
                    >
                      <HiEye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, filteredBuses.length)}</span> of{' '}
                <span className="font-medium">{filteredBuses.length}</span> buses
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiChevronLeft className="h-5 w-5" />
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <HiChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Bus Details Modal */}
      {selectedBus && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}
        >
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Bus Details</h2>
              <button
                onClick={closeBusDetails}
                className="text-gray-400 hover:text-gray-500"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Bus ID:</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedBus.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Class:</span>
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${getClassColor(selectedBus.class)}`}>
                      {selectedBus.class}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Capacity:</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedBus.capacity} passengers</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Route:</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedBus.route}</span>
                  </div>
                </div>
              </div>

              {/* Status & Operation */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Status & Operation</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    {isEditing ? (
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
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBus.status)}`}>
                        {selectedBus.status}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Mileage:</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedBus.mileage}</span>
                  </div>
                </div>
              </div>

              {/* Service Information */}
              <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Last Service:</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedBus.lastService}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Next Service:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedBus.nextService === '-' ? 'Not Scheduled' : selectedBus.nextService}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedBus.status === 'Active' ? '✓' : 
                       selectedBus.status === 'In Service' ? '→' :
                       selectedBus.status === 'Maintenance' ? '⚠' : '✗'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Operational Status</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {parseInt(selectedBus.mileage.replace(/[^\d]/g, '')) > 50000 ? 'High' : 'Normal'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Mileage Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedBus.nextService === '-' ? 'Pending' : 'Scheduled'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Service Status</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              {isEditing ? (
                <>
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
                </>
              ) : (
                <>
                  <button
                    onClick={closeBusDetails}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleEditClick}
                    className="flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-500 hover:bg-blue-600"
                  >
                    <HiPencil className="mr-2 h-4 w-4" />
                    Edit Status
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Busavailability;