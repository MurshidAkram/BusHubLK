import React from 'react';

const mockDrivers = [
  {
    id: 'DRV-001',
    name: 'Kasun Perera',
    role: 'Driver',
    contact: '0771234567',
    assignedBus: 'NC-1234',
    status: 'Active',
    experience: 5,
  },
  {
    id: 'DRV-002',
    name: 'Saman Silva',
    role: 'Conductor',
    contact: '0779876543',
    assignedBus: 'NC-1234',
    status: 'On Leave',
    experience: 3,
  },
  {
    id: 'DRV-003',
    name: 'Nimal Fernando',
    role: 'Driver',
    contact: '0711122233',
    assignedBus: 'NC-5678',
    status: 'Active',
    experience: 7,
  },
  {
    id: 'DRV-004',
    name: 'Priya Jayawardena',
    role: 'Conductor',
    contact: '0769988776',
    assignedBus: 'NC-5678',
    status: 'Inactive',
    experience: 2,
  },
];

const DriverManagement = () => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-200 text-gray-700';
      case 'On Leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Driver & Conductor Management</h1>
        <p className="text-gray-600">View driver and conductor assignments and performance.</p>
      </div>

      {/* Driver Table */}
      <div className="bg-white rounded-lg shadow-sm p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Contact</th>
              <th className="px-4 py-2 text-left">Assigned Bus</th>
              <th className="px-4 py-2 text-left">Experience</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockDrivers.map((driver) => (
              <tr key={driver.id} className="border-b">
                <td className="px-4 py-2">{driver.id}</td>
                <td className="px-4 py-2">{driver.name}</td>
                <td className="px-4 py-2">{driver.role}</td>
                <td className="px-4 py-2">{driver.contact}</td>
                <td className="px-4 py-2">{driver.assignedBus}</td>
                <td className="px-4 py-2">{driver.experience} yrs</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(driver.status)}`}>
                    {driver.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DriverManagement;
