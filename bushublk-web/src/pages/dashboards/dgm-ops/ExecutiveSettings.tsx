import React, { useState } from 'react';
import type { FormEvent } from 'react';

const ExecutiveSettings: React.FC = () => {
  const [regionName, setRegionName] = useState('Western Province');
  const [numberOfDepots, setNumberOfDepots] = useState(8);
  const [activeRoutes, setActiveRoutes] = useState(120);
  const [fleetSize, setFleetSize] = useState(250);
  const [remarks, setRemarks] = useState('All operations running smoothly.');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    alert('Executive settings updated successfully!');
  };

  return (
   <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Executive Settings</h1>
        <p className="text-gray-600">
          Manage region-wide operational settings and overview.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Region Overview</h2>
        <ul className="space-y-2 text-gray-700">
          <li><strong>Region Name:</strong> {regionName}</li>
          <li><strong>Number of Depots:</strong> {numberOfDepots}</li>
          <li><strong>Active Routes:</strong> {activeRoutes}</li>
          <li><strong>Fleet Size:</strong> {fleetSize}</li>
          <li><strong>Remarks:</strong> {remarks}</li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Settings</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Region Name</label>
            <input
              type="text"
              value={regionName}
              onChange={(e) => setRegionName(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Number of Depots</label>
            <input
              type="number"
              value={numberOfDepots}
              onChange={(e) => setNumberOfDepots(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Active Routes</label>
            <input
              type="number"
              value={activeRoutes}
              onChange={(e) => setActiveRoutes(Math.max(0, parseInt(e.target.value) || 0))}
              min={0}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fleet Size</label>
            <input
              type="number"
              value={fleetSize}
              onChange={(e) => setFleetSize(Math.max(0, parseInt(e.target.value) || 0))}
              min={0}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExecutiveSettings;
