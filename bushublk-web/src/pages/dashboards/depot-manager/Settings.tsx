import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../context/AppContext';

const Settings: React.FC = () => {
  const appContext = useContext(AppContext);
  if (!appContext) return <div>Loading...</div>;
  const { user, token } = appContext;
  const depotId = user?.depot_id; // get depot_id from user context

  const [depotName, setDepotName] = useState('');
  const [location, setLocation] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [busCapacity, setBusCapacity] = useState(0);
  const [error, setError] = useState('');

  // Fetch depot profile on mount
  useEffect(() => {
    if (!depotId || !token) return;
    const fetchDepotProfile = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/depots/${depotId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Depot fetch error:', res.status, errorText);
          throw new Error('Failed to fetch depot');
        }
        const data = await res.json();
        setDepotName(data.depot_name || '');
        setLocation(data.address || '');
        setContactNumber(data.contact_phone || '');
        setBusCapacity(data.bus_count || 0);
      } catch (err) {
        setError('Could not load depot profile.');
        console.error('Could not load depot profile:', err);
      }
    };
    fetchDepotProfile();
  }, [depotId, token]);

  // Save changes to depot profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depotId || !token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/depots/${depotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          depot_name: depotName,
          address: location,
          contact_phone: contactNumber
        })
      });
      if (!res.ok) throw new Error('Failed to update depot');
      const data = await res.json();
      setDepotName(data.depot_name || '');
      setLocation(data.address || '');
      setContactNumber(data.contact_phone || '');
      setBusCapacity(data.bus_count || 0);
      alert('Depot profile updated successfully!');
    } catch (err) {
      setError('Failed to update depot profile.');
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="text-red-500">{error}</div>}
      {/* Depot Profile Display */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Depot Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 text-sm">
          <div><span className="font-medium">Depot Name:</span> {depotName}</div>
          <div><span className="font-medium">Location:</span> {location}</div>
          <div><span className="font-medium">Contact Number:</span> {contactNumber}</div>
          <div><span className="font-medium">Bus count:</span> {busCapacity}</div>
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
