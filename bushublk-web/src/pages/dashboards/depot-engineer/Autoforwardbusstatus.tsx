import { useState } from 'react';
import { 
  FaBell, 
  FaSearch, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaBus, 
  FaUser, 
  FaCheck,
  FaClock,
  FaFilter
} from 'react-icons/fa';

interface Report {
  id: number;
  busId: string;
  driverName: string;
  priority: 'Low' | 'Medium' | 'High';
  busStatus: 'Good' | 'Minor Issue' | 'Major Issue' | 'Out of Service';
  issueDescription: string;
  reviewed: boolean;
  reportedAt: string;
}

const Autoforwardbusstatus = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [reports, setReports] = useState<Report[]>([
    {
      id: 1,
      busId: 'BUS-001',
      driverName: 'John Smith',
      priority: 'Medium',
      busStatus: 'Minor Issue',
      issueDescription: 'Engine making unusual noise during acceleration',
      reviewed: false,
      reportedAt: '2023-06-15T08:30:00'
    },
    {
      id: 2,
      busId: 'BUS-012',
      driverName: 'Sarah Johnson',
      priority: 'High',
      busStatus: 'Major Issue',
      issueDescription: 'Brake pedal feels soft, might need fluid check',
      reviewed: true,
      reportedAt: '2023-06-15T09:45:00'
    },
    {
      id: 3,
      busId: 'BUS-025',
      driverName: 'David Brown',
      priority: 'Low',
      busStatus: 'Good',
      issueDescription: 'Air conditioning not working properly',
      reviewed: true,
      reportedAt: '2023-06-15T10:15:00'
    },
    {
      id: 4,
      busId: 'BUS-008',
      driverName: 'Emma Wilson',
      priority: 'High',
      busStatus: 'Out of Service',
      issueDescription: 'Dashboard warning light intermittently flashing',
      reviewed: false,
      reportedAt: '2023-06-15T11:20:00'
    }
  ]);

  const getBusStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'minor issue': return 'bg-yellow-100 text-yellow-800';
      case 'major issue': return 'bg-orange-100 text-orange-800';
      case 'out of service': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority.toLowerCase()) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
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
                         report.busStatus.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === 'all' || 
                           report.priority.toLowerCase() === priorityFilter.toLowerCase();
    const matchesSearch = report.busId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.issueDescription.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const markAsReviewed = (reportId: number) => {
    setReports(reports.map(report => 
      report.id === reportId ? { ...report, reviewed: true } : report
    ));
  };

  const markAsUnreviewed = (reportId: number) => {
    setReports(reports.map(report => 
      report.id === reportId ? { ...report, reviewed: false } : report
    ));
  };

  const markAllAsReviewed = () => {
    setReports(reports.map(report => 
      !report.reviewed ? { ...report, reviewed: true } : report
    ));
  };

  const handleReviewClick = (report: Report) => {
    if (!report.reviewed) {
      markAsReviewed(report.id);
    }
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  // Statistics
  const unreviewedCount = reports.filter(r => !r.reviewed).length;
  const goodStatusCount = reports.filter(r => r.busStatus === 'Good').length;
  const minorIssueCount = reports.filter(r => r.busStatus === 'Minor Issue').length;
  const majorIssueCount = reports.filter(r => r.busStatus === 'Major Issue').length;

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option value="minor issue">Minor Issue</option>
              <option value="major issue">Major Issue</option>
              <option value="out of service">Out of Service</option>
            </select>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFilter className="text-gray-400" />
            </div>
            <select
              className="pl-10 pr-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported At</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <tr 
                    key={report.id} 
                    className={`hover:bg-gray-50 ${!report.reviewed ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{report.busId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{report.driverName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(report.priority)}`}>
                        {report.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBusStatusColor(report.busStatus)}`}>
                        {report.busStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(report.reportedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center">
                        {!report.reviewed ? (
                          <button
                            onClick={() => handleReviewClick(report)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <FaCheck size={12} />
                            <span>Review</span>
                          </button>
                        ) : (
                          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg inline-flex items-center gap-1.5">
                            <FaCheck size={12} />
                            <span>Reviewed</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
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
                    <h3 className="text-sm font-medium text-gray-500">Bus ID</h3>
                    <p className="mt-1 text-gray-900">{selectedReport.busId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Driver</h3>
                    <p className="mt-1 text-gray-900">{selectedReport.driverName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                    <span className={`mt-1 px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getPriorityColor(selectedReport.priority)}`}>
                      {selectedReport.priority}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <span className={`mt-1 px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getBusStatusColor(selectedReport.busStatus)}`}>
                      {selectedReport.busStatus}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Reported At</h3>
                  <p className="mt-1 text-gray-900">{formatDateTime(selectedReport.reportedAt)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Issue Description</h3>
                  <p className="mt-1 text-gray-900 whitespace-pre-line">{selectedReport.issueDescription}</p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-end space-x-3">
                    {selectedReport.reviewed ? (
                      <button
                        onClick={() => {
                          markAsUnreviewed(selectedReport.id);
                          closeModal();
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                      >
                        Mark as Unreviewed
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          markAsReviewed(selectedReport.id);
                          closeModal();
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Mark as Reviewed
                      </button>
                    )}
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