import { useState } from 'react';
import { HiEye, HiPencil, HiFilter, HiSearch, HiChevronDown, HiChevronUp, HiX } from 'react-icons/hi';

interface ServiceRecord {
  serviceId: string;
  busnum: string;
  serviceDate: string;
  serviceType: string;
  dataCharged: string;
  cost: number;
}

const Servicehistoryexplorer = () => {
  const [filters, setFilters] = useState({
    busnum: '',
    serviceType: '',
    startDate: '',
    endDate: '',
    minCost: '',
    maxCost: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Updated sample data with two-digit bus IDs and no taxization
  const serviceData: ServiceRecord[] = [
    { serviceId: 'SRV-001', busnum: '01', serviceDate: '15 Jan 2023', serviceType: 'Oil Change', dataCharged: 'Synthetic oil, filter replacement', cost: 12000 },
    { serviceId: 'SRV-002', busnum: '02', serviceDate: '22 Feb 2023', serviceType: 'Brake Service', dataCharged: 'Brake pads, fluid replacement', cost: 25000 },
    { serviceId: 'SRV-003', busnum: '01', serviceDate: '10 Mar 2023', serviceType: 'Tire Rotation', dataCharged: 'Tire rotation, balancing', cost: 8000 },
    { serviceId: 'SRV-004', busnum: '03', serviceDate: '05 Apr 2023', serviceType: 'Engine Tune-up', dataCharged: 'Spark plugs, air filter', cost: 18000 }
   
  ];

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredData = serviceData.filter(service => {
    return (
      (filters.busnum === '' || service.busnum.includes(filters.busnum)) &&
      (filters.serviceType === '' || service.serviceType.toLowerCase().includes(filters.serviceType.toLowerCase())) &&
      (filters.startDate === '' || new Date(service.serviceDate) >= new Date(filters.startDate)) &&
      (filters.endDate === '' || new Date(service.serviceDate) <= new Date(filters.endDate)) &&
      (filters.minCost === '' || service.cost >= parseInt(filters.minCost || '0')) &&
      (filters.maxCost === '' || service.cost <= parseInt(filters.maxCost || '0'))
    );
  });

  const serviceTypes = [...new Set(serviceData.map(item => item.serviceType))];

  const handleViewRecord = (record: ServiceRecord) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedRecord(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Service History Records</h1>
        <p className="text-gray-600">View and manage service history for all buses</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <div 
          className="p-4 border-b border-gray-200 flex justify-between items-center cursor-pointer"
          onClick={() => setShowFilters(!showFilters)}
        >
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <HiFilter className="w-5 h-5" />
            Filters
          </h2>
          {showFilters ? (
            <HiChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <HiChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
        
        {showFilters && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="busId" className="block text-sm font-medium text-gray-700 mb-1">Bus ID</label>
              <input
                type="text"
                id="busId"
                name="busId"
                value={filters.busnum}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Filter by Bus ID"
              />
            </div>
            
            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <select
                id="serviceType"
                name="serviceType"
                value={filters.serviceType}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Service Types</option>
                {serviceTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="minCost" className="block text-sm font-medium text-gray-700 mb-1">Min Cost (£)</label>
              <input
                type="number"
                id="minCost"
                name="minCost"
                value={filters.minCost}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Minimum cost"
              />
            </div>
            
            <div>
              <label htmlFor="maxCost" className="block text-sm font-medium text-gray-700 mb-1">Max Cost (£)</label>
              <input
                type="number"
                id="maxCost"
                name="maxCost"
                value={filters.maxCost}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Maximum cost"
              />
            </div>
          </div>
        )}
      </div>

      {/* Service History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Service Records</h2>
            <p className="text-sm text-gray-500">{filteredData.length} records found</p>
          </div>
          
          <div className="relative w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search records..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bus ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length > 0 ? (
                filteredData.map((service, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {service.serviceId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.busnum}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.serviceDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.serviceType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.dataCharged}
                    </td>
                   
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewRecord(service)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View details"
                        >
                          <HiEye className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No service records found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <span className="text-sm text-gray-700">
            Showing {Math.min(filteredData.length, 8)} of {filteredData.length} records
          </span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View Record Modal */}
      {isViewModalOpen && selectedRecord && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Service Record Details</h2>
                  <p className="text-gray-600">{selectedRecord.serviceId}</p>
                </div>
                <button 
                  onClick={closeViewModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <HiX className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Bus ID</p>
                      <p className="text-gray-800">{selectedRecord.busnum}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Service Date</p>
                      <p className="text-gray-800">{selectedRecord.serviceDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Service Type</p>
                      <p className="text-gray-800">{selectedRecord.serviceType}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Cost</p>
                      <p className="text-gray-800">£{selectedRecord.cost.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800">
                    <span className="font-medium">Data Charged:</span> {selectedRecord.dataCharged}
                  </p>
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