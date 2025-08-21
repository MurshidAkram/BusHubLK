import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../../context/AppContext';
import { toast } from 'react-toastify';

interface Depot {
  depot_id: string;
  depot_name: string;
}

interface Route {
  route_id: string;
  route_number: string;
  route_name: string;
  depot_id: string;
  depot_name: string;
  start_location: string;
  end_location: string;
  distance_km: number;
  estimated_duration_minutes: number;
  is_active: boolean;
}

const RoutesMngmnt: React.FC = () => {
  const context = useContext(AppContext);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    route_number: '',
    route_name: '',
    depot_id: '',
    start_location: '',
    end_location: '',
    distance_km: '',
    estimated_duration_minutes: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();


  useEffect(() => {
    fetchRoutes();
    fetchDepots();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/routes', {
        headers: { Authorization: `Bearer ${context?.token}` },
      });
      const data = await res.json();
      setRoutes(data.routes || []);
    } catch {
      toast.error('Error fetching routes');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepots = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/depots', {
        headers: { Authorization: `Bearer ${context?.token}` },
      });
      const data = await res.json();
      console.log('Depots:', data.depots); // Debug line
      setDepots(data.depots || []);
    } catch {
      toast.error('Error fetching depots');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Update form values
    const updatedForm = {
      ...form,
      [name]: value,
    };

    // Auto-generate route_name if start or end location changes
    if (name === 'start_location' || name === 'end_location') {
      updatedForm.route_name = `${updatedForm.start_location} - ${updatedForm.end_location}`;
    }

    setForm(updatedForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.route_number ||
      !form.route_name ||
      !form.depot_id ||
      !form.start_location ||
      !form.end_location ||
      !form.distance_km ||
      !form.estimated_duration_minutes
    ) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId
        ? `http://localhost:5000/api/routes/${editId}`
        : 'http://localhost:5000/api/routes';
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${context?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          distance_km: Number(form.distance_km),
          estimated_duration_minutes: Number(form.estimated_duration_minutes),
        }),
      });
      if (!res.ok) throw new Error('Failed');
      await fetchRoutes();
      setShowForm(false);
      setEditId(null);
      setForm({
        route_number: '',
        route_name: '',
        depot_id: depots[0]?.depot_id || '',
        start_location: '',
        end_location: '',
        distance_km: '',
        estimated_duration_minutes: '',
      });
      toast.success(editId ? 'Route updated' : 'Route added');
    } catch {
      toast.error('Error saving route');
    }
  };

  const handleEdit = (route: Route) => {
    setEditId(route.route_id);
    setShowForm(true);
    setForm({
      route_number: route.route_number,
      route_name: route.route_name,
      depot_id: route.depot_id,
      start_location: route.start_location,
      end_location: route.end_location,
      distance_km: route.distance_km.toString(),
      estimated_duration_minutes: route.estimated_duration_minutes.toString(),
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this route?')) return;
    try {
      await fetch(`http://localhost:5000/api/routes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${context?.token}` },
      });
      await fetchRoutes();
      toast.success('Route deleted');
    } catch {
      toast.error('Error deleting route');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditId(null);
    setForm({
      route_number: '',
      route_name: '',
      depot_id: depots[0]?.depot_id || '',
      start_location: '',
      end_location: '',
      distance_km: '',
      estimated_duration_minutes: '',
    });
  };

  const filteredRoutes = routes.filter(
    (r) =>
      r.route_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.start_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.end_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.depot_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Route Management</h1>

      {/* ✅ Only one search + button row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <input
          type="text"
          placeholder="Search by depot name"
          className="w-full md:w-1/2 border border-gray-300 rounded-md px-4 py-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowForm(true);
              setEditId(null);
              setForm({
                route_number: '',
                route_name: '',
                depot_id: depots[0]?.depot_id || '',
                start_location: '',
                end_location: '',
                distance_km: '',
                estimated_duration_minutes: '',
              });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Route
          </button>
          <button
            onClick={fetchRoutes}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {showForm && (
        <form
          className="bg-white rounded-lg shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="block text-gray-700 mb-1">Route Number</label>
            <input
              name="route_number"
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={form.route_number}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Route Name</label>
            <input
              name="route_name"
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={form.route_name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Depot</label>
            <select
              name="depot_id"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={form.depot_id}
              onChange={handleChange}
              required
            >
              {depots.length === 0 ? (
                <option value="">Loading depots...</option>
              ) : (
                depots.map((d) => (
                  <option key={d.depot_id} value={d.depot_id}>
                    {d.depot_name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Start Location</label>
            <input
              name="start_location"
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={form.start_location}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">End Location</label>
            <input
              name="end_location"
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={form.end_location}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Distance (km)</label>
            <input
              name="distance_km"
              type="number"
              min={1}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={form.distance_km}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Estimated Duration (min)</label>
            <input
              name="estimated_duration_minutes"
              type="number"
              min={1}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={form.estimated_duration_minutes}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-span-2 flex gap-2 mt-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              {editId ? 'Update Route' : 'Add Route'}
            </button>
            <button
              type="button"
              className="bg-gray-200 px-6 py-2 rounded hover:bg-gray-300"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
   
      <div className="bg-white rounded-lg shadow-sm p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Route No.</th>
              <th className="px-4 py-2 text-left">Route Name</th>
              <th className="px-4 py-2 text-left">Depot</th>
              <th className="px-4 py-2 text-left">Start</th>
              <th className="px-4 py-2 text-left">End</th>
              <th className="px-4 py-2 text-right">Distance (km)</th>
              <th className="px-4 py-2 text-right">Est. Duration (min)</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoutes.map((route) => (
              <tr key={route.route_id} className="border-b">
                <td className="px-4 py-2">{route.route_number}</td>
                <td className="px-4 py-2">{route.route_name}</td>
                <td className="px-4 py-2">{route.depot_name || 'N/A'}</td>
                <td className="px-4 py-2">{route.start_location}</td>
                <td className="px-4 py-2">{route.end_location}</td>
                <td className="px-4 py-2 text-right">{route.distance_km}</td>
                <td className="px-4 py-2 text-right">{route.estimated_duration_minutes}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    className="text-blue-600 hover:underline mr-2"
                    onClick={() => handleEdit(route)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline mr-2"
                    onClick={() => handleDelete(route.route_id)}
                  >
                    Delete
                  </button>
                  <button
                    className="text-emerald-600 hover:underline mr-2"
                    onClick={() => navigate(`/admin/routes/${route.route_id}/fares`)}
                  >
                    Fares
                  </button>
                </td>
              </tr>
            ))}
            {filteredRoutes.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  No routes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoutesMngmnt;
