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

  const [formData, setFormData] = useState({
    bus: '',
    route: '',
    driver: '',
    conductor: '',
  });

  const [editId, setEditId] = useState<number | null>(null);

  const drivers = [
    'Nimal Perera', 'Sunil Fernando', 'Sarath Silva', 'Ajith Kumara', 'Kamal Jayasuriya',
    'Ruwan Lakmal', 'Dinesh Rathnayake', 'Chamara Gunasekara', 'Anura Dissanayake', 'Tharindu Wijesinghe'
  ];

  const conductors = [
    'Ranjith Bandara', 'Suresh Liyanage', 'Mahinda Rajakaruna', 'Pubudu Kumara', 'Nalaka Priyantha',
    'Bandara Herath', 'Saman Jayantha', 'Amal Dissanayake', 'Indika Wijeratne', 'Lakshitha Gamage'
  ];

  // Fetch all routes from backend
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

  // Assignment form handlers
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

      {/* Assignment Form */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{editId ? 'Edit Assignment' : 'Assign Bus to Route'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <select name="bus" value={formData.bus} onChange={handleChange} className="border p-2 rounded-md w-full">
            <option value="">Select Bus</option>
            {buses.filter(b => b.status === 'Active').map(bus => (
              <option key={bus.id} value={bus.name}>{bus.name}</option>
            ))}
          </select>
          <select name="route" value={formData.route} onChange={handleChange} className="border p-2 rounded-md w-full">
            <option value="">Select Route</option>
            {routes.map(route => (
              <option key={route.id} value={`${route.route_number}: ${route.route_name}`}>
                {route.route_number}: {route.route_name}
              </option>
            ))}
          </select>
          <select name="driver" value={formData.driver} onChange={handleChange} className="border p-2 rounded-md w-full">
            <option value="">Select Driver</option>
            {drivers.map((driver, i) => <option key={i} value={driver}>{driver}</option>)}
          </select>
          <select name="conductor" value={formData.conductor} onChange={handleChange} className="border p-2 rounded-md w-full">
            <option value="">Select Conductor</option>
            {conductors.map((conductor, i) => <option key={i} value={conductor}>{conductor}</option>)}
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
