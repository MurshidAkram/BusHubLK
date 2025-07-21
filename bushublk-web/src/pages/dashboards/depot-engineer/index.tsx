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

interface BusResponse {
  success: boolean;
  message: string;
  buses: Bus[];
}

interface AppContextType {
  user: { role: string; userId: string; depot_id?: string; region_id?: string; } | null;
  token: string | null;
}

const DepotEngineerDashboard = () => {
  const context = useContext<AppContextType | null>(AppContext);
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const token = context?.token;

  const pendingApprovals = [
    { id: 17, reg_num: 'NC_1234', priority: 'High', status: 'Major issue' },
    { id: 23, reg_num: 'NP_8901', priority: 'Medium', status: 'Minor issue' },
    { id: 21, reg_num: 'NY_9871', priority: 'Low', status: 'Good' }
  ];

  const emergencyReports: EmergencyReport[] = [
    { 
      id: '17',
      depotid: '2',
      busNumber: 'NC_1234',
      type: 'fire',
      reason: 'Engine compartment fire',
      status: 'pending',
      region: 'Central',
      depot: 'Kandy Depot'
    },
    { 
      id: '23',
      depotid: '1',
      busNumber: 'NY-3456',
      type: 'medical',
      reason: 'Passenger medical emergency',
      status: 'pending',
      region: 'Western',
      depot: 'Colombo Depot'
    }
  ];

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

  useEffect(() => {
    if (token && context?.user?.role === 'depot_engineer') {
      fetchBuses();
    }
  }, [token, context?.user?.role]);

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Depot Engineer Dashboard</h1>
            <p className="text-gray-700">Manage bus fleet status and maintenance</p>
          </div>
          <div className="flex gap-3">
            <button 
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors" 
              onClick={() => navigate('/depot-engineer/Busavailability')}
            >
              <HiCog className="w-4 h-4" />
              Bus Status
            </button>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Buses</p>
                <p className="text-4xl font-bold text-gray-900">{stats.totalBuses}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <HiTruck className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Active Buses</p>
                <p className="text-4xl font-bold text-gray-900">{stats.activeBuses}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <HiCheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Under Maintenance</p>
                <p className="text-4xl font-bold text-gray-900">{stats.underMaintenance}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <HiCog className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Emergency Reports</p>
                <p className="text-4xl font-bold text-gray-900">{stats.EmergencyReports}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <HiClock className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals Table */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-500">Pending Bus Condition Review</h3>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{pendingApprovals.length} awaiting action</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Id</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingApprovals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{approval.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{approval.priority}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{approval.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium" 
                        onClick={() => navigate('/depot-engineer/Autoforwardbusstatus')}
                      >
                        Review <HiEye className="inline ml-1 w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Emergency Reports Section */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-500">Emergency Reports</h3>
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">{stats.EmergencyReports} active</span>
          </div>
          <div className="p-4 space-y-3">
            {emergencyReports.map((report) => (
              <div key={report.id} className={`flex items-center justify-between p-3 rounded-lg border ${getEmergencyColor(report.type)}`}>
                <div className="flex items-center gap-3 flex-grow">
                  {getEmergencyIcon(report.type)}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{report.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(report.status)}`}>
                        {report.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">BusNumber: {report.busNumber}</div>
                    <div className="text-sm text-gray-600">Region: {report.region}</div>
                    <div className="text-sm text-gray-600">Depot: {report.depot}</div>
                    <div className="text-sm font-medium mt-1">Depot ID: {report.depotid}</div>
                    <div className="text-sm font-medium mt-1">{report.reason}</div>
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepotEngineerDashboard;