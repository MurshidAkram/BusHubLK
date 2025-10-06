import { useNavigate } from 'react-router-dom';
import { 
  HiCog, 
  HiExclamationCircle, 
  HiTruck, 
  HiCheckCircle,
  HiClock,
  HiEye,
  HiArrowRight,
  HiFire,
  HiHeart
} from 'react-icons/hi';
import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../context/AppContext';
import axios, { AxiosError } from 'axios';

interface PendingReport {
  report_id: string;
  registration_number: string;
  condition_status: string;
  description: string;
  report_time: string;
  driver_first_name: string;
  driver_last_name: string;
}

interface EmergencyReport {
  id: string;
  depotid: string;
  busNumber: string;
  type: 'fire' | 'medical' | 'mechanical';
  reason: string;
  status: 'pending' | 'resolved' | 'in-progress';
  region: string;
  depot: string;
}

interface Bus {
  bus_id: string;
  registration_number: string;
  depot_id: string;
  class: string;
  manufacturer: string;
  model: string;
  year: number;
  mileage: string;
  status: 'Active' | 'In Service' | 'Maintenance' | 'Out of Service';
  depot_name?: string;
  region_name?: string;
}

interface DepotInfo {
  depot_id: string;
  depot_name: string;
  region_id: string;
  region_name: string;
}

interface BusResponse {
  success: boolean;
  message: string;
  buses: Bus[];
  depot: DepotInfo;
}

