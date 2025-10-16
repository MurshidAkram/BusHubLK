import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertTriangle, X, Calendar, Filter, Download, Eye } from 'lucide-react';

// API Configuration
const API_BASE_URL = 'http://localhost:5000';

interface LostFoundReport {
  report_id: number;
  passenger_id?: string;
  incident_date: string;
  incident_time: string;
  passenger_name: string;
  report_type: 'Lost' | 'Found';
  item_category: string;
  item_description: string;
  item_photo_url?: string;
  route_number: string;
  bus_number?: string;
  contact_email: string;
  contact_phone: string;
  status: 'Pending' | 'Resolved';
  driver_name?: string;
  driver_phone?: string;
  location_found?: string;
  created_at: string;
  updated_at: string;
  resolved_by?: string;
  resolution_date?: string;
  resolution_notes?: string;
}

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

interface Statistics {
  total_reports: number;
  lost_reports: number;
  found_reports: number;
  resolved_reports: number;
  pending_reports: number;
}

const IncidentManagement = () => {
  // State Management
  const [reports, setReports] = useState<LostFoundReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter States
  const [filter, setFilter] = useState<'All' | 'Lost' | 'Found'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Resolved'>('All');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  // Modal and UI States
  const [selectedReport, setSelectedReport] = useState<LostFoundReport | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 20
  });
  
  // Data States
  const [statistics, setStatistics] = useState<Statistics>({
    total_reports: 0,
    lost_reports: 0,
    found_reports: 0,
    resolved_reports: 0,
    pending_reports: 0
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // API Functions
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📡 Fetching reports from API...');

      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', itemsPerPage.toString());

      if (filter !== 'All') queryParams.append('type', filter);
      if (categoryFilter !== 'All') queryParams.append('category', categoryFilter);
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);
      if (dateFilter) queryParams.append('date', dateFilter);

      const response = await fetch(`${API_BASE_URL}/api/incident-management/reports?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 API Response:', data);

      if (data.success) {
        setReports(data.data || []);
        setPagination(data.pagination || {
          current_page: 1,
          total_pages: 1,
          total_items: 0,
          items_per_page: 20
        });
        console.log(`✅ Loaded ${data.data?.length || 0} reports`);
      } else {
        throw new Error(data.message || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('❌ Error fetching reports:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filter, categoryFilter, statusFilter, dateFilter]);

  const fetchStatistics = useCallback(async () => {
    try {
      console.log('📊 Fetching statistics...');
      const queryParams = new URLSearchParams();
      if (dateFilter) queryParams.append('date', dateFilter);

      const response = await fetch(`${API_BASE_URL}/api/incident-management/statistics?${queryParams}`);
      
      if (!response.ok) {
        console.warn('Failed to fetch statistics, using defaults');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setStatistics(data.data);
        console.log('✅ Statistics loaded:', data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
    }
  }, [dateFilter]);

  const fetchAvailableCategories = useCallback(async () => {
    try {
      console.log('📦 Fetching available categories...');
      const response = await fetch(`${API_BASE_URL}/api/incident-management/categories`);
      
      if (!response.ok) {
        console.warn('Failed to fetch categories, using defaults');
        setAvailableCategories(['phone', 'wallet', 'bag', 'keys', 'clothing', 'documents', 'electronics', 'jewelry', 'other']);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setAvailableCategories(data.data || []);
        console.log('✅ Available categories loaded:', data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching available categories:', error);
      setAvailableCategories(['phone', 'wallet', 'bag', 'keys', 'clothing', 'documents', 'electronics', 'jewelry', 'other']);
    }
  }, []);

  const handleResolveReport = async (reportId: number) => {
    try {
      console.log('🔄 Resolving report:', reportId);
      const response = await fetch(`${API_BASE_URL}/api/incident-management/reports/${reportId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolved_by: 'Depot Staff',
          resolution_notes: 'Resolved from depot dashboard'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        console.log('✅ Report resolved successfully');
        // Refresh the reports and statistics
        fetchReports();
        fetchStatistics();
        setShowModal(false);
        setSelectedReport(null);
      } else {
        throw new Error(data.message || 'Failed to resolve report');
      }
    } catch (error) {
      console.error('❌ Error resolving report:', error);
      alert(error instanceof Error ? error.message : 'Failed to resolve report');
    }
  };

  const handleExportCSV = async () => {
    try {
      console.log('📄 Exporting to CSV...');
      const queryParams = new URLSearchParams();
      
      if (filter !== 'All') queryParams.append('type', filter);
      if (categoryFilter !== 'All') queryParams.append('category', categoryFilter);
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);
      if (dateFilter) queryParams.append('date', dateFilter);

      const response = await fetch(`${API_BASE_URL}/api/incident-management/export/csv?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `incident_reports_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ CSV export completed');
    } catch (error) {
      console.error('❌ Error exporting CSV:', error);
      alert(error instanceof Error ? error.message : 'Failed to export CSV');
    }
  };

  // Effects
  useEffect(() => {
    console.log('🔄 Component mounted, fetching initial data...');
    fetchAvailableCategories();
  }, [fetchAvailableCategories]);

  useEffect(() => {
    fetchReports();
    fetchStatistics();
  }, [fetchReports, fetchStatistics]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filter, categoryFilter, statusFilter, dateFilter]);

  // Utility Functions
  const clearFilters = () => {
    setFilter('All');
    setCategoryFilter('All');
    setStatusFilter('All');
    setDateFilter('');
    setCurrentPage(1);
  };

  const openModal = (report: LostFoundReport) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedReport(null);
    setShowModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Lost':
        return 'bg-red-100 text-red-800';
      case 'Found':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Incident Management</h1>
            <p className="text-sm text-gray-500">Manage lost and found items reported by passengers</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm inline-flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-blue-50">
              <AlertTriangle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900">{statistics.total_reports}</h3>
              <p className="text-sm text-gray-500">Total Reports</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-red-50">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900">{statistics.lost_reports}</h3>
              <p className="text-sm text-gray-500">Lost Items</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-blue-50">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900">{statistics.found_reports}</h3>
              <p className="text-sm text-gray-500">Found Items</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-green-50">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900">{statistics.resolved_reports}</h3>
              <p className="text-sm text-gray-500">Resolved</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-yellow-50">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900">{statistics.pending_reports}</h3>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Date Filter */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Select date"
              />
            </div>
            
            {/* Filter Tabs */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilter('All')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${filter === 'All' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
              >
                All Types
              </button>
              <button
                onClick={() => setFilter('Lost')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${filter === 'Lost' ? 'bg-white shadow-sm text-red-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Lost
              </button>
              <button
                onClick={() => setFilter('Found')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${filter === 'Found' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Found
              </button>
            </div>

            {/* Additional Filters */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Pending' | 'Resolved')}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm inline-flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-600">
                {error ? 'There was an error loading the reports.' : 'No incident reports match your current filters.'}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Report Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Item Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Passenger Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {reports.map((report) => (
                  <tr key={report.report_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="font-medium text-gray-900">{formatDate(report.incident_date)}</div>
                      <div className="text-xs text-gray-400">{report.incident_time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getTypeColor(report.report_type)}`}>
                        {report.report_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {report.item_category.charAt(0).toUpperCase() + report.item_category.slice(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{report.passenger_name}</div>
                      <div className="text-xs text-gray-500">{report.contact_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => openModal(report)}
                          className="text-blue-600 hover:text-blue-700 inline-flex items-center transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                        {report.status === 'Pending' && (
                          <button
                            onClick={() => handleResolveReport(report.report_id)}
                            className="text-green-600 hover:text-green-700 inline-flex items-center transition-colors"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && reports.length > 0 && (
          <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                Showing {((pagination.current_page - 1) * pagination.items_per_page) + 1} to {Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)} of {pagination.total_items} results
              </span>
              <select
                className="ml-4 px-2 py-1 border rounded text-sm"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.total_pages, currentPage + 1))}
                disabled={currentPage === pagination.total_pages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Count */}
      {!loading && reports.length > 0 && (
        <div className="text-sm text-gray-500 px-4">
          Showing {reports.length} incident reports
        </div>
      )}

      {/* Modal for Report Details */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Report Details</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Report Information */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Type</label>
                          <p className="text-sm text-gray-900 mt-1">
                            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getTypeColor(selectedReport.report_type)}`}>
                              {selectedReport.report_type}
                            </span>
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <p className="text-sm text-gray-900 mt-1">
                            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedReport.status)}`}>
                              {selectedReport.status}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date & Time</label>
                        <p className="text-sm text-gray-900 mt-1 font-medium">
                          {formatDate(selectedReport.incident_date)} at {selectedReport.incident_time}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Route Number</label>
                        <p className="text-sm text-gray-900 mt-1 font-medium">Route {selectedReport.route_number}</p>
                      </div>
                      {selectedReport.bus_number && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Bus Number</label>
                          <p className="text-sm text-gray-900 mt-1 font-medium">{selectedReport.bus_number}</p>
                        </div>
                      )}
                      {selectedReport.location_found && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Location Found</label>
                          <p className="text-sm text-gray-900 mt-1 font-medium">{selectedReport.location_found}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Passenger Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="text-sm text-gray-900 mt-1 font-medium">{selectedReport.passenger_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-sm text-gray-900 mt-1 font-medium">{selectedReport.contact_email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-sm text-gray-900 mt-1 font-medium">{selectedReport.contact_phone}</p>
                      </div>
                    </div>
                  </div>

                  {selectedReport.driver_name && selectedReport.driver_name !== 'N/A' && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Name</label>
                          <p className="text-sm text-gray-900 mt-1 font-medium">{selectedReport.driver_name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Phone</label>
                          <p className="text-sm text-gray-900 mt-1 font-medium">{selectedReport.driver_phone}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Item Information and Image */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Category</label>
                        <p className="text-sm text-gray-900 mt-1 font-medium">
                          {selectedReport.item_category.charAt(0).toUpperCase() + selectedReport.item_category.slice(1)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Description</label>
                        <p className="text-sm text-gray-900 mt-1 leading-relaxed">{selectedReport.item_description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Item Photo */}
                  {selectedReport.item_photo_url && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Photo</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <img 
                          src={selectedReport.item_photo_url} 
                          alt="Item photo" 
                          className="w-full h-64 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {selectedReport.resolution_notes && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolution Details</h3>
                      <div className="space-y-4">
                        {selectedReport.resolved_by && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Resolved By</label>
                            <p className="text-sm text-gray-900 mt-1 font-medium">{selectedReport.resolved_by}</p>
                          </div>
                        )}
                        {selectedReport.resolution_date && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Resolution Date</label>
                            <p className="text-sm text-gray-900 mt-1 font-medium">{formatDate(selectedReport.resolution_date)}</p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-gray-500">Resolution Notes</label>
                          <p className="text-sm text-gray-900 mt-1 leading-relaxed">{selectedReport.resolution_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                {selectedReport.status === 'Pending' && (
                  <button
                    onClick={() => handleResolveReport(selectedReport.report_id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentManagement;