import React, { useState } from 'react';
import { Search } from 'lucide-react';

type CrewStatus = 'Off Duty' | 'On Duty' | 'On Break';

interface CrewMember {
  id: number;
  name: string;
  contact: string;
  role: 'Driver' | 'Conductor';
  status: CrewStatus;
  depot: string;
}

const CrewOverview = () => {
  const [filterRole, setFilterRole] = useState<'All' | 'Driver' | 'Conductor'>('All');
  const [filterDepot, setFilterDepot] = useState<'All' | string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const mockCrewList: CrewMember[] = [
    { id: 1, name: 'John Smith', contact: '+1-555-0101', role: 'Driver', status: 'On Duty', depot: 'Main Depot' },
    { id: 2, name: 'Sarah Johnson', contact: '+1-555-0102', role: 'Conductor', status: 'On Duty', depot: 'Main Depot' },
    { id: 3, name: 'Mike Chen', contact: '+1-555-0103', role: 'Driver', status: 'Off Duty', depot: 'North Depot' },
    { id: 4, name: 'Emily Davis', contact: '+1-555-0104', role: 'Conductor', status: 'On Break', depot: 'South Depot' },
    { id: 5, name: 'Robert Wilson', contact: '+1-555-0105', role: 'Driver', status: 'On Duty', depot: 'West Depot' },
    { id: 6, name: 'Lisa Brown', contact: '+1-555-0106', role: 'Conductor', status: 'Off Duty', depot: 'Main Depot' },
    { id: 7, name: 'David Miller', contact: '+1-555-0107', role: 'Driver', status: 'On Duty', depot: 'East Depot' },
    { id: 8, name: 'Maria Garcia', contact: '+1-555-0108', role: 'Conductor', status: 'On Break', depot: 'North Depot' },
  ];

  // Get unique depots for filter dropdown
  const uniqueDepots = ['All', ...new Set(mockCrewList.map(member => member.depot))];

  const getStatusColor = (status: CrewStatus) => {
    switch (status) {
      case 'On Duty':
        return 'text-green-600';
      case 'On Break':
        return 'text-yellow-600';
      case 'Off Duty':
        return 'text-red-600';
      default:
        return '';
    }
  };

  const getRoleBadge = (role: 'Driver' | 'Conductor') => {
    return role === 'Driver'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-purple-100 text-purple-800';
  };

  const filteredCrew = mockCrewList.filter(member => {
    const matchesRole = filterRole === 'All' || member.role === filterRole;
    const matchesDepot = filterDepot === 'All' || member.depot === filterDepot;
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.depot.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRole && matchesDepot && matchesSearch;
  });

  return (
    <div className="space-y-6 relative">
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Crew Management</h1>
            <p className="text-sm text-gray-500">Total Crew in depot</p>
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
            
            {/* Depot Filter */}
            <select
              value={filterDepot}
              onChange={(e) => setFilterDepot(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {uniqueDepots.map(depot => (
                <option key={depot} value={depot}>
                  {depot === 'All' ? 'All Depots' : depot}
                </option>
              ))}
            </select>

            {/* Role Filter */}
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
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Contact Number</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Depot</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCrew.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No crew members match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredCrew.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{member.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{member.contact}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{member.depot}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(member.role)}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
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
          Showing {filteredCrew.length} of {mockCrewList.length} crew members
        </div>
      )}
    </div>
  );
};

export default CrewOverview;