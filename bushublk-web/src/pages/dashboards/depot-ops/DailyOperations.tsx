import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../context/AppContext';

interface Assignment {
  assignment_id: number;
  bus_id: number;
  bus_registration: string;
  route_id: number;
  route_name: string;
  driver_id: number;
  driver_name: string;
  conductor_id: number;
  conductor_name: string;
  depot_id: number;
  assignment_date: string;
  shift_start_time: string;
  shift_end_time: string;
  status: string;
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

// CHANGED: The user object interface now expects 'id' instead of 'user_id'
interface User {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
}

const DailyOperations: React.FC = () => {
  const { user, token } = useContext(AppContext);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [conductors, setConductors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const initialFormData = {
    bus_id: '',
    route_id: '',
    driver_id: '',
    conductor_id: '',
    assignment_date: getTodayString(),
    shift_start_time: '06:00',
    shift_end_time: '18:00',
    status: 'Scheduled',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !user.depot_id || !token) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Fetch Buses
        const busesRes = await fetch(`http://localhost:5000/api/buses/depot/${user.depot_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!busesRes.ok) throw new Error('Failed to fetch buses');
        const busesData = await busesRes.json();
        setBuses(busesData.buses.filter((b: Bus) => b.status === 'Active'));

        // Fetch Routes
        const routesRes = await fetch(`http://localhost:5000/api/routes/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!routesRes.ok) throw new Error('Failed to fetch routes');
        const routesData = await routesRes.json();
        setRoutes(routesData.routes);

        // Fetch Users
        const usersRes = await fetch(`http://localhost:5000/api/users/depot/${user.depot_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!usersRes.ok) throw new Error('Failed to fetch users');
        const usersData = await usersRes.json();
        
        setDrivers(usersData.users.filter((u: User) => u.role === 'driver'));
        setConductors(usersData.users.filter((u: User) => u.role === 'conductor'));

        // Fetch Assignments
        const assignmentsRes = await fetch(`http://localhost:5000/api/assignments/depot/${user.depot_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!assignmentsRes.ok) throw new Error('Failed to fetch assignments');
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData.assignments);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, token]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.bus_id || !formData.route_id || !formData.driver_id || !formData.conductor_id) {
      setError('Please fill all fields');
      return;
    }

    try {
      const url = editId !== null 
        ? `http://localhost:5000/api/assignments/${editId}`
        : 'http://localhost:5000/api/assignments';
      
      const method = editId !== null ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          depot_id: user?.depot_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.msg || errorData.error || 'Failed to save assignment');
      }
      
      const result = await response.json();
      if (editId !== null) {
        setAssignments(prev => prev.map(a => a.assignment_id === editId ? result.assignment : a));
      } else {
        setAssignments(prev => [result.assignment, ...prev]);
      }
      setFormData(initialFormData);
      setEditId(null);
    } catch (err) {
      console.error('Error saving assignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to save assignment');
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setEditId(assignment.assignment_id);
    setFormData({
      bus_id: String(assignment.bus_id),
      route_id: String(assignment.route_id),
      driver_id: String(assignment.driver_id),
      conductor_id: String(assignment.conductor_id),
      assignment_date: new Date(assignment.assignment_date).toISOString().split('T')[0],
      shift_start_time: assignment.shift_start_time.slice(0, 5),
      shift_end_time: assignment.shift_end_time.slice(0, 5),
      status: assignment.status,
    });
    window.scrollTo(0, 0);
  };

  const handleDelete = async (assignmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }
      setAssignments(prev => prev.filter(a => a.assignment_id !== assignmentId));
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleCancelEdit = () => {
    setFormData(initialFormData);
    setEditId(null);
  };
  
  if (isLoading) return <div className="p-4 text-center">Loading assignments...</div>;
  
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {editId ? 'Edit Assignment' : 'Create New Assignment'}
        </h2>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bus</label>
              <select name="bus_id" value={formData.bus_id} onChange={handleChange} className="w-full p-2 border rounded-md" required>
                <option value="">Select Bus</option>
                {buses.map(bus => <option key={bus.bus_id} value={bus.bus_id}>{bus.registration_number}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
              <select name="route_id" value={formData.route_id} onChange={handleChange} className="w-full p-2 border rounded-md" required>
                <option value="">Select Route</option>
                {routes.map(route => <option key={route.route_id} value={route.route_id}>{route.route_number}: {route.route_name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
              <select name="driver_id" value={formData.driver_id} onChange={handleChange} className="w-full p-2 border rounded-md" required>
                <option value="">Select Driver</option>
                {/* CHANGED: Use driver.id instead of driver.user_id */}
                {drivers.map(driver => <option key={driver.id} value={driver.id}>{driver.first_name} {driver.last_name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conductor</label>
              <select name="conductor_id" value={formData.conductor_id} onChange={handleChange} className="w-full p-2 border rounded-md" required>
                <option value="">Select Conductor</option>
                {/* CHANGED: Use conductor.id instead of conductor.user_id */}
                {conductors.map(conductor => <option key={conductor.id} value={conductor.id}>{conductor.first_name} {conductor.last_name}</option>)}
              </select>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" name="assignment_date" value={formData.assignment_date} onChange={handleChange} className="w-full p-2 border rounded-md" readOnly />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input type="time" name="shift_start_time" value={formData.shift_start_time} onChange={handleChange} className="w-full p-2 border rounded-md" required />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input type="time" name="shift_end_time" value={formData.shift_end_time} onChange={handleChange} className="w-full p-2 border rounded-md" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-md" required>
                <option value="Scheduled">Scheduled</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              {editId ? 'Update Assignment' : 'Create Assignment'}
            </button>
            {editId && <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Cancel</button>}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Assignments</h2>
        
        {assignments.length === 0 ? (
          <p className="text-gray-500">No assignments found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conductor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map(assignment => (
                  <tr key={assignment.assignment_id}>
                    <td className="px-6 py-4 whitespace-nowrap">{assignment.bus_registration}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{assignment.route_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{assignment.driver_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{assignment.conductor_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{assignment.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleEdit(assignment)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(assignment.assignment_id)}
                        className="text-red-600 hover:text-red-900"
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