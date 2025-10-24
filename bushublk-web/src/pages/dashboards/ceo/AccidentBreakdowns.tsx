import React, { useEffect, useState, useContext } from "react";
import {
  HiShieldCheck,
  HiExclamationCircle,
  HiRefresh,
  HiChartBar,
  HiTrendingUp,
  HiLocationMarker
} from "react-icons/hi";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { AppContext } from '../../../context/AppContext';

// TypeScript Interfaces
interface IncidentSummary {
  total_incidents: number;
  breakdowns: number;
  accidents: number;
  pending: number;
  resolved: number;
}

interface IncidentTrend {
  month: string;
  incidents: number;
  accidents: number;
  breakdowns: number;
}

interface RegionIncident {
  region: string;
  total_count: number;
  accidents: number;
  breakdowns: number;
}

interface DepotIncident {
  depot: string;
  region: string;
  count: number;
}

interface RecentIncident {
  id: number;
  date: string;
  number: string;
  depot: string;
  region: string;
  type: string;
  status: string;
  description: string;
  driver_name: string;
}

interface Severity {
  severity: string;
  count: number;
}

const SEVERITY_COLORS = {
  'High': '#EF4444',
  'Medium': '#F59E0B',
  'Low': '#10B981'
};

export default function AccidentBreakdownPage() {
  const context = useContext(AppContext);
  const token = context?.token;

  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [trend, setTrend] = useState<IncidentTrend[]>([]);
  const [byRegion, setByRegion] = useState<RegionIncident[]>([]);
  const [byDepot, setByDepot] = useState<DepotIncident[]>([]);
  const [recent, setRecent] = useState<RecentIncident[]>([]);
  const [severity, setSeverity] = useState<Severity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/ceo/incidents', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch incidents`);
      }

      const res = await response.json();

      if (res.success) {
        const data = res.data;
        setSummary(data.summary);
        setTrend(data.trend);
        setByRegion(data.byRegion);
        setByDepot(data.byDepot || []);
        setRecent(data.recent);
        setSeverity(data.severity || []);
      } else {
        setError(res.error || 'Failed to load incidents data');
      }
    } catch (err: any) {
      console.error('Error fetching incident data:', err);
      setError(err.message || 'Error fetching incident data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchIncidents();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <HiRefresh className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading incident data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center max-w-md">
          <HiExclamationCircle className="mx-auto text-6xl text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            onClick={fetchIncidents}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Accidents & Breakdowns</h2>
          <p className="text-gray-600 mt-1">Safety incidents and fleet maintenance overview</p>
        </div>
        <div className="flex items-center space-x-3 text-gray-600">
          <HiShieldCheck className="h-8 w-8" />
          <span className="text-lg font-medium">Last 6 Months</span>
        </div>
      </div>

      {/* KPI Summary */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <KpiCard 
            icon={<HiExclamationCircle />}
            label="Total Incidents" 
            value={summary.total_incidents} 
            color="blue"
          />
          <KpiCard 
            icon={<HiChartBar />}
            label="Accidents" 
            value={summary.accidents} 
            color="red"
            subtitle="High Priority"
          />
          <KpiCard 
            icon={<HiTrendingUp />}
            label="Breakdowns" 
            value={summary.breakdowns} 
            color="yellow"
            subtitle="Medium Priority"
          />
          <KpiCard 
            icon={<HiRefresh />}
            label="Pending" 
            value={summary.pending} 
            color="orange"
          />
          <KpiCard 
            icon={<HiShieldCheck />}
            label="Resolved" 
            value={summary.resolved} 
            color="green"
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Trend */}
        <ChartCard title="Incident Trend" icon={<HiTrendingUp />}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
              />
              <YAxis allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="incidents"
                stroke="#3B82F6"
                strokeWidth={3}
                name="Total"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="accidents"
                stroke="#EF4444"
                strokeWidth={2}
                name="Accidents"
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="breakdowns"
                stroke="#F59E0B"
                strokeWidth={2}
                name="Breakdowns"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* By Region */}
        <ChartCard title="Incidents by Region" icon={<HiLocationMarker />}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byRegion}>
              <XAxis 
                dataKey="region" 
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Bar dataKey="accidents" fill="#EF4444" name="Accidents" />
              <Bar dataKey="breakdowns" fill="#F59E0B" name="Breakdowns" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution */}
        <ChartCard title="Severity Distribution" span={1}>
          {severity && severity.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={severity}
                  dataKey="count"
                  nameKey="severity"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => {
                    const total = severity.reduce((sum, item) => sum + item.count, 0);
                    const percent = ((entry.count / total) * 100).toFixed(0);
                    return `${entry.severity}: ${percent}%`;
                  }}
                >
                  {severity.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={SEVERITY_COLORS[entry.severity as keyof typeof SEVERITY_COLORS]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    const total = severity.reduce((sum, item) => sum + item.count, 0);
                    const percent = ((value / total) * 100).toFixed(1);
                    return [`${value} incidents (${percent}%)`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No severity data available
            </div>
          )}
        </ChartCard>

        {/* Top Depots */}
        <ChartCard title="Top Depots by Incidents" span={2}>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Depot</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Incidents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {byDepot.map((depot, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 font-medium">#{index + 1}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{depot.depot}</td>
                    <td className="px-4 py-3 text-gray-600">{depot.region}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {depot.count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {/* Recent Incidents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <HiExclamationCircle className="mr-2 h-5 w-5 text-red-600" />
          Recent Incident Log
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Depot</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recent.length > 0 ? (
                recent.map((inc) => (
                  <tr key={inc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {new Date(inc.date).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">{inc.number}</td>
                    <td className="px-4 py-3 text-gray-700">{inc.depot || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600">{inc.region || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <TypeBadge type={inc.type} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-700">{inc.driver_name || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center text-gray-500 py-8 italic"
                  >
                    No recent incidents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Subcomponents
const KpiCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'red' | 'yellow' | 'green' | 'orange';
  subtitle?: string;
}> = ({ icon, label, value, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex items-center">
        <div className={`text-3xl ${colorClasses[color]} p-3 rounded-lg mr-4`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

const ChartCard: React.FC<{
  title: string;
  children: React.ReactNode;
  span?: number;
  icon?: React.ReactNode;
}> = ({ title, children, span = 1, icon }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${
    span === 2 ? 'lg:col-span-2' : ''
  }`}>
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      {icon && <span className="mr-2 text-blue-600">{icon}</span>}
      {title}
    </h3>
    {children}
  </div>
);

const TypeBadge = ({ type }: { type: string }) => {
  const typeStyles = {
    accident: "bg-red-100 text-red-800",
    breakdown: "bg-yellow-100 text-yellow-800"
  };
  
  const style = typeStyles[type?.toLowerCase() as keyof typeof typeStyles] || "bg-gray-100 text-gray-800";
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
      {type || "Unknown"}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  let style = "bg-gray-100 text-gray-700";
  
  const statusLower = status?.toLowerCase() || '';
  
  if (statusLower === "resolved" || statusLower === "completed") {
    style = "bg-green-100 text-green-700";
  } else if (statusLower.includes("investigation") || statusLower === "in_progress") {
    style = "bg-yellow-100 text-yellow-700";
  } else if (statusLower === "pending") {
    style = "bg-red-100 text-red-700";
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
      {status || "Pending"}
    </span>
  );
};