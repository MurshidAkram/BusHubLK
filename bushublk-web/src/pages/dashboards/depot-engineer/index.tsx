import { useNavigate } from 'react-router-dom';
import { 
  HiCog, 
  HiExclamationCircle, 
  HiTruck, 
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
  id: number;
  incident_type: string;
  status: 'New' | 'In Progress' | 'Pending' | 'Resolved' | 'Escalated to Depot Manager';
  driver_name: string;
  vehicle_registration: string;
  created_at: string;
  description?: string;
  latitude?: number;
  longitude?: number;
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

interface AppContextType {
  user: { 
    role: string; 
    userId: string; 
    depot_id?: string; 
    region_id?: string;
    name?: string;
    email?: string;
  } | null;
  token: string | null;
}

const DepotEngineerDashboard = () => {
  const context = useContext(AppContext) as AppContextType | null;
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBuses: 0,
    pendingSchedules: 0,
    overdueSchedules: 0,
    EmergencyReports: 0,
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

  const fetchEmergencyReports = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/depot/emergency', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch emergency reports');
      }
      const data = await response.json();
      
      if (data.success) {
        // Filter for only pending status reports
        const pendingReports = (data.data || []).filter((report: EmergencyReport) => 
          report.status === 'Pending'
        );
        setEmergencyReports(pendingReports);
        
        // Update stats with emergency reports count
        setStats(prevStats => ({
          ...prevStats,
          EmergencyReports: pendingReports.length
        }));
      }
    } catch (error) {
      console.error('Error fetching emergency reports:', error);
    }
  };

  const getEmergencyColor = (incident_type: EmergencyReport['incident_type']) => {
    switch (incident_type) {
      case 'Accident': return 'bg-red-50 border-red-200';
      case 'Breakdown': return 'bg-yellow-50 border-yellow-200';
      case 'Medical Emergency': return 'bg-blue-50 border-blue-200';
      case 'Security Issue': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getEmergencyIcon = (incident_type: EmergencyReport['incident_type']) => {
    switch (incident_type) {
      case 'Accident': 
        return <HiFire className="w-5 h-5 text-red-600" />;
      case 'Breakdown': 
        return <HiCog className="w-5 h-5 text-yellow-600" />;
      case 'Medical Emergency': 
        return <HiHeart className="w-5 h-5 text-blue-600" />;
      case 'Security Issue': 
        return <HiExclamationCircle className="w-5 h-5 text-purple-600" />;
      default: 
        return <HiExclamationCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Pending Review': return 'bg-blue-100 text-blue-800';
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Escalated to Depot Manager': return 'bg-red-100 text-red-800';
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
          totalBuses: buses.length
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

  const fetchServiceScheduleStats = async () => {
    try {
      const apiUrl = `http://localhost:5000/api/depot-engineer/service-schedules/stats`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const scheduleStats = response.data.stats;
        setStats(prevStats => ({
          ...prevStats,
          pendingSchedules: parseInt(scheduleStats.pending_count) || 0,
          overdueSchedules: (parseInt(scheduleStats.overdue_count) || 0) + (parseInt(scheduleStats.critical_overdue_count) || 0)
        }));
      } else {
        console.error('Failed to fetch service schedule stats:', response.data.message);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Error fetching service schedule stats:', axiosError);
    }
  };

  const fetchPendingReports = async () => {
    try {
      const apiUrl = `http://localhost:5000/api/depot-engineer/condition-reports/pending`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setPendingReports(response.data.reports);
        // Update stats with pending reports count
        setStats(prevStats => ({
          ...prevStats,
          criticalIssues: response.data.reports.filter((r: PendingReport) => 
            r.condition_status === 'Major Issues' || r.condition_status === 'Out of Service'
          ).length,
        }));
      } else {
        console.error('Failed to fetch pending reports:', response.data.message);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Error fetching pending reports:', axiosError);
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
      fetchServiceScheduleStats();
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
        <div className="text-center py-8 text-red-600">
          <HiExclamationCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-xl font-medium">Error: {error}</p>
          <button 
            onClick={fetchBuses}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
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

          {/* Pending Schedules Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Pending Schedules</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingSchedules}</p>
                
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <HiClock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Overdue Schedules Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Overdue Schedules</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdueSchedules}</p>
                
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <HiExclamationCircle className="w-6 h-6 text-red-600" />
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
          <div className="bg-white rounded-xl shadow-sm border border-red-100 flex-1">
            <div className="p-4 border-b border-red-200 flex justify-between items-center bg-red-50">
              <h3 className="text-lg font-semibold text-red-700">Emergency Reports</h3>
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                {stats.EmergencyReports} active
              </span>
            </div>
            <div className="p-4 space-y-3">
              {emergencyReports.map((report) => (
                <div 
                  key={report.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border-2 border-red-200 bg-red-50 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center gap-3 flex-grow">
                    {getEmergencyIcon(report.incident_type)}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-red-800">{report.incident_type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Driver:</span> {report.driver_name}
                      </div>
                      <div className="text-sm font-medium mt-1 text-gray-700 truncate">
                        {report.description}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/depot-engineer/DepotEscalateissues')}
                    className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors flex-shrink-0"
                    aria-label="View details"
                  >
                    <HiArrowRight className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepotEngineerDashboard;