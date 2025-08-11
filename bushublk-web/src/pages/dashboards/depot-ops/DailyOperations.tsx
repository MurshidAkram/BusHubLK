import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../context/AppContext';

const DailyOperations: React.FC = () => {
  const { user, token } = useContext(AppContext);

  // State
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [conductors, setConductors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSlot, setModalSlot] = useState<TimeSlot | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    bus_id: '',
    driver_id: '',
    conductor_id: '',
    status: 'Scheduled',
    shift_start_time: '',
    shift_end_time: ''
  });

  // Generate time slots from 6AM to 10PM in 1-hour intervals
  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    for (let hour = 6; hour <= 22; hour++) {
      const startHour = hour % 12 || 12;
      const endHour = (hour + 2) % 12 || 12;
      const startPeriod = hour < 12 ? 'AM' : 'PM';
      const endPeriod = (hour + 2) < 12 ? 'AM' : 'PM';

      slots.push({
        id: hour,
        start: `${startHour}:00 ${startPeriod}`,
        end: `${endHour}:00 ${endPeriod}`,
        start_time: `${hour.toString().padStart(2, '0')}:00:00`,
        end_time: `${(hour + 2).toString().padStart(2, '0')}:00:00`,
        assignment: null
      });
    }
    return slots;
  };

  // Fetch routes + common data on mount
  useEffect(() => {
    if (!user || !user.depot_id || !token) return;

    const fetchAll = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Routes
        const routesRes = await fetch('http://localhost:5000/api/routes/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!routesRes.ok) throw new Error('Failed to fetch routes');
        const routesData = await routesRes.json();
        setRoutes(routesData.routes);

        // Buses
        const busesRes = await fetch(`http://localhost:5000/api/buses/depot/${user.depot_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!busesRes.ok) throw new Error('Failed to fetch buses');
        const busesData = await busesRes.json();
        setBuses(busesData.buses.filter((b: Bus) => b.status === 'Active'));

        // Users (Drivers + Conductors)
        const usersRes = await fetch(`http://localhost:5000/api/users/depot/${user.depot_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!usersRes.ok) throw new Error('Failed to fetch users');
        const usersData = await usersRes.json();
        setDrivers(usersData.users.filter((u: User) => u.role === 'driver'));
        setConductors(usersData.users.filter((u: User) => u.role === 'conductor'));

        // Generate time slots
        setTimeSlots(generateTimeSlots());

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [user, token]);

  // Fetch assignments for selected route
  useEffect(() => {
    if (!selectedRouteId || !user || !token) {
      setAssignments([]);
      setTimeSlots([]); // <-- Only show slots from DB
      return;
    }

    const fetchAssignments = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`http://localhost:5000/api/assignments/route/${selectedRouteId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch assignments');
        const data = await res.json();
        // If your backend returns { assignments: [...] }
        const assignmentList = data.assignments || data;
        setAssignments(assignmentList);

        // Update time slots with assignments
        setTimeSlots(generateTimeSlots().map(slot => {
          const assignment = assignmentList.find((a: Assignment) =>
            a.shift_start_time === slot.start_time &&
            a.shift_end_time === slot.end_time
          );
          return { ...slot, assignment: assignment || null };
        }));

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assignments');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignments();
  }, [selectedRouteId, user, token]);

  // Fetch template slots for selected route
  useEffect(() => {
    if (!selectedRouteId || !user || !token) {
      setTimeSlots([]);
      return;
    }

    const fetchTemplates = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch(`http://localhost:5000/api/assignments/route/${selectedRouteId}/templates`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch schedule templates');
        const data = await res.json();
        // Map templates to your timeSlots structure
        setTimeSlots(data.templates.map((tpl: any) => ({
          id: tpl.assignment_id,
          start: tpl.shift_start_time,
          end: tpl.shift_end_time,
          start_time: tpl.shift_start_time,
          end_time: tpl.shift_end_time,
          assignment: tpl.status === 'assigned' ? tpl : null
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load schedule');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, [selectedRouteId, user, token]);

  // Modal open for assign or edit
  const openModal = (slot: TimeSlot) => {
    setModalSlot(slot);
    setModalOpen(true);
    if (slot.assignment) {
      setEditId(slot.assignment.assignment_id);
      setFormData({
        bus_id: String(slot.assignment.bus_id),
        driver_id: String(slot.assignment.driver_id),
        conductor_id: String(slot.assignment.conductor_id),
        status: slot.assignment.status,
        shift_start_time: slot.start_time,
        shift_end_time: slot.end_time
      });
    } else {
      setEditId(null);
      setFormData({
        bus_id: '',
        driver_id: '',
        conductor_id: '',
        status: 'Scheduled',
        shift_start_time: slot.start_time,
        shift_end_time: slot.end_time
      });
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalSlot(null);
    setEditId(null);
    setFormData({
      bus_id: '',
      driver_id: '',
      conductor_id: '',
      status: 'Scheduled',
      shift_start_time: '',
      shift_end_time: ''
    });
    setError('');
  };

  // Save assignment (create or update)
  const handleModalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.bus_id || !formData.driver_id || !formData.conductor_id) {
      setError('Please fill all fields');
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/assignments/assign/${modalSlot?.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            bus_id: formData.bus_id,
            driver_id: formData.driver_id,
            conductor_id: formData.conductor_id
          })
        }
      );
      if (!response.ok) throw new Error('Failed to assign slot');
      const result = await response.json();
      // Update timeSlots in state
      setTimeSlots(prev =>
        prev.map(s =>
          s.id === modalSlot?.id
            ? { ...s, assignment: result.assignment }
            : s
        )
      );
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign slot');
    }
  };

  // Delete assignment (set slot to unscheduled)
  const handleDelete = async (assignmentId: number, slotId: number) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/assignments/soft-delete/${assignmentId}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!response.ok) throw new Error('Failed to delete assignment');
      setTimeSlots(prev =>
        prev.map(s =>
          s.id === slotId
            ? { ...s, assignment: null }
            : s
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (isLoading) return <div className="p-4 text-center">Loading data...</div>;

  return (
    <div>
      {/* Modal */}
      {modalOpen && modalSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-xl font-semibold mb-4">{editId ? 'Edit Assignment' : 'Assign Bus, Driver & Conductor'}</h2>
            {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
            <form onSubmit={handleModalSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bus</label>
                <select
                  name="bus_id"
                  value={formData.bus_id}
                  onChange={e => setFormData({ ...formData, bus_id: e.target.value })}
                  className="w-full border rounded px-2 py-1"
                  required
                >
                  <option value="">Select Bus</option>
                  {buses.map(bus => (
                    <option key={bus.bus_id} value={bus.bus_id}>
                      {bus.registration_number} • {bus.bus_type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Driver</label>
                <select
                  name="driver_id"
                  value={formData.driver_id}
                  onChange={e => setFormData({ ...formData, driver_id: e.target.value })}
                  className="w-full border rounded px-2 py-1"
                  required
                >
                  <option value="">Select Driver</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.first_name} {driver.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Conductor</label>
                <select
                  name="conductor_id"
                  value={formData.conductor_id}
                  onChange={e => setFormData({ ...formData, conductor_id: e.target.value })}
                  className="w-full border rounded px-2 py-1"
                  required
                >
                  <option value="">Select Conductor</option>
                  {conductors.map(conductor => (
                    <option key={conductor.id} value={conductor.id}>
                      {conductor.first_name} {conductor.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex flex-col md:flex-row gap-0">
          {/* Routes List - Left Panel */}
          <div className="md:w-1/4 bg-gradient-to-b from-blue-25 to-indigo-25 border-r border-gray-200">
            <div className="p-5 sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <h2 className="text-xl font-bold">Available Routes</h2>
              <p className="text-blue-100 text-sm mt-1">Select route to manage assignments</p>
            </div>
            <ul className="p-3 max-h-[calc(100vh-150px)] overflow-y-auto">
              {routes.map(route => (
                <li
                  key={route.route_id}
                  className={`p-3 mb-2 rounded-lg transition-all duration-200 cursor-pointer flex items-start
                    ${selectedRouteId === route.route_id
                      ? 'bg-white shadow-md border-l-4 border-blue-500'
                      : 'hover:bg-blue-100'}`}
                  onClick={() => {
                    setSelectedRouteId(route.route_id);
                    setSelectedRoute(route);
                    setEditId(null);
                    setError('');
                  }}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">Route {route.route_number}</div>
                    <div className="text-sm text-gray-600 mt-1">{route.route_name}</div>
                  </div>
                  {selectedRouteId === route.route_id && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Main Content Area - Right Panel */}
          <div className="md:w-3/4">
            {selectedRoute ? (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Schedule for Route {selectedRoute.route_number}
                    </h2>
                    <p className="text-gray-600">{selectedRoute.route_name}</p>
                  </div>
                  <div className="text-lg px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Timetable */}
                <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Time Slot</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Bus</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Driver</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Conductor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {timeSlots.map(slot => (
                        <tr key={slot.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{slot.start} - {slot.end}</div>
                          </td>
                          {/* Bus */}
                          <td className="px-6 py-4">
                            {slot.assignment ? (
                              <>
                                <div className="font-medium">{slot.assignment.bus_registration}</div>
                                <div className="text-sm text-gray-500">{slot.assignment.bus_type}</div>
                              </>
                            ) : (
                              <span className="text-gray-400">Not assigned</span>
                            )}
                          </td>
                          {/* Driver */}
                          <td className="px-6 py-4">
                            {slot.assignment?.driver_name || <span className="text-gray-400">-</span>}
                          </td>
                          {/* Conductor */}
                          <td className="px-6 py-4">
                            {slot.assignment?.conductor_name || <span className="text-gray-400">-</span>}
                          </td>
                          {/* Status */}
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                              ${slot.assignment?.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                                slot.assignment?.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'}`}>
                              {slot.assignment?.status || 'Not scheduled'}
                            </span>
                          </td>
                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {slot.assignment ? (
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => openModal(slot)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(slot.assignment!.assignment_id, slot.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => openModal(slot)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Assign
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-24 px-4 text-center">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full p-6 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Route</h3>
                <p className="text-gray-600 max-w-md">
                  Choose a route from the left panel to view and manage its daily schedule
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Additional Type Definitions
interface TimeSlot {
  id: number;
  start: string;
  end: string;
  start_time: string;
  end_time: string;
  assignment: Assignment | null;
}

interface Assignment {
  assignment_id: number;
  bus_id: number;
  bus_registration: string;
  bus_type: string;
  driver_id: number;
  driver_name: string;
  conductor_id: number;
  conductor_name: string;
  status: 'Scheduled' | 'Cancelled' | 'Ongoing' | 'Completed';
  shift_start_time: string;
  shift_end_time: string;
  assignment_date: string;
}

interface Route {
  route_id: number;
  route_number: string;
  route_name: string;
}

interface Bus {
  bus_id: number;
  registration_number: string;
  bus_type: string;
  status: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
}

export default DailyOperations;