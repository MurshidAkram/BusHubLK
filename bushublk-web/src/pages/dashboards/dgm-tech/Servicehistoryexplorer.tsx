import { useState } from 'react';
import { HiEye, HiPencil, HiFilter, HiSearch, HiChevronDown, HiChevronUp } from 'react-icons/hi';

interface ServiceRecord {
  serviceId: string;
  busId: string;
  serviceDate: string;
  serviceType: string;
  dataCharged: string;
  cost: number;
  taxization: string;
}

const Servicehistoryexplorer = () => {
  const [filters, setFilters] = useState({
    busId: '',
    serviceType: '',
    startDate: '',
    endDate: '',
    minCost: '',
    maxCost: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  // Sample data with TypeScript interface
  const serviceData: ServiceRecord[] = [
    { serviceId: 'INC 2021-2017', busId: 'R21-0015', serviceDate: '19 May 2023', serviceType: 'Standard Information', dataCharged: 'Offline Air Star', cost: 10000, taxization: 'Main Event' },
    { serviceId: 'INC 2021-2017', busId: 'R21-0015', serviceDate: '15 July 2023', serviceType: 'Installation Repair', dataCharged: 'Asteroids library', cost: 30750, taxization: 'Water Supply' },
    { serviceId: 'INC 2021-2017', busId: 'R21-0015', serviceDate: '22 May 2023', serviceType: 'AC Service', dataCharged: 'Compenses, designers', cost: 10500, taxization: 'Anti-Drones' },
    { serviceId: 'INC 2021-2017', busId: 'R21-0015', serviceDate: '25 May 2023', serviceType: 'Transmission Overhaul', dataCharged: 'Quick price, data oil', cost: 40000, taxization: 'Equity Final' },
    { serviceId: 'INC 2021-2017', busId: 'R21-0015', serviceDate: '11 May 2023', serviceType: 'Smart Service', dataCharged: 'Extra parts, letters', cost: 10000, taxization: 'Maintenance All' }
  ];

  // Typed event handler
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fixed filter logic with proper parentheses
  const filteredData = serviceData.filter(service => {
    return (
      (filters.busId === '' || service.busId.includes(filters.busId)) &&
      (filters.serviceType === '' || service.serviceType.toLowerCase().includes(filters.serviceType.toLowerCase())) &&
      (filters.startDate === '' || new Date(service.serviceDate) >= new Date(filters.startDate)) &&
      (filters.endDate === '' || new Date(service.serviceDate) <= new Date(filters.endDate)) &&
      (filters.minCost === '' || service.cost >= parseInt(filters.minCost || '0')) &&
      (filters.maxCost === '' || service.cost <= parseInt(filters.maxCost || '0'))
    );
  });

  const serviceTypes = [...new Set(serviceData.map(item => item.serviceType))];

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
                value={filters.busId}
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
                {serviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
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
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
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
                placeholder="Minimum"
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
                placeholder="Maximum"
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
                  Data Charged
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost (£)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taxization
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
                      {service.busId}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.cost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.taxization}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View details"
                        >
                          <HiEye className="w-5 h-5" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Edit"
                        >
                          <HiPencil className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
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
            Primary 1-5 of 12 weeks
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
    </div>
  );
};

export default Servicehistoryexplorer;