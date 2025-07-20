import React, { useState } from 'react';

const OpsSettings = () => {
  const [regionName, setRegionName] = useState('Western Province Region');
  const [headOfficeLocation, setHeadOfficeLocation] = useState('45 Regional HQ, Colombo');
  const [contactNumber, setContactNumber] = useState('+94 71 234 5678');
  const [email, setEmail] = useState('regionaloffice@example.com');
  const [operatingHours, setOperatingHours] = useState('05:00 AM - 11:00 PM');
  const [numberOfDepots, setNumberOfDepots] = useState(8);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Regional profile updated successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Regional Profile Display */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Regional Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <div><span className="font-medium">Region Name:</span> {regionName}</div>
          <div><span className="font-medium">Head Office:</span> {headOfficeLocation}</div>
          <div><span className="font-medium">Contact Number:</span> {contactNumber}</div>
          <div><span className="font-medium">Email:</span> {email}</div>
          <div><span className="font-medium">Operating Hours:</span> {operatingHours}</div>
          <div><span className="font-medium">Number of Depots:</span> {numberOfDepots}</div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Regional Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Region Name</label>
            <input
              type="text"
              value={regionName}
              onChange={(e) => setRegionName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Head Office</label>
            <input
              type="text"
              value={headOfficeLocation}
              onChange={(e) => setHeadOfficeLocation(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Number</label>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Operating Hours</label>
            <input
              type="text"
              value={operatingHours}
              onChange={(e) => setOperatingHours(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Number of Depots</label>
            <input
              type="number"
              value={numberOfDepots}
              onChange={(e) => setNumberOfDepots(parseInt(e.target.value))}
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

export default OpsSettings;
