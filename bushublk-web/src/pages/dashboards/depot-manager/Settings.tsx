import React, { useState } from 'react';

const Settings: React.FC = () => {
  const [depotName, setDepotName] = useState('Central City Depot');
  const [location, setLocation] = useState('123 Main Street, Colombo');
  const [contactNumber, setContactNumber] = useState('+94 77 123 4567');
  const [email, setEmail] = useState('centraldepot@example.com');
  const [operatingHours, setOperatingHours] = useState('06:00 AM - 10:00 PM');
  const [busCapacity, setBusCapacity] = useState(50);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Depot profile updated successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Depot Profile Display */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Depot Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 text-sm">
          <div><span className="font-medium">Depot Name:</span> {depotName}</div>
          <div><span className="font-medium">Location:</span> {location}</div>
          <div><span className="font-medium">Contact Number:</span> {contactNumber}</div>
          <div><span className="font-medium">Email:</span> {email}</div>
          <div><span className="font-medium">Operating Hours:</span> {operatingHours}</div>
          <div><span className="font-medium"> Bus count:</span> {busCapacity}</div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Depot Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block font-medium text-gray-700">Depot Name</label>
            <input
              type="text"
              value={depotName}
              onChange={(e) => setDepotName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700">Contact Number</label>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700">Operating Hours</label>
            <input
              type="text"
              value={operatingHours}
              onChange={(e) => setOperatingHours(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700">Bus count</label>
            <input
              type="number"
              value={busCapacity}
              onChange={(e) => setBusCapacity(parseInt(e.target.value))}
              min={1}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
