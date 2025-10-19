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

interface DailyChecklist {
  checklist_id: number;
  bus_id: number;
  checker_id: number;
  check_date: string;
  engine: boolean | null;
  brakes: boolean | null;
  tires: boolean | null;
  windows: boolean | null;
  doors: boolean | null;
  headlights: boolean | null;
  signallights: boolean | null;
  status_after_check: string | null;
  created_at?: string;
  updated_at?: string;
  first_name?: string;
  last_name?: string;
  registration_number?: string;
  missed_parts?: string[];
  missed_part_details?: ChecklistPartDetail[];
}

interface ChecklistPartDetail {
  key?: string;
  label: string;
  notes: string | null;
  severity: string | null;
}

interface ChecklistIssueEntry {
  checklist: DailyChecklist;
  parts: ChecklistPartDetail[];
  busName: string;
  statusLabel: string;
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

const STATUS_PRIORITY: Record<string, number> = {
  'Critical Overdue': 0,
  'Overdue': 1,
  'Due Today': 2,
  'In Progress': 3,
  'Pending': 4,
  'Scheduled': 4,
  'Cancelled': 5,
  'Completed': 6
};

type ChecklistPartKey = 'engine' | 'brakes' | 'tires' | 'windows' | 'doors' | 'headlights' | 'signallights';

const CHECKLIST_PARTS: Array<{ key: ChecklistPartKey; label: string }> = [
  { key: 'engine', label: 'Engine' },
  { key: 'brakes', label: 'Brakes' },
  { key: 'tires', label: 'Tires' },
  { key: 'windows', label: 'Windows' },
  { key: 'doors', label: 'Doors' },
  { key: 'headlights', label: 'Head Lights' },
  { key: 'signallights', label: 'Signal Lights' }
];

const isChecklistPartPassed = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return false;
};

