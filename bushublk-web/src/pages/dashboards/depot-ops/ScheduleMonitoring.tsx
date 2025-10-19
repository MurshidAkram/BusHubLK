import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../../context/AppContext';
import { Eye, Clock, MapPin, Bus, Route, Calendar, ChevronDown, X } from 'lucide-react';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

interface BusTripSummary {
  trip_id: number;
  bus_id: number;
  registration_number: string;
  route_number: string;
  route_name: string;
  driver_name: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  actual_departure: string;
  actual_arrival: string;
  total_distance_km: number;
  status: string;
  time_difference: string;
  departure_status?: 'Early' | 'Delayed' | 'On Time';
  arrival_status?: 'Early' | 'Delayed' | 'On Time';
  departure_time_difference?: string;
  arrival_time_difference?: string;
}

const BusScheduleTable = () => {
  const appContext = useContext(AppContext);
  const user = appContext?.user;
  const token = appContext?.token;

  const [busData, setBusData] = useState<BusTripSummary[]>([]);
  const [selectedRow, setSelectedRow] = useState<BusTripSummary | null>(null);
  const [modalType, setModalType] = useState<'view' | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const localDateString = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    return localDateString;
  });

  useEffect(() => {
    if (!token || !user || !selectedDate) return;
    setLoading(true);
  axios.get(`${API_BASE_URL}/live-summary/depot/${user.depot_id}?date=${selectedDate}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setBusData(res.data.data ?? []);
        setLoading(false);
      })
      .catch(err => {
        setBusData([]);
        setLoading(false);
        console.error('Failed to fetch live tracking data:', err);
      });
  }, [token, user, selectedDate]);

  const formatTo12Hour = (time: string) => {
    if (!time) return 'Not recorded';
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
      const [h, m] = time.split(':');
      let hours = parseInt(h, 10);
      const minutes = m.padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }
    const date = new Date(time);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const handleModalOpen = (row: BusTripSummary) => {
    setModalType('view');
    setSelectedRow(row);
  };

  const handleModalClose = () => {
    setModalType(null);
    setSelectedRow(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Time': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Delayed': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Early': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const today = new Date();
  const todayString = today.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const todayDay = today.toLocaleDateString('en-US', { weekday: 'short' });
  const todayDateString = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trips</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{busData.length}</p>
              </div>
              <div className="bg-blue-500/10 rounded-xl p-3">
                <Route className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Buses</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {new Set(busData.map(bus => bus.bus_id)).size}
                </p>
              </div>
              <div className="bg-emerald-500/10 rounded-xl p-3">
                <Bus className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Routes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {new Set(busData.map(bus => bus.route_number)).size}
                </p>
              </div>
              <div className="bg-purple-500/10 rounded-xl p-3">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{todayString}</p>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-3">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 font-medium">Loading schedules...</p>
              <p className="text-sm text-gray-500 mt-2">Fetching the latest bus data</p>
            </div>
          ) : (
            <>
              <div className="px-8 py-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800">Schedule Overview</h2>
                <p className="text-gray-600 mt-1">Real-time tracking of all bus trips</p>
              </div>

              <div className="px-8 py-4">
                <div className="mb-4 flex items-center space-x-4">
                  <label className="text-gray-700 font-medium">Filter by Date:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="border rounded px-2 py-1"
                    max={todayDateString}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30">
                      <th className="px-8 py-6 text-left"><div className="flex items-center space-x-2"><Bus className="h-4 w-4 text-gray-500" /><span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Bus</span></div></th>
                      <th className="px-8 py-6 text-left"><div className="flex items-center space-x-2"><Route className="h-4 w-4 text-gray-500" /><span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Route</span></div></th>
                      <th className="px-8 py-6 text-left"><div className="flex items-center space-x-2"><Clock className="h-4 w-4 text-gray-500" /><span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Scheduled</span></div></th>
                      <th className="px-8 py-6 text-left"><div className="flex items-center space-x-2"><Clock className="h-4 w-4 text-gray-500" /><span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Actual</span></div></th>
                    {/*<th className="px-8 py-6 text-left"><span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Distance</span></th>*/}
                      <th className="px-8 py-6 text-right"><span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Array.isArray(busData) && busData.map((row, index) => (
                      <tr 
                        key={`${row.bus_id}-${row.trip_id}-${index}`}
                        className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-white transition-all duration-200"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 rounded-xl p-2">
                              <Bus className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{row.registration_number}</p>
                              <p className="text-sm text-gray-500 mt-1">{row.driver_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div>
                            <p className="font-semibold text-gray-900">Route {row.route_number}</p>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{row.route_name}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm text-gray-500">Departure</p>
                              <p className="font-medium text-gray-900">{formatTo12Hour(row.scheduled_departure)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Arrival</p>
                              <p className="font-medium text-gray-900">{formatTo12Hour(row.scheduled_arrival)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm text-gray-500">Departure</p>
                              <p className={`font-medium ${row.actual_departure ? 'text-gray-900' : 'text-amber-600'}`}>{formatTo12Hour(row.actual_departure)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Arrival</p>
                              <p className={`font-medium ${row.actual_arrival ? 'text-gray-900' : 'text-amber-600'}`}>{formatTo12Hour(row.actual_arrival)}</p>
                            </div>
                          </div>
                        </td>
                    {/*    <td className="px-8 py-6">
                          <div className="bg-gray-50 rounded-2xl px-4 py-3 inline-block">
                            <p className="font-bold text-gray-900 text-lg">{row.total_distance_km}</p>
                            <p className="text-sm text-gray-500">kilometers</p>
                          </div>
                        </td>*/}
                        <td className="px-8 py-6 text-right">
                          <button
                            onClick={() => handleModalOpen(row)}
                            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 group"
                          >
                            <span className="font-semibold">View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {busData.length === 0 && (
                <div className="text-center py-16">
                  <div className="bg-gray-100 rounded-3xl p-8 inline-block">
                    <Bus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No schedules available</h3>
                    <p className="text-gray-500">There are no bus schedules to display at the moment.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Modal */}
      {modalType === 'view' && selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-transform duration-300 scale-100">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-200 p-6 rounded-t-3xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight mb-1 flex items-center">
                  Trip Details
                </h2>
                </div>
              <button 
                onClick={handleModalClose}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-2xl"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">

              {/* Driver & Bus Info */}
              <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-2 sm:space-y-0 mb-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Driver</p>
                  <p className="text-base font-semibold text-gray-900">{selectedRow.driver_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Bus Number</p>
                  <p className="text-base font-semibold text-gray-900">{selectedRow.registration_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Route</p>
                  <p className="text-base font-semibold text-gray-900">{selectedRow.route_number} <span className="text-gray-500 font-normal">({selectedRow.route_name})</span></p>
                </div>
              </div>

              {/* Scheduled Times */}
              <div className="border-t border-b border-gray-100 py-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Scheduled Departure</p>
                  <p className="text-base font-semibold text-gray-900">{formatTo12Hour(selectedRow.scheduled_departure)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Scheduled Arrival</p>
                  <p className="text-base font-semibold text-gray-900">{formatTo12Hour(selectedRow.scheduled_arrival)}</p>
                </div>
              </div>

              {/* Actual Times */}
              <div className="border-b border-gray-100 py-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Actual Departure</p>
                  <p className="text-base font-semibold text-gray-900">
                    {selectedRow.actual_departure ? formatTo12Hour(selectedRow.actual_departure) : 'Not recorded'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Actual Arrival</p>
                  <p className="text-base font-semibold text-gray-900">
                    {selectedRow.actual_arrival ? formatTo12Hour(selectedRow.actual_arrival) : 'Not recorded'}
                  </p>
                </div>
              </div>

              {/* Status Section */}
              <div className="border-b border-gray-100 py-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Departure Status</p>
                  <span className={`px-2 py-1 text-sm rounded font-semibold
                    ${selectedRow.departure_status === 'Early' ? 'bg-blue-100 text-blue-700' :
                      selectedRow.departure_status === 'Delayed' ? 'bg-rose-100 text-rose-700' :
                        selectedRow.departure_status === 'On Time' ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-400'}`}>
                    {selectedRow.departure_status} {selectedRow.departure_time_difference}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Arrival Status</p>
                  <span className={`px-2 py-1 text-sm rounded font-semibold
                    ${selectedRow.arrival_status === 'Early' ? 'bg-blue-100 text-blue-700' :
                      selectedRow.arrival_status === 'Delayed' ? 'bg-rose-100 text-rose-700' :
                        selectedRow.arrival_status === 'On Time' ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-400'}`}>
                    {selectedRow.arrival_status} {selectedRow.arrival_time_difference}
                  </span>
                </div>
              </div>

              {/* Distance */}
              <div className="py-4">
                <p className="text-xs text-gray-500 mb-1">Total Distance</p>
                <p className="text-base font-semibold text-gray-900">{selectedRow.total_distance_km} km</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-8 py-6 bg-gray-50 flex justify-end">
              <button
                onClick={handleModalClose}
                className="bg-gradient-to-r from-gray-200 to-gray-300 text-black px-8 py-3 rounded-2xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold shadow-lg"
              >
                Close 
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default BusScheduleTable;
