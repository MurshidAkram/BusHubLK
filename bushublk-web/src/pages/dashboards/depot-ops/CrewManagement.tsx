import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Clock, RotateCw, Search, X } from 'lucide-react';

type CrewStatus = 'Off Duty' | 'On Duty' | 'On Break';

interface CrewMember {
  id: number;
  name: string;
  contact: string;
  role: 'Driver' | 'Conductor';
  status: CrewStatus;
}

const CrewManagement = () => {
  const [filterRole, setFilterRole] = useState<'All' | 'Driver' | 'Conductor'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<CrewMember | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<CrewStatus>('Off Duty');

  const [crewList, setCrewList] = useState<CrewMember[]>([
    {
      id: 1,
      name: 'Nimal Perera',
      contact: '+94771234567',
      role: 'Driver',
      status: 'On Duty',
    },
    {
      id: 2,
      name: 'Sunil Silva',
      contact: '+94769876543',
      role: 'Conductor',
      status: 'On Break',
    },
    {
      id: 3,
      name: 'Kamal Fernando',
      contact: '+94712345678',
      role: 'Driver',
      status: 'Off Duty',
    },
    {
      id: 4,
      name: 'Mohamed Rizwan',
      contact: '+94751234567',
      role: 'Conductor',
      status: 'On Duty',
    },
    {
      id: 5,
      name: 'Nawas Ameer',
      contact: '+94784561230',
      role: 'Driver',
      status: 'On Break',
    },
    {
      id: 6,
      name: 'Thilina Jayasooriya',
      contact: '+94711122233',
      role: 'Driver',
      status: 'On Duty',
    },
    {
      id: 7,
      name: 'Sahan Bandara',
      contact: '+94779988776',
      role: 'Conductor',
      status: 'Off Duty',
    },
    {
      id: 8,
      name: 'Siththi Lebbe Faiz',
      contact: '+94761122445',
      role: 'Driver',
      status: 'On Duty',
    },
    {
      id: 9,
      name: 'Ramesh Sivalingam',
      contact: '+94723344556',
      role: 'Conductor',
      status: 'On Break',
    },
  ]);

  const openStatusModal = (member: CrewMember) => {
    setSelectedMember(member);
    setNewStatus(member.status);
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedMember(null);
  };

  const handleStatusChange = () => {
    if (selectedMember) {
      setCrewList(prev =>
        prev.map(member =>
          member.id === selectedMember.id
            ? { ...member, status: newStatus }
            : member
        )
      );
      closeStatusModal();
    }
  };

  const getStatusIcon = (status: CrewStatus) => {
    switch (status) {
      case 'On Duty':
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case 'On Break':
        return <Clock className="h-4 w-4 mr-1" />;
      case 'Off Duty':
        return <AlertCircle className="h-4 w-4 mr-1" />;
    }
  };

  const getStatusColor = (status: CrewStatus) => {
    switch (status) {
      case 'On Duty':
        return 'text-green-600';
      case 'On Break':
        return 'text-yellow-600';
      case 'Off Duty':
        return 'text-red-600';
    }
  };

  const filteredCrew = crewList.filter(member => {
    const matchesRole = filterRole === 'All' || member.role === filterRole;
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.contact.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6 relative">
      {/* Status Change Modal */}
      {showStatusModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-medium text-gray-900">Change Status</h3>
              <button 
                onClick={closeStatusModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Crew Member</p>
                <p className="font-medium">{selectedMember.name} ({selectedMember.role})</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Current Status</p>
                <div className={`inline-flex items-center ${getStatusColor(selectedMember.status)}`}>
                  {getStatusIcon(selectedMember.status)}
                  <span className="text-sm">{selectedMember.status}</span>
                </div>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  New Status
                </label>
                <select
                  id="status"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as CrewStatus)}
                >
                  <option value="Off Duty">Off Duty</option>
                  <option value="On Duty">On Duty</option>
                  <option value="On Break">On Break</option>
                </select>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleStatusChange}
              >
                Save Changes
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={closeStatusModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Crew Management</h1>
            <p className="text-sm text-gray-500">Manage bus crew assignments and status</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search crew..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilterRole('All')}
                className={`px-3 py-1 text-sm rounded-md ${filterRole === 'All' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterRole('Driver')}
                className={`px-3 py-1 text-sm rounded-md ${filterRole === 'Driver' ? 'bg-white shadow-sm text-blue-500' : 'text-gray-600'}`}
              >
                Drivers
              </button>
              <button
                onClick={() => setFilterRole('Conductor')}
                className={`px-3 py-1 text-sm rounded-md ${filterRole === 'Conductor' ? 'bg-white shadow-sm text-purple-500' : 'text-gray-600'}`}
              >
                Conductors
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCrew.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No crew members found
                  </td>
                </tr>
              ) : (
                filteredCrew.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.contact}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.role === 'Driver' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {member.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center ${getStatusColor(member.status)}`}>
                        {getStatusIcon(member.status)}
                        <span className="text-sm">{member.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openStatusModal(member)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-900"
                      >
                        <RotateCw className="h-4 w-4 mr-1" />
                        Change Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCrew.length > 0 && (
        <div className="text-sm text-gray-500 px-4">
          Showing {filteredCrew.length} of {crewList.length} crew members
        </div>
      )}
    </div>
  );
};

export default CrewManagement;