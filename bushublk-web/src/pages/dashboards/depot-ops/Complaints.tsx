import React, { useState } from 'react';

interface Complaint {
  id: string;
  type: string;
  routeNumber: string;
  busNumber?: string;
  date: string;
  time: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High';
  description: string;
  attachment?: string;
  contact: string;
  status: 'New' | 'In Progress' | 'Resolved';
  submittedDate: string;
}

const Complaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([
    {
      id: 'COMP-001',
      type: 'Late Arrival',
      routeNumber: '177',
      busNumber: 'ND-1234',
      date: '20/08/2025',
      time: '20:37',
      location: 'Main Street Bus Stop',
      priority: 'High',
      description: 'Bus arrived 15 minutes late at the stop, causing inconvenience to passengers.',
      contact: 'passenger1@email.com',
      status: 'New',
      submittedDate: '20/08/2025 20:45'
    },
    {
      id: 'COMP-002',
      type: 'Rude Behavior',
      routeNumber: '152',
      busNumber: 'ND-5678',
      date: '20/08/2025',
      time: '18:15',
      location: 'Central Station',
      priority: 'High',
      description: 'Driver was rude and unprofessional when asked about route changes.',
      contact: 'passenger2@email.com',
      status: 'New',
      submittedDate: '20/08/2025 18:30'
    },
    {
      id: 'COMP-003',
      type: 'Cleanliness',
      routeNumber: '204',
      busNumber: 'ND-9012',
      date: '20/08/2025',
      time: '12:40',
      location: 'Maple Avenue',
      priority: 'Medium',
      description: 'Bus interior was dirty with trash on seats and floor.',
      contact: '555-1234',
      status: 'In Progress',
      submittedDate: '20/08/2025 13:15'
    },
    {
      id: 'COMP-004',
      type: 'Skip Stop',
      routeNumber: '177',
      busNumber: 'ND-3456',
      date: '19/08/2025',
      time: '08:25',
      location: 'Oak Street Stop',
      priority: 'High',
      description: 'Bus did not stop at designated stop despite signaling.',
      contact: 'passenger4@email.com',
      status: 'Resolved',
      submittedDate: '19/08/2025 08:40'
    },
    {
      id: 'COMP-005',
      type: 'Air Conditioning',
      routeNumber: '139',
      busNumber: 'ND-7890',
      date: '19/08/2025',
      time: '14:20',
      location: 'City Center',
      priority: 'Medium',
      description: 'AC was not working properly, making the bus uncomfortably hot.',
      contact: '555-5678',
      status: 'In Progress',
      submittedDate: '19/08/2025 15:05'
    },
    {
      id: 'COMP-006',
      type: 'Overcrowding',
      routeNumber: '152',
      busNumber: 'ND-1234',
      date: '18/08/2025',
      time: '17:45',
      location: 'University Campus',
      priority: 'Medium',
      description: 'Bus was severely overcrowded during peak hours, safety concern.',
      contact: 'passenger6@email.com',
      status: 'New',
      submittedDate: '18/08/2025 18:20'
    },
    {
      id: 'COMP-007',
      type: 'Schedule Deviation',
      routeNumber: '204',
      busNumber: 'ND-9012',
      date: '18/08/2025',
      time: '09:10',
      location: 'Riverfront Depot',
      priority: 'Low',
      description: 'Bus departed 5 minutes earlier than scheduled time.',
      contact: '555-9012',
      status: 'Resolved',
      submittedDate: '18/08/2025 09:35'
    },
    {
      id: 'COMP-008',
      type: 'Safety Concern',
      routeNumber: '139',
      busNumber: 'ND-5678',
      date: '17/08/2025',
      time: '19:30',
      location: 'Park Street',
      priority: 'High',
      description: 'Driver was speeding and braking harshly between stops.',
      contact: 'passenger8@email.com',
      status: 'In Progress',
      submittedDate: '17/08/2025 20:15'
    },
    {
      id: 'COMP-009',
      type: 'No Announcements',
      routeNumber: '177',
      busNumber: 'ND-3456',
      date: '17/08/2025',
      time: '11:05',
      location: 'Shopping District',
      priority: 'Low',
      description: 'Driver did not announce stops as per policy.',
      contact: '555-3456',
      status: 'New',
      submittedDate: '17/08/2025 11:40'
    },
    {
      id: 'COMP-010',
      type: 'Accessibility Issue',
      routeNumber: '152',
      busNumber: 'ND-7890',
      date: '16/08/2025',
      time: '13:50',
      location: 'Medical Center',
      priority: 'High',
      description: 'Wheelchair ramp was not functioning properly.',
      contact: 'passenger10@email.com',
      status: 'Resolved',
      submittedDate: '16/08/2025 14:30'
    }
  ]);

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const priorityColors = {
    Low: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    New: 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-purple-100 text-purple-800',
    Resolved: 'bg-gray-100 text-gray-800'
  };

  const filteredComplaints = complaints.filter(complaint => 
    (filterStatus === 'All' || complaint.status === filterStatus) &&
    (filterPriority === 'All' || complaint.priority === filterPriority)
  );

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredComplaints.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleStatusChange = (id: string, newStatus: 'New' | 'In Progress' | 'Resolved') => {
    setComplaints(prev => prev.map(c => 
      c.id === id ? {...c, status: newStatus} : c
    ));
  };

  return (
    <div className="space-y-6 ">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Passenger Complaints</h1>
        <p className="text-gray-600">Review and manage passenger complaints </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">All Complaints</h2>
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select 
                className="border rounded-md px-3 py-2 w-40"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Priority</label>
              <select 
                className="border rounded-md px-3 py-2 w-40"
                value={filterPriority}
                onChange={(e) => {
                  setFilterPriority(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Removed ID column */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route/Bus</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50">
                  {/* Removed ID cell */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{complaint.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Route: {complaint.routeNumber}</div>
                    <div>Bus: {complaint.busNumber || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{complaint.date}</div>
                    <div>{complaint.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[complaint.priority]}`}>
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Status is now read-only in table */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[complaint.status]}`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => setSelectedComplaint(complaint)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
            <span className="font-medium">
              {indexOfLastItem > filteredComplaints.length ? filteredComplaints.length : indexOfLastItem}
            </span> of{' '}
            <span className="font-medium">{filteredComplaints.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-200 text-gray-500' : 'bg-gray-300 hover:bg-gray-400'}`}
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`px-3 py-1 rounded-md ${currentPage === number ? 'bg-indigo-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
              >
                {number}
              </button>
            ))}
            
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-200 text-gray-500' : 'bg-gray-300 hover:bg-gray-400'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold">Complaint Details - {selectedComplaint.id}</h2>
                <button 
                  onClick={() => setSelectedComplaint(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Complaint Type</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-md">{selectedComplaint.type}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Route Number</label>
                      <p className="mt-1 p-2 bg-gray-50 rounded-md">{selectedComplaint.routeNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bus Number</label>
                      <p className="mt-1 p-2 bg-gray-50 rounded-md">{selectedComplaint.busNumber || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <p className="mt-1 p-2 bg-gray-50 rounded-md">{selectedComplaint.date}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Time</label>
                      <p className="mt-1 p-2 bg-gray-50 rounded-md">{selectedComplaint.time}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location/Stop</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-md">{selectedComplaint.location}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[selectedComplaint.priority]}`}>
                        {selectedComplaint.priority}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select 
                      className={`mt-1 px-3 py-2 rounded-md text-sm font-medium ${statusColors[selectedComplaint.status]} border-none focus:ring-2 focus:ring-offset-2`}
                      value={selectedComplaint.status}
                      onChange={(e) => {
                        handleStatusChange(selectedComplaint.id, e.target.value as 'New' | 'In Progress' | 'Resolved');
                        setSelectedComplaint({...selectedComplaint, status: e.target.value as 'New' | 'In Progress' | 'Resolved'});
                      }}
                    >
                      <option value="New">New</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Information</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-md">{selectedComplaint.contact}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Submitted On</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-md">{selectedComplaint.submittedDate}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedComplaint.description}</p>
              </div>

              {selectedComplaint.attachment && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700">Attachment</label>
                  <div className="mt-2 flex items-center">
                    <div className="flex-shrink-0">
                      <img className="h-16 w-16 rounded-md object-cover" src={selectedComplaint.attachment} alt="Attachment" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">complaint_photo.jpg</div>
                      <div className="text-sm text-gray-500">2.3 MB</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
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

export default Complaints;