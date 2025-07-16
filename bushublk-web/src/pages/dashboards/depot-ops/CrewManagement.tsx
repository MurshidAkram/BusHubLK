import React, { useState } from 'react';

type CrewStatus = 'Off Duty' | 'On Duty' | 'On Break';

interface CrewMember {
  id: number;
  name: string;
  contact: string;
  role: 'Driver' | 'Conductor';
  status: CrewStatus;
}

const CrewManagement = () => {
  const [crewList, setCrewList] = useState<CrewMember[]>([
    {
      id: 1,
      name: 'Nimal Perera',
      contact: '0771234567',
      role: 'Driver',
      status: 'On Duty',
    },
    {
      id: 2,
      name: 'Sunil Silva',
      contact: '0769876543',
      role: 'Conductor',
      status: 'On Break',
    },
    {
      id: 3,
      name: 'Kamal Fernando',
      contact: '0712345678',
      role: 'Driver',
      status: 'Off Duty',
    },
  ]);

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [role, setRole] = useState<'Driver' | 'Conductor'>('Driver');

  const handleAddCrew = () => {
    if (!name.trim() || !contact.trim()) return;

    const newMember: CrewMember = {
      id: Date.now(),
      name,
      contact,
      role,
      status: 'Off Duty',
    };

    setCrewList([...crewList, newMember]);
    setName('');
    setContact('');
  };

  const cycleStatus = (current: CrewStatus): CrewStatus => {
    switch (current) {
      case 'Off Duty':
        return 'On Duty';
      case 'On Duty':
        return 'On Break';
      case 'On Break':
        return 'Off Duty';
    }
  };

  const toggleStatus = (id: number) => {
    setCrewList(prev =>
      prev.map(member =>
        member.id === id
          ? { ...member, status: cycleStatus(member.status) }
          : member
      )
    );
  };

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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Crew Management</h1>
        <p className="text-gray-600">Create and manage bus crew assignments and schedules.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-2">Add Crew Member</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Full Name"
            className="border p-2 rounded w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Contact Number"
            className="border p-2 rounded w-full"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          <select
            className="border p-2 rounded"
            value={role}
            onChange={(e) => setRole(e.target.value as 'Driver' | 'Conductor')}
          >
            <option value="Driver">Driver</option>
            <option value="Conductor">Conductor</option>
          </select>
          <button
            onClick={handleAddCrew}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-2">Crew List</h2>
        {crewList.length === 0 ? (
          <p className="text-gray-500">No crew members added yet.</p>
        ) : (
          <table className="w-full border mt-2 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Contact</th>
                <th className="p-2 text-left">Role</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {crewList.map((member) => (
                <tr key={member.id} className="border-t">
                  <td className="p-2">{member.name}</td>
                  <td className="p-2">{member.contact}</td>
                  <td className="p-2">{member.role}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => toggleStatus(member.id)}
                      className="text-blue-600 hover:underline"
                    >
                      Change Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CrewManagement;
