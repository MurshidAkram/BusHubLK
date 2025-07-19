import React, { useState } from 'react';

interface Bus {
  id: number;
  busNumber: string;
  capacity: number;
  status: 'Active' | 'In Repair' | 'Standby';
  assignedRoute: string;
  depot: string;
}

const allFleet: Bus[] = [
  { id: 1, busNumber: 'NB-2045', capacity: 50, status: 'Active', assignedRoute: 'Route 101', depot: 'Colombo Depot' },
  { id: 2, busNumber: 'NB-3345', capacity: 55, status: 'In Repair', assignedRoute: 'Route 102', depot: 'Colombo Depot' },
  { id: 3, busNumber: 'WP-4556', capacity: 60, status: 'Active', assignedRoute: 'Route 210', depot: 'Gampaha Depot' },
  { id: 4, busNumber: 'WP-6789', capacity: 45, status: 'Standby', assignedRoute: 'Route 212', depot: 'Gampaha Depot' },
  { id: 5, busNumber: 'NC-1122', capacity: 48, status: 'Active', assignedRoute: 'Route 320', depot: 'Negombo Depot' },
];

const getStatusBadge = (status: string) => {
  const base = 'inline-block px-2 py-1 text-xs font-semibold rounded-full';
  switch (status) {
    case 'Active':
      return <span className={`${base} bg-green-100 text-green-800`}>Active</span>;
    case 'Standby':
      return <span className={`${base} bg-yellow-100 text-yellow-800`}>In Service</span>;
    case 'In Repair':
      return <span className={`${base} bg-red-100 text-red-800`}>Out of Service</span>;
    default:
      return status;
  }
};

const FleetCoordination = () => {
  const [selectedDepot, setSelectedDepot] = useState('');

  const filteredFleet =
    selectedDepot === ''
      ? allFleet
      : allFleet.filter((bus) => bus.depot === selectedDepot);

  const depots = [...new Set(allFleet.map((bus) => bus.depot))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Fleet Management</h1>
        <p className="text-gray-600">View all buses or filter by depot to see specific fleet details.</p>
      </div>

      {/* Depot Selector */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Depot</label>
        <select
          value={selectedDepot}
          onChange={(e) => setSelectedDepot(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-md"
        >
          <option value="">-- All Depots --</option>
          {depots.map((depot) => (
            <option key={depot} value={depot}>
              {depot}
            </option>
          ))}
        </select>
      </div>

      {/* Fleet Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {selectedDepot ? `Fleet for ${selectedDepot}` : 'All Depot Fleets'}
        </h2>
        {filteredFleet.length === 0 ? (
          <p className="text-gray-500">No buses found.</p>
        ) : (
          <table className="w-full table-auto border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2 border">Bus Number</th>
                <th className="px-4 py-2 border">Depot</th>
                <th className="px-4 py-2 border">Capacity</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Assigned Route</th>
              </tr>
            </thead>
            <tbody>
              {filteredFleet.map((bus) => (
                <tr key={bus.id} className="border-t">
                  <td className="px-4 py-2 border">{bus.busNumber}</td>
                  <td className="px-4 py-2 border">{bus.depot}</td>
                  <td className="px-4 py-2 border">{bus.capacity}</td>
                  <td className="px-4 py-2 border">{getStatusBadge(bus.status)}</td>
                  <td className="px-4 py-2 border">{bus.assignedRoute}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FleetCoordination;
