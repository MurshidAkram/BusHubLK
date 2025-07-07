import React, { useState } from 'react';
import { FaEdit } from 'react-icons/fa';

// Define allowed status types
type StatusType = 'Pending' | 'Completed' | 'Cancelled';

interface Inspection {
  id: string;
  depot: string;
  type: string;
  date: string;
  status: StatusType;
  buses: number;
}

const initialInspections: Inspection[] = [
  {
    id: 'INS-2023-056',
    depot: 'North Depot',
    type: 'Quarterly Technical',
    date: '2023-06-05',
    status: 'Pending',
    buses: 24,
  },
  {
    id: 'INS-2023-057',
    depot: 'South Depot',
    type: 'Brake System Audit',
    date: '2023-06-10',
    status: 'Pending',
    buses: 30,
  },
  {
    id: 'INS-2023-058',
    depot: 'East Depot',
    type: 'Electrical Systems',
    date: '2023-06-15',
    status: 'Pending',
    buses: 28,
  },
];

const getStatusBadge = (status: StatusType): string => {
  const base = 'px-2 py-1 rounded text-xs font-medium';
  switch (status) {
    case 'Pending':
      return `${base} bg-yellow-100 text-yellow-700`;
    case 'Completed':
      return `${base} bg-green-100 text-green-700`;
    case 'Cancelled':
      return `${base} bg-red-100 text-red-700`;
    default:
      return `${base} bg-gray-100 text-gray-700`;
  }
};

const InspectionManagement: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>(initialInspections);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Form state
  const [newDepot, setNewDepot] = useState('');
  const [newType, setNewType] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newBuses, setNewBuses] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newInspection: Inspection = {
      id: `INS-${Date.now()}`,
      depot: newDepot,
      type: newType,
      date: newDate,
      status: 'Pending',
      buses: newBuses,
    };

    setInspections([newInspection, ...inspections]);
    setShowModal(false);

    // Reset form
    setNewDepot('');
    setNewType('');
    setNewDate('');
    setNewBuses(0);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Inspections Management</h2>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => setShowModal(true)}
        >
          + New Inspection
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-sm text-gray-500 mb-2">Scheduled Inspections</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Inspection ID</th>
                <th className="px-4 py-2">Depot</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Scheduled Date</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Buses</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inspections.length > 0 ? (
                inspections.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-2">{item.id}</td>
                    <td className="px-4 py-2">{item.depot}</td>
                    <td className="px-4 py-2">{item.type}</td>
                    <td className="px-4 py-2">{item.date}</td>
                    <td className="px-4 py-2">
                      <span className={getStatusBadge(item.status)}>{item.status}</span>
                    </td>
                    <td className="px-4 py-2">{item.buses}</td>
                    <td className="px-4 py-2 text-center">
                      <button className="text-blue-500 hover:text-blue-700">
                        <FaEdit size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No inspections found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Inspection</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium">Depot</label>
                <select
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={newDepot}
                  onChange={(e) => setNewDepot(e.target.value)}
                  required
                >
                  <option value="">Select Depot</option>
                  <option>North Depot</option>
                  <option>South Depot</option>
                  <option>East Depot</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Inspection Type</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Scheduled Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Number of Buses</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={newBuses}
                  onChange={(e) => setNewBuses(parseInt(e.target.value))}
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionManagement;
