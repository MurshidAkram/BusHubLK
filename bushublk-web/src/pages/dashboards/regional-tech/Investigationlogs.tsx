import React, { useState } from 'react';
import { 
  FaSearch, FaChevronDown, FaEye, FaTimes, FaFileAlt, 
  FaTools, FaUserCog, FaCalendarCheck, FaClipboardCheck 
} from 'react-icons/fa';

interface InvestigationLog {
  logId: string;
  depot: string;
  bus: number;
  issue: string;
  assignedTo: string;
  status: 'Resolved' | 'Pending' | 'In Progress' | 'Closed' | 'Reopened';
  closedOn: string;
  openedOn: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  investigationDetails?: string;
  rootCause?: string;
  correctiveActions?: string[];
  preventiveActions?: string[];
  attachments?: { name: string; url: string; type: string }[];
  timeSpent?: string;
  partsReplaced?: { part: string; quantity: number }[];
}

const initialLogs: InvestigationLog[] = [
  {
    logId: 'INV-101',
    depot: 'Kandy',
    bus: 64,
    issue: 'Battery failure',
    assignedTo: 'Eng. Perera',
    status: 'Resolved',
    priority: 'High',
    openedOn: '2025-07-01',
    closedOn: '2025-07-04',
    investigationDetails: 'Complete battery system diagnostics revealed corroded terminals and depleted cells',
    rootCause: 'Battery terminal corrosion due to improper sealing',
    correctiveActions: [
      'Replaced battery terminals',
      'Installed new battery pack',
      'Applied anti-corrosion coating'
    ],
    preventiveActions: [
      'Scheduled quarterly battery inspections',
      'Added terminal maintenance to PM checklist'
    ],
    timeSpent: '3.5 hours',
    partsReplaced: [
      { part: 'Battery Pack (12V 100Ah)', quantity: 1 },
      { part: 'Terminal Connectors', quantity: 2 }
    ],
    attachments: [
      { name: 'battery_photo.jpg', url: '#', type: 'image' },
      { name: 'diagnostic_report.pdf', url: '#', type: 'document' }
    ]
  },
  // ... other log entries ...
];

const getStatusBadge = (status: string): string => {
  const base = 'px-2 py-1 rounded-full text-xs font-medium';
  switch (status) {
    case 'Resolved': return `${base} bg-green-100 text-green-700`;
    case 'Pending': return `${base} bg-yellow-100 text-yellow-700`;
    case 'In Progress': return `${base} bg-blue-100 text-blue-700`;
    case 'Closed': return `${base} bg-gray-100 text-gray-700`;
    case 'Reopened': return `${base} bg-purple-100 text-purple-700`;
    default: return `${base} bg-gray-100 text-gray-700`;
  }
};

const getPriorityBadge = (priority: string): string => {
  const base = 'px-2 py-1 rounded-full text-xs font-medium';
  switch (priority) {
    case 'Critical': return `${base} bg-red-100 text-red-700`;
    case 'High': return `${base} bg-orange-100 text-orange-700`;
    case 'Medium': return `${base} bg-yellow-100 text-yellow-700`;
    case 'Low': return `${base} bg-gray-100 text-gray-700`;
    default: return `${base} bg-gray-100 text-gray-700`;
  }
};

