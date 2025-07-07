import React, { useState } from 'react';

interface Assignment {
  date: string;
  route: string;
  from: string;
  to: string;
  busNumber: string;
  driver: string;
  driverStatus: 'Present' | 'Absent' | 'Replaced';
  replacementDriver?: string;
  conductor: string;
  conductorStatus: 'Present' | 'Absent' | 'Replaced';
  replacementConductor?: string;
}

const mockAssignments: Assignment[] = [
  {
    date: '2025-07-04',
    route: 'Route 1',
    from: 'Colombo',
    to: 'Gampaha',
    busNumber: 'NC-1234',
    driver: 'Kasun Perera',
    driverStatus: 'Present',
    conductor: 'Saman Silva',
    conductorStatus: 'Present',
  },
  {
    date: '2025-07-04',
    route: 'Route 2',
    from: 'Pettah',
    to: 'Wellawatte',
    busNumber: 'NC-5678',
    driver: 'Nimal Fernando',
    driverStatus: 'Replaced',
    replacementDriver: 'Ranjith Silva',
    conductor: 'Priya Jayawardena',
    conductorStatus: 'Absent',
    replacementConductor: 'Dilani Perera',
  },
  {
    date: '2025-07-05',
    route: 'Route 3',
    from: 'Kandy',
    to: 'Matale',
    busNumber: 'NC-9012',
    driver: 'Chamara Rathnayake',
    driverStatus: 'Absent',
    replacementDriver: 'Lasantha Kumara',
    conductor: 'Dilani Perera',
    conductorStatus: 'Present',
  }
];

const getStatusBadge = (status: string, replacement?: string) => {
  switch (status) {
    case 'Present':
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Present</span>;
    case 'Absent':
      return (
        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
          Absent {replacement ? `→ ${replacement}` : ''}
        </span>
      );
    case 'Replaced':
      return (
        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
          Replaced {replacement ? `→ ${replacement}` : ''}
        </span>
      );
    default:
      return null;
  }
};

const Assignments = () => {
  const [selectedDate, setSelectedDate] = useState('2025-07-04');

  const filteredAssignments = mockAssignments.filter(
    (a) => a.date === selectedDate
  );

  const uniqueDates = Array.from(new Set(mockAssignments.map((a) => a.date)));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Daily Assignments
        </h1>
        <p className="text-gray-600">
          View assigned buses, drivers, and conductors for the selected date.
        </p>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <label className="block mb-2 text-sm text-gray-600 font-medium">
          Select Date:
        </label>
        <select
          className="px-4 py-2 border border-gray-300 rounded-md"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        >
          {uniqueDates.map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>
      </div>

      {/* Assignment Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {filteredAssignments.length === 0 ? (
          <p className="text-gray-500">No assignments found for this date.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">Bus No</th>
                  <th className="px-4 py-2">Route</th>
                  <th className="px-4 py-2">From</th>
                  <th className="px-4 py-2">To</th>
                  <th className="px-4 py-2">Driver</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Conductor</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((a, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2">{a.busNumber}</td>
                    <td className="px-4 py-2">{a.route}</td>
                    <td className="px-4 py-2">{a.from}</td>
                    <td className="px-4 py-2">{a.to}</td>
                    <td className="px-4 py-2">{a.driver}</td>
                    <td className="px-4 py-2">{getStatusBadge(a.driverStatus, a.replacementDriver)}</td>
                    <td className="px-4 py-2">{a.conductor}</td>
                    <td className="px-4 py-2">{getStatusBadge(a.conductorStatus, a.replacementConductor)}</td>
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

export default Assignments;
