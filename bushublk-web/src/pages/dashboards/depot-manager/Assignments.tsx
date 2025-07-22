import React, { useState, useEffect } from 'react';
import { X, Clock, Bus, Route, User, Calendar, Gauge, Flag, ChevronRight } from 'lucide-react';

interface Assignment {
  assignment_id: number;
  bus_id: number;
  bus_registration: string;
  route_id: number;
  route_number: string;
  route_name: string;
  driver_id: number;
  driver_name: string;
  conductor_id: number;
  conductor_name: string;
  depot_id: number;
  date: string;
}

interface ShiftDetails {
  shiftStart: string;
  shiftEnd: string;
  actualStart: string;
  actualEnd: string;
  distance: string;
  status: 'Early' | 'Delayed' | 'On Time';
  completed: boolean;
  passengerCount: number;
  fuelConsumption: string;
}

const Assignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [shiftDetails, setShiftDetails] = useState<ShiftDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate API fetch
    const fetchAssignments = async () => {
      // In a real app, you would fetch from an API
      const mockAssignments: Assignment[] = [
        {
          assignment_id: 1,
          bus_id: 1,
          bus_registration: 'NC-1234',
          route_id: 1,
          route_number: '138',
          route_name: 'Colombo - Maharagama',
          driver_id: 1,
          driver_name: 'Ali Khan',
          conductor_id: 3,
          conductor_name: 'Suresh Fernando',
          depot_id: 10,
          date: '2025-07-21',
        },
        {
          assignment_id: 2,
          bus_id: 2,
          bus_registration: 'NC-5678',
          route_id: 2,
          route_number: '122',
          route_name: 'Colombo - Horana',
          driver_id: 2,
          driver_name: 'Nimal Perera',
          conductor_id: 4,
          conductor_name: 'Kamal Silva',
          depot_id: 10,
          date: '2025-07-21',
        },
        {
          assignment_id: 3,
          bus_id: 3,
          bus_registration: 'NC-9012',
          route_id: 3,
          route_number: '125',
          route_name: 'Colombo - Wattegama',
          driver_id: 3,
          driver_name: 'Mohamed Rizwan',
          conductor_id: 5,
          conductor_name: 'Ravi Karunaratne',
          depot_id: 10,
          date: '2025-07-21',
        },
        {
          assignment_id: 4,
          bus_id: 4,
          bus_registration: 'NC-3456',
          route_id: 4,
          route_number: '101',
          route_name: 'Colombo - Panadura',
          driver_id: 4,
          driver_name: 'Sunil Jayasuriya',
          conductor_id: 6,
          conductor_name: 'Thilina Ranasinghe',
          depot_id: 10,
          date: '2025-07-21',
        },
      ];
      setAssignments(mockAssignments);
    };

    fetchAssignments();
  }, []);

  const handleViewDetails = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    
    // Simulated shift details with more data
    const statuses: ('Early' | 'Delayed' | 'On Time')[] = ['Early', 'Delayed', 'On Time'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    setShiftDetails({
      shiftStart: '08:00 AM',
      shiftEnd: '05:00 PM',
      actualStart: randomStatus === 'Early' ? '07:45 AM' : randomStatus === 'Delayed' ? '08:15 AM' : '08:00 AM',
      actualEnd: randomStatus === 'Early' ? '04:50 PM' : randomStatus === 'Delayed' ? '05:10 PM' : '05:00 PM',
      distance: `${Math.floor(Math.random() * 100) + 80} km`,
      status: randomStatus,
      completed: Math.random() > 0.3,
      passengerCount: Math.floor(Math.random() * 150) + 50,
      fuelConsumption: `${(Math.random() * 15 + 25).toFixed(1)} L`,
    });
    
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedAssignment(null);
      setShiftDetails(null);
    }, 300); // Match this with your transition duration
  };

  const filteredAssignments = assignments.filter(assignment => 
    assignment.bus_registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.route_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.conductor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: 'Early' | 'Delayed' | 'On Time') => {
    switch (status) {
      case 'Early': return 'bg-green-100 text-green-800';
      case 'Delayed': return 'bg-red-100 text-red-800';
      case 'On Time': return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 font-sans">
      {/* Header - Changed to white box with black text */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Daily Operations Dashboard</h1>
        <p className="text-gray-600">Manage and monitor today's bus assignments</p>
      </div>

      
      {/* Assignments Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {filteredAssignments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-lg">No assignments found</p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Date
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Bus className="h-4 w-4 mr-2" />
                      Bus
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Route className="h-4 w-4 mr-2" />
                      Route
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Driver
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Conductor
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssignments.map((assignment) => (
                  <tr 
                    key={assignment.assignment_id} 
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(assignment.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bus className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{assignment.bus_registration}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        #{assignment.route_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assignment.route_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{assignment.driver_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{assignment.conductor_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(assignment)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        Details <ChevronRight className="ml-1 h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Removed glass effect */}
      {isModalOpen && selectedAssignment && shiftDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 transition-opacity" 
              aria-hidden="true"
              onClick={handleCloseModal}
            >
              <div className="absolute"></div>
            </div>

            {/* Modal container */}
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl leading-6 font-bold text-gray-900">
                        Assignment Details
                      </h3>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={handleCloseModal}
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-y-4 gap-x-8 sm:grid-cols-2">
                      {/* Assignment Info */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <Bus className="h-5 w-5 mr-2 text-blue-600" />
                          Bus Information
                        </h4>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium text-gray-500">Registration:</span>{' '}
                            {selectedAssignment.bus_registration}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium text-gray-500">Route:</span>{' '}
                            #{selectedAssignment.route_number} - {selectedAssignment.route_name}
                          </p>
                        </div>
                      </div>

                      {/* Crew Info */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <User className="h-5 w-5 mr-2 text-blue-600" />
                          Crew Information
                        </h4>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium text-gray-500">Driver:</span>{' '}
                            {selectedAssignment.driver_name}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium text-gray-500">Conductor:</span>{' '}
                            {selectedAssignment.conductor_name}
                          </p>
                        </div>
                      </div>

                      {/* Shift Details */}
                      <div className="bg-gray-50 p-4 rounded-lg sm:col-span-2">
                        <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <Clock className="h-5 w-5 mr-2 text-blue-600" />
                          Shift Details
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Scheduled</p>
                            <p className="text-sm">
                              {shiftDetails.shiftStart} - {shiftDetails.shiftEnd}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Actual</p>
                            <p className="text-sm">
                              {shiftDetails.actualStart} - {shiftDetails.actualEnd}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <Gauge className="h-5 w-5 mr-2 text-blue-600" />
                          Performance
                        </h4>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium text-gray-500">Distance:</span>{' '}
                            {shiftDetails.distance}
                          </p>
                        
            
                        </div>
                      </div>

                      {/* Status */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <Flag className="h-5 w-5 mr-2 text-blue-600" />
                          Status
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shiftDetails.status)}`}>
                              {shiftDetails.status}
                            </span>
                          </div>
                          <p className="text-sm">
                            <span className="font-medium text-gray-500">Completion:</span>{' '}
                            {shiftDetails.completed ? (
                              <span className="text-green-600">Completed</span>
                            ) : (
                              <span className="text-yellow-600">In Progress</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-2xl">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;