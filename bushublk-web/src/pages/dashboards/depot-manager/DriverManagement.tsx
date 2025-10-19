import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

type CrewStatus = 'Off Duty' | 'On Duty' | 'On Break';

interface CrewMember {
  id: number;
  name: string;
  contact: string;
  role: 'Driver' | 'Conductor';
  status: CrewStatus;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${API_URL}/api`;

const DriverManagement = () => {
  const [filterRole, setFilterRole] = useState<'All' | 'Driver' | 'Conductor'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [crewList, setCrewList] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(false);

  // TODO: Replace with actual depot/region from context/auth if needed
  const depotId = 1;
  const regionId = 1;

  useEffect(() => {
    const fetchCrew = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `${API_BASE_URL}/crew?depot_id=${depotId}&region_id=${regionId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (!res.ok) throw new Error('Failed to fetch crew');
        const data = await res.json();
        setCrewList(
          data.map((member: any) => ({
            id: member.person_id,
            name: member.name,
            contact: member.contact,
            role: member.role,
            status: member.status,
          }))
        );
      } catch (err) {
        setCrewList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCrew();
  }, [depotId, regionId]);

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

  const filteredCrew = crewList.filter(member => {
    const matchesRole = filterRole === 'All' || member.role === filterRole;
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.contact.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
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
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredCrew.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No crew members match the selected role.
                  </td>
                </tr>
              ) : (
                filteredCrew.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{member.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{member.contact}</td>
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
          Showing {filteredCrew.length} of {crewList.length} crew members
        </div>
      )}
    </div>
  );
};

export default DriverManagement;
