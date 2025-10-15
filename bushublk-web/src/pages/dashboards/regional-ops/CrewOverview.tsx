import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../context/AppContext'; // adjust path as needed
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
  const appContext = useContext(AppContext); // <-- get context safely
  const token = appContext?.token;
  const user = appContext?.user;
  const regionId = user?.region_id ?? 1; // fallback to 1 if not available

  const [filterRole, setFilterRole] = useState<'All' | 'Driver' | 'Conductor'>('All');
  const [filterDepot, setFilterDepot] = useState<'All' | number>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [depots, setDepots] = useState<{ depot_id: number, depot_name: string }[]>([]);
  const [crewList, setCrewList] = useState<CrewMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token || !regionId) return;

    const fetchDepotsAndCrew = async () => {
      setIsLoading(true);
      // Fetch depots
      const depotsRes = await fetch(`http://localhost:5000/api/depots?region_id=${regionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const depotsData = await depotsRes.json();
      const filteredDepots = (depotsData.depots || []).filter(d => d.region_id === regionId);
      setDepots(filteredDepots);

      // Fetch all crews in parallel
      const crewPromises = filteredDepots.map((depot: { depot_id: any; depot_name: any; }) =>
        fetch(`http://localhost:5000/api/crew?depot_id=${depot.depot_id}&region_id=${regionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => (Array.isArray(data) ? data : []).map((member: any) => ({
            id: member.person_id,
            name: member.name,
            contact: member.contact,
            role: member.role,
            status: member.status,
            depot: depot.depot_name
          })))
      );
      const allCrewArrays = await Promise.all(crewPromises);
      const allCrew = allCrewArrays.flat();
      setCrewList(allCrew);
      setIsLoading(false);
    };

    fetchDepotsAndCrew();
  }, [regionId, token]);

  useEffect(() => {
    if (!token || !regionId || depots.length === 0) return;
    if (filterDepot === 'All') return; // Already loaded all crew

    const fetchCrewForDepot = async () => {
      setIsLoading(true);
      const res = await fetch(`http://localhost:5000/api/crew?depot_id=${filterDepot}&region_id=${regionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const crew = (Array.isArray(data) ? data : []).map((member: any) => ({
        id: member.person_id,
        name: member.name,
        contact: member.contact,
        role: member.role,
        status: member.status,
        depot: depots.find(d => d.depot_id === filterDepot)?.depot_name || ''
      }));
      setCrewList(crew);
      setIsLoading(false);
    };

    if (String(filterDepot) !== 'All') {
      fetchCrewForDepot();
    }
    // eslint-disable-next-line
  }, [filterDepot, depots, regionId, token]);

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
    const matchesDepot = filterDepot === 'All' || member.depot === depots.find(d => d.depot_id === filterDepot)?.depot_name;
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.depot.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRole && matchesDepot && matchesSearch;
  });

  // Get unique depots for filter dropdown
  const uniqueDepots = ['All', ...new Set(crewList.map(member => member.depot))];

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
              onChange={(e) => setFilterDepot(e.target.value === 'All' ? 'All' : Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Depots</option>
              {depots.map(depot => (
                <option key={depot.depot_id} value={depot.depot_id}>
                  {depot.depot_name}
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
          Showing {filteredCrew.length} of {crewList.length} crew members
        </div>
      )}
    </div>
  );
};

export default CrewOverview;