const getSeverityBadgeClasses = (severity: string | null): string => {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-700';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700';
    case 'low':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const formatSeverityLabel = (severity: string | null): string => {
  if (!severity) {
    return 'Not specified';
  }
  return severity.charAt(0).toUpperCase() + severity.slice(1);
};

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const buildDepotEngineerServiceSchedulesUrl = () => `${API_BASE_URL}/api/depot-engineer/service-schedules`;
const buildDepotEngineerServiceScheduleStatsUrl = () => `${API_BASE_URL}/api/depot-engineer/service-schedules/stats`;
const buildDepotEngineerServiceScheduleByIdUrl = (id: number) => `${buildDepotEngineerServiceSchedulesUrl()}/${id}`;
const buildDepotEngineerServiceScheduleStartUrl = (id: number) => `${buildDepotEngineerServiceScheduleByIdUrl(id)}/start`;
const buildDepotEngineerServiceScheduleCompleteUrl = (id: number) => `${buildDepotEngineerServiceScheduleByIdUrl(id)}/complete`;
const buildDepotEngineerServiceScheduleCancelUrl = (id: number) => `${buildDepotEngineerServiceScheduleByIdUrl(id)}/cancel`;
const buildDepotEngineerBusesUrl = () => `${API_BASE_URL}/api/depot-engineer/buses`;
const buildDepotEngineerDailyChecklistsUrl = () => `${API_BASE_URL}/api/depot-engineer/daily-checklists`;

const ServiceScheduleApp: React.FC = () => {
  // @ts-ignore

  const context = useContext(AppContext) as AppContextType | null;

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [services, setServices] = useState<Service[]>([]);
  const [allBuses, setAllBuses] = useState<Bus[]>([]);
  const [maintenanceBuses, setMaintenanceBuses] = useState<Bus[]>([]);
  const [dailyChecklists, setDailyChecklists] = useState<DailyChecklist[]>([]);
  const [showMaintenanceChecklist, setShowMaintenanceChecklist] = useState<boolean>(false);
  const [showActiveLowSeverity, setShowActiveLowSeverity] = useState<boolean>(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
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

  const maintenanceAlertBuses = React.useMemo(() => {
    if (!maintenanceBuses.length) {
      return [];
    }

    return maintenanceBuses.filter((bus) => {
      const hasActiveSchedule = services.some((service) => {
        if (service.is_deleted) {
          return false;
        }

        if (service.bus_id !== bus.bus_id) {
          return false;
        }

        const status = (service.calculated_status || service.status || '').trim();
        return status !== 'Completed' && status !== 'Cancelled';
      });

      return !hasActiveSchedule;
    });
  }, [maintenanceBuses, services]);

  const maintenanceAlertBusIds = React.useMemo(() => {
    return new Set(maintenanceAlertBuses.map((bus) => bus.bus_id));
  }, [maintenanceAlertBuses]);

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
      const servicesUrl = buildDepotEngineerServiceSchedulesUrl();
      console.log('Fetching services from:', servicesUrl);

      const response = await axios.get(
        servicesUrl,
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
      const statsUrl = buildDepotEngineerServiceScheduleStatsUrl();
      console.log('Fetching stats from:', statsUrl);

      const response = await axios.get(
        statsUrl,
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
  const apiUrl = buildDepotEngineerBusesUrl();
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

  const maintenanceOnly = buses.filter((bus) => (bus.status || '').trim().toLowerCase() === 'maintenance');
        console.log('Filtered maintenance buses:', maintenanceOnly);

        setAllBuses(buses);
        setMaintenanceBuses(maintenanceOnly);
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

  const fetchDailyChecklists = async () => {
    try {
      if (!token) return;

      const response = await axios.get(
        buildDepotEngineerDailyChecklistsUrl(),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setDailyChecklists(response.data.checklists || []);
      } else {
        console.error('Daily checklists API returned success: false', response.data);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Daily checklists API error:', axiosError);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchStats();
    fetchAvailableBuses();
    fetchDailyChecklists();
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
        buildDepotEngineerServiceSchedulesUrl(),
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


  const openNewScheduleForBus = (bus: Bus): void => {
    setNewService({
      service_type: '',
      bus_id: bus.bus_id.toString(),
      scheduled_date: ''
    });
    setShowNewScheduleModal(true);
  };
  const handleUpdateService = async (): Promise<void> => {
    if (!editingService) return;

    try {
      setLoading(true);
      const response = await axios.put(
        buildDepotEngineerServiceScheduleByIdUrl(editingService.id),
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
        buildDepotEngineerServiceScheduleStartUrl(id),
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
        buildDepotEngineerServiceScheduleCompleteUrl(id),
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
        buildDepotEngineerServiceScheduleCancelUrl(id),
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

  const busLookup = React.useMemo(() => {
    const lookup = new Map<number, Bus>();
    allBuses.forEach((bus) => {
      lookup.set(bus.bus_id, bus);
    });
    return lookup;
  }, [allBuses]);

  const sortedServices = React.useMemo(() => {
    return [...services]
      .filter(service => !service.is_deleted)
      .sort((a, b) => {
        const statusA = (a.calculated_status || a.status || '').trim();
        const statusB = (b.calculated_status || b.status || '').trim();
        const priorityA = STATUS_PRIORITY[statusA] ?? 99;
        const priorityB = STATUS_PRIORITY[statusB] ?? 99;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        const dateA = new Date(a.scheduled_date).getTime();
        const dateB = new Date(b.scheduled_date).getTime();
        return dateA - dateB;
      });
  }, [services]);

  const availableStatuses = React.useMemo(() => {
    const statuses = new Set<string>();

    services.forEach((service) => {
      if (service.is_deleted) {
        return;
      }

      const status = (service.calculated_status || service.status || '').trim();
      if (status) {
        statuses.add(status);
      }
    });

    return Array.from(statuses).sort((a, b) => {
      const priorityA = STATUS_PRIORITY[a] ?? 99;
      const priorityB = STATUS_PRIORITY[b] ?? 99;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return a.localeCompare(b);
    });
  }, [services]);

  React.useEffect(() => {
    setSelectedStatuses((prev) => {
      const next = prev.filter((status) => availableStatuses.includes(status));
      if (next.length === prev.length && next.every((status, index) => status === prev[index])) {
        return prev;
      }
      return next;
    });
  }, [availableStatuses]);

  const filteredServices = React.useMemo(() => {
    if (!selectedStatuses.length) {
      return sortedServices;
    }

    const selection = new Set(selectedStatuses.map((status) => status.trim()));
    return sortedServices.filter((service) => {
      const status = (service.calculated_status || service.status || '').trim();
      return selection.has(status);
    });
  }, [sortedServices, selectedStatuses]);

  const toggleStatusFilter = React.useCallback((status: string) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((item) => item !== status);
      }
      return [...prev, status];
    });
  }, []);

  const resetStatusFilters = React.useCallback(() => {
    setSelectedStatuses([]);
  }, []);

  const openSchedulesByBus = React.useMemo(() => {
    const counts = new Map<number, number>();

    services.forEach((service) => {
      if (service.is_deleted) {
        return;
      }

      const busId = service.bus_id;
      if (!busId) {
        return;
      }

      const statusNormalized = (service.calculated_status || service.status || '').trim().toLowerCase();
      const isClosed =
        statusNormalized.startsWith('completed') ||
        statusNormalized.startsWith('cancelled');

      if (!isClosed) {
        counts.set(busId, (counts.get(busId) ?? 0) + 1);
      }
    });

    return counts;
  }, [services]);

  const { maintenanceChecklistIssues, activeLowSeverityIssues } = React.useMemo(() => {
    if (!dailyChecklists.length) {
      return {
        maintenanceChecklistIssues: [] as ChecklistIssueEntry[],
        activeLowSeverityIssues: [] as ChecklistIssueEntry[],
      };
    }

    const maintenanceBusIds = new Set(maintenanceBuses.map((bus) => bus.bus_id));
    const latestChecklistByBus = new Map<number, DailyChecklist>();

    dailyChecklists.forEach((checklist) => {
      if (!checklist.bus_id) {
        return;
      }

      const existing = latestChecklistByBus.get(checklist.bus_id);
      const checklistTimestamp = checklist.check_date ? new Date(checklist.check_date).getTime() : 0;
      const existingTimestamp = existing?.check_date ? new Date(existing.check_date).getTime() : 0;

      if (!existing || checklistTimestamp >= existingTimestamp) {
        latestChecklistByBus.set(checklist.bus_id, checklist);
      }
    });

    const maintenanceIssues: ChecklistIssueEntry[] = [];
    const activeLowIssues: ChecklistIssueEntry[] = [];

    latestChecklistByBus.forEach((checklist) => {
      let parts: ChecklistPartDetail[] = [];

      if (Array.isArray(checklist.missed_part_details) && checklist.missed_part_details.length > 0) {
        parts = checklist.missed_part_details.map((detail) => ({
          key: detail.key,
          label: detail.label || detail.key || 'Unknown part',
          notes: detail.notes ?? null,
          severity: detail.severity ?? null,
        }));
      } else {
        const fallbackParts = Array.isArray(checklist.missed_parts) && checklist.missed_parts.length > 0
          ? checklist.missed_parts
          : CHECKLIST_PARTS
            .filter(({ key }) => !isChecklistPartPassed(checklist[key]))
            .map(({ label }) => label);

        parts = fallbackParts.map((label) => ({
          label,
          notes: null,
          severity: null,
        }));
      }

      const filteredParts = parts.filter((part) => part.label);
      if (!filteredParts.length) {
        return;
      }

      const bus = busLookup.get(checklist.bus_id);
      const busName = checklist.registration_number || bus?.registration_number || `Bus ${checklist.bus_id}`;
      const statusRaw = (checklist.status_after_check || bus?.status || '').trim();
      const statusLabel = statusRaw || bus?.status || 'Unknown';
      const normalizedStatus = statusRaw.toLowerCase();
      const severityLevels = filteredParts.map((part) => (part.severity || 'low').toLowerCase());
      const hasHighSeverity = severityLevels.some((level) => level === 'high');
      const hasOnlyLowSeverity = severityLevels.every((level) => level === 'low');
      const isMaintenanceStatus = maintenanceBusIds.has(checklist.bus_id) || normalizedStatus.includes('maintenance');
      const isActiveStatus = normalizedStatus === 'active' || normalizedStatus.startsWith('active');

      const entry: ChecklistIssueEntry = {
        checklist,
        parts: filteredParts,
        busName,
        statusLabel,
      };

      if (isMaintenanceStatus) {
        if (hasHighSeverity) {
          return;
        }

        const openScheduleCount = openSchedulesByBus.get(checklist.bus_id) ?? 0;
        const unresolvedIssues = filteredParts.length;
        if (openScheduleCount >= unresolvedIssues && unresolvedIssues > 0) {
          return;
        }

        maintenanceIssues.push(entry);
        return;
      }

      if (isActiveStatus && hasOnlyLowSeverity) {
        activeLowIssues.push(entry);
      }
    });

    maintenanceIssues.sort((a, b) => a.busName.localeCompare(b.busName));
    activeLowIssues.sort((a, b) => a.busName.localeCompare(b.busName));

    return {
      maintenanceChecklistIssues: maintenanceIssues,
      activeLowSeverityIssues: activeLowIssues,
    };
  }, [dailyChecklists, maintenanceBuses, busLookup, openSchedulesByBus]);

  // Helper function to get bus details by ID
  const getBusDetails = (busId: string | number) => {
    const numericId = Number(busId);
    const bus = Number.isNaN(numericId) ? undefined : busLookup.get(numericId);
    if (bus?.registration_number) {
      return bus.registration_number;
    }
    if (typeof busId === 'string') {
      return busId;
    }
    return `Bus ${busId}`;
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


const extractIssueDescription = (serviceType: string): string => {
  if (!serviceType) {
    return '';
  }

  const autoMatch = serviceType.match(/auto follow-up[^-]*-\s*(.+)$/i);
  if (autoMatch?.[1]) {
    return autoMatch[1].trim();
  }

  const notesMatch = serviceType.match(/Notes?\s*:\s*(.+)$/i);
  if (notesMatch?.[1]) {
    return notesMatch[1].trim();
  }

  const descMatch = serviceType.match(/Description\s*:\s*(.+)$/i);
  if (descMatch?.[1]) {
    return descMatch[1].trim();
  }

  const pipeSegments = serviceType
    .split('|')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (pipeSegments.length >= 2) {
    return pipeSegments[pipeSegments.length - 1];
  }

  const hyphenSegments = serviceType
    .split(' - ')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (hyphenSegments.length >= 2) {
    return hyphenSegments[hyphenSegments.length - 1];
  }

  return serviceType.trim();
};

  const viewingStatus = viewingService
    ? (viewingService.calculated_status || viewingService.status || 'Unknown').trim()
    : '';

  const viewingStatusBadge = getStatusColor(viewingStatus || '');
  const viewingStatusIcon = getStatusIcon(viewingStatus || '');
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

        {stats.critical_overdue_count > 0 && (
          <div className="mb-6">
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
          </div>
        )}

        {maintenanceBuses.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <FaExclamationTriangle className="text-sky-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-sky-800">
                      Maintenance buses awaiting schedules
                    </h2>
                    <p className="text-sm text-sky-700 mt-1">
                      {maintenanceBuses.length} {maintenanceBuses.length === 1 ? 'bus is' : 'buses are'} currently in maintenance.{' '}
                      {maintenanceAlertBuses.length > 0
                        ? `${maintenanceAlertBuses.length} ${maintenanceAlertBuses.length === 1 ? 'does' : 'do'} not have an upcoming service.`
                        : 'All have upcoming services scheduled.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {maintenanceBuses.map((bus) => {
                        const lacksSchedule = maintenanceAlertBusIds.has(bus.bus_id);
                        return (
                        <button
                          key={bus.bus_id}
                          onClick={() => openNewScheduleForBus(bus)}
                          className="px-3 py-1 rounded-md text-xs font-semibold transition-colors border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          title={lacksSchedule ? 'No upcoming service scheduled' : 'Upcoming service already scheduled'}
                        >
                          {bus.registration_number}
                        </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowMaintenanceChecklist((prev) => !prev)}
                  className="self-start inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-sky-700 border border-sky-300 rounded-md hover:bg-sky-100 transition-colors"
                >
                  {showMaintenanceChecklist ? 'Hide maintenance issues table' : `View maintenance issues table (${maintenanceChecklistIssues.length})`}
                </button>
              </div>

              {showMaintenanceChecklist && (
                <div className="mt-4 bg-white border border-sky-100 rounded-lg p-4 overflow-x-auto shadow-sm">
                  {maintenanceChecklistIssues.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bus</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Checked</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Issues Logged</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {maintenanceChecklistIssues.map(({ checklist, parts, busName, statusLabel }) => (
                          <tr key={checklist.checklist_id} className="bg-white">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                              <div className="flex items-center gap-2">
                                <span>{busName}</span>
                                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-xs font-medium">
                                  {statusLabel || 'Maintenance'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDateForDisplay(checklist.check_date)}</td>
                            <td className="px-4 py-3">
                              <div className="space-y-3">
                                {parts.map((part, index) => (
                                  <div key={`${part.key || part.label}-${index}`} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="text-sm font-semibold text-gray-800">{part.label}</span>
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadgeClasses(part.severity)}`}>
                                        Severity: {formatSeverityLabel(part.severity)}
                                      </span>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-700">
                                      <span className="font-medium text-gray-800">Description:</span> {part.notes || 'No description provided.'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-sm text-gray-600">
                      No maintenance issues recorded for buses currently in maintenance.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeLowSeverityIssues.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <FaExclamationCircle className="text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-amber-800">
                      Active buses with low-severity findings
                    </h2>
                    <p className="text-sm text-amber-700 mt-1">
                      {activeLowSeverityIssues.length} {activeLowSeverityIssues.length === 1 ? 'bus is' : 'buses are'} currently active but still have outstanding low-severity findings logged during the latest checks. Review and schedule follow-up work if required.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowActiveLowSeverity((prev) => !prev)}
                  className="self-start inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-300 rounded-md hover:bg-amber-100 transition-colors"
                >
                  {showActiveLowSeverity ? 'Hide active low-severity findings' : `View low-severity findings (${activeLowSeverityIssues.length})`}
                </button>
              </div>

              {showActiveLowSeverity && (
                <div className="mt-4 bg-white border border-amber-100 rounded-lg p-4 overflow-x-auto shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bus</th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Checked</th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Issues Logged</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {activeLowSeverityIssues.map(({ checklist, parts, busName, statusLabel }) => (
                        <tr key={checklist.checklist_id} className="bg-white">
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                            <div className="flex items-center gap-2">
                              <span>{busName}</span>
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                {statusLabel || 'Active'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDateForDisplay(checklist.check_date)}</td>
                          <td className="px-4 py-3">
                            <div className="space-y-3">
                              {parts.map((part, index) => (
                                <div key={`${part.key || part.label}-${index}`} className="border border-amber-200 rounded-md p-3 bg-amber-50">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-sm font-semibold text-gray-800">{part.label}</span>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadgeClasses(part.severity)}`}>
                                      Severity: {formatSeverityLabel(part.severity)}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-sm text-gray-700">
                                    <span className="font-medium text-gray-800">Description:</span> {part.notes || 'No description provided.'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overdue Services Alert */}
        {stats.overdue_count > 0 && (
          <div className="mb-6">
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
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
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
                    className={`p-1 border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors min-h-[70px] ${
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
                                title={`${extractIssueDescription(service.service_type)} - ${status}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewService(service);
                                }}
                              >
                                <div className="font-medium">{extractIssueDescription(service.service_type)}</div>
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

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm font-medium text-gray-700">Filter by status:</span>
              <button
                onClick={resetStatusFilters}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${selectedStatuses.length === 0 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
              >
                All
              </button>
              {availableStatuses.map((status) => {
                const isActive = selectedStatuses.includes(status);
                return (
                  <button
                    key={status}
                    onClick={() => toggleStatusFilter(status)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
            
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
                  {filteredServices.length > 0 ? filteredServices.map((service) => {
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
                      <td className="py-4 px-4 text-gray-900" title={service.service_type}>{extractIssueDescription(service.service_type)}</td>
                      <td className="py-4 px-4 text-gray-900">{service.registration_number || getBusDetails(service.bus_id)}</td>
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
                  }) : (
                    <tr>
                      <td colSpan={5} className="py-6 px-4 text-center text-sm text-gray-600">
                        No services match the selected status filters.
                      </td>
                    </tr>
                  )}
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
                    {maintenanceBuses.map((bus) => (
                      <option key={bus.bus_id} value={bus.bus_id.toString()}>
                        {bus.registration_number}
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
                    {maintenanceBuses.map((bus) => (
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${viewingStatusBadge}`}>
                  {viewingStatusIcon}
                  {viewingStatus || 'Unknown'}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Service Type</label>
                  <p className="text-gray-900 font-medium">{extractIssueDescription(viewingService.service_type)}</p>
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