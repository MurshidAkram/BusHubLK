import React, { useState } from 'react';

const ScheduleOversight = () => {
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [selectedDepot, setSelectedDepot] = useState<string | null>(null);
  const [view, setView] = useState<'depots' | 'routes'>('depots');

  // Enhanced mock data for depots with addresses
  const mockDepots: Depot[] = [
    { 
      id: 1, 
      name: 'Main Depot', 
      address: '123 Central Avenue, Downtown', 
      phone: '+1 (555) 123-4567',
      capacity: 50,
      manager: 'Robert Johnson'
    },
    { 
      id: 2, 
      name: 'North Depot', 
      address: '456 Northern Blvd, Uptown', 
      phone: '+1 (555) 234-5678',
      capacity: 35,
      manager: 'Sarah Williams'
    },
    { 
      id: 3, 
      name: 'South Depot', 
      address: '789 Southern Parkway, Riverside', 
      phone: '+1 (555) 345-6789',
      capacity: 40,
      manager: 'Michael Chen'
    },
    { 
      id: 4, 
      name: 'East Depot', 
      address: '101 Eastern Road, Hilltop', 
      phone: '+1 (555) 456-7890',
      capacity: 30,
      manager: 'Emily Davis'
    },
    { 
      id: 5, 
      name: 'West Depot', 
      address: '202 Western Avenue, Lakeside', 
      phone: '+1 (555) 567-8901',
      capacity: 45,
      manager: 'James Wilson'
    },
    { 
      id: 6, 
      name: 'Central Depot', 
      address: '303 Midtown Street, Central District', 
      phone: '+1 (555) 678-9012',
      capacity: 55,
      manager: 'Lisa Brown'
    },
    { 
      id: 7, 
      name: 'Harbor Depot', 
      address: '404 Port Road, Bay Area', 
      phone: '+1 (555) 789-0123',
      capacity: 25,
      manager: 'David Miller'
    },
    { 
      id: 8, 
      name: 'Airport Depot', 
      address: '505 Terminal Way, Airport Zone', 
      phone: '+1 (555) 890-1234',
      capacity: 20,
      manager: 'Maria Garcia'
    }
  ];

  // Mock data for routes
  const mockRoutes: Route[] = [
    { route_id: 1, route_number: '101', route_name: 'Downtown Express', depot: 'Main Depot' },
    { route_id: 2, route_number: '102', route_name: 'North Line', depot: 'North Depot' },
    { route_id: 3, route_number: '103', route_name: 'South Line', depot: 'South Depot' },
    { route_id: 4, route_number: '104', route_name: 'East-West Connector', depot: 'East Depot' },
    { route_id: 5, route_number: '105', route_name: 'University Shuttle', depot: 'West Depot' },
    { route_id: 6, route_number: '106', route_name: 'Airport Express', depot: 'Main Depot' },
    { route_id: 7, route_number: '107', route_name: 'City Circle', depot: 'Main Depot' },
    { route_id: 8, route_number: '108', route_name: 'Industrial Zone', depot: 'East Depot' },
    { route_id: 9, route_number: '109', route_name: 'Beach Front', depot: 'South Depot' },
    { route_id: 10, route_number: '110', route_name: 'Mountain View', depot: 'North Depot' },
    { route_id: 11, route_number: '201', route_name: 'Business District', depot: 'Central Depot' },
    { route_id: 12, route_number: '202', route_name: 'Harbor Shuttle', depot: 'Harbor Depot' },
    { route_id: 13, route_number: '203', route_name: 'Airport Link', depot: 'Airport Depot' },
    { route_id: 14, route_number: '204', route_name: 'Tech Park Express', depot: 'Central Depot' },
    { route_id: 15, route_number: '205', route_name: 'Night Owl', depot: 'Main Depot' },
  ];

  // Mock data for buses
  const mockBuses = [
    { bus_id: 101, bus_registration: 'BUS-001', bus_type: 'AC Coach', capacity: 50, depot: 'Main Depot' },
    { bus_id: 102, bus_registration: 'BUS-002', bus_type: 'Non-AC', capacity: 45, depot: 'North Depot' },
    { bus_id: 103, bus_registration: 'BUS-003', bus_type: 'AC Coach', capacity: 50, depot: 'South Depot' },
    { bus_id: 104, bus_registration: 'BUS-004', bus_type: 'Electric', capacity: 40, depot: 'East Depot' },
    { bus_id: 105, bus_registration: 'BUS-005', bus_type: 'Luxury Coach', capacity: 35, depot: 'West Depot' },
    { bus_id: 106, bus_registration: 'BUS-006', bus_type: 'Double Decker', capacity: 80, depot: 'Main Depot' },
    { bus_id: 107, bus_registration: 'BUS-007', bus_type: 'Mini Bus', capacity: 25, depot: 'North Depot' },
    { bus_id: 108, bus_registration: 'BUS-008', bus_type: 'AC Coach', capacity: 50, depot: 'South Depot' },
    { bus_id: 109, bus_registration: 'BUS-009', bus_type: 'Electric', capacity: 40, depot: 'East Depot' },
    { bus_id: 110, bus_registration: 'BUS-010', bus_type: 'Non-AC', capacity: 45, depot: 'West Depot' },
  ];

  // Mock data for crew members
  const mockCrew = [
    { id: 1, name: 'John Smith', role: 'Driver', license: 'DL-001', contact: '555-0101' },
    { id: 2, name: 'Sarah Johnson', role: 'Conductor', license: 'CD-001', contact: '555-0102' },
    { id: 3, name: 'Mike Chen', role: 'Driver', license: 'DL-002', contact: '555-0103' },
    { id: 4, name: 'Emily Davis', role: 'Conductor', license: 'CD-002', contact: '555-0104' },
    { id: 5, name: 'Robert Wilson', role: 'Driver', license: 'DL-003', contact: '555-0105' },
    { id: 6, name: 'Lisa Brown', role: 'Conductor', license: 'CD-003', contact: '555-0106' },
    { id: 7, name: 'David Miller', role: 'Driver', license: 'DL-004', contact: '555-0107' },
    { id: 8, name: 'Maria Garcia', role: 'Conductor', license: 'CD-004', contact: '555-0108' },
    { id: 9, name: 'James Taylor', role: 'Driver', license: 'DL-005', contact: '555-0109' },
    { id: 10, name: 'Jennifer Lee', role: 'Conductor', license: 'CD-005', contact: '555-0110' },
  ];

  // Comprehensive mock data for time slots with different dates and statuses
  const mockTimeSlots: Record<string, Record<number, TimeSlot[]>> = {
    // Today's assignments
    '2024-01-15': {
      1: [
        {
          id: 1,
          start: '06:00',
          end: '10:00',
          assignment: {
            assignment_id: 1,
            bus_id: 101,
            bus_registration: 'BUS-001',
            bus_type: 'AC Coach',
            driver_id: 1,
            driver_name: 'John Smith',
            conductor_id: 2,
            conductor_name: 'Sarah Johnson',
            status: 'Scheduled',
            shift_start_time: '06:00',
            shift_end_time: '10:00',
            assignment_date: '2024-01-15'
          }
        },
        {
          id: 2,
          start: '10:00',
          end: '14:00',
          assignment: {
            assignment_id: 2,
            bus_id: 102,
            bus_registration: 'BUS-002',
            bus_type: 'Non-AC',
            driver_id: 3,
            driver_name: 'Mike Chen',
            conductor_id: 4,
            conductor_name: 'Emily Davis',
            status: 'Ongoing',
            shift_start_time: '10:00',
            shift_end_time: '14:00',
            assignment_date: '2024-01-15'
          }
        },
        {
          id: 3,
          start: '14:00',
          end: '18:00',
          assignment: null // Not scheduled
        },
        {
          id: 4,
          start: '18:00',
          end: '22:00',
          assignment: {
            assignment_id: 3,
            bus_id: 106,
            bus_registration: 'BUS-006',
            bus_type: 'Double Decker',
            driver_id: 9,
            driver_name: 'James Taylor',
            conductor_id: 10,
            conductor_name: 'Jennifer Lee',
            status: 'Scheduled',
            shift_start_time: '18:00',
            shift_end_time: '22:00',
            assignment_date: '2024-01-15'
          }
        }
      ],
      2: [
        {
          id: 5,
          start: '07:00',
          end: '12:00',
          assignment: {
            assignment_id: 4,
            bus_id: 103,
            bus_registration: 'BUS-003',
            bus_type: 'AC Coach',
            driver_id: 5,
            driver_name: 'Robert Wilson',
            conductor_id: 6,
            conductor_name: 'Lisa Brown',
            status: 'Ongoing',
            shift_start_time: '07:00',
            shift_end_time: '12:00',
            assignment_date: '2024-01-15'
          }
        },
        {
          id: 6,
          start: '12:00',
          end: '17:00',
          assignment: {
            assignment_id: 5,
            bus_id: 107,
            bus_registration: 'BUS-007',
            bus_type: 'Mini Bus',
            driver_id: 7,
            driver_name: 'David Miller',
            conductor_id: 8,
            conductor_name: 'Maria Garcia',
            status: 'Scheduled',
            shift_start_time: '12:00',
            shift_end_time: '17:00',
            assignment_date: '2024-01-15'
          }
        }
      ],
      3: [
        {
          id: 7,
          start: '05:30',
          end: '09:30',
          assignment: {
            assignment_id: 6,
            bus_id: 104,
            bus_registration: 'BUS-004',
            bus_type: 'Electric',
            driver_id: 1,
            driver_name: 'John Smith',
            conductor_id: 10,
            conductor_name: 'Jennifer Lee',
            status: 'Completed',
            shift_start_time: '05:30',
            shift_end_time: '09:30',
            assignment_date: '2024-01-15'
          }
        },
        {
          id: 8,
          start: '09:30',
          end: '13:30',
          assignment: null // Not scheduled
        },
        {
          id: 9,
          start: '13:30',
          end: '17:30',
          assignment: {
            assignment_id: 7,
            bus_id: 108,
            bus_registration: 'BUS-008',
            bus_type: 'AC Coach',
            driver_id: 5,
            driver_name: 'Robert Wilson',
            conductor_id: 4,
            conductor_name: 'Emily Davis',
            status: 'Scheduled',
            shift_start_time: '13:30',
            shift_end_time: '17:30',
            assignment_date: '2024-01-15'
          }
        }
      ],
      4: [
        {
          id: 10,
          start: '08:00',
          end: '12:00',
          assignment: {
            assignment_id: 8,
            bus_id: 105,
            bus_registration: 'BUS-005',
            bus_type: 'Luxury Coach',
            driver_id: 3,
            driver_name: 'Mike Chen',
            conductor_id: 2,
            conductor_name: 'Sarah Johnson',
            status: 'Ongoing',
            shift_start_time: '08:00',
            shift_end_time: '12:00',
            assignment_date: '2024-01-15'
          }
        },
        {
          id: 11,
          start: '12:00',
          end: '16:00',
          assignment: {
            assignment_id: 9,
            bus_id: 109,
            bus_registration: 'BUS-009',
            bus_type: 'Electric',
            driver_id: 7,
            driver_name: 'David Miller',
            conductor_id: 6,
            conductor_name: 'Lisa Brown',
            status: 'Scheduled',
            shift_start_time: '12:00',
            shift_end_time: '16:00',
            assignment_date: '2024-01-15'
          }
        }
      ],
      5: [
        {
          id: 12,
          start: '07:30',
          end: '11:30',
          assignment: {
            assignment_id: 10,
            bus_id: 110,
            bus_registration: 'BUS-010',
            bus_type: 'Non-AC',
            driver_id: 9,
            driver_name: 'James Taylor',
            conductor_id: 8,
            conductor_name: 'Maria Garcia',
            status: 'Completed',
            shift_start_time: '07:30',
            shift_end_time: '11:30',
            assignment_date: '2024-01-15'
          }
        },
        {
          id: 13,
          start: '11:30',
          end: '15:30',
          assignment: null // Not scheduled
        },
        {
          id: 14,
          start: '15:30',
          end: '19:30',
          assignment: {
            assignment_id: 11,
            bus_id: 101,
            bus_registration: 'BUS-001',
            bus_type: 'AC Coach',
            driver_id: 1,
            driver_name: 'John Smith',
            conductor_id: 10,
            conductor_name: 'Jennifer Lee',
            status: 'Scheduled',
            shift_start_time: '15:30',
            shift_end_time: '19:30',
            assignment_date: '2024-01-15'
          }
        }
      ],
      6: [
        {
          id: 15,
          start: '04:00',
          end: '08:00',
          assignment: {
            assignment_id: 12,
            bus_id: 106,
            bus_registration: 'BUS-006',
            bus_type: 'Double Decker',
            driver_id: 5,
            driver_name: 'Robert Wilson',
            conductor_id: 2,
            conductor_name: 'Sarah Johnson',
            status: 'Completed',
            shift_start_time: '04:00',
            shift_end_time: '08:00',
            assignment_date: '2024-01-15'
          }
        },
        {
          id: 16,
          start: '08:00',
          end: '12:00',
          assignment: {
            assignment_id: 13,
            bus_id: 104,
            bus_registration: 'BUS-004',
            bus_type: 'Electric',
            driver_id: 3,
            driver_name: 'Mike Chen',
            conductor_id: 6,
            conductor_name: 'Lisa Brown',
            status: 'Ongoing',
            shift_start_time: '08:00',
            shift_end_time: '12:00',
            assignment_date: '2024-01-15'
          }
        },
        {
          id: 17,
          start: '12:00',
          end: '16:00',
          assignment: {
            assignment_id: 14,
            bus_id: 102,
            bus_registration: 'BUS-002',
            bus_type: 'Non-AC',
            driver_id: 7,
            driver_name: 'David Miller',
            conductor_id: 4,
            conductor_name: 'Emily Davis',
            status: 'Scheduled',
            shift_start_time: '12:00',
            shift_end_time: '16:00',
            assignment_date: '2024-01-15'
          }
        }
      ]
    },
    // Yesterday's assignments
    '2024-01-14': {
      1: [
        {
          id: 18,
          start: '06:00',
          end: '10:00',
          assignment: {
            assignment_id: 15,
            bus_id: 101,
            bus_registration: 'BUS-001',
            bus_type: 'AC Coach',
            driver_id: 1,
            driver_name: 'John Smith',
            conductor_id: 2,
            conductor_name: 'Sarah Johnson',
            status: 'Completed',
            shift_start_time: '06:00',
            shift_end_time: '10:00',
            assignment_date: '2024-01-14'
          }
        },
        {
          id: 19,
          start: '10:00',
          end: '14:00',
          assignment: null // Not assigned
        },
        {
          id: 20,
          start: '14:00',
          end: '18:00',
          assignment: {
            assignment_id: 16,
            bus_id: 106,
            bus_registration: 'BUS-006',
            bus_type: 'Double Decker',
            driver_id: 9,
            driver_name: 'James Taylor',
            conductor_id: 10,
            conductor_name: 'Jennifer Lee',
            status: 'Completed',
            shift_start_time: '14:00',
            shift_end_time: '18:00',
            assignment_date: '2024-01-14'
          }
        }
      ],
      3: [
        {
          id: 21,
          start: '08:00',
          end: '16:00',
          assignment: {
            assignment_id: 17,
            bus_id: 104,
            bus_registration: 'BUS-004',
            bus_type: 'Electric',
            driver_id: 7,
            driver_name: 'David Miller',
            conductor_id: 8,
            conductor_name: 'Maria Garcia',
            status: 'Completed',
            shift_start_time: '08:00',
            shift_end_time: '16:00',
            assignment_date: '2024-01-14'
          }
        }
      ],
      7: [
        {
          id: 22,
          start: '09:00',
          end: '13:00',
          assignment: {
            assignment_id: 18,
            bus_id: 108,
            bus_registration: 'BUS-008',
            bus_type: 'AC Coach',
            driver_id: 5,
            driver_name: 'Robert Wilson',
            conductor_id: 6,
            conductor_name: 'Lisa Brown',
            status: 'Completed',
            shift_start_time: '09:00',
            shift_end_time: '13:00',
            assignment_date: '2024-01-14'
          }
        },
        {
          id: 23,
          start: '13:00',
          end: '17:00',
          assignment: {
            assignment_id: 19,
            bus_id: 103,
            bus_registration: 'BUS-003',
            bus_type: 'AC Coach',
            driver_id: 3,
            driver_name: 'Mike Chen',
            conductor_id: 4,
            conductor_name: 'Emily Davis',
            status: 'Completed',
            shift_start_time: '13:00',
            shift_end_time: '17:00',
            assignment_date: '2024-01-14'
          }
        }
      ]
    },
    // Tomorrow's assignments
    '2024-01-16': {
      1: [
        {
          id: 24,
          start: '06:00',
          end: '10:00',
          assignment: {
            assignment_id: 20,
            bus_id: 101,
            bus_registration: 'BUS-001',
            bus_type: 'AC Coach',
            driver_id: 1,
            driver_name: 'John Smith',
            conductor_id: 2,
            conductor_name: 'Sarah Johnson',
            status: 'Scheduled',
            shift_start_time: '06:00',
            shift_end_time: '10:00',
            assignment_date: '2024-01-16'
          }
        },
        {
          id: 25,
          start: '10:00',
          end: '14:00',
          assignment: {
            assignment_id: 21,
            bus_id: 102,
            bus_registration: 'BUS-002',
            bus_type: 'Non-AC',
            driver_id: 3,
            driver_name: 'Mike Chen',
            conductor_id: 4,
            conductor_name: 'Emily Davis',
            status: 'Scheduled',
            shift_start_time: '10:00',
            shift_end_time: '14:00',
            assignment_date: '2024-01-16'
          }
        }
      ],
      4: [
        {
          id: 26,
          start: '09:00',
          end: '15:00',
          assignment: {
            assignment_id: 22,
            bus_id: 105,
            bus_registration: 'BUS-005',
            bus_type: 'Luxury Coach',
            driver_id: 3,
            driver_name: 'Mike Chen',
            conductor_id: 4,
            conductor_name: 'Emily Davis',
            status: 'Scheduled',
            shift_start_time: '09:00',
            shift_end_time: '15:00',
            assignment_date: '2024-01-16'
          }
        }
      ],
      8: [
        {
          id: 27,
          start: '07:00',
          end: '11:00',
          assignment: {
            assignment_id: 23,
            bus_id: 107,
            bus_registration: 'BUS-007',
            bus_type: 'Mini Bus',
            driver_id: 7,
            driver_name: 'David Miller',
            conductor_id: 8,
            conductor_name: 'Maria Garcia',
            status: 'Scheduled',
            shift_start_time: '07:00',
            shift_end_time: '11:00',
            assignment_date: '2024-01-16'
          }
        },
        {
          id: 28,
          start: '11:00',
          end: '15:00',
          assignment: null // Not scheduled
        }
      ],
      9: [
        {
          id: 29,
          start: '08:30',
          end: '12:30',
          assignment: {
            assignment_id: 24,
            bus_id: 109,
            bus_registration: 'BUS-009',
            bus_type: 'Electric',
            driver_id: 9,
            driver_name: 'James Taylor',
            conductor_id: 10,
            conductor_name: 'Jennifer Lee',
            status: 'Scheduled',
            shift_start_time: '08:30',
            shift_end_time: '12:30',
            assignment_date: '2024-01-16'
          }
        },
        {
          id: 30,
          start: '12:30',
          end: '16:30',
          assignment: {
            assignment_id: 25,
            bus_id: 110,
            bus_registration: 'BUS-010',
            bus_type: 'Non-AC',
            driver_id: 1,
            driver_name: 'John Smith',
            conductor_id: 2,
            conductor_name: 'Sarah Johnson',
            status: 'Scheduled',
            shift_start_time: '12:30',
            shift_end_time: '16:30',
            assignment_date: '2024-01-16'
          }
        }
      ]
    }
  };

  // Filter routes by selected depot
  const filteredRoutes = selectedDepot 
    ? mockRoutes.filter(route => route.depot === selectedDepot)
    : [];

  // Get time slots for selected route and date
  const timeSlots = selectedRouteId && mockTimeSlots[selectedDate] 
    ? mockTimeSlots[selectedDate][selectedRouteId] || []
    : [];

  function formatTime12h(time: string) {
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const minute = parseInt(m, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }

  function formatDisplayDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  const handleDepotSelect = (depotName: string) => {
    setSelectedDepot(depotName);
    setView('routes');
    setSelectedRouteId(null);
    setSelectedRoute(null);
  };

  const handleRouteSelect = (routeId: number) => {
    setSelectedRouteId(routeId);
    setSelectedRoute(mockRoutes.find(route => route.route_id === routeId) || null);
  };

  const handleBackToDepots = () => {
    setView('depots');
    setSelectedDepot(null);
    setSelectedRouteId(null);
    setSelectedRoute(null);
  };

  const handleBackToRoutes = () => {
    setSelectedRouteId(null);
    setSelectedRoute(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bus Schedule Oversight</h1>
              <p className="text-gray-600 mt-1">Manage and monitor bus routes and schedules</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                {formatDisplayDate(selectedDate)}
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <button
                  onClick={handleBackToDepots}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="flex-shrink-0 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                  {view === 'routes' && (
                    <button
                      onClick={handleBackToDepots}
                      className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      Depots
                    </button>
                  )}
                </div>
              </li>
              {view === 'routes' && selectedDepot && (
                <li>
                  <div className="flex items-center">
                    <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                    </svg>
                    <span className="ml-4 text-sm font-medium text-gray-500">{selectedDepot}</span>
                  </div>
                </li>
              )}
            </ol>
          </nav>
        </div>

        {/* Depot Cards View */}
        {view === 'depots' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Bus Depots</h2>
              <p className="text-gray-600 mt-2">Select a depot to view its routes and schedules</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mockDepots.map((depot) => (
                <div
                  key={depot.id}
                  onClick={() => handleDepotSelect(depot.name)}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{depot.name}</h3>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="flex-shrink-0 h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span className="truncate">{depot.address}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="flex-shrink-0 h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            {depot.phone}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="flex-shrink-0 h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Manager: {depot.manager}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="flex-shrink-0 h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1a1 1 0 011-1h2a1 1 0 011 1v1a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
                            </svg>
                            Capacity: {depot.capacity} buses
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          {mockRoutes.filter(route => route.depot === depot.name).length} routes
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors">
                        View routes →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Routes and Schedule View */}
        {view === 'routes' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="flex flex-col md:flex-row gap-0">
              {/* Routes List - Left Panel */}
              <div className="md:w-1/4 bg-gradient-to-b from-blue-25 to-indigo-25 border-r border-gray-200">
                <div className="p-5 sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{selectedDepot} Routes</h2>
                      <p className="text-blue-100 text-sm mt-1">
                        {filteredRoutes.length} route{filteredRoutes.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                    <button
                      onClick={handleBackToDepots}
                      className="text-blue-100 hover:text-white transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                <ul className="p-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {filteredRoutes.map(route => (
                    <li
                      key={route.route_id}
                      className={`p-3 mb-2 rounded-lg transition-all duration-200 cursor-pointer flex items-start
                        ${selectedRouteId === route.route_id
                          ? 'bg-white shadow-md border-l-4 border-blue-500'
                          : 'hover:bg-blue-100'}`}
                      onClick={() => handleRouteSelect(route.route_id)}
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
                        <p className="text-gray-600">{selectedRoute.route_name} • {selectedRoute.depot}</p>
                      </div>
                      <button
                        onClick={handleBackToRoutes}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>

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
                          {timeSlots.length > 0 ? (
                            timeSlots
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
                                  <td className="px-6 py-4">
                                    {slot.assignment ? (
                                      <div>
                                        <div className="font-medium text-gray-900">{slot.assignment.bus_registration}</div>
                                        <div className="text-sm text-gray-500">{slot.assignment.bus_type}</div>
                                      </div>
                                    ) : (
                                      <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Not assigned</span>
                                    )}
                                  </td>
                                  {/* Crew */}
                                  <td className="px-6 py-4">
                                    {slot.assignment ? (
                                      <div>
                                        <div className="text-sm text-gray-900">
                                          <span className="font-medium">Driver:</span> {slot.assignment.driver_name}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          <span className="font-medium">Conductor:</span> {slot.assignment.conductor_name}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Not assigned</span>
                                    )}
                                  </td>
                                  {/* Status */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                                      ${slot.assignment?.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                                        slot.assignment?.status === 'Ongoing' ? 'bg-yellow-100 text-yellow-800' :
                                        slot.assignment?.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                        slot.assignment?.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'}`}>
                                      {slot.assignment?.status || 'Not scheduled'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-6 py-8 text-center">
                                <div className="text-gray-500">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  No assignments found for this route on {formatDisplayDate(selectedDate)}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-24 px-4 text-center">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full p-6 mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Route</h3>
                    <p className="text-gray-600 max-w-md">
                      Choose a route from the left panel to view its daily schedule for {selectedDepot}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
  depot: string;
}

interface Depot {
  id: number;
  name: string;
  address: string;
  phone: string;
  capacity: number;
  manager: string;
}

export default ScheduleOversight;