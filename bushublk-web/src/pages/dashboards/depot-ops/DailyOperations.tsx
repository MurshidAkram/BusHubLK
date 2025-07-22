import React, { useState } from 'react';

interface Assignment {
  id: number;
  bus: string;
  route: string;
  driver: string;
  conductor: string;
}

const DailyOperations = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: 1,
      bus: 'Bus 101',
      route: '138 - Colombo to Maharagama',
      driver: 'Driver Nimal Perera',
      conductor: 'Conductor Sunil Fernando',
    },
    {
      id: 2,
      bus: 'Bus 202',
      route: '122 - Colombo to Horana',
      driver: 'Driver Sampath Silva',
      conductor: 'Conductor Bandara Jayasinghe',
    },
    {
      id: 3,
      bus: 'Bus 303',
      route: '125 - Colombo to Mattegoda',
      driver: 'Driver Mahesh Gunawardena',
      conductor: 'Conductor Ruwan Kumara',
    },
  ]);

  const [bus, setBus] = useState('');
  const [route, setRoute] = useState('');
  const [driver, setDriver] = useState('');
  const [conductor, setConductor] = useState('');

  const [currentlyEditingId, setCurrentlyEditingId] = useState<number | null>(null);

  const handleAddAssignment = () => {
    if (bus && route && driver && conductor) {
      const newAssignment: Assignment = {
        id: Date.now(),
        bus,
        route,
        driver,
        conductor,
      };
      setAssignments([...assignments, newAssignment]);
      setBus('');
      setRoute('');
      setDriver('');
      setConductor('');
    } else {
      alert('Please fill all fields');
    }
  };

  const handleEdit = (id: number) => {
    const assignment = assignments.find(a => a.id === id);
    if (assignment) {
      setCurrentlyEditingId(id);
      setBus(assignment.bus);
      setRoute(assignment.route);
      setDriver(assignment.driver);
      setConductor(assignment.conductor);
    }
  };

  const handleSaveEdit = () => {
    if (currentlyEditingId !== null) {
      const updatedAssignments = assignments.map(a =>
        a.id === currentlyEditingId
          ? { ...a, bus, route, driver, conductor }
          : a
      );
      setAssignments(updatedAssignments);
      setCurrentlyEditingId(null);
      setBus('');
      setRoute('');
      setDriver('');
      setConductor('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Daily Assignments</h1>
        <p className="text-gray-600">Create and manage bus route schedules and timetables.</p>
      </div>

      {/* Assignment Form */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">{currentlyEditingId ? 'Edit Assignment' : 'Assign a Bus'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <select value={bus} onChange={(e) => setBus(e.target.value)} className="p-2 border rounded">
            <option value="">Select Bus</option>
            <option value="Bus 101">Bus 101</option>
            <option value="Bus 202">Bus 202</option>
            <option value="Bus 303">Bus 303</option>
            <option value="Bus 404">Bus 404</option>
          </select>

          <select value={route} onChange={(e) => setRoute(e.target.value)} className="p-2 border rounded">
            <option value="">Select Route</option>
            <option value="138 - Colombo to Maharagama">138 - Colombo to Maharagama</option>
            <option value="122 - Colombo to Horana">122 - Colombo to Horana</option>
            <option value="125 - Colombo to Mattegoda">125 - Colombo to Mattegoda</option>
            <option value="120 - Colombo to Avissawella">120 - Colombo to Avissawella</option>
          </select>

          <select value={driver} onChange={(e) => setDriver(e.target.value)} className="p-2 border rounded">
            <option value="">Select Driver</option>
            <option value="Driver Nimal Perera">Driver Nimal Perera</option>
            <option value="Driver Sampath Silva">Driver Sampath Silva</option>
            <option value="Driver Mahesh Gunawardena">Driver Mahesh Gunawardena</option>
            <option value="Driver Ranjith Dissanayake">Driver Ranjith Dissanayake</option>
          </select>

          <select value={conductor} onChange={(e) => setConductor(e.target.value)} className="p-2 border rounded">
            <option value="">Select Conductor</option>
            <option value="Conductor Sunil Fernando">Conductor Sunil Fernando</option>
            <option value="Conductor Bandara Jayasinghe">Conductor Bandara Jayasinghe</option>
            <option value="Conductor Ruwan Kumara">Conductor Ruwan Kumara</option>
            <option value="Conductor Upul Senanayake">Conductor Upul Senanayake</option>
          </select>
        </div>

        <button
          onClick={currentlyEditingId ? handleSaveEdit : handleAddAssignment}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {currentlyEditingId ? 'Save Changes' : 'Add Assignment'}
        </button>
      </div>

      {/* Assignment Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Assigned Buses</h2>
        {assignments.length === 0 ? (
          <p className="text-gray-500">No assignments added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Bus</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Route</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Driver</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Conductor</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2">{a.bus}</td>
                    <td className="px-4 py-2">{a.route}</td>
                    <td className="px-4 py-2">{a.driver}</td>
                    <td className="px-4 py-2">{a.conductor}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleEdit(a.id)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                    </td>
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

export default DailyOperations;
