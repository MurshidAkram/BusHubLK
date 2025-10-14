import React, { useState, useEffect, useContext } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';
import { AppContext } from '../../../context/AppContext';

type StatusType = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

interface Inspection {
  id: number;
  inspection_type: string;
  date: string;
  time: string;
  status: StatusType;
  depot_name: string;
  description?: string;
  assigned_by: string;
  region_name: string;
  assigned_to?: string;
}

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
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  const context = useContext(AppContext);

  // Fetch inspections on component mount
  useEffect(() => {
    const fetchInspections = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (!context?.token) {
          setError('Authentication required');
          return;
        }

        // Depot managers can see all inspections in their depot
        const response = await fetch('http://localhost:5000/api/inspections/depot-manager', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${context.token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch inspections');
        }

        if (data.success) {
          setInspections(data.inspections);
        } else {
          setError(data.message || 'Failed to load inspections');
        }
      } catch (err: any) {
        console.error('Error fetching inspections:', err);
        setError(err.message || 'Failed to load inspections');
      } finally {
        setLoading(false);
      }
    };

    fetchInspections();
  }, [context?.token]);

  const filteredInspections = inspections
    .filter(inspection => {
      const matchesSearch = inspection.inspection_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           inspection.assigned_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (inspection.assigned_to && inspection.assigned_to.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by date (earliest first)
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Loading inspections...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Inspections</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Depot Inspections Overview</h1>
          <p className="text-gray-600">Monitor and oversee all inspections scheduled for your depot</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <div className="w-6 h-6 bg-yellow-600 rounded"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inspections.filter(i => i.status === 'Pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 rounded"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inspections.filter(i => i.status === 'In Progress').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-6 h-6 bg-green-600 rounded"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inspections.filter(i => i.status === 'Completed').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <div className="w-6 h-6 bg-gray-600 rounded"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{inspections.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search inspections..."
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {/*  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned By</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInspections.length > 0 ? (
                  filteredInspections.map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inspection.inspection_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(inspection.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.time}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(inspection.status)}>
                          {inspection.status}
                        </span>
                      </td>
                  {/*    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {inspection.assigned_to || '-'}
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.assigned_by}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No inspections found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepotInspections;
