import React, { useState } from 'react';

interface ScheduleEntry {
  id: number;
  busNumber: string;
  route: string;
  departure: string;
  arrival: string;
  driver: string;
  depot: string;
}

// Merged all depot entries into one flat list
const allSchedules: ScheduleEntry[] = [
  { id: 1, busNumber: 'NB-2045', route: 'Route 101', departure: '06:00 AM', arrival: '08:30 AM', driver: 'A. Perera', depot: 'Colombo Depot' },
  { id: 2, busNumber: 'NB-3345', route: 'Route 102', departure: '07:15 AM', arrival: '09:45 AM', driver: 'R. Silva', depot: 'Colombo Depot' },
  { id: 3, busNumber: 'WP-4556', route: 'Route 210', departure: '05:45 AM', arrival: '08:15 AM', driver: 'D. Fernando', depot: 'Gampaha Depot' },
  { id: 4, busNumber: 'WP-6789', route: 'Route 212', departure: '08:00 AM', arrival: '10:30 AM', driver: 'N. Jayasuriya', depot: 'Gampaha Depot' },
  { id: 5, busNumber: 'NC-1122', route: 'Route 320', departure: '06:30 AM', arrival: '09:00 AM', driver: 'B. Gunasekara', depot: 'Negombo Depot' },
];

const ScheduleOversight = () => {
  const [selectedDepot, setSelectedDepot] = useState('');

  // Filter logic
  const filteredSchedules =
    selectedDepot === ''
      ? allSchedules
      : allSchedules.filter((entry) => entry.depot === selectedDepot);

  // Unique list of depot names
  const depotNames = [...new Set(allSchedules.map((s) => s.depot))];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Schedule Oversight</h1>
        <p className="text-gray-600">View and filter bus schedules by depot.</p>
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
          {depotNames.map((depot) => (
            <option key={depot} value={depot}>
              {depot}
            </option>
          ))}
        </select>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {selectedDepot ? `Schedules for ${selectedDepot}` : 'All Depot Schedules'}
        </h2>

        {filteredSchedules.length === 0 ? (
          <p className="text-gray-500">No schedules available.</p>
        ) : (
          <table className="w-full table-auto border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2 border">Depot</th>
                <th className="px-4 py-2 border">Bus Number</th>
                <th className="px-4 py-2 border">Route</th>
                <th className="px-4 py-2 border">Departure</th>
                <th className="px-4 py-2 border">Arrival</th>
                <th className="px-4 py-2 border">Driver</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((entry) => (
                <tr key={entry.id} className="border-t">
                  <td className="px-4 py-2 border">{entry.depot}</td>
                  <td className="px-4 py-2 border">{entry.busNumber}</td>
                  <td className="px-4 py-2 border">{entry.route}</td>
                  <td className="px-4 py-2 border">{entry.departure}</td>
                  <td className="px-4 py-2 border">{entry.arrival}</td>
                  <td className="px-4 py-2 border">{entry.driver}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ScheduleOversight;
