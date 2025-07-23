import React, { useState } from 'react';
import { FaSearch, FaEye, FaChevronDown, FaTimes } from 'react-icons/fa';

interface DepotData {
  depot: string;
  Active: number;
  underRepair: number;
  breakdown: number;
  lastInspection: string;
}

const initialData: DepotData[] = [
  {
    depot: 'Galle',
    Active: 35,
    underRepair: 2,
    breakdown: 1,
    lastInspection: '2025-07-01'
  },
  {
    depot: 'Kandy',
    Active: 40,
    underRepair: 0,
    breakdown: 3,
    lastInspection: '2025-07-03'
  },
  {
    depot: 'Colombo',
    Active: 52,
    underRepair: 5,
    breakdown: 2,
    lastInspection: '2025-06-28'
  },
  {
    depot: 'Matara',
    Active: 28,
    underRepair: 3,
    breakdown: 0,
    lastInspection: '2025-06-30'
  }
];

const Regionservicemonitor: React.FC = () => {
  const [data, setData] = useState<DepotData[]>(initialData);
  const [selectedDepot, setSelectedDepot] = useState<string>('All Depots');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDetail, setSelectedDetail] = useState<DepotData | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Filter data based on search term and selected depot
  const filteredData = data.filter(item => {
    const matchesSearch = item.depot.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepot = selectedDepot === 'All Depots' || item.depot === selectedDepot;
    return matchesSearch && matchesDepot;
  });

  const handleDetailsClick = (depot: DepotData) => {
    setSelectedDetail(depot);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDetail(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h1 className="text-xl font-semibold text-gray-800">Service status by Depot</h1>
          
          <div className="flex items-center space-x-4">
            {/* Depot Filter */}
            <div className="relative">
              <select
                value={selectedDepot}
                onChange={(e) => setSelectedDepot(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All Depots">All Depots</option>
                {data.map(item => (
                  <option key={item.depot} value={item.depot}>{item.depot}</option>
                ))}
              </select>
              <FaChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Depot
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Under Repair
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Breakdown
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Inspection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.depot} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                      {item.depot}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.Active}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.underRepair}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.breakdown > 0 ? (
                        <span className="text-red-600 font-medium">{item.breakdown}</span>
                      ) : (
                        <span className="text-gray-900">{item.breakdown}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.lastInspection}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDetailsClick(item)}
                      className="inline-flex items-center px-3 py-1 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FaEye className="w-3 h-3 mr-1" />
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* No results message */}
          {filteredData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No depots found matching your search criteria.
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex space-x-6">
              <span>
                Total Working: <span className="font-medium text-green-600">
                  {filteredData.reduce((sum, item) => sum + item.Active, 0)}
                </span>
              </span>
              <span>
                Total Under Repair: <span className="font-medium text-yellow-600">
                  {filteredData.reduce((sum, item) => sum + item.underRepair, 0)}
                </span>
              </span>
              <span>
                Total Breakdown: <span className="font-medium text-red-600">
                  {filteredData.reduce((sum, item) => sum + item.breakdown, 0)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedDetail.depot} Depot Details
              </h3>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Working Vehicles:</span>
                  <span className="font-medium">{selectedDetail.Active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Under Repair:</span>
                  <span className="font-medium text-yellow-600">{selectedDetail.underRepair}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Breakdown:</span>
                  <span className="font-medium text-red-600">{selectedDetail.breakdown}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Inspection:</span>
                  <span className="font-medium">{selectedDetail.lastInspection}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Vehicles:</span>
                  <span className="font-medium text-blue-600">
                    {selectedDetail.Active + selectedDetail.underRepair + selectedDetail.breakdown}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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

export default Regionservicemonitor;