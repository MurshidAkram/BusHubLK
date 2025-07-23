import React, { useState, useEffect } from 'react';

interface Service {
  id: number;
  serviceType: string;
  busId: string;
  scheduledDate: string;
  status: string;
}

interface NewService {
  serviceType: string;
  busId: string;
  scheduledDate: string;
  status: string;
}

const ServiceScheduleApp: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [services, setServices] = useState<Service[]>([
    {
      id: 1,
      serviceType: 'Oil Change',
      busId: '23',
      scheduledDate: '2024-07-05',
      status: 'Pending'
    },
    {
      id: 2,
      serviceType: 'Brake Inspection',
      busId: '17',
      scheduledDate: '2024-07-10',
      status: 'Pending'
    },
    {
      id: 3,
      serviceType: 'Tire Rotation',
      busId: '21',
      scheduledDate: '2024-07-15',
      status: 'Completed'
    }
  ]);
  const [showNewScheduleModal, setShowNewScheduleModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [newService, setNewService] = useState<NewService>({
    serviceType: '',
    busId: '',
    scheduledDate: '',
    status: 'Pending'
  });
  const [editingService, setEditingService] = useState<Service | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  const getServicesForDate = (date: Date): Service[] => {
    const dateStr = date.toISOString().split('T')[0];
    return services.filter(service => service.scheduledDate === dateStr);
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
    }
  };

  const handleAddService = (): void => {
    if (newService.serviceType && newService.busId && newService.scheduledDate) {
      const service = {
        id: services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1,
        ...newService
      };
      setServices([...services, service]);
      setNewService({
        serviceType: '',
        busId: '',
        scheduledDate: '',
        status: 'Pending'
      });
      setShowNewScheduleModal(false);
    }
  };

  const handleEditService = (service: Service): void => {
    setEditingService(service);
    setShowEditModal(true);
  };

  const handleUpdateService = (): void => {
    if (editingService) {
      setServices(services.map(service => 
        service.id === editingService.id ? editingService : service
      ));
      setShowEditModal(false);
      setEditingService(null);
    }
  };

  const handleDeleteService = (id: number): void => {
    setServices(services.filter(service => service.id !== id));
  };

  const handleMarkAsCompleted = (id: number): void => {
    setServices(services.map(service => 
      service.id === id ? {...service, status: 'Completed'} : service
    ));
  };

  const calendarDays = getDaysInMonth(currentDate);
  const today = new Date();

  // Available buses under the depot (hardcoded based on context)
  const availableBuses = [
    { id: '17', number: 'NC-1234' },
    { id: '21', number: 'NP-3456' },
    { id: '23', number: 'NY-3891' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Service Schedules</h1>
          <button
            onClick={() => setShowNewScheduleModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <span className="text-lg">+</span>
            New Schedule
          </button>
        </div>

        {/* Calendar Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-grow mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-6">Calendar View</h2>
            
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
                const dayServices = cellDate ? getServicesForDate(cellDate) : [];
                const isToday = cellDate && cellDate.toDateString() === today.toDateString();
                const isSelected = cellDate && cellDate.toDateString() === selectedDate.toDateString();

                return (
                  <div
                    key={index}
                    className={`p-1 border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isToday ? 'bg-blue-50 border-blue-200' : ''
                    } ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
                    onClick={() => handleDateClick(day)}
                  >
                    {day && (
                      <div>
                        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayServices.slice(0, 2).map((service, idx) => (
                            <div
                              key={idx}
                              className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 truncate"
                            >
                              {service.serviceType}
                            </div>
                          ))}
                          {dayServices.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{dayServices.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Services Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-6">Upcoming Services</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Service Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Bus ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Scheduled Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-gray-900">{service.serviceType}</td>
                      <td className="py-4 px-4 text-gray-900">{service.busId}</td>
                      <td className="py-4 px-4 text-gray-900">{service.scheduledDate}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                          {getStatusIcon(service.status)}
                          {service.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditService(service)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <span className="text-sm">✏️</span>
                          </button>
                          {service.status !== 'Completed' && (
                            <button
                              onClick={() => handleMarkAsCompleted(service.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Mark as completed"
                            >
                              <span className="text-sm">✓</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <span className="text-sm">🗑️</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* New Schedule Modal */}
        {showNewScheduleModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Schedule New Service</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                  <input
                    type="text"
                    value={newService.serviceType}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewService({...newService, serviceType: e.target.value})}
                    placeholder="e.g., Oil Change"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus ID</label>
                  <select
                    value={newService.busId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewService({...newService, busId: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a bus</option>
                    {availableBuses.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.number} ({bus.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={newService.scheduledDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewService({...newService, scheduledDate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newService.status}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewService({...newService, status: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewScheduleModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddService}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Schedule Modal */}
        {showEditModal && editingService && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Service</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                  <input
                    type="text"
                    value={editingService.serviceType}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setEditingService({...editingService, serviceType: e.target.value})
                    }
                    placeholder="e.g., Oil Change"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus ID</label>
                  <select
                    value={editingService.busId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                      setEditingService({...editingService, busId: e.target.value})
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a bus</option>
                    {availableBuses.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.number} ({bus.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={editingService.scheduledDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setEditingService({...editingService, scheduledDate: e.target.value})
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingService.status}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                      setEditingService({...editingService, status: e.target.value})
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
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
                  onClick={handleUpdateService}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceScheduleApp;