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
      // Simulate API call for report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock report data - in real app, this would come from API
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
    } catch (err) {
      console.error('Error generating report:', err);
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

        {/* Report Configuration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaFilter className="mr-2" />
              Report Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <select
                  value={filters.reportType}
                  onChange={(e) => handleFilterChange('reportType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="regional">Regional Report</option>
                  <option value="depot">Depot-Level Report</option>
                </select>
              </div>

              {/* Region Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <select
                  value={filters.region}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Regions</option>
                  {regions.map(region => (
                    <option key={region.region_id} value={region.region_name}>
                      {region.region_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="last_quarter">Last Quarter</option>
                  <option value="last_6_months">Last 6 Months</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>

            {/* Report Categories */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Report Categories</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'performance', label: 'Performance Metrics', icon: <FaChartBar /> },
                  { key: 'maintenance', label: 'Maintenance Compliance', icon: <FaTools /> },
                  { key: 'service_quality', label: 'Service Quality', icon: <FaCheckCircle /> }
                ].map(category => (
                  <label key={category.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category.key)}
                      onChange={() => handleCategoryToggle(category.key)}
                      className="mr-2"
                    />
                    <span className="flex items-center text-sm text-gray-700">
                      {category.icon}
                      <span className="ml-1">{category.label}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="mt-6">
              <button
                onClick={generateReport}
                disabled={generatingReport || filters.categories.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {generatingReport ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FaFileExport className="mr-2" />
                    Generate Report
                  </>
                )}
              </button>
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
              <h3 className="text-md font-semibold text-gray-800 mb-4">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{reportData.summary.total_entities}</div>
                  <div className="text-sm text-gray-600">
                    {reportData.reportType === 'regional' ? 'Regions' : 'Depots'} Analyzed
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{reportData.summary.total_buses}</div>
                  <div className="text-sm text-gray-600">Total Fleet Size</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{reportData.summary.total_incidents}</div>
                  <div className="text-sm text-gray-600">Total Incidents</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{reportData.summary.overall_performance.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Overall Performance</div>
                </div>
              </div>
            </div>

            {/* Detailed Report */}
            <div className="p-6">
              <h3 className="text-md font-semibold text-gray-800 mb-4">Detailed Analysis</h3>
              <div className="space-y-6">
                {reportData.entities.map((entity: any) => (
                  <div key={entity.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <FaMapMarkerAlt className="text-gray-500 mr-2" />
                      <h4 className="text-lg font-medium text-gray-800">
                        {entity.name}
                        {entity.region && <span className="text-sm text-gray-500 ml-2">({entity.region})</span>}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {filters.categories.map(category => (
                        <div key={category} className="space-y-3">
                          <div className="flex items-center">
                            {getMetricIcon(category)}
                            <h5 className="font-medium text-gray-700 ml-2 capitalize">
                              {category.replace('_', ' ')}
                            </h5>
                          </div>
                          
                          {category === 'performance' && (
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Fleet Utilization:</span>
                                <span className={`text-sm font-medium ${getMetricColor(entity.metrics.performance.fleet_utilization, 'percentage')}`}>
                                  {entity.metrics.performance.fleet_utilization.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">On-time Performance:</span>
                                <span className={`text-sm font-medium ${getMetricColor(entity.metrics.performance.on_time_performance, 'percentage')}`}>
                                  {entity.metrics.performance.on_time_performance.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Route Coverage:</span>
                                <span className={`text-sm font-medium ${getMetricColor(entity.metrics.performance.route_coverage, 'percentage')}`}>
                                  {entity.metrics.performance.route_coverage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          )}

                          {category === 'maintenance' && (
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Scheduled Compliance:</span>
                                <span className={`text-sm font-medium ${getMetricColor(entity.metrics.maintenance.scheduled_compliance, 'percentage')}`}>
                                  {entity.metrics.maintenance.scheduled_compliance.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Breakdown Incidents:</span>
                                <span className={`text-sm font-medium ${getMetricColor(entity.metrics.maintenance.breakdown_incidents, 'count')}`}>
                                  {entity.metrics.maintenance.breakdown_incidents}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Parts Availability:</span>
                                <span className={`text-sm font-medium ${getMetricColor(entity.metrics.maintenance.parts_availability, 'percentage')}`}>
                                  {entity.metrics.maintenance.parts_availability.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          )}

                          {category === 'service_quality' && (
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Service Reliability:</span>
                                <span className={`text-sm font-medium ${getMetricColor(entity.metrics.service_quality.service_reliability, 'percentage')}`}>
                                  {entity.metrics.service_quality.service_reliability.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Safety Incidents:</span>
                                <span className={`text-sm font-medium ${getMetricColor(entity.metrics.service_quality.safety_incidents, 'count')}`}>
                                  {entity.metrics.service_quality.safety_incidents}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Cleanliness Score:</span>
                                <span className={`text-sm font-medium ${getMetricColor(entity.metrics.service_quality.cleanliness_score, 'percentage')}`}>
                                  {entity.metrics.service_quality.cleanliness_score.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateReports;