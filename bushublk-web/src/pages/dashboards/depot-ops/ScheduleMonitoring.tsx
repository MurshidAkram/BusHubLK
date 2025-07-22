import React, { useState } from 'react';

interface EstimatedBusTiming {
  date: string;
  busName: string;
  scheduledDeparture: string;
  scheduledArrival: string;
}

interface ActualTripData {
  date: string;
  busName: string;
  actualDeparture: string;
  actualArrival: string;
  distanceKm: number;
}

const DistanceMonitor = () => {
  const today = new Date().toISOString().split('T')[0];
  const buses = ['NP1234', 'NP4567', 'NP8910'];

  const [selectedDate, setSelectedDate] = useState<string>(today);

  const [scheduleForm, setScheduleForm] = useState({
    bus: '',
    scheduledDeparture: '',
    scheduledArrival: '',
  });

  const [estimatedTimings, setEstimatedTimings] = useState<EstimatedBusTiming[]>([
    { date: today, busName: 'NP1234', scheduledDeparture: '08:00', scheduledArrival: '10:00' },
    { date: today, busName: 'NP4567', scheduledDeparture: '09:00', scheduledArrival: '11:30' },
    { date: today, busName: 'NP8910', scheduledDeparture: '07:45', scheduledArrival: '09:15' },
  ]);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    bus: '',
    scheduledDeparture: '',
    scheduledArrival: '',
  });

  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setScheduleForm({ ...scheduleForm, [e.target.name]: e.target.value });
  };

  const handleAddEstimatedTiming = () => {
    const { bus, scheduledDeparture, scheduledArrival } = scheduleForm;
    if (!bus || !scheduledDeparture || !scheduledArrival) return;

    setEstimatedTimings(prev => [...prev, {
      date: selectedDate,
      busName: bus,
      scheduledDeparture,
      scheduledArrival,
    }]);

    setScheduleForm({ bus: '', scheduledDeparture: '', scheduledArrival: '' });
  };

  const handleEdit = (index: number) => {
    const timing = filteredEstimated[index];
    setEditForm({
      bus: timing.busName,
      scheduledDeparture: timing.scheduledDeparture,
      scheduledArrival: timing.scheduledArrival,
    });
    setEditingIndex(index);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const updated = [...estimatedTimings];
    const globalIndex = estimatedTimings.findIndex(
      (item) =>
        item.date === selectedDate &&
        item.busName === filteredEstimated[editingIndex].busName &&
        item.scheduledDeparture === filteredEstimated[editingIndex].scheduledDeparture &&
        item.scheduledArrival === filteredEstimated[editingIndex].scheduledArrival
    );

    if (globalIndex !== -1) {
      updated[globalIndex] = {
        date: selectedDate,
        busName: editForm.bus,
        scheduledDeparture: editForm.scheduledDeparture,
        scheduledArrival: editForm.scheduledArrival,
      };
      setEstimatedTimings(updated);
    }

    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const itemToRemove = filteredEstimated[index];
    setEstimatedTimings(prev =>
      prev.filter(
        (item) =>
          !(item.date === selectedDate &&
            item.busName === itemToRemove.busName &&
            item.scheduledDeparture === itemToRemove.scheduledDeparture &&
            item.scheduledArrival === itemToRemove.scheduledArrival)
      )
    );
  };

  const [actualForm, setActualForm] = useState({
    bus: '',
    actualDeparture: '',
    actualArrival: '',
    distanceKm: '',
  });

  const [actualTrips, setActualTrips] = useState<ActualTripData[]>([
    { date: today, busName: 'NP1234', actualDeparture: '08:05', actualArrival: '10:10', distanceKm: 56 },
    { date: today, busName: 'NP4567', actualDeparture: '09:00', actualArrival: '11:20', distanceKm: 72 },
    { date: today, busName: 'NP8910', actualDeparture: '07:40', actualArrival: '09:00', distanceKm: 49 },
  ]);

  const handleActualChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setActualForm({ ...actualForm, [e.target.name]: e.target.value });
  };

  const handleAddActualTrip = () => {
    const { bus, actualDeparture, actualArrival, distanceKm } = actualForm;
    if (!bus || !actualDeparture || !actualArrival || distanceKm === '') return;

    setActualTrips(prev => [...prev, {
      date: selectedDate,
      busName: bus,
      actualDeparture,
      actualArrival,
      distanceKm: Number(distanceKm),
    }]);

    setActualForm({ bus: '', actualDeparture: '', actualArrival: '', distanceKm: '' });
  };

  const getStatus = (bus: string): string => {
    const scheduled = estimatedTimings.find(e => e.date === selectedDate && e.busName === bus);
    const actual = actualTrips.find(a => a.date === selectedDate && a.busName === bus);
    if (!scheduled || !actual) return 'N/A';

    if (actual.actualArrival > scheduled.scheduledArrival) return 'Delayed';
    if (actual.actualArrival < scheduled.scheduledArrival) return 'Early';
    return 'On Time';
  };

  const filteredActual = actualTrips.filter(t => t.date === selectedDate);
  const filteredEstimated = estimatedTimings.filter(e => e.date === selectedDate);

  const totalDistance = filteredActual.reduce((sum, r) => sum + r.distanceKm, 0);
  const avgDistance = filteredActual.length > 0 ? totalDistance / filteredActual.length : 0;

  return (
    <div className="space-y-6 text-sm">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Daily Schedule</h1>
        <p className="text-gray-600">Plan and review daily bus schedules, track actual trips, distances, and analyze timing performance.</p>
      </div>

      {/* Estimated Schedule Entry */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Assign Scheduled Departures and Arrivals</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select name="bus" value={scheduleForm.bus} onChange={handleScheduleChange} className="border p-2 rounded">
            <option value="">Select Bus</option>
            {buses.map((bus, i) => <option key={i} value={bus}>{bus}</option>)}
          </select>
          <input type="time" name="scheduledDeparture" value={scheduleForm.scheduledDeparture} onChange={handleScheduleChange} className="border p-2 rounded" />
          <input type="time" name="scheduledArrival" value={scheduleForm.scheduledArrival} onChange={handleScheduleChange} className="border p-2 rounded" />
          <button onClick={handleAddEstimatedTiming} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">Assign</button>
        </div>

        {filteredEstimated.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Bus</th>
                  <th className="px-4 py-2 border">Scheduled Departure</th>
                  <th className="px-4 py-2 border">Scheduled Arrival</th>
                  <th className="px-4 py-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEstimated.map((e, i) => (
                  <tr key={i}>
                    {editingIndex === i ? (
                      <>
                        <td className="px-4 py-2 border">
                          <select name="bus" value={editForm.bus} onChange={(e) => setEditForm({ ...editForm, bus: e.target.value })} className="border p-1 rounded w-full text-sm">
                            <option value="">Select Bus</option>
                            {buses.map((bus, j) => <option key={j} value={bus}>{bus}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2 border">
                          <input type="time" name="scheduledDeparture" value={editForm.scheduledDeparture} onChange={handleEditChange} className="border p-1 rounded w-full" />
                        </td>
                        <td className="px-4 py-2 border">
                          <input type="time" name="scheduledArrival" value={editForm.scheduledArrival} onChange={handleEditChange} className="border p-1 rounded w-full" />
                        </td>
                        <td className="px-4 py-2 border space-x-2">
                          <button onClick={handleSaveEdit} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Save</button>
                          <button onClick={() => setEditingIndex(null)} className="bg-gray-400 text-white px-2 py-1 rounded text-xs">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 border">{e.busName}</td>
                        <td className="px-4 py-2 border">{e.scheduledDeparture}</td>
                        <td className="px-4 py-2 border">{e.scheduledArrival}</td>
                        <td className="px-4 py-2 border space-x-2">
                          <button onClick={() => handleEdit(i)} className="text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => handleDelete(i)} className="text-red-600 hover:underline">Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actual Trip Entry */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Log Completed Trips</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select name="bus" value={actualForm.bus} onChange={handleActualChange} className="border p-2 rounded">
            <option value="">Select Bus</option>
            {buses.map((bus, i) => <option key={i} value={bus}>{bus}</option>)}
          </select>
          <input type="time" name="actualDeparture" value={actualForm.actualDeparture} onChange={handleActualChange} className="border p-2 rounded" />
          <input type="time" name="actualArrival" value={actualForm.actualArrival} onChange={handleActualChange} className="border p-2 rounded" />
          <input type="number" name="distanceKm" value={actualForm.distanceKm} onChange={handleActualChange} placeholder="Distance in km" className="border p-2 rounded" />
          <button onClick={handleAddActualTrip} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">Log</button>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800">Daily Trip Summary ({selectedDate})</h2>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border p-2 rounded mb-4 text-sm" />

        {filteredActual.length === 0 ? (
          <p className="text-gray-500">No data available for this date.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Bus</th>
                  <th className="px-4 py-2 border">Scheduled Arrival</th>
                  <th className="px-4 py-2 border">Actual Arrival</th>
                  <th className="px-4 py-2 border">Distance</th>
                  <th className="px-4 py-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredActual.map((trip, i) => {
                  const scheduled = estimatedTimings.find(s => s.date === selectedDate && s.busName === trip.busName);
                  return (
                    <tr key={i}>
                      <td className="px-4 py-2 border">{trip.busName}</td>
                      <td className="px-4 py-2 border">{scheduled ? scheduled.scheduledArrival : '-'}</td>
                      <td className="px-4 py-2 border">{trip.actualArrival}</td>
                      <td className="px-4 py-2 border">{trip.distanceKm} km</td>
                      <td className={`px-4 py-2 border ${
                        getStatus(trip.busName) === 'Delayed' ? 'text-red-600' :
                        getStatus(trip.busName) === 'Early' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {getStatus(trip.busName)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-4 text-sm text-gray-700">
              <p><strong>Total Distance:</strong> {totalDistance} km</p>
              <p><strong>Average per Bus:</strong> {avgDistance.toFixed(1)} km</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistanceMonitor;
