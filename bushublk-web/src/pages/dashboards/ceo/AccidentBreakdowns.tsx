import React, { useEffect, useState } from "react";
import {
  HiShieldCheck,
  HiExclamationCircle,
  HiRefresh,
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
} from "recharts";
import axios from "axios";

// ---------------------------
// TypeScript Interfaces
// ---------------------------
interface IncidentSummary {
  total_incidents: number;
  breakdowns: number;
  accidents: number;
}

interface IncidentTrend {
  month: string;
  incidents: number;
}

interface RegionIncident {
  region: string;
  count: number;
}

interface RecentIncident {
  id: number;
  date: string;
  number: string;
  depot: string;
  type: string;
  status: string;
}

// ---------------------------
// Component
// ---------------------------
export default function AccidentBreakdownPage() {
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [trend, setTrend] = useState<IncidentTrend[]>([]);
  const [byRegion, setByRegion] = useState<RegionIncident[]>([]);
  const [recent, setRecent] = useState<RecentIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/ceo/incidents", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const data = res.data.data;
        setSummary(data.summary);
        setTrend(data.trend);
        setByRegion(data.byRegion);
        setRecent(data.recent);
      } else {
        setError("Failed to load incidents data");
      }
    } catch (err: any) {
      console.error("Error fetching incident data:", err);
      setError("Error fetching incident data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  // ---------------------------
  // Render
  // ---------------------------
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500 flex flex-col items-center space-y-3">
        <HiRefresh className="animate-spin h-8 w-8 text-gray-400" />
        <p>Loading Accident & Breakdown data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>{error}</p>
        <button
          className="mt-3 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
          onClick={fetchIncidents}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">
          Accidents &amp; Breakdowns
        </h2>
        <div className="flex items-center space-x-4 text-gray-600">
          <HiShieldCheck className="h-6 w-6" />
          <p>Overview of safety incidents across all depots</p>
        </div>
      </div>

      {/* KPI Summary */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
          <KpiCard label="Total Incidents" value={summary.total_incidents} color="text-gray-800" />
          <KpiCard label="Breakdowns" value={summary.breakdowns} color="text-yellow-700" />
          <KpiCard label="Accidents" value={summary.accidents} color="text-red-700" />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Trend */}
        <ChartCard title="Incident Trend (Last 6 Months)">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="incidents"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* By Region */}
        <ChartCard title="Incidents by Region">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byRegion}>
              <XAxis dataKey="region" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(v) => `${v} incidents`} />
              <Bar dataKey="count" fill="#F87171" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Incidents Table */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-medium mb-4 text-gray-800">
          Recent Incident Log
        </h3>
        <div className="overflow-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-600">
                  Date
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-600">
                  Depot
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-600">
                  Vehicle No
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-600">
                  Type
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recent.length > 0 ? (
                recent.map((inc, i) => (
                  <tr
                    key={inc.id}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-2">
                      {new Date(inc.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{inc.depot || "—"}</td>
                    <td className="px-4 py-2">{inc.number || "—"}</td>
                    <td className="px-4 py-2">{inc.type || "—"}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={inc.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center text-gray-500 py-4 italic"
                  >
                    No recent incidents found.
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

// ---------------------------
// Subcomponents
// ---------------------------

const KpiCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div className="bg-white rounded-xl shadow p-6 flex items-center">
    <HiExclamationCircle className="h-8 w-8 text-red-600 mr-4" />
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="bg-white rounded-xl shadow p-6">
    <h3 className="text-lg font-medium mb-4 text-gray-800">{title}</h3>
    <div className="h-48">{children}</div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  let style = "bg-gray-100 text-gray-700";
  if (status?.toLowerCase() === "resolved")
    style = "bg-green-100 text-green-700";
  else if (status?.toLowerCase().includes("investigation"))
    style = "bg-yellow-100 text-yellow-700";
  else if (status?.toLowerCase() === "pending")
    style = "bg-red-100 text-red-700";

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${style}`}
    >
      {status || "Pending"}
    </span>
  );
};
