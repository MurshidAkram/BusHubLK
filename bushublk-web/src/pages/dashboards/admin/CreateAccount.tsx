// pages/dashboard/admin/CreateAccount.tsx
import React, { useState } from 'react';
import { HiArrowLeft } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

const CreateAccount = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    depot: '',
    sendCredentials: true,
  });

  const roles = [
    'Depot Manager',
    'Operations Manager',
    'Depot Engineer',
    'Regional Officer',
    'DGM (Operations)',
    'DGM (Technical)',
  ];

  const depots = [
    'Colombo Central',
    'Kandy',
    'Galle',
    'Jaffna',
    'Kurunegala',
    'Anuradhapura',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Account created:', formData);
    // Mock success - replace with API call
    alert('Account created successfully!');
    navigate('/admin/employees');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-blue-600 mb-4"
      >
        <HiArrowLeft className="mr-1" /> Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Create New Account</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              required
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Depot (if applicable)</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.depot}
              onChange={(e) => setFormData({...formData, depot: e.target.value})}
            >
              <option value="">Select Depot</option>
              {depots.map((depot) => (
                <option key={depot} value={depot}>{depot}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="sendCredentials"
            className="h-4 w-4 text-blue-600 rounded"
            checked={formData.sendCredentials}
            onChange={(e) => setFormData({...formData, sendCredentials: e.target.checked})}
          />
          <label htmlFor="sendCredentials" className="ml-2 text-sm text-gray-700">
            Send login credentials via email
          </label>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAccount;