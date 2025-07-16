import React, { useState, useEffect } from 'react';

interface Incident {
  id: number;
  type: string;
  route: string;
  timeAgo: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Active' | 'Resolved';
  details?: string;
  timestamp: number;
}

const severityColors = {
  Low: 'text-green-600 bg-green-100',
  Medium: 'text-yellow-600 bg-yellow-100',
  High: 'text-red-600 bg-red-100',
};

const initialIncidents: Incident[] = [
  {
    id: 1,
    type: 'Traffic Delay',
    route: '03B',
    timeAgo: '',
    severity: 'Medium',
    status: 'Active',
    timestamp: Date.now() - 15 * 60 * 1000,
  },
  {
    id: 2,
    type: 'Mechanical Issue',
    route: '12A',
    timeAgo: '',
    severity: 'High',
    status: 'Active',
    timestamp: Date.now() - 32 * 60 * 1000,
  },
  {
    id: 3,
    type: 'Breakdown assistance dispatched',
    route: 'LH-3456',
    timeAgo: '',
    severity: 'High',
    status: 'Resolved',
    details: 'Assistance dispatched to bus LH-3456',
    timestamp: Date.now() - 60 * 60 * 1000,
  },
];

function getTimeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours > 1 ? 's' : ''} ago`;
}

const IncidentManagement = () => {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [form, setForm] = useState({
    id: 0,
    type: '',
    route: '',
    severity: 'Low' as 'Low' | 'Medium' | 'High',
    status: 'Active' as 'Active' | 'Resolved',
    details: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIncidents((prev) =>
        prev.map((inc) => ({
          ...inc,
          timeAgo: getTimeAgo(inc.timestamp),
        }))
      );
    }, 60 * 1000);

    setIncidents((prev) =>
      prev.map((inc) => ({
        ...inc,
        timeAgo: getTimeAgo(inc.timestamp),
      }))
    );

    return () => clearInterval(interval);
  }, []);

  const activeIncidents = incidents.filter((i) => i.status === 'Active');
  const resolvedIncidents = incidents.filter((i) => i.status === 'Resolved');

  const resetForm = () => {
    setForm({
      id: 0,
      type: '',
      route: '',
      severity: 'Low',
      status: 'Active',
      details: '',
    });
    setIsEditing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type.trim() || !form.route.trim()) {
      alert('Please fill in the required fields.');
      return;
    }

    if (isEditing) {
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === form.id
            ? { ...form, timestamp: inc.timestamp, timeAgo: getTimeAgo(inc.timestamp) }
            : inc
        )
      );
    } else {
      const newIncident: Incident = {
        id: Date.now(),
        type: form.type,
        route: form.route,
        severity: form.severity,
        status: form.status,
        details: form.details,
        timestamp: Date.now(),
        timeAgo: 'just now',
      };
      setIncidents((prev) => [newIncident, ...prev]);
    }
    resetForm();
  };

  const handleEdit = (incident: Incident) => {
    setForm({
      id: incident.id,
      type: incident.type,
      route: incident.route,
      severity: incident.severity,
      status: incident.status,
      details: incident.details || '',
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this incident?')) {
      setIncidents((prev) => prev.filter((inc) => inc.id !== id));
    }
  };

  const toggleStatus = (id: number) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              status: inc.status === 'Active' ? 'Resolved' : 'Active',
              timestamp: inc.status === 'Active' ? inc.timestamp : Date.now(),
            }
          : inc
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Incident Management</h1>
        <p className="text-gray-600">Manage and respond to incidents effectively.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit Incident' : 'Add New Incident'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1" htmlFor="type">
              Incident Type <span className="text-red-600">*</span>
            </label>
            <input
              id="type"
              type="text"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-indigo-300"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1" htmlFor="route">
              Route / Bus Number <span className="text-red-600">*</span>
            </label>
            <input
              id="route"
              type="text"
              value={form.route}
              onChange={(e) => setForm({ ...form, route: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-indigo-300"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1" htmlFor="severity">
              Severity
            </label>
            <select
              id="severity"
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value as 'Low' | 'Medium' | 'High' })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-indigo-300"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'Active' | 'Resolved' })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-indigo-300"
            >
              <option>Active</option>
              <option>Resolved</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1" htmlFor="details">
              Details / Notes
            </label>
            <textarea
              id="details"
              rows={3}
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-indigo-300"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
            >
              {isEditing ? 'Update Incident' : 'Add Incident'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Active Incidents</h2>
        {activeIncidents.length === 0 ? (
          <p className="text-gray-500">No active incidents currently.</p>
        ) : (
          <ul className="space-y-4">
            {activeIncidents.map(({ id, type, route, timeAgo, severity, details }) => (
              <li key={id} className="border rounded p-4 flex justify-between items-center space-x-4">
                <div className="flex-grow">
                  <p className="font-semibold">{type}</p>
                  <p className="text-sm text-gray-600">Route / Bus: {route}</p>
                  <p className="text-xs text-gray-500">{timeAgo}</p>
                  {details && <p className="mt-1 text-gray-700">{details}</p>}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${severityColors[severity]}`}>
                    {severity}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(incidents.find((inc) => inc.id === id)!)}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleStatus(id)}
                      className="text-green-600 hover:underline text-sm"
                      title="Mark as Resolved"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleDelete(id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Resolved Incidents</h2>
        {resolvedIncidents.length === 0 ? (
          <p className="text-gray-500">No resolved incidents yet.</p>
        ) : (
          <ul className="space-y-4">
            {resolvedIncidents.map(({ id, type, route, timeAgo, severity, details }) => (
              <li key={id} className="border rounded p-4">
                <p className="font-semibold">{type}</p>
                <p className="text-sm text-gray-600">Route / Bus: {route}</p>
                <p className="text-xs text-gray-500">{timeAgo}</p>
                {details && <p className="mt-1 text-gray-700">{details}</p>}
                <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${severityColors[severity]}`}>
                  {severity}
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => handleEdit(incidents.find((inc) => inc.id === id)!)}
                    className="text-indigo-600 hover:underline text-sm mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(id)}
                    className="text-yellow-600 hover:underline text-sm"
                    title="Mark as Active"
                  >
                    Reactivate
                  </button>
                  <button
                    onClick={() => handleDelete(id)}
                    className="text-red-600 hover:underline text-sm ml-4"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default IncidentManagement;
