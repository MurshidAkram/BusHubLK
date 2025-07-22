import React, { useState } from 'react';
import { FaEdit, FaPaperPlane, FaSearch, FaFilter, FaCheck } from 'react-icons/fa';

// Define allowed status types
type StatusType = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

interface Inspection {
  id: string;
  depot: string;
  engineer: string;
  engineerid: string;
  type: string;
  scheduledDate: string;
  dueDate: string;
  status: StatusType;
  buses: number;
  description: string;
}

const initialInspections: Inspection[] = [
  {
    id: 'INS-2023-056',
    depot: 'North Depot',
    engineer: 'Engineer Rajesh',
    engineerid: '7',
    type: 'Quarterly Technical',
    scheduledDate: '2025-06-05',
    dueDate: '2023-07-21',
    status: 'In Progress',
    buses: 24,
    description: 'Full technical inspection of all buses in the depot'
  },
  {
    id: 'INS-2023-057',
    depot: 'South Depot',
    engineer: 'Engineer Priya',
    engineerid: '12',
    type: 'Brake System Audit',
    scheduledDate: '2025-06-10',
    dueDate: '2025-08-15',
    status: 'Pending',
    buses: 30,
    description: 'Comprehensive brake system inspection and testing'
  },
  {
    id: 'INS-2023-058',
    depot: 'East Depot',
    engineer: 'Engineer Amit',
    engineerid: '23',
    type: 'Electrical Systems',
    scheduledDate: '2025-06-15',
    dueDate: '2025-08-20',
    status: 'Pending',
    buses: 28,
    description: 'Electrical systems check including wiring and lighting'
  },
];

const engineerOptions = [
  'Engineer Rajesh',
  'Engineer Priya',
  'Engineer Amit',
  'Engineer Sanjay'
];

const depotOptions = [
  'North Depot',
  'South Depot',
  'East Depot',
  'West Depot'
];

const inspectionTypes = [
  'Quarterly Technical',
  'Annual Comprehensive',
  'Brake System Audit',
  'Electrical Systems',
  'Emission Testing',
  'Safety Equipment Check'
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

const RTOInspectionDashboard: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>(initialInspections);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentInspection, setCurrentInspection] = useState<Inspection | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState<Omit<Inspection, 'id' | 'status'>>({
    depot: '',
    engineer: '',
    type: '',
    scheduledDate: '',
    dueDate: '',
    buses: 0,
    description: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'buses' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editMode && currentInspection) {
      // Update existing inspection
      const updatedInspections = inspections.map(inspection => 
        inspection.id === currentInspection.id 
          ? { ...formData, id: currentInspection.id, status: currentInspection.status }
          : inspection
      );
      setInspections(updatedInspections);
    } else {
      // Create new inspection
      const newInspection: Inspection = {
        id: `INS-${Date.now()}`,
        ...formData,
        status: 'Pending'
      };
      setInspections([newInspection, ...inspections]);
    }

    setShowModal(false);
    resetForm();
  };

  const handleEdit = (inspection: Inspection) => {
    setCurrentInspection(inspection);
    setFormData({
      depot: inspection.depot,
      engineer: inspection.engineer,
      type: inspection.type,
      scheduledDate: inspection.scheduledDate,
      dueDate: inspection.dueDate,
      buses: inspection.buses,
      description: inspection.description
    });
    setEditMode(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      depot: '',
      engineer: '',
      type: '',
      scheduledDate: '',
      dueDate: '',
      buses: 0,
      description: ''
    });
    setEditMode(false);
    setCurrentInspection(null);
  };

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = inspection.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.depot.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.engineer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sendToEngineer = (id: string) => {
    alert(`Inspection ${id} has been sent to the assigned engineer`);
  };

  const markAsCompleted = (id: string) => {
    setInspections(inspections.map(inspection => 
      inspection.id === id 
        ? { ...inspection, status: 'Completed' } 
        : inspection
    ));
    alert(`Inspection ${id} has been marked as completed`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">RTO Inspection Management</h1>
            <p className="text-gray-600">Schedule and manage depot inspections</p>
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mt-4 md:mt-0"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            + New Inspection
          </button>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depot</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EngineerId</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInspections.length > 0 ? (
                  filteredInspections.map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inspection.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.depot}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.engineerid}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.scheduledDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.dueDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(inspection.status)}>
                          {inspection.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(inspection)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => sendToEngineer(inspection.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Send to Engineer"
                          >
                            <FaPaperPlane />
                          </button>
                          {inspection.status !== 'Completed' && (
                            <button
                              onClick={() => markAsCompleted(inspection.id)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Mark as Completed"
                            >
                              <FaCheck />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                      No inspections found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inspection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {editMode ? 'Edit Inspection' : 'Create New Inspection'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Depot</label>
                    <select
                      name="depot"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.depot}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Depot</option>
                      {depotOptions.map(depot => (
                        <option key={depot} value={depot}>{depot}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Engineer</label>
                    <select
                      name="engineer"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.engineer}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Engineer</option>
                      {engineerOptions.map(engineer => (
                        <option key={engineer} value={engineer}>{engineer}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Type</label>
                    <select
                      name="type"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Type</option>
                      {inspectionTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Buses</label>
                    <input
                      type="number"
                      name="buses"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.buses}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                    <input
                      type="date"
                      name="scheduledDate"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.scheduledDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editMode ? 'Update Inspection' : 'Create Inspection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RTOInspectionDashboard;