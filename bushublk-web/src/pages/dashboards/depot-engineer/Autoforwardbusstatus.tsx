import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaBus, 
  FaCheck,
  FaClock,
  FaFilter,
  FaTools,
  FaEye
} from 'react-icons/fa';
import { AppContext } from '../../../context/AppContext';
import axios, { AxiosError } from 'axios';

interface Report {
  report_id: string;
  bus_id: string;
  driver_id: string;
  condition_status: 'Good' | 'Minor Issues' | 'Major Issues' | 'Out of Service';
  description: string;
  review_status: 'pending' | 'reviewed';
  report_time: string;
  reviewed_at?: string;
  registration_number: string;
  bus_class: string;
  manufacturer: string;
  model: string;
  driver_first_name: string;
  driver_last_name: string;
  driver_email: string;
  reviewer_first_name?: string;
  reviewer_last_name?: string;
}

interface AppContextType {
  user: { role: string; userId: string; depot_id?: string; } | null;
  token: string | null;
}

interface ReportsResponse {
  success: boolean;
  message: string;
  reports: Report[];
  depot_id?: string;
}

interface StatsResponse {
  success: boolean;
  message: string;
  stats: {
    total_reports: string;
    pending_count: string;
    reviewed_count: string;
    good_count: string;
    minor_issues_count: string;
    major_issues_count: string;
    out_of_service_count: string;
  };
  depot_id?: string;
}

