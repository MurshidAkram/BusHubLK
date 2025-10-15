import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../context/AppContext';

type CrewStatus = 'Off Duty' | 'On Duty' | 'On Break';

interface Region {
  region_id: number;
  region_name: string;
}
interface Depot {
  depot_id: number;
  depot_name: string;
  region_id: number;
}
interface CrewMember {
  person_id: any;
  id: number;
  name: string;
  contact: string;
  role: 'Driver' | 'Conductor';
  status: CrewStatus;
  depot_id: number; // <-- Add this
  depot?: string;   // depot name for display
}

const CrewOversight = () => {
  const appContext = useContext(AppContext);
  const token = appContext?.token;

  const [regions, setRegions] = useState<Region[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [crewList, setCrewList] = useState<CrewMember[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [selectedDepotId, setSelectedDepotId] = useState<number | null>(null);
  const [filterRole, setFilterRole] = useState<'All' | 'Driver' | 'Conductor'>('All');

  // Fetch regions on mount
  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:5000/api/regions', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setRegions(Array.isArray(data.regions) ? data.regions : []));
  }, [token]);

  // Fetch all depots on mount (for initial load and when region changes)
  useEffect(() => {
    if (!token) return;
    let url = 'http://localhost:5000/api/depots';
    if (selectedRegionId) {
      url += `?region_id=${selectedRegionId}`;
    }
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setDepots(data.depots || []));
  }, [selectedRegionId, token]);

  // Fetch crew on page load, region change, depot change
  useEffect(() => {
    if (!token) return;
    let url = 'http://localhost:5000/api/crew';
    const params: string[] = [];
    if (selectedRegionId) params.push(`region_id=${selectedRegionId}`);
    if (selectedDepotId) params.push(`depot_id=${selectedDepotId}`);
    if (params.length) url += '?' + params.join('&');
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.crew)) {
          setCrewList(data.crew);
        } else if (Array.isArray(data)) {
          setCrewList(data);
        } else {
          setCrewList([]);
        }
      });
  }, [token, selectedRegionId, selectedDepotId]);

  // Only show depots for selected region
  const filteredDepots = selectedRegionId
    ? depots.filter(d => d.region_id === selectedRegionId)
    : depots;

  // Filter crew by role
  const filteredCrew = crewList.filter(member =>
    (filterRole === 'All' || member.role === filterRole)
  );

  // Remove duplicates from filteredCrew
  const uniqueCrew = Array.from(
    new Map(filteredCrew.map(member => [member.person_id, member])).values()
  );

  // Map depot_id to depot_name for each crew member
  const crewWithDepotName = uniqueCrew.map(member => {
    const depotObj = depots.find(d => Number(d.depot_id) === Number(member.depot_id));
    return {
      ...member,
      depot: depotObj ? depotObj.depot_name : '',
    };
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Crew Management</h1>
        <p className="text-sm text-gray-600">View and filter crew by region and depot</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col gap-4 md:flex-row md:gap-8 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Region:</label>
            <select
              value={selectedRegionId ?? ''}
              onChange={e => {
                setSelectedRegionId(Number(e.target.value) || null);
                setSelectedDepotId(null); // Reset depot when region changes
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
            >
              <option value="">All Regions</option>
              {regions.map(region => (
                <option key={region.region_id} value={region.region_id}>
                  {region.region_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Depot:</label>
            <select
              value={selectedDepotId ?? ''}
              onChange={e => setSelectedDepotId(Number(e.target.value) || null)}
              disabled={filteredDepots.length === 0}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
            >
              <option value="">All Depots</option>
              {filteredDepots.map(depot => (
                <option key={depot.depot_id} value={depot.depot_id}>
                  {depot.depot_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role:</label>
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value as 'All' | 'Driver' | 'Conductor')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
            >
              <option value="All">All Roles</option>
              <option value="Driver">Driver</option>
              <option value="Conductor">Conductor</option>
            </select>
          </div>
        </div>

        {filteredCrew.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Depot</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {crewWithDepotName.map((member) => (
                  <tr key={member.person_id}>
                    <td className="px-6 py-4 whitespace-nowrap">{member.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{member.contact}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{member.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{member.depot}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium`}>
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-4">No crew found.</p>
        )}
      </div>
    </div>
  );
};

export default CrewOversight;
