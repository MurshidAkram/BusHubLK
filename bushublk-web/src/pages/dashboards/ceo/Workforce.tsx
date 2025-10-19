import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import {
  HiUsers,
  HiBriefcase,
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
} from 'recharts';
import { AppContext } from '../../../context/AppContext'; // Assuming you store token here

const WorkforceAnalyticsPage: React.FC = () => {
  const { token } = useContext(AppContext) || {};
  const [summary, setSummary] = useState<any>({});
  const [headcountByRegion, setHeadcountByRegion] = useState<any[]>([]);
  const [headcountByDepot, setHeadcountByDepot] = useState<any[]>([]);
  const [newEmployees, setNewEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkforceData = async () => {
      try {
        setLoading(true);
        setError(null);

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        };

        const [summaryRes, regionRes, depotRes, newRes] = await Promise.all([
          axios.get('/api/workforce/summary', config),
          axios.get('/api/workforce/headcount/region', config),
          axios.get('/api/workforce/headcount/depot', config),
          axios.get('/api/workforce/new-employees', config),
        ]);

        if (summaryRes.data.success) setSummary(summaryRes.data.data || {});
        if (regionRes.data.success) setHeadcountByRegion(regionRes.data.data || []);
        if (depotRes.data.success) setHeadcountByDepot(depotRes.data.data || []);
        if (newRes.data.success) setNewEmployees(newRes.data.data || []);
      } catch (err: any) {
        console.error('Error loading workforce analytics:', err);
        setError('Failed to load workforce analytics data.');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchWorkforceData();
  }, [token]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading workforce analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600 bg-red-50 border border-red-200 p-4 rounded">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Workforce Analytics</h2>
        <div className="flex items-center space-x-4 text-gray-600">
          <HiBriefcase className="h-6 w-6" />
          <span>Comprehensive employee insights</span>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPI
          label="Total Employees"
          value={summary.total_employees}
          color="text-purple-600"
        />
        <KPI
          label="Depot Managers"
          value={summary.depot_managers}
          color="text-green-600"
        />
        <KPI
          label="Operational Managers"
          value={summary.operational_managers}
          color="text-orange-400"
        />
        <KPI
          label="Depot Engineers"
          value={summary.depot_engineers}
          color="text-yellow-600"
        />
        <KPI
          label="Drivers & Conductors"
          value={summary.drivers_conductors}
          color="text-red-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Headcount by Region */}
        <ChartCard title="Headcount by Region" span>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={headcountByRegion}>
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* New Employees */}
        <ChartCard title="New Employees">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={newEmployees}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#a11ccaff"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Headcount by Depot */}
        <ChartCard title="Headcount by Depot" span>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={headcountByDepot}>
              <XAxis dataKey="depot" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

const KPI = ({ label, value, color }: { label: string; value: any; color: string }) => (
  <div className="bg-white rounded-xl shadow p-6 flex items-center">
    <HiUsers className={`h-8 w-8 ${color} mr-4`} />
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value ?? '-'}</p>
    </div>
  </div>
);

const ChartCard = ({
  title,
  children,
  span,
}: {
  title: string;
  children: React.ReactNode;
  span?: boolean;
}) => (
  <div className={`bg-white rounded-xl shadow p-6 ${span ? 'xl:col-span-2' : ''}`}>
    <h3 className="text-lg font-medium mb-4">{title}</h3>
    <div className="h-48">{children}</div>
  </div>
);

export default WorkforceAnalyticsPage;