const Autoforwardbusstatus = () => {
  const navigate = useNavigate();
  const context = useContext(AppContext) as AppContextType | null;
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total_reports: 0,
    pending_count: 0,
    reviewed_count: 0,
    good_count: 0,
    minor_issues_count: 0,
    major_issues_count: 0,
    out_of_service_count: 0,
  });

  const token = context?.token;

  // Fetch reports from API
  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        setError('Authentication token is missing. Please log in.');
        setLoading(false);
        return;
      }

      const response = await axios.get<ReportsResponse>(
        'http://localhost:5000/api/depot-engineer/condition-reports',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setReports(response.data.reports);
      } else {
        setError(`Failed to fetch reports: ${response.data.message}`);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('API Error:', axiosError);
      setError('Failed to fetch reports. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics from API
  const fetchStats = async () => {
    try {
      if (!token) return;

      const response = await axios.get<StatsResponse>(
        'http://localhost:5000/api/depot-engineer/condition-reports/stats',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setStats({
          total_reports: parseInt(response.data.stats.total_reports),
          pending_count: parseInt(response.data.stats.pending_count),
          reviewed_count: parseInt(response.data.stats.reviewed_count),
          good_count: parseInt(response.data.stats.good_count),
          minor_issues_count: parseInt(response.data.stats.minor_issues_count),
          major_issues_count: parseInt(response.data.stats.major_issues_count),
          out_of_service_count: parseInt(response.data.stats.out_of_service_count),
        });
      }
    } catch (err) {
      console.error('Stats API Error:', err);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [token]);

  const getBusStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'minor issues': return 'bg-yellow-100 text-yellow-800';
      case 'major issues': return 'bg-orange-100 text-orange-800';
      case 'out of service': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredReports = reports.filter(report => {
    const matchesStatus = statusFilter === 'all' || 
                         report.condition_status.toLowerCase() === statusFilter.toLowerCase();
    const driverName = `${report.driver_first_name} ${report.driver_last_name}`;
    const matchesSearch = report.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.driver_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const markAsReviewed = async (reportId: string) => {
    try {
      if (!token) return;

      const response = await axios.put(
        `http://localhost:5000/api/depot-engineer/condition-reports/${reportId}/review`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Update local state
        setReports(reports.map(report => 
          report.report_id === reportId ? { ...report, review_status: 'reviewed', reviewed_at: new Date().toISOString() } : report
        ));
        // Refresh stats
        fetchStats();
      } else {
        setError(`Failed to review report: ${response.data.message}`);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Review API Error:', axiosError);
      setError('Failed to review report. Please try again later.');
    }
  };

  const handleReviewClick = (report: Report) => {
    if (report.review_status === 'pending') {
      markAsReviewed(report.report_id);
    }
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  const handleUpdateStatus = () => {
    navigate('/depot-engineer/Busavailability', { 
      state: { 
        busId: selectedReport?.registration_number,
        currentStatus: selectedReport?.condition_status
      } 
    });
  };

  // Statistics
  const unreviewedCount = stats.pending_count;
  const goodStatusCount = stats.good_count;
  const minorIssueCount = stats.minor_issues_count;
  const majorIssueCount = stats.major_issues_count;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FaBus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Bus Status Reports</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full">
              <FaClock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold">{unreviewedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-full">
              <FaCheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Good Status</p>
              <p className="text-2xl font-bold">{goodStatusCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-yellow-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-50 rounded-full">
              <FaExclamationTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Minor Issues</p>
              <p className="text-2xl font-bold">{minorIssueCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-full">
              <FaExclamationTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Major Issues</p>
              <p className="text-2xl font-bold">{majorIssueCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search reports..."
              className="pl-10 pr-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFilter className="text-gray-400" />
            </div>
            <select
              className="pl-10 pr-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="good">Good</option>
              <option value="minor issues">Minor Issues</option>
              <option value="major issues">Major Issues</option>
              <option value="out of service">Out of Service</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-center">
            <div className="text-gray-500">Loading reports...</div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 rounded-xl p-6 mb-6">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Number</th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported At</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <tr 
                    key={report.report_id} 
                    className={`hover:bg-gray-50 ${report.review_status === 'pending' ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{report.registration_number}</div>
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{report.driver_id}</div>
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBusStatusColor(report.condition_status)}`}>
                        {report.condition_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(report.report_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center gap-2">
                        {report.review_status === 'pending' ? (
                          <button
                            onClick={() => handleReviewClick(report)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <FaCheck size={12} />
                            <span>Review</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg inline-flex items-center gap-1.5 text-xs">
                              <FaCheck size={10} />
                              <span>Reviewed</span>
                            </span>
                            <button
                              onClick={() => handleViewDetails(report)}
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1.5 transition-colors text-xs"
                              title="View Details"
                            >
                              <FaEye size={10} />
                              <span>View</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No reports found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-800">Report Details</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Bus Registration</h3>
                    <p className="mt-1 text-gray-900">{selectedReport.registration_number}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Driver</h3>
                    <p className="mt-1 text-gray-900">{selectedReport.driver_first_name} {selectedReport.driver_last_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Condition Status</h3>
                    <span className={`mt-1 px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getBusStatusColor(selectedReport.condition_status)}`}>
                      {selectedReport.condition_status}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Reported At</h3>
                    <p className="mt-1 text-gray-900">{formatDateTime(selectedReport.report_time)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Review Status</h3>
                    <span className={`mt-1 px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                      selectedReport.review_status === 'reviewed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedReport.review_status === 'reviewed' ? 'Reviewed' : 'Pending Review'}
                    </span>
                  </div>
                  {selectedReport.reviewed_at && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Reviewed At</h3>
                      <p className="mt-1 text-gray-900">{formatDateTime(selectedReport.reviewed_at)}</p>
                    </div>
                  )}
                </div>

                {selectedReport.review_status === 'reviewed' && (selectedReport.reviewer_first_name || selectedReport.reviewer_last_name) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Reviewed By</h3>
                    <p className="mt-1 text-gray-900">
                      {selectedReport.reviewer_first_name} {selectedReport.reviewer_last_name}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Issue Description</h3>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                    <p className="text-gray-900 whitespace-pre-line break-words">{selectedReport.description}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleUpdateStatus}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaTools size={14} />
                      <span>Update Status</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Autoforwardbusstatus;