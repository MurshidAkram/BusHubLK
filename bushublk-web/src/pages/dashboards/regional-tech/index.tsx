import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaWrench, 
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaBus,
  FaClipboardList
} from 'react-icons/fa';
import { HiUsers } from 'react-icons/hi';
import { AppContext } from '../../../context/AppContext';

interface BusStatusData {
  status: string;
  count: number;
}

interface Inspection {
  id: number;
  inspection_type: string;
  date: string;
  time: string;
  status: string;
  depot_id: number;
  depot_name?: string;
  region_name?: string;
}

const MaintenanceDashboard = () => {
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const token = context?.token;
  
  const [busStatusData, setBusStatusData] = useState<BusStatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch bus status distribution data and depot count
  const [totalDepots, setTotalDepots] = useState<number>(0);
  
  // Inspection data states
  const [upcomingInspections, setUpcomingInspections] = useState<Inspection[]>([]);
  const [completedInspections, setCompletedInspections] = useState<Inspection[]>([]);
  const [inspectionCounts, setInspectionCounts] = useState({
    completed: 0,
    pending: 0
  });
  
  // Active issues data
  const [activeIssuesCount, setActiveIssuesCount] = useState<number>(0);
  
  // Incident statistics for bar chart
  const [incidentStats, setIncidentStats] = useState<{[key: string]: number}>({});
  useEffect(() => {
    const fetchBusStatusData = async () => {
      try {
        setLoading(true);
        if (!token) throw new Error('No authentication token found');
        
        // Fetch bus status summary
        const response = await fetch('http://localhost:5000/api/dgm-technical/dashboard-summary', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data;
          const transformedData = [
            { status: 'Active', count: parseInt(data.buses_active) || 0 },
            { status: 'Maintenance', count: parseInt(data.buses_in_maintenance) || 0 },
            { status: 'Out of Service', count: parseInt(data.buses_out_of_service) || 0 },
            { status: 'In Service', count: parseInt(data.total_buses) - parseInt(data.buses_active) - parseInt(data.buses_in_maintenance) - parseInt(data.buses_out_of_service) || 0 }
          ];
          setBusStatusData(transformedData);
        } else {
          throw new Error(result.message || 'No data received');
        }
        
        // Fetch depot count
        const depotsRes = await fetch('http://localhost:5000/api/depots/service-monitor', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (depotsRes.ok) {
          const depotsData = await depotsRes.json();
          setTotalDepots(Array.isArray(depotsData.depots) ? depotsData.depots.length : 0);
        } else {
          setTotalDepots(0);
        }

        // Fetch inspection data
        await fetchInspectionData();
        
        // Fetch active issues
        await fetchActiveIssues();
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setBusStatusData([
          { status: 'Active', count: 579 },
          { status: 'Maintenance', count: 62 },
          { status: 'Out of Service', count: 27 },
          { status: 'In Service', count: 211 }
        ]);
        setTotalDepots(18); // fallback
      } finally {
        setLoading(false);
      }
    };

    const fetchInspectionData = async () => {
      try {
        if (!token) return;

        // Fetch upcoming inspections (pending)
        const upcomingResponse = await fetch('http://localhost:5000/api/inspections/upcoming', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (upcomingResponse.ok) {
          const upcomingData = await upcomingResponse.json();
          const upcoming = upcomingData.inspections || [];
          setUpcomingInspections(upcoming);
          
          // Fetch past inspections (completed)
          const pastResponse = await fetch('http://localhost:5000/api/inspections/past', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (pastResponse.ok) {
            const pastData = await pastResponse.json();
            const completed = pastData.inspections || [];
            setCompletedInspections(completed);
            
            // Update inspection counts with correct data
            setInspectionCounts({
              completed: completed.length,
              pending: upcoming.length
            });
          }
        }
        
      } catch (err) {
        console.error('Error fetching inspection data:', err);
      }
    };

    const fetchActiveIssues = async () => {
      try {
        if (!token) return;

        // Fetch RTO reports (emergency reports escalated to RTO)
        const response = await fetch('http://localhost:5000/api/rto', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Count active issues (not resolved)
            const activeIssues = data.data.filter((report: any) => 
              report.status !== 'Resolved'
            );
            setActiveIssuesCount(activeIssues.length);

            // Count incidents by type for bar chart
            const incidentCounts: {[key: string]: number} = {};
            
            data.data.forEach((report: any) => {
              const incidentType = report.incident_type || 'unknown';
              incidentCounts[incidentType] = (incidentCounts[incidentType] || 0) + 1;
            });

            setIncidentStats(incidentCounts);
          }
        }
        
      } catch (err) {
        console.error('Error fetching active issues:', err);
      }
    };

    fetchBusStatusData();
  }, [token]);

  // Calculate overall bus status for pie chart
  const overallBusStatus = busStatusData.reduce((acc, data) => {
    acc[data.status] = data.count;
    return acc;
  }, {} as { [key: string]: number });

  // Region-wide Service Monitor Pie Chart Component
  const RegionServiceMonitorChart = () => {
    // Define colors for different bus statuses
    const statusColors: { [key: string]: string } = {
      'Active': '#10B981', // Green
      'Maintenance': '#F59E0B', // Amber
      'Out of Service': '#EF4444', // Red
      'In Service': '#3B82F6', // Blue
    };
    
    const chartData = Object.entries(overallBusStatus).map(([status, count]) => ({
      label: status,
      count: count,
      color: statusColors[status] || '#6B7280'
    }));
    
    const totalCount = chartData.reduce((sum, data) => sum + data.count, 0);
    const [hoveredSlice, setHoveredSlice] = useState<{label: string, count: number, x: number, y: number} | null>(null);
    
    let currentAngle = 0;
    const centerX = 140;
    const centerY = 140;
    const radius = 70;

    const createSlice = (data: any, index: number) => {
      if (data.count === 0) return null;
      
      const sliceAngle = (data.count / totalCount) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      
      const startRadians = (startAngle * Math.PI) / 180;
      const endRadians = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startRadians);
      const y1 = centerY + radius * Math.sin(startRadians);
      const x2 = centerX + radius * Math.cos(endRadians);
      const y2 = centerY + radius * Math.sin(endRadians);
      
      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      currentAngle = endAngle;
      
      return (
        <g key={index}>
          <path
            d={pathData}
            fill={data.color}
            stroke="white"
            strokeWidth="2"
            className="cursor-pointer transition-all duration-200 hover:opacity-80"
            onMouseEnter={(e) => {
              setHoveredSlice({
                label: data.label,
                count: data.count,
                x: e.clientX,
                y: e.clientY
              });
            }}
            onMouseMove={(e) => {
              setHoveredSlice(prev => prev ? {
                ...prev,
                x: e.clientX,
                y: e.clientY
              } : null);
            }}
            onMouseLeave={() => setHoveredSlice(null)}
          />
        </g>
      );
    };

    return (
      <div className="relative flex justify-center items-center h-64">
        <svg width="280" height="280" viewBox="0 0 280 280">
          {chartData.map((data, index) => createSlice(data, index))}
        </svg>
        
        {/* Tooltip */}
        {hoveredSlice && (
          <div 
            className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none"
            style={{
              left: hoveredSlice.x + 10,
              top: hoveredSlice.y - 40,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="text-sm font-medium">{hoveredSlice.label}</div>
            <div className="text-xs">{hoveredSlice.count.toLocaleString()} buses</div>
          </div>
        )}
        
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
          <div className="text-2xl font-bold text-gray-900">{totalCount.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total Buses</div>
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-wrap justify-center gap-3">
          {chartData.map((data, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: data.color }}
              ></div>
              <span className="text-xs text-gray-600">{data.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Incident Statistics Bar Chart Component
  const IncidentStatisticsChart = () => {
    // Define all possible incident types with their colors (matching mobile app)
    const allIncidentTypes = {
      'Accident': { color: '#EF4444', label: 'Accident' },
      'Medical': { color: '#059669', label: 'Medical' },
      'Fire': { color: '#DC2626', label: 'Fire' },
      'Breakdown': { color: '#F59E0B', label: 'Breakdown' },
      'Theft': { color: '#9333EA', label: 'Theft' },
      'Hazard': { color: '#D97706', label: 'Hazard' }
    };

    // Create chart data ensuring all incident types are included
    const chartData = Object.entries(allIncidentTypes).map(([type, config]) => ({
      label: config.label,
      count: incidentStats[type] || 0, // Use 0 if type doesn't exist in data
      color: config.color,
      originalType: type
    })).sort((a, b) => b.count - a.count); // Sort by count descending

    const maxCount = Math.max(...chartData.map(item => item.count), 1);
    const [hoveredBar, setHoveredBar] = useState<{label: string, count: number, x: number, y: number} | null>(null);

    return (
      <div className="w-full h-64 relative">
        <div className="flex items-end justify-between h-48 px-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1 max-w-[120px] min-w-[80px]">
              <div 
                className="relative cursor-pointer transition-all duration-200 hover:opacity-80 rounded-t w-full"
                style={{
                  height: `${item.count > 0 ? (item.count / maxCount) * 160 : 8}px`,
                  backgroundColor: item.count > 0 ? item.color : '#E5E7EB',
                  minHeight: '8px',
                  border: item.count === 0 ? '1px dashed #9CA3AF' : 'none'
                }}
                onMouseEnter={(e) => {
                  setHoveredBar({
                    label: item.label,
                    count: item.count,
                    x: e.clientX,
                    y: e.clientY
                  });
                }}
                onMouseMove={(e) => {
                  setHoveredBar(prev => prev ? {
                    ...prev,
                    x: e.clientX,
                    y: e.clientY
                  } : null);
                }}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Count at top of each column */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-sm font-semibold text-gray-700">
                  {item.count}
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-700 text-center font-medium">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {hoveredBar && (
          <div 
            className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none"
            style={{
              left: hoveredBar.x + 10,
              top: hoveredBar.y - 40,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="text-sm font-medium">{hoveredBar.label}</div>
            <div className="text-xs">{hoveredBar.count} incidents</div>
          </div>
        )}

        {/* Legend for zero vs non-zero values */}
        <div className="absolute bottom-2 right-2 flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
            <span>Has incidents</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-200 border border-dashed border-gray-400 rounded mr-1"></div>
            <span>No incidents</span>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to format inspection data for display
  const formatInspectionsForDisplay = () => {
    // Get the 3 most recent upcoming inspections
    const recentUpcoming = upcomingInspections
      .slice(0, 3)
      .map(inspection => ({
        type: inspection.inspection_type,
        date: new Date(inspection.date).toLocaleDateString() + ' • ' + inspection.time,
        location: inspection.depot_name || 'Unknown Depot',
        buses: 'N/A', // This would need to be added to the API if bus count per inspection is needed
        priority: inspection.status === 'Pending' ? 'medium' : 'low'
      }));

    // If we have fewer than 3, pad with empty states or show "No upcoming inspections"
    return recentUpcoming.length > 0 ? recentUpcoming : [
      {
        type: 'No upcoming inspections',
        date: 'Schedule new inspections',
        location: 'Use the Quick Actions panel',
        buses: '',
        priority: 'low'
      }
    ];
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'operational': return 'bg-green-100 text-green-800';
      case 'minor': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'awaiting parts': return 'bg-purple-100 text-purple-800';
      case 'in progress': return 'bg-yellow-100 text-yellow-800';
      case 'diagnosing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <FaExclamationTriangle className="text-red-400 mt-1" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Top Metrics Cards - Updated */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Depots Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <FaMapMarkerAlt className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-gray-600 text-sm">Total Depots</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{totalDepots}</div>
                <div className="text-blue-500 text-sm mt-1">SLTB Depots</div>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/regional-technical-officer/Inspectionschedular')}
            className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <FaCheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-gray-600 text-sm">Completed Inspections</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{inspectionCounts.completed}</div>
                <div className="text-green-500 text-sm mt-1">Last 30 days</div>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/regional-technical-officer/Inspectionschedular')}
            className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <FaCalendarAlt className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-gray-600 text-sm">Pending Inspections</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{inspectionCounts.pending}</div>
                <div className="text-blue-500 text-sm mt-1">Upcoming</div>
              </div>
            </div>
          </div>

          {/* Active Issues Card */}
          <div 
            onClick={() => navigate('/regional-technical-officer/Rtoissuetracker')}
            className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <FaExclamationTriangle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-gray-600 text-sm">Active Issues</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{activeIssuesCount}</div>
                <div className="text-red-500 text-sm mt-1">Open reports</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Region-wide Service Monitor */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Region-wide Service Monitor</h2>
              </div>
              
              {/* Pie Chart showing bus status distribution across all regions */}
              <RegionServiceMonitorChart />
            </div>

           
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => navigate('/regional-technical-officer/Rtoissuetracker')}
                  className="p-3 bg-blue-50 rounded-lg flex flex-col items-center justify-center hover:bg-blue-100 transition-colors"
                >
                  <FaWrench className="w-6 h-6 text-blue-600 mb-2" />
                  <span className="text-sm text-gray-800">Log New Issue</span>
                </button>
                <button 
                  onClick={() => navigate('/regional-technical-officer/Inspectionschedular')}
                  className="p-3 bg-green-50 rounded-lg flex flex-col items-center justify-center hover:bg-green-100 transition-colors"
                >
                  <FaCalendarAlt className="w-6 h-6 text-green-600 mb-2" />
                  <span className="text-sm text-gray-800">Schedule Inspection</span>
                </button>
                <button 
                  onClick={() => navigate('/regional-technical-officer/Regionservicemonitor')}
                  className="p-3 bg-purple-50 rounded-lg flex flex-col items-center justify-center hover:bg-purple-100 transition-colors"
                >
                  <FaClipboardList className="w-6 h-6 text-purple-600 mb-2" />
                  <span className="text-sm text-gray-800">Service monitoring</span>
                </button>
                <button 
                  onClick={() => navigate('/regional-technical-officer/Regioncommunityhub')}
                  className="p-3 bg-orange-50 rounded-lg flex flex-col items-center justify-center hover:bg-orange-100 transition-colors"
                >
                  <HiUsers className="w-6 h-6 text-orange-600 mb-2" />
                  <span className="text-sm text-gray-800">Contact</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Incident Statistics - Full Width */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Incident Statistics</h2>
              <p className="text-sm text-gray-600">Region-wide incident reports by type</p>
            </div>
            <IncidentStatisticsChart />
          </div>
        </div>

        {/* Inspection Scheduler - Full Width Below */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Inspections Overview</h2>
                <p className="text-sm text-gray-600">Recent pending inspections from your scheduled list</p>
              </div>
              <button 
                onClick={() => navigate('/regional-technical-officer/Inspectionschedular')}
                className="text-blue-600 text-sm hover:text-blue-800"
              >
                View All Inspections
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formatInspectionsForDisplay().map((inspection, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                        inspection.priority === 'high' ? 'bg-red-100' :
                        inspection.priority === 'medium' ? 'bg-orange-100' : 'bg-blue-100'
                      }`}>
                        <FaClipboardList className={
                          inspection.priority === 'high' ? 'text-red-600' :
                          inspection.priority === 'medium' ? 'text-orange-600' : 'text-blue-600'
                        } />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{inspection.type}</h3>
                        <p className="text-sm text-gray-600">{inspection.date}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(inspection.priority)}`}>
                      {inspection.priority}
                    </span>
                  </div>
                  <div className="pl-11">
                    <div className="text-sm text-gray-600 mb-1">
                      <FaMapMarkerAlt className="inline mr-1" /> {inspection.location}
                    </div>
                  
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;