const InvestigationLogs: React.FC = () => {
  const [logs] = useState<InvestigationLog[]>(initialLogs);
  const [selectedDepot, setSelectedDepot] = useState<string>('All Depots');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [selectedPriority, setSelectedPriority] = useState<string>('All Priorities');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<InvestigationLog | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Get unique values for filters
  const uniqueDepots = Array.from(new Set(logs.map(log => log.depot)));
  const uniqueStatuses = Array.from(new Set(logs.map(log => log.status)));
  const uniquePriorities = Array.from(new Set(logs.map(log => log.priority)));

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.logId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.depot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepot = selectedDepot === 'All Depots' || log.depot === selectedDepot;
    const matchesStatus = selectedStatus === 'All Statuses' || log.status === selectedStatus;
    const matchesPriority = selectedPriority === 'All Priorities' || log.priority === selectedPriority;
    
    return matchesSearch && matchesDepot && matchesStatus && matchesPriority;
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
        {/* Header with Filters */}
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">
              <FaFileAlt className="inline mr-2" />
              Investigation Logs
            </h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Depot Filter */}
              <div className="relative">
                <select
                  value={selectedDepot}
                  onChange={(e) => setSelectedDepot(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All Depots">All Depots</option>
                  {uniqueDepots.map(depot => (
                    <option key={depot} value={depot}>{depot}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All Statuses">All Statuses</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Priority Filter */}
              <div className="relative">
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All Priorities">All Priorities</option>
                  {uniquePriorities.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Log ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depot</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.logId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.logId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.depot}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.bus}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{log.issue}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getPriorityBadge(log.priority)}>
                        {log.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(log.status)}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewClick(log)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <FaEye className="mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No investigation logs found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Stats Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex flex-wrap justify-between items-center gap-4 text-sm">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                Resolved: {filteredLogs.filter(l => l.status === 'Resolved').length}
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                In Progress: {filteredLogs.filter(l => l.status === 'In Progress').length}
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></span>
                Pending: {filteredLogs.filter(l => l.status === 'Pending').length}
              </span>
            </div>
            <div className="text-gray-600">
              Showing {filteredLogs.length} of {logs.length} logs
            </div>
          </div>
        </div>
      </div>

      {/* Log Detail Modal */}
      {showModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <FaFileAlt className="mr-2" />
                Investigation Log: {selectedLog.logId}
              </h3>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 p-1"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                    <FaUserCog className="mr-2" /> Assignment Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Depot:</span>
                      <span className="font-medium">{selectedLog.depot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bus Number:</span>
                      <span className="font-medium">{selectedLog.bus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assigned To:</span>
                      <span className="font-medium">{selectedLog.assignedTo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className={getPriorityBadge(selectedLog.priority)}>
                        {selectedLog.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                    <FaCalendarCheck className="mr-2" /> Timeline
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Opened On:</span>
                      <span className="font-medium">{selectedLog.openedOn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Closed On:</span>
                      <span className="font-medium">{selectedLog.closedOn}</span>
                    </div>
                    {selectedLog.timeSpent && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time Spent:</span>
                        <span className="font-medium">{selectedLog.timeSpent}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={getStatusBadge(selectedLog.status)}>
                        {selectedLog.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                    <FaClipboardCheck className="mr-2" /> Quick Actions
                  </h4>
                  <div className="space-y-3">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm">
                      Print Report
                    </button>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm">
                      Export to PDF
                    </button>
                    <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm">
                      Share Log
                    </button>
                  </div>
                </div>
              </div>

              {/* Issue Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3">Reported Issue</h4>
                <p className="text-gray-800">{selectedLog.issue}</p>
              </div>

              {/* Investigation Details */}
              {selectedLog.investigationDetails && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Investigation Details</h4>
                  <p className="text-gray-800 whitespace-pre-line">{selectedLog.investigationDetails}</p>
                </div>
              )}

              {/* Root Cause Analysis */}
              {selectedLog.rootCause && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Root Cause</h4>
                  <p className="text-gray-800">{selectedLog.rootCause}</p>
                </div>
              )}

              {/* Corrective Actions */}
              {selectedLog.correctiveActions && selectedLog.correctiveActions.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Corrective Actions</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-800">
                    {selectedLog.correctiveActions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preventive Actions */}
              {selectedLog.preventiveActions && selectedLog.preventiveActions.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Preventive Actions</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-800">
                    {selectedLog.preventiveActions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Parts Replaced */}
              {selectedLog.partsReplaced && selectedLog.partsReplaced.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Parts Replaced</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Part</th>
                          <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedLog.partsReplaced.map((part, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-2 px-4 text-sm text-gray-800">{part.part}</td>
                            <td className="py-2 px-4 text-sm text-gray-800 text-right">{part.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedLog.attachments && selectedLog.attachments.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Attachments</h4>
                  <div className="flex flex-wrap gap-3">
                    {selectedLog.attachments.map((file, index) => (
                      <div key={index} className="border rounded-md p-3 w-full sm:w-auto">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-md mr-3">
                            {file.type === 'image' ? (
                              <FaFileAlt className="text-blue-600" />
                            ) : (
                              <FaFileAlt className="text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{file.name}</p>
                            <p className="text-xs text-gray-500">{file.type}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

export default InvestigationLogs;