const DepotEngineerDashboard = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBuses: 0,
    activeBuses: 0,
    underMaintenance: 0,
    EmergencyReports: 2,
    criticalIssues: 2,
    busesOverdueService: 4,
    busesOperational: 18,
    busesInGarage: 6,
    complianceRate: 92
  });
  const [depotInfo, setDepotInfo] = useState<DepotInfo | null>(null);
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [emergencyReports, setEmergencyReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const token = context?.token;

  // Debug authentication
  useEffect(() => {
    console.log('🔐 Authentication Debug:');
    console.log('- Token exists:', !!token);
    console.log('- User role:', context?.user?.role);
    console.log('- User object:', context?.user);
    console.log('- Depot ID:', context?.user?.depot_id);
  }, [token, context?.user]);

  // Remove the hardcoded emergency reports array - we'll fetch from API

  const getEmergencyColor = (type: EmergencyReport['type']) => {
    switch (type) {
      case 'fire': return 'bg-red-50 border-red-200';
      case 'medical': return 'bg-blue-50 border-blue-200';
      case 'mechanical': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getEmergencyIcon = (type: EmergencyReport['type']) => {
    switch (type) {
      case 'fire': return <HiFire className="w-5 h-5 text-red-600" />;
      case 'medical': return <HiHeart className="w-5 h-5 text-blue-600" />;
      case 'mechanical': return <HiCog className="w-5 h-5 text-orange-600" />;
      default: return <HiExclamationCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Pending Review': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchBuses = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = `http://localhost:5000/api/depot-engineer/buses`;
      const response = await axios.get<BusResponse>(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        const buses = response.data.buses;
        setDepotInfo(response.data.depot);
        setStats(prevStats => ({
          ...prevStats,
          totalBuses: buses.length,
          activeBuses: buses.filter(bus => bus.status === 'Active').length,
          underMaintenance: buses.filter(bus => bus.status === 'Maintenance').length
        }));
      } else {
        setError('Failed to fetch buses.');
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Error fetching buses:', axiosError);
      if (axiosError.response && axiosError.response.data) {
        setError((axiosError.response.data as any).error || 'Failed to fetch buses.');
      } else {
        setError('Failed to fetch buses. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingReports = async () => {
    try {
      // Use the correct API endpoint for all bus condition reports
      const apiUrl = `http://localhost:5000/api/bus-condition-reports`;
      console.log('🔍 Fetching condition reports from:', apiUrl);
      console.log('🔑 Using token:', token ? 'Token available' : 'No token');
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('📊 Condition reports response:', response.data);

      if (response.data.success) {
        const allReports = response.data.data || [];
        
        // Filter for reports that are unreviewed (review_status = 'pending')
        const pendingReports = allReports.filter((report: any) => {
          return report.review_status === 'pending' || !report.review_status; // Include reports without review_status as they default to pending
        });
        
        // Transform to match expected interface
        const transformedReports = pendingReports.map((report: any) => ({
          report_id: report.report_id?.toString() || '',
          registration_number: report.registration_number || 'Unknown',
          condition_status: report.condition_status || '',
          description: report.description || 'No description provided',
          driver_first_name: report.driver_first_name || '',
          driver_last_name: report.driver_last_name || '',
          report_time: report.report_time || report.created_at || new Date().toISOString()
        }));
        
        setPendingReports(transformedReports);
        
        // Update stats with pending reports count
        setStats(prevStats => ({
          ...prevStats,
          criticalIssues: transformedReports.filter((r: PendingReport) => 
            r.condition_status?.toLowerCase().includes('critical') || 
            r.condition_status?.toLowerCase().includes('major') ||
            r.condition_status?.toLowerCase().includes('out of service')
          ).length,
        }));
        console.log('✅ Unreviewed condition reports loaded successfully:', transformedReports.length);
      } else {
        console.error('❌ Failed to fetch pending reports:', response.data.message);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('❌ Error fetching pending reports:', axiosError);
      if (axiosError.response) {
        console.error('Response status:', axiosError.response.status);
        console.error('Response data:', axiosError.response.data);
        console.error('Response headers:', axiosError.response.headers);
      }
      
      // Try alternative endpoint if the first one fails
      if (axiosError.response?.status === 403 || axiosError.response?.status === 404) {
        console.log('🔄 Trying alternative endpoint...');
        try {
          const altApiUrl = `http://localhost:5000/api/depot-engineer/condition-reports/pending`;
          const altResponse = await axios.get(altApiUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });
          
          if (altResponse.data.success) {
            const reports = altResponse.data.data || altResponse.data.reports || [];
            setPendingReports(reports);
            setStats(prevStats => ({
              ...prevStats,
              criticalIssues: reports.filter((r: PendingReport) => 
                r.condition_status === 'Major Issues' || r.condition_status === 'Out of Service'
              ).length,
            }));
            console.log('✅ Pending reports loaded from alternative endpoint:', reports.length);
          }
        } catch (altErr) {
          console.error('❌ Alternative endpoint also failed:', altErr);
        }
      }
    }
  };

  const fetchEmergencyReports = async () => {
    try {
      // Use the depot emergency endpoint to get all reports, then filter for pending
      const apiUrl = `http://localhost:5000/api/depot/emergency`;
      console.log('🔍 Fetching emergency reports from:', apiUrl);
      console.log('🔑 Using token:', token ? 'Token available' : 'No token');
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Emergency reports response:', response.data);

      if (response.data.success) {
        const allReports = response.data.data || [];
        
        // Log detailed information about the reports structure
        console.log('📋 All emergency reports count:', allReports.length);
        if (allReports.length > 0) {
          console.log('📄 Sample report structure:', allReports[0]);
          console.log('📋 All available status values:', [...new Set(allReports.map((r: any) => r.status))]);
          console.log('📋 All reports with their status:', allReports.map((r: any) => ({ id: r.id, status: r.status, incident_type: r.incident_type })));
        }
        
        // Filter for pending status reports only - only show reports with "Pending" status
        const pendingReports = allReports.filter((report: any) => {
          // Only include reports with exactly "Pending" status
          const status = report.status?.toString();
          return status === 'Pending';
        });
        
        console.log('🔍 Filtered pending reports:', pendingReports.length, pendingReports);
        
        const mappedReports: EmergencyReport[] = pendingReports.map((report: any) => ({
          id: report.id.toString(),
          depotid: report.depot_id?.toString() || '',
          busNumber: report.vehicle_registration || report.registration_number || `Bus-${report.bus_id}`,
          type: report.incident_type || 'mechanical', // This comes from emergency_reports.incident_type
          reason: report.description || 'No description provided', // This comes from emergency_reports.description
          status: 'pending', // We're filtering for pending status only
          region: report.region_name || 'Unknown Region',
          depot: report.depot_name || 'Unknown Depot'
        }));
        
        setEmergencyReports(mappedReports);
        
        // Update stats with real count
        setStats(prevStats => ({
          ...prevStats,
          EmergencyReports: mappedReports.length
        }));
        
        console.log('✅ Emergency reports fetched successfully:', mappedReports.length, 'pending reports out of', allReports.length, 'total');
      } else {
        console.error('❌ Failed to fetch emergency reports:', response.data.message);
        setEmergencyReports([]); // Set empty array if fetch fails
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('❌ Error fetching emergency reports:', axiosError);
      if (axiosError.response) {
        console.error('Response data:', axiosError.response.data);
        console.error('Response status:', axiosError.response.status);
      }
      
      // Try alternative emergency endpoint if the first one fails
      if (axiosError.response?.status === 403 || axiosError.response?.status === 404) {
        console.log('🔄 Trying alternative emergency endpoint...');
        try {
          const altApiUrl = `http://localhost:5000/api/emergency`;
          const altResponse = await axios.get(altApiUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (altResponse.data.success) {
            const allReports = altResponse.data.data || [];
            const pendingReports = allReports.filter((report: any) => report.status === 'pending');
            
            const mappedReports: EmergencyReport[] = pendingReports.map((report: any) => ({
              id: report.id.toString(),
              depotid: report.depot_id?.toString() || '',
              busNumber: report.vehicle_registration || report.registration_number || `Bus-${report.bus_id}`,
              type: report.incident_type || 'mechanical',
              reason: report.description || 'No description provided',
              status: 'pending',
              region: report.region_name || 'Unknown Region',
              depot: report.depot_name || 'Unknown Depot'
            }));
            
            setEmergencyReports(mappedReports);
            setStats(prevStats => ({
              ...prevStats,
              EmergencyReports: mappedReports.length
            }));
            
            console.log('✅ Emergency reports loaded from alternative endpoint:', mappedReports.length);
          }
        } catch (altErr) {
          console.error('❌ Alternative emergency endpoint also failed:', altErr);
          setEmergencyReports([]);
        }
      } else {
        setEmergencyReports([]); // Set empty array on error
      }
    }
  };

  // Helper function to determine priority based on condition status
  const getPriorityFromStatus = (status: string) => {
    switch (status) {
      case 'Out of Service':
      case 'Major Issues':
        return { level: 'High', color: 'bg-red-100 text-red-800' };
      case 'Minor Issues':
        return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
      case 'Good':
        return { level: 'Low', color: 'bg-green-100 text-green-800' };
      default:
        return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  useEffect(() => {
    if (token && context?.user?.role === 'depot_engineer') {
      fetchBuses();
      fetchPendingReports();
      fetchEmergencyReports();
    }
  }, [token, context?.user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center py-8 text-red-600 max-w-md">
          <HiExclamationCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-xl font-medium mb-2">Error Loading Dashboard</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          {error.includes('403') && (
            <p className="text-sm text-yellow-600 mb-4">
              ⚠️ This might be an authentication issue. Please try logging out and logging back in.
            </p>
          )}
          <button 
            onClick={() => {
              setError(null);
              fetchBuses();
              fetchPendingReports();
              fetchEmergencyReports();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          

          {/* Depot Info Card */}
          {depotInfo && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 shadow-lg w-full md:w-auto">
              <div className="flex items-center gap-4">
                
                <div>
                <div className="flex items-center font-bold flex-wrap gap-1 mt-1">
                    <span className="text-white/90 text-xl">{depotInfo.region_name} Region</span>
                    
                    {/* <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white">
                      DEPOT ID: {depotInfo.depot_id}
                    </span> */}
                  </div>
                  <h2 className="text-lg md:text-lg font text-white">{depotInfo.depot_name} Depot</h2>
                 
                </div>
              </div>
            </div>
          )}
          
          {/* Action Button */}
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              className="flex items-center gap-2 bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors w-full md:w-auto justify-center" 
              onClick={() => navigate('/depot-engineer/Busavailability')}
            >
              <HiCog className="w-4 h-4" />
              Status Updates
            </button>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Buses Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Buses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBuses}</p>
                
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <HiTruck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Buses Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Active Buses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeBuses}</p>
                
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <HiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Maintenance Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Under Maintenance</p>
                <p className="text-2xl font-bold text-gray-900">{stats.underMaintenance}</p>
                
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <HiCog className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Emergency Reports Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Emergency Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.EmergencyReports}</p>
                <p className="text-xs text-gray-500 mt-1">Active alerts</p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <HiClock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Pending Approvals Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-700">Pending Bus Condition Review</h3>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {pendingReports.length} awaiting action
                </span>
                <button
                  onClick={fetchPendingReports}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="Refresh pending reports"
                >
                  <HiCog className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingReports.map((report) => {
                    const priority = getPriorityFromStatus(report.condition_status);
                    return (
                      <tr key={report.report_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {report.registration_number}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs ${priority.color}`}>
                            {priority.level}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {report.condition_status}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button 
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center gap-1" 
                            onClick={() => navigate('/depot-engineer/Autoforwardbusstatus')}
                          >
                            Review <HiEye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Emergency Reports Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-red-700">Emergency Reports</h3>
              <div className="flex items-center gap-2">
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {stats.EmergencyReports} active
                </span>
                <button
                  onClick={fetchEmergencyReports}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="Refresh emergency reports"
                >
                  <HiCog className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-red-500">Loading emergency reports...</p>
                </div>
              ) : emergencyReports.length > 0 ? emergencyReports.map((report) => (
                <div 
                  key={report.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${getEmergencyColor(report.type)} hover:shadow-xs transition-shadow`}
                >
                  <div className="flex items-center gap-3 flex-grow">
                    {getEmergencyIcon(report.type)}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        {/* <span className="font-medium text-gray-900">#{report.id}</span> */}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge('pending')}`}>
                          Pending
                        </span>
                      </div>
                      <div className="text-sm text-red-600 mt-1">
                        <span className="font-medium">Bus:</span> {report.busNumber}
                      </div>
                      <div className="text-sm text-red-600">
                        <span className="font-medium">Type:</span> {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                      </div>
                      {/* <div className="text-sm font-medium mt-1 text-gray-700 truncate">
                        {report.reason}
                      </div> */}
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/depot-engineer/DepotEscalateissues')}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors flex-shrink-0"
                    aria-label="View details"
                  >
                    <HiArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )) : (
                <div className="text-center py-6 text-gred-500">
                  <HiCheckCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                  <p>No pending emergency reports</p>
                  <p className="text-xs mt-1">Check browser console for debugging info</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepotEngineerDashboard;