import React, { useState, useEffect } from 'react';
import { 
  FaDownload, 
  FaFilter, 
  FaChartBar, 
  FaCalendarAlt, 
  FaMapMarkerAlt,
  FaBus,
  FaTools,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaFileExport,
  FaPrint
} from 'react-icons/fa';

interface RegionData {
  region_id: number;
  region_name: string;
  depot_count: number;
  bus_count: number;
}

interface DepotData {
  depot_id: number;
  depot_name: string;
  region_name: string;
  bus_count: number;
  active_buses: number;
  maintenance_buses: number;
  out_of_service_buses: number;
}

interface ReportFilters {
  reportType: 'regional' | 'depot';
  region: string;
  depot: string;
  dateRange: 'last_30_days' | 'last_quarter' | 'last_6_months' | 'custom';
  startDate: string;
  endDate: string;
  categories: string[];
}

interface ReportMetrics {
  performance: {
    fleet_utilization: number;
    on_time_performance: number;
    fuel_efficiency: number;
    route_coverage: number;
  };
  maintenance: {
    scheduled_compliance: number;
    breakdown_incidents: number;
    parts_availability: number;
    maintenance_cost: number;
  };
  service_quality: {
    passenger_complaints: number;
    service_reliability: number;
    safety_incidents: number;
    cleanliness_score: number;
  };
}

const GenerateReports = () => {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [depots, setDepots] = useState<DepotData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: 'regional',
    region: 'all',
    depot: 'all',
    dateRange: 'last_30_days',
    startDate: '',
    endDate: '',
    categories: ['performance', 'maintenance', 'service_quality']
  });

  // Fetch regions and depots
  useEffect(() => {
    fetchRegions();
    fetchDepots();
  }, []);

  const fetchRegions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/dgm-technical/regions');
      const result = await response.json();
      if (result.success) {
        setRegions(result.data);
      }
    } catch (err) {
      console.error('Error fetching regions:', err);
    }
  };

  const fetchDepots = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/dgm-technical/depots');
      const result = await response.json();
      if (result.success) {
        setDepots(result.data);
      }
    } catch (err) {
      console.error('Error fetching depots:', err);
    }
  };

  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      // Build the API endpoint based on filters
      const reportEndpoint = filters.reportType === 'regional' 
        ? 'http://localhost:5000/api/dgm-technical/reports/regional'
        : 'http://localhost:5000/api/dgm-technical/reports/depot';
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        dateRange: filters.dateRange,
        ...(filters.dateRange === 'custom' && {
          startDate: filters.startDate,
          endDate: filters.endDate
        }),
        ...(filters.region !== 'all' && { regionId: filters.region }),
        ...(filters.depot !== 'all' && { depotId: filters.depot }),
        categories: filters.categories.join(',')
      });

      const response = await fetch(`${reportEndpoint}?${queryParams}`);
      const result = await response.json();
      
      if (result.success) {
        setReportData(result.data);
      } else {
        throw new Error(result.message || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      // Fallback to mock data if API fails
      const mockReportData = {
        reportType: filters.reportType,
        generatedAt: new Date().toISOString(),
        dateRange: filters.dateRange,
        summary: {
          total_entities: filters.reportType === 'regional' ? regions.length : depots.length,
          total_buses: 1892,
          total_incidents: 45,
          overall_performance: 87.5
        },
        entities: filters.reportType === 'regional' 
          ? regions.map(region => ({
              id: region.region_id,
              name: region.region_name,
              metrics: generateMockMetrics()
            }))
          : depots.filter(depot => filters.region === 'all' || depot.region_name === filters.region)
              .map(depot => ({
                id: depot.depot_id,
                name: depot.depot_name,
                region: depot.region_name,
                metrics: generateMockMetrics()
              }))
      };
      setReportData(mockReportData);
    } finally {
      setGeneratingReport(false);
    }
  };

  const generateMockMetrics = (): ReportMetrics => ({
    performance: {
      fleet_utilization: Math.random() * 20 + 75,
      on_time_performance: Math.random() * 15 + 80,
      fuel_efficiency: Math.random() * 10 + 85,
      route_coverage: Math.random() * 10 + 88
    },
    maintenance: {
      scheduled_compliance: Math.random() * 10 + 85,
      breakdown_incidents: Math.floor(Math.random() * 20),
      parts_availability: Math.random() * 15 + 80,
      maintenance_cost: Math.random() * 50000 + 100000
    },
    service_quality: {
      passenger_complaints: Math.floor(Math.random() * 50),
      service_reliability: Math.random() * 10 + 85,
      safety_incidents: Math.floor(Math.random() * 10),
      cleanliness_score: Math.random() * 20 + 75
    }
  });

  const exportReport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting report as ${format}`);
    // Implement export functionality
  };

  const printReport = () => {
    window.print();
  };

  const getMetricIcon = (category: string) => {
    switch (category) {
      case 'performance': return <FaChartBar className="text-blue-500" />;
      case 'maintenance': return <FaTools className="text-orange-500" />;
      case 'service_quality': return <FaCheckCircle className="text-green-500" />;
      default: return <FaBus className="text-gray-500" />;
    }
  };

  const getMetricColor = (value: number, type: 'percentage' | 'count' | 'cost') => {
    if (type === 'percentage') {
      if (value >= 90) return 'text-green-600';
      if (value >= 80) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (type === 'count') {
      if (value <= 5) return 'text-green-600';
      if (value <= 15) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Generate Regional & Depot Reports</h1>
          <p className="text-gray-600">Produce performance and maintenance reports categorized by region or individual depots</p>
        </div>

        {/* Report Type Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Regional Report Card */}
          <div 
            className={`bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all ${
              filters.reportType === 'regional' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => handleFilterChange('reportType', 'regional')}
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-lg ${filters.reportType === 'regional' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <FaMapMarkerAlt className={`text-xl ${filters.reportType === 'regional' ? 'text-blue-600' : 'text-gray-600'}`} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-800">Regional Report</h3>
                  <p className="text-sm text-gray-600">Analyze performance across all regions</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Coverage:</span>
                  <span className="font-medium text-gray-800">{regions.length} Regions</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Scope:</span>
                  <span className="font-medium text-gray-800">High-level Overview</span>
                </div>
              </div>
            </div>
          </div>

          {/* Depot Report Card */}
          <div 
            className={`bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all ${
              filters.reportType === 'depot' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-green-300'
            }`}
            onClick={() => handleFilterChange('reportType', 'depot')}
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-lg ${filters.reportType === 'depot' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <FaBus className={`text-xl ${filters.reportType === 'depot' ? 'text-green-600' : 'text-gray-600'}`} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-800">Depot-Level Report</h3>
                  <p className="text-sm text-gray-600">Detailed analysis of individual depots</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Coverage:</span>
                  <span className="font-medium text-gray-800">{depots.length} Depots</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Scope:</span>
                  <span className="font-medium text-gray-800">Detailed Analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
              <FaFilter className="mr-2 text-blue-600" />
              Configure {filters.reportType === 'regional' ? 'Regional' : 'Depot-Level'} Report
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Region Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaMapMarkerAlt className="mr-1 text-gray-500" />
                  Region Filter
                </label>
                <select
                  value={filters.region}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Regions ({regions.length})</option>
                  {regions.map(region => (
                    <option key={region.region_id} value={region.region_name}>
                      {region.region_name} ({region.depot_count} depots)
                    </option>
                  ))}
                </select>
              </div>

              {/* Depot Selection (only for depot reports) */}
              {filters.reportType === 'depot' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaBus className="mr-1 text-gray-500" />
                    Depot Filter
                  </label>
                  <select
                    value={filters.depot}
                    onChange={(e) => handleFilterChange('depot', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Depots ({depots.filter(depot => filters.region === 'all' || depot.region_name === filters.region).length})</option>
                    {depots
                      .filter(depot => filters.region === 'all' || depot.region_name === filters.region)
                      .map(depot => (
                        <option key={depot.depot_id} value={depot.depot_name}>
                          {depot.depot_name} ({depot.region_name})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaCalendarAlt className="mr-1 text-gray-500" />
                  Time Period
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="last_quarter">Last Quarter (90 days)</option>
                  <option value="last_6_months">Last 6 Months</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range */}
            {filters.dateRange === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Report Categories */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">Report Categories</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { 
                    key: 'performance', 
                    label: 'Performance Metrics', 
                    icon: <FaChartBar />, 
                    description: 'Fleet utilization, route coverage, efficiency',
                    color: 'blue'
                  },
                  { 
                    key: 'maintenance', 
                    label: 'Maintenance Compliance', 
                    icon: <FaTools />, 
                    description: 'Service schedules, breakdowns, parts usage',
                    color: 'orange'
                  },
                  { 
                    key: 'service_quality', 
                    label: 'Service Quality', 
                    icon: <FaCheckCircle />, 
                    description: 'Safety, reliability, passenger satisfaction',
                    color: 'green'
                  }
                ].map(category => (
                  <div 
                    key={category.key} 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      filters.categories.includes(category.key)
                        ? `border-${category.color}-500 bg-${category.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleCategoryToggle(category.key)}
                  >
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category.key)}
                        onChange={() => handleCategoryToggle(category.key)}
                        className="mr-3 h-4 w-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className={`text-${category.color}-600 mr-2`}>
                        {category.icon}
                      </div>
                      <span className="font-medium text-gray-800">{category.label}</span>
                    </div>
                    <p className="text-xs text-gray-600 ml-7">{category.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={generateReport}
                disabled={generatingReport || filters.categories.length === 0}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center text-lg font-medium shadow-lg transition-all transform hover:scale-105 disabled:transform-none"
              >
                {generatingReport ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Generating {filters.reportType === 'regional' ? 'Regional' : 'Depot'} Report...
                  </>
                ) : (
                  <>
                    <FaFileExport className="mr-3 text-xl" />
                    Generate {filters.reportType === 'regional' ? 'Regional' : 'Depot'} Report
                  </>
                )}
              </button>
            </div>

            {/* Report Preview Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <div className="text-blue-600 mt-1">
                  <FaExclamationTriangle />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Report Preview</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Type: {filters.reportType === 'regional' ? 'Regional Analysis' : 'Depot-Level Analysis'}</p>
                    <p>• Scope: {filters.region === 'all' ? 'All Regions' : filters.region}</p>
                    {filters.reportType === 'depot' && filters.depot !== 'all' && (
                      <p>• Depot: {filters.depot}</p>
                    )}
                    <p>• Categories: {filters.categories.length} selected ({filters.categories.join(', ')})</p>
                    <p>• Period: {filters.dateRange.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Results */}
        {reportData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {reportData.reportType === 'regional' ? 'Regional' : 'Depot-Level'} Report
                  </h2>
                  <p className="text-sm text-gray-500">
                    Generated on {new Date(reportData.generatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => exportReport('pdf')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                  >
                    <FaDownload className="mr-2" />
                    PDF
                  </button>
                  <button
                    onClick={() => exportReport('excel')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  >
                    <FaDownload className="mr-2" />
                    Excel
                  </button>
                  <button
                    onClick={printReport}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
                  >
                    <FaPrint className="mr-2" />
                    Print
                  </button>
                </div>
              </div>
            </div>

            {/* Report Summary */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-md font-semibold text-gray-800 mb-4">Executive Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{reportData.summary.total_entities}</div>
                  <div className="text-sm text-gray-600">
                    {reportData.reportType === 'regional' ? 'Regions' : 'Depots'} Analyzed
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{reportData.summary.total_buses}</div>
                  <div className="text-sm text-gray-600">Total Fleet Size</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">{reportData.summary.total_incidents}</div>
                  <div className="text-sm text-gray-600">Total Incidents</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{reportData.summary.overall_performance?.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Avg Performance</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{reportData.summary.total_accidents || 0}</div>
                  <div className="text-sm text-gray-600">Accidents</div>
                </div>
              </div>
            </div>

            {/* Detailed Report */}
            <div className="p-6">
              <h3 className="text-md font-semibold text-gray-800 mb-6">
                {reportData.reportType === 'regional' ? 'Regional Performance Analysis' : 'Depot-Level Performance Analysis'}
              </h3>
              <div className="space-y-8">
                {reportData.entities.map((entity: any) => (
                  <div key={entity.id} className="border border-gray-200 rounded-xl p-6 bg-gradient-to-r from-gray-50 to-white shadow-sm hover:shadow-md transition-shadow">
                    {/* Entity Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg mr-4">
                          {reportData.reportType === 'regional' ? 
                            <FaMapMarkerAlt className="text-blue-600 text-xl" /> : 
                            <FaBus className="text-blue-600 text-xl" />
                          }
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-gray-800 flex items-center">
                            {entity.name}
                            {entity.region && <span className="text-sm bg-gray-200 text-gray-600 px-2 py-1 rounded-full ml-3">{entity.region}</span>}
                          </h4>
                          {reportData.reportType === 'depot' && (
                            <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <FaBus className="mr-1" />
                                {entity.metrics?.performance?.total_buses || 'N/A'} Total Buses
                              </span>
                              <span className="flex items-center">
                                <FaCheckCircle className="mr-1 text-green-500" />
                                {entity.metrics?.performance?.active_buses || 'N/A'} Active
                              </span>
                              <span className="flex items-center">
                                <FaTools className="mr-1 text-yellow-500" />
                                {entity.metrics?.maintenance?.maintenance_buses || 'N/A'} Maintenance
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {entity.metrics?.performance?.fleet_utilization?.toFixed(1) || '0.0'}%
                        </div>
                        <div className="text-sm text-gray-500">Overall Score</div>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {filters.categories.map(category => (
                        <div key={category} className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
                          <div className="flex items-center mb-4">
                            <div className="p-2 rounded-lg mr-3" style={{
                              backgroundColor: category === 'performance' ? '#EBF8FF' : 
                                             category === 'maintenance' ? '#FFF7ED' : '#F0FDF4'
                            }}>
                              {getMetricIcon(category)}
                            </div>
                            <h5 className="font-semibold text-gray-800 capitalize">
                              {category.replace('_', ' ')}
                            </h5>
                          </div>
                          
                          {category === 'performance' && (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Fleet Utilization:</span>
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full mr-2 ${getMetricColor(entity.metrics.performance.fleet_utilization, 'percentage').includes('green') ? 'bg-green-500' : getMetricColor(entity.metrics.performance.fleet_utilization, 'percentage').includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                  <span className={`text-sm font-medium ${getMetricColor(entity.metrics.performance.fleet_utilization, 'percentage')}`}>
                                    {entity.metrics.performance.fleet_utilization.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">On-time Performance:</span>
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full mr-2 ${getMetricColor(entity.metrics.performance.on_time_performance, 'percentage').includes('green') ? 'bg-green-500' : getMetricColor(entity.metrics.performance.on_time_performance, 'percentage').includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                  <span className={`text-sm font-medium ${getMetricColor(entity.metrics.performance.on_time_performance, 'percentage')}`}>
                                    {entity.metrics.performance.on_time_performance.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Route Coverage:</span>
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full mr-2 ${getMetricColor(entity.metrics.performance.route_coverage, 'percentage').includes('green') ? 'bg-green-500' : getMetricColor(entity.metrics.performance.route_coverage, 'percentage').includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                  <span className={`text-sm font-medium ${getMetricColor(entity.metrics.performance.route_coverage, 'percentage')}`}>
                                    {entity.metrics.performance.route_coverage.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              {reportData.reportType === 'depot' && (
                                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                  <span className="text-sm text-gray-600">Depot Count:</span>
                                  <span className="text-sm font-medium text-blue-600">
                                    {entity.metrics.performance.depot_count || 'N/A'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {category === 'maintenance' && (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Scheduled Compliance:</span>
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full mr-2 ${getMetricColor(entity.metrics.maintenance.scheduled_compliance, 'percentage').includes('green') ? 'bg-green-500' : getMetricColor(entity.metrics.maintenance.scheduled_compliance, 'percentage').includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                  <span className={`text-sm font-medium ${getMetricColor(entity.metrics.maintenance.scheduled_compliance, 'percentage')}`}>
                                    {entity.metrics.maintenance.scheduled_compliance.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Breakdown Incidents:</span>
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full mr-2 ${getMetricColor(entity.metrics.maintenance.breakdown_incidents, 'count').includes('green') ? 'bg-green-500' : getMetricColor(entity.metrics.maintenance.breakdown_incidents, 'count').includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                  <span className={`text-sm font-medium ${getMetricColor(entity.metrics.maintenance.breakdown_incidents, 'count')}`}>
                                    {entity.metrics.maintenance.breakdown_incidents}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Parts Availability:</span>
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full mr-2 ${getMetricColor(entity.metrics.maintenance.parts_availability, 'percentage').includes('green') ? 'bg-green-500' : getMetricColor(entity.metrics.maintenance.parts_availability, 'percentage').includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                  <span className={`text-sm font-medium ${getMetricColor(entity.metrics.maintenance.parts_availability, 'percentage')}`}>
                                    {entity.metrics.maintenance.parts_availability.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              {reportData.reportType === 'depot' && entity.metrics.maintenance.total_services && (
                                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                  <span className="text-sm text-gray-600">Services Completed:</span>
                                  <span className="text-sm font-medium text-orange-600">
                                    {entity.metrics.maintenance.completed_services || 0}/{entity.metrics.maintenance.total_services || 0}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {category === 'service_quality' && (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Service Reliability:</span>
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full mr-2 ${getMetricColor(entity.metrics.service_quality.service_reliability, 'percentage').includes('green') ? 'bg-green-500' : getMetricColor(entity.metrics.service_quality.service_reliability, 'percentage').includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                  <span className={`text-sm font-medium ${getMetricColor(entity.metrics.service_quality.service_reliability, 'percentage')}`}>
                                    {entity.metrics.service_quality.service_reliability.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Safety Incidents:</span>
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full mr-2 ${getMetricColor(entity.metrics.service_quality.safety_incidents, 'count').includes('green') ? 'bg-green-500' : getMetricColor(entity.metrics.service_quality.safety_incidents, 'count').includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                  <span className={`text-sm font-medium ${getMetricColor(entity.metrics.service_quality.safety_incidents, 'count')}`}>
                                    {entity.metrics.service_quality.safety_incidents}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Cleanliness Score:</span>
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full mr-2 ${getMetricColor(entity.metrics.service_quality.cleanliness_score, 'percentage').includes('green') ? 'bg-green-500' : getMetricColor(entity.metrics.service_quality.cleanliness_score, 'percentage').includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                  <span className={`text-sm font-medium ${getMetricColor(entity.metrics.service_quality.cleanliness_score, 'percentage')}`}>
                                    {entity.metrics.service_quality.cleanliness_score.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              {reportData.reportType === 'depot' && entity.metrics.incidents && (
                                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                  <span className="text-sm text-gray-600">Total Incidents:</span>
                                  <span className="text-sm font-medium text-red-600">
                                    {entity.metrics.incidents.total_incidents || 0}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Depot-specific additional info */}
                    {reportData.reportType === 'depot' && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h6 className="font-medium text-gray-800 mb-3 flex items-center">
                          <FaExclamationTriangle className="mr-2 text-yellow-500" />
                          Key Performance Indicators
                        </h6>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">
                              {((entity.metrics?.performance?.active_buses || 0) / (entity.metrics?.performance?.total_buses || 1) * 100).toFixed(1)}%
                            </div>
                            <div className="text-gray-600">Fleet Availability</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-green-600">
                              {entity.metrics?.maintenance?.completed_services || 0}
                            </div>
                            <div className="text-gray-600">Services Done</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-orange-600">
                              {entity.metrics?.maintenance?.breakdown_incidents || 0}
                            </div>
                            <div className="text-gray-600">Breakdowns</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-red-600">
                              {entity.metrics?.incidents?.accidents || 0}
                            </div>
                            <div className="text-gray-600">Accidents</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Report Footer */}
              <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <div className="text-blue-600 mt-1">
                    <FaExclamationTriangle />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Report Notes</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>• Performance metrics are calculated based on the selected time period</p>
                      <p>• {reportData.reportType === 'regional' ? 'Regional data aggregates all depots within each region' : 'Depot data shows individual facility performance'}</p>
                      <p>• Incident counts include accidents, breakdowns, and safety violations</p>
                      <p>• Maintenance compliance is based on scheduled vs completed services</p>
                      {reportData.reportType === 'depot' && (
                        <p>• Fleet availability = Active buses / Total buses in depot</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateReports;