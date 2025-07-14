import React, { useState } from 'react';

const OperationsSettings = () => {
  const [depotName, setDepotName] = useState('Central City Depot');
  const [location, setLocation] = useState('123 Main Street, Colombo');
  const [contactNumber, setContactNumber] = useState('+94 77 123 4567');
  const [email, setEmail] = useState('centraldepot@example.com');
  const [operatingHours, setOperatingHours] = useState('06:00 AM - 10:00 PM');
  const [busCapacity, setBusCapacity] = useState(50);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Depot settings updated successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Operations Settings</h1>
        <p className="text-gray-600">Manage your operations settings and preferences.</p>
      </div>

      {/* View Depot Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Depot Profile</h2>
        <ul className="space-y-2 text-gray-700">
          <li><strong>Depot Name:</strong> {depotName}</li>
          <li><strong>Location:</strong> {location}</li>
          <li><strong>Contact Number:</strong> {contactNumber}</li>
          <li><strong>Email:</strong> {email}</li>
          <li><strong>Operating Hours:</strong> {operatingHours}</li>
          <li><strong>Max Bus Capacity:</strong> {busCapacity}</li>
        </ul>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Depot Settings</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Depot Name</label>
            <input
              type="text"
              value={depotName}
              onChange={(e) => setDepotName(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Number</label>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Operating Hours</label>
            <input
              type="text"
              value={operatingHours}
              onChange={(e) => setOperatingHours(e.target.value)}
              placeholder="e.g., 06:00 AM - 10:00 PM"
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Max Bus Capacity</label>
            <input
              type="number"
              value={busCapacity}
              onChange={(e) => setBusCapacity(parseInt(e.target.value))}
              min={1}
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

export default OperationsSettings;
