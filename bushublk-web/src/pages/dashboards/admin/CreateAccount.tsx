// pages/dashboard/admin/CreateAccount.tsx
import React, { useState, useContext } from 'react';
import { HiArrowLeft } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../../context/AppContext';

const CreateAccount = () => {
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'defaultPassword123', // In production, generate a secure random password
    role: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    'depot_manager',
    'depot_operations_manager',
    'depot_engineer',
    'regional_technical_officer',
    'regional_operations_officer',
    'dgm_technical',
    'dgm_operations',
    'ceo'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context?.token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      navigate('/admin/employees'); // Redirect after success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-blue-600 mb-4">
        <HiArrowLeft className="mr-1" /> Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Create New Account</h1>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
            required
          >
            <option value="">Select Role</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAccount