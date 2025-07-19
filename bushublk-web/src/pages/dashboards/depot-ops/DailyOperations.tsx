import React, { useState } from 'react';

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
  name: string;
}

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

  const [routes, setRoutes] = useState<Route[]>([
    { id: 1, name: '404: Pettah → Fort → Galle Face' },
    { id: 2, name: '406: Kandy → Peradeniya → Mawanella' },
    { id: 3, name: '407: Colombo → Wellawatte → Dehiwala' },
    { id: 4, name: '408: Panadura → Mount Lavinia → Bambalapitiya' },
  ]);

  const [routeNumber, setRouteNumber] = useState('');
  const [routeStops, setRouteStops] = useState<string[]>([]);
  const [selectedStop, setSelectedStop] = useState('');
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);

  const areaOptions = [
    'Pettah', 'Kotte', 'Galle Face', 'Wellawatte', 'Dehiwala', 'Panadura',
    'Fort', 'Bambalapitiya', 'Mount Lavinia', 'Kandy', 'Peradeniya',
    'Kadugannawa', 'Mawanella', 'Colombo', 'Gampaha', 'Kiribathgoda'
  ];

  const [drivers] = useState<string[]>([
    'Nimal Perera', 'Sunil Fernando', 'Sarath Silva', 'Ajith Kumara', 'Kamal Jayasuriya',
    'Ruwan Lakmal', 'Dinesh Rathnayake', 'Chamara Gunasekara', 'Anura Dissanayake', 'Tharindu Wijesinghe'
  ]);

  const [conductors] = useState<string[]>([
    'Ranjith Bandara', 'Suresh Liyanage', 'Mahinda Rajakaruna', 'Pubudu Kumara', 'Nalaka Priyantha',
    'Bandara Herath', 'Saman Jayantha', 'Amal Dissanayake', 'Indika Wijeratne', 'Lakshitha Gamage'
  ]);

  const [formData, setFormData] = useState({
    bus: '',
    route: '',
    driver: '',
    conductor: '',
  });

  const [editId, setEditId] = useState<number | null>(null);

  const handleAddRouteStop = () => {
    if (selectedStop && !routeStops.includes(selectedStop)) {
      setRouteStops([...routeStops, selectedStop]);
    }
  };

  const handleRemoveStop = (stop: string) => {
    setRouteStops(routeStops.filter(s => s !== stop));
  };

  const handleAddOrUpdateRoute = () => {
    if (!routeNumber.trim() || routeStops.length < 2) return;
    const routeName = `${routeNumber.trim()}: ${routeStops.join(' → ')}`;

    if (editingRouteId !== null) {
      setRoutes(prev => prev.map(r => r.id === editingRouteId ? { ...r, name: routeName } : r));
      setEditingRouteId(null);
    } else {
      setRoutes([...routes, { id: Date.now(), name: routeName }]);
    }

    setRouteNumber('');
    setRouteStops([]);
    setSelectedStop('');
  };

  const handleEditRoute = (route: Route) => {
    const [num, ...stops] = route.name.split(/: | → /);
    setRouteNumber(num);
    setRouteStops(stops);
    setEditingRouteId(route.id);
  };

  const handleDeleteRoute = (id: number) => {
    setRoutes(routes.filter((r) => r.id !== id));
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAssign = () => {
    const { bus, route, driver, conductor } = formData;
    if (!bus || !route || !driver || !conductor) return;

    if (editId !== null) {
      setAssignments((prev) =>
        prev.map((a) => (a.id === editId ? { ...a, bus, route, driver, conductor } : a))
      );
      setEditId(null);
    } else {
      setAssignments([
        { id: Date.now(), bus, route, driver, conductor },
        ...assignments,
      ]);
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
    setAssignments(assignments.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6 ">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Daily Operations</h1>
        <p className="text-gray-600">Manage daily bus operations and schedules.</p>
      </div>

      {/* Route Section */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">{editingRouteId ? 'Edit Route' : 'Add Route'}</h2>
        <input
          value={routeNumber}
          onChange={(e) => setRouteNumber(e.target.value)}
          placeholder="Route Number (e.g., Route 404)"
          className="border p-2 rounded w-full mb-2"
        />
        <div className="flex gap-2 mb-2">
          <select value={selectedStop} onChange={(e) => setSelectedStop(e.target.value)} className="border p-2 rounded w-full">
            <option value="">Select Stop</option>
            {areaOptions.map((area, i) => (
              <option key={i} value={area}>{area}</option>
            ))}
          </select>
          <button onClick={handleAddRouteStop} className="bg-green-600 text-white px-4 py-2 rounded">Add Stop</button>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {routeStops.map((stop, i) => (
            <span key={i} className="bg-gray-200 px-3 py-1 rounded-full flex items-center gap-1">
              {stop}
              <button onClick={() => handleRemoveStop(stop)} className="text-red-500 ml-1">×</button>
            </span>
          ))}
        </div>
        <button onClick={handleAddOrUpdateRoute} className="bg-blue-600 text-white px-4 py-2 rounded">
          {editingRouteId ? 'Update Route' : 'Add Route'}
        </button>
        <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
          {routes.map((route) => (
            <div
              key={route.id}
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2 shadow-sm"
            >
              <span className="text-green-700 font-medium">{route.name}</span>
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
            {buses.filter(b => b.status === 'Active').map((bus) => <option key={bus.id}>{bus.name}</option>)}
          </select>
          <select name="route" value={formData.route} onChange={handleChange} className="border p-2 rounded-md w-full">
            <option value="">Select Route</option>
            {routes.map((route) => <option key={route.id}>{route.name}</option>)}
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
                {assignments.map((a) => (
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
