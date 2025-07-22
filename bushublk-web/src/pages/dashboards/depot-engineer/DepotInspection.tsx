// File: DepotInspections.jsx
import React, { useState } from 'react';
import { 
  FaCalendarAlt,
  FaShieldAlt,
  FaFileAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes,
  FaChevronUp,
  FaChevronDown,
  FaInfoCircle,
  FaSearch
} from 'react-icons/fa';

const DepotInspections = () => {
  // Inspection data
  const [inspections, setInspections] = useState([
    {
      id: 'RTO-INS-2023-101',
      depot: 'North Depot',
      type: 'Quarterly Fleet Technical',
      scheduledDate: '2023-07-25',
      dueDate: '2023-07-30',
      status: 'Pending',
      priority: 'High',
      checklist: [
        'Brake system efficiency',
        'Emission levels',
        'Lighting systems',
        'Safety equipment',
        'Vehicle documentation'
      ],
      rtoReference: 'RTO-CIRCULAR-2023-05'
    },
    {
      id: 'RTO-INS-2023-102',
      depot: 'Central Depot',
      type: 'Bi-Annual Comprehensive',
      scheduledDate: '2023-08-15',
      dueDate: '2023-08-20',
      status: 'Pending',
      priority: 'Critical',
      checklist: [
        'Structural integrity',
        'Engine condition',
        'Transmission system',
        'Electrical systems',
        'Fuel system'
      ],
      rtoReference: 'RTO-MEMO-2023-12'
    }
  ]);

  // UI state
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentInspection, setCurrentInspection] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterType, setFilterType] = useState('all');

  // Sorting function
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filtering function
  const filteredInspections = inspections.filter(inspection => {
    return filterType === 'all' || inspection.type.includes(filterType);
  });

  // Sorted items
  const sortedInspections = [...filteredInspections].sort((a, b) => {
    if (sortConfig.key) {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });

  const showDetails = (inspection) => {
    setCurrentInspection(inspection);
    setDetailVisible(true);
  };

  const startPreparation = (id) => {
    setInspections(inspections.map(item => 
      item.id === id ? {...item, status: 'In Preparation'} : item
    ));
    setDetailVisible(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'In Preparation': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <FaCalendarAlt className="mr-2" /> Depot Inspections
        </h1>
       
      </div>

      {/* Alert */}
      <div className="bg-blue-100 text-blue-800 p-3 rounded-md mb-6 flex items-center">
        <FaInfoCircle className="mr-2" />
        These are periodic technical inspections mandated by Regional Transport Office
      </div>

      {/* Filters */}
      <div className="bg-white rounded-md shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search inspections..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Annual">Annual</option>
            <option value="Comprehensive">Comprehensive</option>
          </select>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('id')}
                >
                  <div className="flex items-center">
                    Inspection ID
                    {sortConfig.key === 'id' && (
                      sortConfig.direction === 'asc' ? <FaChevronUp className="ml-1" /> : <FaChevronDown className="ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('scheduledDate')}
                >
                  <div className="flex items-center">
                    Scheduled Date
                    {sortConfig.key === 'scheduledDate' && (
                      sortConfig.direction === 'asc' ? <FaChevronUp className="ml-1" /> : <FaChevronDown className="ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedInspections.map((inspection) => (
                <tr key={inspection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {inspection.id}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaShieldAlt className="mr-2 text-blue-500" />
                      {inspection.type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {inspection.scheduledDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={new Date(inspection.dueDate) < new Date() ? 'text-red-600 font-bold' : ''}>
                      {inspection.dueDate}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(inspection.status)}`}>
                      {inspection.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => showDetails(inspection)}
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <FaFileAlt className="mr-1" /> Prepare
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection Detail Modal */}
      {detailVisible && currentInspection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">
                  Inspection Preparation - {currentInspection.id}
                </h2>
                <button 
                  onClick={() => setDetailVisible(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">Inspection Details</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Type:</span> {currentInspection.type}</p>
                    <p><span className="font-medium">Depot:</span> {currentInspection.depot}</p>
                    <p><span className="font-medium">Reference:</span> {currentInspection.rtoReference}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Timing & Priority</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Scheduled:</span> {currentInspection.scheduledDate}</p>
                    <p>
                      <span className="font-medium">Due Date:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        new Date(currentInspection.dueDate) < new Date() ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {currentInspection.dueDate}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Priority:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getPriorityColor(currentInspection.priority)}`}>
                        {currentInspection.priority}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3 pb-2 border-b">Mandatory Checklist</h3>
                <ul className="space-y-2">
                  {currentInspection.checklist.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <FaExclamationTriangle className="mt-1 mr-2 text-yellow-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3 pb-2 border-b">Preparation Notes</h3>
                <div className="bg-gray-50 p-4 rounded-md border border-dashed border-gray-300">
                  <p className="mb-2">Document all preparation activities for this inspection:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Ensure all vehicles are available on inspection day</li>
                    <li>Prepare maintenance records for review</li>
                    <li>Conduct pre-inspection checks</li>
                    <li>Coordinate with inspection officials</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setDetailVisible(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => startPreparation(currentInspection.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <FaCheckCircle className="mr-2" /> Start Preparation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepotInspections;