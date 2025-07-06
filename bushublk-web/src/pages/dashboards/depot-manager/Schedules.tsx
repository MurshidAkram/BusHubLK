import React, { useState } from 'react';

interface Schedule {
  id: number;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  frequency: string;
  assignedBus: string;
}

const cities = [
  'Colombo',
  'Kandy',
  'Galle',
  'Matara',
  'Kurunegala',
  'Anuradhapura',
  'Jaffna',
  'Batticaloa',
  'Negombo',
  'Nuwara Eliya',
];

// Preloaded mock schedules
const initialSchedules: Schedule[] = [
  {
    id: 1,
    from: 'Colombo',
    to: 'Kandy',
    departure: '08:00',
    arrival: '11:30',
    frequency: 'Every 2 hours',
    assignedBus: 'NC-1234',
  },
  {
    id: 2,
    from: 'Galle',
    to: 'Matara',
    departure: '09:00',
    arrival: '10:30',
    frequency: 'Every 3 hours',
    assignedBus: 'NC-5678',
  },
  {
    id: 3,
    from: 'Kurunegala',
    to: 'Anuradhapura',
    departure: '07:15',
    arrival: '10:00',
    frequency: 'Every 4 hours',
    assignedBus: 'NC-9012',
  },
];

const Schedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    departure: '',
    arrival: '',
    frequency: '',
    assignedBus: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSchedule = () => {
    const { from, to, departure, arrival, frequency, assignedBus } = formData;

    if (!from || !to || !departure || !arrival || !frequency || !assignedBus) {
      alert('Please fill in all fields before adding a schedule.');
      return;
    }

    if (from === to) {
      alert('Departure and destination cannot be the same.');
      return;
    }

    const newSchedule: Schedule = {
      id: Date.now(),
      ...formData,
    };

    setSchedules([newSchedule, ...schedules]);

    setFormData({
      from: '',
      to: '',
      departure: '',
      arrival: '',
      frequency: '',
      assignedBus: '',
    });
  };

  const handleDelete = (id: number) => {
    setSchedules(schedules.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Route Schedules</h1>
        <p className="text-gray-600">
          Create and manage bus route schedules and timetables.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Add New Schedule</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <select
              name="from"
              value={formData.from}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2"
            >
              <option value="">Select departure location</option>
              {cities.map((city, index) => (
                <option key={index} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <select
              name="to"
              value={formData.to}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2"
            >
              <option value="">Select destination</option>
              {cities.map((city, index) => (
                <option key={index} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Departure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Departure Time
            </label>
            <input
              type="time"
              name="departure"
              className="w-full border border-gray-300 rounded-md px-4 py-2"
              value={formData.departure}
              onChange={handleChange}
            />
          </div>

          {/* Arrival */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arrival Time
            </label>
            <input
              type="time"
              name="arrival"
              className="w-full border border-gray-300 rounded-md px-4 py-2"
              value={formData.arrival}
              onChange={handleChange}
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <input
              type="text"
              name="frequency"
              className="w-full border border-gray-300 rounded-md px-4 py-2"
              value={formData.frequency}
              onChange={handleChange}
              placeholder="Every 2 hours"
            />
          </div>

          {/* Assigned Bus */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned Bus
            </label>
            <input
              type="text"
              name="assignedBus"
              className="w-full border border-gray-300 rounded-md px-4 py-2"
              value={formData.assignedBus}
              onChange={handleChange}
              placeholder="NC-1234"
            />
          </div>
        </div>

        <button
          onClick={handleAddSchedule}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Add Schedule
        </button>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-lg shadow-sm p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Current Schedules</h2>
        {schedules.length === 0 ? (
          <p className="text-gray-500 text-sm">No schedules added yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Route</th>
                <th className="px-4 py-2 text-left">Departure</th>
                <th className="px-4 py-2 text-left">Arrival</th>
                <th className="px-4 py-2 text-left">Frequency</th>
                <th className="px-4 py-2 text-left">Assigned Bus</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="border-b">
                  <td className="px-4 py-2">
                    {schedule.from} - {schedule.to}
                  </td>
                  <td className="px-4 py-2">{schedule.departure}</td>
                  <td className="px-4 py-2">{schedule.arrival}</td>
                  <td className="px-4 py-2">{schedule.frequency}</td>
                  <td className="px-4 py-2">{schedule.assignedBus}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Schedules;
