import React, { useState, useEffect, useContext } from 'react';
import { 
  FaCheck, 
  FaClock, 
  FaCalendarAlt, 
  FaExclamationTriangle, 
  FaExclamationCircle, 
  FaTimes,
  FaClipboardList,
  FaHourglassHalf,
  FaCheckCircle,
  FaPlus,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { AppContext } from '../../../context/AppContext';
import axios, { AxiosError } from 'axios';

interface Service {
  id: number;
  service_type: string;
  bus_id: number;
  scheduled_date: string;
  status: string;
  completed_date?: string;
  cancelled_date?: string;
  depot_id: number;
  created_at: string;
  updated_at: string;
  registration_number?: string;
  manufacturer?: string;
  model?: string;
  depot_name?: string;
  calculated_status?: string;
  is_deleted?: boolean;
}

interface Bus {
  bus_id: number;
  registration_number: string;
  manufacturer: string;
  model: string;
  depot_id: number;
  status: string;
}

interface NewService {
  service_type: string;
  bus_id: string;
  scheduled_date: string;
}

interface Stats {
  total_services: number;
  pending_count: number;
  due_today_count: number;
  in_progress_count: number;
  completed_count: number;
  overdue_count: number;
  critical_overdue_count: number;
  cancelled_count: number;
}

interface AppContextType {
  user: { role: string; userId: string; depot_id?: number; region_id?: number; } | null;
  token: string | null;
}

const ServiceScheduleApp: React.FC = () => {
  const context = useContext(AppContext) as AppContextType | null;
  
  // Utility function to get current Sri Lankan time
  const getSriLankanDate = (date?: Date): Date => {
    const baseDate = date || new Date();
    return new Date(baseDate.getTime() + (5.5 * 60 * 60 * 1000));
  };
  
  // Utility function to get Sri Lankan date string (YYYY-MM-DD)
  const getSriLankanDateString = (date?: Date): string => {
    return getSriLankanDate(date).toISOString().split('T')[0];
  };

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [services, setServices] = useState<Service[]>([]);
  const [availableBuses, setAvailableBuses] = useState<Bus[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_services: 0,
    pending_count: 0,
    due_today_count: 0,
    in_progress_count: 0,
    completed_count: 0,
    overdue_count: 0,
    critical_overdue_count: 0,
    cancelled_count: 0
  });
  const [showNewScheduleModal, setShowNewScheduleModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [newService, setNewService] = useState<NewService>({
    service_type: '',
    bus_id: '',
    scheduled_date: ''
  });
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const token = context?.token;
  const user = context?.user;

  // Debug: Log user context
  useEffect(() => {
    console.log('User context:', user);
    console.log('Token:', token ? 'Present' : 'Missing');
  }, [user, token]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // API Functions
  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        setError('Authentication token is missing. Please log in.');
        setLoading(false);
        return;
      }

      console.log('User role:', user?.role);
      console.log('User depot_id:', user?.depot_id);
      console.log('Fetching services from:', 'http://localhost:5000/api/depot-engineer/service-schedules');

      const response = await axios.get(
        'http://localhost:5000/api/depot-engineer/service-schedules',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setServices(response.data.schedules);
        console.log('Services fetched successfully:', response.data.schedules);
        console.log('Service dates:', response.data.schedules.map((s: Service) => ({ id: s.id, scheduled_date: s.scheduled_date, service_type: s.service_type })));
        
        // Debug: Check each service date format
        response.data.schedules.forEach((service: Service) => {
          console.log(`🗃️ DB Service ID ${service.id}:`, {
            service_type: service.service_type,
            scheduled_date: service.scheduled_date,
            date_type: typeof service.scheduled_date,
            is_timestamp: service.scheduled_date.includes('T'),
            split_result: service.scheduled_date.split('T')[0]
          });
        });
        
        // Log today's date for comparison
        const today = new Date();
        console.log('Today\'s date for comparison:', today.toISOString().split('T')[0]);
        console.log('Current calendar month/year:', currentDate.getMonth() + 1, currentDate.getFullYear());
      } else {
        setError(`Failed to fetch service schedules: ${response.data.message}`);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('API Error:', axiosError);
      if (axiosError.response) {
        console.error('Response data:', axiosError.response.data);
        console.error('Response status:', axiosError.response.status);
        setError(`Failed to fetch service schedules: ${axiosError.response.status} - ${(axiosError.response.data as any)?.message || axiosError.response.statusText}`);
      } else {
        setError('Failed to fetch service schedules. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      if (!token) return;

      console.log('User role:', user?.role);
      console.log('User depot_id:', user?.depot_id);
      console.log('Fetching stats from:', 'http://localhost:5000/api/depot-engineer/service-schedules/stats');

      const response = await axios.get(
        'http://localhost:5000/api/depot-engineer/service-schedules/stats',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setStats({
          total_services: parseInt(response.data.stats.total_services),
          pending_count: parseInt(response.data.stats.pending_count),
          due_today_count: parseInt(response.data.stats.due_today_count),
          in_progress_count: parseInt(response.data.stats.in_progress_count),
          completed_count: parseInt(response.data.stats.completed_count),
          overdue_count: parseInt(response.data.stats.overdue_count),
          critical_overdue_count: parseInt(response.data.stats.critical_overdue_count),
          cancelled_count: parseInt(response.data.stats.cancelled_count),
        });
        console.log('Stats fetched successfully:', response.data.stats);
      } else {
        console.error('Stats API returned success: false', response.data);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Stats API Error:', axiosError);
      if (axiosError.response) {
        console.error('Stats Response data:', axiosError.response.data);
        console.error('Stats Response status:', axiosError.response.status);
      }
    }
  };

  const fetchAvailableBuses = async () => {
    try {
      if (!token) return;

      console.log('User role:', user?.role);
      console.log('User depot_id:', user?.depot_id);

      // Use the direct depot-engineer buses endpoint like other working components
      const apiUrl = 'http://localhost:5000/api/depot-engineer/buses';
      console.log('Fetching buses from:', apiUrl);
      
      const response = await axios.get(
        apiUrl,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const buses: Bus[] = response.data.buses || [];
        console.log('All buses from API:', buses);
        console.log('Total buses received:', buses.length);

        const maintenanceBuses = buses.filter(bus => bus.status?.toLowerCase() === 'maintenance');
        console.log('Filtered maintenance buses:', maintenanceBuses);

        setAvailableBuses(maintenanceBuses);
      } else {
        console.error('API returned success: false', response.data);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Buses API Error:', axiosError);
      if (axiosError.response) {
        console.error('Response data:', axiosError.response.data);
        console.error('Response status:', axiosError.response.status);
      }
    }
  };

  useEffect(() => {
    fetchServices();
    fetchStats();
    fetchAvailableBuses();
  }, [token]);

  // Force calendar re-render when services change
  useEffect(() => {
    console.log('Services updated, calendar should re-render. Service count:', services.length);
  }, [services]);

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
    // Format the date in local timezone as YYYY-MM-DD to avoid UTC conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const filteredServices = services.filter(service => {
      // Handle both date formats: clean "YYYY-MM-DD" strings and "YYYY-MM-DDTHH:mm:ss.sssZ" timestamps
      let serviceDate;
      if (service.scheduled_date.includes('T')) {
        // If it's a timestamp, extract date part
        serviceDate = service.scheduled_date.split('T')[0];
      } else {
        // If it's already a clean date string, use as-is
        serviceDate = service.scheduled_date;
      }
      return serviceDate === dateStr;
    });
    
    console.log('🕐 Calendar date comparison debug:');
    console.log('Selected calendar date (local format):', dateStr);
    console.log('Original date object:', date);
    console.log('Services found for date:', filteredServices.length);
    console.log('Service dates comparison:', services.map(s => {
      let serviceDate;
      if (s.scheduled_date.includes('T')) {
        serviceDate = s.scheduled_date.split('T')[0];
      } else {
        serviceDate = s.scheduled_date;
      }
      return {
        id: s.id, 
        scheduled_date_raw: s.scheduled_date, 
        scheduled_date_cleaned: serviceDate,
        service_type: s.service_type,
        matches: serviceDate === dateStr
      };
    }));
    
    return filteredServices;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-gray-100 text-gray-800';
      case 'Due Today':
        return 'bg-yellow-100 text-yellow-800';
      case 'Overdue':
        return 'bg-orange-100 text-orange-800';
      case 'Critical Overdue':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case 'Completed':
        return <FaCheck className="w-4 h-4 text-green-600" />;
      case 'In Progress':
        return <FaHourglassHalf className="w-4 h-4 text-blue-600" />;
      case 'Pending':
        return <FaClock className="w-4 h-4 text-gray-600" />;
      case 'Due Today':
        return <FaCalendarAlt className="w-4 h-4 text-yellow-600" />;
      case 'Overdue':
        return <FaExclamationTriangle className="w-4 h-4 text-orange-600" />;
      case 'Critical Overdue':
        return <FaExclamationCircle className="w-4 h-4 text-red-600" />;
      case 'Cancelled':
        return <FaTimes className="w-4 h-4 text-gray-500" />;
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
      // Create date in local timezone context
      const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      console.log('🗓️ Date clicked:', clickedDate.toISOString().split('T')[0]);
      console.log('🗓️ Day number clicked:', day);
      console.log('🗓️ Current month/year:', currentDate.getMonth() + 1, currentDate.getFullYear());
      console.log('🗓️ Full clicked date:', clickedDate);
      setSelectedDate(clickedDate);
    }
  };

  const handleAddService = async (): Promise<void> => {
    // Form validation
    if (!newService.service_type) {
      setError('Please select a service type');
      return;
    }
    if (!newService.bus_id) {
      setError('Please select a bus');
      return;
    }
    if (!newService.scheduled_date) {
      setError('Please select a scheduled date');
      return;
    }
    
    // Check if date is not in the past (using local date comparison)
    const selectedDate = new Date(newService.scheduled_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setError('Scheduled date cannot be in the past');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        'http://localhost:5000/api/depot-engineer/service-schedules',
        newService,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setNewService({
          service_type: '',
          bus_id: '',
          scheduled_date: '',
        });
        setShowNewScheduleModal(false);
        setError(null);
        await fetchServices();
        await fetchStats();
      } else {
        setError(response.data.message || 'Failed to create service schedule');
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Create Service Error:', axiosError);
      setError('Failed to create service schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditService = (service: Service): void => {
    setEditingService(service);
    setShowEditModal(true);
  };

  const handleViewService = (service: Service): void => {
    setViewingService(service);
    setShowViewModal(true);
  };

  const handleUpdateService = async (): Promise<void> => {
    if (!editingService) return;

    try {
      setLoading(true);
      const response = await axios.put(
        `http://localhost:5000/api/depot-engineer/service-schedules/${editingService.id}`,
        {
          service_type: editingService.service_type,
          bus_id: editingService.bus_id,
          scheduled_date: editingService.scheduled_date
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setShowEditModal(false);
        setEditingService(null);
        setError(null);
        // Refresh the data to get updated service
        await fetchServices();
        await fetchStats();
        console.log('Service updated successfully:', response.data.schedule);
      } else {
        setError(response.data.message || 'Failed to update service schedule');
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Update Service Error:', axiosError);
      setError('Failed to update service schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartWork = async (id: number): Promise<void> => {
    try {
      setLoading(true);
      const response = await axios.patch(
        `http://localhost:5000/api/depot-engineer/service-schedules/${id}/start`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Refresh the data to get updated statuses
        await fetchServices();
        await fetchStats();
        console.log('Work started successfully:', response.data.schedule);
      } else {
        setError(response.data.message || 'Failed to start work');
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Start Work Error:', axiosError);
      setError('Failed to start work. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsCompleted = async (id: number): Promise<void> => {
    try {
      setLoading(true);
      const response = await axios.patch(
        `http://localhost:5000/api/depot-engineer/service-schedules/${id}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Refresh the data to get updated statuses
        await fetchServices();
        await fetchStats();
        console.log('Service completed successfully:', response.data.schedule);
      } else {
        setError(response.data.message || 'Failed to complete service');
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Complete Service Error:', axiosError);
      setError('Failed to complete service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelService = async (id: number): Promise<void> => {
    try {
      setLoading(true);
      const response = await axios.patch(
        `http://localhost:5000/api/depot-engineer/service-schedules/${id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Refresh the data to get updated statuses
        await fetchServices();
        await fetchStats();
        console.log('Service cancelled successfully:', response.data.schedule);
      } else {
        setError(response.data.message || 'Failed to cancel service');
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Cancel Service Error:', axiosError);
      setError('Failed to cancel service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = getDaysInMonth(currentDate);
  // Get today's date in local timezone without UTC conversion
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  
  // Format today in local timezone for consistent comparison
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  console.log('📅 Today calculated as (local):', todayStr);
  console.log('📅 Today full:', today);
  console.log('📅 Calendar month/year:', currentDate.getMonth() + 1, currentDate.getFullYear());

  // Helper function to get bus details by ID
  const getBusDetails = (busId: string | number) => {
    const bus = availableBuses.find(b => b.bus_id.toString() === busId.toString());
    return bus ? `${bus.registration_number}` : busId;
  };

  // Helper function to format date for display (handles timezone issues)
  const formatDateForDisplay = (dateString: string): string => {
    console.log('🔍 formatDateForDisplay called with:', {
      input: dateString,
      type: typeof dateString,
      length: dateString?.length
    });
    
    // Check if input is valid
    if (!dateString) {
      console.warn('❌ Empty or null dateString received');
      return 'Invalid Date';
    }
    
    // If the date is already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.log('✅ Date already in YYYY-MM-DD format:', dateString);
      return dateString;
    }
    
    // For backward compatibility with timestamps, extract the date part
    if (dateString.includes('T')) {
      const result = dateString.split('T')[0];
      console.log('🔄 Date conversion from timestamp:', {
        original: dateString,
        result: result
      });
      return result;
    }
    
    // If it's some other format, return as-is and log a warning
    console.warn('⚠️ Unexpected date format:', dateString);
    return dateString;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto flex flex-col h-full">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading service schedules...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <FaExclamationTriangle className="mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Service Schedules</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowNewScheduleModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaPlus className="text-lg" />
              New Schedule
            </button>
          </div>
        </div>

        {/* Overdue Services Alert */}
        {(stats.overdue_count > 0 || stats.critical_overdue_count > 0) && (
          <div className="mb-6 space-y-3">
            {stats.critical_overdue_count > 0 && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaExclamationCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Critical Overdue Services
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        You have <strong>{stats.critical_overdue_count}</strong> critical overdue service{stats.critical_overdue_count > 1 ? 's' : ''} that require immediate attention.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {stats.overdue_count > 0 && (
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaExclamationTriangle className="h-5 w-5 text-orange-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">
                      Overdue Services
                    </h3>
                    <div className="mt-2 text-sm text-orange-700">
                      <p>
                        You have <strong>{stats.overdue_count}</strong> overdue service{stats.overdue_count > 1 ? 's' : ''} that need to be addressed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SLTB Depot Service Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <FaClipboardList className="text-blue-600 text-lg" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Services</p>
                <p className="text-xl font-bold text-gray-900">{stats.total_services}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                <FaCalendarAlt className="text-yellow-600 text-lg" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Today</p>
                <p className="text-xl font-bold text-gray-900">{stats.due_today_count}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-lg mr-3">
                <FaExclamationTriangle className="text-red-600 text-lg" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-xl font-bold text-red-600">{stats.overdue_count + stats.critical_overdue_count}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <FaHourglassHalf className="text-blue-600 text-lg" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-xl font-bold text-blue-600">{stats.in_progress_count}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <FaCheckCircle className="text-green-600 text-lg" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xl font-bold text-green-600">{stats.completed_count}</p>
              </div>
            </div>
          </div>
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
                <FaChevronLeft />
              </button>
              <h3 className="text-lg font-semibold">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg font-bold"
              >
                <FaChevronRight />
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
                const dayServices = cellDate ? getServicesForDate(cellDate).filter(service => !service.is_deleted) : [];
                const isToday = cellDate && cellDate.toDateString() === today.toDateString();
                const isSelected = cellDate && cellDate.toDateString() === selectedDate.toDateString();
                const hasServices = dayServices.length > 0;

                return (
                  <div
                    key={index}
                    className={`p-1 border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors min-h-[100px] ${
                      isToday ? 'bg-blue-50 border-blue-200' : ''
                    } ${isSelected ? 'bg-blue-100 border-blue-300' : ''} ${
                      hasServices ? 'border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleDateClick(day)}
                  >
                    {day && (
                      <div>
                        <div className={`text-sm font-medium mb-2 flex items-center justify-between ${
                          isToday ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          <span>{day}</span>
                          {hasServices && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="space-y-1">
                          {dayServices.slice(0, 3).map((service, idx) => {
                            const status = service.calculated_status || service.status;
                            let statusColor = 'bg-blue-100 text-blue-800';
                            
                            // Set colors based on status
                            switch (status) {
                              case 'Completed':
                                statusColor = 'bg-green-100 text-green-800';
                                break;
                              case 'In Progress':
                                statusColor = 'bg-blue-100 text-blue-800';
                                break;
                              case 'Due Today':
                                statusColor = 'bg-yellow-100 text-yellow-800';
                                break;
                              case 'Overdue':
                                statusColor = 'bg-orange-100 text-orange-800';
                                break;
                              case 'Critical Overdue':
                                statusColor = 'bg-red-100 text-red-800';
                                break;
                              case 'Pending':
                                statusColor = 'bg-gray-100 text-gray-800';
                                break;
                              default:
                                statusColor = 'bg-blue-100 text-blue-800';
                            }

                            return (
                              <div
                                key={idx}
                                className={`text-xs px-2 py-1 rounded-md truncate ${statusColor} cursor-pointer`}
                                title={`${service.service_type} - ${status}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewService(service);
                                }}
                              >
                                <div className="font-medium">{service.service_type}</div>
                                <div className="text-xs opacity-75">Bus {getBusDetails(service.bus_id)}</div>
                              </div>
                            );
                          })}
                          {dayServices.length > 3 && (
                            <div className="text-xs text-gray-500 px-1">
                              +{dayServices.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                <span className="text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                <span className="text-gray-600">In Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                <span className="text-gray-600">Due Today</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
                <span className="text-gray-600">Overdue</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                <span className="text-gray-600">Critical Overdue</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                <span className="text-gray-600">Pending</span>
              </div>
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
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Bus</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Scheduled Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.filter(service => !service.is_deleted).map((service) => {
                    // Debug each service in the table
                    console.log('🏓 Table row for service:', {
                      id: service.id,
                      service_type: service.service_type,
                      scheduled_date_raw: service.scheduled_date,
                      scheduled_date_type: typeof service.scheduled_date,
                      formatted_result: formatDateForDisplay(service.scheduled_date)
                    });
                    
                    return (
                    <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-gray-900">{service.service_type}</td>
                      <td className="py-4 px-4 text-gray-900">{getBusDetails(service.bus_id)}</td>
                      <td className="py-4 px-4 text-gray-900">{formatDateForDisplay(service.scheduled_date)}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.calculated_status || service.status)}`}>
                          {getStatusIcon(service.calculated_status || service.status)}
                          {service.calculated_status || service.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          {/* Start Work Button - only for due today/overdue (NOT pending) */}
                          {((service.calculated_status || service.status) === 'Due Today' || 
                            (service.calculated_status || service.status) === 'Overdue' || 
                            (service.calculated_status || service.status) === 'Critical Overdue') && (
                            <button
                              onClick={() => handleStartWork(service.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-medium transition-colors"
                              title="Start Work"
                              disabled={loading}
                            >
                              Start Work
                            </button>
                          )}
                          
                          {/* Complete Button - only for in progress */}
                          {(service.calculated_status || service.status) === 'In Progress' && (
                            <button
                              onClick={() => handleMarkAsCompleted(service.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs font-medium transition-colors"
                              title="Mark as Completed"
                              disabled={loading}
                            >
                              Complete
                            </button>
                          )}
                          
                          {/* View Button - only for completed services */}
                          {(service.calculated_status || service.status) === 'Completed' && (
                            <button 
                              onClick={() => handleViewService(service)}
                              className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-xs font-medium transition-colors"
                              title="View Service Details"
                            >
                              View Details
                            </button>
                          )}
                          
                          {/* Edit Button - only for non-completed services */}
                          {(service.calculated_status || service.status) !== 'Completed' && 
                           (service.calculated_status || service.status) !== 'In Progress' && (
                            <button 
                              onClick={() => handleEditService(service)}
                              className="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-xs font-medium transition-colors"
                              title="Edit Schedule"
                              disabled={loading}
                            >
                              Edit
                            </button>
                          )}
                          
                          {/* Cancel Button - available for all statuses except In Progress and Completed */}
                          {((service.calculated_status || service.status) !== 'In Progress' && 
                            (service.calculated_status || service.status) !== 'Completed') && (
                            <button
                              onClick={() => handleCancelService(service.id)}
                              className="px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-xs font-medium transition-colors"
                              title="Cancel Schedule"
                              disabled={loading}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* New Schedule Modal */}
        {showNewScheduleModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-2">Schedule New Service</h3>
              
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                  <input
                    type="text"
                    value={newService.service_type}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewService({...newService, service_type: e.target.value})}
                    placeholder="e.g., Daily Inspection, Oil Change, Brake Check..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus</label>
                  <select
                    value={newService.bus_id}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewService({...newService, bus_id: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a bus</option>
                    {availableBuses.map((bus) => (
                      <option key={bus.bus_id} value={bus.bus_id}>
                        {bus.registration_number} - {bus.model} (ID: {bus.bus_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={newService.scheduled_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewService({...newService, scheduled_date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
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
                    value={editingService.service_type}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditingService({...editingService, service_type: e.target.value})
                    }
                    placeholder="e.g., Daily Inspection, Oil Change, Brake Check..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus</label>
                  <select
                    value={editingService.bus_id}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setEditingService({...editingService, bus_id: parseInt(e.target.value)})
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a bus</option>
                    {availableBuses.map((bus) => (
                      <option key={bus.bus_id} value={bus.bus_id}>
                        {bus.registration_number} - {bus.model} (ID: {bus.bus_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={editingService.scheduled_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditingService({...editingService, scheduled_date: e.target.value})
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
                  onClick={handleUpdateService}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Service Details Modal - Read Only */}
        {showViewModal && viewingService && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Service Details</h3>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <FaCheckCircle size={10} />
                  Completed
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Service Type</label>
                  <p className="text-gray-900 font-medium">{viewingService.service_type}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Bus</label>
                  <p className="text-gray-900 font-medium">{getBusDetails(viewingService.bus_id)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Scheduled Date</label>
                    <p className="text-gray-900">{formatDateForDisplay(viewingService.scheduled_date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Completed Date</label>
                    <p className="text-gray-900 font-medium">{viewingService.completed_date ? formatDateForDisplay(viewingService.completed_date) : 'N/A'}</p>
                  </div>
                </div>

                
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
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