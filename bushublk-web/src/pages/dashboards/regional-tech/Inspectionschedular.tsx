import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../../context/AppContext';

interface Inspection {
  id: number;
  inspection_type: string;
  date: string;
  time: string;
  status: string;
  depot_id: number;
  depot_name?: string;
  region_name?: string;
}

interface Depot {
  depot_id: number;
  depot_name: string;
  region_id: number;
  region_name: string;
}

interface NewInspection {
  inspection_type: string;
  date: string;
  time: string;
  depot_id: string;
}

const InspectionScheduleApp: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [upcomingInspections, setUpcomingInspections] = useState<Inspection[]>([]);
  const [pastInspections, setPastInspections] = useState<Inspection[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewInspectionModal, setShowNewInspectionModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [newInspection, setNewInspection] = useState<NewInspection>({
    inspection_type: '',
    date: '',
    time: '',
    depot_id: ''
  });
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);

  const context = useContext(AppContext);
  const token = context?.token;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Fetch user's depots
  const fetchDepots = async () => {
    try {
      if (!token) return;
      
      const response = await axios.get('http://localhost:5000/api/inspections/depots', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.depots) {
        setDepots(response.data.depots);
      }
    } catch (err) {
      console.error('Error fetching depots:', err);
      setError('Failed to fetch depots');
    }
  };

  // Fetch upcoming inspections
  const fetchUpcomingInspections = async () => {
    try {
      if (!token) return;
      
      const response = await axios.get('http://localhost:5000/api/inspections/upcoming', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.inspections) {
        setUpcomingInspections(response.data.inspections);
      }
    } catch (err) {
      console.error('Error fetching upcoming inspections:', err);
      setError('Failed to fetch upcoming inspections');
    }
  };

  // Fetch past inspections
  const fetchPastInspections = async () => {
    try {
      if (!token) return;
      
      const response = await axios.get('http://localhost:5000/api/inspections/past', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.inspections) {
        setPastInspections(response.data.inspections);
      }
    } catch (err) {
      console.error('Error fetching past inspections:', err);
      setError('Failed to fetch past inspections');
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (token) {
      Promise.all([
        fetchDepots(),
        fetchUpcomingInspections(),
        fetchPastInspections()
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [token]);

  // Debug log to check if inspections are loaded
  useEffect(() => {
    console.log('Upcoming inspections:', upcomingInspections);
    console.log('Past inspections:', pastInspections);
    
    // Test the date format and getInspectionsForDate function
    if (upcomingInspections.length > 0) {
      const firstInspection = upcomingInspections[0];
      console.log('First inspection:', firstInspection);
      console.log('First inspection date raw:', firstInspection.date);
      
      const testDate = new Date(firstInspection.date);
      console.log('Parsed date:', testDate);
      console.log('Formatted date string:', testDate.toISOString().split('T')[0]);
      
      const inspectionsOnThatDate = getInspectionsForDate(testDate);
      console.log('Inspections found for that date:', inspectionsOnThatDate);
    }
  }, [upcomingInspections, pastInspections]);

  const getDaysInMonth = (date: Date): (number | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getInspectionsForDate = (date: Date): Inspection[] => {
    const dateStr = date.toISOString().split('T')[0];
    // Combine both upcoming and past inspections for calendar display
    const allInspections = [...upcomingInspections, ...pastInspections];
    
    // More flexible date comparison to handle different formats
    const dayInspections = allInspections.filter(inspection => {
      // Try both direct comparison and parsed date comparison
      const inspectionDateStr = typeof inspection.date === 'string' ? inspection.date.split('T')[0] : inspection.date;
      return inspectionDateStr === dateStr;
    });
    
    // Debug log
    if (dayInspections.length > 0) {
      console.log(`Found ${dayInspections.length} inspections for ${dateStr}:`, dayInspections);
    }
    
    return dayInspections;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case 'Completed':
        return <span className="w-4 h-4 text-green-600">✓</span>;
      case 'In Progress':
        return <span className="w-4 h-4 text-blue-600">⏳</span>;
      case 'Pending':
        return <span className="w-4 h-4 text-yellow-600">⏰</span>;
      default:
        return null;
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number | null): void => {
    if (day) {
      const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      setSelectedDate(clickedDate);
      
      // Show details for inspections on this date
      const dateInspections = getInspectionsForDate(clickedDate);
      if (dateInspections.length > 0) {
        console.log(`Inspections on ${clickedDate.toDateString()}:`, dateInspections);
      }
    }
  };

  const handleAddInspection = async (): Promise<void> => {
    if (newInspection.inspection_type && newInspection.depot_id && newInspection.date && newInspection.time) {
      try {
        const response = await axios.post('http://localhost:5000/api/inspections', newInspection, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (response.data.inspection) {
          await fetchUpcomingInspections(); // Refresh the list
          setNewInspection({
            inspection_type: '',
            date: '',
            time: '',
            depot_id: ''
          });
          setShowNewInspectionModal(false);
        }
      } catch (err) {
        console.error('Error adding inspection:', err);
        setError('Failed to add inspection');
      }
    }
  };

  const handleEditInspection = (inspection: Inspection): void => {
    setEditingInspection(inspection);
    setShowEditModal(true);
  };

  const handleUpdateInspection = async (): Promise<void> => {
    if (editingInspection) {
      try {
        const updateData = {
          inspection_type: editingInspection.inspection_type,
          date: editingInspection.date,
          time: editingInspection.time,
          depot_id: editingInspection.depot_id
        };

        const response = await axios.put(`http://localhost:5000/api/inspections/${editingInspection.id}`, updateData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (response.data.inspection) {
          await Promise.all([fetchUpcomingInspections(), fetchPastInspections()]);
          setShowEditModal(false);
          setEditingInspection(null);
        }
      } catch (err) {
        console.error('Error updating inspection:', err);
        setError('Failed to update inspection');
      }
    }
  };

  const handleDeleteInspection = async (id: number): Promise<void> => {
    try {
      await axios.delete(`http://localhost:5000/api/inspections/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await Promise.all([fetchUpcomingInspections(), fetchPastInspections()]);
    } catch (err) {
      console.error('Error deleting inspection:', err);
      setError('Failed to delete inspection');
    }
  };

  const handleMarkAsCompleted = async (id: number): Promise<void> => {
    try {
      await axios.patch(`http://localhost:5000/api/inspections/${id}/complete`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await Promise.all([fetchUpcomingInspections(), fetchPastInspections()]);
    } catch (err) {
      console.error('Error marking inspection as completed:', err);
      setError('Failed to mark inspection as completed');
    }
  };

  const calendarDays = getDaysInMonth(currentDate);
  const today = new Date();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inspection Schedules</h1>
          <button
            onClick={() => setShowNewInspectionModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <span className="text-lg">+</span>
            New Inspection
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button 
              onClick={() => setError(null)}
              className="float-right font-bold ml-4"
            >
              ×
            </button>
          </div>
        )}

        {/* Calendar Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-grow mb-8">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-700">Calendar View</h2>
              
              {/* Calendar Legend */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></div>
                  <span className="text-gray-600">Pending</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
                  <span className="text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
                  <span className="text-gray-600">In Progress</span>
                </div>
              </div>
            </div>
            
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg font-bold"
              >
                ←
              </button>
              <h3 className="text-lg font-semibold">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg font-bold"
              >
                →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {days.map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const cellDate = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
                const dayInspections = cellDate ? getInspectionsForDate(cellDate) : [];
                const isToday = cellDate && cellDate.toDateString() === today.toDateString();
                const isSelected = cellDate && cellDate.toDateString() === selectedDate.toDateString();

                return (
                  <div
                    key={index}
                    className={`p-1 border cursor-pointer hover:bg-gray-50 transition-colors min-h-[80px] ${
                      isToday ? 'bg-blue-50 border-blue-200' : 
                      isSelected ? 'bg-blue-100 border-blue-300' :
                      dayInspections.length > 0 ? 'bg-slate-50 border-slate-200' : 'border-gray-100'
                    }`}
                    onClick={() => handleDateClick(day)}
                    title={dayInspections.length > 0 ? 
                      `${dayInspections.length} inspection(s) scheduled:\n${dayInspections.map(i => `• ${i.inspection_type} at ${i.depot_name} (${i.time}) - ${i.status}`).join('\n')}`
                      : ''
                    }
                  >
                    {day && (
                      <div>
                        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayInspections.slice(0, 2).map((inspection, idx) => (
                            <div
                              key={idx}
                              className={`text-xs px-2 py-1 rounded truncate ${
                                inspection.status === 'Completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : inspection.status === 'Pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                              title={`${inspection.inspection_type} at ${inspection.depot_name} - ${inspection.time} (${inspection.status})`}
                            >
                              {inspection.inspection_type}
                            </div>
                          ))}
                          {dayInspections.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{dayInspections.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Selected Date Inspections */}
            {getInspectionsForDate(selectedDate).length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3">
                  Inspections on {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h4>
                <div className="space-y-2">
                  {getInspectionsForDate(selectedDate).map((inspection) => (
                    <div key={inspection.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                          {getStatusIcon(inspection.status)}
                          {inspection.status}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900">{inspection.inspection_type}</div>
                          <div className="text-sm text-gray-600">{inspection.depot_name} • {inspection.time}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditInspection(inspection)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit inspection"
                        >
                          <span className="text-sm">✏️</span>
                        </button>
                        {inspection.status !== 'Completed' && (
                          <button
                            onClick={() => handleMarkAsCompleted(inspection.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Mark as completed"
                          >
                            <span className="text-sm">✓</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Inspections Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-6">Upcoming Inspections</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Inspection Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Depot</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingInspections.map((inspection) => (
                    <tr key={inspection.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-gray-900">{inspection.inspection_type}</td>
                      <td className="py-4 px-4 text-gray-900">{inspection.depot_name}</td>
                      <td className="py-4 px-4 text-gray-900">{inspection.date}</td>
                      <td className="py-4 px-4 text-gray-900">{inspection.time}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                          {getStatusIcon(inspection.status)}
                          {inspection.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditInspection(inspection)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <span className="text-sm">✏️</span>
                          </button>
                          {inspection.status !== 'Completed' && (
                            <button
                              onClick={() => handleMarkAsCompleted(inspection.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Mark as completed"
                            >
                              <span className="text-sm">✓</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteInspection(inspection.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <span className="text-sm">🗑️</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {upcomingInspections.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 px-4 text-center text-gray-500">
                        No upcoming inspections scheduled
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Past Inspections Table */}
        {pastInspections.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-6">Past Inspections (Last Month)</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Inspection Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Depot</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Time</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastInspections.map((inspection) => (
                      <tr key={inspection.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-gray-900">{inspection.inspection_type}</td>
                        <td className="py-4 px-4 text-gray-900">{inspection.depot_name}</td>
                        <td className="py-4 px-4 text-gray-900">{inspection.date}</td>
                        <td className="py-4 px-4 text-gray-900">{inspection.time}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                            {getStatusIcon(inspection.status)}
                            {inspection.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* New Inspection Modal */}
        {showNewInspectionModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Schedule New Inspection</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Type</label>
                  <input
                    type="text"
                    value={newInspection.inspection_type}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewInspection({...newInspection, inspection_type: e.target.value})}
                    placeholder="e.g., Safety Check"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Depot</label>
                  <select
                    value={newInspection.depot_id}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewInspection({...newInspection, depot_id: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a depot</option>
                    {depots.map((depot) => (
                      <option key={depot.depot_id} value={depot.depot_id}>
                        {depot.depot_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newInspection.date}
                    min={new Date().toISOString().split('T')[0]} // Set minimum date to today
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewInspection({...newInspection, date: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={newInspection.time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewInspection({...newInspection, time: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewInspectionModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddInspection}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Inspection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Inspection Modal */}
        {showEditModal && editingInspection && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Inspection</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Type</label>
                  <input
                    type="text"
                    value={editingInspection.inspection_type}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setEditingInspection({...editingInspection, inspection_type: e.target.value})
                    }
                    placeholder="e.g., Safety Check"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Depot</label>
                  <select
                    value={editingInspection.depot_id}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                      setEditingInspection({...editingInspection, depot_id: parseInt(e.target.value)})
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a depot</option>
                    {depots.map((depot) => (
                      <option key={depot.depot_id} value={depot.depot_id}>
                        {depot.depot_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editingInspection.date}
                    min={new Date().toISOString().split('T')[0]} // Set minimum date to today
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setEditingInspection({...editingInspection, date: e.target.value})
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={editingInspection.time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setEditingInspection({...editingInspection, time: e.target.value})
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateInspection}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Inspection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionScheduleApp;