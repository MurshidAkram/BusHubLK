import React, { useState } from 'react';

interface CrewMember {
  id: number;
  name: string;
  role: 'Driver' | 'Conductor';
  assignedBus: string;
  route: string;
  depot: string;
  leaveStart?: string; // optional leave dates
  leaveEnd?: string;
}

const crewMembers: CrewMember[] = [
  { id: 1, name: 'Ashan Perera', role: 'Driver', assignedBus: 'NB-2045', route: 'Route 101', depot: 'Colombo Depot' },
  { id: 2, name: 'Ruwan Silva', role: 'Driver', assignedBus: 'NB-3345', route: 'Route 102', depot: 'Colombo Depot' },
  { id: 3, name: 'Nimal Fernando', role: 'Conductor', assignedBus: 'NB-2045', route: 'Route 101', depot: 'Colombo Depot' },
  { id: 4, name: 'Rashmi Dissanayake', role: 'Conductor', assignedBus: 'NB-3345', route: 'Route 102', depot: 'Colombo Depot', leaveStart: '2025-07-18', leaveEnd: '2025-07-20' },
  { id: 5, name: 'Dinesh Lakmal', role: 'Driver', assignedBus: 'WP-4556', route: 'Route 210', depot: 'Gampaha Depot', leaveStart: '2025-07-15', leaveEnd: '2025-07-19' },
  { id: 6, name: 'Kasun Silva', role: 'Conductor', assignedBus: 'WP-4556', route: 'Route 210', depot: 'Gampaha Depot' },
  { id: 7, name: 'Manoj Rathnayake', role: 'Driver', assignedBus: 'NC-1122', route: 'Route 320', depot: 'Negombo Depot' },
  { id: 8, name: 'Chamari Weerakoon', role: 'Conductor', assignedBus: 'NC-1122', route: 'Route 320', depot: 'Negombo Depot' },
  { id: 9, name: 'Sunil Jayawardena', role: 'Driver', assignedBus: 'NB-9988', route: 'Route 103', depot: 'Colombo Depot' },
  { id: 10, name: 'Shanaka Pathirana', role: 'Driver', assignedBus: 'NB-0099', route: 'Route 104', depot: 'Colombo Depot', leaveStart: '2025-07-18', leaveEnd: '2025-07-18' },
  { id: 11, name: 'Lalitha Kumari', role: 'Conductor', assignedBus: 'WP-1122', route: 'Route 211', depot: 'Gampaha Depot' },
  { id: 12, name: 'Priyantha De Silva', role: 'Driver', assignedBus: 'WP-3344', route: 'Route 213', depot: 'Gampaha Depot' },
  { id: 13, name: 'Nirosha Senanayake', role: 'Conductor', assignedBus: 'WP-3344', route: 'Route 213', depot: 'Gampaha Depot', leaveStart: '2025-07-16', leaveEnd: '2025-07-20' },
  { id: 14, name: 'Tharindu Dhananjaya', role: 'Driver', assignedBus: 'NC-2233', route: 'Route 321', depot: 'Negombo Depot' },
  { id: 15, name: 'Indika Rajapaksha', role: 'Conductor', assignedBus: 'NC-2233', route: 'Route 321', depot: 'Negombo Depot', leaveStart: '2025-07-18', leaveEnd: '2025-07-18' },
];

const isOnLeave = (crew: CrewMember, date: string) => {
  if (!crew.leaveStart || !crew.leaveEnd) return false;
  return date >= crew.leaveStart && date <= crew.leaveEnd;
};

const getStatusBadge = (onLeave: boolean) => {
  const base = 'inline-block px-2 py-1 text-xs font-semibold rounded-full';
  return onLeave
    ? <span className={`${base} bg-yellow-100 text-yellow-800`}>On Leave</span>
    : <span className={`${base} bg-green-100 text-green-800`}>Active</span>;
};

const CrewOverview = () => {
  const [selectedDepot, setSelectedDepot] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [expandedDepot, setExpandedDepot] = useState('');

  const depots = [...new Set(crewMembers.map((m) => m.depot))];
  const visibleDepots = selectedDepot ? [selectedDepot] : depots;

  const getDepotStats = (depot: string) => {
    const depotCrew = crewMembers.filter((m) => m.depot === depot);
    const drivers = depotCrew.filter((m) => m.role === 'Driver');
    const conductors = depotCrew.filter((m) => m.role === 'Conductor');
    const onLeave = depotCrew.filter((m) => isOnLeave(m, selectedDate));
    return {
      depot,
      driversCount: drivers.length,
      conductorsCount: conductors.length,
      total: depotCrew.length,
      onLeave: onLeave.length,
    };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Crew Overview</h1>
        <p className="text-gray-600">Monitor crew by depot and date.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Depot</label>
          <select
            value={selectedDepot}
            onChange={(e) => setSelectedDepot(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded-md"
          >
            <option value=''>-- All Depots --</option>
            {depots.map((depot) => (
              <option key={depot} value={depot}>{depot}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded-md"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 overflow-x-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Depot Summary for {selectedDate}</h2>
        <table className="min-w-full table-auto border border-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-4 py-2 border">Depot</th>
              <th className="px-4 py-2 border">Drivers</th>
              <th className="px-4 py-2 border">Conductors</th>
              <th className="px-4 py-2 border">Total Crew</th>
              <th className="px-4 py-2 border">On Leave</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleDepots.map((depot) => {
              const stats = getDepotStats(depot);
              return (
                <React.Fragment key={depot}>
                  <tr className="border-t">
                    <td className="px-4 py-2 border font-medium">{stats.depot}</td>
                    <td className="px-4 py-2 border">{stats.driversCount}</td>
                    <td className="px-4 py-2 border">{stats.conductorsCount}</td>
                    <td className="px-4 py-2 border">{stats.total}</td>
                    <td className="px-4 py-2 border">{stats.onLeave}</td>
                    <td className="px-4 py-2 border">
                      <button
                        onClick={() => setExpandedDepot(expandedDepot === depot ? '' : depot)}
                        className="text-blue-600 hover:underline"
                      >
                        {expandedDepot === depot ? 'Hide Details' : 'View More'}
                      </button>
                    </td>
                  </tr>
                  {expandedDepot === depot && (
                    <tr>
                      <td colSpan={6} className="px-4 py-2 border">
                        <table className="w-full border border-gray-100 text-sm mt-2">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 border">Name</th>
                              <th className="px-4 py-2 border">Role</th>
                              <th className="px-4 py-2 border">Assigned Bus</th>
                              <th className="px-4 py-2 border">Route</th>
                              <th className="px-4 py-2 border">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {crewMembers.filter((m) => m.depot === depot).map((member) => (
                              <tr key={member.id} className="border-t">
                                <td className="px-4 py-2 border">{member.name}</td>
                                <td className="px-4 py-2 border">{member.role}</td>
                                <td className="px-4 py-2 border">{member.assignedBus}</td>
                                <td className="px-4 py-2 border">{member.route}</td>
                                <td className="px-4 py-2 border">{getStatusBadge(isOnLeave(member, selectedDate))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CrewOverview;
