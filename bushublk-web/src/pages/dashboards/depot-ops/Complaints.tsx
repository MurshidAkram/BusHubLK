import React, { useState, useEffect } from 'react';
import axios from 'axios';

// API base URLs
const API_BASE_URL = 'http://localhost:5000/api';
const SERVER_BASE_URL = 'http://localhost:5000';

// The interface for our component's state (using camelCase)
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
  status: 'Pending' | 'In Progress' | 'Resolved'; // Updated status values to match DB
  submittedDate: string;
  reporterEmail?: string | null;
  reporterPhone?: string | null;
}

// Interface for the raw data from the API (using snake_case)
interface ApiComplaint {
  id: number;
  complaint_type: string;
  route_number: string;
  bus_number?: string;
  incident_date: string;
  incident_time: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High';
  description: string;
  image_url?: string;
  contact_info: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  created_at: string;
  // added fields returned by backend join
  reporter_email?: string | null;
  reporter_phone?: string | null;
}

const Complaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>(''); // YYYY-MM-DD
  const [filterType, setFilterType] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [user, setUser] = useState<any>(null);

  // Add effect to load user data
  useEffect(() => {
    const userData = localStorage.getItem('bushublk_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // --- Data Fetching Logic ---
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Checking authentication...'); // Debug log
        // Get the token from localStorage using the correct key
        const token = localStorage.getItem('bushublk_token');
        if (!token) {
          setError('Authentication error. Please log in again.');
          setIsLoading(false);
          return;
        }

        // Make the API call to your backend endpoint with the full URL and auth token
        // Try to get token from multiple possible storage keys
        const possibleTokens = [
          localStorage.getItem('bushublk_token'),
          localStorage.getItem('token'),
          localStorage.getItem('auth_token'),
          sessionStorage.getItem('bushublk_token'),
          sessionStorage.getItem('token')
        ].filter(Boolean);

        const activeToken = possibleTokens[0];
        console.log('Available tokens:', possibleTokens.length);
        console.log('Using token:', activeToken ? 'Yes' : 'No');
        
        const response = await axios.get('http://localhost:5000/api/complaints', {
          headers: {
            'Authorization': activeToken ? `Bearer ${activeToken}` : '',
            'Content-Type': 'application/json'
          },
          validateStatus: function (status) {
            console.log('Response status:', status); // Log the response status
            return status >= 200 && status < 500; // Don't reject if status is < 500
          }
        });

        // Check if response.data.complaints exists
        if (!response.data || !response.data.complaints) {
          throw new Error('Invalid response format');
        }

        // Ensure complaints are sorted by incident date (latest first)
        // Sort the raw API array by incident_date (ISO or DB format) before transforming
        response.data.complaints.sort((a: ApiComplaint, b: ApiComplaint) => {
          return new Date(b.incident_date).getTime() - new Date(a.incident_date).getTime();
        });
        
        // Transform the snake_case data from the API to camelCase for the component
        const transformedComplaints = response.data.complaints.map((c: ApiComplaint): Complaint => {
          // Clean and format the image URL
          const imageUrl = c.image_url ? c.image_url : undefined;
          
          return {
            id: c.id.toString(),
            type: c.complaint_type,
            routeNumber: c.route_number,
            busNumber: c.bus_number && c.bus_number.trim() !== '' ? c.bus_number : undefined,
            date: new Date(c.incident_date).toLocaleDateString(),
            time: c.incident_time,
            location: c.location,
            priority: c.priority,
            description: c.description,
            attachment: imageUrl,
            contact: c.contact_info,
            status: c.status,
            submittedDate: new Date(c.created_at).toLocaleString(),
            // include reporter contact if backend provided it
            reporterEmail: c.reporter_email || null,
            reporterPhone: c.reporter_phone || null
          };
        });

        setComplaints(transformedComplaints);
      } catch (err: any) {
        console.error("Failed to fetch complaints:", err);
        if (err?.response?.status === 403) {
          setError('Access denied. Please log in again.');
          // Clear the invalid token
          localStorage.removeItem('token');
        } else if (err.response?.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('token');
        } else {
          setError('Failed to load complaints. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaints();
  }, []); // The empty dependency array ensures this runs only once on component mount


  const priorityColors = {
    Low: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    Pending: 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-purple-100 text-purple-800',
    Resolved: 'bg-gray-100 text-gray-800'
  };

  const filteredComplaints = complaints.filter(complaint =>
  (filterStatus === 'All' || complaint.status === filterStatus) &&
  (filterPriority === 'All' || complaint.priority === filterPriority) &&
  (filterDate === '' || complaint.date === new Date(filterDate).toLocaleDateString()) &&
  (filterType === 'All' || complaint.type === filterType)
);
  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredComplaints.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // --- Status Update Logic ---
  const handleStatusChange = async (id: string, newStatus: 'Pending' | 'In Progress' | 'Resolved') => {
    try {
        // Make API call to update the status on the backend
        await axios.put(`http://localhost:5000/api/complaints/${id}/status`, { 
          status: newStatus 
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('bushublk_token')}` // Use correct token key
          }
        });

        // Update the status in the local state for immediate UI feedback
        setComplaints(prev => prev.map(c =>
            c.id === id ? { ...c, status: newStatus } : c
        ));

        // Close the modal if the updated complaint is currently open so the table is visible
        if (selectedComplaint && selectedComplaint.id === id) {
            setSelectedComplaint(null);
        }
    } catch (err) {
        console.error("Failed to update status:", err);
        alert("Failed to update complaint status. Please try again.");
    }
  };


  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-700">Loading complaints...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Passenger Complaints</h1>
        <p className="text-gray-600">Review and manage passenger complaints</p>
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
                <option value="Pending">Pending</option>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Date</label>
              <input
                type="date"
                className="border rounded-md px-3 py-2 w-40"
                value={filterDate}
                onChange={e => {
                  setFilterDate(e.target.value);
                  setCurrentPage(1);
                }}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
              <select
                className="border rounded-md px-3 py-2 w-40"
                value={filterType}
                onChange={e => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">All Types</option>
                {/* Dynamically generate unique types from complaints */}
                {[...new Set(complaints.map(c => c.type))].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route Number</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Number</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type of Complaint</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{complaint.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{complaint.routeNumber}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                     {(complaint.busNumber && complaint.busNumber.toString().trim()) ? complaint.busNumber : 'Not given'}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{complaint.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[complaint.priority]}`}>
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
            Showing <span className="font-medium">{filteredComplaints.length > 0 ? indexOfFirstItem + 1 : 0}</span> to{' '}
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
       <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Complaint details </h2>
                  <p className="text-gray-500 text-sm mt-1">Submitted on {selectedComplaint.submittedDate}</p>
                </div>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="bg-gray-50 -mx-6 px-6 py-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityColors[selectedComplaint.priority]}`}>
                        {selectedComplaint.priority} Priority
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedComplaint.status]}`}>
                        {selectedComplaint.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Route Number</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedComplaint.routeNumber}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Complaint Type</label>
                    <p className="mt-2 p-3 bg-white border border-gray-200 rounded-lg text-gray-900">{selectedComplaint.type}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Route Number</label>
                      <p className="mt-1 p-2 bg-gray-50 rounded-md">{selectedComplaint.routeNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bus Number</label>
                      <p className="mt-1 p-2 bg-gray-50 rounded-md">
                        {(selectedComplaint.busNumber && selectedComplaint.busNumber.toString().trim()) ? selectedComplaint.busNumber : 'Not given'}
                      </p>
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
                        handleStatusChange(selectedComplaint.id, e.target.value as 'Pending' | 'In Progress' | 'Resolved');
                      }}
                       // don't allow changing a resolved complaint
                       disabled={selectedComplaint.status === 'Resolved'}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Information</label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md space-y-1 text-sm text-gray-900">
                       {selectedComplaint.reporterPhone && <div> phone: {selectedComplaint.reporterPhone}</div>}
                      {selectedComplaint.reporterEmail && <div>email: {selectedComplaint.reporterEmail}</div>}
                    </div>
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
                <div className="mt-8 bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">Attached Evidence</label>
                    <a
                      href={`http://localhost:5000${selectedComplaint.attachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-200"
                    >
                      View Full Size
                    </a>
                  </div>
                  <div className="relative bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200">
                    <img
                      src={`http://localhost:5000${selectedComplaint.attachment}`}
                      alt="Complaint evidence"
                      className="w-full h-auto object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yNCAxMmMwIDYuNjI3LTUuMzczIDEyLTEyIDEycy0xMi01LjM3My0xMi0xMiA1LjM3My0xMiAxMi0xMiAxMiA1LjM3MyAxMiAxMnptLTEgMGMwLTYuMDc1LTQuOTI1LTExLTExLTExcy0xMSA0LjkyNS0xMSAxMSA0LjkyNSAxMSAxMSAxMSAxMS00LjkyNSAxMS0xMXptLTExLjUtNS4xNzdjMC0uMjA5LjIwMS0uMzc4LjQ1LS4zNzguMjQ4IDAgLjQ1LjE2OS40NS4zNzh2NS4wNDVjMCAuMjA4LS4yMDIuMzc3LS40NS4zNzctLjI0OSAwLS40NS0uMTY5LS40NS0uMzc3di01LjA0NXptLjQ1IDcuNzIyYy0uMzMxIDAtLjYtLjI2OS0uNi0uNiAwLS4zMzEuMjY5LS42LjYtLjYuMzMxIDAgLjYuMjY5LjYuNiAwIC4zMzEtLjI2OS42LS42LjZ6Ii8+PC9zdmc+';
                        target.className = 'w-12 h-12 mx-auto opacity-50';
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-8 border-t border-gray-200 pt-6">
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 inline-flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close
                  </button>

                  {/* Hide action button when complaint is already resolved */}
                  {selectedComplaint.status !== 'Resolved' && (
                    <button
                     onClick={() => handleStatusChange(selectedComplaint.id, selectedComplaint.status === 'Pending' ? 'In Progress' : selectedComplaint.status)}
                     className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors duration-200 inline-flex items-center"
                   >
                     <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {selectedComplaint.status === 'Pending' ? 'Start Processing' : 'Update Status'}
                   </button>
                 )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { Complaints as default };