import React, { useState } from 'react';
import { FaSearch, FaChevronDown, FaEye, FaTimes } from 'react-icons/fa';

interface InvestigationLog {
  logId: string;
  depot: string;
  bus: number;
  issue: string;
  assignedTo: string;
  status: 'Resolved' | 'Pending' | 'In Progress' | 'Closed';
  closedOn: string;
}

const initialLogs: InvestigationLog[] = [
  {
    logId: 'INV-101',
    depot: 'Kandy',
    bus: 64,
    issue: 'Battery issue',
    assignedTo: 'Eng. Perera',
    status: 'Resolved',
    closedOn: '2025-07-04'
  },
  {
    logId: 'INV-100',
    depot: 'Colombo',
    bus: 42,
    issue: 'Suspension problem',
    assignedTo: 'Eng. Silva',
    status: 'Resolved',
    closedOn: '2025-07-02'
  },
  {
    logId: 'INV-099',
    depot: 'Galle',
    bus: 15,
    issue: 'Electrical fault',
    assignedTo: 'Eng. Fernando',
    status: 'Resolved',
    closedOn: '2025-06-28'
  },
  {
    logId: 'INV-098',
    depot: 'Matara',
    bus: 33,
    issue: 'Cooling system',
    assignedTo: 'Eng. Perera',
    status: 'Resolved',
    closedOn: '2025-06-25'
  },
  {
    logId: 'INV-097',
    depot: 'Kandy',
    bus: 21,
    issue: 'Transmission',
    assignedTo: 'Eng. Silva',
    status: 'Resolved',
    closedOn: '2025-06-20'
  }
];

const getStatusBadge = (status: string): string => {
  const base = 'px-2 py-1 rounded-full text-xs font-medium';
  switch (status) {
    case 'Resolved':
      return `${base} bg-green-100 text-green-700`;
    case 'Pending':
      return `${base} bg-yellow-100 text-yellow-700`;
    case 'In Progress':
      return `${base} bg-blue-100 text-blue-700`;
    case 'Closed':
      return `${base} bg-gray-100 text-gray-700`;
    default:
      return `${base} bg-gray-100 text-gray-700`;
  }
};

const Investigationlogs: React.FC = () => {
  const [logs, setLogs] = useState<InvestigationLog[]>(initialLogs);
  const [selectedDepot, setSelectedDepot] = useState<string>('All Depots');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<InvestigationLog | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Get unique depots and statuses for filters
  const uniqueDepots = Array.from(new Set(logs.map(log => log.depot)));
  const uniqueStatuses = Array.from(new Set(logs.map(log => log.status)));

  // Filter logs based on search term, selected depot, and selected status
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.logId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.depot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepot = selectedDepot === 'All Depots' || log.depot === selectedDepot;
    const matchesStatus = selectedStatus === 'All Statuses' || log.status === selectedStatus;
    
    return matchesSearch && matchesDepot && matchesStatus;
  });

  const handleViewClick = (log: InvestigationLog) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLog(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h1 className="text-xl font-semibold text-gray-800">Investigation Logs</h1>
          
          <div className="flex items-center space-x-4">
            {/* Depot Filter */}
            <div className="relative">
              <select
                value={selectedDepot}
                onChange={(e) => setSelectedDepot(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All Depots">All Depots</option>
                {uniqueDepots.map(depot => (
                  <option key={depot} value={depot}>{depot}</option>
                ))}
              </select>
              <FaChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All Statuses">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
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
                  Log ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Depot
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Closed On
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.logId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{log.logId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.depot}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.bus}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.issue}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.assignedTo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(log.status)}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.closedOn}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewClick(log)}
                      className="inline-flex items-center px-3 py-1 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FaEye className="w-3 h-3 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* No results message */}
          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No investigation logs found matching your search criteria.
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex space-x-6">
              <span>
                Resolved: <span className="font-medium text-green-600">
                  {filteredLogs.filter(log => log.status === 'Resolved').length}
                </span>
              </span>
              <span>
                Pending: <span className="font-medium text-yellow-600">
                  {filteredLogs.filter(log => log.status === 'Pending').length}
                </span>
              </span>
              <span>
                In Progress: <span className="font-medium text-blue-600">
                  {filteredLogs.filter(log => log.status === 'In Progress').length}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Investigation Log: {selectedLog.logId}
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
                  <span className="text-gray-600">Depot:</span>
                  <span className="font-medium">{selectedLog.depot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bus Number:</span>
                  <span className="font-medium">{selectedLog.bus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Issue:</span>
                  <span className="font-medium">{selectedLog.issue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Assigned To:</span>
                  <span className="font-medium">{selectedLog.assignedTo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={getStatusBadge(selectedLog.status)}>
                    {selectedLog.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Closed On:</span>
                  <span className="font-medium">{selectedLog.closedOn}</span>
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

export default Investigationlogs;