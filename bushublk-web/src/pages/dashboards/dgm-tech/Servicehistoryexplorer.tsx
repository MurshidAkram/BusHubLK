import { useState, useEffect } from 'react';
import { HiEye, HiFilter, HiSearch, HiChevronDown, HiChevronUp, HiX, HiRefresh } from 'react-icons/hi';

interface ServiceRecord {
  service_id: number;
  service_type: string;
  scheduled_date: string;
  completed_date: string | null;
  cancelled_date: string | null;
  status: string;
  bus_id: number;
  registration_number: string;
  model: string;
  year: number;
  mileage: number;
  depot_id: number;
  depot_name: string;
  depot_address: string;
  region_id: number;
  region_name: string;
  created_at: string;
  updated_at: string;
}

interface PartsRecord {
  usage_id: number;
  part_id: string;
  part_name: string;
  bus_id: number;
  registration_number: string;
  model: string;
  year: number;
  depot_id: number;
  depot_name: string;
  region_id: number;
  region_name: string;
  engineer_id: number;
  engineer_name: string;
  quantity_used: number;
  unit: string;
  usage_date: string;
  created_at: string;
}

interface InspectionRecord {
  id: number;
  inspection_type: string;
  date: string;
  time: string;
  status: string;
  depot_id: number;
  depot_name: string;
  region_id: number;
  region_name: string;
  created_at: string;
  updated_at?: string;
}

interface Region {
  region_id: number;
  region_name: string;
  depot_count: number;
  bus_count: number;
}

interface Depot {
  depot_id: number;
  depot_name: string;
  address: string;
  region_name: string;
  bus_count: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  recordsPerPage: number;
}

const Servicehistoryexplorer = () => {
  const [activeTab, setActiveTab] = useState<'services' | 'parts' | 'inspections'>('services');
  
  const [regions, setRegions] = useState<Region[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [partsRecords, setPartsRecords] = useState<PartsRecord[]>([]);
  const [inspectionRecords, setInspectionRecords] = useState<InspectionRecord[]>([]);
  
  const [servicePagination, setServicePagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    recordsPerPage: 20
  });

  const [partsPagination, setPartsPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    recordsPerPage: 20
  });

  const [inspectionPagination, setInspectionPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    recordsPerPage: 20
  });

  // Get current pagination based on active tab
  const currentPagination = activeTab === 'services' ? servicePagination : 
                           activeTab === 'parts' ? partsPagination : inspectionPagination;

  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedDepot, setSelectedDepot] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    status: 'all',
    serviceType: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecord | PartsRecord | InspectionRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Fetch regions and initial counts on component mount
  useEffect(() => {
    fetchRegions();
    fetchServiceCount();
    fetchPartsCount();
    fetchInspectionCount();
  }, []);

  // Fetch depots when region changes
  useEffect(() => {
    if (selectedRegion !== 'all') {
      fetchDepotsByRegion(selectedRegion);
    } else {
      setDepots([]);
      setSelectedDepot('all');
    }
  }, [selectedRegion]);

  // Fetch maintenance history when filters change
  useEffect(() => {
    if (activeTab === 'services') {
      fetchServiceHistory();
    } else if (activeTab === 'parts') {
      fetchPartsHistory();
    } else if (activeTab === 'inspections') {
      fetchInspectionHistory();
    }
  }, [selectedRegion, selectedDepot, filters, servicePagination.currentPage, partsPagination.currentPage, inspectionPagination.currentPage, activeTab]);

  const fetchRegions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/dgm-technical/regions');
      const result = await response.json();
      if (result.success) {
        setRegions(result.data);
      }
    } catch (err) {
      console.error('Error fetching regions:', err);
    }
  };

  const fetchDepotsByRegion = async (regionId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/dgm-technical/regions/${regionId}/depots`);
      const result = await response.json();
      if (result.success) {
        setDepots(result.data);
      }
    } catch (err) {
      console.error('Error fetching depots:', err);
    }
  };

  const fetchServiceCount = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '1',
        regionId: 'all',
        depotId: 'all',
        status: 'all',
        serviceType: '',
        startDate: '',
        endDate: ''
      });

      const response = await fetch(`http://localhost:5000/api/dgm-technical/service-history?${queryParams}`);
      const result = await response.json();
      
      if (result.success) {
        setServicePagination(prev => ({
          ...prev,
          totalRecords: result.data.pagination.totalRecords
        }));
      }
    } catch (err) {
      console.error('Error fetching service count:', err);
    }
  };

  const fetchPartsCount = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '1',
        regionId: 'all',
        depotId: 'all',
        search: ''
      });

      const response = await fetch(`http://localhost:5000/api/dgm-technical/parts-history?${queryParams}`);
      const result = await response.json();
      
      if (result.success) {
        setPartsPagination(prev => ({
          ...prev,
          totalRecords: result.pagination.totalRecords
        }));
      }
    } catch (err) {
      console.error('Error fetching parts count:', err);
    }
  };

  const fetchInspectionCount = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '1',
        regionId: 'all',
        depotId: 'all',
        status: 'all'
      });

      const response = await fetch(`http://localhost:5000/api/dgm-technical/inspection-history?${queryParams}`);
      const result = await response.json();
      
      if (result.success) {
        setInspectionPagination(prev => ({
          ...prev,
          totalRecords: result.pagination ? result.pagination.totalRecords : result.data.length
        }));
      }
    } catch (err) {
      console.error('Error fetching inspection count:', err);
    }
  };

  const fetchServiceHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        page: servicePagination.currentPage.toString(),
        limit: servicePagination.recordsPerPage.toString(),
        regionId: selectedRegion,
        depotId: selectedDepot,
        status: filters.status,
        serviceType: filters.serviceType,
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      const response = await fetch(`http://localhost:5000/api/dgm-technical/service-history?${queryParams}`);
      const result = await response.json();
      
      if (result.success) {
        setServiceRecords(result.data.records);
        setServicePagination({
          currentPage: result.data.pagination.currentPage,
          totalPages: result.data.pagination.totalPages,
          totalRecords: result.data.pagination.totalRecords,
          recordsPerPage: result.data.pagination.recordsPerPage
        });
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Error fetching service history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch service history');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartsHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        page: partsPagination.currentPage.toString(),
        limit: partsPagination.recordsPerPage.toString(),
        regionId: selectedRegion,
        depotId: selectedDepot,
        search: filters.search
      });

      const response = await fetch(`http://localhost:5000/api/dgm-technical/parts-history?${queryParams}`);
      const result = await response.json();
      
      if (result.success) {
        setPartsRecords(result.data);
        setPartsPagination({
          currentPage: result.pagination.currentPage,
          totalPages: result.pagination.totalPages,
          totalRecords: result.pagination.totalRecords,
          recordsPerPage: partsPagination.recordsPerPage
        });
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Error fetching parts history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch parts history');
    } finally {
      setLoading(false);
    }
  };

  const fetchInspectionHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        page: inspectionPagination.currentPage.toString(),
        limit: inspectionPagination.recordsPerPage.toString(),
        regionId: selectedRegion,
        depotId: selectedDepot,
        status: filters.status
      });

      const response = await fetch(`http://localhost:5000/api/dgm-technical/inspection-history?${queryParams}`);
      const result = await response.json();
      
      if (result.success) {
        setInspectionRecords(result.data);
        setInspectionPagination({
          currentPage: result.pagination ? result.pagination.currentPage : 1,
          totalPages: result.pagination ? result.pagination.totalPages : 1,
          totalRecords: result.pagination ? result.pagination.totalRecords : result.data.length,
          recordsPerPage: inspectionPagination.recordsPerPage
        });
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Error fetching inspection history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inspection history');
    } finally {
      setLoading(false);
    }
  };

  const handleRegionChange = (regionId: string) => {
    setSelectedRegion(regionId);
    setSelectedDepot('all');
    setServicePagination(prev => ({ ...prev, currentPage: 1 }));
    setPartsPagination(prev => ({ ...prev, currentPage: 1 }));
    setInspectionPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleDepotChange = (depotId: string) => {
    setSelectedDepot(depotId);
    setServicePagination(prev => ({ ...prev, currentPage: 1 }));
    setPartsPagination(prev => ({ ...prev, currentPage: 1 }));
    setInspectionPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setServicePagination(prev => ({ ...prev, currentPage: 1 }));
    setPartsPagination(prev => ({ ...prev, currentPage: 1 }));
    setInspectionPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (activeTab === 'services') {
      setServicePagination(prev => ({ ...prev, currentPage: newPage }));
    } else if (activeTab === 'parts') {
      setPartsPagination(prev => ({ ...prev, currentPage: newPage }));
    } else if (activeTab === 'inspections') {
      setInspectionPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleViewRecord = (record: ServiceRecord | PartsRecord | InspectionRecord) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const handleTabChange = (tab: 'services' | 'parts' | 'inspections') => {
    setActiveTab(tab);
    // Clear service-specific filters when switching to parts or inspections tab
    if (tab === 'parts') {
      setFilters(prev => ({
        ...prev,
        status: 'all',
        serviceType: ''
      }));
    } else if (tab === 'inspections') {
      setFilters(prev => ({
        ...prev,
        serviceType: '',
        search: ''
      }));
    }
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedRecord(null);
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'Pending': 'bg-gray-100 text-gray-800',
      'Due Today': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Overdue': 'bg-orange-100 text-orange-800',
      'Critical Overdue': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-500'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const filteredRecords = activeTab === 'services' 
    ? serviceRecords.filter(record => {
        return filters.search === '' || 
               record.registration_number.toLowerCase().includes(filters.search.toLowerCase()) ||
               record.service_type.toLowerCase().includes(filters.search.toLowerCase()) ||
               record.depot_name.toLowerCase().includes(filters.search.toLowerCase());
      })
    : activeTab === 'parts' 
    ? partsRecords.filter(record => {
        return filters.search === '' || 
               record.registration_number.toLowerCase().includes(filters.search.toLowerCase()) ||
               record.part_name.toLowerCase().includes(filters.search.toLowerCase()) ||
               record.depot_name.toLowerCase().includes(filters.search.toLowerCase());
      })
    : inspectionRecords.filter(record => {
        return filters.search === '' || 
               record.inspection_type.toLowerCase().includes(filters.search.toLowerCase()) ||
               record.depot_name.toLowerCase().includes(filters.search.toLowerCase());
      });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Maintenance History Explorer</h1>
        <p className="text-gray-600">Complete maintenance records across all categories - services, parts, and inspections</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => handleTabChange('services')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'services'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Service History
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {servicePagination.totalRecords}
              </span>
            </button>
            <button
              onClick={() => handleTabChange('parts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'parts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Parts Replacement
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {partsPagination.totalRecords}
              </span>
            </button>
            <button
              onClick={() => handleTabChange('inspections')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inspections'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Inspection History
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {inspectionPagination.totalRecords}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Region and Depot Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">Region</label>
            <select
              id="region"
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Regions</option>
              {regions.map((region) => (
                <option key={region.region_id} value={region.region_id}>
                  {region.region_name} ({region.depot_count} depots, {region.bus_count} buses)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="depot" className="block text-sm font-medium text-gray-700 mb-2">Depot</label>
            <select
              id="depot"
              value={selectedDepot}
              onChange={(e) => handleDepotChange(e.target.value)}
              disabled={selectedRegion === 'all'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="all">All Depots</option>
              {depots.map((depot) => (
                <option key={depot.depot_id} value={depot.depot_id}>
                  {depot.depot_name} ({depot.bus_count} buses)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                if (activeTab === 'services') {
                  fetchServiceHistory();
                } else if (activeTab === 'parts') {
                  fetchPartsHistory();
                } else if (activeTab === 'inspections') {
                  fetchInspectionHistory();
                }
              }}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              <HiRefresh className="w-4 h-4" />
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section - Only show for Service History and Inspections tabs */}
      {(activeTab === 'services' || activeTab === 'inspections') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div 
            className="p-4 border-b border-gray-200 flex justify-between items-center cursor-pointer"
            onClick={() => setShowFilters(!showFilters)}
          >
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <HiFilter className="w-5 h-5" />
              {activeTab === 'services' ? 'Service Filters' : 'Inspection Filters'}
            </h2>
            {showFilters ? (
              <HiChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <HiChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
          
          {showFilters && (
            <div className="p-4 flex flex-wrap gap-4 items-end">
              <div className="min-w-[180px]">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  {activeTab === 'services' ? (
                    <>
                      <option value="Pending">Pending</option>
                      <option value="Due Today">Due Today</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Critical Overdue">Critical Overdue</option>
                      <option value="Cancelled">Cancelled</option>
                    </>
                  ) : (
                    <>
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </>
                  )}
                </select>
              </div>
              
              {activeTab === 'services' && (
                <div className="min-w-[200px] flex-1">
                  <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                  <input
                    type="text"
                    id="serviceType"
                    name="serviceType"
                    value={filters.serviceType}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Filter by service type"
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ status: 'all', serviceType: '', startDate: '', endDate: '', search: '' })}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button 
                onClick={() => {
                  if (activeTab === 'services') {
                    fetchServiceHistory();
                  } else if (activeTab === 'parts') {
                    fetchPartsHistory();
                  } else if (activeTab === 'inspections') {
                    fetchInspectionHistory();
                  }
                }} 
                className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {activeTab === 'services' ? 'Service Records' : 
               activeTab === 'parts' ? 'Parts Replacement Records' : 'Inspection Records'}
            </h2>
            <p className="text-sm text-gray-500">
              {loading ? 'Loading...' : `${currentPagination.totalRecords} records found`}
            </p>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder={activeTab === 'services' 
                  ? "Search by bus, service type, or depot..." 
                  : activeTab === 'parts'
                  ? "Search by bus, part name, or depot..."
                  : "Search by inspection type or depot..."
                }
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {/* <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
              <HiDownload className="w-4 h-4" />
              Export
            </button> */}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {activeTab === 'inspections' ? 'Inspection Type' : 'Bus number'}
                </th>
                {activeTab === 'services' ? (
                  <>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </>
                ) : activeTab === 'parts' ? (
                  <>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Part Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                  </>
                ) : (
                  <>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Depot
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </>
                )}
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-500">
                        Loading {activeTab === 'services' ? 'service' : 
                                activeTab === 'parts' ? 'parts replacement' : 'inspection'} records...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length > 0 ? (
                activeTab === 'services' ? (
                  (filteredRecords as ServiceRecord[]).map((service) => (
                    <tr key={service.service_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{service.registration_number}</div>
                        <div className="text-sm text-gray-500">{service.model} ({service.year})</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {service.service_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(service.scheduled_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(service.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewRecord(service)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View details"
                        >
                          <HiEye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : activeTab === 'parts' ? (
                  (filteredRecords as PartsRecord[]).map((part) => (
                    <tr key={part.usage_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{part.registration_number}</div>
                        <div className="text-sm text-gray-500">{part.model} ({part.year})</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {part.part_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(part.usage_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {part.quantity_used} {part.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewRecord(part)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View details"
                        >
                          <HiEye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  (filteredRecords as InspectionRecord[]).map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{inspection.inspection_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inspection.depot_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(inspection.date).toLocaleDateString()} • {inspection.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(inspection.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewRecord(inspection)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View details"
                        >
                          <HiEye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    No {activeTab === 'services' ? 'service' : 
                       activeTab === 'parts' ? 'parts replacement' : 'inspection'} records found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && currentPagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-700">
              Showing page {currentPagination.currentPage} of {currentPagination.totalPages} 
              ({currentPagination.totalRecords} total records)
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => handlePageChange(currentPagination.currentPage - 1)}
                disabled={currentPagination.currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPagination.currentPage} of {currentPagination.totalPages}
              </span>
              <button 
                onClick={() => handlePageChange(currentPagination.currentPage + 1)}
                disabled={currentPagination.currentPage === currentPagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Record Modal */}
      {isViewModalOpen && selectedRecord && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {activeTab === 'services' ? 'Service Record Details' : 
                     activeTab === 'parts' ? 'Parts Replacement Details' : 'Inspection Details'}
                  </h2>
                  {/* <p className="text-gray-600">Service ID: #{selectedRecord.service_id}</p> */}
                </div>
                <button 
                  onClick={closeViewModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <HiX className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Bus Information</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {activeTab === 'inspections' ? 'Inspection Type' : 'Registration Number'}
                      </p>
                      <p className="text-gray-800 font-medium">
                        {activeTab === 'inspections' 
                          ? (selectedRecord as InspectionRecord).inspection_type 
                          : (selectedRecord as ServiceRecord | PartsRecord).registration_number}
                      </p>
                    </div>
                    {'model' in selectedRecord && (
                      <div>
                        <p className="text-sm text-gray-500">Model & Year</p>
                        <p className="text-gray-800">{selectedRecord.model} ({selectedRecord.year})</p>
                      </div>
                    )}
                    {'mileage' in selectedRecord && (
                      <div>
                        <p className="text-sm text-gray-500">Mileage</p>
                        <p className="text-gray-800">{selectedRecord.mileage?.toLocaleString() || 'N/A'} km</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Location Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Region</p>
                      <p className="text-gray-800">{selectedRecord.region_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Depot</p>
                      <p className="text-gray-800">{selectedRecord.depot_name}</p>
                    </div>
                    
                  </div>
                </div>

                <div>
                  {activeTab === 'services' && 'service_type' in selectedRecord ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Details</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Service Type</p>
                          <p className="text-gray-800">{selectedRecord.service_type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <div className="mt-1">{getStatusBadge(selectedRecord.status)}</div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Scheduled Date</p>
                          <p className="text-gray-800">{new Date(selectedRecord.scheduled_date).toLocaleDateString()}</p>
                        </div>
                        {selectedRecord.completed_date && (
                          <div>
                            <p className="text-sm text-gray-500">Completed Date</p>
                            <p className="text-gray-800">{new Date(selectedRecord.completed_date).toLocaleDateString()}</p>
                          </div>
                        )}
                        {selectedRecord.cancelled_date && (
                          <div>
                            <p className="text-sm text-gray-500">Cancelled Date</p>
                            <p className="text-gray-800">{new Date(selectedRecord.cancelled_date).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : activeTab === 'parts' && 'part_name' in selectedRecord ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Parts Details</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Part Name</p>
                          <p className="text-gray-800">{selectedRecord.part_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Part ID</p>
                          <p className="text-gray-800">{selectedRecord.part_id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Quantity Used</p>
                          <p className="text-gray-800">{selectedRecord.quantity_used} {selectedRecord.unit}</p>
                        </div>
                       
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Record Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    {'created_at' in selectedRecord && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          {activeTab === 'services' ? 'Service Record Created:' : 'Parts Usage Recorded:'}
                        </span>
                        <span className="text-gray-800">{new Date(selectedRecord.created_at).toLocaleString()}</span>
                      </div>
                    )}
                    {'updated_at' in selectedRecord && selectedRecord.updated_at && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Last Modified:</span>
                        <span className="text-gray-800">{new Date(selectedRecord.updated_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeViewModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Servicehistoryexplorer;