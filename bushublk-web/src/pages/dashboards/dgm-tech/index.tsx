import { useState, useEffect, useContext } from 'react';
import { 
  FaBus, FaCheckCircle, FaTools, FaExclamationTriangle, 
  FaFlag, FaBullhorn, FaComments, FaEnvelopeOpenText, FaClock
} from 'react-icons/fa';
import { AppContext } from '../../../context/AppContext';

interface DashboardSummary {
  total_regions: number;
  total_depots: number;
  total_buses: number;
  buses_in_maintenance: number;
  buses_out_of_service: number;
  buses_active: number;
  maintenance_percentage: number;
  total_accidents: number;
  total_breakdowns: number;
  total_incidents: number;
}

interface ChannelParticipant {
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface CommunicationChannel {
  channel_id: string;
  channel_type: string;
  channel_name?: string;
  participants?: ChannelParticipant[];
  last_message?: {
    message_text: string;
    sender_name: string;
    created_at: string;
  };
  unread_count: number;
}

interface AppContextType {
  token?: string | null;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL ).replace(/\/$/, '');
const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`;

const MaintenanceDashboard = () => {
  const appContext = useContext(AppContext) as AppContextType | null;
  const token = appContext?.token ?? null;
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [serviceHistoryCount, setServiceHistoryCount] = useState<number>(0);
  const [partsUsageCount, setPartsUsageCount] = useState<number>(0);
  const [inspectionCount, setInspectionCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [communityChannels, setCommunityChannels] = useState<CommunicationChannel[]>([]);
  const [communityLoading, setCommunityLoading] = useState<boolean>(false);
  const [communityError, setCommunityError] = useState<string | null>(null);

  // Fetch dashboard summary data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
  const response = await fetch(buildApiUrl('/api/dgm-technical/dashboard-summary'));
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        if (result.success) {
          setDashboardData(result.data);
          setError(null);
        } else {
          throw new Error(result.message || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    const fetchServiceHistoryCount = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: '1',
          limit: '1',
          regionId: 'all',
          depotId: 'all',
          status: 'all',
          serviceType: '',
          startDate: '',
          endDate: ''
        });

  const response = await fetch(buildApiUrl(`/api/dgm-technical/service-history?${queryParams}`));
        const result = await response.json();
        
        if (result.success) {
          setServiceHistoryCount(result.data.pagination.totalRecords);
        }
      } catch (err) {
        console.error('Error fetching service history count:', err);
        setServiceHistoryCount(0);
      }
    };

    const fetchPartsUsageCount = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: '1',
          limit: '1',
          regionId: 'all',
          depotId: 'all',
          search: ''
        });

  const response = await fetch(buildApiUrl(`/api/dgm-technical/parts-history?${queryParams}`));
        const result = await response.json();
        
        if (result.success) {
          setPartsUsageCount(result.pagination.totalRecords);
        }
      } catch (err) {
        console.error('Error fetching parts usage count:', err);
        setPartsUsageCount(0);
      }
    };

    const fetchInspectionCount = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: '1',
          limit: '1',
          regionId: 'all',
          depotId: 'all',
          status: 'all'
        });

  const response = await fetch(buildApiUrl(`/api/dgm-technical/inspection-history?${queryParams}`));
        const result = await response.json();
        
        if (result.success) {
          setInspectionCount(result.pagination.totalRecords);
        }
      } catch (err) {
        console.error('Error fetching inspection count:', err);
        setInspectionCount(0);
      }
    };

    fetchDashboardData();
    fetchServiceHistoryCount();
    fetchPartsUsageCount();
    fetchInspectionCount();
  }, []);

  useEffect(() => {
    const fetchCommunityChannels = async () => {
      if (!token) {
        setCommunityLoading(false);
        setCommunityError(null);
        return;
      }

      try {
        setCommunityLoading(true);
  const response = await fetch(buildApiUrl('/api/communication/channels'), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setCommunityChannels(Array.isArray(data.channels) ? data.channels : []);
          setCommunityError(null);
        } else {
          throw new Error(data.message || 'Failed to fetch community data');
        }
      } catch (err) {
        console.error('Error fetching community hub data:', err);
        setCommunityChannels([]);
        setCommunityError('Community hub alerts are temporarily unavailable.');
      } finally {
        setCommunityLoading(false);
      }
    };

    fetchCommunityChannels();
  }, [token]);

  // Chart for Service, Parts Usage & Inspections
  const ServicePartsInspectionChart = () => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B'];
    const totalServiceHistory = serviceHistoryCount;
    const totalPartsUsage = partsUsageCount;
    const totalInspections = inspectionCount;
    
    const chartData = [
      { label: 'Service History', count: totalServiceHistory, color: colors[0] },
      { label: 'Parts Usage', count: totalPartsUsage, color: colors[1] },
      { label: 'Inspections', count: totalInspections, color: colors[2] }
    ];
    
    const totalCount = totalServiceHistory + totalPartsUsage + totalInspections;
    const [hoveredSlice, setHoveredSlice] = useState<{label: string, count: number, x: number, y: number} | null>(null);
    
    let currentAngle = 0;
    const centerX = 150;
    const centerY = 150;
    const radius = 100;

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
            style={{ cursor: 'pointer', filter: hoveredSlice?.label === data.label ? 'brightness(1.1)' : 'none' }}
            onMouseEnter={(e) => setHoveredSlice({ label: data.label, count: data.count, x: e.clientX, y: e.clientY })}
            onMouseMove={(e) => setHoveredSlice(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
            onMouseLeave={() => setHoveredSlice(null)}
          />
        </g>
      );
    };

    return (
      <div className="relative flex justify-center items-center h-80">
        <svg width="300" height="300" viewBox="0 0 300 300">
          {chartData.map((data, index) => createSlice(data, index))}
        </svg>
        {hoveredSlice && (
          <div 
            className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none"
            style={{ left: hoveredSlice.x + 10, top: hoveredSlice.y - 40, transform: 'translateX(-50%)' }}
          >
            <div className="text-sm font-medium">{hoveredSlice.label}</div>
            <div className="text-xs">{hoveredSlice.count.toLocaleString()} total</div>
          </div>
        )}
        <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
          <div className="text-2xl font-bold text-gray-900">{totalCount.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total Operations</div>
        </div>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
          <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div><span className="text-xs text-gray-600">Service History</span></div>
          <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div><span className="text-xs text-gray-600">Parts Usage</span></div>
          <div className="flex items-center"><div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div><span className="text-xs text-gray-600">Inspections</span></div>
        </div>
      </div>
    );
  };

  // Loading state
  const getChannelDisplayName = (channel: CommunicationChannel): string => {
    if (channel.channel_name) {
      return channel.channel_name;
    }

    const participant = channel.participants?.[0];
    if (participant) {
      return `${participant.first_name} ${participant.last_name}`.trim();
    }

    return 'Direct Conversation';
  };

  const getChannelRole = (channel: CommunicationChannel): string => {
    const participant = channel.participants?.[0];
    return participant?.role || '';
  };

  const formatRoleName = (role: string): string => (
    role
      ?.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Team Member'
  );

  const formatTimeAgo = (dateString?: string): string => {
    if (!dateString) {
      return 'No recent updates';
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'No recent updates';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const directChannels = communityChannels.filter(channel => channel.channel_type === 'direct');
  const announcementChannels = communityChannels.filter(channel => channel.channel_type === 'announcement');
  const unreadCount = communityChannels.reduce((total, channel) => total + (channel.unread_count || 0), 0);
  const topUnreadChannels = directChannels
    .filter(channel => channel.unread_count > 0)
    .sort((a, b) => b.unread_count - a.unread_count)
    .slice(0, 3);

  const recentAnnouncements = announcementChannels
    .filter(channel => channel.last_message?.created_at)
    .sort((a, b) => {
      const aDate = new Date(a.last_message?.created_at || '').getTime();
      const bDate = new Date(b.last_message?.created_at || '').getTime();
      return bDate - aDate;
    })
    .slice(0, 2);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard data...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex">
          <FaExclamationTriangle className="text-red-400 mt-1" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Global Fleet Overview</h1>
        <p className="text-gray-600">Technical health summary of the entire SLTB fleet</p>
      </div>

      {/* Fleet Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
        {/* Total Regions */}
        <SummaryCard title="Total Regions" value={dashboardData?.total_regions} icon={<FaFlag className="text-blue-500" />} color="text-blue-600" />
        {/* Total Depots */}
        <SummaryCard title="Total Depots" value={dashboardData?.total_depots} icon={<FaBus className="text-purple-500" />} color="text-purple-600" />
        {/* Total Buses */}
        <SummaryCard title="Total Buses" value={dashboardData?.total_buses} icon={<FaBus className="text-gray-500" />} color="text-gray-600" />
        {/* In Service */}
        {/* <SummaryCard title="In Service" value={dashboardData?.buses_active} icon={<FaCheckCircle className="text-green-500" />} color="text-green-600" /> */}
        {/* Under Maintenance */}
        <SummaryCard title="Under Maintenance" value={dashboardData?.buses_in_maintenance} icon={<FaTools className="text-yellow-500" />} color="text-yellow-600" subtitle="Not available for service" />
        {/* Out of Service */}
        <SummaryCard title="Out of Service" value={dashboardData?.buses_out_of_service} icon={<FaExclamationTriangle className="text-red-500" />} color="text-red-600" subtitle="Not available for service" />
      </div>

      {/* Incident Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Incidents */}
        <SummaryCard title="Total Incidents" value={dashboardData?.total_incidents} icon={<FaExclamationTriangle className="text-orange-500" />} color="text-orange-600" subtitle="All reported incidents" />
        {/* Accidents */}
        <SummaryCard title="Accidents" value={dashboardData?.total_accidents} icon={<FaExclamationTriangle className="text-red-500" />} color="text-red-600" subtitle="Traffic accidents" />
        {/* Breakdowns */}
        <SummaryCard title="Breakdowns" value={dashboardData?.total_breakdowns} icon={<FaTools className="text-yellow-500" />} color="text-yellow-600" subtitle="Mechanical failures" />
      </div>

      {/* Critical Alerts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Community Hub Overview */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Community Hub Alerts</h3>
            <FaBullhorn className="text-gray-500" />
          </div>
          <div className="p-4 space-y-4">
            {communityLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-gray-500 gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <span>Loading community signals...</span>
              </div>
            ) : (
              <>
                {communityError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-md p-3">
                    {communityError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-md p-3">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                      <FaComments />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Active Conversations</p>
                      <p className="text-lg font-semibold text-gray-800">{directChannels.length.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-md p-3">
                    <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
                      <FaEnvelopeOpenText />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Unread Messages</p>
                      <p className="text-lg font-semibold text-gray-800">{unreadCount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-md p-3">
                    <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                      <FaBullhorn />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Active Broadcasts</p>
                      <p className="text-lg font-semibold text-gray-800">{announcementChannels.length.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Priority Follow-ups</h4>
                  {topUnreadChannels.length > 0 ? (
                    <ul className="space-y-2">
                      {topUnreadChannels.map(channel => (
                        <li key={channel.channel_id} className="flex items-start justify-between bg-gray-50 rounded-md px-3 py-2">
                          <div className="pr-3">
                            <p className="text-sm font-medium text-gray-800">{getChannelDisplayName(channel)}</p>
                            <p className="text-xs text-gray-500">
                              {formatRoleName(getChannelRole(channel))}
                              {channel.last_message?.created_at ? ` • ${formatTimeAgo(channel.last_message.created_at)}` : ''}
                            </p>
                            {channel.last_message?.message_text && (
                              <p className="text-xs text-gray-600 mt-1 truncate max-w-xs">
                                {channel.last_message.message_text}
                              </p>
                            )}
                          </div>
                          <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                            <FaEnvelopeOpenText className="text-blue-500" />
                            {channel.unread_count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 bg-gray-50 rounded-md px-3 py-2">
                      No unread conversations waiting on your response.
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Latest Broadcasts</h4>
                  {recentAnnouncements.length > 0 ? (
                    <ul className="space-y-2">
                      {recentAnnouncements.map(channel => (
                        <li key={channel.channel_id} className="bg-orange-50 rounded-md px-3 py-2 border border-orange-100">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-orange-800">
                                {getChannelDisplayName(channel)}
                              </p>
                              {channel.last_message?.message_text && (
                                <p className="text-xs text-orange-700 mt-1 truncate max-w-xs">
                                  {channel.last_message.message_text}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center text-xs text-orange-600 gap-1">
                              <FaClock />
                              <span>{formatTimeAgo(channel.last_message?.created_at)}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 bg-orange-50 rounded-md px-3 py-2 border border-orange-100">
                      No network announcements have been shared yet.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Operations Overview Chart */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Operations Overview: Service, Parts & Inspections</h3>
            <FaTools className="text-gray-500" />
          </div>
          <div className="p-4">
            <ServicePartsInspectionChart />
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Summary Card component
const SummaryCard = ({ title, value, icon, color, subtitle }: { title: string, value: number | undefined, icon: React.ReactNode, color: string, subtitle?: string }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
      <h3 className="font-semibold text-gray-800">{title}</h3>
      {icon}
    </div>
    <div className="p-4">
      <div className={`text-3xl font-bold ${color} mb-2`}>{value?.toLocaleString() || 0}</div>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  </div>
);

export default MaintenanceDashboard;
