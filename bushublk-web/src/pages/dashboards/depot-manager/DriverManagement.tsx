import React, { useState } from 'react';

type CrewStatus = 'Off Duty' | 'On Duty' | 'On Break';

interface CrewMember {
  id: number;
  name: string;
  contact: string;
  role: 'Driver' | 'Conductor';
  status: CrewStatus;
}

const DriverManagement = () => {
  const [filterRole, setFilterRole] = useState<'All' | 'Driver' | 'Conductor'>('All');

  const [crewList] = useState<CrewMember[]>([
    { id: 1, name: 'Nimal Perera', contact: '+94771234567', role: 'Driver', status: 'On Duty' },
    { id: 2, name: 'Sunil Silva', contact: '+94769876543', role: 'Conductor', status: 'On Break' },
    { id: 3, name: 'Kamal Fernando', contact: '+94712345678', role: 'Driver', status: 'Off Duty' },
    { id: 4, name: 'Mohamed Rizwan', contact: '+94751234567', role: 'Conductor', status: 'On Duty' },
    { id: 5, name: 'Nawas Ameer', contact: '+94784561230', role: 'Driver', status: 'On Break' },
    { id: 6, name: 'Thilina Jayasooriya', contact: '+94711122233', role: 'Driver', status: 'On Duty' },
    { id: 7, name: 'Sahan Bandara', contact: '+94779988776', role: 'Conductor', status: 'Off Duty' },
    { id: 8, name: 'Siththi Lebbe Faiz', contact: '+94761122445', role: 'Driver', status: 'On Duty' },
    { id: 9, name: 'Ramesh Sivalingam', contact: '+94723344556', role: 'Conductor', status: 'On Break' },
  ]);

  const getStatusColor = (status: CrewStatus) => {
    switch (status) {
      case 'On Duty':
        return 'bg-green-100 text-green-700';
      case 'On Break':
        return 'bg-yellow-100 text-yellow-700';
      case 'Off Duty':
        return 'bg-red-100 text-red-700';
      default:
        return '';
    }
  };

  const filteredCrew = crewList.filter(member =>
    filterRole === 'All' ? true : member.role === filterRole
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Crew</h1>
        <p className="text-sm text-gray-600">Today's bus crew assignments</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Crew List</h2>
          <select
            className="border border-gray-300 rounded p-2 text-sm"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as 'All' | 'Driver' | 'Conductor')}
          >
            <option value="All">All</option>
            <option value="Driver">Driver</option>
            <option value="Conductor">Conductor</option>
          </select>
        </div>

        {filteredCrew.length === 0 ? (
          <p className="text-sm text-gray-500">No crew members match the selected role.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Contact Number</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCrew.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{member.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{member.contact}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{member.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverManagement;
