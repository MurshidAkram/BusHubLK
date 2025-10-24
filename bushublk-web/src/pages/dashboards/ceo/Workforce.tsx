import React, { useEffect, useState, useContext } from 'react';
import {
  HiUsers,
  HiBriefcase,
  HiUserGroup,
  HiTrendingUp,
  HiOfficeBuilding,
  HiExclamationCircle
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { AppContext } from '../../../context/AppContext';

interface Summary {
  total_employees: number;
  depot_managers: number;
  operational_managers: number;
  depot_engineers: number;
  drivers: number;
  conductors: number;
  drivers_conductors: number;
  regional_technical: number;
  regional_operations: number;
}

interface RegionHeadcount {
  region: string;
  managers: number;
  engineers: number;
  op_managers: number;
  drivers: number;
  conductors: number;
  total_count: number;
}

interface DepotHeadcount {
  depot: string;
  region: string;
  total_count: number;
}

interface NewEmployee {
  month: string;
  count: number;
}

interface RoleDistribution {
  role_name: string;
  count: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const WorkforceAnalyticsPage: React.FC = () => {
  const context = useContext(AppContext);
  const token = context?.token;

  const [summary, setSummary] = useState<Summary | null>(null);
  const [headcountByRegion, setHeadcountByRegion] = useState<RegionHeadcount[]>([]);
  const [headcountByDepot, setHeadcountByDepot] = useState<DepotHeadcount[]>([]);
  const [newEmployees, setNewEmployees] = useState<NewEmployee[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<RoleDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkforceData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!token) {
          setError('Authentication required');
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        };

        const [summaryRes, regionRes, depotRes, newRes, roleRes] = await Promise.all([
          fetch('/api/workforce/summary', config),
          fetch('/api/workforce/headcount/region', config),
          fetch('/api/workforce/headcount/depot', config),
          fetch('/api/workforce/new-employees', config),
          fetch('/api/workforce/role-distribution', config),
        ]);

        const summaryData = await summaryRes.json();
        const regionData = await regionRes.json();
        const depotData = await depotRes.json();
        const newData = await newRes.json();
        const roleData = await roleRes.json();

        if (summaryData.success) setSummary(summaryData.data);
        if (regionData.success) setHeadcountByRegion(regionData.data || []);
        if (depotData.success) setHeadcountByDepot(depotData.data || []);
        if (newData.success) setNewEmployees(newData.data || []);
        if (roleData.success) {
          // Filter out roles with 0 count
          const filteredRoles = (roleData.data || []).filter((r: RoleDistribution) => r.count > 0);
          setRoleDistribution(filteredRoles);
        }
      } catch (err: any) {
        console.error('Error loading workforce analytics:', err);
        setError('Failed to load workforce analytics data.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchWorkforceData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading workforce analytics...</p>
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
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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
          <h2 className="text-3xl font-bold text-gray-900">Workforce Analytics</h2>
          <p className="text-gray-600 mt-1">Comprehensive employee insights across SLTB</p>
        </div>
        <div className="flex items-center space-x-3 text-gray-600">
          <HiBriefcase className="h-8 w-8" />
          <span className="text-lg font-medium">{summary?.total_employees || 0} Employees</span>
        </div>
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={<HiUsers />}
          label="Total Employees"
          value={summary?.total_employees || 0}
          color="blue"
        />
        <KPICard
          icon={<HiOfficeBuilding />}
          label="Depot Managers"
          value={summary?.depot_managers || 0}
          color="green"
          subtitle={`${summary?.operational_managers || 0} Op. Managers`}
        />
        <KPICard
          icon={<HiBriefcase />}
          label="Engineers"
          value={summary?.depot_engineers || 0}
          color="yellow"
        />
        <KPICard
          icon={<HiUserGroup />}
          label="Drivers & Conductors"
          value={summary?.drivers_conductors || 0}
          color="purple"
          subtitle={`${summary?.drivers || 0} Drivers, ${summary?.conductors || 0} Conductors`}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Headcount */}
        <ChartCard title="Employee Distribution by Region" icon={<HiUsers />}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={headcountByRegion}>
              <XAxis 
                dataKey="region" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="total_count" fill="#3B82F6" name="Total Employees" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* New Employees Trend */}
        <ChartCard title="New Employee Hiring Trend" icon={<HiTrendingUp />}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={newEmployees}>
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 4 }}
                name="New Hires"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Distribution Pie Chart */}
        <ChartCard title="Role Distribution" span={1}>
          {roleDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleDistribution}
                  dataKey="count"
                  nameKey="role_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={2}
                  label={({ name, percent }) => 
                    percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                  }
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: string) => [value, name]}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => {
                    const item = roleDistribution.find(r => r.role_name === value);
                    return `${value} (${item?.count || 0})`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">
              <p>No role distribution data available</p>
            </div>
          )}
        </ChartCard>

        {/* Top Depots by Headcount */}
        <ChartCard title="Top Depots by Employee Count" span={2}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Depot</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Employees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {headcountByDepot.slice(0, 10).map((depot, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 font-medium">#{index + 1}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{depot.depot}</td>
                    <td className="px-4 py-3 text-gray-600">{depot.region}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {depot.total_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {/* Regional Breakdown Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <HiUsers className="mr-2 h-5 w-5 text-blue-600" />
          Detailed Regional Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Managers</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Engineers</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Op. Managers</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Drivers</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conductors</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {headcountByRegion.map((region, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-medium">{region.region}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{region.managers}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{region.engineers}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{region.op_managers}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{region.drivers}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{region.conductors}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      {region.total_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// KPI Card Component
const KPICard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  subtitle?: string;
}> = ({ icon, label, value, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex items-center">
        <div className={`text-3xl ${colorClasses[color]} p-3 rounded-lg mr-4`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

// Chart Card Component
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

export default WorkforceAnalyticsPage; 