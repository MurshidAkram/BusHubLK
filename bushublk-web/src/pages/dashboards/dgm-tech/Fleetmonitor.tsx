import { useState, useEffect } from 'react';
import { HiEye, HiFilter, HiSearch, HiX } from 'react-icons/hi';

interface Bus {
  bus_id: number;
  registration_number: string;
  class: string;
  manufacturer: string;
  model: string;
  year: number;
  mileage: number;
  status: 'Active' | 'Maintenance' | 'Out of Service' | 'In Service' | 'Retired';
  purchase_date: string;
  depot_name: string;
  region_name: string;
  created_at?: string;
  updated_at?: string;
}

interface Depot {
  depot_id: number;
  depot_name: string;
  address: string;
  contact_phone: string;
  bus_count: number;
  maintenance_count: number;
  active_count: number;
  out_of_service_count: number;
}

interface RegionData {
  region_id: number;
  region_name: string;
  depots: Depot[];
  total_buses: number;
  total_maintenance: number;
  total_active: number;
  total_out_of_service: number;
}

interface RegionsData {
  [regionName: string]: RegionData;
}

interface BusResponse {
  success: boolean;
  message: string;
  data: {
    buses: Bus[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_buses: number;
      per_page: number;
    };
  };
}

interface DepotsResponse {
  success: boolean;
  message: string;
  data: RegionsData;
}

