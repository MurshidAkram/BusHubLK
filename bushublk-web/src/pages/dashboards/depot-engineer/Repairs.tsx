import React, { useState } from 'react';

// Icon Components
const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ViewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

interface Repair {
  date: string;
  busId: string;
  part: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Completed' | 'In Progress' | 'Pending';
}

interface FormData {
  busId: string;
  part: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
}

const Repairs: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    busId: '',
    part: '',
    description: '',
    priority: 'Low'
  });

  const repairs: Repair[] = [
    { date: '2023-05-20', busId: '#15', part: 'Engine', description: 'Oil change', priority: 'Medium', status: 'Completed' },
    { date: '2023-05-18', busId: '#08', part: 'Brakes', description: 'Pad replacement', priority: 'High', status: 'Completed' },
    { date: '2023-05-15', busId: '#12', part: 'Tires', description: 'Rotation and balance', priority: 'Low', status: 'Completed' },
    { date: '2023-05-10', busId: '#07', part: 'Electrical', description: 'Battery replacement', priority: 'High', status: 'In Progress' },
    { date: '2023-05-05', busId: '#22', part: 'Transmission', description: 'Fluid change', priority: 'Medium', status: 'Completed' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log('Submitting repair:', formData);
    setShowModal(false);
    setFormData({ busId: '', part: '', description: '', priority: 'Low' });
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in progress': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Repairs & Replacements</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span className="text-lg">+</span> New Repair
          </button>
        </div>

        {/* Repair Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-700">Recent Repairs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bus ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {repairs.map((repair, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{repair.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{repair.busId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{repair.part}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{repair.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${getPriorityColor(repair.priority)}`}>{repair.priority}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(repair.status)}`}>
                        {repair.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-800 p-1 rounded">
                        <ViewIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white rounded-md shadow-lg w-full max-w-xl mx-4 md:mx-0 md:max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">New Repair</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-red-500">
                <XIcon />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bus ID</label>
                <select
                  name="busId"
                  value={formData.busId}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select Bus</option>
                  <option value="#07">Bus #07</option>
                  <option value="#08">Bus #08</option>
                  <option value="#12">Bus #12</option>
                  <option value="#15">Bus #15</option>
                  <option value="#22">Bus #22</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Part</label>
                <select
                  name="part"
                  value={formData.part}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select Part</option>
                  <option value="Engine">Engine</option>
                  <option value="Brakes">Brakes</option>
                  <option value="Tires">Tires</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Transmission">Transmission</option>
                  <option value="Suspension">Suspension</option>
                  <option value="Air Conditioning">Air Conditioning</option>
                  <option value="Doors">Doors</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full border rounded-md px-3 py-2 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Describe the repair or replacement needed..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition"
                >
                  Submit Repair
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Repairs;