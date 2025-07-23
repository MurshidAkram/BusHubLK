import React, { useState } from 'react';
import { FaSearch, FaFilter, FaInfoCircle } from 'react-icons/fa';

type StatusType = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

interface Inspection {
  id: string;
  depot: string;
  type: string;
  scheduledDate: string;
  dueDate: string;
  status: StatusType;
  buses: number;
  description: string;
  assignedBy: string;
}

const initialInspections: Inspection[] = [
  {
    id: 'INS-20',
    depot: 'North Depot',
    type: 'Quarterly Technical',
    scheduledDate: '2025-06-05',
    dueDate: '2023-07-21',
    status: 'In Progress',
    buses: 24,
    description: 'Full technical inspection of all buses in the depot'
  },
  {
    id: 'INS-22',
    depot: 'South Depot',
    type: 'Brake System Audit',
    scheduledDate: '2025-06-10',
    dueDate: '2025-08-15',
    status: 'Pending',
    buses: 30,
    description: 'Comprehensive brake system inspection and testing'
  },
  {
    id: 'INS-24',
    depot: 'East Depot',
    type: 'Electrical Systems',
    scheduledDate: '2025-06-15',
    dueDate: '2025-08-20',
    status: 'Pending',
    buses: 28,
    description: 'Electrical systems check including wiring and lighting'
  },
];

const getStatusBadge = (status: StatusType): string => {
  const base = 'px-3 py-1 rounded-full text-xs font-medium';
  switch (status) {
    case 'Pending':
      return `${base} bg-yellow-100 text-yellow-800`;
    case 'In Progress':
      return `${base} bg-blue-100 text-blue-800`;
    case 'Completed':
      return `${base} bg-green-100 text-green-800`;
    case 'Cancelled':
      return `${base} bg-red-100 text-red-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
};

const DepotInspections: React.FC = () => {
  const [inspections] = useState<Inspection[]>(initialInspections);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = inspection.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.assignedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Assigned Inspections</h1>
          <p className="text-gray-600">View all inspections assigned to you</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search inspections..."
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inspections Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspection ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                 
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInspections.length > 0 ? (
                  filteredInspections.map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inspection.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.scheduledDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.dueDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(inspection.status)}>
                          {inspection.status}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedInspection(inspection)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <FaInfoCircle />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No inspections found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspection Detail Modal */}
        {selectedInspection && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    Inspection Details - {selectedInspection.id}
                  </h2>
                  <button
                    onClick={() => setSelectedInspection(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Depot</h3>
                      <p className="mt-1 text-gray-900">{selectedInspection.depot}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Inspection Type</h3>
                      <p className="mt-1 text-gray-900">{selectedInspection.type}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Scheduled Date</h3>
                      <p className="mt-1 text-gray-900">{selectedInspection.scheduledDate}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                      <p className="mt-1 text-gray-900">{selectedInspection.dueDate}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <span className={getStatusBadge(selectedInspection.status)}>
                        {selectedInspection.status}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Number of Buses</h3>
                      <p className="mt-1 text-gray-900">{selectedInspection.buses}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Assigned By</h3>
                    <p className="mt-1 text-gray-900">{selectedInspection.assignedBy}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="mt-1 text-gray-900 whitespace-pre-line">{selectedInspection.description}</p>
                  </div>

                  <div className="pt-4 border-t">
                    <button
                      onClick={() => setSelectedInspection(null)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepotInspections;