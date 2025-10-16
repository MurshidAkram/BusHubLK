import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../context/AppContext';

const DailyOperations: React.FC = () => {
  const appContext = useContext(AppContext);
  const user = appContext?.user;
  const token = appContext?.token;

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
  const [assignmentDate, setAssignmentDate] = useState<string>(() => {
    const today = new Date();
    const localDateString = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    return localDateString;
  });

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
  const [addSlotModalOpen, setAddSlotModalOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({ start: '', end: '' });
  const [editSlotModalOpen, setEditSlotModalOpen] = useState(false);
  const [editSlot, setEditSlot] = useState<TimeSlot | null>(null);
  const [editSlotData, setEditSlotData] = useState({ start: '', end: '' });

  // Crew modal state
  const [crewModalOpen, setCrewModalOpen] = useState(false);
  const [crewModalData, setCrewModalData] = useState<{ driver: string, conductor: string } | null>(null);

  // Fetch routes on mount
  useEffect(() => {
    if (!user || !user.depot_id || !token) return;

    const fetchRoutes = async () => {
      try {
        setIsLoading(true);
        setError('');
        const routesRes = await fetch('http://localhost:5000/api/routes/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!routesRes.ok) throw new Error('Failed to fetch routes');
        const routesData = await routesRes.json();
        setRoutes(routesData.routes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoutes();
  }, [user, token]);

  // Fetch schedule for selected route and date
  useEffect(() => {
    if (!selectedRouteId || !user || !token || !assignmentDate) {
      setTimeSlots([]);
      return;
    }

    const fetchSchedule = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch(
          `http://localhost:5000/api/assignments/route/${selectedRouteId}/daily-schedule?date=${assignmentDate}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error('Failed to fetch daily schedule');
        const data = await res.json();
        setTimeSlots(
          data.schedule.map((slot: any) => ({
            id: slot.assignment_id,
            start: slot.shift_start_time,
            end: slot.shift_end_time,
            start_time: slot.shift_start_time,
            end_time: slot.shift_end_time,
            assignment: slot.assignment // either null or the assignment object
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load schedule');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedule();
  }, [selectedRouteId, user, token, assignmentDate]);

  // Fetch available buses, drivers, conductors for the selected date
  useEffect(() => {
    if (!user || !user.depot_id || !token || !assignmentDate) return;

    const fetchAvailable = async () => {
      try {
        // Buses
        const busesRes = await fetch(
          `http://localhost:5000/api/assignments/available-buses?depot_id=${user.depot_id}&date=${assignmentDate}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const busesData = await busesRes.json();
        setBuses(busesData.buses);

        // Drivers
        const driversRes = await fetch(
          `http://localhost:5000/api/assignments/available-drivers?depot_id=${user.depot_id}&date=${assignmentDate}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const driversData = await driversRes.json();
        setDrivers(driversData.drivers);

        // Conductors
        const conductorsRes = await fetch(
          `http://localhost:5000/api/assignments/available-conductors?depot_id=${user.depot_id}&date=${assignmentDate}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const conductorsData = await conductorsRes.json();
        setConductors(conductorsData.conductors);
      } catch (err) {
        setError('Failed to fetch available buses/crew');
      }
    };

    fetchAvailable();
  }, [user, token, assignmentDate]);

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
      setIsLoading(true);
      let result;
      // If assignment exists, update it
      if (modalSlot?.assignment) {
        const response = await fetch(
          `http://localhost:5000/api/assignments/assign/${modalSlot.assignment.assignment_id}`,
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
        result = await response.json();
      } else {
        // Assign from template (create a new assignment for the selected date)
        const response = await fetch(
          `http://localhost:5000/api/assignments/assign-from-template/${modalSlot?.id}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              depot_id: user?.depot_id ?? '',
              bus_id: formData.bus_id,
              driver_id: formData.driver_id,
              conductor_id: formData.conductor_id,
              assignment_date: assignmentDate
            })
          }
        );
        if (!response.ok) throw new Error('Failed to assign slot');
        result = await response.json();
      }
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
    } finally {
      setIsLoading(false);
    }
  };

  // Delete assignment (set slot to unscheduled)
  const handleDelete = async (assignmentId: number, slotId: number) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  // Edit time slot modal handlers
  const handleEditTimeSlot = (slot: TimeSlot) => {
    setEditSlot(slot);
    setEditSlotData({ start: slot.start, end: slot.end });
    setEditSlotModalOpen(true);
  };

  const handleUpdateTimeSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!editSlotData.start || !editSlotData.end) {
      setError('Please enter both start and end time.');
      return;
    }
    if (editSlotData.start >= editSlotData.end) {
      setError('Start time must be before end time.');
      return;
    }
    // Prevent duplicate time slots
    const duplicate = timeSlots.some(
      slot =>
        slot.id !== editSlot?.id &&
        slot.start === editSlotData.start &&
        slot.end === editSlotData.end
    );
    if (duplicate) {
      setError('A time slot with the same start and end time already exists.');
      return;
    }
    try {
      setIsLoading(true);
      setError('');
      const res = await fetch(
        `http://localhost:5000/api/assignments/route/${selectedRouteId}/templates/${editSlot?.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            shift_start_time: editSlotData.start,
            shift_end_time: editSlotData.end
          })
        }
      );
      if (!res.ok) throw new Error('Failed to update slot');
      const data = await res.json();
      setTimeSlots(prev =>
        prev.map(s =>
          s.id === editSlot?.id
            ? {
                ...s,
                start: data.assignment.shift_start_time,
                end: data.assignment.shift_end_time,
                start_time: data.assignment.shift_start_time,
                end_time: data.assignment.shift_end_time
              }
            : s
        )
      );
      setEditSlotModalOpen(false);
      setEditSlot(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update slot');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete time slot
  const handleDeleteTimeSlot = async (slotId: number) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) return;
    try {
      setIsLoading(true);
      setError('');
      const res = await fetch(
        `http://localhost:5000/api/assignments/soft-delete/${slotId}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!res.ok) throw new Error('Failed to delete time slot');
      setTimeSlots(prev => prev.filter(s => s.id !== slotId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete time slot');
    } finally {
      setIsLoading(false);
    }
  };

  function formatTime12h(time: string) {
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const minute = parseInt(m, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }

  const openCrewModal = (slot: TimeSlot) => {
    if (slot.assignment) {
      setCrewModalData({
        driver: slot.assignment.driver_name,
        conductor: slot.assignment.conductor_name
      });
      setCrewModalOpen(true);
    }
  };

  const closeCrewModal = () => {
    setCrewModalOpen(false);
    setCrewModalData(null);
  };

  // Fetch available drivers and conductors when date changes
  useEffect(() => {
    if (!user || !user.depot_id || !token || !assignmentDate) return;

    const fetchAvailable = async () => {
      try {
        // Buses
        const busesRes = await fetch(
          `http://localhost:5000/api/assignments/available-buses?depot_id=${user.depot_id}&date=${assignmentDate}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const busesData = await busesRes.json();
        setBuses(busesData.buses);

        // Drivers
        const driversRes = await fetch(
          `http://localhost:5000/api/assignments/available-drivers?depot_id=${user.depot_id}&date=${assignmentDate}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const driversData = await driversRes.json();
        setDrivers(driversData.drivers);

        // Conductors
        const conductorsRes = await fetch(
          `http://localhost:5000/api/assignments/available-conductors?depot_id=${user.depot_id}&date=${assignmentDate}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const conductorsData = await conductorsRes.json();
        setConductors(conductorsData.conductors);
      } catch (err) {
        setError('Failed to fetch available buses/crew');
      }
    };

    fetchAvailable();
  }, [user, token, assignmentDate]);

  // Above your return, define today's date string:
  const todayDateString = new Date().toISOString().split('T')[0];

  if (isLoading) return <div className="p-4 text-center">Loading data...</div>;

  return (
    <div>
      {/* Date Picker */}
      <div className="flex justify-end mb-4">
        <label className="mr-2 font-medium">Assignment Date:</label>
        <input
          type="date"
          value={assignmentDate}
          onChange={e => setAssignmentDate(e.target.value)}
          className="border rounded px-2 py-1"
          max={todayDateString}
        />
      </div>

      {/* Modal */}
      {modalOpen && modalSlot && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
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
                  {buses
                    .filter(bus => bus.bus_id !== -1) // <-- filter out dummy bus
                    .map(bus => (
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
                  {drivers
                    .filter(driver => driver.id !== -1) // <-- filter out dummy driver
                    .map(driver => (
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
                  {conductors
                    .filter(conductor => conductor.id !== -2) // <-- filter out dummy conductor
                    .map(conductor => (
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

      {addSlotModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-xl font-semibold mb-4">Add New Time Slot</h2>
            {error && (
              <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            <form
              onSubmit={async e => {
                e.preventDefault();
                setError('');
                if (!newSlot.start || !newSlot.end) {
                  setError('Please enter both start and end time.');
                  return;
                }
                if (newSlot.start >= newSlot.end) {
                  setError('Start time must be before end time.');
                  return;
                }
                // Prevent duplicate time slots
                const duplicate = timeSlots.some(
                  slot => slot.start === newSlot.start && slot.end === newSlot.end
                );
                if (duplicate) {
                  setError('A time slot with the same start and end time already exists.');
                  return;
                }
                try {
                  setIsLoading(true);
                  setError('');
                  const res = await fetch(`http://localhost:5000/api/assignments/route/${selectedRouteId}/templates`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        depot_id: user?.depot_id ?? '', // Add this line with null check
                        route_id: Number(selectedRouteId),
                        shift_start_time: newSlot.start,
                        shift_end_time: newSlot.end
                      })
                    }
                  );
                  if (!res.ok) {
                    let msg = 'Failed to add slot';
                    try {
                      const errData = await res.json();
                      if (errData && errData.error) msg = errData.error;
                    } catch {}
                    setError(msg);
                    setIsLoading(false);
                    return;
                  }
                  const data = await res.json();
                  // Add new slot to timeSlots
                  setTimeSlots(prev => [
                    ...prev,
                    {
                      id: data.assignment.assignment_id,
                      start: data.assignment.shift_start_time,
                      end: data.assignment.shift_end_time,
                      start_time: data.assignment.shift_start_time,
                      end_time: data.assignment.shift_end_time,
                      assignment: null
                    }
                  ]);
                  setAddSlotModalOpen(false);
                  setNewSlot({ start: '', end: '' });
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to add slot');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Start Time (HH:MM:SS)</label>
                <input
                  type="time"
                  value={newSlot.start}
                  onChange={e => setNewSlot(s => ({ ...s, start: e.target.value + ':00' }))}
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time (HH:MM:SS)</label>
                <input
                  type="time"
                  value={newSlot.end}
                  onChange={e => setNewSlot(s => ({ ...s, end: e.target.value + ':00' }))}
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setAddSlotModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editSlotModalOpen && editSlot && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-xl font-semibold mb-4">Edit Time Slot</h2>
            {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
            <form onSubmit={handleUpdateTimeSlot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Time (HH:MM:SS)</label>
                <input
                  type="time"
                  value={editSlotData.start.slice(0, 5)}
                  onChange={e => setEditSlotData(s => ({ ...s, start: e.target.value + ':00' }))}
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time (HH:MM:SS)</label>
                <input
                  type="time"
                  value={editSlotData.end.slice(0, 5)}
                  onChange={e => setEditSlotData(s => ({ ...s, end: e.target.value + ':00' }))}
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setEditSlotModalOpen(false)}
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

      {crewModalOpen && crewModalData && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-xl font-semibold mb-4">Crew Details</h2>
            <div className="mb-4">
              <div className="font-medium text-gray-700 mb-2">Driver:</div>
              <div className="mb-4 text-gray-900">{crewModalData.driver}</div>
              <div className="font-medium text-gray-700 mb-2">Conductor:</div>
              <div className="text-gray-900">{crewModalData.conductor}</div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={closeCrewModal}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
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
                  <div className="flex items-center space-x-3">
                    <div className="text-lg px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <button
                      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      onClick={() => setAddSlotModalOpen(true)}
                    >
                      + Add New Time Slot
                    </button>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Crew</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {timeSlots
                        .slice() // create a copy so you don't mutate state
                        .sort((a, b) => a.start_time.localeCompare(b.start_time))
                        .map(slot => (
                          <tr key={slot.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {formatTime12h(slot.start)} - {formatTime12h(slot.end)}
                              </div>
                            </td>
                            {/* Bus */}
                            <td className="px-2.5 py-0.5 font-medium ">
                              {slot.assignment ? (
                                <>
                                  <div className="font-medium">{slot.assignment.bus_registration}</div>
                                  <div className="text-sm text-gray-500">Class {slot.assignment.bus_type}</div>
                                </>
                              ) : (
                                <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Not assigned</span>
                              )}
                            </td>
                            {/* Crew */}
                            <td className="px-6 py-4">
                              {slot.assignment && slot.assignment.driver_name && slot.assignment.conductor_name ? (
                                <button
                                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                  onClick={() => openCrewModal(slot)}
                                >
                                  View
                                </button>
                              ) : (
                                <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Not assigned</span>
                              )}
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
                                    title="Edit"
                                    className="text-indigo-600 hover:text-indigo-900 p-1"
                                  >
                                    {/* Edit icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(slot.assignment!.assignment_id, slot.id)}
                                    title="Delete"
                                    className="text-red-600 hover:text-red-900 p-1"
                                  >
                                    {/* Delete icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleEditTimeSlot(slot)}
                                    title="Edit"
                                    className="text-indigo-600 hover:text-indigo-900 p-1"
                                  >
                                    {/* Edit icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTimeSlot(slot.id)}
                                    title="Delete"
                                    className="text-red-600 hover:text-red-900 p-1"
                                  >
                                    {/* Delete icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => openModal(slot)}
                                    title="Assign"
                                    className="text-blue-600 hover:text-blue-900 p-1"
                                  >
                                    {/* Assign icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  </button>
                                </div>
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