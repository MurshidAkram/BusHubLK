import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Assignment {
  assignment_id: number;
  date: string;
  bus_id: number;
  route_id: number;
  driver_id: number;
  conductor_id: number;
  status: string;
  notes: string | null;
  bus_number: string;
  route_number: string;
  route_name: string;
  driver_first_name: string;
  driver_last_name: string;
  conductor_first_name: string;
  conductor_last_name: string;
}

interface Bus {
  bus_id: number;
  registration_number: string;
  status: string;
}

interface Route {
  route_id: number;
  route_number: string;
  route_name: string;
}

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
}

const BACKEND_URL = 'http://localhost:5000';

const DailyOperations: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableBuses, setAvailableBuses] = useState<Bus[]>([]);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<User[]>([]);
  const [availableConductors, setAvailableConductors] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    bus_id: '',
    route_id: '',
    driver_id: '',
    conductor_id: '',
    notes: ''
  });

  const fetchAssignments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/assignments?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.statusText}`);
      }

      const data = await response.json();
      setAssignments(data.assignments);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignmentOptions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/assignments/options?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch options: ${response.statusText}`);
      }

      const data = await response.json();
      setAvailableBuses(data.options.buses || []);
      setAvailableRoutes(data.options.routes || []);
      setAvailableDrivers(data.options.drivers || []);
      setAvailableConductors(data.options.conductors || []);
    } catch (err) {
      console.error('Error fetching assignment options:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchAssignmentOptions();
  }, [selectedDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAssign = async () => {
    const { bus_id, route_id, driver_id, conductor_id } = formData;
    
    if (!bus_id || !route_id || !driver_id || !conductor_id) {
      setError('Please select bus, route, driver and conductor');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          date: selectedDate,
          bus_id: parseInt(bus_id),
          route_id: parseInt(route_id),
          driver_id: parseInt(driver_id),
          conductor_id: parseInt(conductor_id),
          notes: formData.notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create assignment');
      }

      const data = await response.json();
      setAssignments([data.assignment, ...assignments]);
      setFormData({
        bus_id: '',
        route_id: '',
        driver_id: '',
        conductor_id: '',
        notes: ''
      });
      
      // Refresh available options
      await fetchAssignmentOptions();
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (assignmentId: number, newStatus: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/assignments/${assignmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedAssignment = await response.json();
      setAssignments(assignments.map(a => 
        a.assignment_id === assignmentId ? updatedAssignment.assignment : a
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (assignmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }

      setAssignments(assignments.filter(a => a.assignment_id !== assignmentId));
      // Refresh available options since this freed up resources
      await fetchAssignmentOptions();
    } catch (err) {
      console.error('Error deleting assignment:', err);
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Daily Operations</h1>
        <p className="text-gray-600">Manage daily bus assignments and schedules.</p>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <input
          type="date"
          id="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="border p-2 rounded-md"
        />
      </div>

      {/* Assignment Form */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Create New Assignment</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Bus Selection */}
          <div>
            <label htmlFor="bus_id" className="block text-sm font-medium text-gray-700 mb-1">
              Bus
            </label>
            <select
              name="bus_id"
              id="bus_id"
              value={formData.bus_id}
              onChange={handleChange}
              className="border p-2 rounded-md w-full"
              disabled={isLoading}
            >
              <option value="">Select Bus</option>
              {availableBuses.map(bus => (
                <option key={bus.bus_id} value={bus.bus_id}>
                  {bus.registration_number} ({bus.status})
                </option>
              ))}
            </select>
          </div>

          {/* Route Selection */}
          <div>
            <label htmlFor="route_id" className="block text-sm font-medium text-gray-700 mb-1">
              Route
            </label>
            <select
              name="route_id"
              id="route_id"
              value={formData.route_id}
              onChange={handleChange}
              className="border p-2 rounded-md w-full"
              disabled={isLoading}
            >
              <option value="">Select Route</option>
              {availableRoutes.map(route => (
                <option key={route.route_id} value={route.route_id}>
                  {route.route_number}: {route.route_name}
                </option>
              ))}
            </select>
          </div>

          {/* Driver Selection */}
          <div>
            <label htmlFor="driver_id" className="block text-sm font-medium text-gray-700 mb-1">
              Driver
            </label>
            <select
              name="driver_id"
              id="driver_id"
              value={formData.driver_id}
              onChange={handleChange}
              className="border p-2 rounded-md w-full"
              disabled={isLoading}
            >
              <option value="">Select Driver</option>
              {availableDrivers.map(driver => (
                <option key={driver.user_id} value={driver.user_id}>
                  {driver.first_name} {driver.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Conductor Selection */}
          <div>
            <label htmlFor="conductor_id" className="block text-sm font-medium text-gray-700 mb-1">
              Conductor
            </label>
            <select
              name="conductor_id"
              id="conductor_id"
              value={formData.conductor_id}
              onChange={handleChange}
              className="border p-2 rounded-md w-full"
              disabled={isLoading}
            >
              <option value="">Select Conductor</option>
              {availableConductors.map(conductor => (
                <option key={conductor.user_id} value={conductor.user_id}>
                  {conductor.first_name} {conductor.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            name="notes"
            id="notes"
            value={formData.notes}
            onChange={handleChange}
            className="border p-2 rounded-md w-full"
            rows={2}
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleAssign}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Create Assignment'}
        </button>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Assignments for {format(new Date(selectedDate), 'MMMM d, yyyy')}</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : assignments.length === 0 ? (
          <p className="text-gray-500 py-4">No assignments for this date.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Bus</th>
                  <th className="px-4 py-2 border">Route</th>
                  <th className="px-4 py-2 border">Driver</th>
                  <th className="px-4 py-2 border">Conductor</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(assignment => (
                  <tr key={assignment.assignment_id}>
                    <td className="px-4 py-2 border">{assignment.bus_number}</td>
                    <td className="px-4 py-2 border">{assignment.route_number}: {assignment.route_name}</td>
                    <td className="px-4 py-2 border">{assignment.driver_first_name} {assignment.driver_last_name}</td>
                    <td className="px-4 py-2 border">{assignment.conductor_first_name} {assignment.conductor_last_name}</td>
                    <td className="px-4 py-2 border">
                      <select
                        value={assignment.status}
                        onChange={(e) => handleStatusChange(assignment.assignment_id, e.target.value)}
                        className="border p-1 rounded"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 border space-x-2">
                      <button 
                        onClick={() => handleDelete(assignment.assignment_id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyOperations;