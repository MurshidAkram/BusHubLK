import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../context/AppContext';

const Assignments = () => {
  const appContext = useContext(AppContext);
  const user = appContext?.user;
  const token = appContext?.token;
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [assignmentDate, setAssignmentDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
            assignment: slot.assignment
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

  function formatTime12h(time: string) {
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const minute = parseInt(m, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }

  if (isLoading) return <div className="p-4 text-center">Loading data...</div>;

  return (
    <div>
      {/* Date Picker */}
      <div className="flex justify-end mb-4">
        
      </div>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex flex-col md:flex-row gap-0">
          {/* Routes List - Left Panel */}
          <div className="md:w-1/4 bg-gradient-to-b from-blue-25 to-indigo-25 border-r border-gray-200">
            <div className="p-5 sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <h2 className="text-xl font-bold">Available Routes</h2>
              <p className="text-blue-100 text-sm mt-1">Select route to view assignments</p>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Crew</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {timeSlots
                        .slice()
                        .sort((a, b) => a.start.localeCompare(b.start))
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
                                  <div className="text-sm text-gray-500">{slot.assignment.bus_type}</div>
                                </>
                              ) : (
                                <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Not assigned</span>
                              )}
                            </td>
                            {/* Crew */}
                            <td className="px-6 py-4">
                              {slot.assignment && slot.assignment.driver_name && slot.assignment.conductor_name ? (
                                <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                  {slot.assignment.driver_name} / {slot.assignment.conductor_name}
                                </span>
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
                  Choose a route from the left panel to view its daily schedule
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface TimeSlot {
  id: number;
  start: string;
  end: string;
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

export default Assignments;