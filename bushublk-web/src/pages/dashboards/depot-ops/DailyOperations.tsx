import React, { useState, useEffect } from 'react';

interface Assignment {
  id: number;
  bus: string;
  route: string;
  driver: string;
  conductor: string;
}

interface Bus {
  id: number;
  name: string;
  status: 'Active' | 'Under Service';
}

interface Route {
  id: number;
  route_number: string;
  route_name: string;
  start_location: string;
  end_location: string;
  distance_km: string;
  estimated_duration_minutes: string;
}

const BACKEND_URL = 'http://localhost:5000';

const DailyOperations: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: 1001,
      bus: 'NP1234',
      route: '404: Pettah → Fort → Galle Face',
      driver: 'Nimal Perera',
      conductor: 'Ranjith Bandara',
    },
    {
      id: 1002,
      bus: 'NP4567',
      route: '406: Kandy → Peradeniya → Mawanella',
      driver: 'Sunil Fernando',
      conductor: 'Suresh Liyanage',
    },
  ]);

  const [buses] = useState<Bus[]>([
    { id: 1, name: 'NP1234', status: 'Active' },
    { id: 2, name: 'NP4567', status: 'Active' },
    { id: 3, name: 'NP8910', status: 'Under Service' },
  ]);

  const [routes, setRoutes] = useState<Route[]>([]);

  const [routeNumber, setRouteNumber] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    bus: '',
    route: '',
    driver: '',
    conductor: '',
  });

  const [editId, setEditId] = useState<number | null>(null);

  const areaOptions = [
    'Pettah', 'Kotte', 'Galle Face', 'Wellawatte', 'Dehiwala', 'Panadura',
    'Fort', 'Bambalapitiya', 'Mount Lavinia', 'Kandy', 'Peradeniya',
    'Kadugannawa', 'Mawanella', 'Colombo', 'Gampaha', 'Kiribathgoda'
  ];

  const drivers = [
    'Nimal Perera', 'Sunil Fernando', 'Sarath Silva', 'Ajith Kumara', 'Kamal Jayasuriya',
    'Ruwan Lakmal', 'Dinesh Rathnayake', 'Chamara Gunasekara', 'Anura Dissanayake', 'Tharindu Wijesinghe'
  ];

  const conductors = [
    'Ranjith Bandara', 'Suresh Liyanage', 'Mahinda Rajakaruna', 'Pubudu Kumara', 'Nalaka Priyantha',
    'Bandara Herath', 'Saman Jayantha', 'Amal Dissanayake', 'Indika Wijeratne', 'Lakshitha Gamage'
  ];

  // Auto-generate route_name based on start and end location
  const routeName = startLocation && endLocation ? `${startLocation} → ${endLocation}` : '';

  // Fetch all routes from backend

  const BACKEND_URL = 'http://localhost:5000';

  const fetchRoutes = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/routes`);
    if (!response.ok) {
      throw new Error(`Failed to fetch routes: ${response.statusText}`);
    }
    const data = await response.json();
    setRoutes(data);
  } catch (error) {
    console.error('Error fetching routes:', error);
  }
};


  useEffect(() => {
    fetchRoutes();
  }, []);

  // Save route (Add or Update)
  const saveRoute = async (route: Route) => {
    try {
      const method = route.id ? 'PUT' : 'POST';
      const url = route.id ? `${BACKEND_URL}/api/routes/${route.id}` : `${BACKEND_URL}/api/routes`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(route),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Save failed: ${res.status} ${errorText}`);
      }
      await fetchRoutes();
    } catch (error) {
      console.error('Save Route Error:', error);
      alert('Error saving route. See console for details.');
    }
  };

  // Delete route by id
  const deleteRoute = async (id: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/routes/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Delete failed: ${res.status} ${errorText}`);
      }
      await fetchRoutes();
    } catch (error) {
      console.error('Delete Route Error:', error);
      alert('Error deleting route. See console for details.');
    }
  };

  // Add or Update route handler connected to backend
  const handleAddOrUpdateRoute = () => {
    if (!routeNumber.trim() || !startLocation || !endLocation || !distanceKm.trim() || !estimatedDuration.trim()) {
      alert('Please fill all route fields');
      return;
    }

    const routeToSave: Route = {
      id: editingRouteId || 0,
      route_number: routeNumber.trim(),
      start_location: startLocation,
      end_location: endLocation,
      distance_km: distanceKm.trim(),
      estimated_duration_minutes: estimatedDuration.trim(),
      route_name: routeName,
    };

    saveRoute(routeToSave);
    setEditingRouteId(null);

    // Reset form fields
    setRouteNumber('');
    setStartLocation('');
    setEndLocation('');
    setDistanceKm('');
    setEstimatedDuration('');
  };

  // Load route data to form for editing
  const handleEditRoute = (route: Route) => {
    setRouteNumber(route.route_number);
    setStartLocation(route.start_location);
    setEndLocation(route.end_location);
    setDistanceKm(route.distance_km);
    setEstimatedDuration(route.estimated_duration_minutes);
    setEditingRouteId(route.id);
  };

  // Delete route handler with confirm
  const handleDeleteRoute = (id: number) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      deleteRoute(id);
    }
  };

  // Bus to Route Assignment handlers (unchanged)
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAssign = () => {
    const { bus, route, driver, conductor } = formData;
    if (!bus || !route || !driver || !conductor) {
      alert('Please select bus, route, driver and conductor');
      return;
    }

    if (editId !== null) {
      setAssignments(prev =>
        prev.map(a => (a.id === editId ? { ...a, bus, route, driver, conductor } : a))
      );
      setEditId(null);
    } else {
      setAssignments([{ id: Date.now(), bus, route, driver, conductor }, ...assignments]);
    }

    setFormData({ bus: '', route: '', driver: '', conductor: '' });
  };

  const handleEdit = (assignment: Assignment) => {
    setFormData({
      bus: assignment.bus,
      route: assignment.route,
      driver: assignment.driver,
      conductor: assignment.conductor,
    });
    setEditId(assignment.id);
  };

  const handleRemove = (id: number) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Daily Operations</h1>
        <p className="text-gray-600">Manage daily bus operations and schedules.</p>
      </div>

      {/* Route Section */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">{editingRouteId ? 'Edit Route' : 'Add Route'}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium" htmlFor="routeNumber">Route Number</label>
            <input
              id="routeNumber"
              value={routeNumber}
              onChange={(e) => setRouteNumber(e.target.value)}
              placeholder="e.g., 404"
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium" htmlFor="startLocation">Start Location</label>
            <select
              id="startLocation"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              className="border p-2 rounded w-full"
            >
              <option value="">Select Start Location</option>
              {areaOptions.map((area, i) => (
                <option key={i} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium" htmlFor="endLocation">End Location</label>
            <select
              id="endLocation"
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
              className="border p-2 rounded w-full"
            >
              <option value="">Select End Location</option>
              {areaOptions.map((area, i) => (
                <option key={i} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">Route Name (auto-generated)</label>
            <input
              value={routeName}
              readOnly
              className="border p-2 rounded w-full bg-gray-100"
              placeholder="Route Name will auto-generate"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium" htmlFor="distanceKm">Distance (km)</label>
            <input
              id="distanceKm"
              type="number"
              min="0"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              placeholder="e.g., 12.5"
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium" htmlFor="estimatedDuration">Estimated Duration (minutes)</label>
            <input
              id="estimatedDuration"
              type="number"
              min="0"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              placeholder="e.g., 35"
              className="border p-2 rounded w-full"
            />
          </div>
        </div>

        <button
          onClick={handleAddOrUpdateRoute}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editingRouteId ? 'Update Route' : 'Add Route'}
        </button>

        {/* List of routes */}
        <div className="mt-6 space-y-2 max-h-40 overflow-y-auto">
          {routes.map(route => (
            <div
              key={route.id}
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2 shadow-sm"
            >
              <div>
                <div className="font-medium text-green-700">
                  {route.route_number}: {route.route_name}
                </div>
                <div className="text-sm text-gray-600">
                  Distance: {route.distance_km} km, Duration: {route.estimated_duration_minutes} mins
                </div>
              </div>
              <div className="space-x-2">
                <button onClick={() => handleEditRoute(route)} className="text-blue-600 text-sm">Edit</button>
                <button onClick={() => handleDeleteRoute(route.id)} className="text-red-600 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assignment Form */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{editId ? 'Edit Assignment' : 'Assign Bus to Route'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <select name="bus" value={formData.bus} onChange={handleChange} className="border p-2 rounded-md w-full">
            <option value="">Select Bus</option>
            {buses.filter(b => b.status === 'Active').map(bus => <option key={bus.id}>{bus.name}</option>)}
          </select>
          <select name="route" value={formData.route} onChange={handleChange} className="border p-2 rounded-md w-full">
            <option value="">Select Route</option>
            {routes.map(route => (
              <option key={route.id}>
                {route.route_number}: {route.route_name}
              </option>
            ))}
          </select>
          <select name="driver" value={formData.driver} onChange={handleChange} className="border p-2 rounded-md w-full">
            <option value="">Select Driver</option>
            {drivers.map((driver, i) => <option key={i}>{driver}</option>)}
          </select>
          <select name="conductor" value={formData.conductor} onChange={handleChange} className="border p-2 rounded-md w-full">
            <option value="">Select Conductor</option>
            {conductors.map((conductor, i) => <option key={i}>{conductor}</option>)}
          </select>
        </div>
        <button
          onClick={handleAssign}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {editId ? 'Update Assignment' : 'Assign Duty'}
        </button>
      </div>

      {/* Assignment Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Today's Assignments</h2>
        {assignments.length === 0 ? (
          <p className="text-gray-500">No assignments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Bus</th>
                  <th className="px-4 py-2 border">Route</th>
                  <th className="px-4 py-2 border">Driver</th>
                  <th className="px-4 py-2 border">Conductor</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id}>
                    <td className="px-4 py-2 border">{a.bus}</td>
                    <td className="px-4 py-2 border">{a.route}</td>
                    <td className="px-4 py-2 border">{a.driver}</td>
                    <td className="px-4 py-2 border">{a.conductor}</td>
                    <td className="px-4 py-2 border space-x-2">
                      <button onClick={() => handleEdit(a)} className="text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => handleRemove(a.id)} className="text-red-600 hover:underline">Delete</button>
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
