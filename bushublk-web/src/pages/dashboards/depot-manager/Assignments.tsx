import React, { useState, useEffect } from 'react';

interface Assignment {
  assignment_id: number;
  bus_id: number;
  bus_registration: string;
  route_id: number;
  route_number: string;
  route_name: string;
  driver_id: number;
  driver_name: string;
  conductor_id: number;
  conductor_name: string;
  depot_id: number;
  date: string;
}

const Assignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    setAssignments([
      {
        assignment_id: 1,
        bus_id: 1,
        bus_registration: 'NC-1234',
        route_id: 1,
        route_number: '138',
        route_name: 'Colombo - Maharagama',
        driver_id: 1,
        driver_name: 'Ali Khan',
        conductor_id: 3,
        conductor_name: 'Suresh Fernando',
        depot_id: 10,
        date: '2025-07-21',
      },
      {
        assignment_id: 2,
        bus_id: 2,
        bus_registration: 'NC-5678',
        route_id: 2,
        route_number: '122',
        route_name: 'Colombo - Horana',
        driver_id: 2,
        driver_name: 'Nimal Perera',
        conductor_id: 4,
        conductor_name: 'Kamal Silva',
        depot_id: 10,
        date: '2025-07-21',
      },
      {
        assignment_id: 3,
        bus_id: 3,
        bus_registration: 'NC-9012',
        route_id: 3,
        route_number: '125',
        route_name: 'Colombo - Wattegama',
        driver_id: 3,
        driver_name: 'Mohamed Rizwan',
        conductor_id: 5,
        conductor_name: 'Ravi Karunaratne',
        depot_id: 10,
        date: '2025-07-21',
      },
      {
        assignment_id: 4,
        bus_id: 4,
        bus_registration: 'NC-3456',
        route_id: 4,
        route_number: '101',
        route_name: 'Colombo - Panadura',
        driver_id: 4,
        driver_name: 'Sunil Jayasuriya',
        conductor_id: 6,
        conductor_name: 'Thilina Ranasinghe',
        depot_id: 10,
        date: '2025-07-21',
      },
    ]);
  }, []);

  return (
    <div className="container mx-auto p-4 text-sm">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Daily Operations</h1>
        <p className="text-gray-600">View daily bus assignments</p>
      </div>

      {/* Assignment Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Assignments</h2>

        {assignments.length === 0 ? (
          <p className="text-gray-500">No assignments found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Bus</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Route No.</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Route</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Driver</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Conductor</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr key={assignment.assignment_id}>
                    <td className="px-6 py-4 whitespace-nowrap">{assignment.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{assignment.bus_registration}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{assignment.route_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{assignment.route_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{assignment.driver_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{assignment.conductor_name}</td>
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