const FleetMonitor = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedDepot, setSelectedDepot] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [busData, setBusData] = useState<Bus[]>([]);
  const [regionsData, setRegionsData] = useState<RegionsData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    fetchRegionsAndDepots();
  }, []);

  useEffect(() => {
    if (selectedDepot) {
      fetchBusData();
    }
  }, [selectedDepot]);

  const fetchRegionsAndDepots = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/dgm-technical/depots');
      const result: DepotsResponse = await response.json();
      
      if (result.success) {
        setRegionsData(result.data);
        // Set first region and depot as default
        const firstRegion = Object.keys(result.data)[0];
        if (firstRegion && result.data[firstRegion].depots.length > 0) {
          setSelectedRegion(firstRegion);
          setSelectedDepot(result.data[firstRegion].depots[0].depot_name);
        }
      } else {
        setError(result.message || 'Failed to fetch regions and depots');
      }
    } catch (err) {
      setError('Failed to fetch regions and depots');
      console.error('Error fetching regions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusData = async () => {
    if (!selectedDepot) return;
    
    try {
      // Find depot_id from selectedDepot name
      let depotId = null;
      for (const region of Object.values(regionsData)) {
        const depot = region.depots.find(d => d.depot_name === selectedDepot);
        if (depot) {
          depotId = depot.depot_id;
          break;
        }
      }

      if (!depotId) return;

      const response = await fetch(`http://localhost:5000/api/dgm-technical/depots/${depotId}/buses`);
      const result: BusResponse = await response.json();
      
      if (result.success) {
        setBusData(result.data.buses);
      } else {
        setError(result.message || 'Failed to fetch bus data');
      }
    } catch (err) {
      setError('Failed to fetch bus data');
      console.error('Error fetching buses:', err);
    }
  };

  // Handle region selection
  const handleRegionClick = (regionName: string) => {
    setSelectedRegion(regionName);
    // Select the first depot in the region by default
    if (regionsData[regionName]?.depots.length > 0) {
      setSelectedDepot(regionsData[regionName].depots[0].depot_name);
    }
  };

  // Handle depot selection
  const handleDepotClick = (depotName: string) => {
    setSelectedDepot(depotName);
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
      case 'In Service':
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800';
      case 'Maintenance':
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800';
      case 'Out of Service':
      case 'Retired':
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800';
      default:
        return 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800';
    }
  };

  // Handle viewing bus details
  const handleViewBus = (bus: Bus) => {
    setSelectedBus(bus);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBus(null);
  };

  // Filter buses based on search term and status
  const filteredBuses = busData.filter(bus => {
    const matchesSearch = bus.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bus.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bus.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || bus.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading fleet data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchRegionsAndDepots}
            className="mt-4 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">SLTB Fleet Monitoring Dashboard</h1>
        <p className="text-gray-600">Monitor and manage SLTB fleet across all regions</p>
      </div>

      <div className="space-y-6">
        {/* Regions List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Regions</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(regionsData).map(([regionName, regionData]) => (
                <div
                  key={regionName}
                  className={`p-4 rounded-lg cursor-pointer transition-colors duration-200 border ${
                    selectedRegion === regionName
                      ? 'bg-orange-100 border-orange-300 text-orange-800'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => handleRegionClick(regionName)}
                >
                  <div className="font-medium text-lg">{regionName}</div>
                  <div className="text-sm text-gray-600 mt-2">
                    <div>{regionData.depots.length} Depots</div>
                    <div>{regionData.total_buses} Buses</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Depots List - Only show when region is selected */}
        {selectedRegion && regionsData[selectedRegion] && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedRegion} Region - Depots
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regionsData[selectedRegion].depots.map((depot) => (
                  <div
                    key={depot.depot_id}
                    className={`p-4 rounded-lg cursor-pointer transition-colors duration-200 border ${
                      selectedDepot === depot.depot_name
                        ? 'bg-orange-100 border-orange-300 text-orange-800'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => handleDepotClick(depot.depot_name)}
                  >
                    <div className="font-medium text-base">{depot.depot_name}</div>
                    <div className="text-sm text-gray-500 mt-1">{depot.address}</div>
                    <div className="flex justify-between items-center mt-3 text-sm">
                      <span className="text-gray-600">{depot.bus_count} buses</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bus Details Section - Only show when depot is selected */}
        {selectedDepot && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {selectedDepot} Fleet
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredBuses.length} buses found
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Search */}
                  <div className="relative">
                    <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search buses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm w-48"
                    />
                  </div>
                  
                  {/* Filter Button */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <HiFilter className="h-4 w-4" />
                    <span>Filter</span>
                  </button>
                </div>
              </div>
              
              {/* Filters */}
              {showFilters && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      >
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="In Service">In Service</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Out of Service">Out of Service</option>
                        <option value="Retired">Retired</option>
                      </select>
                    </div>
                    
                    <button
                      onClick={() => {
                        setStatusFilter('');
                        setSearchTerm('');
                      }}
                      className="mt-6 px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {filteredBuses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Model
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mileage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBuses.map((bus) => (
                      <tr key={bus.bus_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {bus.registration_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{bus.model}</div>
                         
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(bus.status)}>
                            {bus.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{bus.mileage?.toLocaleString()} km</div>
                         
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewBus(bus)}
                            className="text-orange-600 hover:text-orange-900 flex items-center space-x-1"
                          >
                            <HiEye className="h-4 w-4" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No buses found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bus Detail Modal */}
      {isModalOpen && selectedBus && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bus Details</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Registration Number</label>
                <p className="mt-1 text-sm text-gray-900">{selectedBus.registration_number}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`mt-1 ${getStatusBadge(selectedBus.status)}`}>
                  {selectedBus.status}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <p className="mt-1 text-sm text-gray-900">{selectedBus.model}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                <p className="mt-1 text-sm text-gray-900">{selectedBus.manufacturer}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <p className="mt-1 text-sm text-gray-900">{selectedBus.year}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Class</label>
                <p className="mt-1 text-sm text-gray-900">{selectedBus.class}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Mileage</label>
                <p className="mt-1 text-sm text-gray-900">{selectedBus.mileage?.toLocaleString()} km</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedBus.purchase_date).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Depot</label>
                <p className="mt-1 text-sm text-gray-900">{selectedBus.depot_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Region</label>
                <p className="mt-1 text-sm text-gray-900">{selectedBus.region_name}</p>
              </div>

              {selectedBus.created_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedBus.created_at).toLocaleString()}
                  </p>
                </div>
              )}

              {selectedBus.updated_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedBus.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetMonitor;
