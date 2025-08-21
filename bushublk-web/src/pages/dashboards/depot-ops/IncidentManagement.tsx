import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Search, X, Calendar, Filter, Download, Eye } from 'lucide-react';

// API Configuration
const API_BASE_URL = 'http://10.136.250.115:5000';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('');
  
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
  const [availableYears, setAvailableYears] = useState<number[]>([]);
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

      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());
      if (filter !== 'All') queryParams.append('type', filter);
      if (categoryFilter !== 'All') queryParams.append('category', categoryFilter);
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);
      if (yearFilter) queryParams.append('year', yearFilter);
      if (monthFilter) queryParams.append('month', monthFilter);

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
  }, [currentPage, itemsPerPage, searchQuery, filter, categoryFilter, statusFilter, yearFilter, monthFilter]);

  const fetchStatistics = useCallback(async () => {
    try {
      console.log('📊 Fetching statistics...');
      const queryParams = new URLSearchParams();
      if (yearFilter) queryParams.append('year', yearFilter);
      if (monthFilter) queryParams.append('month', monthFilter);

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
  }, [yearFilter, monthFilter]);

  const fetchAvailableYears = useCallback(async () => {
    try {
      console.log('📅 Fetching available years...');
      const response = await fetch(`${API_BASE_URL}/api/incident-management/years`);
      
      if (!response.ok) {
        console.warn('Failed to fetch years, using defaults');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setAvailableYears(data.data || []);
        console.log('✅ Available years loaded:', data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching available years:', error);
    }
  }, []);

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
      
      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());
      if (filter !== 'All') queryParams.append('type', filter);
      if (categoryFilter !== 'All') queryParams.append('category', categoryFilter);
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);
      if (yearFilter) queryParams.append('year', yearFilter);
      if (monthFilter) queryParams.append('month', monthFilter);

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
    fetchAvailableYears();
    fetchAvailableCategories();
  }, [fetchAvailableYears, fetchAvailableCategories]);

  useEffect(() => {
    fetchReports();
    fetchStatistics();
  }, [fetchReports, fetchStatistics]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filter, categoryFilter, statusFilter, searchQuery, yearFilter, monthFilter]);

  // Utility Functions
  const clearFilters = () => {
    setFilter('All');
    setCategoryFilter('All');
    setStatusFilter('All');
    setSearchQuery('');
    setYearFilter('');
    setMonthFilter('');
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
        return 'text-green-600 bg-green-100';
      case 'Pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Lost':
        return 'text-red-600 bg-red-100';
      case 'Found':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Incident Management</h1>
          <p className="text-gray-600">Manage lost and found items reported by passengers</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{statistics.total_reports}</h3>
                <p className="text-gray-600">Total Reports</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <X className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{statistics.lost_reports}</h3>
                <p className="text-gray-600">Lost Items</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{statistics.found_reports}</h3>
                <p className="text-gray-600">Found Items</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{statistics.resolved_reports}</h3>
                <p className="text-gray-600">Resolved</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{statistics.pending_reports}</h3>
                <p className="text-gray-600">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Type Filter */}
              <select
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'All' | 'Lost' | 'Found')}
              >
                <option value="All">All Types</option>
                <option value="Lost">Lost Items</option>
                <option value="Found">Found Items</option>
              </select>

              {/* Category Filter */}
              <select
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              {/* Status Filter */}
              <select
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Pending' | 'Resolved')}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
              </select>

              {/* Year Filter */}
              <select
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              {/* Month Filter */}
              <select
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              >
                <option value="">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            <div className="flex gap-2">
              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4 inline mr-1" />
                Clear Filters
              </button>

              {/* Export CSV */}
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 inline mr-1" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Passenger Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route & Bus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.report_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{report.report_id}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs" title={report.item_description}>
                          {report.item_description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{report.passenger_name}</div>
                        <div className="text-sm text-gray-500">{report.contact_phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(report.report_type)}`}>
                          {report.report_type}
                        </span>
                        <div className="text-sm text-gray-500 mt-1">
                          {report.item_category.charAt(0).toUpperCase() + report.item_category.slice(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">Route {report.route_number}</div>
                        <div className="text-sm text-gray-500">{report.bus_number || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{formatDate(report.incident_date)}</div>
                        <div>{report.incident_time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openModal(report)}
                          className="text-blue-600 hover:text-blue-900 mr-3 inline-flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                        {report.status === 'Pending' && (
                          <button
                            onClick={() => handleResolveReport(report.report_id)}
                            className="text-green-600 hover:text-green-900 inline-flex items-center"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </button>
                        )}
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

        {/* Modal for Report Details */}
        {showModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Report Details</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Report ID</label>
                        <p className="text-sm text-gray-900">#{selectedReport.report_id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Type</label>
                        <p className="text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedReport.report_type)}`}>
                            {selectedReport.report_type}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <p className="text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedReport.status)}`}>
                            {selectedReport.status}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date & Time</label>
                        <p className="text-sm text-gray-900">
                          {formatDate(selectedReport.incident_date)} at {selectedReport.incident_time}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Passenger Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="text-sm text-gray-900">{selectedReport.passenger_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-sm text-gray-900">{selectedReport.contact_email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-sm text-gray-900">{selectedReport.contact_phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Category</label>
                        <p className="text-sm text-gray-900">
                          {selectedReport.item_category.charAt(0).toUpperCase() + selectedReport.item_category.slice(1)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Route Number</label>
                        <p className="text-sm text-gray-900">Route {selectedReport.route_number}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Bus Number</label>
                        <p className="text-sm text-gray-900">{selectedReport.bus_number || 'Not specified'}</p>
                      </div>
                      {selectedReport.location_found && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Location Found</label>
                          <p className="text-sm text-gray-900">{selectedReport.location_found}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedReport.item_description}</p>
                    </div>
                    
                    {selectedReport.resolution_notes && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-500">Resolution Notes</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedReport.resolution_notes}</p>
                      </div>
                    )}
                  </div>

                  {selectedReport.item_photo_url && (
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Photo</h3>
                      <img 
                        src={selectedReport.item_photo_url} 
                        alt="Item photo" 
                        className="w-full max-w-sm h-64 object-cover rounded-lg border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
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
    </div>
  );
};

export default IncidentManagement;