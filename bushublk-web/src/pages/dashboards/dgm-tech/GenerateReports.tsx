import { useState } from 'react';
import { 
  FaFileAlt, 
  FaCog, 
  FaHeartbeat, 
  FaChartBar, 
  FaCheckCircle, 
  FaDollarSign,
  FaChevronDown
} from 'react-icons/fa';

interface FormData {
  fromDate: string;
  toDate: string;
  region: string;
  depot: string;
  busModel: string;
  reportType: string;
  outputFormat: string;
  metrics: {
    fleetAvailability: boolean;
    breakdownData: boolean;
    mttr: boolean;
    maintenanceCost: boolean;
    serviceCompliance: boolean;
    inspectionResults: boolean;
  };
}

type MetricKey = keyof FormData['metrics'];

const GenerateReports = () => {
  const [formData, setFormData] = useState<FormData>({
    fromDate: '',
    toDate: '',
    region: 'All Regions',
    depot: 'All Depots',
    busModel: 'All Models',
    reportType: 'Summary Report',
    outputFormat: 'PDF',
    metrics: {
      fleetAvailability: true,
      breakdownData: true,
      mttr: true,
      maintenanceCost: false,
      serviceCompliance: false,
      inspectionResults: false
    }
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMetricChange = (metric: MetricKey) => {
    setFormData(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [metric]: !prev.metrics[metric]
      }
    }));
  };

  const generateReport = () => {
    console.log('Generating report with data:', formData);
    // Report generation logic would go here
    alert('Report generation initiated!');
  };

  const reportCards = [
    {
      icon: <FaChartBar className="w-8 h-8 text-blue-500" />,
      title: "Regional Performance Reports",
      description: "Generate reports on regional metrics including average repair time, breakdown rates, and service compliance across all depots in each region."
    },
    {
      icon: <FaCog className="w-8 h-8 text-blue-500" />,
      title: "Depot Maintenance Reports",
      description: "Detailed reports on depot-level maintenance activities, service logs, inspection status, and maintenance expenses for each depot."
    },
    {
      icon: <FaHeartbeat className="w-8 h-8 text-blue-500" />,
      title: "Fleet Health Reports",
      description: "Comprehensive reports on fleet health including vehicle age analysis, maintenance cost per bus, and reliability metrics by bus models."
    },
    {
      icon: <FaFileAlt className="w-8 h-8 text-blue-500" />,
      title: "Breakdown Analysis",
      description: "Reports analyzing breakdown patterns, most frequent issues, mean time between failures, and cost of repairs by component type."
    },
    {
      icon: <FaCheckCircle className="w-8 h-8 text-blue-500" />,
      title: "Compliance Reports",
      description: "Reports on maintenance and inspection compliance rates, overdue services, and comparison against regulatory requirements."
    },
    {
      icon: <FaDollarSign className="w-8 h-8 text-blue-500" />,
      title: "Cost Analysis Reports",
      description: "Reports analyzing maintenance costs by region, depot, bus type, and component. Includes cost trends and budget variance analysis."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {reportCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {card.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Report Generator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Custom Report Generator</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Date Range */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Date Range</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.fromDate}
                        onChange={(e) => handleInputChange('fromDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="dd/mm/yyyy"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.toDate}
                        onChange={(e) => handleInputChange('toDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="dd/mm/yyyy"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bus Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bus Model</label>
                <div className="relative">
                  <select
                    value={formData.busModel}
                    onChange={(e) => handleInputChange('busModel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    <option>All Models</option>
                    <option>Volvo B7RLE</option>
                    <option>Mercedes Citaro</option>
                    <option>Scania Omnicity</option>
                    <option>MAN Lion's City</option>
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Metrics to Include */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-4">Metrics to Include</label>
                <div className="space-y-3">
                  {[
                    { key: 'fleetAvailability' as MetricKey, label: 'Fleet Availability', checked: formData.metrics.fleetAvailability },
                    { key: 'breakdownData' as MetricKey, label: 'Breakdown Data', checked: formData.metrics.breakdownData },
                    { key: 'mttr' as MetricKey, label: 'MTTR', checked: formData.metrics.mttr },
                    { key: 'maintenanceCost' as MetricKey, label: 'Maintenance Cost', checked: formData.metrics.maintenanceCost },
                    { key: 'serviceCompliance' as MetricKey, label: 'Service Compliance', checked: formData.metrics.serviceCompliance },
                    { key: 'inspectionResults' as MetricKey, label: 'Inspection Results', checked: formData.metrics.inspectionResults }
                  ].map((metric) => (
                    <label key={metric.key} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={metric.checked}
                        onChange={() => handleMetricChange(metric.key)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{metric.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Report Scope */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Report Scope</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                    <div className="relative">
                      <select
                        value={formData.region}
                        onChange={(e) => handleInputChange('region', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                      >
                        <option>All Regions</option>
                        <option>North Region</option>
                        <option>South Region</option>
                        <option>East Region</option>
                        <option>West Region</option>
                      </select>
                      <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Depot</label>
                    <div className="relative">
                      <select
                        value={formData.depot}
                        onChange={(e) => handleInputChange('depot', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                      >
                        <option>All Depots</option>
                        <option>Central Depot</option>
                        <option>North Depot</option>
                        <option>South Depot</option>
                        <option>East Depot</option>
                        <option>West Depot</option>
                      </select>
                      <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <div className="relative">
                  <select
                    value={formData.reportType}
                    onChange={(e) => handleInputChange('reportType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    <option>Summary Report</option>
                    <option>Detailed Report</option>
                    <option>Executive Summary</option>
                    <option>Technical Report</option>
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Output Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Output Format</label>
                <div className="flex space-x-6">
                  {['PDF', 'Excel', 'CSV'].map((format) => (
                    <label key={format} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="outputFormat"
                        value={format}
                        checked={formData.outputFormat === format}
                        onChange={(e) => handleInputChange('outputFormat', e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{format}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="pt-4">
                <button
                  onClick={generateReport}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateReports;