// pages/dashboard/admin/CreateAccount.tsx
import React, { useState, useContext } from 'react';
import { HiArrowLeft } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../../context/AppContext';

const CreateAccount = () => {
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: 'defaultPassword123',
    first_name: '',
    last_name: '',
    phone: '',
    role_name: '',
    role_data: {
      depot_id: '',
      region_id: '',
      appointment_date: new Date().toISOString().split('T')[0]
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roles = [
    'ceo',
    'dgm_technical',
    'dgm_operations',
    'regional_tech',
    'regional_operations',
    'depot_manager',
    'depot_operations',
    'depot_engineer',
    'driver',
    'conductor',
    'admin'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context?.token}`
        },
        body: JSON.stringify({
          ...formData,
          // Only include role_data if the role requires it
          role_data: ['regional_tech', 'regional_operations', 'depot_manager', 
                     'depot_operations', 'depot_engineer', 'driver', 'conductor'].includes(formData.role_name) 
                     ? formData.role_data 
                     : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
      // Handle validation errors properly
      if (data.errors && Array.isArray(data.errors)) {
        // Format validation errors nicely
        const errorMessages = data.errors.map((err: any) => err.msg).join(', ');
        throw new Error(errorMessages);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Failed to create user');
      }
    }

      setSuccess('Account created successfully!');
      setTimeout(() => {
        navigate('/admin/employees');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value;
    setFormData({
      ...formData,
      role_name: role,
      role_data: {
        depot_id: '',
        region_id: '',
        appointment_date: new Date().toISOString().split('T')[0]
      }
    });
  };

  const requiresLocationInfo = ['regional_tech', 'regional_operations', 'depot_manager', 
                              'depot_operations', 'depot_engineer', 'driver', 'conductor'].includes(formData.role_name);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-blue-600 mb-4 hover:text-blue-800 transition-colors"
      >
        <HiArrowLeft className="mr-1" /> Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Create New Employee Account</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-200">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.first_name}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.last_name}
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.role_name}
            onChange={handleRoleChange}
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

        {requiresLocationInfo && (
          <>
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Role-Specific Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region ID
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.role_data.region_id}
                    onChange={(e) => setFormData({
                      ...formData,
                      role_data: {
                        ...formData.role_data,
                        region_id: e.target.value
                      }
                    })}
                    required={requiresLocationInfo}
                  />
                </div>

                {['depot_manager', 'depot_operations', 'depot_engineer', 'driver', 'conductor'].includes(formData.role_name) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Depot ID
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.role_data.depot_id}
                      onChange={(e) => setFormData({
                        ...formData,
                        role_data: {
                          ...formData.role_data,
                          depot_id: e.target.value
                        }
                      })}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appointment Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.role_data.appointment_date}
                  onChange={(e) => setFormData({
                    ...formData,
                    role_data: {
                      ...formData.role_data,
                      appointment_date: e.target.value
                    }
                  })}
                />
              </div>
            </div>
          </>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAccount;