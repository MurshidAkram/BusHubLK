import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../context/AppContext';
import { toast } from 'react-toastify';

interface Depot {
  depot_id: string;
  depot_name: string;
  region_id: string;
  region_name: string;
}

interface Region {
  region_id: string;
  region_name: string;
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
  const [regions, setRegions] = useState<Region[]>([]);
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
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [depotFilter, setDepotFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [showDepotDropdown, setShowDepotDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [filteredDepots, setFilteredDepots] = useState<Depot[]>([]);
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([]);

  useEffect(() => {
    fetchRoutes();
    fetchDepots();
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/regions', {
        headers: { Authorization: `Bearer ${context?.token}` },
      });
      const data = await res.json();
      setRegions(data.regions || []);
    } catch {
      toast.error('Error fetching regions');
    }
  };

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

  const handleDepotFilterChange = (value: string) => {
    setDepotFilter(value);
    if (value.trim()) {
      const filtered = depots.filter(depot =>
        depot.depot_name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredDepots(filtered);
      setShowDepotDropdown(true);
    } else {
      setFilteredDepots([]);
      setShowDepotDropdown(false);
    }
  };

  const handleRegionFilterChange = (value: string) => {
    setRegionFilter(value);
    if (value.trim()) {
      const filtered = regions.filter(region =>
        region.region_name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredRegions(filtered);
      setShowRegionDropdown(true);
    } else {
      setFilteredRegions([]);
      setShowRegionDropdown(false);
    }
  };

  const selectDepotFilter = (depot: Depot) => {
    setDepotFilter(depot.depot_name);
    setShowDepotDropdown(false);
  };

  const selectRegionFilter = (region: Region) => {
    setRegionFilter(region.region_name);
    setShowRegionDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.route_number ||
      !form.route_name ||
      !form.depot_id ||
      !form.start_location ||
      !form.end_location ||
      !form.distance_km
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
    });
  };

  const filteredRoutes = routes.filter(
    (r) => {
      const matchesSearch = searchTerm === '' ||
        r.route_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.start_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.end_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.depot_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepot = depotFilter === '' ||
        r.depot_name.toLowerCase().includes(depotFilter.toLowerCase());

      const matchesRegion = regionFilter === '' ||
        regions.some(reg =>
          reg.region_name.toLowerCase().includes(regionFilter.toLowerCase()) &&
          depots.some(d => d.depot_id === r.depot_id && d.region_id === reg.region_id)
        );

      return matchesSearch && matchesDepot && matchesRegion;
    }
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Route Management</h1>

      {/* ✅ Enhanced search and filter row */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <input
            type="text"
            placeholder="Search routes..."
            className="w-full md:w-1/3 border border-gray-300 rounded-md px-4 py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Depot Filter */}
          <div className="relative w-full md:w-1/4">
            <input
              type="text"
              placeholder="Filter by depot..."
              className="w-full border border-gray-300 rounded-md px-4 py-2"
              value={depotFilter}
              onChange={(e) => handleDepotFilterChange(e.target.value)}
              onFocus={() => depotFilter && setShowDepotDropdown(true)}
              onBlur={() => setTimeout(() => setShowDepotDropdown(false), 200)}
            />
            {showDepotDropdown && filteredDepots.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                {filteredDepots.map((depot) => (
                  <div
                    key={depot.depot_id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => selectDepotFilter(depot)}
                  >
                    {depot.depot_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Region Filter */}
          <div className="relative w-full md:w-1/4">
            <input
              type="text"
              placeholder="Filter by region..."
              className="w-full border border-gray-300 rounded-md px-4 py-2"
              value={regionFilter}
              onChange={(e) => handleRegionFilterChange(e.target.value)}
              onFocus={() => regionFilter && setShowRegionDropdown(true)}
              onBlur={() => setTimeout(() => setShowRegionDropdown(false), 200)}
            />
            {showRegionDropdown && filteredRegions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                {filteredRegions.map((region) => (
                  <div
                    key={region.region_id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => selectRegionFilter(region)}
                  >
                    {region.region_name}
                  </div>
                ))}
              </div>
            )}
          </div>

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
                });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Route
            </button>
            <button
              onClick={() => {
                fetchRoutes();
                setDepotFilter('');
                setRegionFilter('');
                setSearchTerm('');
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>
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
              <th className="px-4 py-2 text-right">Actions</th>

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
                <td className="px-4 py-2 text-center">
                  <button
                    className="text-blue-600 hover:underline mr-2"
                    onClick={() => handleEdit(route)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDelete(route.route_id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredRoutes.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
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
